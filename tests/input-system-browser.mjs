import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {verifyReleaseManifest} from '../scripts/release-integrity.mjs';
verifyReleaseManifest();
const source=createHash('sha256').update(JSON.stringify(JSON.parse(await readFile('dist/release-integrity.json','utf8')).source)).digest('hex');
const output=process.env.INPUT_BROWSER_OUTPUT??'test-results/input-system';
await mkdir(output,{recursive:true});
const checks=[],errors=[],results=[];const pass=x=>{checks.push(x);console.log('CHECK',x);};
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4198','--strictPort'],{stdio:['ignore','pipe','pipe']});let browser,page;
try {
 await new Promise((ok,no)=>{server.stdout.on('data',b=>{if(b.toString().includes('Local:'))ok();});server.on('error',no);server.on('exit',c=>no(Error('Vite exit '+c)));});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 page=await browser.newPage({viewport:{width:960,height:600}});page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  localStorage.setItem('jade-harbor-settings',JSON.stringify({distance:3,simulationDistance:4,graphicsQuality:'low',sensitivity:4}));
  window.__pads=[];Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>window.__pads});
 });
 await page.goto('http://127.0.0.1:4198');await page.locator('[data-action="new"]').click();await page.locator('[data-action="create"]').click();await page.waitForFunction(()=>window.__game?.active&&!window.__game.opening&&!window.__game.saveTask);
 await page.waitForFunction(()=>window.__game.body.grounded);await page.evaluate(async()=>{const g=window.__game;g.pause();window.__loop=g.frame;g.frame=()=>{};await new Promise(requestAnimationFrame);window.__base=g.snapshot();window.__nativeLock=HTMLCanvasElement.prototype.requestPointerLock;});
 const reset=async(kind,sky=false)=>{
  await page.evaluate(async({kind,sky})=>{
   const g=window.__game;g.input.clear();window.__pads=[];
   g.view.canvas.requestPointerLock=kind==='keyboard'?window.__nativeLock:undefined;
   const saved=structuredClone(window.__base);saved.id=crypto.randomUUID();saved.revision=0;await g.start(saved);g.pause();g.resume(false);
   const p=g.body.position;for(let z=-3;z<=3;z++)for(let x=-3;x<=3;x++)g.world.ensure(Math.floor(p.x/16)+x,Math.floor(p.z/16)+z,true);
   if(sky){g.body.position={x:.5,y:201.002,z:.5};g.previous={...g.body.position};g.body.velocity={x:0,y:0,z:0};g.body.flying=true;g.yaw=g.pitch=0;for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++)g.world.ensure(x,z,true);g.world.set(0,202,-3,22);g.inventory.selected=0;g.inventory.slots[0]={id:22,count:64};}
   if(kind==='gamepad'){window.__pads=[{connected:true,index:0,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))}];g.input.poll(0);}
   window.__touchIds={};window.__pointerSerial=window.__pointerSerial??100;window.__initialPosition={...g.body.position};window.__kind=kind;
  },{kind,sky});
  if(kind==='keyboard'){await page.locator('canvas#game').click();await page.waitForFunction(()=>window.__game.input.locked);}
  else assert.equal(await page.evaluate(()=>window.__game.input.locked),false,'adapter must operate without pointer lock');
 };
 const button=async(action,down)=>{
  const kind=await page.evaluate(()=>window.__kind);
  if(kind==='keyboard'){
   const key={forward:'KeyW',sprint:'ShiftLeft',crouch:'ControlLeft',jump:'Space',inventory:'KeyE',pause:'Escape',next:'Digit2',flight:'KeyG'}[action];
   if(key)await page.keyboard[down?'down':'up'](key);
   else {await page.mouse[down?'down':'up']({button:action==='primary'?'left':'right'});if(down)await page.waitForFunction(a=>window.__game.input.held(a),action);}
  }else await page.evaluate(({action,down})=>{
   const g=window.__game;
   if(window.__kind==='touch'){
    const id=down?(window.__touchIds[action]=++window.__pointerSerial):window.__touchIds[action];if(id===undefined)return;
    if(action==='forward')g.input.touch.setMove(id,0,down?1:0);
    else if(action==='next'){if(down)g.input.touch.selectHotbar(id,1);}
    else {const semantic={pause:'pause',inventory:'inventory',flight:'toggleFlight'}[action]??action;if(down)g.input.touch.press(id,semantic);else g.input.touch.release(id,semantic);}
    if(!down){g.input.touch.releasePointer(id);delete window.__touchIds[action];}
   }else {
    const pad=window.__pads[0];if(action==='forward')pad.axes[1]=down?-1:0;
    else {const i={jump:0,crouch:1,inventory:3,sprint:4,secondary:6,primary:7,pause:9,flight:11,next:15}[action];pad.buttons[i]={value:down?1:0,pressed:down};}
    g.input.poll(.05);
   }
  },{action,down});
 };
 const ticks=async n=>page.evaluate(n=>{const g=window.__game,descriptor=Object.getOwnPropertyDescriptor(performance,'now');let clock=0;Object.defineProperty(performance,'now',{configurable:true,value:()=>clock+=.0001});try{for(let i=0;i<n;i++)g.tick(.05);}finally{if(descriptor)Object.defineProperty(performance,'now',descriptor);else delete performance.now;}},n);
 for(const kind of['keyboard','touch','gamepad']){
  await reset(kind);await button('forward',true);await ticks(10);await button('sprint',true);await ticks(10);await button('sprint',false);await button('crouch',true);await ticks(10);await button('crouch',false);await button('jump',true);await ticks(4);await button('jump',false);await ticks(12);await button('forward',false);
  const row=await page.evaluate(()=>{const g=window.__game,s=g.snapshot();return{moved:Math.hypot(g.body.position.x-window.__initialPosition.x,g.body.position.z-window.__initialPosition.z),position:s.player.position,velocity:{...g.body.velocity},flying:g.body.flying,crouching:g.crouching,inventory:s.player.slots,health:g.health,hunger:g.hunger,xp:g.xp,selected:g.inventory.selected,time:g.time,ids:g.entities.list.map(e=>e.id).sort(),active:g.entities.life.active.size};});assert(row.moved>1&&Object.values(row.position).every(Number.isFinite));results.push({kind,movement:row});
  if(kind!=='keyboard')assert.deepEqual(row,results[0].movement,'identical normalized input must preserve actual gameplay movement');
 }
 assert(results[0].movement.ids.length>=4080);pass('46 actual fixed ticks match keyboard, touch and mocked standard gamepad: walk, sprint, crouch, jump and gameplay state; touch/gamepad require no pointer lock');
 for(const kind of['keyboard','touch','gamepad']){
  await reset(kind,true);await button('primary',true);await button('primary',false);await ticks(1);assert.equal(await page.evaluate(()=>window.__game.world.get(0,202,-3)),22,'quick primary release must retain original held-mining rule');
  await page.evaluate(async()=>{const g=window.__game,{spawnEntity}=await import('/src/game/entities.ts');const entity=spawnEntity('panda',{x:.5,y:201.6,z:-1.5},'Input tap fixture');g.entities.list.push(entity);window.__tapTarget=entity;g.attackCooldown=0;});await button('primary',true);await button('primary',false);await ticks(1);assert.equal(await page.evaluate(()=>window.__tapTarget.health),19,'a completed primary tap must attack once even after physical pointer/button release');await page.evaluate(()=>{const g=window.__game;g.entities.list=g.entities.list.filter(e=>e.id!==window.__tapTarget.id);});
  await button('primary',true);await ticks(10);await button('primary',false);assert.equal(await page.evaluate(()=>window.__game.world.get(0,202,-3)),0,'held primary mines the actual target');
  await page.evaluate(()=>{const g=window.__game;g.world.set(0,202,-3,22);g.cooldown=0;});await button('secondary',true);await ticks(1);await button('secondary',false);
  const row=await page.evaluate(()=>{const g=window.__game;return{placed:g.world.get(0,202,-2),original:g.world.get(0,202,-3),inventory:g.inventory.slots,cooldown:g.cooldown};});assert.equal(row.placed,22);results.find(r=>r.kind===kind).actions=row;
  if(kind!=='keyboard')assert.deepEqual(row,results[0].actions,'primary/secondary share the same mine/place rules');
  await button('next',true);await button('next',false);assert.equal(await page.evaluate(()=>window.__game.inventory.selected),1);
 }
 pass('actual primary hold/quick tap, secondary placement, inventory conservation and hotbar changes match across all three adapters');
 await reset('gamepad');await button('flight',true);await button('flight',false);assert.equal(await page.evaluate(()=>window.__game.body.flying),true);await page.evaluate(()=>{window.__game.mode='survival';window.__game.body.flying=false;});await button('flight',true);await button('flight',false);assert.equal(await page.evaluate(()=>window.__game.body.flying),false);
 const look=await page.evaluate(()=>{const g=window.__game,p=window.__pads[0];g.yaw=g.pitch=0;p.axes[2]=p.axes[3]=1;for(let i=0;i<120;i++)g.input.poll(1/60);const yaw=g.yaw;p.axes[2]=p.axes[3]=0;for(let i=0;i<20;i++)g.input.poll(1/60);return{yaw,after:g.yaw,pitch:g.pitch};});assert(Math.abs(look.yaw+Math.SQRT1_2*5)<1e-9);assert.equal(look.after,look.yaw);assert.equal(look.pitch,-1.54);
 pass('actual Game camera integrates analog radians with the original pitch clamp, neutral sticks stop drift, and controller flight retains Creative-only permission');
 await reset('gamepad',true);await button('forward',true);await button('primary',true);await button('pause',true);assert.equal(await page.evaluate(()=>window.__game.ui.screen),'pause');await ticks(1);assert.equal(await page.evaluate(()=>window.__game.input.read().moveY),0);await button('pause',false);await button('pause',true);assert.equal(await page.evaluate(()=>window.__game.ui.screen),'none');assert.equal(await page.evaluate(()=>window.__game.input.held('primary')),false);assert.equal(await page.evaluate(()=>window.__game.input.read().moveY),0);
 await button('forward',false);await button('primary',false);await button('pause',false);await page.evaluate(()=>window.__game.input.poll(.05));await button('forward',true);assert.equal(await page.evaluate(()=>window.__game.input.read().moveY),1);
 await page.evaluate(()=>{window.__game.input.keys.add('ShiftLeft');window.__game.input.read();window.__pads[0].buttons[4]={value:1,pressed:true};window.__game.input.poll(.05);window.__game.input.keys.delete('ShiftLeft');window.__game.input.read();});assert.equal(await page.evaluate(()=>window.__game.input.held('sprint')),true);await page.evaluate(()=>{window.__pads=[];window.__game.input.poll(.05);});assert.equal(await page.evaluate(()=>window.__game.input.read().moveY),0);assert.equal(await page.evaluate(()=>window.__game.input.held('primary')),false);
 pass('gamepad pause/resume, held-trigger neutral rearm, mixed keyboard release and disconnect clear only their owned state');
 await reset('gamepad',true);await page.evaluate(()=>window.__game.cooldown=.2);await button('secondary',true);await button('jump',true);await page.evaluate(()=>{window.__pads=[];window.__game.input.poll(.05);});assert.equal(await page.evaluate(()=>window.__game.useRequest||window.__game.jumpRequest),false);await ticks(1);assert.equal(await page.evaluate(()=>window.__game.world.get(0,202,-2)),0);assert.equal(await page.evaluate(()=>window.__game.body.velocity.y),0);
 pass('disconnect before a fixed tick cancels only that controller’s pending jump/use requests, including a use delayed by cooldown');
 await reset('touch',true);await button('primary',true);await button('inventory',true);assert.equal(await page.evaluate(()=>window.__game.ui.screen),'inventory');assert.equal(await page.evaluate(()=>window.__game.input.held('primary')),false);await page.evaluate(()=>window.__game.resume(false));await button('primary',false);await page.evaluate(()=>window.__game.input.touch.releasePointer(2));
 await page.evaluate(()=>{const g=window.__game;g.input.touch.setMove(21,1,0);g.input.touch.press(22,'primary');g.input.touch.pointerCancel(22);});assert.equal(await page.evaluate(()=>window.__game.input.held('primary')),false);assert.equal(await page.evaluate(()=>window.__game.input.read().moveX),1);
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.evaluate(()=>window.__game.input.read().moveX),0);await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 pass('inventory focus, touch pointer cancellation and browser blur/focus clear held input and pending camera/actions');
 await page.evaluate(async()=>{const g=window.__game;g.input.touch.setMove(30,0,1);if(!(await g.travelTo('district:market')))throw Error('Travel failed');});assert.equal(await page.evaluate(()=>window.__game.input.read().moveY),0);assert.equal(await page.evaluate(()=>window.__game.input.touch.pointerCount),0);
 await page.evaluate(async()=>{const g=window.__game,{freshWorld}=await import('/src/persistence/saves.ts');g.input.touch.press(33,'primary');await g.start(freshWorld('Input switch','different-city','creative'));});assert.equal(await page.evaluate(()=>window.__game.input.held('primary')),false);
 pass('Travel and actual world replacement release all transient source state without changing save schema');
 await page.evaluate(()=>{const g=window.__game;g.input.touch.press(51,'primary');Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await page.evaluate(()=>window.__game.ui.screen),'pause');assert.equal(await page.evaluate(()=>window.__game.input.held('primary')),false);await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));window.__game.resume(false);});
 const contextSupported=await page.evaluate(()=>{const g=window.__game,e=g.view.renderer.getContext().getExtension('WEBGL_lose_context');if(!e)return false;g.input.touch.setMove(52,0,1);g.input.touch.press(53,'primary');window.__contextExtension=e;e.loseContext();return true;});assert(contextSupported);await page.waitForFunction(()=>window.__game.view.contextLost);assert.equal(await page.evaluate(()=>window.__game.ui.screen),'pause');assert.equal(await page.evaluate(()=>window.__game.input.read().moveY),0);assert.equal(await page.evaluate(()=>window.__game.input.held('primary')),false);await page.evaluate(()=>window.__contextExtension.restoreContext());await page.waitForFunction(()=>!window.__game.view.contextLost);
 pass('simulated hidden/visible lifecycle and actual WebGL loss/restore pause and save without restoring held touch input');
 await page.evaluate(()=>{const g=window.__game;g.frame=window.__loop;g.lastTime=0;g.view.canvas.requestPointerLock=window.__nativeLock;g.pause();requestAnimationFrame(t=>g.frame(t));});await page.keyboard.press('Escape');await page.locator('canvas#game').click();await page.waitForFunction(()=>window.__game.input.locked);await page.keyboard.down('KeyW');await page.waitForTimeout(800);await page.keyboard.press('Escape');await page.keyboard.up('KeyW');assert.equal(await page.evaluate(()=>window.__game.ui.screen),'pause');assert.equal(await page.evaluate(()=>window.__game.input.read().moveY),0);
 await page.screenshot({path:output+'/desktop-paused.png'});await page.locator('[data-action="controls"]').click();await page.screenshot({path:output+'/controls.png'});await page.locator('[data-action="resume"]').scrollIntoViewIfNeeded();const bounds=await page.locator('[data-action="resume"]').boundingBox();assert(bounds&&bounds.y>=0&&bounds.y+bounds.height<=600);await page.screenshot({path:output+'/controls-bottom.png'});
 pass('real browser keyboard movement, Escape/pointer-lock pause and controls panel remain usable');
 assert.deepEqual(errors,[]);await writeFile(output+'/results.json',JSON.stringify({status:'passed',source,checks,results,errors,hardware:'Chromium SwiftShader; mocked Gamepad API and touch adapter API; no physical gamepad or touchscreen certification'},null,2));
}catch(error){if(page)console.error('DIAGNOSTIC',JSON.stringify(await page.evaluate(()=>{const g=window.__game;return{kind:window.__kind,screen:g.ui.screen,context:g.input.state.context,locked:g.input.locked,input:g.input.read(),held:g.input.held('primary'),position:g.body.position,velocity:g.body.velocity,mode:g.mode,flying:g.body.flying,hit:g.hit,entityHit:g.entityHit?.id,mine:g.mineProgress,yaw:g.yaw,pitch:g.pitch,original:g.world.get(0,202,-3)};})));if(page)await page.screenshot({path:output+'/failure.png'});throw error;}
finally{await browser?.close();server.kill();}
