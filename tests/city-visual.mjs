import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
const server = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4176"],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let browser;
try {
  await new Promise((ok, fail) => {
    server.stdout.on("data", (b) => {
      if (b.toString().includes("Local:")) ok();
    });
    server.on("error", fail);
    server.on("exit", (c) => fail(new Error("server " + c)));
  });
  browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--disable-dev-shm-usage",
    ],
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  page.setDefaultTimeout(90000);
  const distance = Number(process.env.CITY_DISTANCE ?? 3);
  if(!Number.isInteger(distance) || distance<3 || distance>8)throw new Error("CITY_DISTANCE must be 3..8");
  await page.addInitScript(distance=>localStorage.setItem("jade-harbor-settings",JSON.stringify({distance})),distance);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await mkdir("test-results/city", { recursive: true });
  await page.goto("http://127.0.0.1:4176");
  await page.locator('[data-action="new"]').click();
  await page.locator("#world-name").fill("Chinatown visual QA");
  await page.locator('[data-action="create"]').click();
  await page.waitForFunction(() => window.__game?.active);
  const views = [
    ["spawn", [0.5, 21.05, 24.5], [0, 28, -48]],
    ["panda-front", [0, 27, -20], [0, 33, -48]],
    ["panda-side", [27, 29, -37], [0, 32, -48]],
    ["aerial", [34, 59, 8], [0, 20, -50]],
    ["market", [-176, 48, -132], [-184, 22, -182]],
    ["temple", [-5, 47, -220], [-32, 34, -270]],
    ["canal", [143, 29, -105], [144, 21, -160]],
    ["garden", [216, 45, 207], [184, 20, 168]],
    ["imperial", [185, 42, -232], [184, 29, -278]],
    ["artisans", [-143, 36, 186], [-182, 23, 167]],
    ["oldtown", [-144, 25, 28], [-144, 24, -8]],
    ["terraces", [384, 36, 172], [363, 21, 142]],
    ["deep-mine", [360.5, 0, 112.5], [360.5, 0, 126.5]],
  ];
  const report = [];
  for (const [name, pos, target] of views.filter(
    (v) =>
      !process.env.CITY_VIEWS ||
      process.env.CITY_VIEWS.split(",").includes(v[0]),
  )) {
    if(name === "deep-mine") {
      const top = await page.evaluate(async()=>{
        const {terrainHeight}=await import("/src/world/generator.ts");
        const {seedNumber}=await import("/src/world/noise.ts");
        return terrainHeight(360,0,seedNumber(window.__game.meta.seed));
      });
      pos[1]=top-56+1.05;
      target[1]=top-63+2;
    }
    await page.evaluate(
      ({ pos, target }) => {
        const g = window.__game;
        g.input.onLook = undefined;
        g.mode = "spectator";
        g.body.flying = true;
        g.body.position = { x: pos[0], y: pos[1], z: pos[2] };
        g.body.velocity = { x: 0, y: 0, z: 0 };
        g.previous = { ...g.body.position };
        g.time = 0.24;
        g.simulation.weather = "clear";
        const dx = target[0] - pos[0],
          dy = target[1] - pos[1] - 1.62,
          dz = target[2] - pos[2];
        g.yaw = Math.atan2(-dx, -dz);
        g.pitch = Math.atan2(dy, Math.hypot(dx, dz));
        g.view.hand.visible = false;
        g.ui.show("none");
      },
      { pos, target },
    );
    try { await page.waitForFunction(
      () => {
        const g = window.__game;
        const cx = Math.floor(g.body.position.x / 16),
          cz = Math.floor(g.body.position.z / 16),
          r = g.settings.distance;
        for (let dz = -r; dz <= r; dz++)
          for (let dx = -r; dx <= r; dx++)
            if (
              dx * dx + dz * dz <= (r + 0.5) ** 2 &&
              (!g.world.chunks.has(`${cx + dx},${cz + dz}`) ||
                !g.view.groups.has(`${cx + dx},${cz + dz}`))
            )
              return false;
        return (
          g.world.pending.size === 0 &&
          g.world.dirty.size === 0 &&
          !g.lighting.pending
        );
      },
      null,
      { timeout: 90000 },
    ); } catch(error) {
      const diagnostic=await page.evaluate(()=>{const g=window.__game;return {position:g.body.position,distance:g.settings.distance,chunks:g.world.chunks.size,groups:g.view.groups.size,dirty:[...g.world.dirty].slice(0,30),pending:[...g.world.pending.keys()],lightingPending:g.lighting.pending,fps:g.fps};});
      await page.screenshot({path:`test-results/city/${name}-failure.png`});
      await writeFile("test-results/city/visual-failure.json",JSON.stringify({name,diagnostic,errors,message:String(error)},null,2));
      console.error(name,diagnostic);throw error;
    }
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `test-results/city/${name}.png` });
    const stats = await page.evaluate(() => ({
      fps: window.__game.fps,
      chunks: window.__game.world.chunks.size,
      drawCalls: window.__game.view.renderer.info.render.calls,
      triangles: window.__game.view.renderer.info.render.triangles,
    }));
    report.push({ name, position:pos, distance, ...stats });
    console.log(name, stats);
  }
  const reportPath = process.env.CITY_VIEWS
    ? "test-results/city/visual-extra-results.json"
    : "test-results/city/visual-results.json";
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        recordedAt:new Date().toISOString(),
        fixtureNote:"Spectator camera positions and daytime are fixtures. CITY_DISTANCE defaults to 3 for SwiftShader. Screenshots are actual generated voxel geometry.",
        report,
        errors,
      },
      null,
      2,
    ),
  );
  if (errors.length) throw new Error(errors.join("\n"));
} finally {
  await browser?.close();
  server.kill();
}
