// Isolate adapter CPU work. This is not a GPU/FPS or physical-controller test.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {verifyReleaseManifest} from '../scripts/release-integrity.mjs';
verifyReleaseManifest();
const source=createHash('sha256').update(JSON.stringify(JSON.parse(await readFile('dist/release-integrity.json','utf8')).source)).digest('hex');
const out=process.env.INPUT_PROFILE_OUTPUT??'test-results/input-poll-profile';await mkdir(out,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4198','--strictPort'],{stdio:['ignore','pipe','pipe']});let browser;
try {
 await new Promise((ok,no)=>{server.stdout.on('data',b=>{if(b.toString().includes('Local:'))ok();});server.on('error',no);server.on('exit',c=>no(Error('Vite exit '+c)));});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:960,height:600}});await page.goto('http://127.0.0.1:4198');await page.waitForFunction(()=>window.__game);
 const rows=await page.evaluate(async()=>{
  const {Input}=await import('/src/player/input.ts');
  const canvas=document.createElement('canvas');const input=new Input(canvas);const pad={connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};let pads=[];
  Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>pads});
  const rows=[];
  for(const kind of['no-controller','standard-controller','mixed-16-touch']){
   input.clear();pads=kind==='no-controller'?[]:[pad];pad.axes.fill(0);for(const b of pad.buttons){b.value=0;b.pressed=false;}input.poll(0);
   if(kind!=='no-controller'){pad.axes[0]=.6;pad.axes[2]=.7;pad.buttons[7]={value:1,pressed:true};}
   if(kind==='mixed-16-touch')for(let id=0;id<16;id++){input.touch.setMove(id,.1,.2);input.touch.press(id,'sprint');}
   for(let i=0;i<2000;i++){input.poll(1/60);input.readTick();input.consumeTick();}
   const samples=[],frame=input.readTick();for(let batch=0;batch<200;batch++){const start=performance.now();for(let i=0;i<100;i++){input.poll(1/60);if(input.readTick()!==frame)throw Error('Input snapshot allocated');input.consumeTick();}samples.push((performance.now()-start)/100);}
   samples.sort((a,b)=>a-b);rows.push({kind,iterations:20000,p50Ms:samples[100],p95Ms:samples[190],maxBatchPerPollMs:samples.at(-1),touchPointers:input.touch.pointerCount,stableFrameObject:true});
  }
  input.dispose();return rows;
 });
 const result={status:'completed',source,rows,method:'200 batches of 100 input.poll+readTick+consumeTick calls after 2,000 warmups per case; mocked API; CPU only, no physical device or GPU timing'};await writeFile(out+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();server.kill();}
