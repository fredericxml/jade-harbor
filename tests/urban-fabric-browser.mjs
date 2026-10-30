import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile,readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import assert from "node:assert/strict";
import {verifyReleaseManifest} from "../scripts/release-integrity.mjs";

const output=process.env.FABRIC_OUTPUT??"test-results/urban-fabric-visual",seeds=(process.env.FABRIC_SEEDS??"jade-harbor,different-city").split(","),selected=process.env.FABRIC_VIEWS?.split(","),records=[],errors=[];
verifyReleaseManifest();const source=createHash("sha256").update(JSON.stringify(JSON.parse(await readFile("dist/release-integrity.json","utf8")).source)).digest("hex");
const server=spawn(process.execPath,["node_modules/vite/bin/vite.js","--host","127.0.0.1","--port","4186","--strictPort"],{stdio:["ignore","pipe","pipe"]});let browser;
try {
  await mkdir(output,{recursive:true});await new Promise((ok,fail)=>{server.stdout.on("data",b=>{if(b.toString().includes("Local:"))ok();});server.on("error",fail);server.on("exit",c=>fail(Error(`server ${c}`)));});
  browser=await chromium.launch({headless:true,args:["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-dev-shm-usage"]});
  const page=await browser.newPage({viewport:{width:960,height:600}});page.setDefaultTimeout(120000);page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem("jade-harbor-settings",JSON.stringify({distance:4})));
  await page.goto("http://127.0.0.1:4186");await page.locator('[data-action="new"]').click();await page.locator('[data-action="create"]').click();await page.waitForFunction(()=>window.__game?.active);assert.equal(await page.evaluate(()=>window.__game.world.generatorVersion),10);
  for(const seed of seeds) {
    await page.evaluate(async seed=>{const {freshWorld}=await import("/src/persistence/saves.ts");await window.__game.start(freshWorld("Urban fabric visual QA",seed,"creative"));},seed);
    const views=await page.evaluate(async()=>{
      const g=window.__game,{nearestRoadPoint}=await import("/src/world/metropolis/plan.ts"),{regionalLandUseAt}=await import("/src/world/regions/land-use.ts"),{sampleTerrain}=await import("/src/world/geography/terrain.ts");
      const city=[["avenue",0,20],["panda-court",0,-48],["market",-210,-180],["hutong",-180,20],["water-town",215,-80],["imperial",180,-270],["harbor",160,340],["artisan",-190,210],["scholar",240,200],["nightlife",20,220],["highland",-260,-390]].map(([name,x,z])=>{
        const q=g.world.metropolisPlan.roads.filter(r=>!r.owner).map(r=>nearestRoadPoint(r,x,z)).sort((a,b)=>a.distance-b.distance)[0];return{name,x,z,level:q.y,kind:"district",hour:name==="nightlife"?18:10};
      });
      for(const s of g.world.landmarkPlan.sites) {
        const approach=g.world.landmarkPlan.approaches.filter(a=>a.site===s.id).sort((a,b)=>Math.hypot(a.nodes.at(-1).x-s.entry.x,a.nodes.at(-1).z-s.entry.z)-Math.hypot(b.nodes.at(-1).x-s.entry.x,b.nodes.at(-1).z-s.entry.z))[0];
        const p=approach?.nodes[Math.max(0,approach.nodes.length-40)]??s.entry;city.push({name:`settlement-${s.id}`,x:p.x,z:p.z,level:p.y,kind:"settlement",hour:10});
      }
      for(const[name,use,preferred]of[["village-tea-terrace","tea-terrace",[-600,-720]],["managed-orchard","managed-orchard",[-520,450]],["retained-woodland","wild-forest",[-580,350]]]) {
        let best;for(let z=-840;z<=720;z+=32)for(let x=-720;x<=740;x+=32){const t=sampleTerrain(g.world.macroPlan,x,z);if(t.urban||t.water||t.height>150||regionalLandUseAt(g.world.macroPlan,g.world.regionalPlan,x,z,t)!==use)continue;const distance=Math.hypot(x-preferred[0],z-preferred[1]);if(!best||distance<best.distance)best={x,z,level:t.height,distance};}
        if(!best)throw Error(`No actual ${use} coverage for visual inspection`);city.push({name,...best,kind:"land-use",hour:10});
      }
      for(const theme of [...new Set(g.world.regionalPlan.landscapes.patches.map(p=>p.theme))]) {
        const options=g.world.regionalPlan.landscapes.patches.filter(p=>p.theme===theme).map(p=>({...p,level:sampleTerrain(g.world.macroPlan,p.x,p.z).height}));
        const p=options.find(p=>{const t=sampleTerrain(g.world.macroPlan,p.x,p.z),a=g.world.inspectDistrict(p.x,p.z);return!t.urban&&!t.water&&!a?.lot&&!a?.road&&!g.world.inspectLandmark(p.x,p.z)&&!g.world.regionalPlan.sites.some(s=>p.x>=s.reservation.footprint.bounds.x1&&p.x<=s.reservation.footprint.bounds.x2&&p.z>=s.reservation.footprint.bounds.z1&&p.z<=s.reservation.footprint.bounds.z2);});
        if(p)city.push({name:`converted-${theme}`,x:p.x,z:p.z,level:p.level,kind:"land-use",hour:10});
      }
      return city;
    });
    for(const f of views.filter(v=>!selected||selected.includes(v.name)))for(const version of f.kind==="land-use"?[9,10]:[10]) {
      if(await page.evaluate(()=>window.__game.world.generatorVersion)!==version)await page.evaluate(async({seed,version})=>{const {freshWorld}=await import("/src/persistence/saves.ts"),s=freshWorld("Land-use comparison",seed,"creative");s.generator=version;await window.__game.start(s);},{seed,version});
      console.log("VISUAL",seed,version,f.name);
      await page.evaluate(f=>{
        const g=window.__game;g.ui.show("pause","");g.ui.overlay.style.display="none";g.input.keys.clear();g.input.onLook=undefined;g.settings.distance=4;g.applySettings();g.time=((f.hour-6)/24+1)%1;g.simulation.weather="clear";g.simulation.weatherTimer=180;g.entities.weather="clear";
        let p={x:f.x+28.5,y:f.level+41,z:f.z+36.5};
        if(f.kind==="land-use") {
          // A low target can sit beside a much taller hillside. Choose a
          // deterministic clear elevated angle instead of placing its camera
          // inside the slope; paired versions share the same macro terrain.
          const choices=[[28.5,36.5],[-28.5,36.5],[28.5,-36.5],[-28.5,-36.5],[42,8],[-42,8],[8,42],[8,-42]].map(([dx,dz],order)=>{
            const q={x:f.x+dx,y:f.level+41,z:f.z+dz};
            for(const t of [0,.25,.5,.75]){const h=g.world.inspectTerrain(q.x+(f.x-q.x)*t,q.z+(f.z-q.z)*t)?.height??f.level;q.y=Math.max(q.y,(h+(t===0?20:4)-(f.level+5)*t)/(1-t));}
            return{...q,order};
          });
          choices.sort((a,b)=>a.y-b.y||a.order-b.order);const best=choices[0];p={x:best.x,y:best.y,z:best.z};
        }
        g.body.position={...p};g.previous={...p};g.body.velocity={x:0,y:0,z:0};g.body.flying=true;g.mode="creative";
        for(const key of g.world.stream(p.x,p.z,4))g.view.remove(key);const cx=Math.floor(p.x/16),cz=Math.floor(p.z/16);for(let z=-4;z<=4;z++)for(let x=-4;x<=4;x++)if(x*x+z*z<4.5**2)g.world.ensure(cx+x,cz+z,true);
        g.yaw=Math.atan2(-(f.x-p.x),-(f.z-p.z));g.pitch=Math.atan2(f.level+5-p.y-1.61,Math.hypot(f.x-p.x,f.z-p.z));g.view.camera.position.set(p.x,p.y+1.61,p.z);g.view.camera.rotation.set(g.pitch,g.yaw,0,"YXZ");
        g.lighting.rebuild();for(let i=0;i<512&&g.world.dirty.size;i++)g.view.rebuild(g.world,6);g.ui.overlay.style.display="";g.ui.show("none");
      },f);
      const frames=await page.evaluate(()=>window.__game.tickCount);await page.waitForFunction(t=>window.__game.tickCount>=t+20,frames);await page.screenshot({path:`${output}/${seeds.indexOf(seed)}-v${version}-${f.name}.png`});
      const state=await page.evaluate(()=>{const g=window.__game,c=g.view.camera.position;return{version:g.world.generatorVersion,residents:g.entities.list.filter(e=>e.kind==="villager").length,total:g.entities.list.length,unique:new Set(g.entities.list.map(e=>e.id)).size,active:g.entities.life?.active.size,columns:g.world.chunks.size,pending:g.world.pending.size,routes:g.entities.navigation.agents.size,expanded:g.entities.navigation.expandedLastTick,geometries:g.view.renderer.info.memory.geometries,camera:{x:c.x,y:c.y,z:c.z},cameraAir:g.world.get(Math.floor(c.x),Math.floor(c.y),Math.floor(c.z))===0};});
      assert.equal(state.version,version);assert.equal(state.total,state.unique);assert.equal(state.cameraAir,true,"Visual evidence camera must remain outside terrain/structures");assert(state.pending<=8);assert(state.expanded<=96);assert(state.columns<=256);assert(state.active<=(version>=8?96:48));
      records.push({seed,version,fixture:f,state});await writeFile(`${output}/progress.json`,JSON.stringify({source,records,errors},null,2));
    }
  }
  verifyReleaseManifest();assert.deepEqual(errors,[]);await writeFile(`${output}/results.json`,JSON.stringify({status:"passed",source,scope:selected?"selected visual fixtures":"two-seed district, landmark settlement and paired land-use matrix",records,errors,note:"Matched supported world-space elevated cameras use actual generated geometry. Initial synchronous generation/lighting/meshing is preparation, not streaming-speed evidence. No NPC positions are injected. Images require direct review; the separate 60–90-second normal-height matrix establishes live activity."},null,2));
}catch(error){await writeFile(`${output}/failure.json`,JSON.stringify({error:String(error),source,records,errors},null,2));throw error;}
finally{await browser?.close();server.kill();}
