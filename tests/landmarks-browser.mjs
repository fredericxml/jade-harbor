import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const server=spawn(process.execPath,["node_modules/vite/bin/vite.js","--host","127.0.0.1","--port","4180","--strictPort"],{stdio:["ignore","pipe","pipe"]});
const output=process.env.LANDMARK_OUTPUT??"test-results/landmarks",views=[],checks=[],errors=[];
let browser,page;
try {
  await new Promise((ok,fail)=>{server.stdout.on("data",b=>{if(b.toString().includes("Local:"))ok();});server.on("error",fail);server.on("exit",c=>fail(Error(`server ${c}`)));});
  browser=await chromium.launch({headless:true,args:["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-dev-shm-usage"]});
  page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(90000);
  page.on("pageerror",e=>errors.push(e.message));page.on("console",m=>{if(m.text().startsWith("QA_READY"))console.log(m.text());});
  await page.addInitScript(()=>localStorage.setItem("jade-harbor-settings",JSON.stringify({distance:3})));
  await mkdir(output,{recursive:true});await page.goto("http://127.0.0.1:4180");
  await page.locator('[data-action="new"]').click();await page.locator("#world-name").fill("Landmark program QA");await page.locator('[data-action="create"]').click();
  await page.waitForFunction(()=>window.__game?.active);assert.equal(await page.evaluate(()=>window.__game.snapshot().generator),8);
  assert(await page.evaluate(()=>window.__game.save()));checks.push("real UI creates and checkpoints v8");
  await page.evaluate(async()=>{const {freshWorld}=await import("/src/persistence/saves.ts");const fixture=freshWorld("Frozen v6 landmark QA","jade-harbor","creative");fixture.generator=6;await window.__game.start(fixture);if(!(await window.__game.save()))throw Error("v6 fixture checkpoint failed");});
  checks.push("explicit v6 fixture preserves the frozen landmark reconstruction");
  await page.addStyleTag({content:"#hud,#toast,.toast { display:none!important; }"});
  const context=await page.evaluate(()=>{const p=window.__game.world.landmarkPlan;return {first:p.wallWalk[0],middle:p.wallWalk[Math.floor(p.wallWalk.length/2)],temple:p.sites.find(s=>s.id==="mountain-temple").level,view:p.sites.find(s=>s.id==="western-viewpoint").level};});
  const f=context.first,m=context.middle,t=context.temple,v=context.view;
  const locations=[
    ["imperial-close",[0,43,-421],[0,47,-442],5],
    ["imperial-medium",[50,72,-395],[0,41,-430],8],
    ["imperial-far",[0,55,-320],[0,45,-425],8],
    ["ridge-close",[f.x-20,f.y+7,f.z+20],[f.x,f.y+5,f.z],5],
    ["ridge-medium",[m.x+30,m.y+30,m.z+60],[m.x,m.y+5,m.z],7],
    ["ridge-far",[-205,100,-484],[-140,f.y-2,f.z],8],
    ["archaeology-close",[-465,36,160],[-530,28,166],6],
    ["archaeology-medium",[-512,85,175],[-540,23,160],7],
    ["archaeology-far",[-530,50,76],[-530,35,158],8],
    ["harbor-close",[200,27,325],[200,36,349],4],
    ["harbor-medium",[236,51,384],[200,34,349],6],
    ["harbor-far",[200,40,445],[200,37,349],7],
    ["mountain-temple",[-630,t+22,-221],[-660,t+5,-252],5],
    ["cliff-grotto",[620,54,-409],[620,50,-430],5],
    ["scenic-landscape",[-714,89,-228],[-735,77,-250],5],
    ["western-viewpoint",[-637,v+12,-301],[-660,v+11,-325],5],
    ["panda-relationship",[0,34,-4],[0,31,-48],6],
    ["skyline-city-gate",[0,52,330],[20,30,270],5],
    ["skyline-river-arrival",[302,45,404],[200,35,349],8],
    ["western-outlook",[-660,v+13,-325],[-650,t+3,-250],6],
  ];
  for(const [name,position,target,distance] of locations.filter(v=>!process.env.LANDMARK_VIEWS||process.env.LANDMARK_VIEWS.split(",").includes(v[0]))) {
    console.log("VISIT",name);
    await page.evaluate(({position,target,distance})=>{
      const g=window.__game;g.input.onLook=undefined;g.input.keys.clear();g.mode="spectator";g.body.flying=true;
      g.body.position={x:position[0],y:position[1],z:position[2]};g.previous={...g.body.position};g.body.velocity={x:0,y:0,z:0};
      g.settings.distance=distance;g.applySettings();g.time=.24;g.simulation.weather="clear";g.simulation.weatherTimer=180;
      const dx=target[0]-position[0],dy=target[1]-position[1]-1.62,dz=target[2]-position[2];
      g.yaw=Math.atan2(-dx,-dz);g.pitch=Math.atan2(dy,Math.hypot(dx,dz));g.ui.show("none");
    },{position,target,distance});
    const sample = await page.waitForFunction(target => {
      const g = window.__game, cx = Math.floor(g.body.position.x / 16), cz = Math.floor(g.body.position.z / 16), r = g.settings.distance;
      const now = performance.now();
      if (!window.__qaLast || now - window.__qaLast > 30000) {
        window.__qaLast = now;
        console.log("QA_READY", JSON.stringify({ chunks: g.world.chunks.size, generation: g.world.pending.size, mesh: g.world.dirty.size,
          lighting: g.lighting.pending, center: g.view.groups.has(`${cx},${cz}`), target: !!g.view.groups.get(`${Math.floor(target[0]/16)},${Math.floor(target[2]/16)}`)?.children.length, position: g.body.position }));
      }
      for (let z = -r; z <= r; z++) for (let x = -r; x <= r; x++) if (x * x + z * z <= (r + .5) ** 2 && !g.world.chunks.has(`${cx + x},${cz + z}`)) return false;
      // A high camera can defer the terrain directly below it. Require actual
      // geometry at the requested landmark, and drain every requested queue.
      if (!g.view.groups.get(`${Math.floor(target[0]/16)},${Math.floor(target[2]/16)}`)?.children.length || g.world.pending.size || g.world.dirty.size || g.lighting.pending) return false;
      // Sample queues and rendering in the SAME settled frame. A later screenshot
      // can overlap the game's normal periodic relighting; that is not a leak.
      return { position: { ...g.body.position }, generator: g.world.generatorVersion,
        terrain: g.world.inspectTerrain(g.body.position.x, g.body.position.z), fps: g.fps, chunks: g.world.chunks.size,
        generationQueue: g.world.pending.size, meshQueue: g.world.dirty.size, triangles: g.view.renderer.info.render.triangles,
        drawCalls: g.view.renderer.info.render.calls, metrics: g.view.metrics.snapshot(), blockBytes: [...g.world.chunks.values()].reduce((n, c) => n + c.blocks.byteLength, 0) };
    }, target, { timeout: 240000 });
    const stats = await sample.jsonValue(); await sample.dispose();
    await page.screenshot({ path: `${output}/${name}.png` });
    assert(stats.chunks < 400); assert.equal(stats.generationQueue, 0); assert.equal(stats.meshQueue, 0);
    views.push({ name, distance, ...stats }); console.log("CAPTURE", name, JSON.stringify({ fps: stats.fps, chunks: stats.chunks, triangles: stats.triangles }));
    await writeFile(`${output}/progress.json`, JSON.stringify({ status: "in progress", views, errors }, null, 2));
  }
  checks.push(`streamed ${views.length} selected landmark views with actual worker and drained queues`);
  // Burst travel deliberately outruns generation, then overlays edits before
  // the worker finishes. Normal world queue/ticket/eviction logic remains active.
  const burst = await page.evaluate(async()=>{
    const g=window.__game;g.settings.distance=3;g.applySettings();let peak=0;
    for(const s of g.world.landmarkPlan.sites){
      g.body.position={x:s.entry.x,y:s.entry.y+7,z:s.entry.z};g.previous={...g.body.position};
      g.world.stream(g.body.position.x,g.body.position.z,3,g.yaw);
      peak=Math.max(peak,g.world.pending.size);
      if(g.world.pending.size>8)throw Error("stream generation queue exceeded existing cap");
      await new Promise(requestAnimationFrame);
    }
    return {peak};
  });
  checks.push(`eight-site burst streaming respects existing eight-request cap (peak ${burst.peak})`);
  const saved=await page.evaluate(async()=>{
    const g=window.__game,sites=g.world.landmarkPlan.sites;
    const edits=sites.map((s,i)=>[s.entry.x,Math.floor(s.entry.y),s.entry.z,i%2?9:0]);edits.push([-62,37,-430,0],[0,36,-423,20]);
    for(const [x,y,z,value] of edits){g.world.ensure(Math.floor(x/16),Math.floor(z/16));g.world.set(x,y,z,value);}
    // Explicit fixture ensures add off-screen edit columns, independently of
    // the player stream's cap. The cap is checked above on actual stream calls.
    const id=g.meta.id;if(!(await g.save()))throw Error("pending-generation save failed");return {id,edits};
  });
  await page.reload();await page.locator(`[data-action="load"][data-id="${saved.id}"]`).click();await page.waitForFunction(()=>window.__game.active);
  assert(await page.evaluate(({edits})=>{const g=window.__game;if(g.world.generatorVersion!==6||g.snapshot().generator!==6)return false;
    return edits.every(([x,y,z,value])=>{g.world.ensure(Math.floor(x/16),Math.floor(z/16),true);return g.world.get(x,y,z)===value;});},saved));
  checks.push("burst landmark travel, pending-generation edits, IndexedDB save and browser reload preserve v6 and every overlay");
  for(const version of [3,4,5]){
    const id=await page.evaluate(async version=>{const g=window.__game,{freshWorld}=await import("/src/persistence/saves.ts");
      const old=freshWorld(`Legacy v${version}`,"jade-harbor","creative");old.generator=version;old.edits={"0,35,-45":9};await g.start(old);
      if(g.snapshot().generator!==version||!(await g.save()))throw Error("legacy generator save failed");return g.meta.id;},version);
    await page.reload();await page.locator(`[data-action="load"][data-id="${id}"]`).click();await page.waitForFunction(()=>window.__game.active);
    assert(await page.evaluate(version=>{const g=window.__game;g.world.ensure(0,-3,true);return g.world.generatorVersion===version&&g.snapshot().generator===version&&g.world.get(0,35,-45)===9;},version));
    checks.push(`v${version} imported overlay and generator survive real Game save/reload`);
  }
  assert.deepEqual(errors,[]);
  await writeFile(`${output}/results.json`,JSON.stringify({status:"passed",recordedAt:new Date().toISOString(),checks,views,errors,
    fixtureNote:"Actual generated v6 terrain; spectator cameras/daylight/view distance are fixtures. No geometry injection. Queue metrics are sampled atomically before screenshots. SwiftShader point samples are not physical-GPU FPS guarantees. Temporary images are intentionally excluded from the landmark design download."},null,2));
  console.log("PASS",checks.join("; "));
} catch(error){
  if(page&&!page.isClosed())await writeFile(`${output}/failure.json`,JSON.stringify({message:String(error),views,errors,state:await page.evaluate(()=>{const g=window.__game;return {position:g?.body.position,chunks:g?.world.chunks.size,generation:g?.world.pending.size,mesh:g?.world.dirty.size,lighting:g?.lighting.pending};})},null,2));
  throw error;
} finally {await browser?.close();server.kill();}
