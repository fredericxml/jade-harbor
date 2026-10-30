import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { verifyReleaseManifest } from "../scripts/release-integrity.mjs";
import assert from "node:assert/strict";

const baseline = process.env.URBAN_BASELINE === "1";
const observeOnly=baseline||process.env.URBAN_OBSERVE_ONLY==="1", expectedVersion=Number(process.env.URBAN_GENERATOR??(baseline?6:10));
const output = process.env.URBAN_OUTPUT ?? "test-results/urban-life";
const seconds = Math.max(60, Math.min(90, Number(process.env.URBAN_SECONDS) || 60));
const selected = process.env.URBAN_SCENES?.split(",");
const sourceDigest = process.env.URBAN_VERIFY_DIST === "1" ? (() => { verifyReleaseManifest(); return true; })() : false;
const verifiedSource = sourceDigest ? createHash("sha256").update(JSON.stringify(JSON.parse(await readFile("dist/release-integrity.json", "utf8")).source)).digest("hex") : null;
const harness=createHash("sha256").update(await readFile(new URL(import.meta.url))).digest("hex");
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4183", "--strictPort"], { stdio: ["ignore", "pipe", "pipe"] });
const scenes = [], errors = [], activityFailures = [];
// Long real-time matrices may outlive a connected work session. A resumed
// invocation keeps complete observations only when their exact production
// source digest matches; it never shortens a view or suppresses a failure.
// Each remaining arrival is still a natural fixed-camera fixture in a fresh
// world. Continuous travel/persistent-world checks have their own harness.
const resumed=process.env.URBAN_RESUME==="1";
if(resumed) {
  assert(sourceDigest&&!selected&&!observeOnly&&expectedVersion===10&&!process.env.URBAN_SECONDS,"Resume requires the full verified current matrix");
  const previous=JSON.parse(await readFile(`${output}/progress.json`,"utf8"));
  assert.equal(previous.verifiedSource,verifiedSource,"Cannot reuse observations from another application build");
  assert.equal(previous.harness,harness,"Cannot reuse observations from another QA fixture revision");assert.equal(new Set(previous.scenes.map(s=>s.fixture.name)).size,previous.scenes.length);assert.deepEqual(previous.errors,[]);assert.deepEqual(previous.activityFailures,[]);
  assert.equal(previous.baseline,false);
  for(const scene of previous.scenes){assert.equal(scene.observationSeconds,scene.fixture.district==="scholar"?90:seconds);assert(scene.wallSeconds>=scene.observationSeconds&&scene.samples.length>=13);scenes.push(scene);}
  errors.push(...previous.errors);activityFailures.push(...previous.activityFailures);
  console.log("RESUMED",scenes.length,"complete real-time views from the identical verified build");
}
let browser, page;
try {
  await mkdir(output, { recursive: true });
  await new Promise((ok, fail) => { server.stdout.on("data", b => { if (b.toString().includes("Local:")) ok(); }); server.on("error", fail); server.on("exit", code => fail(Error(`server ${code}`))); });
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"] });
  page = await browser.newPage({ viewport: { width: 960, height: 600 } });
  page.setDefaultTimeout(90000); page.on("pageerror", e => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem("jade-harbor-settings", JSON.stringify({ distance: 3, simulationDistance: 4 })));
  await page.goto("http://127.0.0.1:4183");
  await page.locator('[data-action="new"]').click();
  await page.locator("#world-name").fill(baseline ? "Urban correction baseline" : "Urban correction acceptance");
  await page.locator('[data-action="create"]').click();
  await page.waitForFunction(() => window.__game?.active);
  if(expectedVersion!==10)await page.evaluate(async version=>{const {freshWorld}=await import("/src/persistence/saves.ts"),s=freshWorld("Explicit observation fixture","jade-harbor","creative");s.generator=version;await window.__game.start(s);},expectedVersion);
  assert.equal(await page.evaluate(() => window.__game.world.generatorVersion), expectedVersion);
  await page.evaluate(() => {
    const g = window.__game, renderer = g.view.renderer, render = renderer.render.bind(renderer);
    renderer.render = (scene, camera) => { render(scene, camera); if (scene === g.view.scene) g.urbanRenderStats = { triangles: renderer.info.render.triangles, draws: renderer.info.render.calls }; };
  });
  const fixtures = await page.evaluate(async () => {
    const {travelDestinations}=await import("/src/game/city-life/travel.ts");
    const g = window.__game;
    const city = [
      ["avenue", "heritage", 0, 24, 0, -48, 10],
      ["panda-edge", "heritage", -40, -16, 0, -48, 10],
      ["market", "market", -224, -216, -270, -216, 9],
      ["market-center", "market", -248, -216, -290, -216, 10],
      ["hutong", "hutong", -144, -20, -210, -20, 10],
      ["water-town", "water-town", 132, -100, 190, -100, 10],
      ["harbor", "harbor", 120, 340, 170, 340, 8],
      ["imperial", "imperial", 20, -236, 90, -236, 10],
      ["scholar", "scholar", 200, 204, 200, 150, 14],
      ["nightlife", "nightlife", 0, 180, 0, 245, 18],
      ["artisan", "artisan", -224, 186, -280, 186, 10],
      ["artisan-center", "artisan", -248, 186, -290, 186, 10],
      ["highland", "highland", -224, -344, -280, -344, 10],
    ].map(([name, district, x, z, lookX, lookZ, hour]) => {
      const roads = g.world.metropolisPlan.roads.filter(r => !r.owner);
      let road, best = Infinity;
      for (const r of roads) for (let i = 1; i < r.points.length; i++) {
        const a = r.points[i - 1], b = r.points[i], dx = b.x - a.x, dz = b.z - a.z;
        const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
        const d = Math.hypot(a.x + dx * t - x, a.z + dz * t - z);
        if (d < best) { best = d; road = { y: a.y + (b.y - a.y) * t }; }
      }
      return { name, district, position: { x: x + .5, y: (road?.y ?? 20) + 1.002, z: z + .5 }, lookX, lookZ, hour };
    });
    for (const s of g.world.landmarkPlan.sites) {
      const near = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
      const approach = g.world.landmarkPlan.approaches.filter(a=>a.site===s.id).sort((a,b)=>near(a.nodes.at(-1),s.entry)-near(b.nodes.at(-1),s.entry)||a.id.localeCompare(b.id))[0];
      const camera = s.id==="ridge-fortification" ? g.world.landmarkPlan.wallWalk[0] : approach?.nodes[Math.max(0,approach.nodes.length-9)] ?? s.entry;
      const target = s.id==="ridge-fortification" ? g.world.landmarkPlan.wallWalk[16] : s.id==="cliff-grotto" ? s.viewpoints[0] : s.publicSpaces[0] ?? s.viewpoints[0];
      city.push({ name: `landmark-${s.id}`, district: "landmark", position: { x: camera.x+.5, y: camera.y+1.002, z: camera.z+.5 }, lookX: target.x+.5, lookY: target.y+2.1, lookZ: target.z+.5, hour: 10 });
    }
    for(const d of travelDestinations(g.world).filter(d=>d.category==="region")) {
      city.push({name:d.id.replace(":","-"),district:"landmark",position:{...d.arrival},lookX:d.focus.x,lookY:d.focus.y,lookZ:d.focus.z,hour:10});
    }
    const revisit = city.filter(s => ["market", "harbor"].includes(s.name)).map((s,i) => ({ ...s, name: `revisit-${s.name}`, reloadBefore: i===0, hour: s.name==="market"?15:18, rain: s.name==="market" }));
    // Check the remote routes first so a regression fails before the long city matrix.
    return [...city.filter(s=>s.district==="landmark"),...city.filter(s=>s.district!=="landmark"), ...revisit];
  });
  if(resumed)for(const scene of scenes)assert.deepEqual(scene.fixture,fixtures.find(f=>f.name===scene.fixture.name),"Resumed camera/time fixture changed");
  assert.equal(new Set(scenes.map(s=>s.fixture.name)).size,scenes.length,"Duplicate resumed scene");
  for (const f of fixtures.filter(f => (!selected || selected.includes(f.name))&&!scenes.some(s=>s.fixture.name===f.name))) {
    const duration = !process.env.URBAN_SECONDS && f.district === "scholar" ? 90 : seconds;
    if (f.reloadBefore) {
      const saved = await page.evaluate(async () => { const g=window.__game;if(!(await g.save()))throw Error("acceptance save failed");return {id:g.meta.id,version:g.world.generatorVersion,ids:g.entities.list.filter(e=>e.kind==="villager").map(e=>e.id).sort()}; });
      await page.reload(); await page.locator(`[data-action="load"][data-id="${saved.id}"]`).click(); await page.waitForFunction(()=>window.__game.active);
      assert(await page.evaluate(s=>{const g=window.__game;return g.world.generatorVersion===s.version&&JSON.stringify(g.entities.list.filter(e=>e.kind==="villager").map(e=>e.id).sort())===JSON.stringify(s.ids);},saved));
      await page.evaluate(() => {const g=window.__game,r=g.view.renderer,render=r.render.bind(r);r.render=(scene,camera)=>{render(scene,camera);if(scene===g.view.scene)g.urbanRenderStats={triangles:r.info.render.triangles,draws:r.info.render.calls};};});
      console.log("RELOADED", saved.id, saved.ids.length, "identities preserved");
    }
    console.log("OBSERVE", f.name, duration, "real seconds");
    await page.evaluate(async f => {
      const g = window.__game, { safeActivityPoint } = await import("/src/game/city-life/runtime.ts");
      g.ui.show("pause", ""); g.ui.overlay.style.display = "none";
      g.input.keys.clear(); g.input.onLook = undefined;
      g.time = ((f.hour - 6) / 24 + 1) % 1; g.simulation.weather = f.rain ? "rain" : "clear"; g.entities.weather = g.simulation.weather; g.simulation.weatherTimer = 180;
      g.settings.distance = 3; g.applySettings();
      const p = f.position, cx = Math.floor(p.x / 16), cz = Math.floor(p.z / 16);
      for (const key of g.world.stream(p.x, p.z, 3)) g.view.remove(key);
      // Exact existing generation/lighting/meshing prepares the camera fixture;
      // it is not a streaming speed measurement. Actor positions are untouched.
      for (let z = -3; z <= 3; z++) for (let x = -3; x <= 3; x++) if (x * x + z * z <= 3.5 ** 2) g.world.ensure(cx + x, cz + z, true);
      const stand = safeActivityPoint(g.world, p); if (!stand) throw Error(`No actual standing surface: ${f.name}`);
      g.body.position = { ...stand }; g.previous = { ...stand }; g.body.velocity = { x: 0, y: 0, z: 0 };
      g.body.flying = false; g.body.grounded = false; g.mode = "creative";
      g.yaw = Math.atan2(-(f.lookX - stand.x), -(f.lookZ - stand.z)); g.pitch = f.lookY===undefined ? -.035 : Math.atan2(f.lookY-stand.y-1.61,Math.hypot(f.lookX-stand.x,f.lookZ-stand.z));
      if(f.name.startsWith("region-"))g.pitch=Math.max(-.22,Math.min(.2,g.pitch));
      g.view.camera.position.set(stand.x, stand.y + 1.61, stand.z); g.view.camera.rotation.set(g.pitch, g.yaw, 0, "YXZ");
      g.lighting.rebuild(); for (let i = 0; i < 512 && g.world.dirty.size; i++) g.view.rebuild(g.world, 6);
      g.ui.overlay.style.display = ""; g.ui.show("none");
    }, f);
    await page.waitForTimeout(1000);
    await page.evaluate(async () => { const { Metrics } = await import("/src/core/metrics.ts"); window.__game.view.metrics = new Metrics(); });
    const samples = [], paths = new Map();
    const started = Date.now();
    for (let s = 0; s <= duration; s += 5) {
      if (s) await page.waitForTimeout(Math.max(1, started + s * 1000 - Date.now()));
      const row = await page.evaluate(async () => {
        const g = window.__game, { raycast } = await import("/src/player/raycast.ts"), { block } = await import("/src/world/blocks.ts");
        const residents = g.entities.list.filter(e => e.kind === "villager");
        const active = residents.filter(e => !g.entities.life || g.entities.life.active.has(e.id));
        const visibleAt = (e,height) => {
          const p=e.body.position,eye=g.view.camera.position,target=eye.clone().set(p.x,p.y+height,p.z),delta=target.clone().sub(eye),n=delta.length(),screen=target.clone().project(g.view.camera);
          return n<64&&screen.z>-1&&screen.z<1&&Math.abs(screen.x)<1&&Math.abs(screen.y)<1&&!raycast((x,y,z)=>{const v=g.world.get(x,y,z);return block(v).opaque?v:0;},eye,delta.normalize(),Math.max(0,n-.3));
        };
        const torsoVisible=active.filter(e=>visibleAt(e,1.1)),visible=active.filter(e=>visibleAt(e,1.1)||visibleAt(e,1.55));
        return { time: g.time, ticks: g.tickCount, residents: residents.length, unique: new Set(g.entities.list.map(e => e.id)).size, total: g.entities.list.length, active: active.length, visible: visible.map(e => e.id), torsoVisible: torsoVisible.map(e=>e.id), positions: active.map(e => ({ id: e.id, p: { ...e.body.position }, state: e.state, profession:e.profession, routine:g.entities.life?.plan?.byId.get(e.id)?.circuit?.routine,role:g.entities.life?.plan?.byId.get(e.id)?.task?.role,category:g.entities.life?.plan?.byId.get(e.id)?.task?.category,appearance:g.entities.life?.plan?.byId.get(e.id)?.task?.look.fingerprint,group:g.entities.life?.plan?.byId.get(e.id)?.task?.group,yaw:e.yaw,place:g.entities.life?.states.get(e.id)?.actionPlace,speed:Math.hypot(e.body.velocity.x,e.body.velocity.z),action:g.entities.life?.states.get(e.id)?.taskActing?g.entities.life?.states.get(e.id)?.taskAction:null,completedActions:g.entities.life?.states.get(e.id)?.completedActions??0 })), chunks: g.world.chunks.size, pending: g.world.pending.size, mesh: g.world.dirty.size, routes: g.entities.navigation.agents.size, expanded: g.entities.navigation.expandedLastTick, frame: g.view.metrics.summary("frame"), tick: g.view.metrics.summary("tick"), ...g.urbanRenderStats };
      });
      assert.equal(row.unique, row.total); assert(row.pending <= 8); assert(row.expanded <= 96);
      const visibleNow=row.positions.filter(p=>row.visible.includes(p.id)),groups=new Map();
      for(const p of visibleNow.filter(p=>p.group&&p.action)){const a=groups.get(p.group)??[];a.push(p);groups.set(p.group,a);}
      const meetingGroups=[...groups].filter(([,a])=>a.some(p=>a.some(q=>q.id!==p.id&&Math.hypot(p.p.x-q.p.x,p.p.z-q.p.z)<6))).map(([id,a])=>({id,actors:a.map(p=>p.id)}));
      row.behavior={moving:visibleNow.filter(p=>p.speed>.2).length,roleAction:visibleNow.filter(p=>p.speed<=.2&&p.action).length,idle:visibleNow.filter(p=>p.speed<=.2&&!p.action).length,groups:meetingGroups,roleDiversity:new Set(visibleNow.map(p=>p.role).filter(Boolean)).size,appearanceDiversity:new Set(visibleNow.map(p=>p.appearance).filter(Boolean)).size};
      for (const e of row.positions) { const old = paths.get(e.id); if (old) old.walked += Math.hypot(e.p.x - old.p.x, e.p.z - old.p.z); paths.set(e.id, { p: e.p, walked: old?.walked ?? 0 }); }
      samples.push(row);
      if (s === 0 || s === 30 || s === duration) await page.screenshot({ path: `${output}/${f.name}-${s}.png` });
    }
    const moving = [...paths].filter(([, p]) => p.walked > 4).map(([id, p]) => ({ id, distance: p.walked }));
    const visibleRows=samples.flatMap(s=>s.positions.filter(p=>s.visible.includes(p.id))),purposeful=visibleRows.filter(p=>p.role&&(p.speed>.2||p.action));
    const purpose={visibleActorSamples:visibleRows.length,purposefulActorSamples:purposeful.length,purposefulRatio:purposeful.length/Math.max(1,visibleRows.length),visibleRoles:[...new Set(visibleRows.map(p=>p.role).filter(Boolean))],visibleActions:[...new Set(visibleRows.map(p=>p.action).filter(Boolean))],visibleAppearances:new Set(visibleRows.map(p=>p.appearance).filter(Boolean)).size};
    if(!observeOnly&&expectedVersion>=10){if(purpose.purposefulRatio<.6)activityFailures.push(`${f.name}: most visible behavior lacks physical motion or a role action`);if(purpose.visibleRoles.length<2)activityFailures.push(`${f.name}: insufficient visible role diversity`);}
    const result = { fixture: f,purpose, observationSeconds: duration, wallSeconds: (Date.now() - started) / 1000, moving, samples };
    scenes.push(result);
    console.log("MEASURED", f.name, JSON.stringify({ activePeak: Math.max(...samples.map(s => s.active)), visiblePeak: Math.max(...samples.map(s => s.visible.length)), moving: moving.length, frame: samples.at(-1).frame }));
    if (!observeOnly) {
      if (moving.length < (f.district === "landmark" ? 3 : 8)) activityFailures.push(`${f.name}: insufficient continued circulation`);
      const visibleFloor = f.district === "landmark" ? 3 : ["avenue", "panda-edge"].includes(f.name) ? 12 : 10;
      if (samples.filter(s => s.visible.length >= visibleFloor).length < Math.ceil(samples.length * 2 / 3)) activityFailures.push(`${f.name}: activity not visible from the ordinary fixed view`);
    }
    await writeFile(`${output}/progress.json`, JSON.stringify({ baseline, verifiedSource, harness, scenes, errors, activityFailures }, null, 2));
    console.log("PURPOSE",f.name,JSON.stringify(purpose));
    assert.deepEqual(activityFailures,[],"Every completed scene must pass before continuing");
  }
  assert.equal(scenes.length,fixtures.filter(f=>!selected||selected.includes(f.name)).length,"Incomplete scene matrix");
  assert.deepEqual(errors, []);
  assert.deepEqual(activityFailures, [], "Every selected scene must pass; failure collection does not relax the gate");
  await writeFile(`${output}/results.json`, JSON.stringify({ status: observeOnly ? "diagnostic-observations" : "passed", scope: selected ? "selected-scenes" : "all-districts-and-landmarks-plus-reload-revisits", resumed, durationPolicy: { default: seconds, scholar: process.env.URBAN_SECONDS ? seconds : 90 }, verifiedSource, harness, scenes, errors, note: "Stationary normal-height camera; actual running Game for 60–90 real seconds per selected scene. Camera/time/initial geometry preparation are fixtures. No actor position injection; visible count is a screen-projection/opaque-voxel estimate verified separately by images. Five-second displacement tracing is a conservative trajectory sample, not exact distance integration. Resume retains completed full-duration views only from the identical verified build; remaining views run in a fresh world and are not claimed as uninterrupted travel." }, null, 2));
} catch (error) {
  await writeFile(`${output}/failure.json`, JSON.stringify({ error: String(error), verifiedSource, scenes, errors, activityFailures }, null, 2));
  throw error;
} finally { await browser?.close(); server.kill(); }
