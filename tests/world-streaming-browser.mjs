/** Browser runtime acceptance for repeated camera traversal and distant/detail handoff. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { devApp, chromiumArgs, continueInBrowser } from './browser-harness.mjs';
import { verifyReleaseManifest } from '../scripts/release-integrity.mjs';

verifyReleaseManifest();
const out = process.env.WORLD_RENDERING_OUTPUT ?? 'test-results/world-streaming';
const port = Number(process.env.WORLD_RENDERING_PORT ?? 4292);
const timeout = Number(process.env.WORLD_RENDERING_TIMEOUT_MS ?? 180000);
assert(Number.isInteger(port) && port > 0 && port < 65536);
assert(Number.isInteger(timeout) && timeout >= 30000 && timeout <= 300000);
await mkdir(out, { recursive: true });
const server = await devApp(port);
let browser, page;
const checks = [], errors = [], profileRows = [], traversalRows = [];
const passed = name => { checks.push(name); console.log('PASS', name); };

async function waitForSettled(label) {
  await page.waitForFunction(() => {
    const g = window.__game, q = g?.view?.meshQueueStats, d = g?.view?.distant;
    return !!g?.active && !g.opening && g.world.pending.size === 0 &&
      g.world.workerQueue.length === 0 && !g.world.workerBusy &&
      g.world.dirty.size === 0 && q?.visibleWorldReady === true &&
      d?.stats.terrainReady === true && d?.stats.anchorsReady === true &&
      d?.stats.ready === true;
  }, null, { timeout });
  const snapshot = await page.evaluate(() => {
    const g = window.__game, d = g.view.distant, plan = d.plan;
    const coverage = d.coverage;
    let coveredSections = 0, missingDetailedCoverage = 0;
    for (let i = 0; i < coverage.length; i++) if (coverage[i] !== 0) coveredSections++;
    for (const key of g.view.meshed) {
      const [cx, sy, cz] = key.split(',').map(Number);
      const x = cx - plan.originX / 16, z = cz - plan.originZ / 16;
      if (x < 0 || z < 0 || x >= 128 || z >= 128 || sy < -4 || sy > 19) continue;
      const index = x + (z + (sy + 4) * 128) * 128;
      if (coverage[index] !== 255) missingDetailedCoverage++;
    }
    const report = g.performanceReport();
    return {
      position: { ...g.body.position },
      chunks: g.world.chunks.size,
      pending: g.world.pending.size,
      workerQueued: g.world.workerQueue.length,
      workerBusy: !!g.world.workerBusy,
      queueTimestampCount: g.world.workerQueueTimes.size,
      dirty: g.world.dirty.size,
      meshedSections: g.view.meshed.size,
      renderedSections: g.view.sections.size,
      visibleReady: g.view.meshQueueStats.visibleWorldReady,
      distant: { ...d.stats },
      coveredSections,
      missingDetailedCoverage,
      streaming: { ...g.world.streamingDiagnostics },
      resources: {
        geometries: g.view.renderer.info.memory.geometries,
        textures: g.view.renderer.info.memory.textures,
        frame: report.metrics.frame,
        render: report.resources.render,
      },
      graphics: {
        quality: g.settings.graphicsQuality,
        profile: g.view.graphicsProfile.quality,
        canvasWidth: g.view.canvas.width,
        canvasHeight: g.view.canvas.height,
        cssWidth: g.view.canvas.clientWidth,
        cssHeight: g.view.canvas.clientHeight,
      },

      seed: g.meta.seed,
    };
  });
  assert.equal(snapshot.pending, 0, `${label}: chunk generation still pending`);
  assert.equal(snapshot.workerQueued, 0, `${label}: worker queue did not drain`);
  assert.equal(snapshot.workerBusy, false, `${label}: worker still active`);
  assert.equal(snapshot.queueTimestampCount, 0, `${label}: queued timestamp metadata leaked`);
  assert.equal(snapshot.dirty, 0, `${label}: dirty chunk mesh queue did not drain`);
  assert.equal(snapshot.visibleReady, true, `${label}: visible detailed meshes are not ready`);
  assert(snapshot.distant.terrainTriangles > 0, `${label}: distant terrain geometry missing`);
  assert(snapshot.distant.waterTriangles > 0, `${label}: water geometry missing at harbour scene`);
  assert(snapshot.coveredSections > 0, `${label}: distant coverage bitmap is empty`);
  assert.equal(snapshot.missingDetailedCoverage, 0, `${label}: detailed meshes missing from proxy coverage mask`);
  assert(snapshot.chunks <= 160, `${label}: loaded chunk residency exceeded expected bound (${snapshot.chunks})`);
  return snapshot;
}

async function checkEvictionHandoff(label, requireEvidence = false) {
  const result = await page.evaluate(() => {
    const g = window.__game, d = g.view.distant, plan = d.plan, coverage = d.coverage;
    const evicted = [...new Set(window.__streamingEvicted ?? [])];
    let staleEvictedColumns = 0, checkedEvictedColumns = 0;
    for (const key of evicted) {
      if (g.world.chunks.has(key)) continue; // A later traversal may have reloaded it.
      const [cx, cz] = key.split(',').map(Number);
      const x = cx - plan.originX / 16, z = cz - plan.originZ / 16;
      if (x < 0 || z < 0 || x >= 128 || z >= 128) continue;
      checkedEvictedColumns++;
      for (let sy = -4; sy <= 19; sy++) {
        const index = x + (z + (sy + 4) * 128) * 128;
        if (coverage[index] !== 0) { staleEvictedColumns++; break; }
      }
    }
    return { evictedUnique: evicted.length, checkedEvictedColumns, staleEvictedColumns };
  });
  if (requireEvidence) {
    assert(result.evictedUnique > 0, `${label}: route did not evict any chunks`);
    assert(result.checkedEvictedColumns > 0, `${label}: no unloaded evicted columns were available for coverage verification`);
  }
  assert.equal(result.staleEvictedColumns, 0, `${label}: evicted columns retained detailed proxy-coverage marks`);
  return result;
}

try {
  const launch = { headless: true, args: chromiumArgs };
  if (process.env.CHROMIUM_EXECUTABLE_PATH) launch.executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
  browser = await chromium.launch(launch);
  page = await browser.newPage({ viewport: { width: 960, height: 640 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(timeout);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /WebGL|Shader Error|CONTEXT_LOST|THREE\.WebGL/i.test(message.text()))
      errors.push(message.text());
  });
  await page.addInitScript(() => localStorage.setItem('jade-harbor-settings', JSON.stringify({
    graphicsQuality: 'high', distance: 3, simulationDistance: 2,
    adaptiveResolution: false, frameRateLimit: 30, touchControls: 'off',
  })));
  await page.goto(server.url);
  await page.waitForFunction(() => !!window.__game || !!document.querySelector('.fatal-error'));
  const fatal = await page.locator('.fatal-error').count();
  if (fatal) throw new Error('Browser cannot start WebGL2: ' + await page.locator('.fatal-error').innerText());
  await continueInBrowser(page);

  await page.evaluate(async () => {
    const g = window.__game;
    const { freshWorld } = await import('/src/persistence/saves.ts');
    await g.start(freshWorld('World streaming acceptance', 'jade-harbor', 'creative'));
    g.pause();
    g.settings.distance = 3;
    g.settings.simulationDistance = 2;
    g.settings.adaptiveResolution = false;
    g.settings.frameRateLimit = 30;
    g.settings.graphicsQuality = 'high';
    g.applySettings();
    const position = { x: 120.5, y: 45, z: 340.5 };
    const focus = { x: 170, y: 24, z: 340 };
    g.body.position = { ...position };
    g.previous = { ...position };
    g.body.velocity = { x: 0, y: 0, z: 0 };
    g.body.flying = true;
    g.yaw = Math.atan2(-(focus.x - position.x), -(focus.z - position.z));
    g.pitch = Math.atan2(focus.y - (position.y + 1.61), Math.hypot(focus.x - position.x, focus.z - position.z));
    g.time = 0.375;
    g.simulation.weather = 'rain';
    g.simulation.weatherTimer = 900;
    g.view.camera.position.set(position.x, position.y + 1.61, position.z);
    g.view.camera.rotation.set(g.pitch, g.yaw, 0, 'YXZ');
    window.__streamingEvicted = [];
    const stream = g.world.stream.bind(g.world);
    g.world.stream = (...args) => {
      const removed = stream(...args);
      if (removed.length) window.__streamingEvicted.push(...removed);
      return removed;
    };
    g.ui.show('none');
    g.resume(false);
  });
  await page.locator('canvas#game').click();
  await page.waitForFunction(() => document.pointerLockElement === document.querySelector('canvas#game'));
  await waitForSettled('initial harbour scene');
  passed('real WebGL2 browser startup and settled harbour scene');

  const profileIdentity = await page.evaluate(() => ({
    seed: window.__game.meta.seed,

    worldId: window.__game.meta.id,
  }));
  for (const quality of ['low', 'medium', 'high']) {
    await page.evaluate(quality => {
      const g = window.__game;
      g.settings.graphicsQuality = quality;
      g.applySettings();
    }, quality);
    await waitForSettled(`graphics ${quality}`);
    const snapshot = await page.evaluate(() => {
      const g = window.__game;
      return {
        quality: g.settings.graphicsQuality,
        profile: g.view.graphicsProfile.quality,
        distantQuality: g.view.distant.stats.quality,
        terrainReady: g.view.distant.stats.terrainReady,
        anchorsReady: g.view.distant.stats.anchorsReady,
        terrainTriangles: g.view.distant.stats.terrainTriangles,
        waterTriangles: g.view.distant.stats.waterTriangles,
        widthRatio: g.view.canvas.width / Math.max(1, g.view.canvas.clientWidth),
        heightRatio: g.view.canvas.height / Math.max(1, g.view.canvas.clientHeight),
        position: { ...g.body.position },

        seed: g.meta.seed,
      };
    });
    assert.equal(snapshot.quality, quality);
    assert.equal(snapshot.profile, quality);
    assert.equal(snapshot.distantQuality, quality);
    assert.equal(snapshot.terrainReady, true);
    assert.equal(snapshot.anchorsReady, true);
    assert.equal(snapshot.seed, profileIdentity.seed, 'graphics profile changed world seed');
    const expectedScale = { low: 0.7, medium: 0.88, high: 1 }[quality];
    assert(Math.abs(snapshot.widthRatio - expectedScale) < 0.06, `${quality}: unexpected drawing-buffer scale ${snapshot.widthRatio}`);
    assert(Math.abs(snapshot.heightRatio - expectedScale) < 0.06, `${quality}: unexpected drawing-buffer scale ${snapshot.heightRatio}`);
    const file = `${out}/harbour-${quality}.png`;
    await page.locator('canvas#game').screenshot({ path: file });
    profileRows.push({ ...snapshot, screenshot: file });
    passed(`${quality} graphics profile rebuild preserves world identity and publishes terrain/water/anchors`);
  }
  assert.deepEqual(await page.evaluate(() => ({ seed: window.__game.meta.seed, worldId: window.__game.meta.id })), profileIdentity);
  passed('Low / Medium / High profile transitions preserve the same world identity');

  const route = [
    { name: 'north', yaw: 0 },
    { name: 'east', yaw: -Math.PI / 2 },
    { name: 'south', yaw: Math.PI },
    { name: 'west', yaw: Math.PI / 2 },
  ];
  for (const leg of route) {
    await page.evaluate(yaw => {
      const g = window.__game;
      g.yaw = yaw;
      g.pitch = 0;
      g.view.camera.rotation.set(0, yaw, 0, 'YXZ');
      g.body.velocity = { x: 0, y: 0, z: 0 };
    }, leg.yaw);
    const before = await page.evaluate(() => ({ ...window.__game.body.position }));
    await page.keyboard.down('KeyW');
    await page.keyboard.down('ShiftLeft');
    await page.waitForTimeout(2500);
    await page.keyboard.up('KeyW');
    await page.keyboard.up('ShiftLeft');
    const after = await page.evaluate(() => ({ ...window.__game.body.position }));
    const distance = Math.hypot(after.x - before.x, after.z - before.z);
    assert(distance > 15, `${leg.name}: native keyboard flight moved only ${distance.toFixed(1)} units`);
    await waitForSettled(`${leg.name} traversal`);
    const state = await page.evaluate(() => {
      const g = window.__game;
      return {
        position: { ...g.body.position },
        chunks: g.world.chunks.size,
        pending: g.world.pending.size,
        workerQueued: g.world.workerQueue.length,
        workerBusy: !!g.world.workerBusy,
        queueTimestampCount: g.world.workerQueueTimes.size,
        dirty: g.world.dirty.size,
        streaming: { ...g.world.streamingDiagnostics },
      };
    });
    assert(state.chunks <= 160, `${leg.name}: chunk residency exceeded bound`);
    assert(state.pending <= 8, `${leg.name}: pending request cap exceeded`);
    assert(state.workerQueued <= 8, `${leg.name}: worker queue cap exceeded`);
    assert.equal(state.queueTimestampCount, state.workerQueued, `${leg.name}: queued timestamp bookkeeping mismatch`);
    traversalRows.push({ ...leg, before, after, distance, ...state });
    const handoff = await checkEvictionHandoff(`${leg.name} traversal`);
    traversalRows[traversalRows.length - 1].handoff = handoff;
    passed(`${leg.name} native camera traversal streams/evicts chunks and hands proxy coverage back without stale marks`);
  }

  const final = await waitForSettled('final traversal state');
  const finalHandoff = await checkEvictionHandoff('final traversal', true);
  assert(final.streaming.streamEvictions > 0, 'route did not exercise chunk eviction');
  assert(final.streaming.workerQueueWaitSamples > 0, 'route did not exercise worker queue wait accounting');
  assert.deepEqual(errors, [], 'browser reported page or WebGL errors');
  verifyReleaseManifest();
  await writeFile(`${out}/results.json`, JSON.stringify({
    status: 'passed', kind: 'software-browser-world-rendering-acceptance',
    browser: browser.version(), viewport: { width: 960, height: 640 },
    profileIdentity, profileRows, traversalRows, final, finalHandoff, checks, errors,
    notes: 'Chromium WebGL2 with SwiftShader/software rendering. Screenshots are visual-review artifacts, not automated pixel-perfect seam certification. Native keyboard flight exercises real camera/world streaming. This is not physical-device FPS, thermal, or GPU-performance certification.',
  }, null, 2));
  console.log('WORLD STREAMING BROWSER PASSED', checks.length);
} catch (error) {
  await page?.screenshot({ path: `${out}/failure.png`, fullPage: true }).catch(() => {});
  await writeFile(`${out}/failure.json`, JSON.stringify({
    error: String(error), checks, profileRows, traversalRows, errors,
  }, null, 2));
  throw error;
} finally {
  await browser?.close();
  await server.close();
}
