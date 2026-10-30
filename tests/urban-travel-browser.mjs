// Continuous real-input travel complements fixed-camera acceptance and CPU fixtures.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const output = process.env.URBAN_TRAVEL_OUTPUT ?? "test-results/urban-travel";
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4184", "--strictPort"], { stdio: ["ignore", "pipe", "pipe"] });
const errors = [], checks = [], walk = [], flight = [], regional = [], revisits = [];
let browser, page;
const pass = s => { checks.push(s); console.log("CHECK", s); };
async function sample(inspect=false) {
  return page.evaluate(async inspect => {
    const g = window.__game;
    let visible;
    if(inspect) {
      const {raycast}=await import("/src/player/raycast.ts"),{block}=await import("/src/world/blocks.ts"),eye=g.view.camera.position;
      visible=g.entities.list.filter(e=>e.kind==="villager"&&e.health>0&&g.entities.life.active.has(e.id)).filter(e=>{
        const p=e.body.position,target=eye.clone().set(p.x,p.y+1.5,p.z),delta=target.clone().sub(eye),n=delta.length(),screen=target.clone().project(g.view.camera);
        return n<64&&screen.z>-1&&screen.z<1&&Math.abs(screen.x)<1&&Math.abs(screen.y)<1&&!raycast((x,y,z)=>{const v=g.world.get(x,y,z);return block(v).opaque?v:0;},eye,delta.normalize(),Math.max(0,n-.3));
      }).length;
    }
    return { position: { ...g.body.position }, district: g.world.inspectDistrict(g.body.position.x, g.body.position.z)?.district?.id, flying: g.body.flying, grounded: g.body.grounded, generator: g.world.generatorVersion,
      visible,
      active: g.entities.life.metrics.active, residents: g.entities.list.filter(e => e.kind === "villager").length, unique: new Set(g.entities.list.map(e => e.id)).size, total: g.entities.list.length,
      chunks: g.world.chunks.size, pending: g.world.pending.size, mesh: g.world.dirty.size, nav: g.entities.navigation.agents.size, nodes: g.entities.navigation.expandedLastTick,
      geometries: g.view.renderer.info.memory.geometries, triangles: g.view.worldRenderStats.triangles, draws: g.view.worldRenderStats.calls, frame: g.view.metrics.summary("frame"), tick: g.view.metrics.summary("tick") };
  },inspect);
}
function bounded(r) { assert.equal(r.generator, 10); assert.equal(r.residents, 4080); assert.equal(r.unique, r.total); assert(r.active <= 96); assert(r.nav <= 102); assert(r.nodes <= 96); assert(r.pending <= 8); assert(r.chunks <= 256); }
async function steerTo(target, flying, rows, deadlineMs = 180000) {
  const started = Date.now(); let nextSample = 0;
  while (Date.now() - started < deadlineMs) {
    const r = await sample(), d = Math.hypot(r.position.x - target.x, r.position.z - target.z, flying ? r.position.y - target.y : 0); bounded(r);
    if (Date.now() >= nextSample) { const observed=await sample(true);rows.push({ wallMs: Date.now(), ...observed }); nextSample = Date.now() + 5000; console.log("TRAVEL", rows.length, JSON.stringify({ position: r.position, district: r.district, active: r.active, visible:observed.visible,pending: r.pending })); }
    if (d < (flying ? 4 : 2.2)) return;
    await page.evaluate(({ target, flying }) => {
      const g = window.__game, p = g.body.position, dx = target.x - p.x, dz = target.z - p.z;
      g.yaw = Math.atan2(-dx, -dz); g.pitch = -.035;
      // Horizontal steering uses real held keys. Flight height uses the same
      // normal Space/Control inputs, never a position assignment.
      if (flying) {
        const n=Math.hypot(dx,dz)||1;let altitude=target.y;
        for(let look=0;look<=Math.min(n,48);look+=8) {
          const x=p.x+dx/n*look,z=p.z+dz/n*look;
          // Real approaches may cut an open corridor through higher macro
          // terrain (notably the grotto). Use loaded collision air when it is
          // available; natural terrain remains the conservative remote fallback.
          if(!g.world.loaded(x,z)||g.world.get(x,Math.floor(target.y),z)!==0||g.world.get(x,Math.floor(target.y)+1,z)!==0)altitude=Math.max(altitude,(g.world.inspectTerrain(x,z)?.height??0)+40);
        }
        g.input.keys.delete("Space"); g.input.keys.delete("ControlLeft"); if (altitude - p.y > 2) g.input.keys.add("Space"); else if (p.y - altitude > 2) g.input.keys.add("ControlLeft");
      }
    }, { target, flying });
    await page.waitForTimeout(flying ? 200 : 400);
  }
  throw Error(`Continuous ${flying ? "flight" : "walk"} did not reach ${JSON.stringify(target)}`);
}
try {
  await mkdir(output, { recursive: true });
  await new Promise((ok, fail) => { server.stdout.on("data", b => { if (b.toString().includes("Local:")) ok(); }); server.on("error", fail); server.on("exit", n => fail(Error(`server ${n}`))); });
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"] });
  page = await browser.newPage({ viewport: { width: 960, height: 600 } }); page.setDefaultTimeout(90000); page.on("pageerror", e => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem("jade-harbor-settings", JSON.stringify({ distance: 3, simulationDistance: 4 })));
  await page.goto("http://127.0.0.1:4184"); await page.locator('[data-action="new"]').click(); await page.locator("#world-name").fill("Continuous urban travel QA"); await page.locator('[data-action="create"]').click();
  await page.waitForFunction(() => window.__game?.active);
  await page.waitForFunction(() => { const g = window.__game; return g.world.pending.size === 0 && g.world.loaded(0, 24); });
  await page.evaluate(async () => {
    const g = window.__game, { safeActivityPoint } = await import("/src/game/city-life/runtime.ts"), { Metrics } = await import("/src/core/metrics.ts");
    const p = safeActivityPoint(g.world, { x: .5, y: 21.002, z: 24.5 }); if (!p) throw Error("Start not supported");
    // One initial arrival fixture; every subsequent route leg uses player input.
    g.body.position = { ...p }; g.previous = { ...p }; g.body.velocity = { x: 0, y: 0, z: 0 }; g.body.flying = false; g.mode = "creative"; g.time = .2; g.simulation.weather = "clear"; g.simulation.weatherTimer = 600;
    g.input.keys.clear(); g.input.onLook = undefined; g.ui.show("none"); g.view.metrics = new Metrics();
  });
  if (await page.evaluate(() => !window.__game.input.locked)) await page.locator("canvas#game").click();
  await page.waitForFunction(() => window.__game.input.locked);
  const start = await sample(), started = Date.now();
  await page.keyboard.down("ShiftLeft"); await page.keyboard.down("KeyW");
  for (const p of [{ x: .5, z: 120.5 }, { x: .5, z: 240.5 }, { x: .5, z: 312.5 }, { x: 48.5, z: 312.5 }, { x: 48.5, z: 340.5 }, { x: 120.5, z: 340.5 }]) await steerTo(p, false, walk);
  await page.keyboard.up("KeyW"); await page.keyboard.up("ShiftLeft");
  const end = await sample(); walk.push({ wallMs: Date.now(), ...end });
  assert.equal(end.flying, false); assert(new Set(walk.map(r => r.district).filter(Boolean)).size >= 3); assert(Math.hypot(end.position.x - start.position.x, end.position.z - start.position.z) > 300);
  assert(walk.filter(r=>r.visible>=1).length>=Math.ceil((walk.length-1)*.75),"The continuous ground route must keep encountering actual visible inhabitants");
  await page.screenshot({ path: `${output}/walk-harbor.png` }); pass(`continuous real-input 436-block avenue/nightlife/harbor route completed in ${((Date.now() - started) / 1000).toFixed(1)} real seconds`);
  const saved = await page.evaluate(async () => { const g = window.__game; if (!(await g.save())) throw Error("travel save failed"); return { id: g.meta.id, ids: g.entities.list.filter(e => e.kind === "villager").map(e => e.id).sort() }; });
  await page.reload(); await page.locator(`[data-action="load"][data-id="${saved.id}"]`).click(); await page.waitForFunction(() => window.__game.active);
  assert(await page.evaluate(s => JSON.stringify(window.__game.entities.list.filter(e => e.kind === "villager").map(e => e.id).sort()) === JSON.stringify(s.ids), saved)); pass("continuous-travel save/restart retains all resident identities");
  // Real fast flight through city and outer landmark regions. No route teleports.
  await page.evaluate(() => { const g = window.__game; g.body.flying = true; g.mode = "creative"; g.input.onLook = undefined; g.input.keys.clear(); g.ui.show("none"); });
  if (await page.evaluate(() => !window.__game.input.locked)) await page.locator("canvas#game").click();
  await page.keyboard.down("KeyW"); await page.keyboard.down("ShiftLeft");
  for (const p of [{ x: 200, y: 60, z: 204 }, { x: 156, y: 60, z: -100 }, { x: 20, y: 60, z: -236 }, { x: -224, y: 70, z: -344 }, { x: -224, y: 60, z: -216 }, { x: -224, y: 60, z: -20 }, { x: -224, y: 60, z: 186 }, { x: 0, y: 60, z: 24 }]) await steerTo(p, true, flight);
  await page.keyboard.up("KeyW"); await page.keyboard.up("ShiftLeft"); await page.evaluate(() => { window.__game.input.keys.clear(); });
  assert(new Set(flight.map(r => r.district).filter(Boolean)).size >= 7); pass("continuous fast flight crosses at least seven inhabited districts with bounded streaming/activation");
  // Continue through the whole landmark/cultivated region with the same real
  // held inputs. Terrain lookahead only steers normal Space/Control ascent;
  // it never moves the player or actors by assigning a position.
  const destinations=await page.evaluate(()=>{
    const g=window.__game,order=["archaeology","mountain-temple","scenic-landscape","western-viewpoint","ridge-fortification","imperial-complex","cliff-grotto","harbor-front"];
    const old=order.map(id=>{
      const s=g.world.landmarkPlan.sites.find(s=>s.id===id),near=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),approach=g.world.landmarkPlan.approaches.filter(a=>a.site===id).sort((a,b)=>near(a.nodes.at(-1),s.entry)-near(b.nodes.at(-1),s.entry))[0],p=approach?.nodes[Math.max(0,approach.nodes.length-17)]??s.entry;
      return{name:id,x:p.x,y:p.y+38,z:p.z,lookX:s.entry.x,lookY:s.entry.y+5,lookZ:s.entry.z};
    });
    return [...old,...[...g.world.regionalPlan.sites].sort((a,b)=>a.arrival.x-b.arrival.x).map(s=>({name:s.id,x:s.arrival.x,y:Math.max(s.arrival.y,s.focus.y)+38,z:s.arrival.z,lookX:s.focus.x,lookY:s.focus.y,lookZ:s.focus.z}))];
  });
  assert.equal(destinations.length,13,"The tour must include eight released landmarks and all five new regions");
  assert.deepEqual(destinations.slice(8).map(p=>p.name).sort(),["willow-tulou","amber-village","li-stone-walk","mist-tea-village","lotus-causeway"].sort());
  await page.keyboard.down("KeyW");await page.keyboard.down("ShiftLeft");
  for(const p of [...destinations.slice(0,7),{name:"cultivated-fields",x:362,y:90,z:180},...destinations.slice(7),{name:"panda-return",x:0,y:70,z:-24}]) {
    await steerTo(p,true,flight,240000);
    await page.keyboard.up("KeyW");await page.keyboard.up("ShiftLeft");
    const tick=await page.evaluate(p=>{const g=window.__game,at=g.body.position;g.input.keys.clear();const x=p.lookX??p.x,z=p.lookZ??p.z,y=p.lookY??(g.world.inspectTerrain(x,z)?.height??20)+4;g.yaw=Math.atan2(-(x-at.x),-(z-at.z));g.pitch=Math.atan2(y-at.y-1.61,Math.hypot(x-at.x,z-at.z));return g.tickCount;},p);
    await page.waitForFunction(t=>window.__game.tickCount>=t+3,tick);
    regional.push({name:p.name,...await sample(true)});
    await page.screenshot({path:`${output}/region-${p.name}.png`});
    await page.keyboard.down("KeyW");await page.keyboard.down("ShiftLeft");
  }
  await page.keyboard.up("KeyW");await page.keyboard.up("ShiftLeft");await page.evaluate(()=>window.__game.input.keys.clear());
  assert(destinations.every(p=>regional.some(r=>r.name===p.name)));pass("continuous real-input whole-map tour reaches all eight landmarks, five regional destinations, cultivated fields and Panda return");
  // Return after reload: use normal geometry preparation, then real live time.
  for (const [name, x, z, rain, h] of [["market", -224, -216, true, 14], ["harbor", 120, 340, false, 18]]) {
    await page.evaluate(async ({ x, z, rain, h }) => {
      const g = window.__game, { safeActivityPoint } = await import("/src/game/city-life/runtime.ts"); g.ui.show("pause", ""); g.ui.overlay.style.display = "none"; g.input.keys.clear();
      for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) g.world.ensure(Math.floor(x / 16) + dx, Math.floor(z / 16) + dz, true);
      const road = g.world.metropolisPlan.roads.find(r => r.id === (z > 0 ? "harbor-north-quay" : "cross--216"));
      const point = road.points.reduce((a, b) => Math.hypot(a.x - x, a.z - z) < Math.hypot(b.x - x, b.z - z) ? a : b), safe = safeActivityPoint(g.world, { x: x + .5, y: point.y + 1.002, z: z + .5 }); if (!safe) throw Error("Revisit unsupported");
      g.body.position = { ...safe }; g.previous = { ...safe }; g.body.velocity = { x: 0, y: 0, z: 0 }; g.body.flying = false; g.mode = "creative"; g.yaw=z>0?-Math.PI/2:Math.PI/2;g.pitch=-.035;g.time = ((h - 6) / 24 + 1) % 1; g.simulation.weather = rain ? "rain" : "clear"; g.entities.weather = g.simulation.weather; g.simulation.weatherTimer = 180; g.ui.overlay.style.display = ""; g.ui.show("none");
    }, { x, z, rain, h });
    const before = await sample(); await page.waitForTimeout(20000); const after = await sample(); bounded(after); assert(after.active >= 4); revisits.push({ name, rain, before, after });
    await page.screenshot({ path: `${output}/revisit-${name}.png` });
  }
  pass("post-restart market rain and evening harbor remain occupied during real live time");
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ status: "passed", checks, walk, flight, regional, revisits, errors, note: "Continuous 436-block walk and city/whole-map fast flight use real input/physics/streaming, with one initial arrival fixture and a real saved restart. The regional tour reaches all eight landmarks, five regional destinations, cultivation and Panda return; terrain lookahead steers ordinary flight keys. Fixed revisit cameras are separate fixtures; actor positions are never injected. This is not a hardware FPS certification." }, null, 2));
} catch (error) { await writeFile(`${output}/failure.json`, JSON.stringify({ error: String(error), checks, walk, flight, regional, revisits, errors }, null, 2)); throw error; }
finally { await browser?.close(); server.kill(); }
