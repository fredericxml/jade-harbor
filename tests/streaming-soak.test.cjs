const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const worldSource=read('src/world/world.ts');
const game=read('src/core/game.ts');
const pkg=JSON.parse(read('package.json'));

function loadWorld(){
  const worldPath=path.join(root,'src/world/world.ts');
  const source=fs.readFileSync(worldPath,'utf8').replaceAll('import.meta.url','"file:///jade-harbor/src/world/world.js"');
  const js=ts.transpileModule(source,{fileName:worldPath,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  class FakeColumn{constructor(){this.sections=new Map();}set(){}static from(){return new FakeColumn();}}
  const mocks={
    '../core/coords':{CHUNK:16,MIN_Y:-64,MAX_Y:320,MIN_SECTION:-4,MAX_SECTION:19,sectionKey:(x,y,z)=>`${x},${y},${z}`,index:()=>0,chunkCoord:n=>Math.floor(n/16),localCoord:n=>((n%16)+16)%16,chunkKey:(x,z)=>`${x},${z}`,blockKey:(x,y,z)=>`${x},${y},${z}`},
    './sections':{BlockColumn:FakeColumn},
    './generator':{createGenerator:(_seed,version)=>({version,generate:()=>new FakeColumn()}),clearGeneratorCache:()=>{}},
    './blocks':{B:{Air:0}},
    './metropolis/plan':{urbanAt:()=>undefined},
    './landmarks/builders':{landmarkAt:()=>undefined},
  };
  const moduleObject={exports:{}};
  Function('require','module','exports',js)(id=>Object.prototype.hasOwnProperty.call(mocks,id)?mocks[id]:require(id),moduleObject,moduleObject.exports);
  return moduleObject.exports.World;
}
class FakeWorker{
  static instances=[];
  constructor(){this.messages=[];this.terminated=false;this.onmessage=null;this.onerror=null;this.onmessageerror=null;FakeWorker.instances.push(this);}
  postMessage(message){this.messages.push(message);}
  terminate(){this.terminated=true;}
  completeOne(){const request=this.messages.find((m)=>!this.completed?.has(m.ticket));if(!request)return false;this.completed??=new Set();this.completed.add(request.ticket);this.onmessage?.({data:{...request,sections:[],elapsedMs:1}});return true;}
}

test('streaming telemetry tracks bounded queue pressure, queue wait and stream churn',()=>{
  assert.match(worldSource,/workerQueueHighWater/);
  assert.match(worldSource,/pendingHighWater/);
  assert.match(worldSource,/workerQueueWaitAverageMs/);
  assert.match(worldSource,/workerQueueWaitMaxMs/);
  assert.match(worldSource,/oldestQueuedAgeMs/);
  assert.match(worldSource,/streamFrames/);
  assert.match(worldSource,/streamEvictions/);
  assert.match(game,/worldStreaming:this\.world\.streamingDiagnostics/);
  assert.ok(game.includes("Worker queue ${streaming.workerQueued}"));
  assert.ok(game.includes("wait avg/max ${streaming.workerQueueWaitAverageMs.toFixed(1)}"));
});

test('queued request timestamps are removed on dispatch, pruning, cancellation and disposal',()=>{
  assert.match(worldSource,/workerQueueTimes\.set\(request\.ticket,performance\.now\(\)\)/);
  assert.match(worldSource,/workerQueueTimes\.delete\(request\.ticket\)/);
  assert.match(worldSource,/workerQueueTimes\.clear\(\)/);
  const cancel=worldSource.slice(worldSource.indexOf('private cancelQueuedRequest'),worldSource.indexOf('private pruneWorkerQueue'));
  const prune=worldSource.slice(worldSource.indexOf('private pruneWorkerQueue'),worldSource.indexOf('accept(cx:'));
  assert.match(cancel,/workerQueueTimes\.delete/);
  assert.match(prune,/workerQueueTimes\.delete/);
});

test('rapid camera oscillation soak keeps worker and pending queues bounded over 2400 stream frames',()=>{
  const previous=global.Worker;FakeWorker.instances=[];global.Worker=FakeWorker;
  try{
    const World=loadWorld(),world=new World('streaming-oscillation',{},true,3);
    let maxPending=0,maxQueue=0,maxChunks=0,completed=0;
    for(let frame=0;frame<2400;frame++){
      const phase=frame%240;
      const sweep=phase<120?phase:240-phase;
      const x=sweep*24;
      const z=(Math.floor(frame/60)%2)*192;
      world.stream(x,z,2,((frame%90)/90)*Math.PI*2);
      maxPending=Math.max(maxPending,world.pending.size);
      maxQueue=Math.max(maxQueue,world.workerQueue.length);
      maxChunks=Math.max(maxChunks,world.chunks.size);
      assert.ok(world.pending.size<=8,`pending cap exceeded at frame ${frame}`);
      assert.ok(world.workerQueue.length<=8,`queued cap exceeded at frame ${frame}: pending=${world.pending.size}, queue=${world.workerQueue.length}, active=${!!world.workerBusy}, worker=${!!world.worker}`);
      assert.ok(world.workerQueue.every(r=>world.pending.has(`${r.cx},${r.cz}`)),'queue contains an obsolete request');
      if(frame%2===1&&world.worker&&world.workerBusy){
        const worker=world.worker;
        const request=world.workerBusy;
        worker.onmessage?.({data:{...request,sections:[],elapsedMs:1}});
        completed++;
      }
    }
    const diag=world.streamingDiagnostics;
    assert.equal(diag.streamFrames,2400);
    assert.ok(diag.streamRequests>0);
    assert.ok(diag.workerQueueHighWater<=8);
    assert.ok(diag.pendingHighWater<=8);
    assert.ok(diag.workerQueueWaitSamples>0);
    assert.ok(Number.isFinite(diag.workerQueueWaitAverageMs)&&diag.workerQueueWaitAverageMs>=0);
    assert.ok(Number.isFinite(diag.workerQueueWaitMaxMs)&&diag.workerQueueWaitMaxMs>=0);
    assert.ok(Number.isFinite(diag.oldestQueuedAgeMs)&&diag.oldestQueuedAgeMs>=0);
    assert.ok(maxPending<=8&&maxQueue<=8);
    assert.ok(maxChunks<120,`loaded chunk residency grew unexpectedly: ${maxChunks}`);
    assert.ok(completed>500,`too few completed worker jobs: ${completed}`);
    world.dispose();
    assert.equal(world.workerQueueTimes.size,0,'dispose must release all queue timestamps');
  }finally{if(previous===undefined)delete global.Worker;else global.Worker=previous;}
});

test('stale preemption and late worker replies do not leak queue timestamps or publish obsolete chunks',()=>{
  const previous=global.Worker;FakeWorker.instances=[];global.Worker=FakeWorker;
  try{
    const World=loadWorld(),world=new World('streaming-preempt',{},true,3);
    world.stream(0,0,1);
    const staleWorker=world.worker,staleRequest=world.workerBusy,lateHandler=staleWorker.onmessage;
    world.stream(1600,1600,1);
    world.workerBusySince=performance.now()-121;
    world.stream(1600,1600,1);
    assert.equal(staleWorker.terminated,true);
    assert.ok(world.streamingDiagnostics.workerPreemptions>=1);
    lateHandler?.({data:{...staleRequest,sections:[],elapsedMs:1}});
    assert.equal(world.chunks.has(`${staleRequest.cx},${staleRequest.cz}`),false);
    assert.ok(world.workerQueue.every(r=>world.pending.has(`${r.cx},${r.cz}`)));
    assert.equal(world.workerQueueTimes.size,world.workerQueue.length);
    world.dispose();
    assert.equal(world.workerQueueTimes.size,0);
  }finally{if(previous===undefined)delete global.Worker;else global.Worker=previous;}
});

test('unsaved edit pins and queue diagnostics remain independent during long stream movement',()=>{
  const previous=global.Worker;FakeWorker.instances=[];global.Worker=FakeWorker;
  try{
    const World=loadWorld(),world=new World('streaming-edit-pin',{},true,3);
    world.stream(0,0,1);
    const request=world.workerBusy;
    world.worker.onmessage?.({data:{...request,sections:[],elapsedMs:1}});
    // Pin the loaded column with the same durability marker used by the save system.
    world.dirtyEdits.set('0,0,0',1);
    const removed=world.stream(4096,0,1);
    assert.ok(!removed.includes('0,0'),'unsaved column must not be evicted');
    assert.ok(world.chunks.has('0,0'));
    const diag=world.streamingDiagnostics;
    assert.equal(diag.streamFrames,2);
    assert.ok(diag.pendingHighWater<=8);
    world.dispose();
  }finally{if(previous===undefined)delete global.Worker;else global.Worker=previous;}
});
test('consolidated world:runtime release coverage for streaming soak', () => {
  const pkg=JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'../package.json'),'utf8'));
  assert.ok(pkg.scripts['test:world:runtime']?.includes('tests/streaming-soak.test.cjs'), 'Behavioral test must remain in its subsystem suite');
  assert.ok(pkg.scripts['test:regression']?.includes('npm run test:world'), 'Regression must execute the subsystem');
  assert.ok(pkg.scripts['test:world']?.includes('npm run test:world:runtime'), 'World runner must include streaming');
});
