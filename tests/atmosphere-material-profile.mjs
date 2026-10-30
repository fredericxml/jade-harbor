// Controlled shader-placement experiment, separate from hardware FPS claims.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {verifyReleaseManifest} from '../scripts/release-integrity.mjs';
verifyReleaseManifest();const source=createHash('sha256').update(JSON.stringify(JSON.parse(await readFile('dist/release-integrity.json','utf8')).source)).digest('hex');
const output=process.env.ATMOSPHERE_PROFILE_OUTPUT??'test-results/atmosphere-material-profile',records=[],errors=[];
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4193','--strictPort'],{stdio:['ignore','pipe','pipe']});let browser,page;
try{
 await mkdir(output,{recursive:true});await new Promise((ok,no)=>{server.stdout.on('data',d=>{if(d.toString().includes('Local:'))ok();});server.on('exit',c=>no(Error('server '+c)));});browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});page=await browser.newPage({viewport:{width:960,height:600}});page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>localStorage.setItem('jade-harbor-settings',JSON.stringify({distance:3,simulationDistance:4})));
 await page.goto('http://127.0.0.1:4193');await page.locator('[data-action="new"]').click();await page.locator('[data-action="create"]').click();await page.waitForFunction(()=>window.__game?.active);
 await page.evaluate(()=>{
  const g=window.__game;g.pause();g.frame=()=>{};const p={x:132.5,y:21.002,z:-100.5};g.body.position={...p};g.previous={...p};g.view.camera.position.set(p.x,p.y+1.61,p.z);g.view.camera.rotation.set(-.035,-Math.PI/2,0,'YXZ');
  for(const key of g.world.stream(p.x,p.z,3))g.view.remove(key);for(let z=-3;z<=3;z++)for(let x=-3;x<=3;x++)if(x*x+z*z<=12.25)g.world.ensure(Math.floor(p.x/16)+x,Math.floor(p.z/16)+z,true);g.lighting.rebuild();for(let i=0;i<512&&g.world.dirty.size;i++)g.view.rebuild(g.world,6);
  g.entities.life.reactivate();g.entities.life.prepare(g.entities.list,p,.25,false,g.entities.elapsed,g.entities.navigation);g.entityView.update(g.entities,g.entities.elapsed);g.view.hand.visible=false;g.ui.overlay.style.display='none';for(let i=0;i<512&&!g.view.distant.stats.ready;i++)g.view.updateDistant(g.world);
  const pattern=/vec2 commercial=[\s\S]*?float hierarchy=[^;]+;/;
  window.__materialVariants=g.view.materials.map(m=>{
    const v=m.vertexShader,f=m.fragmentShader,block=f.match(pattern)?.[0]??v.match(pattern)?.[0];if(!block)throw Error('Missing hierarchy experiment target');
    let baseV=v.replace(pattern,'').replace('vHierarchy=hierarchy;',''),baseF=f.replace(pattern,'float hierarchy=vHierarchy;');
    if(!baseV.includes('uniform float night;'))baseV='uniform float night;'+baseV;
    if(!baseV.includes('varying float vHierarchy;'))baseV='varying float vHierarchy;'+baseV;
    if(!baseF.includes('varying float vHierarchy;'))baseF='varying float vHierarchy;'+baseF;
    return{fragment:{vertex:baseV,fragment:baseF.replace('float hierarchy=vHierarchy;',block)},vertex:{vertex:baseV.replace('vec4 mv=',block+'vHierarchy=hierarchy;vec4 mv='),fragment:baseF}};
  });
 });
 for(const hour of[12,23])for(let lap=0;lap<3;lap++)for(const variant of(lap%2?['vertex','fragment']:['fragment','vertex'])){
  const result=await page.evaluate(({hour,variant})=>{
   const g=window.__game,v=g.view;v.atmosphere.reset((hour-6)/24,false,3);v.environment((hour-6)/24);v.updateDistant(g.world);
   v.materials.forEach((m,i)=>{m.vertexShader=window.__materialVariants[i][variant].vertex;m.fragmentShader=window.__materialVariants[i][variant].fragment;m.needsUpdate=true;});
   const gl=v.renderer.getContext();for(let i=0;i<4;i++){v.render();gl.finish();}const samples=[];for(let i=0;i<16;i++){const t=performance.now();v.render();gl.finish();samples.push(performance.now()-t);}v.render();gl.finish();return{samples,render:{...v.worldRenderStats},png:v.canvas.toDataURL('image/png')};
  },{hour,variant});
  if(lap===2)await writeFile(`${output}/${hour}-${variant}.png`,Buffer.from(result.png.split(',')[1],'base64'));delete result.png;records.push({hour,lap,variant,...result});console.log('MATERIAL PROFILE',hour,lap,variant);
 }
 const q=(a,p)=>[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*p)],summary=[12,23].map(hour=>{const samples=variant=>records.filter(r=>r.hour===hour&&r.variant===variant).flatMap(r=>r.samples),f=samples('fragment'),v=samples('vertex');return{hour,fragmentMedian:q(f,.5),vertexMedian:q(v,.5),ratio:q(v,.5)/q(f,.5),fragmentP95:q(f,.95),vertexP95:q(v,.95),samplesPerVariant:f.length};});assert.deepEqual(errors,[]);verifyReleaseManifest();await writeFile(`${output}/results.json`,JSON.stringify({status:'measured',source,summary,records,errors,note:'Same paused camera, exact geometry/residents/uniforms; alternated shader placement, four warm draws and sixteen render+gl.finish wall-time samples per block. SwiftShader CPU/GPU completion diagnostic, not elapsed gameplay FPS or physical GPU timing. PNG equality must be checked independently.'},null,2));console.log(JSON.stringify(summary));
}catch(e){await writeFile(`${output}/failure.json`,JSON.stringify({source,error:String(e),records,errors},null,2));throw e;}finally{await browser?.close();server.kill();}
