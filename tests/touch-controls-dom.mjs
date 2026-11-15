// Isolated DOM contracts use constructed PointerEvents and the real original city adapter.
export async function touchDomContracts(page) {
 return page.evaluate(async()=>{
  const {TouchControls}=await import('/src/ui/touch-controls.ts');
  const {InputState}=await import('/src/player/input-state.ts');
  const {TouchInputAdapter}=await import('/src/player/touch-input.ts');
  const checks=[],assert=(v,m)=>{if(!v)throw Error(m);},pass=m=>checks.push(m);
  const host=document.createElement('section'),root=document.createElement('div');host.append(root);document.body.append(host);
  root.id='isolated-touch-controls';
  const s=new InputState(),port=new TouchInputAdapter(s),commands=[];s.register('keyboard');
  s.onCommand=c=>commands.push({...c});s.onQueued=()=>s.flush();
  const tc=new TouchControls(root,port,{mouseLock:()=>commands.push({action:'mouse-lock'}),renderItem:stack=>`<span>${stack.id}</span>`,itemName:stack=>'Item '+stack.id});
  tc.configure('on',1);tc.setScreen(true);tc.setGameplay(true,'creative');
  const fire=(node,type,id,x=100,y=100,extra={})=>node.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',button:0,pointerId:id,clientX:x,clientY:y,...extra}));
  const b=a=>root.querySelector(`[data-touch-action="${a}"]`);
  const reset=()=>{tc.clear();s.consumeTick();s.consumeLook();commands.length=0;tc.setScreen(true);tc.setGameplay(true,'creative');};
  try {
   for(const action of ['jump','sprint','crouch','primary','secondary','pause','inventory','drop','toggleFlight']) {
    reset();if(['drop','toggleFlight'].includes(action)){root.querySelector('.touch-more').click();}
    fire(b(action),'pointerdown',11);assert(s.held(action),action+' held');
    if(['jump','primary','secondary','sprint','crouch','drop'].includes(action))assert(b(action).getAttribute('aria-pressed')==='true',action+' visibly active only while held');
    fire(b(action),'pointerdown',11);assert(tc.pointerCount===1,'duplicate pointer ignored');
    fire(b(action),'pointerup',11);fire(b(action),'lostpointercapture',11);s.flush(true);
    assert(!s.held(action)&&tc.pointerCount===0,action+' release');
    if(['jump','primary','secondary','sprint','crouch','drop'].includes(action))assert(b(action).getAttribute('aria-pressed')==='false',action+' visual resets on release');
    const expected=['jump','secondary','pause','inventory','drop','toggleFlight'].includes(action)?1:0;
    assert(commands.length===expected,action+' rising command exactly once');
    if(action==='primary')assert(s.pressed('primary'),'completed primary edge retained after implicit lost capture');
    for(const reason of ['pointercancel','lostpointercapture']) {
     reset();if(['drop','toggleFlight'].includes(action))root.querySelector('.touch-more').click();
     fire(b(action),'pointerdown',12);fire(b(action),reason,12);assert(!s.held(action)&&tc.pointerCount===0,action+' cancellation');
     if(action==='jump'||action==='secondary'){s.flush(true);assert(commands.length===0,'pending world action cancelled');}
    }
   }
   pass('all nine action buttons preserve single rising edges, momentary pressed visuals, cancellation and implicit capture-loss ordering');
   reset();fire(b('primary'),'pointerdown',20,100,100);assert(s.held('primary'),'attack begins held');fire(b('primary'),'pointermove',20,140,120);assert(s.held('primary')&&b('primary').getAttribute('aria-pressed')==='true','attack remains held while dragging');assert(Math.abs(s.read().lookX-.3)<1e-9&&Math.abs(s.read().lookY-.15)<1e-9,'attack drag also steers the camera');fire(b('primary'),'pointermove',20,180,120);assert(s.held('primary')&&Math.abs(s.read().lookX-.6)<1e-9,'continued swipe accumulates look without releasing attack');fire(b('primary'),'pointerup',20,180,120);assert(!s.held('primary')&&b('primary').getAttribute('aria-pressed')==='false','attack ends only on release');
   pass('hold-and-drag Mine/Attack keeps the attack source active while the same pointer rotates the camera until release');
   reset();fire(b('primary'),'pointerdown',21);fire(b('primary'),'pointerdown',22);fire(b('primary'),'pointercancel',21);
   assert(s.held('primary')&&b('primary').classList.contains('is-pressed'),'one contact cannot release another hold');fire(b('primary'),'pointerup',22);assert(!s.held('primary'),'last hold ends');
   reset();fire(tc.joystick,'pointerdown',31);fire(tc.joystick,'pointerdown',32);fire(tc.lookSurface,'pointerdown',33);fire(tc.lookSurface,'pointerdown',34);fire(b('jump'),'pointerdown',35);fire(b('primary'),'pointerdown',36);
   assert(tc.pointerCount===4,'one joystick and one look owner plus two actions');fire(tc.lookSurface,'pointermove',33,120,90);fire(tc.lookSurface,'pointermove',34,900,900);
   assert(Math.abs(s.read().lookX-.15)<1e-9,'second look pointer ignored');fire(b('jump'),'pointercancel',35);assert(s.held('primary')&&tc.pointerCount===3,'source-local cancellation');
   pass('bounded pointer roles support simultaneous move/look/actions and reject second joystick/look owners without cancelling others');
   reset();s.setAction('keyboard','sprint',true);for(let id=100;id<130;id++)fire(b('primary'),'pointerdown',id);
   assert(tc.pointerCount===16&&port.pointerCount===16,'16-pointer cap');tc.clear();assert(s.held('sprint')&&tc.pointerCount===0,'touch clear preserves keyboard');s.clearSource('keyboard');
   fire(b('primary'),'pointerdown',101);fire(b('primary'),'pointerup',101);fire(b('primary'),'pointerdown',101);fire(b('primary'),'pointercancel',101);
   assert(s.pressed('primary'),'reused ID cancellation retains earlier completed tap');
   pass('contact cap, ID reuse and touch clear preserve independent source intent');
   for(const sensitivity of [.5,1,2]) {
    reset();tc.configure('on',sensitivity);fire(tc.lookSurface,'pointerdown',41,100,100);assert(s.read().lookX===0,'no down jump');
    fire(tc.lookSurface,'pointermove',41,140,80);const f=s.read();assert(Math.abs(f.lookX-.3*sensitivity)<1e-9&&Math.abs(f.lookY+.15*sensitivity)<1e-9,'sensitivity applied once');
    fire(tc.lookSurface,'pointerup',41);s.consumeLook();fire(tc.lookSurface,'pointermove',41,900,900);assert(s.read().lookX===0,'no released drift');
   }
   pass('swipe conversion applies minimum/default/maximum sensitivity once and stops after release');
   reset();fire(b('jump'),'pointerdown',50);tc.setScreen(false);s.flush(true);assert(tc.pointerCount===0&&!s.held('jump')&&commands.length===0&&!tc.visible,'modal drops pending edges');
   tc.setScreen(true);tc.setGameplay(true,'creative');fire(b('primary'),'pointerdown',51);window.dispatchEvent(new Event('resize'));assert(tc.pointerCount===0&&!s.held('primary'),'resize clears');
   fire(b('crouch'),'pointerdown',52);tc.configure('off',1);assert(!tc.visible&&!s.held('crouch'),'Off clears');tc.configure('on',1);tc.setGameplay(true,'creative');
   pass('screen hiding, resize and Off reset owned actions, visuals and pending world commands');
   reset();let locks=0;const original=commands.length;fire(tc.lookSurface,'pointerdown',61,10,10,{pointerType:'mouse'});assert(commands.at(-1)?.action==='mouse-lock'&&tc.pointerCount===0,'mouse follows lock callback');
   fire(tc.lookSurface,'pointermove',61,60,60,{pointerType:'mouse'});assert(s.read().lookX===0,'mouse never becomes swipe');
   fire(tc.lookSurface,'pointerdown',62,10,10,{pointerType:'pen'});assert(tc.pointerCount===1,'pen look accepted');fire(tc.lookSurface,'pointerup',62);
   pass('mouse look-surface gestures use desktop lock while pen uses touch intent');
   reset();const inv={selected:0,slots:Array.from({length:9},(_,i)=>({id:i+1,count:2}))};tc.updateHotbar(inv,'survival',false);
   const nodes=[...tc.slots],joystick=tc.joystick;fire(tc.slots[3],'pointerdown',71);assert(commands.at(-1).action==='hotbarSelect'&&commands.at(-1).value===3,'zero-based slot');
   for(let i=0;i<30;i++){inv.slots[3].count++;inv.selected=3;tc.updateHotbar(inv,'survival',false);}
   assert(tc.joystick===joystick&&nodes.every((node,i)=>node===tc.slots[i])&&tc.pointerCount===1,'stable nodes during hotbar updates');assert(tc.slots[3].getAttribute('aria-pressed')==='true','selected highlight');fire(tc.slots[3],'pointerup',71);
   pass('nine hotbar button identities and captured owner survive count/icon/selection refreshes');
   reset();tc.setGameplay(true,'survival');root.querySelector('.touch-more').click();assert(b('toggleFlight').hidden,'flight hidden in Survival');tc.setGameplay(true,'creative');root.querySelector('.touch-more').click();assert(!b('toggleFlight').hidden,'flight shown in Creative');assert(!b('drop').hidden&&!root.querySelector('.touch-utility').hidden,'More reveals Drop and Flight');
   tc.setFlightState(true);assert(b('toggleFlight').getAttribute('aria-pressed')==='true','Flight toggle exposes persistent active state');tc.setFlightState(false);assert(b('toggleFlight').getAttribute('aria-pressed')==='false','Flight toggle clears active state when flight ends');
   fire(b('drop'),'pointerdown',79);assert(b('drop').getAttribute('aria-pressed')==='true','Drop active while being pressed');fire(b('drop'),'pointerup',79);assert(b('drop').getAttribute('aria-pressed')==='false'&&!tc.utilityOpen,'Drop resets and More tray closes after selection');
   fire(b('sprint'),'pointerdown',80);root.querySelector('.touch-more').click();assert(tc.utilityOpen,'tray open alongside sprint');document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:81,pointerType:'touch',button:0}));assert(!tc.utilityOpen&&s.held('sprint'),'outside closes tray without unrelated cancellation');fire(b('sprint'),'pointerup',80);
   pass('right-hand More actions respect mode, Flight state persists, Drop is momentary, and tray dismissal preserves unrelated holds');
   reset();const capture=tc.joystick.setPointerCapture;tc.joystick.setPointerCapture=()=>{throw new DOMException('test','NotFoundError');};fire(tc.joystick,'pointerdown',90);assert(tc.pointerCount===1,'capture exception safe');window.dispatchEvent(new PointerEvent('pointermove',{pointerId:90,clientX:120,clientY:100,cancelable:true}));window.dispatchEvent(new PointerEvent('pointerup',{pointerId:90}));assert(tc.pointerCount===0&&s.read().moveX===0,'outside release after capture failure');tc.joystick.setPointerCapture=capture;
   const listenerCount=tc.listenerCount;fire(b('primary'),'pointerdown',91);tc.dispose();assert(tc.listenerCount===0&&tc.pointerCount===0&&!s.held('primary'),'dispose releases');fire(b('primary'),'pointerdown',92);window.dispatchEvent(new Event('resize'));assert(tc.pointerCount===0,'disposed listeners inert');
   pass('recoverable capture failure and disposal leave no held action or listener growth');
  } finally {tc.dispose();host.remove();}
  // Emulate changing media-query capabilities without UA strings.
  const originalMedia=window.matchMedia,desc=Object.getOwnPropertyDescriptor(navigator,'maxTouchPoints');
  const media=new Map();window.matchMedia=query=>{const m=new EventTarget();m.matches=false;m.media=query;media.set(query,m);return m;};Object.defineProperty(navigator,'maxTouchPoints',{configurable:true,value:5});
  const h=document.createElement('section'),el=document.createElement('div');h.append(el);document.body.append(h);const state=new InputState(),adapter=new TouchInputAdapter(state),control=new TouchControls(el,adapter,{mouseLock(){},renderItem(){return '';},itemName(){return '';}});
  try{control.setScreen(true);control.setGameplay(true,'creative');assert(!control.visible,'fine hover hybrid Auto hidden');const coarse=media.get('(pointer: coarse)');coarse.matches=true;coarse.dispatchEvent(new Event('change'));assert(control.visible,'media changes enable Auto');coarse.matches=false;coarse.dispatchEvent(new Event('change'));assert(!control.visible,'media changes disable Auto');control.configure('on',1);assert(control.visible,'manual override');pass('Auto responds to capability changes and preserves a manual hybrid override');}
  finally{control.dispose();h.remove();window.matchMedia=originalMedia;if(desc)Object.defineProperty(navigator,'maxTouchPoints',desc);else delete navigator.maxTouchPoints;}
  return checks;
 });
}
