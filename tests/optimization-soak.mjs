/** Sustained software-browser workload/lifecycle check; never physical thermal certification. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {devApp,chromiumArgs,continueInBrowser} from './browser-harness.mjs';
import {verifyReleaseManifest} from '../scripts/release-integrity.mjs';
verifyReleaseManifest();
const minutes=Number(process.env.SOAK_MINUTES??20);assert(Number.isInteger(minutes)&&minutes>=1&&minutes<=30);
const reopenEvery=Number(process.env.SOAK_REOPEN_EVERY??4);assert(Number.isInteger(reopenEvery)&&reopenEvery>=1&&reopenEvery<=4);
const out=process.env.SOAK_OUTPUT??'test-results/optimization-soak';await mkdir(out,{recursive:true});
const fixtures=JSON.parse(await readFile('tests/fixtures/performance-foundation.json','utf8'));
const places=['district-heritage-day','district-market-day','panda-day','district-harbor-rain'].map(id=>fixtures.find(f=>f.id===id));assert(places.every(Boolean));
const server=await devApp(4289);let browser,page,session;const rows=[],errors=[],checks=[];let began;
try{
 browser=await chromium.launch({headless:true,args:[...chromiumArgs,'--enable-precise-memory-info']});
 page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:2,hasTouch:true,isMobile:true});page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(e.message));session=await page.context().newCDPSession(page);
 await page.addInitScript(()=>localStorage.setItem('jade-harbor-settings',JSON.stringify({graphicsQuality:'high',distance:3,simulationDistance:4,adaptiveResolution:true,frameRateLimit:30,touchControls:'off'})));
 await page.goto(server.url);await continueInBrowser(page);
 await page.evaluate(async()=>{const g=window.__game,{freshWorld}=await import('/src/persistence/saves.ts');await g.start(freshWorld('Sustained engineering check','jade-harbor','creative'));g.pause();window.__soakProbe={frames:0,duplicates:0,last:-1};const original=g.frame;g.frame=function(t){const p=window.__soakProbe;if(t===p.last)p.duplicates++;p.last=t;p.frames++;return original.call(this,t);};});
 began=performance.now();
 for(let minute=0;minute<minutes;minute++){
  const cycleStart=performance.now(),fixture=places[minute%places.length];console.log('SOAK MINUTE',minute+1,'/',minutes,fixture.id);
  if(minute%reopenEvery===0&&minute>0){
   const id=await page.evaluate(()=>{const g=window.__game;g.pause();return g.meta.id;});
   await page.locator('[data-action="menu"]').click();await page.waitForFunction(()=>!window.__game.active&&window.__game.ui.screen==='menu');
   await page.locator(`[data-action="load"][data-id="${id}"]`).click();await page.waitForFunction(id=>{const g=window.__game;return g.active&&!g.opening&&!g.saveTask&&g.meta.id===id;},id);
   if(await page.evaluate(()=>!!document.fullscreenElement)){await page.evaluate(()=>document.exitFullscreen());await page.waitForFunction(()=>!document.fullscreenElement);}
   await page.evaluate(async()=>{const g=window.__game;g.pause();if(g.saveConflicted||!await g.save())throw Error('normal UI reopen must remain writable');});
   checks.push('same saved world reopened through world-list UI at minute'+(minute+1));
  }
  if(minute%3===0)await page.setViewportSize(minute%2?{width:390,height:844}:{width:844,height:390});
  await page.evaluate(f=>{const g=window.__game;g.pause();g.settings.graphicsQuality='high';g.settings.adaptiveResolution=true;g.settings.frameRateLimit=30;g.settings.touchControls='off';g.applySettings();g.time=((f.hour-6+24)%24)/24;g.simulation.weather=f.rain?'rain':'clear';g.simulation.weatherTimer=900;const p={...f.position,y:180};g.body.position=p;g.previous={...p};g.body.velocity={x:0,y:0,z:0};g.body.flying=true;g.yaw=Math.atan2(-(f.focus.x-p.x),-(f.focus.z-p.z));g.pitch=0;g.view.camera.position.set(p.x,p.y+1.61,p.z);g.view.camera.rotation.set(0,g.yaw,0,'YXZ');g.entities.life?.reactivate();g.resume(false);},fixture);
  await page.waitForTimeout(1500);await page.locator('canvas#game').click();await page.waitForFunction(()=>document.pointerLockElement===document.querySelector('canvas'));
  const initial=await page.evaluate(()=>({...window.__game.body.position}));await page.keyboard.down('KeyW');await page.keyboard.down('ShiftLeft');await page.waitForTimeout(8000);await page.keyboard.up('KeyW');await page.keyboard.up('ShiftLeft');
  const moved=await page.evaluate(p=>Math.hypot(window.__game.body.position.x-p.x,window.__game.body.position.z-p.z),initial);assert(moved>5,'native flight route did not move: '+moved);
  await page.evaluate(f=>{document.exitPointerLock?.();const g=window.__game;g.pause();g.body.position={...f.position};g.previous={...f.position};g.body.velocity={x:0,y:0,z:0};g.body.flying=true;g.view.camera.position.set(f.position.x,f.position.y+1.61,f.position.z);g.resume(false);},fixture);
  // The native lock-release event may open Pause asynchronously; resume only
  // after that event has settled, using the engine's ordinary resume path.
  await page.waitForTimeout(500);await page.evaluate(()=>window.__game.resume(false));
  if(minute===Math.floor(minutes/2)&&minutes>=4){
   await page.evaluate(()=>{const g=window.__game;window.__soakLose=g.view.renderer.getContext().getExtension('WEBGL_lose_context');if(window.__soakLose)window.__soakLose.loseContext();});
   const supported=await page.evaluate(()=>!!window.__soakLose);if(supported){await page.waitForFunction(()=>window.__game.view.contextLost);await page.waitForTimeout(500);await page.evaluate(()=>window.__soakLose.restoreContext());await page.waitForFunction(()=>!window.__game.view.contextLost&&window.__game.view.sections.size>0);await page.evaluate(()=>window.__game.resume(false));checks.push('native WebGL context loss/restore midway');}
  }
  const wait=Math.max(0,60000-(performance.now()-cycleStart));if(wait)await page.waitForTimeout(wait);
  // Retained-heap observation after an explicit diagnostic GC. Timing samples
  // are mixed diagnostics and may include lifecycle/GC gaps, not clean FPS.
  await session.send('HeapProfiler.collectGarbage');
  const row=await page.evaluate(()=>{const g=window.__game,v=g.view;return{tick:g.tickCount,saveRevision:g.saveRevision,saveConflicted:g.saveConflicted,writable:g.tabs?.writable(g.meta.id)??true,screen:g.ui.screen,quality:g.settings.graphicsQuality,scale:v.resolutionScale,adaptive:g.adaptive.state,heap:performance.memory?.usedJSHeapSize??null,resources:{geometries:v.renderer.info.memory.geometries,textures:v.renderer.info.memory.textures,programs:v.renderer.info.programs?.length??null},columns:g.world.chunks.size,dirty:g.world.dirty.size,pending:g.world.pending.size,residents:g.entities.list.filter(e=>e.kind==='villager').length,total:g.entities.list.length,unique:new Set(g.entities.list.map(e=>e.id)).size,active:g.entities.life?.active.size??0,routes:g.entities.navigation.agents.size,states:g.entities.life?.states.size??0,metrics:v.metrics.snapshot(),duplicates:window.__soakProbe.duplicates,held:g.input.held('primary')||g.input.held('sprint'),axes:{x:g.input.read().moveX,y:g.input.read().moveY}};});
  row.workers=page.workers().length;assert(row.workers<=1);assert.equal(row.saveConflicted,false);assert.equal(row.writable,true);assert.deepEqual(row.axes,{x:0,y:0});
  row.minute=minute+1;row.elapsedMs=performance.now()-began;row.fixture=fixture.id;row.moved=moved;
  assert.equal(row.residents,4080);assert.equal(row.total,row.unique);assert.equal(row.screen,'none');assert.equal(row.quality,'high');assert(row.scale>=.7&&row.scale<=1);assert(row.active<=96&&row.routes<=102&&row.pending<=8&&row.columns<=445);assert(row.states<=4080);assert.equal(row.duplicates,0);assert.equal(row.held,false);assert(row.resources.geometries<2500&&row.resources.textures<20);assert(Object.values(row.metrics).every(s=>s.count<=240));
  rows.push(row);await writeFile(out+'/progress.json',JSON.stringify({minutes,elapsedMs:performance.now()-began,rows,checks,errors},null,2));
 }
 const median=a=>a.slice().sort((a,b)=>a-b)[Math.floor(a.length/2)];
 let retainedHeap=null;
 if(minutes>=12&&rows.every(r=>r.heap!==null)){
  const early=median(rows.slice(3,8).map(r=>r.heap)),late=median(rows.slice(-5).map(r=>r.heap));retainedHeap={earlyMedianBytes:early,lateMedianBytes:late,changeBytes:late-early,gate:'late median <= early median *1.25 +8MiB; explicit diagnostic GC; mixed scenes and saved-world reopen'};assert(late<=early*1.25+8*1048576,JSON.stringify(retainedHeap));
 }
 assert.deepEqual(errors,[]);verifyReleaseManifest();await writeFile(out+'/results.json',JSON.stringify({status:'passed',kind:minutes>=20?'20-minute-software-soak':'short-software-smoke',browser:browser.version(),minutes,reopenEvery,elapsedMs:performance.now()-began,rows,retainedHeap,checks,errors,notes:'Native Chromium/SwiftShader phone-layout emulation, not a physical phone or thermal test. Same4080 residents; real native keyboard flight at a clear engineering altitude each minute, explicitly relocated engineering scene fixtures, orientation changes, repeated saved-world reopen and one real context loss. Optional performance.memory sampled after explicit CDP diagnostic GC; retained JS heap is not total process/GPU memory. Rolling timing snapshots can include relocation/lifecycle/diagnostic-GC gaps and are not a clean FPS benchmark. No battery, watts, temperature or physical heat success claim.'},null,2));console.log('OPTIMIZATION SOAK PASSED',minutes,performance.now()-began);
}catch(error){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await writeFile(out+'/failure.json',JSON.stringify({error:String(error),minutes,elapsedMs:began?performance.now()-began:0,rows,checks,errors},null,2));throw error;}
finally{await browser?.close();await server.close();}
