const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const renderer = fs.readFileSync(path.join(root, 'src/render/renderer.ts'), 'utf8');
const game = fs.readFileSync(path.join(root, 'src/core/game.ts'), 'utf8');

function extractedView(THREE, meshChunkSteps, perf = performance) {
  const start = renderer.indexOf('  private recordMeshChange(');
  const resize = renderer.indexOf('  resize(width?:number,height?:number) {', start);
  const dispose = renderer.indexOf('  private disposePendingCommit(', resize);
  const rebuild = renderer.indexOf('  rebuild(world: World, budget = 2) {', dispose);
  const remove = renderer.indexOf('  removeSection(', rebuild);
  const source = ts.transpileModule(
    'class T {\n' + renderer.slice(start, resize) + renderer.slice(dispose, remove) + '\n}',
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  return Function('THREE', 'meshChunkSteps', 'performance', 'MIN_SECTION', 'MAX_SECTION', source + ';return T')(
    THREE, meshChunkSteps, perf, -4, 19,
  );
}

class Group {
  constructor() { this.children = []; this.position = { set() {} }; }
  add(child) { this.children.push(child); child.parent = this; }
  removeFromParent() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
  traverse(fn) { for (const child of this.children) fn(child); }
  clear() { this.children.length = 0; }
}
class Geometry { setAttribute() { return this; } setIndex() { return this; } dispose() {} }
class Attribute { constructor(array, itemSize) { this.array = array; this.itemSize = itemSize; } }
class Mesh { constructor(geometry, material) { this.geometry = geometry; this.material = material; } }
class Vector3 { constructor(x=0,y=0,z=0) { Object.assign(this,{x,y,z}); } }
const THREE = { Group, BufferGeometry: Geometry, BufferAttribute: Attribute, Mesh, Vector3 };
const empty = () => ({
  positions: [], normals: [], uvs: [], tiles: [], colors: [], emissive: [], indices: [],
  sky: [], lights: [], emissiveTriangles: 0, waterTriangles: 0,
});
const fakePerformance = { now: (() => { let t=0; return () => (t+=0.01); })() };

function setup(View) {
  const chunks = new Map([['0,0',{cx:0,cz:0,blocks:{sections:new Map([[0,{nonAir:1}]])}}]]);
  const world = {
    dirty:new Set(['0,0,0']),chunks,navRevision:0,lightingEditRevision:0,
    dirtyAddRevision:0,dirtyAddQueue:[],dirtyAddQueueSet:new Set(),sectionDirtyRevision:new Map(),
  };
  const view = Object.assign(new (class {})(), {
    camera:{position:{x:8,y:8,z:8},facing:[0,0,-1],getWorldDirection(target){[target.x,target.y,target.z]=this.facing;return target;}},
    lastSectionY:0,lastSurfaceY:0,verticalRadius:64,deferred:new Set(),
    sections:new Map(),meshed:new Set(),meshRevision:0,groups:new Map(),sectionCoordinates:new Map(),
    nearestSections:[],nearestSectionPool:[],meshQueueHeap:[],meshQueueBackgroundHeap:[],meshQueueForegroundStreak:0,
    meshQueueEntryByKey:new Map(),dirtyScanAddCursor:0,meshAdmissionHeadroomMs:4,
    dirtyAdmissionCostMsPerKey:0.01,dirtyAdmissionBacklogHighWater:0,dirtyAdmissionEpisodeActive:false,
    meshJobs:new Map(),meshCommits:new Map(),meshQueueStartedAt:0,meshQueueStats:{},
    scene:new Group(),materials:[{},{}],metrics:{add(){}},meshChanges:[],meshChangeBase:0,
    dirtyScanEditRevision:-1,dirtyScanReady:false,dirtyScanIterator:null,dirtyScanWorld:undefined,
    dirtyScanCameraCell:'',dirtyScanPoolCount:0,dirtyScanInitialSize:0,dirtyScanScanned:0,
    dirtyScanEligible:0,dirtyScanRemesh:0,dirtyScanFirstBuild:0,dirtyScanVisibleFirstBuild:0,
    dirtyScanVisibleReady:0,dirtyScanBackgroundFirstBuild:0,dirtyScanBackgroundReady:0,
    meshQueueForward:new Vector3(0,0,-1),dirtyScanForwardX:0,dirtyScanForwardY:0,dirtyScanForwardZ:-1,
    dirtyScanEyeX:8,dirtyScanEyeY:8,dirtyScanEyeZ:8,
    sectionCoordinate:View.prototype.sectionCoordinate,meshQueueLess:View.prototype.meshQueueLess,
    updateMeshQueueForward:View.prototype.updateMeshQueueForward,updateMeshQueueEntry:View.prototype.updateMeshQueueEntry,
    heapifyMeshQueue:View.prototype.heapifyMeshQueue,refreshMeshQueueFacing:View.prototype.refreshMeshQueueFacing,
    pushMeshQueue:View.prototype.pushMeshQueue,popMeshQueue:View.prototype.popMeshQueue,
    popNextMeshQueue:View.prototype.popNextMeshQueue,recordMeshQueueReady:View.prototype.recordMeshQueueReady,
    resetMeshQueue:View.prototype.resetMeshQueue,recordMeshChange:View.prototype.recordMeshChange,
    advanceMeshCommit:View.prototype.advanceMeshCommit,disposePendingCommit:View.prototype.disposePendingCommit,
    cancelMeshWork:View.prototype.cancelMeshWork,removeSection(){},
  });
  return {world,view};
}

function addStreamingSections(world, start, count) {
  for(let x=start;x<start+count;x++){
    const key=`${x},0,0`;
    world.chunks.set(`${x},0`,{cx:x,cz:0,blocks:{sections:new Map([[0,{nonAir:1}]])}});
    world.dirty.add(key);
    world.dirtyAddQueue.push(key);
    world.dirtyAddQueueSet.add(key);
    world.sectionDirtyRevision.set(key,1);
    world.dirtyAddRevision++;
  }
}

function* slowSteps() {
  for(let i=0;i<5000;i++)yield;
  return [empty(),empty()];
}

test('crossing player camera cells preserves active generators and reorders unstarted work', () => {
  const cancelled=[];
  function* slow(_world,chunk,_lighting,sy){
    const key=`${chunk.cx},${sy},${chunk.cz}`;
    let done=false;
    try{for(let i=0;i<5000;i++)yield;done=true;return [empty(),empty()];}
    finally{if(!done)cancelled.push(key);}
  }
  const View=extractedView(THREE,slow,fakePerformance);
  const {view,world}=setup(View);
  for(const x of [2,3,4,5,6,7,8]){
    const key=`${x},0,0`;
    world.chunks.set(`${x},0`,{cx:x,cz:0,blocks:{sections:new Map([[0,{nonAir:1}]])}});
    world.dirty.add(key);
  }
  View.prototype.rebuild.call(view,world,2);
  assert.equal(view.meshJobs.size,2);
  const oldJobs=new Map([...view.meshJobs].map(([key,job])=>[key,job.iterator]));
  const scanned=view.dirtyScanScanned;
  view.camera.position.x=56;view.camera.facing=[1,0,0];
  View.prototype.rebuild.call(view,world,2);
  assert.deepEqual(cancelled,[],'unrelated partial mesh jobs are not cancelled by camera-cell changes');
  assert.equal(view.dirtyScanScanned,scanned,'crossing a camera cell does not rescan the dirty Set');
  assert.equal(view.dirtyScanCameraCell,`${Math.floor(56/16)},0,0:0`);
  for(const [key,iterator] of oldJobs)assert.equal(view.meshJobs.get(key)?.iterator,iterator);
  assert.ok(view.meshQueueHeap.length+view.meshQueueBackgroundHeap.length>0,'unstarted candidates remain queued');
  assert.equal(new Set(view.nearestSections.map(e=>e.key)).size,view.nearestSections.length);
});

test('camera motion during a 700-section initial scan never restarts or loses discovery', () => {
  const View=extractedView(THREE,slowSteps,fakePerformance);
  const {view,world}=setup(View);
  world.dirty.clear();world.chunks.clear();
  for(let x=10;x<710;x++){
    world.chunks.set(`${x},0`,{cx:x,cz:0,blocks:{sections:new Map([[0,{nonAir:1}]])}});
    world.dirty.add(`${x},0,0`);
  }
  View.prototype.rebuild.call(view,world,1);
  assert.equal(view.dirtyScanScanned,256);
  view.camera.position.x=24;view.camera.facing=[1,0,0];
  View.prototype.rebuild.call(view,world,1);
  assert.equal(view.dirtyScanScanned,512,'camera-cell change leaves the in-progress iterator intact');
  view.camera.position.x=40;view.camera.facing=[-1,0,0];
  View.prototype.rebuild.call(view,world,1);
  assert.equal(view.dirtyScanScanned,700);
  assert.equal(view.meshQueueStats.scanComplete,true);
  assert.equal(view.meshQueueEntryByKey.size,700);
  assert.equal(world.dirty.size,700);
});

test('camera relocation promotes an unstarted nearest slot without cancelling real work', () => {
  const started=[];
  function* instant(_world,c,_lighting,sy){started.push(`${c.cx},${sy},${c.cz}`);return [empty(),empty()];}
  const View=extractedView(THREE,instant,fakePerformance);
  const {view,world}=setup(View);
  for(let x=1;x<=16;x++){
    world.chunks.set(`${x},0`,{cx:x,cz:0,blocks:{sections:new Map([[0,{nonAir:1}]])}});
    world.dirty.add(`${x},0,0`);
  }
  View.prototype.rebuild.call(view,world,1);
  assert.equal(started[0],'0,0,0');
  assert.equal(view.nearestSections.length,1,'one unstarted slot was prefetched for the next frame');
  const stalePrefetch=view.nearestSections[0].key;
  view.camera.position.x=16*16+8;
  View.prototype.rebuild.call(view,world,1);
  assert.equal(started[1],'16,0,0','camera crossing selects the new nearest section, not the old prefetched slot');
  assert.notEqual(stalePrefetch,started[1]);
  assert.equal(view.dirtyScanScanned,17,'camera relocation does not rescan the initial dirty Set');
});

test('repeated camera turns retain periodic background service amid foreground churn', () => {
  const order=[],service=[];
  function* instant(_world,c,_lighting,sy){order.push(`${c.cx},${sy},${c.cz}`);return [empty(),empty()];}
  const View=extractedView(THREE,instant,fakePerformance);
  const {view,world}=setup(View);
  world.dirty.clear();world.chunks.clear();
  for(let i=4;i<=17;i++)for(const z of [-i,i]){
    const key=`0,0,${z}`;world.chunks.set(`0,${z}`,{cx:0,cz:z,blocks:{sections:new Map([[0,{nonAir:1}]])}});world.dirty.add(key);
  }
  for(let x=4;x<10;x++){
    const key=`${x},0,0`;world.chunks.set(`${x},0`,{cx:x,cz:0,blocks:{sections:new Map([[0,{nonAir:1}]])}});world.dirty.add(key);
  }
  view.popNextMeshQueue=function(){
    const entry=View.prototype.popNextMeshQueue.call(this);
    if(entry)service.push({key:entry.key,foreground:entry.foreground});
    return entry;
  };
  let frames=0;
  while(world.dirty.size&&frames<60){
    view.camera.facing=frames%2?[0,0,1]:[0,0,-1];
    View.prototype.rebuild.call(view,world,1);
    frames++;
  }
  assert.equal(order.length,34,'all sections complete despite repeated reprioritization');
  assert.equal(new Set(order).size,order.length,'no work gets served twice');
  assert.equal(world.dirty.size,0);
  assert.ok(service.slice(0,16).filter(entry=>!entry.foreground).length>=3,
    'background priority is serviced periodically while camera-facing priorities churn');
  assert.equal(order.filter(key=>Number(key.split(',')[0])>=4).length,6,
    'permanently off-axis background entries are eventually served');
});

test('interleaved additions and re-dirties during partial journal consumption preserve every section', () => {
  const View=extractedView(THREE,slowSteps,fakePerformance);
  const {world,view}=setup(View);
  View.prototype.rebuild.call(view,world,1);
  View.prototype.setMeshAdmissionHeadroom.call(view,0);
  addStreamingSections(world,10,600);
  View.prototype.rebuild.call(view,world,1);
  const firstBatch=view.meshQueueStats.admittedThisFrame;
  assert.equal(firstBatch,16);
  assert.equal(view.meshQueueStats.admissionBacklog,584);
  const anchorJob=view.meshJobs.get('0,0,0')?.iterator;
  addStreamingSections(world,700,40);
  // Re-dirty an already queued (but not yet admitted) key without duplicating
  // its journal record. This mirrors eviction/reload or bulk lighting changes.
  world.dirty.delete('400,0,0');
  world.dirty.add('400,0,0');
  world.sectionDirtyRevision.set('400,0,0',2);
  assert.equal(world.dirtyAddQueueSet.has('400,0,0'),true);
  let admissions=firstBatch,frames=0;
  while(world.dirtyAddQueue.length&&frames<100){
    View.prototype.rebuild.call(view,world,1);
    admissions+=view.meshQueueStats.admittedThisFrame;
    frames++;
  }
  assert.equal(world.dirtyAddQueue.length,0);
  assert.equal(world.dirtyAddQueueSet.size,0);
  assert.equal(admissions,640,'the journal consumes exactly the originally added keys');
  assert.equal(world.dirty.size+view.meshed.size,641,'no dirty section was lost when additions arrived mid-consumption');
  assert.equal(view.dirtyScanScanned,1,'the original snapshot is not rescanned');
  assert.equal(view.meshQueueEntryByKey.has('400,0,0'),true);
  assert.ok(view.meshJobs.get('0,0,0')?.iterator===anchorJob||view.meshed.has('0,0,0'));
});

test('world replacement cancels old jobs and resets admission episode metrics', () => {
  const cancelled=[];
  function* slow(_world,c,_lighting,sy){
    let done=false;const key=`${c.cx},${sy},${c.cz}`;
    try{for(let i=0;i<4000;i++)yield;done=true;return [empty(),empty()];}
    finally{if(!done)cancelled.push(key);}
  }
  const View=extractedView(THREE,slow,fakePerformance);
  const {world,view}=setup(View);
  View.prototype.rebuild.call(view,world,1);
  addStreamingSections(world,50,600);
  View.prototype.setMeshAdmissionHeadroom.call(view,0);
  View.prototype.rebuild.call(view,world,1);
  assert.equal(view.meshQueueStats.admissionBacklogHighWater,600);
  assert.ok(world.dirtyAddQueue.length>0);
  const oldJob=view.meshJobs.get('0,0,0')?.iterator;
  const other=setup(View).world;
  other.dirty.clear();other.chunks.clear();
  for(let x=950;x<970;x++){
    other.chunks.set(`${x},0`,{cx:x,cz:0,blocks:{sections:new Map([[0,{nonAir:1}]])}});
    other.dirty.add(`${x},0,0`);
  }
  View.prototype.rebuild.call(view,other,1);
  assert.equal(view.dirtyScanWorld,other);
  assert.ok(cancelled.includes('0,0,0'),'replaced-world mesh generator is cancelled');
  assert.notEqual(view.meshJobs.get('0,0,0')?.iterator,oldJob);
  assert.equal(view.dirtyAdmissionBacklogHighWater,0,'new world starts a fresh journal episode');
  assert.equal(view.meshQueueStats.admissionBacklog,0);
  assert.equal(view.meshQueueEntryByKey.size,20,'new-world coverage replaces old-world candidate ownership');
  assert.equal(view.dirtyScanScanned,20);
});

test('evicted completed entries are compacted and spare object storage is bounded', () => {
  const View=extractedView(THREE,slowSteps,fakePerformance);
  const {world,view}=setup(View);
  View.prototype.rebuild.call(view,world,1);
  const anchor=view.nearestSections[0];
  assert.ok(anchor && view.meshJobs.has(anchor.key));
  for(let x=100;x<900;x++){
    view.nearestSectionPool.push({key:`${x},0,0`,cx:x,sy:0,cz:0,distance:x*x,foreground:false,
      firstBuild:false,ready:true,queued:false});
    view.dirtyScanPoolCount++;
  }
  // Deferred sections are no longer meshed even when their source column
  // remains loaded. Their obsolete completion records must also be reclaimed.
  world.chunks.set('900,0',{cx:900,cz:0,blocks:{sections:new Map([[0,{nonAir:1}]])}});
  view.nearestSectionPool.push({key:'900,0,0',cx:900,sy:0,cz:0,distance:900*900,foreground:false,
    firstBuild:false,ready:true,queued:false});
  view.dirtyScanPoolCount++;
  const oldCount=view.dirtyScanPoolCount;
  View.prototype.rebuild.call(view,world,1);
  assert.ok(view.dirtyScanPoolCount<oldCount/10,'stale evicted or deferred pool records are reclaimed');
  assert.ok(view.nearestSectionPool.length<=256,'historical spare allocations are trimmed');
  assert.equal(view.nearestSections[0],anchor,'active job retains its original candidate object');
  assert.ok(view.meshJobs.has('0,0,0'));
  assert.equal(view.meshQueueEntryByKey.get('0,0,0'),anchor);
});

test('idle state clears admission peaks while keeping an empty allocation-free queue', () => {
  function* instant(){return [empty(),empty()];}
  const View=extractedView(THREE,instant,fakePerformance);
  const {view,world}=setup(View);
  View.prototype.rebuild.call(view,world,1);
  assert.equal(world.dirty.size,0);
  // Large spent burst pools are released after the world becomes idle.
  for(let i=0;i<1200;i++)view.nearestSectionPool.push({key:'',queued:false});
  view.dirtyAdmissionBacklogHighWater=123;
  View.prototype.rebuild.call(view,world,1);
  assert.equal(view.nearestSectionPool.length,512,'idle keeps a bounded warm candidate pool');
  assert.equal(view.meshQueueStats.admissionBacklogHighWater,0);
  assert.equal(view.meshQueueStats.admissionBacklog,0);
  assert.equal(view.dirtyScanWorld,world);
  view.camera.position.x=40;
  View.prototype.rebuild.call(view,world,1);
  assert.equal(view.dirtyScanReady,true);
  assert.equal(view.meshQueueStats.admissionBacklogHighWater,0);
});
test('consolidated rendering release coverage for mesh queue stability', () => {
  const pkg=JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'../package.json'),'utf8'));
  assert.ok(pkg.scripts['test:rendering']?.includes('tests/mesh-queue-stability.test.cjs'), 'Behavioral test must remain in its subsystem suite');
  assert.ok(pkg.scripts['test:regression']?.includes('npm run test:rendering'), 'Regression must execute the subsystem');
  assert.ok(pkg.scripts['test:performance']?.includes('npm run test:rendering'), 'Performance verification must execute rendering');
  assert.ok(renderer.includes('appVersion'));
  assert.ok(renderer.includes('this.dirtyScanPoolCount=retained'));
});
