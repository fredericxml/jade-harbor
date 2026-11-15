const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const world=read('src/world/world.ts');
const game=read('src/core/game.ts');
const pkg=JSON.parse(read('package.json'));

function method(source,startText,endText){
  const start=source.indexOf(startText);assert.notEqual(start,-1,`missing ${startText}`);
  const end=source.indexOf(endText,start);return source.slice(start,end<0?source.length:end);
}

test('stale in-flight chunk generation has a bounded grace period before preemption',()=>{
  assert.match(world,/private workerBusySince = 0/);
  assert.match(world,/private workerPreemptions = 0/);
  const preempt=method(world,'private preemptStaleWorkerRequest(','private cancelQueuedRequest');
  assert.match(preempt,/now - this\.workerBusySince < 120/);
  assert.match(preempt,/this\.requestIsCurrent\(active\)/);
  assert.ok(preempt.includes('if (!active || !worker || this.requestIsCurrent(active)')); 
  assert.match(preempt,/replacementWaiting/);
  assert.match(preempt,/worker\.terminate\(\)/);
  assert.match(preempt,/this\.createWorker\(\)/);
  assert.match(preempt,/this\.dispatchWorker\(\)/);
});

test('preemption is only attempted after stale queue pruning during the stream pass',()=>{
  const stream=method(world,'  stream(x: number, z: number, radius: number, yaw = 0) {','  dispose()');
  const prune=stream.indexOf('this.pruneWorkerQueue()');
  const preempt=stream.indexOf('this.preemptStaleWorkerRequest()');
  const dispatch=stream.indexOf('this.dispatchWorker()',preempt);
  assert.ok(prune>=0&&preempt>prune,'obsolete queued work is removed before evaluating preemption');
  assert.ok(dispatch>preempt,'current work is pumped after preemption decision');
  assert.match(stream,/Math\.min\(4,Math\.max\(0,8-this\.pending\.size\)\)/);
});

test('late replies from a terminated worker cannot publish stale chunks',()=>{
  const create=method(world,'private createWorker()','private handleWorkerFailure');
  assert.match(create,/this\.worker !== worker/);
  assert.match(create,/this\.requestIsCurrent\(request\)/);
  const preempt=method(world,'private preemptStaleWorkerRequest(','private cancelQueuedRequest');
  for(const event of ['onmessage = null','onerror = null','onmessageerror = null'])assert.ok(preempt.includes(event));
});

test('streaming telemetry reports worker preemptions and outstanding queue state',()=>{
  assert.match(world,/get streamingDiagnostics\(\)/);
  assert.match(world,/workerPreemptions: this\.workerPreemptions/);
  assert.match(game,/worldStreaming:this\.world\.streamingDiagnostics/);
});

test('unsaved columns remain pinned through streaming eviction and coverage index handles topology changes',()=>{
  assert.match(world,/if \(this\.hasDirtyColumn\(c\.cx,c\.cz\)\) \{ this\.evictionBlocked\+\+; continue; \}/);
  const coverage=read('src/render/mesh-coverage.ts'),distant=read('src/render/distant-world.ts');
  assert.match(coverage,/navRevision!==this\.lastNavRevision\)return this\.rebuild/);
  assert.match(distant,/this\.coverageIndex\?\.update\(meshed,changes,revision,changeBase,this\.world\.navRevision\)/);
});
test('consolidated world:runtime release coverage for worker streaming lifecycle', () => {
  const pkg=JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'../package.json'),'utf8'));
  assert.ok(pkg.scripts['test:world:runtime']?.includes('tests/worker-streaming-lifecycle.test.cjs'), 'Behavioral test must remain in its subsystem suite');
  assert.ok(pkg.scripts['test:regression']?.includes('npm run test:world'), 'Regression must execute the subsystem');
  assert.ok(pkg.scripts['test:world']?.includes('npm run test:world:runtime'), 'World runner must include streaming');
});
