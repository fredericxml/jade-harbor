import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4178", "--strictPort"], { stdio: ["ignore", "pipe", "pipe"] });
const output = process.env.WORLD_OUTPUT ?? "test-results/world-plan", errors = [], views = [], checks = [];
let browser, page;
try {
  await new Promise((resolve, reject) => { server.stdout.on("data", b => { if (b.toString().includes("Local:")) resolve(); }); server.on("error", reject); server.on("exit", code => reject(new Error(`server ${code}`))); });
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"] });
  page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(90000);
  page.on("pageerror", e => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem("jade-harbor-settings", JSON.stringify({ distance: 3 })));
  await mkdir(output, { recursive: true });
  await page.goto("http://127.0.0.1:4178");
  await page.locator('[data-action="new"]').click();
  await page.locator("#world-name").fill("Macro geography QA");
  await page.locator('[data-action="create"]').click();
  await page.waitForFunction(() => window.__game?.active);
  assert.equal(await page.evaluate(() => window.__game.snapshot().generator), 8);
  await page.evaluate(async()=>{const {freshWorld}=await import("/src/persistence/saves.ts");const save=freshWorld("Retained v4 foundation QA","jade-harbor","creative");save.generator=4;await window.__game.start(save);});
  assert(await page.evaluate(async () => await window.__game.save()), "initial Game save must create a checkpoint");
  checks.push("real UI creates v8; explicit v4 fixture retains foundation generation");
  const locations = [
    ["spawn", [0.5, 21.05, 24.5], [0, 28, -48], 3],
    ["panda-plaza", [0, 27, -20], [0, 33, -48], 3],
    ["harbor-city", [165, 44, 286], [232, 20, 345], 6],
    ["harbor-water", [200, 40, 350], [210, 18, 455], 6],
    ["river", [415, 44, 10], [450, 18, 110], 5],
    ["canal-lowland", [365, 34, 65], [410, 19, 110], 5],
    ["ridge", [155, 155, -550], [160, 132, -640], 6],
    ["valley-pass", [-395, 80, -500], [-430, 46, -610], 6],
    ["cliff", [620, 96, -350], [620, 58, -432], 6],
    ["imperial-plateau", [0, 68, -360], [0, 35, -445], 5],
    ["urban-terrace", [-240, 42, 48], [-204, 23, 48], 4],
    ["rural-terraces", [384, 36, 172], [363, 21, 142], 4],
    ["archaeology", [-530, 57, 245], [-530, 27, 160], 5],
    ["deep-mine", [360.5, -34, 112.5], [360.5, -38, 126.5], 3],
  ];
  for (const [name, position, target, distance] of locations.filter(v => !process.env.WORLD_VIEWS || process.env.WORLD_VIEWS.split(",").includes(v[0]))) {
    console.log("VISIT", name);
    await page.evaluate(({ position, target, distance, name }) => {
      const g = window.__game;
      g.input.onLook = undefined; g.input.keys.clear(); g.mode = "spectator"; g.body.flying = true;
      if (name === "deep-mine") { const top = g.world.inspectTerrain(360, 0).height; position[1] = top - 56 + 1.05; target[1] = top - 63 + 2; }
      g.body.position = { x: position[0], y: position[1], z: position[2] }; g.previous = { ...g.body.position }; g.body.velocity = { x: 0, y: 0, z: 0 };
      g.settings.distance = distance; g.applySettings(); g.time = .24; g.simulation.weather = "clear"; g.simulation.weatherTimer = 180;
      const dx = target[0] - position[0], dy = target[1] - position[1] - 1.62, dz = target[2] - position[2];
      g.yaw = Math.atan2(-dx, -dz); g.pitch = Math.atan2(dy, Math.hypot(dx, dz)); g.view.hand.visible = false; g.ui.show("none");
    }, { position, target, distance, name });
    await page.waitForFunction(() => {
      const g = window.__game, cx = Math.floor(g.body.position.x / 16), cz = Math.floor(g.body.position.z / 16), r = g.settings.distance;
      for (let z = -r; z <= r; z++) for (let x = -r; x <= r; x++) if (x * x + z * z <= (r + .5) ** 2 && !g.world.chunks.has(`${cx + x},${cz + z}`)) return false;
      // Distant low columns can legitimately have no geometry in a high camera's
      // vertical band. The center must render; all requested mesh work must drain.
      return g.view.groups.has(`${cx},${cz}`) && !g.world.pending.size && !g.world.dirty.size && !g.lighting.pending;
    }, null, { timeout: 120000 });
    await page.screenshot({ path: `${output}/${name}.png` });
    const stats = await page.evaluate(() => { const g = window.__game; return { position: g.body.position, generator: g.world.generatorVersion,
      terrain: g.world.inspectTerrain(g.body.position.x, g.body.position.z), fps: g.fps, chunks: g.world.chunks.size,
      generationQueue: g.world.pending.size, meshQueue: g.world.dirty.size, triangles: g.view.renderer.info.render.triangles,
      drawCalls: g.view.renderer.info.render.calls, metrics: g.view.metrics.snapshot(), blockBytes: [...g.world.chunks.values()].reduce((n, c) => n + c.blocks.byteLength, 0) }; });
    assert(stats.chunks < 300); assert.equal(stats.generationQueue, 0); assert.equal(stats.meshQueue, 0);
    views.push({ name, distance, ...stats }); console.log("CAPTURE", name, JSON.stringify({ fps: stats.fps, chunks: stats.chunks, triangles: stats.triangles }));
    await writeFile(`${output}/progress.json`, JSON.stringify({ status: "in progress", views, errors }, null, 2));
  }
  checks.push("streamed representative macro regions with actual worker and no residual generation/mesh queue");
  const saved = await page.evaluate(async () => {
    const g = window.__game, edits = [[200, 18, 530, 11], [160, 140, -630, 48], [-16, -1, -16, 53], [15, -63, 16, 9]];
    g.settings.distance = 3; g.applySettings();
    for (const [x, y, z, value] of edits) { g.world.ensure(Math.floor(x / 16), Math.floor(z / 16)); g.world.set(x, y, z, value); }
    const id = g.meta.id; if (!(await g.save())) throw Error("save failed"); return { id, edits };
  });
  await page.reload(); await page.locator(`[data-action="load"][data-id="${saved.id}"]`).click(); await page.waitForFunction(() => window.__game.active);
  assert(await page.evaluate(({ edits }) => { const g = window.__game; if (g.world.generatorVersion !== 4 || g.snapshot().generator !== 4) return false;
    return edits.every(([x, y, z, value]) => { g.world.ensure(Math.floor(x / 16), Math.floor(z / 16), true); return g.world.get(x, y, z) === value; }); }, saved));
  checks.push("v4 edits made during pending generation survive real IndexedDB save and browser reload");
  const legacyId = await page.evaluate(async () => {
    const g = window.__game, { freshWorld } = await import("/src/persistence/saves.ts");
    const old = freshWorld("Legacy v3 QA", "jade-harbor", "creative"); old.generator = 3; old.edits = { "0,35,-45": 9 };
    await g.start(old); if (g.world.generatorVersion !== 3 || g.snapshot().generator !== 3) throw Error("old world reinterpreted"); if (!(await g.save())) throw Error("legacy save failed"); return g.meta.id;
  });
  await page.reload(); await page.locator(`[data-action="load"][data-id="${legacyId}"]`).click(); await page.waitForFunction(() => window.__game.active);
  assert(await page.evaluate(() => { const g = window.__game; g.world.ensure(0, -3, true); return g.world.generatorVersion === 3 && g.snapshot().generator === 3 && g.world.get(0, 35, -45) === 9; }));
  checks.push("v3 load, game snapshot, save and browser reload preserve generator and edits");
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ status: "passed", recordedAt: new Date().toISOString(), checks, views, errors,
    fixtureNote: "Actual generated game screenshots. Spectator positions, daylight and view distance are fixtures; no terrain is injected. SwiftShader point samples are not hardware FPS guarantees. Edits and legacy-save fixtures exercise the real Game and IndexedDB paths." }, null, 2));
  console.log("PASS", checks.join("; "));
} catch (error) {
  if (page && !page.isClosed()) await writeFile(`${output}/failure.json`, JSON.stringify({ message: String(error), views, errors,
    state: await page.evaluate(() => ({ text: document.body.innerText, snapshot: window.__game?.active ? window.__game.snapshot() : null })) }, null, 2));
  throw error;
} finally { await browser?.close(); server.kill(); }
