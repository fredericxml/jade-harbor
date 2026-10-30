import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4179", "--strictPort"], { stdio: ["ignore", "pipe", "pipe"] });
const output = process.env.CITY_OUTPUT ?? "test-results/metropolis", errors = [], views = [], checks = [];
let browser, page;
try {
  await new Promise((resolve, reject) => { server.stdout.on("data", b => { if (b.toString().includes("Local:")) resolve(); }); server.on("error", reject); server.on("exit", code => reject(new Error(`server ${code}`))); });
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"] });
  page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(90000);
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", message => { if (message.text().startsWith("QA_READY")) console.log(message.text()); });
  await page.addInitScript(() => localStorage.setItem("jade-harbor-settings", JSON.stringify({ distance: 3 })));
  await mkdir(output, { recursive: true });
  await page.goto("http://127.0.0.1:4179");
  await page.locator('[data-action="new"]').click();
  await page.locator("#world-name").fill("District architecture QA");
  await page.locator('[data-action="create"]').click();
  await page.waitForFunction(() => window.__game?.active);
  assert.equal(await page.evaluate(() => window.__game.snapshot().generator), 8);
  await page.evaluate(async () => { const { freshWorld } = await import("/src/persistence/saves.ts"); const fixture=freshWorld("Frozen v5 architecture QA", "jade-harbor", "creative"); fixture.generator=5; await window.__game.start(fixture); });
  assert(await page.evaluate(async () => await window.__game.save()), "initial Game save must create a checkpoint");
  checks.push("real UI creates v8; explicit v5 fixture preserves the frozen metropolis");
  await page.addStyleTag({ content: "#hud, #toast { display: none !important; }" });
  const locations = [
    ["heritage", [0, 42, 8], [0, 30, -48], 5],
    ["market", [-183, 45, -130], [-190, 28, -192], 5],
    ["hutong", [-174, 48, 27], [-174, 23, -32], 5],
    ["water-town", [143, 38, -108], [145, 23, -172], 5],
    ["imperial", [158, 54, -216], [158, 24, -276], 6],
    ["harbor", [151, 42, 376], [156, 26, 327], 6],
    ["artisan", [-161, 45, 188], [-155, 23, 146], 5],
    ["scholar", [169, 48, 204], [149, 22, 252], 5],
    ["nightlife", [0, 48, 244], [40, 30, 190], 5],
    ["highland", [-245, 63, -375], [-273, 36, -432], 6],
    ["transition-market-hutong", [-170, 43, -80], [-176, 24, -10], 6],
    ["transition-water-garden", [192, 50, 94], [222, 23, 149], 6],
    ["skyline", [9, 67, 155], [28, 33, 235], 7],
    ["night-readiness", [0, 27, 183], [45, 30, 164], 5],
    ["heritage-frame", [0, 34, -4], [0, 31, -48], 6],
    ["imperial-court", [48, 50, -216], [48, 24, -276], 6],
    ["artisan-workyard", [-270, 46, 128], [-282, 28, 155], 5],
    ["market-street", [-161, 28, -139], [-174, 28, -170], 5],
    ["transition-core-market", [-87, 40, -170], [-130, 26, -185], 5],
    ["transition-core-imperial", [0, 50, -195], [20, 25, -270], 6],
    ["transition-water-harbor", [312, 48, 277], [280, 23, 340], 6],
    ["transition-urban-highland", [-244, 49, -314], [-270, 30, -370], 6],
    ["transition-rural", [334, 42, 104], [360, 22, 148], 5],
    ["transition-archaeology", [-435, 42, 190], [-400, 24, 150], 5],
    ["skyline-river", [380, 55, 244], [300, 28, 240], 6],
    ["skyline-gate", [0, 52, 330], [20, 30, 270], 6],
  ];
  for (const [name, position, target, distance] of locations.filter(v => !process.env.CITY_VIEWS || process.env.CITY_VIEWS.split(",").includes(v[0]))) {
    console.log("VISIT", name);
    await page.evaluate(({ position, target, distance, name }) => {
      const g = window.__game;
      g.input.onLook = undefined; g.input.keys.clear(); g.mode = "spectator"; g.body.flying = true;
      if (name === "market-street") {
        // Locate a real shop entrance; an arbitrary low camera can land inside
        // a seed-selected roof and cannot substantiate the storefront review.
        const lot = g.world.metropolisPlan.lots.find(l => l.districtId === "market" && l.archetype === "shophouse" && l.floors >= 2 && l.facing === 0);
        if (!lot) throw Error("missing market storefront fixture");
        const x = (lot.x1 + lot.x2) / 2;
        position.splice(0, 3, x, lot.baseY + 3, lot.z1 - 16);
        target.splice(0, 3, x, lot.baseY + 7, lot.z1);
      }
      if (name === "deep-mine") { const top = g.world.inspectTerrain(360, 0).height; position[1] = top - 56 + 1.05; target[1] = top - 63 + 2; }
      g.body.position = { x: position[0], y: position[1], z: position[2] }; g.previous = { ...g.body.position }; g.body.velocity = { x: 0, y: 0, z: 0 };
      g.settings.distance = distance; g.applySettings(); g.time = name === "night-readiness" ? .78 : .24; g.simulation.weather = "clear"; g.simulation.weatherTimer = 180;
      const dx = target[0] - position[0], dy = target[1] - position[1] - 1.62, dz = target[2] - position[2];
      g.yaw = Math.atan2(-dx, -dz); g.pitch = Math.atan2(dy, Math.hypot(dx, dz)); g.view.hand.visible = false; g.ui.show("none");
    }, { position, target, distance, name });
    const sample = await page.waitForFunction(() => {
      const g = window.__game, cx = Math.floor(g.body.position.x / 16), cz = Math.floor(g.body.position.z / 16), r = g.settings.distance;
      const now = performance.now();
      if (!window.__qaLast || now - window.__qaLast > 30000) {
        window.__qaLast = now;
        console.log("QA_READY", JSON.stringify({ chunks: g.world.chunks.size, generation: g.world.pending.size, mesh: g.world.dirty.size,
          lighting: g.lighting.pending, center: g.view.groups.has(`${cx},${cz}`), position: g.body.position }));
      }
      for (let z = -r; z <= r; z++) for (let x = -r; x <= r; x++) if (x * x + z * z <= (r + .5) ** 2 && !g.world.chunks.has(`${cx + x},${cz + z}`)) return false;
      // Distant low columns can legitimately have no geometry in a high camera's
      // vertical band. The center must render; all requested mesh work must drain.
      if (!g.view.groups.has(`${cx},${cz}`) || g.world.pending.size || g.world.dirty.size || g.lighting.pending) return false;
      // Sample queues and rendering in the SAME settled frame. A later screenshot
      // can overlap the game's normal periodic relighting; that is not a leak.
      return { position: { ...g.body.position }, generator: g.world.generatorVersion,
        terrain: g.world.inspectTerrain(g.body.position.x, g.body.position.z), fps: g.fps, chunks: g.world.chunks.size,
        generationQueue: g.world.pending.size, meshQueue: g.world.dirty.size, triangles: g.view.renderer.info.render.triangles,
        drawCalls: g.view.renderer.info.render.calls, metrics: g.view.metrics.snapshot(), blockBytes: [...g.world.chunks.values()].reduce((n, c) => n + c.blocks.byteLength, 0) };
    }, null, { timeout: 240000 });
    const stats = await sample.jsonValue(); await sample.dispose();
    await page.screenshot({ path: `${output}/${name}.png` });
    assert(stats.chunks < 300); assert.equal(stats.generationQueue, 0); assert.equal(stats.meshQueue, 0);
    views.push({ name, distance, ...stats }); console.log("CAPTURE", name, JSON.stringify({ fps: stats.fps, chunks: stats.chunks, triangles: stats.triangles }));
    await writeFile(`${output}/progress.json`, JSON.stringify({ status: "in progress", views, errors }, null, 2));
  }
  checks.push(`streamed ${views.length} selected views with actual worker; queues drained at each recorded sample`);
  const saved = await page.evaluate(async () => {
    const g = window.__game, edits = g.world.metropolisPlan.districts.map((d,i)=>[d.bounds.x1, 60+i, d.bounds.z1, 9+i%5]);
    g.settings.distance = 3; g.applySettings();
    for (const [x, y, z, value] of edits) { g.world.ensure(Math.floor(x / 16), Math.floor(z / 16)); g.world.set(x, y, z, value); }
    const id = g.meta.id; if (!(await g.save())) throw Error("save failed"); return { id, edits };
  });
  await page.reload(); await page.locator(`[data-action="load"][data-id="${saved.id}"]`).click(); await page.waitForFunction(() => window.__game.active);
  assert(await page.evaluate(({ edits }) => { const g = window.__game; if (g.world.generatorVersion !== 5 || g.snapshot().generator !== 5) return false;
    return edits.every(([x, y, z, value]) => { g.world.ensure(Math.floor(x / 16), Math.floor(z / 16), true); return g.world.get(x, y, z) === value; }); }, saved));
  checks.push("v5 edits made during pending generation survive real IndexedDB save and browser reload");
  for (const version of [3, 4]) {
    const legacyId = await page.evaluate(async version => {
      const g = window.__game, { freshWorld } = await import("/src/persistence/saves.ts");
      const old = freshWorld(`Legacy v${version} QA`, "jade-harbor", "creative"); old.generator = version; old.edits = { "0,35,-45": 9 };
      await g.start(old); if (g.world.generatorVersion !== version || g.snapshot().generator !== version) throw Error("old world reinterpreted");
      if (!(await g.save())) throw Error("legacy save failed"); return g.meta.id;
    }, version);
    await page.reload(); await page.locator(`[data-action="load"][data-id="${legacyId}"]`).click(); await page.waitForFunction(() => window.__game.active);
    assert(await page.evaluate(version => { const g = window.__game; g.world.ensure(0, -3, true); return g.world.generatorVersion === version && g.snapshot().generator === version && g.world.get(0, 35, -45) === 9; }, version));
    checks.push(`v${version} load, game snapshot, save and browser reload preserve generator and edits`);
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ status: "passed", recordedAt: new Date().toISOString(), checks, views, errors,
    fixtureNote: "Actual v5 generated game screenshots with HUD hidden. Spectator positions, daylight and view distance are fixtures; no terrain is injected. Stats are sampled atomically on a settled frame before screenshot capture. SwiftShader point samples are not hardware FPS guarantees. Edits and legacy-save fixtures exercise the real Game and IndexedDB paths." }, null, 2));
  console.log("PASS", checks.join("; "));
} catch (error) {
  if (page && !page.isClosed()) await writeFile(`${output}/failure.json`, JSON.stringify({ message: String(error), views, errors,
    state: await page.evaluate(() => { const g=window.__game; return { text: document.body.innerText, snapshot: g?.active ? g.snapshot() : null,
      queues: g ? { generation: g.world.pending.size, mesh: g.world.dirty.size, lighting: g.lighting.pending, chunks: g.world.chunks.size, groups: g.view.groups.size } : null }; }) }, null, 2));
  throw error;
} finally { await browser?.close(); server.kill(); }
