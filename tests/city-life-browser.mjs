import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const server=spawn(process.execPath,["node_modules/vite/bin/vite.js","--host","127.0.0.1","--port","4181","--strictPort"],{stdio:["ignore","pipe","pipe"]});
const output=process.env.LIFE_OUTPUT??"test-results/city-life-browser",checks=[],scenes=[],errors=[];
let browser,page;
const passed=name=>{checks.push(name);console.log("CHECK",name);};
try{
  await mkdir(output,{recursive:true});
  await new Promise((ok,fail)=>{server.stdout.on("data",b=>{if(b.toString().includes("Local:"))ok();});server.on("error",fail);server.on("exit",c=>fail(Error(`server ${c}`)));});
  browser=await chromium.launch({headless:true,args:["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-dev-shm-usage"]});
  page=await browser.newPage({viewport:{width:960,height:600}});page.setDefaultTimeout(90000);page.on("pageerror",e=>errors.push(e.message));
  await mkdir(output,{recursive:true});await page.addInitScript(()=>localStorage.setItem("jade-harbor-settings",JSON.stringify({distance:3,simulationDistance:4})));
  await page.goto("http://127.0.0.1:4181");await page.locator('[data-action="new"]').click();await page.locator("#world-name").fill("Living city behavioral QA");await page.locator('[data-action="create"]').click();
  await page.waitForFunction(()=>window.__game?.active);
  assert.equal(await page.evaluate(()=>window.__game.world.generatorVersion),10);
  assert.equal(await page.evaluate(()=>window.__game.entities.list.filter(e=>e.kind==="villager").length),4080);
  passed("real UI creates current v10 world with 4080 unique persistent residents");
  const fixtures=await page.evaluate(()=>{
    const g=window.__game,plan=g.entities.life.plan;
    const publicPoint=id=>plan.spaces.find(s=>s.district===id).position;
    const remote=id=>plan.residents.find(r=>r.landmark===id).workplace;
    const shop=id=>{
      const r=plan.residents.find(r=>!r.legacy&&!r.landmark&&r.district===id),p=r.workplace;
      const l=g.world.metropolisPlan.lots.find(l=>p.x>=l.x1&&p.x<=l.x2+1&&p.z>=l.z1&&p.z<=l.z2+1);
      if(!l)return {point:p};const d={x:l.entrance.x+.5-p.x,z:l.entrance.z+.5-p.z},n=Math.hypot(d.x,d.z)||1;
      return {point:p,camera:{x:l.entrance.x+.5+d.x/n*5,y:p.y+.3,z:l.entrance.z+.5+d.z/n*5}};
    };
    return [
      {name:"panda-day",point:publicPoint("heritage"),hour:11,capture:true},
      {name:"morning-market",...shop("market"),hour:9,capture:true},
      {name:"harbor-day",point:publicPoint("harbor"),hour:8,follow:true},
      {name:"palace-activity",point:remote("imperial-complex"),hour:15,follow:true},
      {name:"garden-calm",point:remote("scenic-landscape"),hour:16,capture:true,follow:true},
      {name:"ridge-watch",point:remote("ridge-fortification"),hour:15,capture:true},
      {name:"cliff-visitor",point:remote("cliff-grotto"),hour:13},
      {name:"panda-evening",point:publicPoint("heritage"),hour:18},
      {name:"nightlife-evening",point:publicPoint("nightlife"),hour:20,capture:true,follow:true},
      {name:"hutong-return",...shop("hutong"),hour:22,follow:true},
    ];
  });
  async function settled(point){
    const ready=await page.waitForFunction(point=>{
      const g=window.__game,cx=Math.floor(g.body.position.x/16),cz=Math.floor(g.body.position.z/16),r=g.settings.distance;
      for(let z=-r;z<=r;z++)for(let x=-r;x<=r;x++)if(x*x+z*z<=(r+.5)**2&&!g.world.chunks.has(`${cx+x},${cz+z}`))return false;
      if(g.world.pending.size||g.world.dirty.size||g.lighting.pending||!g.view.groups.get(`${Math.floor(point.x/16)},${Math.floor(point.z/16)}`)?.children.length)return false;
      return {chunks:g.world.chunks.size,triangles:g.view.worldRenderStats.triangles,drawCalls:g.view.worldRenderStats.calls,frame:g.view.metrics.summary("frame"),tick:g.view.metrics.summary("tick"),fps:g.fps};
    },point,{timeout:240000});
    const result=await ready.jsonValue();await ready.dispose();return result;
  }
  async function view(fixture){
    console.log("VISIT",fixture.name);
    await page.evaluate(f=>{
      const g=window.__game,p=f.camera??{x:f.point.x+12,y:f.point.y+5,z:f.point.z+16};
      g.mode="spectator";g.body.flying=true;g.body.position={...p};g.previous={...p};g.body.velocity={x:0,y:0,z:0};g.input.keys.clear();g.input.onLook=undefined;
      g.settings.distance=3;g.applySettings();g.time=((f.hour-6)/24+1)%1;g.simulation.weather="clear";g.simulation.weatherTimer=180;g.entities.weather="clear";
      const dx=f.point.x-p.x,dz=f.point.z-p.z,dy=f.point.y+1.2-p.y-1.62;g.yaw=Math.atan2(-dx,-dz);g.pitch=Math.atan2(dy,Math.hypot(dx,dz));
      // Pause only while streaming/lighting settle. The camera is an authored
      // test fixture; actor positions and geometry are never injected.
      g.view.camera.position.set(p.x,p.y+1.61,p.z);g.view.camera.rotation.set(g.pitch,g.yaw,0,"YXZ");
      g.ui.show("pause","");g.ui.overlay.style.display="none";
    },fixture);
    await settled(fixture.point);
    console.log("READY",fixture.name);
    const activity=await page.evaluate(hour=>{
      const g=window.__game;g.time=((hour-6)/24+1)%1;const before=new Map(g.entities.list.map(e=>[e.id,{...e.body.position}])),last=new Map(before),walked=new Map(g.entities.list.map(e=>[e.id,0]));
      // Controlled time advancement uses real fixed-tick navigation, collision,
      // door interaction and schedules. No actor positions/geometry are injected.
      for(let i=0;i<800;i++){g.time=(g.time+.05/1200)%1;g.entities.tick(.05,g.body.position,g.inventory,g.time,false,()=>{},()=>{});for(const e of g.entities.list){const p=last.get(e.id);if(p)walked.set(e.id,(walked.get(e.id)??0)+Math.hypot(e.body.position.x-p.x,e.body.position.z-p.z));last.set(e.id,{...e.body.position});}}
      return {residents:g.entities.list.filter(e=>e.kind==="villager").length,unique:new Set(g.entities.list.map(e=>e.id)).size,total:g.entities.list.length,
        nearby:g.entities.list.filter(e=>e.kind==="villager"&&Math.hypot(e.body.position.x-g.body.position.x,e.body.position.z-g.body.position.z)<48).map(e=>({id:e.id,name:e.name,state:e.state,profession:e.profession,position:e.body.position,walked:walked.get(e.id),moved:Math.hypot(e.body.position.x-before.get(e.id).x,e.body.position.z-before.get(e.id).z)})),
        life:g.entities.life.metrics,event:g.entities.life.event?{id:g.entities.life.event.id,participants:g.entities.life.event.participants}:null,
        navAgents:g.entities.navigation.agents.size,pathNodes:[...g.entities.navigation.agents.values()].reduce((n,a)=>n+a.path.length,0),nodes:g.entities.navigation.expandedLastTick};
    },fixture.hour);
    console.log("ACTIVITY",fixture.name);
    await settled(fixture.point);
    const framing=fixture.follow?await page.evaluate(async id=>{
      const g=window.__game,{raycast}=await import("/src/player/raycast.ts"),actor=g.entities.list.find(e=>e.id===id);
      if(!actor)throw Error("missing observed resident for camera");
      const target={...actor.body.position,y:actor.body.position.y+1.1};
      // Pick a clear camera ray around the observed actor; never move the actor.
      const offsets=[[7,6],[7,-6],[-7,6],[-7,-6],[0,7],[0,-7],[7,0],[-7,0],[4,3],[-4,3],[4,-3],[-4,-3],[2,0],[-2,0],[0,2],[0,-2],[1.5,1],[-1.5,1],[1.5,-1],[-1.5,-1]];
      for(const height of [1.8,3.2])for(const [x,z] of offsets){
        const eye={x:target.x+x,y:actor.body.position.y+height,z:target.z+z},dx=target.x-eye.x,dy=target.y-eye.y,dz=target.z-eye.z,n=Math.hypot(dx,dy,dz);
        if(!g.world.loaded(eye.x,eye.z)||raycast(g.world.get.bind(g.world),eye,{x:dx/n,y:dy/n,z:dz/n},n-.35))continue;
        const p={...eye,y:eye.y-1.61};g.body.position=p;g.previous={...p};g.body.velocity={x:0,y:0,z:0};
        g.yaw=Math.atan2(-dx,-dz);g.pitch=Math.atan2(dy,Math.hypot(dx,dz));g.view.camera.position.set(eye.x,eye.y,eye.z);g.view.camera.rotation.set(g.pitch,g.yaw,0,"YXZ");
        return {actor:id,eye,target};
      }
      throw Error("no clear camera ray to observed resident");
    },activity.nearby[0]?.id):null;
    if(framing)await settled(framing.target);
    await page.evaluate(async()=>{const g=window.__game,{Metrics}=await import("/src/core/metrics.ts");g.view.metrics=new Metrics();g.ui.overlay.style.display="";g.ui.show("none");});
    await page.waitForFunction(()=>window.__game.view.metrics.summary("frame").count>=20,null,{timeout:90000});
    const render=await page.evaluate(()=>{const g=window.__game;return {chunks:g.world.chunks.size,generation:g.world.pending.size,meshQueue:g.world.dirty.size,lightingPending:g.lighting.pending,triangles:g.view.worldRenderStats.triangles,drawCalls:g.view.worldRenderStats.calls,frame:g.view.metrics.summary("frame"),tick:g.view.metrics.summary("tick"),fps:g.fps};});
    assert(render.generation<=8);assert(render.meshQueue<512,"active simulation keeps a bounded mesh backlog");
    assert.equal(activity.residents,4080);assert.equal(activity.unique,activity.total);assert(activity.life.active<=96);assert(activity.navAgents<=102);assert(activity.nodes<=96);assert(activity.nearby.length>0,`${fixture.name}: no resident near the actual activity`);
    if(fixture.capture||process.env.LIFE_ALL_CAPTURES==="1")await page.screenshot({path:`${output}/${fixture.name}.png`});
    const row={name:fixture.name,hour:fixture.hour,...render,...activity,framing};scenes.push(row);console.log("OBSERVED",JSON.stringify(row));
    await writeFile(`${output}/progress.json`,JSON.stringify({scenes,checks,errors},null,2));
  }
  for(const f of fixtures.filter(f=>!process.env.LIFE_SCENES||process.env.LIFE_SCENES.split(",").includes(f.name))){
    await view(f);
    if(f.name==="panda-evening"){
      assert(await page.evaluate(()=>!!window.__game.entities.life.event),"evening plaza must have an observed gathering");
      await page.evaluate(()=>{const g=window.__game;g.simulation.weather="rain";g.entities.weather="rain";for(let i=0;i<25;i++)g.entities.tick(.05,g.body.position,g.inventory,g.time,false,()=>{},()=>{});});
      assert(await page.evaluate(()=>!window.__game.entities.life.event));passed("rain cancels the observed evening plaza gathering");
      const rainFrame=await page.evaluate(()=>window.__game.view.metrics.summary("frame").count);
      await page.waitForFunction(n=>window.__game.view.metrics.summary("frame").count>=n+6,rainFrame,{timeout:90000});
      assert.equal(await page.evaluate(()=>window.__game.simulation.weather),"rain");
      await page.screenshot({path:`${output}/panda-rain.png`});
    }
  }
  if(scenes.length)assert(scenes.some(s=>s.nearby.some(e=>e.moved>.5)),"residents must actually move");
  passed(`observed ${scenes.length} selected behavioral scenes across day/night and districts`);
  // Clear/rain response cancels transient outdoor gathering without adding NPCs.
  await page.evaluate(()=>{const g=window.__game;g.simulation.weather="rain";g.entities.weather="rain";for(let i=0;i<25;i++)g.entities.tick(.05,g.body.position,g.inventory,g.time,false,()=>{},()=>{});});
  assert(await page.evaluate(()=>!window.__game.entities.life.event));passed("rain safely cancels outdoor gatherings");
  // Establish an actual on-foot walk before the grounded discovery fixtures.
  // Hub travel/load suppress passive discovery until real local walking occurs.
  await page.evaluate(async()=>{const g=window.__game;g.mode="creative";if(!(await g.travelTo("district:heritage")))throw Error("heritage walk setup failed");g.yaw=0;g.pitch=0;});
  await page.locator("canvas#game").click();await page.waitForFunction(()=>window.__game.input.locked);const discoveryWalk=await page.evaluate(()=>({...window.__game.body.position}));
  await page.keyboard.down("KeyW");await page.waitForFunction(p=>Math.hypot(window.__game.body.position.x-p.x,window.__game.body.position.z-p.z)>=2.3,discoveryWalk);await page.keyboard.up("KeyW");
  // Physical arrival fixtures exercise the real Game tick and discovery feedback.
  const entries=await page.evaluate(()=>window.__game.discoveries.entries);
  for(const d of entries){
    console.log("DISCOVER",d.id);
    await page.evaluate(p=>{const g=window.__game;g.settings.distance=2;g.applySettings();g.ui.show("none");g.mode="spectator";g.body.flying=true;g.body.position={...p,y:p.y+4};g.previous={...g.body.position};g.body.velocity={x:0,y:0,z:0};},d.position);
    await page.waitForFunction(p=>{const w=window.__game.world;for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++)if(!w.loaded(p.x+x*16,p.z+z*16))return false;return true;},d.position,{timeout:90000});
    await page.evaluate(p=>{const g=window.__game;g.settings.distance=2;g.applySettings();g.ui.show("none");g.mode="creative";g.body.flying=false;g.body.grounded=false;g.body.position={...p};g.previous={...p};g.body.velocity={x:0,y:0,z:0};g.body.fallStart=p.y;g.input.keys.clear();},d.position);
    await page.waitForFunction(id=>window.__game.discoveries.has(id),d.id,{timeout:90000});
  }
  assert.equal(await page.evaluate(()=>window.__game.discoveries.count),33);passed("all thirty-three discoveries trigger through actual grounded Game ticks, including upper decks, pit and side routes");
  // One real input walk and one real right-click trade in the protected plaza.
  const traderId=await page.evaluate(()=>`citizen:${window.__game.meta.seed}:heritage:min`);
  await page.evaluate(()=>window.__game.inventory.add(111,5));
  let merchantOpened=false;
  for(let attempt=0;attempt<5&&!merchantOpened;attempt++) {
    if(await page.evaluate(()=>window.__game.ui.screen!=="none")){await page.keyboard.press("Escape");await page.waitForFunction(()=>window.__game.ui.screen==="none");}
    if(await page.evaluate(()=>!window.__game.input.locked)){await page.locator("canvas#game").click();await page.waitForFunction(()=>window.__game.input.locked);}
    await page.evaluate(id=>{const g=window.__game,e=g.entities.list.find(e=>e.id===id),position=e.body.position;g.settings.distance=3;g.applySettings();g.time=.24;g.simulation.weather="clear";g.entities.weather="clear";g.body.position={x:position.x+2,y:position.y,z:position.z};g.previous={...g.body.position};g.body.velocity={x:0,y:0,z:0};g.body.flying=false;g.yaw=Math.PI/2;g.pitch=-.18;},traderId);
    await page.waitForFunction(id=>window.__game.entityHit?.id===id,traderId,{timeout:90000});
    await page.mouse.click(480,300,{button:"right"});
    await page.waitForFunction(()=>window.__game.ui.screen==="trade",null,{timeout:5000});
    merchantOpened=await page.evaluate(id=>window.__game.tradeEntity?.id===id,traderId);
  }
  assert(merchantOpened,"Actual right-click must open the intended moving merchant");
  await page.locator('[data-action="trade"][data-id="2"]').waitFor();
  const beforeTrade=await page.evaluate(()=>({tokens:window.__game.inventory.count(111),food:window.__game.inventory.count(105)}));
  await page.locator('[data-action="trade"][data-id="2"]').click();
  assert(await page.evaluate(b=>window.__game.inventory.count(111)===b.tokens-1&&window.__game.inventory.count(105)===b.food+3,beforeTrade));passed("real right-click profession panel and existing trade transfer remain valid");
  await page.keyboard.press("Escape");await page.waitForFunction(()=>window.__game.ui.screen==="none");
  await page.waitForTimeout(600);await page.locator("canvas#game").click();await page.waitForFunction(()=>window.__game.input.locked);
  const beforeWalk=await page.evaluate(()=>({...window.__game.body.position}));
  await page.keyboard.down("KeyS");await page.waitForTimeout(1200);await page.keyboard.up("KeyS");
  assert(await page.evaluate(p=>Math.hypot(window.__game.body.position.x-p.x,window.__game.body.position.z-p.z)>.2,beforeWalk));passed("real walking input works during living-city play");
  const saved=await page.evaluate(async()=>{const g=window.__game;if(!(await g.save()))throw Error("living-city save failed");return {id:g.meta.id,ids:g.entities.list.filter(e=>e.kind==="villager").map(e=>e.id).sort(),flags:g.snapshot().achievements,food:g.inventory.count(105)};});
  await page.reload();await page.locator(`[data-action="load"][data-id="${saved.id}"]`).click();await page.waitForFunction(()=>window.__game.active);
  assert(await page.evaluate(s=>{const g=window.__game;return g.world.generatorVersion===10&&g.discoveries.count===33&&g.inventory.count(105)===s.food&&JSON.stringify(g.entities.list.filter(e=>e.kind==="villager").map(e=>e.id).sort())===JSON.stringify(s.ids);},saved));
  passed("browser restart preserves discoveries, traded inventory, generator and all persistent resident identities");
  await page.keyboard.press("Escape");await page.locator('[data-action="journal"]').click();await page.getByText("33 / 33 places discovered").waitFor();
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await page.locator('[data-action="back"]').click();await page.setViewportSize({width:960,height:600});passed("travel journal is readable at narrow width and returns to Pause");
  // Rapid travel with active queues, repeated loads, real saves and a final return.
  const roam=[];
  for(let lap=0;lap<2;lap++)for(const s of await page.evaluate(()=>window.__game.world.landmarkPlan.sites.map(s=>s.entry))){
    await page.evaluate(p=>{const g=window.__game;g.ui.show("none");g.settings.distance=2;g.applySettings();g.body.flying=true;g.body.position={x:p.x,y:p.y+6,z:p.z};g.previous={...g.body.position};g.time=(g.time+.07)%1;for(const key of g.world.stream(p.x,p.z,2))g.view.remove(key);},s);
    await page.waitForFunction(p=>window.__game.world.loaded(p.x,p.z),s,{timeout:90000});
    const row=await page.evaluate(async()=>{const g=window.__game;for(let i=0;i<50;i++)g.entities.tick(.05,g.body.position,g.inventory,g.time,false,()=>{},()=>{});if(!(await g.save()))throw Error("roam save failed");return {residents:g.entities.list.filter(e=>e.kind==="villager").length,unique:new Set(g.entities.list.map(e=>e.id)).size,total:g.entities.list.length,nav:g.entities.navigation.agents.size,chunks:g.world.chunks.size,event:g.entities.life.event?.participants.length??0,pending:g.world.pending.size,geometries:g.view.renderer.info.memory.geometries};});
    assert.equal(row.residents,4080);assert.equal(row.unique,row.total);assert(row.nav<=102);assert(row.chunks<200);assert(row.event<=3);assert(row.pending<=8);roam.push(row);
  }
  passed("sixteen rapid landmark visits with real saves retain bounded identities, routes, events and chunks");
  const compatibilityIds=new Map();
  for(const version of [3,4,5,6,7,8,9]){
    const id=await page.evaluate(async version=>{
      const g=window.__game,{freshWorld}=await import("/src/persistence/saves.ts");const old=freshWorld(`Compatibility ${version}`,"jade-harbor","creative");old.generator=version;
      if(version===6){const {residents}=await import("/src/game/professions.ts"),{spawnEntity}=await import("/src/game/entities.ts");old.simulation={entities:residents(old.seed,g.world.cityPlan).map(r=>({...spawnEntity("villager",r.home,r.name),...r})),drops:[]};}
      await g.start(old);if(!(await g.save()))throw Error("compatibility save failed");return g.meta.id;
    },version);
    compatibilityIds.set(version,id);
    // District records are now supported in released city worlds too. Their
    // existing spawn is on Avenue, so settle that legitimate walking visit
    // before comparing the exact saved discovery set across reload.
    if(version>=6){
      await page.locator("canvas#game").click();await page.waitForFunction(()=>window.__game.input.locked);const p=await page.evaluate(()=>({...window.__game.body.position}));
      await page.keyboard.down("KeyW");await page.waitForFunction(p=>Math.hypot(window.__game.body.position.x-p.x,window.__game.body.position.z-p.z)>=2.3,p);await page.keyboard.up("KeyW");
      await page.waitForFunction(()=>window.__game.discoveries.has("discovery:district:avenue"));
    }
    const savedDiscoveries=await page.evaluate(async()=>{const g=window.__game;g.pause();if(!(await g.save()))throw Error("compatibility discovery save failed");return[...g.achievements].filter(id=>id.startsWith("discovery:")).sort();});
    await page.reload();await page.locator(`[data-action="load"][data-id="${id}"]`).click();await page.waitForFunction(()=>window.__game.active);
    const reopened=await page.evaluate(()=>{const g=window.__game;return{generator:g.world.generatorVersion,residents:g.entities.list.filter(e=>e.kind==="villager").length,discoveries:[...g.achievements].filter(id=>id.startsWith("discovery:")).sort()};});
    assert.equal(reopened.generator,version);assert.equal(reopened.residents,version>=9?4080:version===8?4000:version===7?960:version===6?36:10);assert.deepEqual(reopened.discoveries,savedDiscoveries);
    passed(`v${version} save/reload preserves generator and ${version===9?"the released 4,080-resident state":version===8?"the released 4,000-resident state":version===7?"the released 960-resident state":version===6?"extends the old ten-resident state once":"the original ten-resident state"}`);
  }
  // Exercise all four actual menu upgrade paths; the source slots remain frozen.
  for(const version of[6,7,8,9]) {
    await page.keyboard.press("Escape");await page.locator('[data-action="menu"]').click();
    await page.locator(`[data-action="load"][data-id="${compatibilityIds.get(version)}"]`).click();await page.waitForFunction(()=>window.__game.active);
    const source=await page.evaluate(async()=>{const g=window.__game;g.inventory.add(111,3);g.world.ensure(1,1,true);g.world.set(20,25,20,5);if(!(await g.save()))throw Error("copy source save failed");return{id:g.meta.id,tokens:g.inventory.count(111),ids:g.entities.list.filter(e=>e.kind==="villager").map(e=>e.id).sort()};});
    await page.keyboard.press("Escape");await page.locator('[data-action="menu"]').click();await page.locator(`[data-action="dense-city-copy"][data-id="${source.id}"]`).click();
    await page.getByText(`Compatibility ${version} (dense city)`,{exact:true}).waitFor();
    const copy=await page.evaluate(async({source,version})=>{const {listSaves,loadSave}=await import("/src/persistence/saves.ts");const summary=(await listSaves()).find(s=>s.name===`Compatibility ${version} (dense city)`),old=await loadSave(source.id),dense=await loadSave(summary.id);if(old.generator!==version||dense.generator!==10||old.id===dense.id||dense.edits["20,25,20"]!==5||JSON.stringify(old.simulation.entities.filter(e=>e.kind==="villager").map(e=>e.id).sort())!==JSON.stringify(source.ids))throw Error("copy identity or edit regression");return{id:dense.id};},{source,version});
    await page.locator(`[data-action="load"][data-id="${copy.id}"]`).click();await page.waitForFunction(()=>window.__game.active);
    assert(await page.evaluate(source=>{const g=window.__game,ids=new Set(g.entities.list.map(e=>e.id));return g.world.generatorVersion===10&&g.entities.list.filter(e=>e.kind==="villager").length===4080&&g.inventory.count(111)===source.tokens&&source.ids.every(id=>ids.has(id));},source));
    passed(`world-list denser-city copy preserves the v${version} original, overlay, inventory and identities in an explicit v10 save`);
  }
  assert.deepEqual(errors,[]);
  await writeFile(`${output}/results.json`,JSON.stringify({status:"passed",checks,scenes,roam,errors,fixtureNote:"Actual generated world and existing renderer. Camera/time/arrival fixtures accelerate QA. Normal ticks pause while geometry/light queues settle, then actual NPC fixed ticks advance behavior and twenty live rendered frames measure the running game; active water/NPC remeshing is bounded rather than required to stop. Controlled fixed ticks use real movement/navigation/doors; actor positions are not staged for visual scenes. Discovery arrival fixtures use grounded Game ticks. Trade and a representative walk use real input. Temporary screenshots stay outside the intermediate artifact. No full uninterrupted 30-minute real-time walk or hardware FPS guarantee is claimed."},null,2));
  console.log("PASS",checks.join("; "));
}catch(error){
  await writeFile(`${output}/failure.json`,JSON.stringify({error:String(error),checks,scenes,errors,state:page&&!page.isClosed()?await page.evaluate(()=>{const g=window.__game;return {position:g?.body.position,screen:g?.ui.screen,discovered:g?.discoveries?.count,pending:g?.world.pending.size,dirty:g?.world.dirty.size};}):null},null,2));throw error;
}finally{await browser?.close();server.kill();}
