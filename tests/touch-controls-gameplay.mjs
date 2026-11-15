import assert from 'node:assert/strict';

// Deterministic fixed-tick parity uses constructed PointerEvents on actual DOM controls.
// The separate CDP path in touch-controls-browser exercises trusted multi-touch input.
export async function touchGameplayParity(page) {
 const results=[];
 await page.evaluate(async()=>{
  const g=window.__game;g.pause();window.__touchOriginalFrame=g.frame;g.frame=()=>{};await new Promise(requestAnimationFrame);
  window.__touchNativeLock=HTMLCanvasElement.prototype.requestPointerLock;
  window.__touchEmit=(selector,type,id,x,y)=>{const node=document.querySelector(selector),r=node.getBoundingClientRect();node.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',button:0,pointerId:id,clientX:x??r.x+r.width/2,clientY:y??r.y+r.height/2}));};
 });
 const reset=async(kind,sky=false)=>{
  await page.evaluate(async({kind,sky})=>{
   const g=window.__game;g.input.clear();g.settings.touchControls=kind==='desktop'?'off':'on';g.settings.touchSensitivity=1;g.applySettings();g.ui.pointerType=kind==='desktop'?'mouse':'touch';
   g.view.canvas.requestPointerLock=kind==='desktop'?window.__touchNativeLock:undefined;
   const saved=structuredClone(window.__touchBase);saved.id=crypto.randomUUID();saved.revision=0;saved.mode='creative';await g.start(saved);g.pause();g.resume(false);
   g.yaw=g.pitch=0;const p=g.body.position;for(let z=-3;z<=3;z++)for(let x=-3;x<=3;x++)g.world.ensure(Math.floor(p.x/16)+x,Math.floor(p.z/16)+z,true);
   if(sky){g.body.position={x:.5,y:201.002,z:.5};g.previous={...g.body.position};g.body.velocity={x:0,y:0,z:0};g.body.flying=true;g.yaw=g.pitch=0;for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++)g.world.ensure(x,z,true);g.world.set(0,202,-3,22);g.inventory.selected=0;g.inventory.slots[0]={id:22,count:64};}
   window.__touchKind=kind;window.__touchOrigin={...g.body.position};window.__touchContacts={};window.__touchSerial=1000;window.__touchHUD();
  },{kind,sky});
  if(kind==='desktop'){await page.locator('canvas#game').click();await page.waitForFunction(()=>window.__game.input.locked);await page.evaluate(()=>{window.__game.input.poll(0);window.__game.yaw=window.__game.pitch=0;});}
  else {
   await page.waitForFunction(()=>!document.pointerLockElement&&!window.__game.input.locked);
   // The render loop is paused in this fixture. Drain the previous desktop
   // unlock lifecycle, then perform the presentation resume normally done by Game.frame.
   await page.evaluate(()=>{const g=window.__game;g.resume(false);g.ui.touchControls.setGameplay(g.input.state.context==='gameplay',g.mode);window.__touchHUD();if(!g.ui.touchControls.visible)throw Error('touch fixture not ready');});
  }
 };
 const button=async(action,down)=>{
  const kind=await page.evaluate(()=>window.__touchKind);
  if(kind==='desktop') {
   const key={forward:'KeyW',strafe:'KeyD',sprint:'ShiftLeft',crouch:'ControlLeft',jump:'Space'}[action];
   if(key)await page.keyboard[down?'down':'up'](key);
   else await page.mouse[down?'down':'up']({button:action==='primary'?'left':'right'});
  } else await page.evaluate(({action,down})=>{
   const emit=window.__touchEmit,selector=action==='forward'||action==='strafe'?'.touch-joystick':`[data-touch-action="${action}"]`;
   if(down){const id=++window.__touchSerial;window.__touchContacts[action]={id,selector};
    if(action==='forward'||action==='strafe'){const r=document.querySelector(selector).getBoundingClientRect();emit(selector,'pointerdown',id,r.x+r.width/2+(action==='strafe'?r.width*.4:0),r.y+r.height/2-(action==='forward'?r.width*.4:0));}
    else emit(selector,'pointerdown',id);
   }else {const p=window.__touchContacts[action];if(p){emit(p.selector,'pointerup',p.id);delete window.__touchContacts[action];}}
  },{action,down});
 };
 const ticks=n=>page.evaluate(n=>{
  const g=window.__game,descriptor=Object.getOwnPropertyDescriptor(performance,'now');let clock=0;Object.defineProperty(performance,'now',{configurable:true,value:()=>clock+=.0001});
  try{for(let i=0;i<n;i++)g.tick(.05);}finally{if(descriptor)Object.defineProperty(performance,'now',descriptor);else delete performance.now;}
 },n);
 for(const kind of ['desktop','touch-dom']) {
  await reset(kind);await button('forward',true);await ticks(10);await button('sprint',true);await ticks(10);await button('sprint',false);await button('crouch',true);await ticks(10);await button('crouch',false);await button('jump',true);await ticks(4);await button('jump',false);await ticks(12);await button('forward',false);await button('strafe',true);await ticks(8);await button('strafe',false);
  const movement=await page.evaluate(()=>{const g=window.__game,s=g.snapshot();return {moved:Math.hypot(g.body.position.x-window.__touchOrigin.x,g.body.position.z-window.__touchOrigin.z),position:s.player.position,velocity:{...g.body.velocity},inventory:s.player.slots,health:g.health,hunger:g.hunger,xp:g.xp,time:g.time,selected:g.inventory.selected,mode:g.mode,ids:g.entities.list.map(e=>e.id).sort(),active:g.entities.life.active.size};});
  assert(movement.moved>2,kind+' '+JSON.stringify({...movement,ids:undefined}));
  if(results.length){
   const reference=results[0].movement;assert.equal(movement.ids.length,reference.ids.length);for(let i=0;i<movement.ids.length;i++)assert.equal(movement.ids[i],reference.ids[i],'resident/entity identity '+i);
   for(const field of ['position','velocity'])for(const axis of ['x','y','z'])assert(Math.abs(movement[field][axis]-reference[field][axis])<1e-10,field+'/'+axis);
   assert(Math.abs(movement.moved-reference.moved)<1e-10,'movement distance');
   const {ids,position,velocity,moved,...actualState}=movement,{ids:oldIds,position:oldPosition,velocity:oldVelocity,moved:oldMoved,...referenceState}=reference;assert.deepEqual(actualState,referenceState,'54 fixed ticks preserve inventory, mode, time and simulation state');
  }
  results.push({kind,movement});
  await reset(kind,true);await button('primary',true);await button('primary',false);await ticks(1);assert.equal(await page.evaluate(()=>window.__game.world.get(0,202,-3)),22,'tap must not bypass held-mining rule');
  await page.evaluate(async()=>{const g=window.__game,{spawnEntity}=await import('/src/game/entities.ts');const entity=spawnEntity('panda',{x:.5,y:201.6,z:-1.5},'Touch tap fixture');g.entities.list.push(entity);window.__touchTarget=entity;g.attackCooldown=0;});
  await button('primary',true);await button('primary',false);await ticks(1);const attacked=await page.evaluate(()=>{const g=window.__game;return{health:window.__touchTarget.health,p:{...g.body.position},target:{...window.__touchTarget.body.position},yaw:g.yaw,pitch:g.pitch,mode:g.mode,entity:g.entityHit?.id,expected:window.__touchTarget.id,held:g.input.held('primary'),pressed:g.input.pressed('primary'),context:g.input.state.context,cooldown:g.attackCooldown};});assert.equal(attacked.health,19,'tap attacks once after release '+kind+' '+JSON.stringify(attacked));
  await page.evaluate(()=>{const g=window.__game;g.entities.list=g.entities.list.filter(e=>e.id!==window.__touchTarget.id);});
  await button('primary',true);await ticks(10);await button('primary',false);assert.equal(await page.evaluate(()=>window.__game.world.get(0,202,-3)),0,'held primary mines');
  await page.evaluate(()=>{const g=window.__game;g.world.set(0,202,-3,22);g.cooldown=0;});await button('secondary',true);await ticks(1);await button('secondary',false);
  const actions=await page.evaluate(()=>{const g=window.__game;return{placed:g.world.get(0,202,-2),original:g.world.get(0,202,-3),inventory:g.inventory.slots,cooldown:g.cooldown};});assert.equal(actions.placed,22);if(kind!=='desktop')assert.deepEqual(actions,results[0].actions);results.find(r=>r.kind===kind).actions=actions;
 }
 await reset('touch-dom',true);
 const extra=await page.evaluate(async()=>{
  const g=window.__game,emit=window.__touchEmit,act=(action,id)=>{const selector=`[data-touch-action="${action}"]`;emit(selector,'pointerdown',id);emit(selector,'pointerup',id);};
  const more=()=>document.querySelector('.touch-more').click();
  g.body.flying=false;more();act('toggleFlight',2001);if(!g.body.flying)throw Error('Creative Flight control');g.mode='survival';g.body.flying=false;g.ui.touchControls.setGameplay(true,g.mode);more();if(!document.querySelector('[data-touch-action="toggleFlight"]').hidden)throw Error('Survival flight hidden');
  g.input.clear();g.resume(false);g.inventory.slots[0]={id:22,count:4};g.inventory.selected=0;g.mode='survival';g.ui.touchControls.setGameplay(true,g.mode);window.__touchHUD();more();act('drop',2002);if(g.inventory.slots[0].count!==3)throw Error('Drop uses Game inventory rule');
  // Presentation fixture for existing swim/ladder/flight conditions, not new game rules.
  g.mode='creative';g.body.flying=true;g.ui.touchControls.setGameplay(true,g.mode);g.resume(false);act('jump',2003);g.input.readTick();g.tick(.05);const tapY=g.body.velocity.y;
  emit('[data-touch-action="jump"]','pointerdown',2004);g.tick(.05);const up=g.body.velocity.y;emit('[data-touch-action="jump"]','pointerup',2004);
  emit('[data-touch-action="crouch"]','pointerdown',2005);g.tick(.05);const down=g.body.velocity.y;emit('[data-touch-action="crouch"]','pointerup',2005);
  if(up!==9||down!==-9)throw Error('existing flight hold speed');
  const {B}=await import('/src/world/blocks.ts');g.body.flying=false;g.body.position={x:.5,y:201.002,z:.5};g.body.velocity={x:0,y:0,z:0};g.world.set(0,201,0,B.Water);
  emit('[data-touch-action="jump"]','pointerdown',2008);g.tick(.05);const swim=g.body.velocity.y;emit('[data-touch-action="jump"]','pointerup',2008);if(swim<=0)throw Error('held Jump swims up');
  g.body.position={x:.5,y:201.002,z:.5};g.body.velocity={x:0,y:0,z:0};g.world.set(0,201,0,B.Ladder);emit('[data-touch-action="jump"]','pointerdown',2009);g.tick(.05);const ladder=g.body.velocity.y;emit('[data-touch-action="jump"]','pointerup',2009);if(ladder!==3)throw Error('held Jump climbs ladder');g.world.set(0,201,0,0);
  // Cancel a jump before the fixed tick, and cancel cooldown-delayed secondary.
  g.body.flying=false;g.body.grounded=true;g.cooldown=.2;emit('[data-touch-action="jump"]','pointerdown',2006);emit('[data-touch-action="jump"]','pointercancel',2006);emit('[data-touch-action="secondary"]','pointerdown',2007);emit('[data-touch-action="secondary"]','lostpointercapture',2007);g.input.readTick(true);if(g.jumpRequest||g.useRequest)throw Error('cancelled world command replay');
  return{flightUp:up,flightDown:down,swimUp:swim,ladderUp:ladder,droppedCount:3,cancelledPending:true};
 });
 return {results:results.map(r=>({...r,movement:{...r.movement,identities:r.movement.ids.length,ids:undefined}})),extra};
}
