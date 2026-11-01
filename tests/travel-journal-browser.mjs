import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile,readFile,access} from "node:fs/promises";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {verifyReleaseManifest} from "../scripts/release-integrity.mjs";

const output=process.env.JOURNAL_OUTPUT??"test-results/travel-journal",selected=process.env.JOURNAL_DESTINATIONS?.split(","),verify=process.env.JOURNAL_VERIFY_DIST!=="0",captures=process.env.JOURNAL_CAPTURES!=="0",seeds=(process.env.JOURNAL_SEEDS??"jade-harbor,different-city").split(",");
if(verify)verifyReleaseManifest();
const source=verify?createHash("sha256").update(JSON.stringify(JSON.parse(await readFile("dist/release-integrity.json","utf8")).source)).digest("hex"):null;
const harness=createHash("sha256").update(await readFile(new URL(import.meta.url))).digest("hex");
const resumed=process.env.JOURNAL_RESUME==="1",completed=new Map();
const previous=resumed?JSON.parse(await readFile(`${output}/progress.json`,"utf8")):null;
if(resumed){
  assert(verify&&!selected&&captures,"Resume requires the full verified capture matrix");assert.equal(previous.source,source,"Cannot reuse visits from another application build");assert.equal(previous.harness,harness,"Cannot reuse captures from another QA fixture revision");assert.deepEqual(previous.errors,[]);
  for(const record of previous.records){const key=`${record.seed}:${record.destination.id}`;assert(seeds.includes(record.seed));assert(!completed.has(key),"Duplicate resumed visit");for(const kind of["street","overview"])await access(`${output}/${seeds.indexOf(record.seed)}-${record.destination.id.replace(":","-")}-${kind}.png`);completed.set(key,record);}
  console.log("RESUMED",completed.size,"completed creative visits and paired captures from the identical verified build");
}
const server=spawn(process.execPath,["node_modules/vite/bin/vite.js","--host","127.0.0.1","--port","4187","--strictPort"],{stdio:["ignore","pipe","pipe"]});
let browser,page;const records=previous?[...previous.records]:[],errors=[],spectatorVisits=[];
try {
  await mkdir(output,{recursive:true});await new Promise((ok,fail)=>{server.stdout.on("data",b=>{if(b.toString().includes("Local:"))ok();});server.on("error",fail);server.on("exit",c=>fail(Error(`server ${c}`)));});
  browser=await chromium.launch({headless:true,args:["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-dev-shm-usage"]});
  page=await browser.newPage({viewport:{width:960,height:600}});page.setDefaultTimeout(180000);page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem("jade-harbor-settings",JSON.stringify({graphicsQuality:'high',distance:3,simulationDistance:4})));
  await page.goto("http://127.0.0.1:4187");await page.locator('[data-action="new"]').click();await page.locator('[data-action="create"]').click();await page.waitForFunction(()=>window.__game?.active);
  const open=async()=>{await page.evaluate(()=>{const g=window.__game;g.pause();});await page.locator('[data-action="journal"]').click();};
  for(const seed of seeds) {
    await page.evaluate(async seed=>{const {freshWorld}=await import("/src/persistence/saves.ts");await window.__game.start(freshWorld("generator 10 journal QA",seed,"creative"));const g=window.__game;g.time=(10-6)/24;g.simulation.weather="clear";g.simulation.weatherTimer=900;},seed);
    await page.evaluate(()=>{const g=window.__game,toast=g.ui.toast.bind(g.ui);window.__travelToasts=[];g.ui.toast=(message,...rest)=>{window.__travelToasts.push(message);return toast(message,...rest);};});
    const registry=await page.evaluate(async()=>{const{travelDestinations}=await import("/src/game/city-life/travel.ts");return travelDestinations(window.__game.world);});
    assert(registry.length>0);assert.equal(new Set(registry.map(d=>d.id)).size,registry.length);assert.equal(registry.length,18);assert.equal(await page.evaluate(()=>window.__game.discoveries.entries.length),33);
    await open();assert.equal(await page.locator(".journal-hub").count(),18);assert.equal(await page.locator(".journal-hub li").count(),33);assert.equal(await page.locator('[data-action="travel"]').count(),18);
    for(const d of registry.filter(d=>!selected||selected.includes(d.id))) {
      const saved=completed.get(`${seed}:${d.id}`);if(saved){assert.deepEqual(saved.destination,d,"Resumed destination changed");continue;}
      console.log("TRAVEL",seed,d.id);await open();const started=Date.now();
      assert.equal(await page.locator(`[data-action="travel"][data-id="${d.id}"]`).isEnabled(),true);
      await page.locator(`[data-action="travel"][data-id="${d.id}"]`).click();
      await page.waitForFunction(()=>!window.__game?.travelState);
      const outcome=await page.evaluate(()=>({screen:window.__game.ui.screen,toasts:window.__travelToasts,p:window.__game.body.position,travel:window.__game.travelMetrics.at(-1)}));assert.equal(outcome.screen,"none",JSON.stringify(outcome));assert.equal(outcome.travel.id,d.id);assert.equal(outcome.travel.success,true);assert(outcome.travel.ms<=3000,`Slow arrival ${d.id}: ${outcome.travel.ms}`);
      const ticks=await page.evaluate(()=>window.__game.tickCount);await page.waitForFunction(t=>window.__game.tickCount>=t+20,ticks);
      const state=await page.evaluate(async()=>{const g=window.__game,{collides}=await import("/src/player/physics.ts"),{idOf}=await import("/src/core/coords.ts"),{B}=await import("/src/world/blocks.ts");return{position:{...g.body.position},yaw:g.yaw,pitch:g.pitch,version:g.world.generatorVersion,health:g.health,collision:collides(g.world,g.body.position),water:idOf(g.world.get(g.body.position.x,g.body.position.y,g.body.position.z))===B.Water,residents:g.entities.list.filter(e=>e.kind==="villager").length,total:g.entities.list.length,unique:new Set(g.entities.list.map(e=>e.id)).size,active:g.entities.life.active.size,routes:g.entities.navigation.agents.size,nodes:g.entities.navigation.expandedLastTick,pending:g.world.pending.size,chunks:g.world.chunks.size,frame:g.view.metrics.summary("frame")};});
      assert.equal(state.version,10);assert.equal(state.collision,false);assert.equal(state.water,false);assert.equal(state.unique,state.total);assert.equal(state.residents,4080);assert(state.active<=96);assert(state.nodes<=96);assert(state.routes<=102);assert(state.pending<=8);assert(state.chunks<=256);assert(Math.abs(state.position.y-d.arrival.y)<2);
      if(captures)await page.screenshot({path:`${output}/${seeds.indexOf(seed)}-${d.id.replace(":","-")}-street.png`});
      const record={seed,destination:d,state,travel:outcome.travel,travelMs:outcome.travel.ms,driverAndSettlingMs:Date.now()-started};
      if(captures) {
        await page.evaluate(d=>{const g=window.__game;g.pause();const p={x:d.focus.x+25,y:Math.max(d.arrival.y,d.focus.y)+32,z:d.focus.z+34};g.body.position={...p};g.previous={...p};g.body.flying=true;g.yaw=Math.atan2(-(d.focus.x-p.x),-(d.focus.z-p.z));g.pitch=Math.atan2(d.focus.y-p.y-1.61,Math.hypot(d.focus.x-p.x,d.focus.z-p.z));g.view.camera.position.set(p.x,p.y+1.61,p.z);g.view.camera.rotation.set(g.pitch,g.yaw,0,"YXZ");for(const key of g.world.stream(p.x,p.z,3))g.view.remove(key);for(let z=-3;z<=3;z++)for(let x=-3;x<=3;x++)if(x*x+z*z<=12.25)g.world.ensure(Math.floor(p.x/16)+x,Math.floor(p.z/16)+z,true);g.lighting.rebuild();for(let i=0;i<512&&g.world.dirty.size;i++)g.view.rebuild(g.world,6);g.ui.overlay.style.display="none";},d);
        await page.screenshot({path:`${output}/${seeds.indexOf(seed)}-${d.id.replace(":","-")}-overview.png`});await page.evaluate(()=>{window.__game.ui.overlay.style.display="";});
      }
      records.push(record);await writeFile(`${output}/progress.json`,JSON.stringify({source,harness,records,errors},null,2));
    }
  }
  if(!selected) {
    // Real UI keeps normal-mode destinations locked until the same saved
    // discovery component records a supported foot visit.
    await page.evaluate(()=>{const g=window.__game;g.mode="survival";for(const id of [...g.achievements])if(id.startsWith("discovery:"))g.achievements.delete(id);});await open();assert.equal(await page.locator('[data-action="travel"]:enabled').count(),0);
    assert.equal(await page.evaluate(()=>window.__game.travelTo("district:market")),false);
    await page.evaluate(async()=>{const g=window.__game,{travelDestinations}=await import("/src/game/city-life/travel.ts"),d=travelDestinations(g.world).find(d=>d.id==="district:market");for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++)g.world.ensure(Math.floor(d.arrival.x/16)+x,Math.floor(d.arrival.z/16)+z,true);g.discoveries.visit(d.arrival,true);});
    await open();assert.equal(await page.locator('[data-action="travel"][data-id="district:market"]').isEnabled(),true);
    await page.locator('[data-action="travel"][data-id="district:market"]').click();await page.waitForFunction(()=>!window.__game.travelState&&window.__game.ui.screen==="none");
    const checkpoint=await page.evaluate(async()=>{const g=window.__game;g.pause();g.world.set(-247,28,-215,48);if(!(await g.save()))throw Error("save failed");return{id:g.meta.id,position:{...g.body.position},ids:g.entities.list.map(e=>e.id).sort(),achievements:[...g.achievements]};});
    await page.reload();await page.locator(`[data-action="load"][data-id="${checkpoint.id}"]`).click();await page.waitForFunction(()=>window.__game?.active);
    const reopened=await page.evaluate(()=>{const g=window.__game;return{ids:g.entities.list.map(e=>e.id).sort(),achievements:[...g.achievements],edit:g.world.edits.get("-247,28,-215"),position:{...g.body.position}};});assert.deepEqual(reopened.ids,checkpoint.ids);assert.deepEqual(reopened.achievements,checkpoint.achievements);assert.equal(reopened.edit,48);assert(Math.hypot(reopened.position.x-checkpoint.position.x,reopened.position.z-checkpoint.position.z)<.1);
    for(const seed of seeds) {
      await page.evaluate(async seed=>{const {freshWorld}=await import("/src/persistence/saves.ts");await window.__game.start(freshWorld("Spectator journal matrix",seed,"spectator"));},seed);
      await open();assert.equal(await page.locator('[data-action="travel"]:disabled').count(),0);
      const spectatorRegistry=await page.evaluate(async()=>{const{travelDestinations}=await import("/src/game/city-life/travel.ts");return travelDestinations(window.__game.world);});
      assert.equal(await page.locator('.journal-list article').count(),spectatorRegistry.length);assert.equal(await page.locator('[data-action="travel"]').count(),spectatorRegistry.length);
      for(const d of spectatorRegistry){
        console.log("SPECTATOR",seed,d.id);await open();await page.locator(`[data-action="travel"][data-id="${d.id}"]`).click();await page.waitForFunction(()=>!window.__game.travelState);
        const state=await page.evaluate(async()=>{const g=window.__game,{collides}=await import("/src/player/physics.ts"),{idOf}=await import("/src/core/coords.ts"),{B}=await import("/src/world/blocks.ts");return{screen:g.ui.screen,mode:g.mode,position:{...g.body.position},flying:g.body.flying,total:g.entities.list.length,unique:new Set(g.entities.list.map(e=>e.id)).size,active:g.entities.life.active.size,collision:collides(g.world,g.body.position),water:idOf(g.world.get(g.body.position.x,g.body.position.y,g.body.position.z))===B.Water,travel:g.travelMetrics.at(-1)};});
        assert.equal(state.screen,"none");assert.equal(state.mode,"spectator");assert.equal(state.flying,true);assert.equal(state.total,state.unique);assert(state.active<=96);assert.equal(state.collision,false);assert.equal(state.water,false);assert.equal(state.travel.success,true);assert(state.travel.ms<=3000);assert(Math.hypot(state.position.x-d.arrival.x,state.position.z-d.arrival.z)<=8);spectatorVisits.push({seed,id:d.id,state});
      }
    }
    // Old member-only discoveries unlock their area after a real save/reload.
    for(const mode of ["survival","adventure","hardcore"]){
      await page.evaluate(mode=>{const g=window.__game;g.mode=mode;for(const id of [...g.achievements])if(id.startsWith("discovery:"))g.achievements.delete(id);g.achievements.add("discovery:quay-walk");g.achievements.add("discovery:sanctuary-overlook");},mode);
      await open();assert.equal(await page.locator('[data-action="travel"]:enabled').count(),2);assert(await page.locator('[data-id="district:harbor"][data-action="travel"]').isEnabled());assert(await page.locator('[data-id="area:western-highlands"][data-action="travel"]').isEnabled());
      await page.locator('[data-id="district:harbor"][data-action="travel"]').click();await page.waitForFunction(()=>!window.__game.travelState);
      const t=await page.evaluate(()=>window.__game.tickCount);await page.waitForFunction(t=>window.__game.tickCount>=t+20,t);
      assert.deepEqual(await page.evaluate(()=>[...window.__game.achievements].filter(id=>id.startsWith("discovery:")).sort()),["discovery:quay-walk","discovery:sanctuary-overlook"]);
    }
    const legacy=await page.evaluate(async()=>{const g=window.__game;g.pause();if(!(await g.save()))throw Error("member save failed");return g.meta.id;});
    await page.reload();await page.locator(`[data-action="load"][data-id="${legacy}"]`).click();await page.waitForFunction(()=>window.__game.active);await open();assert.equal(await page.locator('[data-action="travel"]:enabled').count(),2);
    await page.evaluate(()=>{window.__game.mode="creative";});
    const spam=await page.evaluate(async()=>{const g=window.__game;const first=g.travelTo("region:willow-tulou");const rejected=await Promise.all(Array.from({length:12},()=>g.travelTo("district:highland")));return{first:await first,rejected,unique:new Set(g.entities.list.map(e=>e.id)).size,total:g.entities.list.length};});assert.equal(spam.first,true);assert(spam.rejected.every(x=>x===false));assert.equal(spam.unique,spam.total);
    await page.evaluate(async()=>{const g=window.__game;const pending=g.travelTo("region:li-stone-walk");g.key("Escape");if(await pending)throw Error("Cancelled travel committed");if(g.travelState)throw Error("Cancelled travel left a lock");});
    const replacement=await page.evaluate(async()=>{const g=window.__game;const cancelled=g.travelTo("district:highland");g.key("Escape");const next=g.travelTo("district:market");return{cancelled:await cancelled,next:await next};});assert.equal(replacement.cancelled,false);assert.equal(replacement.next,true);
    const afterReplacement=await page.evaluate(()=>({...window.__game.body.position}));await page.waitForTimeout(1200);assert(await page.evaluate(p=>Math.hypot(window.__game.body.position.x-p.x,window.__game.body.position.z-p.z)<1,afterReplacement),"A cancelled request must never roll back a newer arrival");
    const failureCases=await page.evaluate(async()=>{
      const g=window.__game,{freshWorld}=await import("/src/persistence/saves.ts"),{travelDestinations,travelColumns}=await import("/src/game/city-life/travel.ts"),{B}=await import("/src/world/blocks.ts");
      await g.start(freshWorld("Arrival fallback and deadline fixture","jade-harbor","creative"));g.pause();
      const d=travelDestinations(g.world).find(d=>d.id==="district:market");
      const obstruct=anchor=>{for(const c of travelColumns({...d,arrival:anchor}))g.world.ensure(c.cx,c.cz,true);for(let z=-7;z<=7;z++)for(let x=-7;x<=7;x++)for(let y=-1;y<=4;y++)g.world.set(Math.floor(anchor.x)+x,Math.floor(anchor.y)+y,Math.floor(anchor.z)+z,B.Stone);};
      obstruct(d.arrival);const fallback=await g.travelTo(d.id);if(!fallback||Math.hypot(g.body.position.x-d.arrival.x,g.body.position.z-d.arrival.z)<7)throw Error("Blocked primary did not use the authored secondary");
      await g.travelTo("district:heritage");g.pause();obstruct(d.fallback);const edits=g.world.edits.size,origin={...g.body.position},begin=performance.now(),blocked=await g.travelTo(d.id),blockedMs=performance.now()-begin;
      if(blocked||g.travelState||g.world.edits.size!==edits||JSON.stringify(g.body.position)!==JSON.stringify(origin))throw Error("Unsafe arrival did not fail intact");
      const save=g.save;let timeout,timeoutMs;
      try{g.save=()=>new Promise(()=>{});const t=performance.now();timeout=await g.travelTo("region:willow-tulou");timeoutMs=performance.now()-t;}finally{g.save=save;}
      if(timeout||g.travelState||timeoutMs<2900||timeoutMs>4500||JSON.stringify(g.body.position)!==JSON.stringify(origin))throw Error("Preparation deadline did not preserve the origin");
      return{fallback,blocked,blockedMs,timeout,timeoutMs,edits,metrics:g.travelMetrics.length};
    });assert.equal(failureCases.fallback,true);assert.equal(failureCases.blocked,false);assert(failureCases.blockedMs<=3000);assert(failureCases.metrics<=120);
    await writeFile(`${output}/failure-cases.json`,JSON.stringify(failureCases,null,2));
    await page.setViewportSize({width:390,height:844});await open();assert.equal(await page.locator('[data-action="travel"]').count(),18);assert.equal(await page.locator(".journal-hub li").count(),33);await page.locator(".journal-hub summary").first().click();assert(await page.locator(".journal-hub details").first().evaluate(el=>el.open));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${output}/mobile-journal.png`});
  }
  const expected=await page.evaluate(async()=>{const{travelDestinations}=await import("/src/game/city-life/travel.ts");return travelDestinations(window.__game.world).length;});assert(records.some(r=>r.travel.meshQueue>0),"Arrival must complete before the non-critical mesh queue drains");assert.equal(records.length,seeds.length*(selected?selected.length:expected),"Incomplete creative destination matrix");if(!selected)assert.equal(spectatorVisits.length,seeds.length*expected);assert.deepEqual(errors,[]);if(verify)verifyReleaseManifest();await writeFile(`${output}/results.json`,JSON.stringify({status:"passed",scope:selected?"selected diagnostics":"all registry destinations in creative and spectator for every seed; 18 hubs / 33 nested discoveries; actual preparation latency, all three normal modes, legacy member unlock/reload, no passive travel discovery, edits, spam, cancellation/replacement and mobile",resumed,source,harness,records,spectatorVisits,errors},null,2));
}catch(error){if(page){try{console.log("DIAGNOSTIC",JSON.stringify(await page.evaluate(()=>{const g=window.__game;return{screen:g?.ui.screen,p:g?.body.position,travel:g?.travelState?.destination.id,chunks:g?.world.chunks.size,pending:[...g?.world.pending??[]],dirty:[...g?.world.dirty??[]].slice(0,40),lighting:g?.lighting.pending,camera:g?.view.camera.position,toasts:window.__travelToasts,overlay:g?.ui.overlay.innerText};})));await page.screenshot({path:`${output}/failure.png`});}catch{}}await writeFile(`${output}/failure.json`,JSON.stringify({error:String(error),source,harness,records,errors},null,2));throw error;}
finally{await browser?.close();server.kill();}
