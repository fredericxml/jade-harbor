// Matched-scene browser check for the renderer-only High / Medium / Low
// shader paths. GPU timing is asynchronous and optional; no gl.finish() is used.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { verifyReleaseManifest } from '../scripts/release-integrity.mjs';

verifyReleaseManifest();
const source = createHash('sha256')
  .update(JSON.stringify(JSON.parse(await readFile('dist/release-integrity.json', 'utf8')).source))
  .digest('hex');
const output = process.env.ATMOSPHERE_PROFILE_OUTPUT ?? 'test-results/atmosphere-material-profile';
const records = [], errors = [];
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4193', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
let browser, page;
const percentile = (values, p) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
};
try {
  await mkdir(output, { recursive: true });
  await new Promise((resolve, reject) => {
    server.stdout.on('data', data => { if (data.toString().includes('Local:')) resolve(); });
    server.on('exit', code => reject(Error(`Vite exited with ${code}`)));
  });
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  page = await browser.newPage({ viewport: { width: 960, height: 600 } });
  page.setDefaultTimeout(180000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => localStorage.setItem('jade-harbor-settings', JSON.stringify({ distance: 3, simulationDistance: 4 })));
  await page.goto('http://127.0.0.1:4193');
  await page.locator('[data-action="new"]').click();
  await page.locator('[data-action="create"]').click();
  await page.waitForFunction(() => window.__game?.active);
  await page.evaluate(() => {
    const game = window.__game;
    game.pause();
    game.frame = () => {};
    const player = { x: 132.5, y: 21.002, z: -100.5 };
    game.body.position = { ...player };
    game.previous = { ...player };
    game.view.camera.position.set(player.x, player.y + 1.61, player.z);
    game.view.camera.rotation.set(-.035, -Math.PI / 2, 0, 'YXZ');
    for (const key of game.world.stream(player.x, player.z, 3)) game.view.remove(key);
    for (let z = -3; z <= 3; z++) for (let x = -3; x <= 3; x++)
      if (x * x + z * z <= 12.25) game.world.ensure(Math.floor(player.x / 16) + x, Math.floor(player.z / 16) + z, true);
    game.lighting.rebuild();
    for (let i = 0; i < 512 && game.world.dirty.size; i++) game.view.rebuild(game.world, 6);
    game.entities.life.reactivate();
    game.entities.life.prepare(game.entities.list, player, .25, false, game.entities.elapsed, game.entities.navigation);
    game.entityView.update(game.entities, game.entities.elapsed, game.view.camera, game.view.graphicsProfile);
    game.view.hand.visible = false;
    game.ui.overlay.style.display = 'none';
    for (let i = 0; i < 512 && game.view.distant && !game.view.distant.stats.ready; i++) game.view.updateDistant(game.world);
    game.view.setGpuTimingEnabled(true);
  });

  for (const hour of [12, 23]) {
    for (const quality of ['low', 'medium', 'high', 'low', 'high', 'medium']) {
      const result = await page.evaluate(async ({ hour, quality }) => {
        const game = window.__game, view = game.view;
        const simulationBefore = {
          entityCount: game.entities.list.length,
          chunkCount: game.world.chunks.size,
          editCount: game.world.edits.size,
          navRevision: game.world.navRevision,
          player: { ...game.body.position },
        };
        const versionsBefore = [...view.materials.map(material => material.version), view.sky.material.version, ...(view.distant ? [view.distant.material.version] : [])];
        game.settings.graphicsQuality = quality;
        game.applySettings();
        view.setGpuTimingEnabled(true);
        const time = (hour - 6) / 24;
        view.atmosphere.reset(time, false, 3);
        view.environment(time, false);
        for (let i = 0; i < 1024 && view.distant && !view.distant.stats.ready; i++) view.updateDistant(game.world);
        const qualityLevel = quality === 'high' ? 2 : quality === 'medium' ? 1 : 0;
        const levels = {
          terrain: view.materials.map(material => material.uniforms.qualityLevel?.value ?? null),
          sky: view.sky.material.uniforms.qualityLevel?.value ?? null,
          distant: view.distant?.material.uniforms.qualityLevel?.value ?? null,
        };
        const gpuSamples = [];
        for (let frame = 0; frame < 96; frame++) {
          view.render();
          const sample = view.consumeGpuTiming();
          if (sample && Number.isFinite(sample.timeMs)) gpuSamples.push(sample.timeMs);
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        view.render();
        const versionsAfter = [...view.materials.map(material => material.version), view.sky.material.version, ...(view.distant ? [view.distant.material.version] : [])];
        const simulationAfter = {
          entityCount: game.entities.list.length,
          chunkCount: game.world.chunks.size,
          editCount: game.world.edits.size,
          navRevision: game.world.navRevision,
          player: { ...game.body.position },
        };
        return {
          quality, hour, qualityLevel, levels,
          materialVersionsStable: JSON.stringify(versionsBefore) === JSON.stringify(versionsAfter),
          simulationStable: JSON.stringify(simulationBefore) === JSON.stringify(simulationAfter),
          gpuSamples,
          gpuMedianMs: gpuSamples.length ? [...gpuSamples].sort((a, b) => a - b)[Math.floor((gpuSamples.length - 1) / 2)] : null,
          gpuP95Ms: gpuSamples.length ? [...gpuSamples].sort((a, b) => a - b)[Math.floor((gpuSamples.length - 1) * .95)] : null,
          gpuTimingAvailable: view.capabilities.timerQuery,
          programs: view.renderer.info.programs?.length ?? null,
          render: { ...view.worldRenderStats },
          png: view.canvas.toDataURL('image/png'),
        };
      }, { hour, quality });
      const png = result.png;
      delete result.png;
      assert.equal(result.materialVersionsStable, true, `${quality} ${hour}: shader material version changed during profile switch`);
      assert.equal(result.simulationStable, true, `${quality} ${hour}: authoritative simulation changed during profile switch`);
      assert.deepEqual(result.levels.terrain, [result.qualityLevel, result.qualityLevel, result.qualityLevel]);
      assert.equal(result.levels.sky, result.qualityLevel);
      if (result.levels.distant !== null) assert.equal(result.levels.distant, result.qualityLevel);
      if (quality === 'low' || quality === 'medium' || quality === 'high') {
        if (records.every(record => record.hour !== hour || record.quality !== quality))
          await writeFile(`${output}/${hour}-${quality}.png`, Buffer.from(png.split(',')[1], 'base64'));
      }
      records.push(result);
      console.log(`PROFILE ${hour} ${quality}: ${result.gpuSamples.length} async GPU samples`);
    }
  }
  assert.deepEqual(errors, []);
  const summary = [12, 23].map(hour => ['low', 'medium', 'high'].map(quality => {
    const rows = records.filter(record => record.hour === hour && record.quality === quality);
    const gpu = rows.flatMap(row => row.gpuSamples);
    return { hour, quality, gpuSamples: gpu.length, gpuMedianMs: percentile(gpu, .5), gpuP95Ms: percentile(gpu, .95), programs: rows.at(-1)?.programs ?? null };
  }));
  verifyReleaseManifest();
  await writeFile(`${output}/results.json`, JSON.stringify({
    status: 'profile-switch-and-render-smoke-tested', source, summary, records, errors,
    note: 'Matched paused scene and camera; repeated Low/Medium/High switches; asserts authoritative entity/chunk/edit/navigation/player snapshots remain unchanged and material versions do not change. GPU samples use non-blocking EXT_disjoint_timer_query_webgl2 when available. If unavailable, GPU timing is null; no CPU wall-time is presented as GPU time. SwiftShader results are software-renderer diagnostics, not physical GPU performance guarantees.',
  }, null, 2));
  console.log(JSON.stringify(summary));
} catch (error) {
  await writeFile(`${output}/failure.json`, JSON.stringify({ source, error: String(error), records, errors }, null, 2));
  throw error;
} finally {
  await browser?.close();
  server.kill();
}
