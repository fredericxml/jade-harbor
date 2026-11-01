// Final atmosphere, orientation, view-distance and proxy transition matrix.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {verifyReleaseManifest} from '../scripts/release-integrity.mjs';
verifyReleaseManifest();
const source=createHash('sha256').update(JSON.stringify(JSON.parse(await readFile('dist/release-integrity.json','utf8')).source)).digest('hex');
const output=process.env.WORLD_PRESENTATION_OUTPUT??'test-results/world-presentation',selected=process.env.WORLD_PRESENTATION_VIEWS?.split(','),records=[],errors=[];
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4190','--strictPort'],{stdio:['ignore','pipe','pipe']});let browser,page;
try{
 await mkdir(output,{recursive:true});await new Promise((ok,no)=>{server.stdout.on('data',d=>{if(d.toString().includes('Local:'))ok();});server.on('error',no);server.on('exit',c=>no(Error('server '+c)));});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});page=await browser.newPage({viewport:{width:960,height:600}});page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>localStorage.setItem('jade-harbor-settings',JSON.stringify({graphicsQuality:'high',distance:3,simulationDistance:4})));
 await page.goto('http://127.0.0.1:4190');await page.locator('[data-action="new"]').click();await page.locator('[data-action="create"]').click();await page.waitForFunction(()=>window.__game?.active);
 const fixtures=await page.evaluate(async()=>{
  const g=window.__game,{travelDestinations}=await import('/src/game/city-life/travel.ts'),hubs=travelDestinations(g.world),views=[];
  const add=(id,position,focus,hour=12,rain=false,distance=3,kind='presentation')=>views.push({id,position,focus,hour,rain,distance,kind});
  for(const h of hubs.filter(h=>h.category==='district'))for(const hour of[12,23])add(`${h.id.replace(':','-')}-${hour===12?'day':'night'}`,h.arrival,h.focus,hour);
  const panda={x:.5,y:21.002,z:-21.5},pandaFocus={x:0,y:40,z:-48};
  for(const[phase,hour,rain]of[['pre-dawn',4.8,false],['sunrise',6.3,false],['sunset',18,false],['blue-hour',19.2,false],['rain',14,true]])add(`panda-${phase}`,panda,pandaFocus,hour,rain);
  add('panda-high',{x:30,y:68,z:2},{x:0,y:31,z:-48},12,false,5,'high-view');
  for(const s of g.world.landmarkPlan.sites){
    const foot=p=>({x:p.x+.5,y:p.y+1.002,z:p.z+.5});
    const approach=g.world.landmarkPlan.approaches.filter(a=>a.site===s.id).sort((a,b)=>Math.hypot(a.nodes.at(-1).x-s.entry.x,a.nodes.at(-1).z-s.entry.z)-Math.hypot(b.nodes.at(-1).x-s.entry.x,b.nodes.at(-1).z-s.entry.z))[0];
    const target=s.id==='ridge-fortification'?g.world.landmarkPlan.wallWalk[24]:s.id==='cliff-grotto'?s.viewpoints[0]:s.publicSpaces[0]??s.entry;
    const focus={x:target.x+.5,y:target.y+5,z:target.z+.5};
    add(`${s.id}-close`,foot(s.entry),focus,12,false,3,'landmark-close');
    const a=approach?.nodes[Math.max(0,approach.nodes.length-40)]??s.entry;add(`${s.id}-medium`,{x:a.x+.5,y:a.y+15,z:a.z+.5},focus,12,false,5,'landmark-medium');
    if(['imperial-complex','ridge-fortification','harbor-front','mountain-temple','western-viewpoint','cliff-grotto'].includes(s.id)){
      const length=Math.hypot(a.x-target.x,a.z-target.z)||1,dx=(a.x-target.x)/length,dz=(a.z-target.z)/length;
      add(`${s.id}-proxy`,{x:target.x+dx*200,y:Math.max(target.y,a.y)+25,z:target.z+dz*200},focus,12,false,3,'proxy-distance');
    }
  }
  for(const h of hubs.filter(h=>h.category==='region'))add(`${h.id.replace(':','-')}-day`,h.arrival,h.focus,12);
  for(const id of['region:willow-tulou','region:lotus-causeway']){const h=hubs.find(h=>h.id===id);add(`${id.replace(':','-')}-rain-context`,{x:h.focus.x+40,y:h.arrival.y+40,z:h.focus.z+50},h.focus,15,true,5,'regional-context');}
  for(const id of['district:heritage','district:nightlife','district:harbor','district:imperial','district:highland','district:water-town']){const h=hubs.find(h=>h.id===id);add(`${id.replace(':','-')}-blue-hour`,h.arrival,h.focus,19.2);}
  for(const id of['district:nightlife','district:market','district:hutong','district:water-town','district:harbor','landmark:cliff-grotto']){const h=hubs.find(h=>h.id===id);add(`${id.replace(':','-')}-rain`,h.arrival,h.focus,15,true);}
  for(const distance of[3,5,8])for(const[weather,hour,rain]of[['day',12,false],['night',23,false],['rain',15,true]])for(const view of['city','ridge']){
    const p=view==='city'?{x:105,y:145,z:135}:{x:-140,y:164,z:-460},focus=view==='city'?{x:0,y:27,z:-80}:{x:160,y:132,z:-630};add(`${view}-high-${distance}-${weather}`,p,focus,hour,rain,distance,'view-contract');
  }
  // The same beacon footprint is approached and retreated across real-mesh
  // transition at each setting. Actual geometry/coverage is inspected below.
  for(const distance of[3,5,8])for(const range of[160,96,48,24]){
    const beacon=g.world.landmarkPlan.sites.find(s=>s.id==='harbor-front');add(`beacon-transition-${distance}-${range}`,{x:beacon.entry.x-range,y:beacon.level+17,z:beacon.entry.z},{x:beacon.entry.x,y:beacon.level+17,z:beacon.entry.z},18,false,distance,'transition');
  }
  for(const f of views.filter(f=>['landmark-medium','proxy-distance'].includes(f.kind))){
    const p=f.position,target=f.focus;for(const t of[0,.25,.5,.75]){const x=p.x+(target.x-p.x)*t,z=p.z+(target.z-p.z)*t,h=g.world.inspectTerrain(x,z).height;p.y=Math.max(p.y,(h+4-target.y*t)/(1-t));}
  }
  return views;
 });
 for(const f of fixtures.filter(f=>!selected||selected.includes(f.id))){
  console.log('RENDER',f.id);
  const state=await page.evaluate(async f=>{
   const g=window.__game;g.pause();g.ui.overlay.style.display='none';g.input.keys.clear();g.time=(f.hour-6+24)%24/24;g.simulation.weather=f.rain?'rain':'clear';g.simulation.weatherTimer=900;g.settings.distance=f.distance;g.applySettings();g.view.atmosphere.reset(g.time,f.rain,f.distance);
   let p={...f.position};
   if(f.kind==='presentation'||f.kind==='landmark-close'){
     const {standAt}=await import('/src/game/navigation/pathfinder.ts'),{travelColumns}=await import('/src/game/city-life/travel.ts');for(const c of travelColumns({arrival:p}))g.world.ensure(c.cx,c.cz,true);const occupied=q=>g.entities.list.some(e=>e.kind==='villager'&&Math.abs(e.body.position.y-q.y)<2&&Math.hypot(e.body.position.x-q.x,e.body.position.z-q.z)<1.35);
     if(occupied(p))for(const[dx,dz]of[[0,-3],[-3,0],[3,0],[0,3],[-3,-3],[3,-3],[-3,3],[3,3]]){const q=standAt(g.world,p.x+dx,p.z+dz,p.y,false);if(q&&!occupied(q)){p=q;break;}}
   }
   g.body.position={...p};g.previous={...p};g.body.velocity={x:0,y:0,z:0};g.body.flying=true;g.yaw=Math.atan2(-(f.focus.x-p.x),-(f.focus.z-p.z));g.pitch=Math.atan2(f.focus.y-p.y-1.61,Math.hypot(f.focus.x-p.x,f.focus.z-p.z));g.view.camera.position.set(p.x,p.y+1.61,p.z);g.view.camera.rotation.set(g.pitch,g.yaw,0,'YXZ');
   for(const key of g.world.stream(p.x,p.z,f.distance))g.view.remove(key);const r=f.distance,cx=Math.floor(p.x/16),cz=Math.floor(p.z/16);
   for(let z=-r;z<=r;z++)for(let x=-r;x<=r;x++)if(x*x+z*z<=(r+.5)**2)g.world.ensure(cx+x,cz+z,true);
   g.lighting.rebuild();for(let i=0;i<1024&&g.world.dirty.size;i++)g.view.rebuild(g.world,6);g.entities.life.reactivate();g.entities.life.prepare(g.entities.list,p,g.time,f.rain,g.entities.elapsed,g.entities.navigation);g.entityView.update(g.entities,g.entities.elapsed);g.view.hand.visible=false;
   return{cameraAir:g.world.get(Math.floor(p.x),Math.floor(p.y+1.61),Math.floor(p.z))===0};
  },f);
  // A high proxy-view camera can cross a tall natural slope. It is a QA error
  // to use an occluded camera; never erase geometry to clear the camera view.
  assert(state.cameraAir,`Camera embedded at ${f.id}`);
  await page.waitForFunction(()=>window.__game.view.distant?.stats.ready);await page.waitForTimeout(250);
  const metrics=await page.evaluate(()=>{const g=window.__game,v=g.view,l=v.distant,p=v.camera.position;v.environment(g.time,g.simulation.weather==='rain',g.status.has('night_vision'));v.updateDistant(g.world);v.render();return{render:{...v.worldRenderStats},geometries:v.renderer.info.memory.geometries,textures:v.renderer.info.memory.textures,columns:g.world.chunks.size,pending:g.world.pending.size,dirty:g.world.dirty.size,active:g.entities.life.active.size,residents:g.entities.list.filter(e=>e.kind==='villager').length,unique:new Set(g.entities.list.map(e=>e.id)).size,total:g.entities.list.length,near:v.camera.near,far:v.camera.far,fog:[v.atmosphere.fogNear,v.atmosphere.fogDetail,v.atmosphere.fogFar],lod:{...l.stats},lodGroups:v.scene.children.filter(n=>n.name==='render-only-distant-world').length,covered:l.coverage.filter(v=>v>0).length,phase:v.atmosphere.phase,camera:{x:p.x,y:p.y,z:p.z},position:{...g.body.position}};});
  assert.equal(metrics.residents,4080);assert.equal(metrics.unique,metrics.total);assert(metrics.active<=96);assert(metrics.pending<=8);assert(metrics.columns<=(2*f.distance+5)**2+4);assert.equal(metrics.lodGroups,1);assert(metrics.lod.terrainTriangles<=32768);assert(metrics.lod.anchorTriangles<=18000);assert.equal(metrics.far,960);assert(metrics.fog[0]>20&&metrics.fog[1]>metrics.fog[0]&&metrics.fog[2]>metrics.fog[1]);
  await page.screenshot({path:`${output}/${f.id}.png`});records.push({fixture:f,state,metrics});await writeFile(`${output}/progress.json`,JSON.stringify({source,records,errors},null,2));
 }
 assert.equal(records.length,fixtures.filter(f=>!selected||selected.includes(f.id)).length);assert.deepEqual(errors,[]);verifyReleaseManifest();await writeFile(`${output}/results.json`,JSON.stringify({status:selected?'diagnostic-observations':'passed',source,records,errors,note:'Paused camera fixtures with synchronously prepared exact full-detail neighborhoods. All original resident positions retained; no actor or voxel edits. These test visual composition, coverage, range/vertical bounds, not streaming speed or live activity. Every capture requires manual review. Matched live performance and continuous traversal have separate gates.'},null,2));console.log('RENDER MATRIX PASSED',records.length);
}catch(e){if(page)await page.screenshot({path:`${output}/failure.png`}).catch(()=>{});await writeFile(`${output}/failure.json`,JSON.stringify({error:String(e),source,records,errors},null,2));throw e;}finally{await browser?.close();server.kill();}
