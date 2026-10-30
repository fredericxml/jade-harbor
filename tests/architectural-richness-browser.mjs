import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile,readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import assert from "node:assert/strict";
import {verifyReleaseManifest} from "../scripts/release-integrity.mjs";

const output=process.env.ARCHITECTURE_OUTPUT??"test-results/architectural-richness",records=[],errors=[];
verifyReleaseManifest();const source=createHash("sha256").update(JSON.stringify(JSON.parse(await readFile("dist/release-integrity.json","utf8")).source)).digest("hex");
const server=spawn(process.execPath,["node_modules/vite/bin/vite.js","--host","127.0.0.1","--port","4188","--strictPort"],{stdio:["ignore","pipe","pipe"]});let browser,page;
try {
  await mkdir(output,{recursive:true});await new Promise((ok,fail)=>{server.stdout.on("data",b=>{if(b.toString().includes("Local:"))ok();});server.on("error",fail);server.on("exit",c=>fail(Error(`server ${c}`)));});
  browser=await chromium.launch({headless:true,args:["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-dev-shm-usage"]});page=await browser.newPage({viewport:{width:960,height:600}});page.setDefaultTimeout(180000);page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem("jade-harbor-settings",JSON.stringify({distance:3,simulationDistance:4})));
  await page.goto("http://127.0.0.1:4188");await page.locator('[data-action="new"]').click();await page.locator('[data-action="create"]').click();await page.waitForFunction(()=>window.__game?.active);
  await page.evaluate(async()=>{const{freshWorld}=await import("/src/persistence/saves.ts"),s=freshWorld("Matched generator 9 architecture","jade-harbor","creative");s.generator=9;await window.__game.start(s);});
  const fixtures=await page.evaluate(async()=>{
    const g=window.__game,{travelDestinations}=await import("/src/game/city-life/travel.ts"),{nearestRoadPoint,roadElevation}=await import("/src/world/metropolis/plan.ts");
    return g.world.metropolisPlan.districts.flatMap(d=>{
      const entry=travelDestinations(g.world).find(q=>q.id===`district:${d.id}`),p=entry.arrival;
      const roads=g.world.metropolisPlan.roads.filter(r=>!r.owner&&r.district===d.id),road=[...roads].sort((a,b)=>nearestRoadPoint(a,p.x,p.z).distance-nearestRoadPoint(b,p.x,p.z).distance)[0],a=road.points[0],b=road.points.at(-1),n=Math.hypot(b.x-a.x,b.z-a.z)||1;
      const shifted=nearestRoadPoint(road,p.x+(b.x-a.x)/n*9,p.z+(b.z-a.z)/n*9),corner={x:Math.floor(shifted.x)+.5,y:roadElevation(g.world.macroPlan,road,shifted.x,shifted.z)+1.002,z:Math.floor(shifted.z)+.5};
      const lot=g.world.metropolisPlan.lots.filter(l=>l.districtId===d.id).sort((a,b)=>Math.hypot(a.entrance.x-corner.x,a.entrance.z-corner.z)-Math.hypot(b.entrance.x-corner.x,b.entrance.z-corner.z))[0];
      const edge=roads.flatMap(r=>r.points.map(q=>({r,q}))).filter(({q})=>q.x>=d.bounds.x1&&q.x<=d.bounds.x2&&q.z>=d.bounds.z1&&q.z<=d.bounds.z2).sort((a,b)=>Math.min(a.q.x-d.bounds.x1,d.bounds.x2-a.q.x,a.q.z-d.bounds.z1,d.bounds.z2-a.q.z)-Math.min(b.q.x-d.bounds.x1,d.bounds.x2-b.q.x,b.q.z-d.bounds.z1,d.bounds.z2-b.q.z))[0];
      const border=edge?{x:Math.floor(edge.q.x)+.5,y:roadElevation(g.world.macroPlan,edge.r,edge.q.x,edge.q.z)+1.002,z:Math.floor(edge.q.z)+.5}:p;
      return[
        {id:`${d.id}-long-street`,district:d.id,kind:"long-street",position:p,focus:{x:p.x+(b.x-a.x)/n*50,y:p.y+1,z:p.z+(b.z-a.z)/n*50}},
        {id:`${d.id}-corner`,district:d.id,kind:"corner",position:corner,focus:{x:(lot.x1+lot.x2)/2,y:lot.baseY+5,z:(lot.z1+lot.z2)/2}},
        {id:`${d.id}-edge`,district:d.id,kind:"district-edge",position:border,focus:{x:(d.bounds.x1+d.bounds.x2)/2,y:border.y+1,z:(d.bounds.z1+d.bounds.z2)/2}},
      ];
    });
  });
  for(const version of[9,10]) {
    await page.evaluate(async version=>{const{freshWorld}=await import("/src/persistence/saves.ts"),s=freshWorld("Paired architectural views","jade-harbor","creative");s.generator=version;await window.__game.start(s);},version);
    for(const fixture of fixtures) {
      console.log("ARCHITECTURE",version,fixture.id);
      const state=await page.evaluate(async f=>{
        const g=window.__game,{safeTravelArrival,travelColumns}=await import("/src/game/city-life/travel.ts"),{collides}=await import("/src/player/physics.ts");g.pause();g.ui.overlay.style.display="none";g.time=1/6;g.simulation.weather="clear";g.simulation.weatherTimer=900;
        for(const c of travelColumns({arrival:f.position}))g.world.ensure(c.cx,c.cz,true);
        const p=safeTravelArrival(g.world,{arrival:f.position});if(!p)throw Error(`Unsafe architectural camera ${f.id}`);
        g.body.position={...p};g.previous={...p};g.body.velocity={x:0,y:0,z:0};g.body.flying=true;
        for(const key of g.world.stream(p.x,p.z,3))g.view.remove(key);
        for(let z=-3;z<=3;z++)for(let x=-3;x<=3;x++)if(x*x+z*z<=12.25)g.world.ensure(Math.floor(p.x/16)+x,Math.floor(p.z/16)+z,true);
        g.yaw=Math.atan2(-(f.focus.x-p.x),-(f.focus.z-p.z));g.pitch=Math.atan2(f.focus.y-p.y-1.61,Math.max(1,Math.hypot(f.focus.x-p.x,f.focus.z-p.z)));g.view.camera.position.set(p.x,p.y+1.61,p.z);g.view.camera.rotation.set(g.pitch,g.yaw,0,"YXZ");
        g.lighting.rebuild();for(let i=0;i<512&&g.world.dirty.size;i++)g.view.rebuild(g.world,6);g.entities.life.reactivate();g.entities.life.prepare(g.entities.list,p,g.time,false,g.entities.elapsed,g.entities.navigation);g.entityView.update(g.entities,0);g.entityView.civilians.removeFromParent();g.view.hand.removeFromParent();g.view.render();
        return{position:p,collision:collides(g.world,p),cameraAir:g.world.get(p.x,p.y+1.61,p.z)===0,columns:g.world.chunks.size,version:g.world.generatorVersion};
      },fixture);
      assert.equal(state.version,version);assert.equal(state.collision,false);assert.equal(state.cameraAir,true);assert(state.columns<=256);
      await page.screenshot({path:`${output}/v${version}-${fixture.id}.png`});records.push({version,fixture,state});await writeFile(`${output}/progress.json`,JSON.stringify({source,records,errors},null,2));
    }
  }
  for(const f of fixtures){const rows=records.filter(r=>r.fixture.id===f.id);assert.equal(rows.length,2);assert.deepEqual(rows[0].state.position,rows[1].state.position,"Paired architecture cameras must match");}
  assert.equal(records.length,fixtures.length*2);assert.deepEqual(errors,[]);verifyReleaseManifest();await writeFile(`${output}/results.json`,JSON.stringify({status:"passed",source,records,errors,note:"Matched supported normal-height cameras inspect long streets, building corners and district edges in every district, complementing the complete Journal's street/elevated and regional matrix. Synchronous geometry/light preparation and hidden civilian instances in BOTH versions isolate building comparison; these are camera fixtures, not travel, density or live-activity evidence. Journal and stationary activity captures retain normal visible civilians. Every image requires direct review."},null,2));
}catch(error){await writeFile(`${output}/failure.json`,JSON.stringify({error:String(error),source,records,errors},null,2));if(page)await page.screenshot({path:`${output}/failure.png`}).catch(()=>{});throw error;}
finally{await browser?.close();server.kill();}
