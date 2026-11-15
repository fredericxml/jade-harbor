#!/usr/bin/env node
"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ts=require("typescript");
require.extensions[".ts"]=(module,filename)=>{
  module._compile(ts.transpileModule(fs.readFileSync(filename,"utf8"),{
    fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}
  }).outputText,filename);
};

const {FramePacer}=require("../src/render/frame-pacer.ts");
const {Metrics}=require("../src/core/metrics.ts");

class LegacyFramePacer {
  constructor(){
    this.mode=undefined;this.deadline=0;this.last=-Infinity;this.cadence=[];
    this.autoStarted=-1;this.autoEvaluated=-Infinity;this.autoTarget=60;this.autoCandidate=60;
    this.autoCandidateCount=0;this.displayHz=60;this.targetFps=60;this.transitioned=false;
  }
  resetCadence(){this.cadence.length=0;this.autoStarted=-1;this.autoEvaluated=-Infinity;this.autoTarget=60;this.autoCandidate=60;this.autoCandidateCount=0;this.displayHz=60;}
  sampleCadence(now){
    if(this.last>-Infinity){
      const interval=now-this.last;
      if(interval>100)this.resetCadence();
      else if(interval>=4){this.cadence.push({at:now,interval});if(this.cadence.length>90)this.cadence.shift();if(this.autoStarted<0)this.autoStarted=now-interval;}
    }
    if(now-this.autoEvaluated<1000||this.cadence.length<24||now-this.autoStarted<500)return;
    this.autoEvaluated=now;
    const intervals=this.cadence.map(s=>s.interval).sort((a,b)=>a-b);
    const median=intervals[Math.floor(intervals.length*.5)],refreshHz=1000/median;
    if(!Number.isFinite(refreshHz)||refreshHz<29||refreshHz>300)return;
    this.displayHz=Math.round(refreshHz);
    let candidate=0;
    if(refreshHz>60.5){const stableHz=Math.round(refreshHz),divisor=Math.max(1,Math.ceil((stableHz-.001)/60));candidate=Math.max(30,Math.min(60,stableHz/divisor));}
    if(candidate===this.autoTarget){this.autoCandidate=candidate;this.autoCandidateCount=0;}
    else if(candidate===this.autoCandidate)this.autoCandidateCount++;
    else{this.autoCandidate=candidate;this.autoCandidateCount=1;}
    if(this.autoCandidateCount>=2){this.autoTarget=candidate;this.autoCandidateCount=0;}
  }
  ready(now,mode,limit=0,urgent=false){
    this.transitioned=false;if(!Number.isFinite(now))return false;if(now<this.last)this.reset();
    if(mode!==this.mode){this.mode=mode;this.deadline=now;this.transitioned=true;if(mode==="hidden")this.resetCadence();}
    if(mode==="hidden"){this.last=now;this.targetFps=0;return false;}
    this.sampleCadence(now);this.last=now;const selected=limit==="auto"?this.autoTarget:limit;this.targetFps=selected||this.displayHz;
    const interval=mode==="paused"?500:selected?1000/selected:0;
    if(!interval||urgent||this.transitioned){this.deadline=now+interval;return true;}
    if(now+.25<this.deadline)return false;
    this.deadline+=(Math.floor((Math.max(0,now-this.deadline)+.25)/interval)+1)*interval;return true;
  }
  reset(){this.mode=undefined;this.deadline=0;this.last=-Infinity;this.targetFps=60;this.transitioned=false;this.resetCadence();}
}

class LegacyMetrics {
  constructor(){this.samples=new Map();}
  add(name,value){if(!Number.isFinite(value)||value<0)return;const a=this.samples.get(name)??[];if(a.length===240)a.shift();a.push(value);this.samples.set(name,a);}
  summary(name){
    const a=[...(this.samples.get(name)??[])].sort((x,y)=>x-y);
    const q=p=>a[Math.min(a.length-1,Math.floor(a.length*p))]??0,total=a.reduce((n,v)=>n+v,0);
    const slow=a.slice(-Math.max(1,Math.ceil(a.length*.01))),slowMean=slow.reduce((n,v)=>n+v,0)/slow.length;
    return {count:a.length,p50:q(.5),p95:q(.95),p99:q(.99),mean:a.length?total/a.length:0,max:a.at(-1)??0,
      over50Ms:a.filter(n=>n>50).length,onePercentLow:name==="frame"&&slowMean>0?1000/slowMean:null};
  }
}

function loadWorld(){
  const worldPath=path.join(__dirname,"../src/world/world.ts");
  const source=fs.readFileSync(worldPath,"utf8").replaceAll("import.meta.url",'"file:///jade-harbor/src/world/world.js"');
  const js=ts.transpileModule(source,{fileName:worldPath,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const mocks={
    "../core/coords":require("../src/core/coords.ts"),
    "./sections":require("../src/world/sections.ts"),
    "./generator":{createGenerator:(_seed,version)=>({version,generate:()=>new (require("../src/world/sections.ts").BlockColumn)()}),
      clearGeneratorCache:()=>{}},
    "./blocks":require("../src/world/blocks.ts"),
    "./metropolis/plan":{urbanAt:()=>undefined},
    "./landmarks/builders":{landmarkAt:()=>undefined}
  };
  const moduleObject={exports:{}};
  Function("require","module","exports",js)(id=>Object.prototype.hasOwnProperty.call(mocks,id)?mocks[id]:require(id),moduleObject,moduleObject.exports);
  return moduleObject.exports.World;
}

test("FramePacer uses retained typed-array cadence storage with no per-RAF sample objects",()=>{
  const pacer=new FramePacer();
  assert.ok(pacer.cadence instanceof Float64Array);
  assert.ok(pacer.cadenceScratch instanceof Float64Array);
  const cadence=pacer.cadence,scratch=pacer.cadenceScratch;
  for(let i=0;i<5000;i++)pacer.ready(i*1000/144,"playing","auto");
  assert.equal(pacer.cadence,cadence);
  assert.equal(pacer.cadenceScratch,scratch);
  assert.equal(pacer.cadence.length,90);
  assert.equal(pacer.cadenceCount,90);
  assert.equal(pacer.targetFps,48);
});

test("typed-array FramePacer matches the previous cadence and transition contract",()=>{
  const scenarios=[
    {hz:60,frames:1800,mode:"playing",limit:"auto"},
    {hz:72,frames:1800,mode:"playing",limit:"auto"},
    {hz:90,frames:1800,mode:"playing",limit:"auto"},
    {hz:120,frames:1800,mode:"playing",limit:"auto"},
    {hz:144,frames:1800,mode:"playing",limit:"auto"},
    {hz:165,frames:1800,mode:"playing",limit:"auto"},
    {hz:60,frames:1200,mode:"playing",limit:30},
  ];
  for(const scenario of scenarios){
    const actual=new FramePacer(),legacy=new LegacyFramePacer();
    for(let i=0;i<scenario.frames;i++){
      const now=i*1000/scenario.hz;
      assert.equal(actual.ready(now,scenario.mode,scenario.limit),legacy.ready(now,scenario.mode,scenario.limit),`draw parity ${scenario.hz}Hz frame ${i}`);
      assert.equal(actual.targetFps,legacy.targetFps,`target parity ${scenario.hz}Hz frame ${i}`);
      assert.equal(actual.transitioned,legacy.transitioned);
    }
  }
  const actual=new FramePacer(),legacy=new LegacyFramePacer();
  const steps=[
    [0,"playing","auto",false],[16,"playing","auto",false],[2000,"playing","auto",false],
    [2016,"hidden","auto",false],[60000,"paused","auto",false],[60500,"paused","auto",true],
    [60600,"playing",30,false],[60616,"playing",30,false],[0,"playing",60,false],
    [16,"playing",60,false],[200,"paused",60,true]
  ];
  for(const [now,mode,limit,urgent] of steps){
    assert.equal(actual.ready(now,mode,limit,urgent),legacy.ready(now,mode,limit,urgent));
    assert.equal(actual.targetFps,legacy.targetFps);
    assert.equal(actual.transitioned,legacy.transitioned);
  }
});

test("Metrics ring buffers preserve exact rolling summaries after wraparound",()=>{
  const actual=new Metrics(),legacy=new LegacyMetrics();
  let seed=0xdecafbad;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/0x100000000;};
  const names=["frame","simulation","render","meshQueue","worldStream"];
  for(let i=0;i<7000;i++){
    const name=names[Math.floor(random()*names.length)];
    const value=i%97===0?55+random()*80:random()*42;
    actual.add(name,value);legacy.add(name,value);
    if(i%31===0)for(const candidate of names)assert.deepEqual(actual.summary(candidate),legacy.summary(candidate),`${candidate} at ${i}`);
  }
  for(const name of names)assert.deepEqual(actual.summary(name),legacy.summary(name),name);
  assert.deepEqual(actual.summary("missing"),legacy.summary("missing"));
});

test("Metrics retain one bounded typed ring and sort scratch buffer per metric",()=>{
  const metrics=new Metrics();
  for(let i=0;i<300;i++)metrics.add("frame",i);
  const window=metrics.samples.get("frame");
  assert.ok(window.values instanceof Float64Array);
  assert.ok(window.sorted instanceof Float64Array);
  assert.equal(window.count,240);
  const values=window.values,sorted=window.sorted;
  for(let i=0;i<1000;i++)metrics.add("frame",i%80);
  metrics.summary("frame");
  assert.equal(window.values,values);
  assert.equal(window.sorted,sorted);
  assert.equal(window.count,240);
});

test("World reuses its eviction-result array between stream frames",()=>{
  const World=loadWorld(),{BlockColumn}=require("../src/world/sections.ts");
  const world=new World("streaming-stream-buffer",{},false,3);
  world.accept(0,0,new BlockColumn());
  world.accept(20,20,new BlockColumn());
  const first=world.stream(0,0,0);
  assert.deepEqual(first,["20,20"]);
  const identity=first;
  const second=world.stream(0,0,0);
  assert.equal(second,identity);
  assert.deepEqual(second,[]);
  world.dispose();
});

test("World compacts queued worker requests in place without replacing queue storage",()=>{
  const previous=global.Worker;
  class FakeWorker {
    static instances=[];
    constructor(){this.messages=[];this.terminated=false;this.onmessage=null;this.onerror=null;this.onmessageerror=null;FakeWorker.instances.push(this);}
    postMessage(message){this.messages.push(message);}
    terminate(){this.terminated=true;}
  }
  global.Worker=FakeWorker;
  try{
    const World=loadWorld(),world=new World("streaming-queue-buffer",{},true,3);
    world.ensure(0,0);world.ensure(1,0);world.ensure(2,0);
    const queue=world.workerQueue;
    assert.equal(queue.length,2);
    world.cancelQueuedRequest("1,0");
    assert.equal(world.workerQueue,queue);
    assert.equal(queue.length,1);
    assert.equal(`${queue[0].cx},${queue[0].cz}`,"2,0");
    world.pending.delete("2,0");
    world.pruneWorkerQueue();
    assert.equal(world.workerQueue,queue);
    assert.equal(queue.length,0);
    world.dispose();
  }finally{if(previous===undefined)delete global.Worker;else global.Worker=previous;}
});

test("World advances dirtyAddRevision only when a section newly enters the mesh queue",()=>{
  const World=loadWorld(),world=new World("dirty-add-revision",{},false,3);
  const before=world.dirtyAddRevision;
  world.markSection(0,0,0);
  assert.equal(world.dirtyAddRevision,before+1,"new mesh work advances the addition revision");
  world.markSection(0,0,0);
  assert.equal(world.dirtyAddRevision,before+1,"duplicate dirty marks do not invalidate the queue again");
  assert.equal(world.dirtyAddQueue.length,1,"pending admissions are coalesced to one queue record");
  world.dirty.delete("0,0,0");
  world.markSection(0,0,0);
  assert.equal(world.dirtyAddRevision,before+2,"re-adding completed work advances the revision");
  assert.equal(world.dirtyAddQueue.length,1,"a still-pending admission is not duplicated after a delete/re-add burst");
  world.dispose();
});

test("renderer reuses pooled section candidates and its persistent nearest-first heap",()=>{
  const source=fs.readFileSync(path.join(__dirname,"../src/render/renderer.ts"),"utf8");
  assert.match(source,/private readonly nearestSections:NearestSection\[\]=\[\]/);
  assert.match(source,/private readonly nearestSectionPool:NearestSection\[\]=\[\]/);
  assert.match(source,/const nearest=this\.nearestSections(?:\s*\?\?\s*\(this\.nearestSections as NearestSection\[\]\))?;/);
  assert.doesNotMatch(source,/nearest\.splice\(/);
  assert.match(source,/for\(const entry of this\.nearestSectionPool\)\{entry\.key="";entry\.queued=false;entry\.firstBuild=false;entry\.ready=false;\}/);
});
