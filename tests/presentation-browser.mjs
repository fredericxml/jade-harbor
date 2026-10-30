import {createRequire} from 'node:module';
const {chromium}=createRequire(process.cwd()+'/package.json')('playwright');
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const output=process.env.PRESENTATION_OUTPUT??'test-results/presentation',records=[],errors=[];
const source=createHash('sha256').update(JSON.stringify(JSON.parse(await readFile('dist/release-integrity.json','utf8')).source)).digest('hex');
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4189','--strictPort'],{stdio:['ignore','pipe','pipe']});let browser,page;
const fixtures=[
 {id:'panda-day',p:[.5,21.002,-21.5],focus:[0,43,-48],hour:12},
 {id:'panda-night',p:[.5,21.002,-21.5],focus:[0,37,-48],hour:23},
 {id:'market-day',p:[-247.5,25.002,-215.5],focus:[-290,29,-216],hour:10},
 {id:'harbor-rain',p:[120.5,21.002,340.5],focus:[200,43,349],hour:15,rain:true},
 {id:'water-night',p:[132.5,21.002,-100.5],focus:[190,25,-100],hour:22},
 {id:'imperial-sunset',p:[.5,42,-365.5],focus:[0,49,-440],hour:18},
 {id:'ridge-high',p:[-140,164,-460],focus:[160,132,-630],hour:10},
 {id:'city-high',p:[105,145,135],focus:[0,27,-80],hour:12},
];
try{
 await mkdir(output,{recursive:true});await new Promise((ok,no)=>{server.stdout.on('data',d=>{if(d.toString().includes('Local:'))ok();});server.on('error',no);server.on('exit',c=>no(Error('server '+c)));});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});page=await browser.newPage({viewport:{width:960,height:600}});page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>localStorage.setItem('jade-harbor-settings',JSON.stringify({distance:3,simulationDistance:4})));
 await page.goto('http://127.0.0.1:4189');await page.locator('[data-action="new"]').click();await page.locator('[data-action="create"]').click();await page.waitForFunction(()=>window.__game?.active);
 const selected=process.env.PRESENTATION_VIEWS?.split(",");
 for(const f of fixtures.filter(f=>!selected||selected.includes(f.id))){
  console.log('PRESENTATION',f.id);
  await page.evaluate(async f=>{const g=window.__game;g.pause();g.ui.overlay.style.display='none';g.time=(f.hour-6+24)%24/24;g.simulation.weather=f.rain?'rain':'clear';g.simulation.weatherTimer=900;g.view.atmosphere?.reset(g.time,!!f.rain,3);const p={x:f.p[0],y:f.p[1],z:f.p[2]};g.body.position={...p};g.previous={...p};g.body.velocity={x:0,y:0,z:0};g.body.flying=true;g.input.keys.clear();g.yaw=Math.atan2(-(f.focus[0]-p.x),-(f.focus[2]-p.z));g.pitch=Math.atan2(f.focus[1]-p.y-1.61,Math.hypot(f.focus[0]-p.x,f.focus[2]-p.z));g.view.camera.position.set(p.x,p.y+1.61,p.z);g.view.camera.rotation.set(g.pitch,g.yaw,0,'YXZ');
   for(const key of g.world.stream(p.x,p.z,3))g.view.remove(key);for(let z=-3;z<=3;z++)for(let x=-3;x<=3;x++)if(x*x+z*z<=12.25)g.world.ensure(Math.floor(p.x/16)+x,Math.floor(p.z/16)+z,true);g.lighting.rebuild();for(let i=0;i<512&&g.world.dirty.size;i++)g.view.rebuild(g.world,6);g.entities.life.reactivate();g.entities.life.prepare(g.entities.list,p,g.time,!!f.rain,g.entities.elapsed,g.entities.navigation);g.resume(false);g.ui.overlay.style.display='none';},f);
  await page.waitForFunction(()=>!window.__game.view.distant||window.__game.view.distant.stats.ready);
  await page.waitForTimeout(1500);
  await page.evaluate(async()=>{const{Metrics}=await import('/src/core/metrics.ts');window.__game.view.metrics=new Metrics();});
  await page.waitForTimeout(20000);
  const state=await page.evaluate(()=>{const g=window.__game;return{position:{...g.body.position},time:g.time,weather:g.simulation.weather,metrics:g.view.metrics.snapshot(),render:{...g.view.worldRenderStats},geometries:g.view.renderer.info.memory.geometries,textures:g.view.renderer.info.memory.textures,columns:g.world.chunks.size,pending:g.world.pending.size,dirty:g.world.dirty.size,active:g.entities.life.active.size,residents:g.entities.list.filter(e=>e.kind==='villager').length,unique:new Set(g.entities.list.map(e=>e.id)).size,total:g.entities.list.length,atmosphere:g.view.atmosphere?{phase:g.view.atmosphere.phase,fogNear:g.view.atmosphere.fogNear,fogFar:g.view.atmosphere.fogFar,rain:g.view.atmosphere.rain}:undefined,lod:g.view.distant?.stats};});
  assert.equal(state.residents,4080);assert.equal(state.unique,state.total);assert(state.active<=96);assert(state.pending<=8);assert(state.columns<=256);assert(Math.hypot(state.position.x-f.p[0],state.position.z-f.p[2])<.1);
  await page.screenshot({path:`${output}/${f.id}.png`});records.push({fixture:f,state});await writeFile(`${output}/progress.json`,JSON.stringify({source,records,errors},null,2));
 }
 assert.equal(records.length,selected?selected.length:8);assert.deepEqual(errors,[]);await writeFile(`${output}/results.json`,JSON.stringify({status:selected?'diagnostic-observations':'passed',source,records,errors,note:'Eight fixed seed/camera/view3/weather/time views, 20 real seconds per view after identical synchronous collision/lighting/mesh setup. Live original residents, no actor position injection. Rolling interval samples are SwiftShader observations, not hardware FPS or isolated GPU timings. Images require direct review.'},null,2));console.log('PRESENTATION PASSED');
} catch(e){await writeFile(`${output}/failure.json`,JSON.stringify({error:String(e),source,records,errors},null,2));throw e;}finally{await browser?.close();server.kill();}
