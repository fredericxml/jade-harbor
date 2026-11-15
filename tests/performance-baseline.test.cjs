#!/usr/bin/env node
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {FramePacer,frameRateLimit,frameUrgent}=require('../src/render/frame-pacer.ts');
const {AdaptiveResolution}=require('../src/render/adaptive-resolution.ts');
const {GpuTimer}=require('../src/render/gpu-timer.ts');

for(const [hz,target] of [[30,30],[60,60],[72,36],[75,37.5],[90,45],[120,60],[144,48],[165,55]]){
  const pacer=new FramePacer();let draws=0;
  for(let frame=0;frame<=hz*2;frame++)pacer.ready(frame*1000/hz,'playing','auto');
  assert.equal(pacer.targetFps,target,`${hz} Hz Auto target`);
  for(let frame=hz*2+1;frame<=hz*6;frame++)if(pacer.ready(frame*1000/hz,'playing','auto'))draws++;
  assert(Math.abs(draws-target*4)<=2,`${hz} Hz Auto cadence: ${draws} draws, expected ${target*4}`);
}
assert.equal(frameRateLimit('auto'),'auto');assert.equal(frameRateLimit(0),0);assert.equal(frameRateLimit(30),30);
assert.equal(frameUrgent(true,false,true),false,'active chunk queues must not bypass the presentation cap');
assert.equal(frameUrgent(true,true,true),true,'resize/layout work remains urgent');
assert.equal(frameUrgent(false,false,true),true,'inactive loading work remains urgent');
const resumed=new FramePacer();for(let i=0;i<90;i++)resumed.ready(i*1000/90,'playing','auto');resumed.ready(5000,'hidden','auto');for(let i=0;i<180;i++)resumed.ready(5016.7+i*1000/90,'playing','auto');assert.equal(resumed.targetFps,45,'hidden/resume re-estimates native RAF cadence');

function feed(controller,duration,gap,cpu,renderCpu,gpuMs,targetFps){for(let now=0;now<duration;now+=gap)controller.observe(now,gap,cpu,renderCpu,gpuMs,targetFps);}
let adaptive=new AdaptiveResolution();adaptive.configure(true,60);feed(adaptive,19000,100,20,0,null,60);assert.equal(adaptive.scale,1);assert.equal(adaptive.bottleneck,'cpu');assert.match(adaptive.decision,/resolution unchanged/);
adaptive=new AdaptiveResolution();adaptive.configure(true,60);feed(adaptive,19000,100,5,1,28,60);assert(adaptive.scale<1);assert.equal(adaptive.bottleneck,'gpu');
adaptive=new AdaptiveResolution();adaptive.configure(true,60);feed(adaptive,19000,100,14,12,null,60);assert.equal(adaptive.scale,1);assert.equal(adaptive.bottleneck,'render-cpu');
adaptive=new AdaptiveResolution();adaptive.configure(true,60);feed(adaptive,19000,100,5,1,2,60);assert.equal(adaptive.scale,1);assert.equal(adaptive.bottleneck,'unknown','low measured GPU time must not be mislabeled as GPU pressure');
adaptive=new AdaptiveResolution();adaptive.configure(true,60);feed(adaptive,19000,100,14,9,28,60);assert(adaptive.scale<1);assert.equal(adaptive.bottleneck,'mixed');
adaptive=new AdaptiveResolution();adaptive.configure(true,'auto');feed(adaptive,19000,23,5,1,null,45);assert.equal(adaptive.scale,1,'Auto 45 FPS budget is used rather than a hard-coded 60 FPS budget');

function gpuFixture(){let disjoint=false;const queries=[];const gl={QUERY_RESULT_AVAILABLE:1,QUERY_RESULT:2,getExtension:()=>({TIME_ELAPSED_EXT:3,GPU_DISJOINT_EXT:4}),createQuery:()=>{const q={available:false,result:2_500_000,deleted:false};queries.push(q);return q;},beginQuery(){},endQuery(){},deleteQuery(q){q.deleted=true;},getParameter:()=>disjoint,getQueryParameter:(q,key)=>key===1?q.available:q.result};return{gl,queries,setDisjoint(v){disjoint=v;}};}
let fixture=gpuFixture(),timer=new GpuTimer(fixture.gl);for(let i=0;i<3;i++)assert.equal(timer.begin(),false);assert.equal(timer.begin(),true);timer.end();assert.equal(timer.poll(100),null,'unavailable query is never synchronously read');fixture.queries[0].available=true;assert.deepEqual(timer.poll(116),{timeMs:2.5,completedAt:116});assert(fixture.queries[0].deleted);
fixture=gpuFixture();timer=new GpuTimer(fixture.gl);for(let i=0;i<4;i++)if(timer.begin())timer.end();fixture.queries[0].available=true;fixture.setDisjoint(true);assert.equal(timer.poll(200),null);assert(fixture.queries[0].deleted,'disjoint GPU sample is discarded');
const unsupported=new GpuTimer({getExtension:()=>null});assert.equal(unsupported.supported,false);assert.equal(unsupported.begin(),false);
console.log('PASS performance regressions: Auto pacing 30–165 Hz, lifecycle resume, CPU/GPU classification, target budgets and asynchronous/disjoint GPU queries');
