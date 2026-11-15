// Reproducible presentation/input CPU sample; no physical-device or GPU timing.
import {createRequire} from 'node:module';
const {chromium}=createRequire(process.cwd()+'/package.json')('playwright');
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out=process.env.TOUCH_PROFILE_OUTPUT??'test-results/touch-profile';await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile('dist/release-integrity.json','utf8')),source=createHash('sha256').update(JSON.stringify(manifest.source)).digest('hex');
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4197','--strictPort'],{stdio:['ignore','pipe','pipe']});let browser;
try {
 await new Promise((ok,no)=>{server.stdout.on('data',b=>{if(b.toString().includes('Local:'))ok();});server.on('exit',no);server.on('error',no);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});await page.goto('http://127.0.0.1:4197');await page.waitForFunction(()=>window.__game);
 const data=await page.evaluate(async()=>{
  const g=window.__game;g.frame=()=>{};await new Promise(requestAnimationFrame);
  g.ui.show('none');const c=g.ui.touchControls;if(c){c.configure('on',1);g.input.setContext('gameplay');c.setGameplay(true,'survival');if(!c.visible)throw Error('profile requires visible controls');}
  const hud={name:'UI CPU fixture',mode:'survival',biome:'Jade Harbor',x:0,y:21,z:0,time:'12:00',target:'Resident 20/20',health:20,hunger:20,xp:0,breath:7,effects:'Speed 60s',flying:false,progress:.5,hitFlash:false,hitMessage:'',debug:''};
  const sample=(name,batches,count,fn)=>{for(let i=0;i<100;i++)fn();const values=[];for(let b=0;b<batches;b++){const t=performance.now();for(let i=0;i<count;i++)fn();values.push((performance.now()-t)/count);}values.sort((a,b)=>a-b);return{name,calls:batches*count,p50Ms:values[Math.floor(values.length*.5)],p95Ms:values[Math.floor(values.length*.95)],maxBatchMeanMs:values.at(-1)};};
  const rows=[sample('full-hud-update',100,5,()=>g.ui.updateHUD(g.inventory,hud))];
  let diagnostics=null;
  if(c){
   const {joystickVector}=await import('/src/ui/touch-controls.ts'),v={x:0,y:0};rows.push(sample('joystick-math',100,1000,()=>joystickVector(42,19,0,0,40,v)));
   const root=c.element,joy=c.joystick,rect=joy.getBoundingClientRect();
   joy.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',button:0,pointerId:777,clientX:rect.x+rect.width/2,clientY:rect.y+rect.height/2}));
   if(c.pointerCount!==1||g.input.touch.pointerCount!==1)throw Error('joystick must own a live contact before profiling');
   const event=new PointerEvent('pointermove',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:777,clientX:rect.x+rect.width/2+30,clientY:rect.y+rect.height/2-20});
   rows.push(sample('joystick-pointermove-dispatch',100,100,()=>joy.dispatchEvent(event)));
   if(Math.hypot(g.input.read().moveX,g.input.read().moveY)<.1)throw Error('pointermove profile must feed actual analog intent');
   joy.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:777,pointerType:'touch'}));
   const inv={selected:0,slots:g.inventory.slots.map(s=>s?{...s}:null)};inv.slots[0]={id:22,count:2};
   const buttons=[...root.querySelectorAll('button')],listeners=c.listenerCount,nodes=root.querySelectorAll('*').length;
   rows.push(sample('unchanged-hotbar-update',100,100,()=>c.updateHotbar(inv,'survival',false)));
   rows.push(sample('one-slot-hotbar-update',100,20,()=>{inv.slots[0].count=inv.slots[0].count===2?3:2;c.updateHotbar(inv,'survival',false);}));
   for(let i=0;i<100;i++){c.setScreen(false);c.setScreen(true);c.setGameplay(true,'survival');}
   diagnostics={nodesBefore:nodes,nodesAfter:root.querySelectorAll('*').length,buttonsStable:buttons.every((b,i)=>b===root.querySelectorAll('button')[i]),listenersBefore:listeners,listenersAfter:c.listenerCount,activePointers:c.pointerCount,adapterPointers:g.input.touch.pointerCount};
   if(!diagnostics.buttonsStable||diagnostics.nodesBefore!==diagnostics.nodesAfter||listeners!==c.listenerCount||c.pointerCount||g.input.touch.pointerCount)throw Error('DOM/listener/contact growth');
  }
  return{rows,diagnostics};
 });
 const result={status:'completed',source,version:manifest.version,...data,method:'Same 844x390 touch-emulated Chromium, paused Game scheduling for presentation-only CPU fixture; 100 warmups per case; p50/p95 are batch means per call. Pointermove includes constructed PointerEvent dispatch; HUD does not include deferred layout/GPU work.'};await writeFile(out+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();server.kill();}
