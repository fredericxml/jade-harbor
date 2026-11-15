import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {verifyReleaseManifest} from '../scripts/release-integrity.mjs';
import {touchDomContracts} from './touch-controls-dom.mjs';
import {touchGameplayParity} from './touch-controls-gameplay.mjs';
import {continueInBrowser} from './browser-harness.mjs';

verifyReleaseManifest();
const source=createHash('sha256').update(JSON.stringify(JSON.parse(await readFile('dist/release-integrity.json','utf8')).source)).digest('hex');
const output=process.env.TOUCH_BROWSER_OUTPUT??'test-results/touch-controls';
await mkdir(output,{recursive:true});
const checks=[],errors=[],layouts=[];let parity;
const pass=x=>{checks.push(x);console.log('CHECK',x);};
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4196','--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser,page;
try {
 await new Promise((ok,no)=>{server.stdout.on('data',b=>{if(b.toString().includes('Local:'))ok();});server.on('error',no);server.on('exit',c=>no(Error('Vite '+c)));});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1});
 page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  if(!localStorage.getItem('jade-harbor-settings'))localStorage.setItem('jade-harbor-settings',JSON.stringify({graphicsQuality:'medium',distance:3,simulationDistance:4,touchControls:'auto',touchSensitivity:1}));
  window.__touchLockCalls=0;const lock=HTMLCanvasElement.prototype.requestPointerLock;
  HTMLCanvasElement.prototype.requestPointerLock=function(...args){window.__touchLockCalls++;return lock?.apply(this,args);};
 });
 await page.goto('http://127.0.0.1:4196');
 await continueInBrowser(page);
 for(const check of await touchDomContracts(page))pass(check);
 assert.equal(await page.locator('#touch-controls').isVisible(),false);
 await page.locator('[data-action="new"]').tap();await page.locator('#world-name').fill('Touch QA');await page.locator('#world-seed').fill('jade-harbor');await page.locator('[data-action="create"]').tap();
 await page.waitForFunction(()=>window.__game.active&&!window.__game.opening&&!window.__game.saveTask&&window.__game.body.grounded&&window.__game.ui.touchControls.visible);
 assert.equal(await page.evaluate(()=>window.__touchLockCalls),0,'touch create/resume must not request Pointer Lock');
 assert.equal(await page.evaluate(()=>window.__game.settings.graphicsQuality),'medium');
 await page.evaluate(()=>{
  const g=window.__game;window.__touchBase=g.snapshot();
  window.__touchHUD=(fixture=false)=>{
   const g=window.__game,p=g.body.position;
   g.ui.updateHUD(g.inventory,{name:g.meta.name,mode:fixture?'survival':g.mode,biome:'Jade Harbor · Grand Lantern Avenue',x:Math.floor(p.x),y:Math.floor(p.y),z:Math.floor(p.z),time:'12:24',target:fixture?'Market resident · 20 / 20 HP':'',health:g.health,hunger:g.hunger,xp:g.xp,breath:fixture?7:10,effects:fixture?'Speed 60s · Night vision 60s':'',flying:g.body.flying,progress:fixture?.5:0,hitFlash:false,hitMessage:'',debug:''});
  };
 });
 pass('native touch-emulated create/text entry and Auto controls work without Pointer Lock or a graphics downgrade');
 const client=await context.newCDPSession(page),points=new Map();
 const send=type=>client.send('Input.dispatchTouchEvent',{type,touchPoints:[...points.values()]});
 const start=async(id,x,y)=>{points.set(id,{id,x,y,radiusX:5,radiusY:5,force:1});await send('touchStart');};
 const move=async(id,x,y)=>{Object.assign(points.get(id),{x,y});await send('touchMove');};
 const end=async id=>{points.delete(id);await send('touchEnd');};
 const cancel=async()=>{points.clear();await send('touchCancel');};
 const center=async selector=>{const r=await page.locator(selector).boundingBox();assert(r,selector+' visible');return{x:r.x+r.width/2,y:r.y+r.height/2,r};};
 const joy=await center('.touch-joystick'),jump=await center('[data-touch-action="jump"]'),sprint=await center('[data-touch-action="sprint"]');
 const origin=await page.evaluate(()=>({position:{...window.__game.body.position},yaw:window.__game.yaw,tick:window.__game.tickCount}));
 await start(1,joy.x,joy.y);await move(1,joy.x,joy.y-joy.r.width*.4);await start(2,470,155);await move(2,510,130);await start(3,sprint.x,sprint.y);await start(4,jump.x,jump.y);
 await page.waitForFunction(t=>window.__game.tickCount>=t+3,origin.tick);
 const multi=await page.evaluate(()=>{const g=window.__game;return{p:{...g.body.position},yaw:g.yaw,move:g.input.read().moveY,jump:g.input.held('jump'),sprint:g.input.held('sprint'),contacts:g.ui.touchControls.pointerCount,locked:g.input.locked};});
 assert(multi.move>.99&&multi.jump&&multi.sprint&&multi.contacts===4&&!multi.locked);assert(multi.yaw<origin.yaw);assert(Math.hypot(multi.p.x-origin.position.x,multi.p.z-origin.position.z)>.1);
 await end(4);await end(3);await end(2);await end(1);assert.equal(await page.evaluate(()=>window.__game.ui.touchControls.pointerCount),0);
 assert.equal(await page.evaluate(()=>window.__game.input.read().moveY),0);
 pass('trusted CDP multi-touch drives simultaneous joystick, swipe, Sprint and Jump through actual Game movement and camera');
 const attack=await center('[data-touch-action="primary"]'),attackYaw=await page.evaluate(()=>window.__game.yaw);
 await start(5,attack.x,attack.y);await move(5,attack.x+90,attack.y-24);await page.waitForFunction(y=>window.__game.input.held('primary')&&Math.abs(window.__game.yaw-y)>.02,attackYaw,{timeout:10000});
 const attackState=await page.evaluate(()=>({held:window.__game.input.held('primary'),yaw:window.__game.yaw,pressed:document.querySelector('[data-touch-action="primary"]').getAttribute('aria-pressed')}));
 assert(attackState.held&&attackState.pressed==='true'&&Math.abs(attackState.yaw-attackYaw)>.02,'attack stays active while its captured finger swipes to turn');
 await end(5);assert.equal(await page.evaluate(()=>window.__game.input.held('primary')),false);assert.equal(await page.locator('[data-touch-action="primary"]').getAttribute('aria-pressed'),'false');
 pass('holding Mine/Attack and dragging the same finger rotates the camera without releasing attack; release clears the active state');
 await page.locator('.touch-more').tap();assert(await page.locator('[data-touch-action="drop"]').isVisible()&&await page.locator('[data-touch-action="toggleFlight"]').isVisible(),'Creative More tray exposes Drop and Flight');
 await page.locator('[data-touch-action="toggleFlight"]').tap();await page.waitForFunction(()=>window.__game.body.flying&&document.querySelector('[data-touch-action="toggleFlight"]').getAttribute('aria-pressed')==='true');
 assert.notEqual(await page.locator('[data-touch-action="toggleFlight"]').evaluate(e=>getComputedStyle(e).boxShadow),'none','Flight on state has a visible active treatment');
 await page.locator('.touch-more').tap();await page.locator('[data-touch-action="toggleFlight"]').tap();await page.waitForFunction(()=>!window.__game.body.flying&&document.querySelector('[data-touch-action="toggleFlight"]').getAttribute('aria-pressed')==='false');
 pass('More opens right-hand utility actions; Flight uses a persistent active visual while on and clears when toggled off');
 await page.screenshot({path:output+'/native-gameplay.png'});console.log('STEP native inventory');
 const mine=await center('[data-touch-action="primary"]'),inv=await center('[data-touch-action="inventory"]');
 await start(1,mine.x,mine.y);assert.equal(await page.evaluate(()=>window.__game.input.held('primary')),true);
 await start(2,inv.x,inv.y);console.log('STEP inventory down',await page.evaluate(()=>({screen:window.__game.ui.screen,pointers:window.__game.ui.touchControls.pointerCount})));await page.waitForFunction(()=>window.__game.ui.screen==='inventory');
 assert.equal(await page.evaluate(()=>window.__game.ui.touchControls.visible),false);assert.equal(await page.evaluate(()=>window.__game.input.held('primary')),false);assert.equal(await page.evaluate(()=>window.__game.ui.touchControls.pointerCount),0);await end(2);await end(1);
 console.log('STEP inventory search');await page.locator('#search').fill('jade');assert.match(await page.locator('#catalog').innerText(),/jade/i);
 await page.locator('.close[data-action="resume"]').tap();await page.locator('[data-touch-action="pause"]').tap();await page.locator('#change-mode').selectOption('survival');await page.locator('.primary[data-action="resume"]').tap();await page.locator('[data-touch-action="inventory"]').tap();
 console.log('STEP survival inventory slots');await page.locator('[data-action="slot"][data-index="0"]').tap();await page.locator('[data-action="slot"][data-index="9"]').tap();
 const cursor=await page.evaluate(()=>({cursor:window.__game.inventory.cursor,slot:window.__game.inventory.slots[9]}));assert.equal(cursor.cursor,null);assert(cursor.slot&&cursor.slot.count>0);
 await page.locator('.close[data-action="resume"]').tap();await page.waitForFunction(()=>window.__game.ui.screen==='none'&&window.__game.ui.touchControls.visible);
 pass('native Inventory hides and clears held mining; search and tap-to-pick/place conserve the existing stack/cursor workflow');
 // Stable native capture while the ordinary HUD is rebuilt repeatedly.
 const j2=await center('.touch-joystick');await start(1,j2.x,j2.y);await move(1,j2.x,j2.y-40);
 const slot=await center('[data-touch-slot="2"]');await page.locator('[data-touch-slot="2"]').evaluate(e=>e.addEventListener('pointerdown',event=>{window.__slotCapturedId=event.pointerId;},{once:true}));await start(2,slot.x,slot.y);
 const stability=await page.evaluate(()=>{
  const g=window.__game,c=g.ui.touchControls,root=c.element,joy=c.joystick,buttons=[...root.querySelectorAll('button')],slot=c.slots[2];
  const captureBefore=slot.hasPointerCapture(window.__slotCapturedId),stack=g.inventory.slots[2],count=stack?.count,html=slot.innerHTML;let contentChanged=false;
  for(let i=0;i<20;i++){if(stack)stack.count=i%2?count:Math.max(1,count-1);window.__touchHUD();contentChanged ||= slot.innerHTML!==html;}
  return {sameRoot:root===g.ui.touchControls.element,sameJoy:joy===g.ui.touchControls.joystick,sameButtons:buttons.every((b,i)=>b===root.querySelectorAll('button')[i]),contacts:c.pointerCount,move:g.input.read().moveY,contentChanged,captureBefore,captureAfter:slot.hasPointerCapture(window.__slotCapturedId),selected:g.inventory.selected};
 });
 assert(stability.sameRoot&&stability.sameJoy&&stability.sameButtons&&stability.contacts===2&&stability.move>0&&stability.contentChanged&&stability.captureBefore&&stability.captureAfter&&stability.selected===2);
 await end(2);await end(1);
 for(let i=0;i<9;i++){await page.locator(`[data-touch-slot="${i}"]`).tap();assert.equal(await page.evaluate(()=>window.__game.inventory.selected),i);await page.waitForFunction(i=>document.querySelector(`[data-touch-slot="${i}"]`).getAttribute('aria-pressed')==='true',i);}
 pass('actual pointer capture and all persistent control/button nodes survive 20 HUD rebuilds; native taps select all nine slots');
 // Trusted cancellation and existing Input lifecycle notifications.
 const j3=await center('.touch-joystick');await start(1,j3.x,j3.y);await move(1,j3.x+40,j3.y);await cancel();
 assert.equal(await page.evaluate(()=>window.__game.input.read().moveX),0);assert.equal(await page.evaluate(()=>window.__game.ui.touchControls.pointerCount),0);
 for(const event of ['blur','visibility']) {
  const p=await center('[data-touch-action="secondary"]');await start(1,p.x,p.y);
  await page.evaluate(event=>{if(event==='blur')window.dispatchEvent(new Event('blur'));else {Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));}},event);
  assert.equal(await page.evaluate(()=>window.__game.ui.touchControls.visible),false);assert.equal(await page.evaluate(()=>window.__game.input.held('secondary')),false);await end(1);
  await page.evaluate(event=>{if(event==='visibility'){delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));}window.dispatchEvent(new Event('focus'));window.__game.resume(false);},event);
  await page.waitForFunction(()=>window.__game.ui.touchControls.visible);assert.equal(await page.evaluate(()=>window.__game.ui.touchControls.pointerCount),0);
 }
 const p4=await center('[data-touch-action="sprint"]');await start(1,p4.x,p4.y);await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>window.__game.input.held('sprint')),false);await end(1);
 pass('trusted touchCancel plus simulated blur/hidden lifecycle and viewport rotation clear actions, captures and stale UI contacts');
 // Existing pause/settings path persists the new local preferences.
 await page.locator('[data-touch-action="pause"]').tap();await page.locator('[data-action="settings"]').tap();
 const range=async value=>{const slider=page.locator('#touchSensitivity');await slider.scrollIntoViewIfNeeded();const r=await slider.boundingBox(),old=Number(await slider.inputValue()),min=Number(await slider.getAttribute('min')),max=Number(await slider.getAttribute('max'));assert.equal(min,.5);assert.equal(max,2.5);const at=v=>r.x+8+(r.width-16)*(v-min)/(max-min);await start(17,at(old),r.y+r.height/2);await move(17,at(value),r.y+r.height/2);await end(17);};
 await page.locator('#touchControls').selectOption('off');await range(1.7);
 assert.equal(await page.evaluate(()=>window.__game.settings.touchControls),'off');assert.equal(await page.evaluate(()=>window.__game.settings.touchSensitivity),1.7);
 await page.reload();await page.waitForFunction(()=>window.__game);assert.equal(await page.evaluate(()=>window.__game.settings.touchControls),'off');assert.equal(await page.evaluate(()=>window.__game.settings.touchSensitivity),1.7);
 await page.locator('[data-action="settings"]').tap();await page.locator('#touchControls').selectOption('on');await range(.5);
 await page.reload();await page.waitForFunction(()=>window.__game);assert.equal(await page.evaluate(()=>window.__game.settings.touchControls),'on');assert.equal(await page.evaluate(()=>window.__game.settings.touchSensitivity),.5);
 await page.locator('[data-action="settings"]').tap();await page.locator('[data-action="reset-settings"]').tap();assert.deepEqual(await page.evaluate(()=>({mode:window.__game.settings.touchControls,s:window.__game.settings.touchSensitivity,q:window.__game.settings.graphicsQuality})),{mode:'auto',s:1,q:'high'});
 await page.locator('[data-action="back"]').tap();await page.locator('[data-action="load"]').first().tap();await page.waitForFunction(()=>window.__game.active&&!window.__game.opening&&!window.__game.saveTask&&window.__game.ui.touchControls.visible);
 await page.evaluate(()=>{const g=window.__game;window.__touchBase=g.snapshot();window.__touchHUD=(fixture=false)=>{const g=window.__game,p=g.body.position;g.ui.updateHUD(g.inventory,{name:g.meta.name,mode:fixture?'survival':g.mode,biome:'Jade Harbor · Grand Lantern Avenue',x:Math.floor(p.x),y:Math.floor(p.y),z:Math.floor(p.z),time:'12:24',target:fixture?'Market resident · 20 / 20 HP':'',health:20,hunger:20,xp:0,breath:fixture?7:10,effects:fixture?'Speed 60s · Night vision 60s':'',flying:g.body.flying,progress:fixture?.5:0,hitFlash:false,hitMessage:'',debug:''});};});
 pass('Off/Always on and sensitivity persist through real reloads; Reset restores Auto/1.0 and the High graphics default');
 parity=await touchGameplayParity(page);pass('54 actual fixed ticks and actual mining, attack taps, placement, inventory and hotbar agree between desktop and DOM touch controls');pass('DOM utility Drop/Creative Flight, flight holds and cancelled pending jump/use retain existing Game permissions and rules');
 // Existing workstation transactions via the visible Use control and native dialog taps.
 const craft=await page.evaluate(async()=>{
  const g=window.__game,{B}=await import('/src/world/blocks.ts');g.input.clear();g.mode='survival';g.body.flying=false;g.body.position={x:.5,y:201.002,z:.5};g.previous={...g.body.position};g.body.velocity={x:0,y:0,z:0};g.body.grounded=true;g.yaw=g.pitch=0;
  for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++)g.world.set(x,200,z,B.Stone);g.world.set(0,202,-2,0);g.world.set(0,202,-3,B.Workbench);g.inventory.add(6,1);g.cooldown=0;g.resume(false);
  const before={logs:g.inventory.count(6),wood:g.inventory.count(8)};window.__touchEmit('[data-touch-action="secondary"]','pointerdown',5001);window.__touchEmit('[data-touch-action="secondary"]','pointerup',5001);g.tick(.05);return{before,screen:g.ui.screen};
 });assert.equal(craft.screen,'craft');assert.equal(await page.locator('#touch-controls').isVisible(),false);
 await page.locator('[data-action="make"][data-id="planks"]').tap();
 assert.deepEqual(await page.evaluate(()=>({logs:window.__game.inventory.count(6),wood:window.__game.inventory.count(8)})),{logs:craft.before.logs-1,wood:craft.before.wood+4});
 await page.screenshot({path:output+'/touch-crafting.png'});await page.locator('.close[data-action="resume"]').tap();
 const chest=await page.evaluate(async()=>{const g=window.__game,{B}=await import('/src/world/blocks.ts');g.world.set(0,202,-3,B.Chest);g.containers['0,202,-3']=Array(27).fill(null);g.containers['0,202,-3'][0]={id:8,count:6};g.cooldown=0;g.input.clear();g.resume(false);window.__touchEmit('[data-touch-action="secondary"]','pointerdown',5002);window.__touchEmit('[data-touch-action="secondary"]','pointerup',5002);g.tick(.05);return{screen:g.ui.screen,destination:g.inventory.slots.findIndex((s,i)=>i>=9&&!s)};});
 assert.equal(chest.screen,'chest');assert(chest.destination>=9);await page.locator('[data-action="container-slot"][data-index="0"]').tap();await page.locator(`[data-action="slot"][data-index="${chest.destination}"]`).tap();
 assert.deepEqual(await page.evaluate(index=>({cursor:window.__game.inventory.cursor,source:window.__game.containers['0,202,-3'][0],destination:window.__game.inventory.slots[index]}),chest.destination),{cursor:null,source:null,destination:{id:8,count:6}});
 await page.screenshot({path:output+'/touch-chest.png'});await page.locator('.close[data-action="resume"]').tap();pass('DOM Use opens actual workbench/chest; native recipe and stack taps preserve existing crafting costs and container resources');
 // Real DOM pointer events feed the actual camera; Game retains its own clamp.
 const camera=await page.evaluate(()=>{
  const g=window.__game;g.input.clear();g.resume(false);g.yaw=g.pitch=0;
  for(const s of [.5,1,2]){g.settings.touchSensitivity=s;g.applySettings();g.ui.touchControls.setGameplay(true,g.mode);window.__touchEmit('.touch-look','pointerdown',4000,200,150);window.__touchEmit('.touch-look','pointermove',4000,240,130);window.__touchEmit('.touch-look','pointerup',4000);g.input.poll(.05);if(Math.abs(g.yaw+.3*s)>1e-9)throw Error('camera multiplier');g.yaw=g.pitch=0;}
  window.__touchEmit('.touch-look','pointerdown',4001,200,150);window.__touchEmit('.touch-look','pointermove',4001,240,2000);window.__touchEmit('.touch-look','pointerup',4001);g.input.poll(.05);const pitch=g.pitch,yaw=g.yaw;for(let i=0;i<10;i++)g.input.poll(.05);return{pitch,yaw,after:g.yaw};
 });assert.equal(camera.pitch,-1.54);assert.equal(camera.yaw,camera.after);pass('DOM swipe directions, sensitivity and release feed the actual clamped Game camera without drift');
 await page.evaluate(async()=>{const g=window.__game,saved=structuredClone(window.__touchBase);saved.id=crypto.randomUUID();saved.revision=0;saved.mode='creative';await g.start(saved);g.ui.pointerType='touch';g.resume(false);g.frame=window.__touchOriginalFrame;g.lastTime=performance.now();g.frame(performance.now());});
 await page.waitForFunction(()=>window.__game.view.sections.size>10&&window.__game.view.distant?.stats.ready);
 await page.evaluate(async()=>{const g=window.__game;g.frame=()=>{};await new Promise(requestAnimationFrame);});
 // Explicit presentation fixture exercises important HUD boxes on every required viewport.
 for(const [name,width,height] of [['phone-small-landscape',640,360],['phone-common-landscape',844,390],['phone-large-landscape',932,430],['phone-small-portrait',360,640],['phone-common-portrait',390,844],['phone-large-portrait',430,932],['tablet-small-portrait',768,1024],['tablet-small-landscape',1024,768],['tablet-common-landscape',1180,820],['tablet-large-landscape',1280,800],['tablet-large-portrait',1024,1366]]) {
  await page.setViewportSize({width,height});
  await page.evaluate(()=>{const g=window.__game;g.settings.touchControls='on';g.settings.touchSensitivity=1;g.applySettings();g.mode='survival';g.resume(false);g.ui.touchControls.setGameplay(true,g.mode);window.__touchHUD(true);g.view.resize();g.view.render();});
  const layout=await page.evaluate(()=>{
   const root=document.querySelector('#touch-controls'),rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};},visible=e=>!e.closest('[hidden]')&&getComputedStyle(e).display!=='none';
   const controls=[root.querySelector('.touch-joystick'),...root.querySelectorAll('button')].filter(visible).map(e=>({name:e.dataset.touchAction??e.dataset.touchSlot??e.dataset.touchControl,rect:rect(e)}));
   const hud=['.crosshair','.target-label','.mining-track','.location','.world-clock','.survival-stats','.effect-status'].flatMap(s=>[...document.querySelectorAll('#hud '+s)].map(e=>({name:s,rect:rect(e)})));
   return{width:innerWidth,height:innerHeight,controls,hud,slots:[...root.querySelectorAll('.touch-slot')].map(rect),scrollWidth:document.documentElement.scrollWidth,quality:window.__game.settings.graphicsQuality};
  });
  const overlap=(a,b)=>Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>.5&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>.5;
  assert.equal(layout.slots.length,9);assert.equal(layout.quality,'high','viewport changes retain the accepted High reset default');assert(layout.scrollWidth<=width);
  for(const c of layout.controls){const r=c.rect;assert(r.x>=-.5&&r.y>=-.5&&r.x+r.w<=width+.5&&r.y+r.h<=height+.5,`${name}: clipped ${c.name} ${JSON.stringify(r)}`);if(!/^\d$/.test(c.name))assert(r.w>=47&&r.h>=47,`${name}: target too small ${c.name}`);}
  for(let i=0;i<layout.controls.length;i++)for(let j=i+1;j<layout.controls.length;j++)assert(!overlap(layout.controls[i].rect,layout.controls[j].rect),`${name}: control overlap ${layout.controls[i].name}/${layout.controls[j].name}`);
  for(const h of layout.hud)for(const c of layout.controls)assert(!overlap(h.rect,c.rect),`${name}: ${h.name} covered by ${c.name}`);
  await page.screenshot({path:`${output}/${name}.png`});layouts.push({name,...layout});
  await page.locator('.touch-more').tap();
  const utility=await page.locator('.touch-utility').boundingBox(),joyBox=layout.controls.find(c=>c.name==='joystick').rect,cross=layout.hud.find(h=>h.name==='.crosshair').rect;
  assert(utility&&utility.x>=0&&utility.y>=0&&utility.x+utility.width<=width&&utility.y+utility.height<=height,name+' utility bounds');
  assert(utility.x+utility.width>=width-30,name+' More tray is anchored to the right-hand control side');
  assert(await page.locator('[data-touch-action="drop"]').isVisible(),name+' Drop appears after More');
  const utilityRect={x:utility.x,y:utility.y,w:utility.width,h:utility.height};assert(!overlap(utilityRect,joyBox)&&!overlap(utilityRect,cross),name+' utility reaches controls/crosshair');
  if(['phone-small-landscape','phone-small-portrait','tablet-large-portrait'].includes(name))await page.screenshot({path:`${output}/${name}-utility.png`});
  await page.locator('.touch-more').tap();
 }
 pass('all 11 required phone/tablet landscape and portrait viewports retain nine slots, 48px actions and unobscured crosshair/target/mining/survival HUD');
 // Actual hybrid capture path and mixed sources on the forced overlay.
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>{const g=window.__game;g.view.canvas.requestPointerLock=HTMLCanvasElement.prototype.requestPointerLock;g.mode='creative';g.resume(false);});
 await page.mouse.click(470,125);await page.waitForFunction(()=>window.__game.input.locked);const mouseYaw=await page.evaluate(()=>window.__game.yaw);await page.mouse.move(500,145);await page.evaluate(()=>window.__game.input.poll(.05));assert.notEqual(await page.evaluate(()=>window.__game.yaw),mouseYaw);assert.equal(await page.evaluate(()=>window.__game.ui.touchControls.pointerCount),0);
 await page.evaluate(()=>window.__game.pause());await page.waitForFunction(()=>!document.pointerLockElement&&!window.__game.input.locked);
 await page.evaluate(()=>{const g=window.__game;g.ui.pointerType='touch';g.resume(false);window.__touchPads=[{connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))}];Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>window.__touchPads});g.input.poll(0);});
 const mixedJoy=await center('.touch-joystick');await start(1,mixedJoy.x,mixedJoy.y);await move(1,mixedJoy.x,mixedJoy.y-40);await page.keyboard.down('ShiftLeft');await page.evaluate(()=>{window.__touchPads[0].buttons[4]={value:1,pressed:true};window.__game.input.poll(.05);});await page.keyboard.up('ShiftLeft');assert.equal(await page.evaluate(()=>window.__game.input.held('sprint')),true);
 await page.evaluate(()=>{window.__touchPads=[];window.__game.input.poll(.05);});assert(await page.evaluate(()=>window.__game.input.read().moveY>.9));assert.equal(await page.evaluate(()=>window.__game.input.held('sprint')),false);await end(1);
 const calls=await page.evaluate(()=>{const g=window.__game;g.settings.touchControls='off';g.applySettings();g.resume(false);return window.__touchLockCalls;});await page.touchscreen.tap(400,160);assert.equal(await page.evaluate(()=>window.__touchLockCalls),calls);assert.equal(await page.evaluate(()=>window.__game.input.locked),false);assert(await page.evaluate(()=>window.__game.ui.root.classList.contains('touch-layout')));
 await page.evaluate(()=>{const g=window.__game;g.settings.touchControls='on';g.applySettings();g.resume(false);});pass('real hybrid mouse lock/look, mixed keyboard/controller/touch ownership and controller disconnect work; Off canvas touch never requests lock');
 // Mouse/keyboard accessibility on the forced overlay; no raw event synthesis in implementation.
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>{const g=window.__game;g.mode='creative';g.resume(false);g.ui.touchControls.setGameplay(true,g.mode);window.__touchHUD();});
 await page.locator('[data-touch-slot="4"]').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>window.__game.inventory.selected),4);
 await page.locator('[data-touch-action="jump"]').focus();await page.keyboard.down('Space');assert.equal(await page.evaluate(()=>window.__game.input.held('jump')),true);await page.keyboard.up('Space');assert.equal(await page.evaluate(()=>window.__game.input.held('jump')),false);
 pass('native keyboard activation of forced-overlay slots and held buttons uses semantic input without duplicate native activation');
 const transition=await page.evaluate(async()=>{
  const g=window.__game,root=g.ui.touchControls.element;const screens=['menu','create','pause','inventory','craft','chest','furnace','trade','journal','settings','controls','death','travel','enchant','brew','anvil','hopper'];
  for(const screen of screens){g.ui.show('none');g.input.prepareResume();g.ui.touchControls.setGameplay(true,g.mode);window.__touchEmit('[data-touch-action="primary"]','pointerdown',6001);g.ui.show(screen,'<p>Screen transition fixture</p>');if(g.ui.touchControls.visible||g.ui.touchControls.pointerCount||g.input.held('primary'))throw Error('screen leak '+screen);}
  g.ui.pointerType='touch';g.resume(false);window.__touchEmit('.touch-joystick','pointerdown',6002);const promise=g.travelTo('district:heritage');const hidden=!g.ui.touchControls.visible&&g.ui.touchControls.pointerCount===0;const travelled=await promise;if(!travelled||!hidden)throw Error('travel touch lifecycle');
  window.__touchEmit('[data-touch-action="sprint"]','pointerdown',6003);const saved=structuredClone(window.__touchBase);saved.id=crypto.randomUUID();saved.revision=0;await g.start(saved);if(g.ui.touchControls.pointerCount||g.input.held('sprint')||g.ui.touchControls.element!==root)throw Error('world replacement');return{screens:screens.length,travelled,worldRootStable:true};
 });assert.equal(transition.screens,17);pass('all 17 existing screen types, actual Travel and world replacement clear touch state while preserving the control root');
 // Native touch menus: use browser touch scrolling and actual Journal controls.
 await page.setViewportSize({width:360,height:640});const journalJoy=await center('.touch-joystick'),journalPause=await center('[data-touch-action="pause"]');await start(29,journalJoy.x,journalJoy.y);await move(29,journalJoy.x,journalJoy.y-40);await start(30,journalPause.x,journalPause.y);await page.waitForFunction(()=>window.__game.ui.screen==='pause');await end(30);await end(29);assert.equal(await page.evaluate(()=>window.__game.ui.touchControls.pointerCount),0);assert.equal(await page.evaluate(()=>window.__game.input.read().moveY),0);await page.locator('[data-action="journal"]').tap();
 assert.equal(await page.locator('#touch-controls').isVisible(),false);assert.equal(await page.locator('.journal-hub').count(),18);assert.equal(await page.locator('.journal-hub li').count(),33);
 await page.locator('.journal-hub summary').first().tap();assert(await page.locator('.journal-hub details').first().evaluate(e=>e.open));
 const dialog=page.locator('.dialog'),scroll=async()=>{const r=await dialog.boundingBox(),x=r.x+r.width*.8,y=r.y+r.height*.75;await start(28,x,y);for(let i=1;i<=6;i++)await move(28,x,y-i*r.height*.07);await end(28);};
 const settleScroll=locator=>locator.evaluate(e=>new Promise(resolve=>{let previous=e.scrollTop,stable=0;const check=()=>{const current=e.scrollTop;stable=Math.abs(current-previous)<.1?stable+1:0;previous=current;if(stable>=12)resolve();else requestAnimationFrame(check);};requestAnimationFrame(check);}));
 await page.locator('.journal-list').evaluate(e=>{e.scrollTop=0;});await scroll();await page.waitForFunction(()=>document.querySelector('.journal-list').scrollTop>0);assert(await page.locator('.journal-list').evaluate(e=>e.scrollTop>0),'native Journal touch scroll');await settleScroll(page.locator('.journal-list'));
 await page.screenshot({path:`${output}/touch-journal.png`});await page.locator('.close').tap();await page.waitForFunction(()=>window.__game.ui.screen==='pause');await page.locator('.primary[data-action="resume"]').tap();
 await page.locator('[data-touch-action="pause"]').tap();await page.locator('[data-action="controls"]').tap();
 assert.equal(await page.locator('#touch-controls').isVisible(),false);await dialog.evaluate(e=>{e.scrollTop=0;});await scroll();await page.waitForFunction(()=>document.querySelector('.dialog').scrollTop>0);assert(await dialog.evaluate(e=>e.scrollTop>0),'native Controls touch scroll');await settleScroll(dialog);await dialog.evaluate(e=>{e.scrollTop=e.scrollHeight;});await page.screenshot({path:`${output}/touch-controls-help.png`});
 await page.locator('.primary[data-action="resume"]').tap();await page.waitForFunction(()=>window.__game.ui.screen==='none');pass('native CDP scroll keeps Journal/Controls usable; native Journal expansion retains all 18 hubs and 33 discoveries');
 // Ordinary desktop Auto hides the overlay at every requested desktop size.
 const desktop=await browser.newContext({hasTouch:false,isMobile:false,viewport:{width:1280,height:720}}),d=await desktop.newPage();
 await d.addInitScript(()=>localStorage.setItem('jade-harbor-settings',JSON.stringify({touchControls:'auto'})));await d.goto('http://127.0.0.1:4196');await d.waitForFunction(()=>window.__game);
 for(const [width,height] of [[1280,720],[1440,900],[1920,1080]]){await d.setViewportSize({width,height});assert.equal(await d.evaluate(()=>window.__game.ui.touchControls.enabled),false);assert.equal(await d.locator('#touch-controls').isVisible(),false);layouts.push({name:'desktop-auto',width,height,overlay:false});}
 await d.addInitScript(()=>Object.defineProperty(navigator,'maxTouchPoints',{configurable:true,value:10}));await d.reload();await d.waitForFunction(()=>window.__game);assert.equal(await d.evaluate(()=>window.__game.ui.touchControls.enabled),false,'fine-hover touchscreen hybrid Auto stays hidden');
 await d.close();await desktop.close();pass('all three desktop viewports and fine-hover hybrid Auto keep the touch overlay hidden; desktop/gamepad architecture is unchanged');
 assert.deepEqual(errors,[]);verifyReleaseManifest();
 await writeFile(output+'/results.json',JSON.stringify({status:'passed',source,checks,layouts,parity,errors,hardware:'Chromium 141 SwiftShader; native CDP touch emulation and keyboard/mouse, constructed PointerEvents for deterministic/cancellation contracts; no physical touch/controller certification'},null,2));
 console.log('TOUCH CONTROLS BROWSER PASSED',checks.length,'checks;',layouts.length,'viewports');
}catch(error){if(page)await page.screenshot({path:output+'/failure.png'}).catch(()=>{});await writeFile(output+'/failure.json',JSON.stringify({error:String(error),source,checks,layouts,errors},null,2));throw error;}
finally{await browser?.close();server.kill();}
