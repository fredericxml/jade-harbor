const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const renderer = fs.readFileSync(path.join(root, 'src/render/renderer.ts'), 'utf8');
const worldSource = fs.readFileSync(path.join(root, 'src/world/world.ts'), 'utf8');

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

function setup(View, keys, steps) {
  const chunks = new Map(), dirty = new Set(keys);
  for (const key of keys) {
    const [cx, sy, cz] = key.split(',').map(Number);
    chunks.set(`${cx},${cz}`, { cx, cz, blocks: { sections: new Map([[sy,{nonAir:1}]]) } });
  }
  const world = {
    dirty, chunks, navRevision:0, lightingEditRevision:0, chunkTopologyRevision:0,
    dirtyAddRevision:0, dirtyAddQueue:[], dirtyAddQueueSet:new Set(), sectionDirtyRevision:new Map(),
  };
  const view = Object.assign(new (class {})(), {
    camera:{position:{x:8,y:8,z:8},facing:[0,0,-1],getWorldDirection(target){[target.x,target.y,target.z]=this.facing;return target;}},
    lastSectionY:0,lastSurfaceY:0,verticalRadius:64,deferred:new Set(),
    sections:new Map(),meshed:new Set(),meshRevision:0,groups:new Map(),sectionCoordinates:new Map(),
    nearestSections:[],nearestSectionPool:[],meshQueueHeap:[],meshQueueBackgroundHeap:[],meshQueueForegroundStreak:0,
    meshQueueEntryByKey:new Map(),dirtyScanAddCursor:0,
    meshAdmissionHeadroomMs:4,dirtyAdmissionCostMsPerKey:0.01,dirtyAdmissionBacklogHighWater:0,dirtyAdmissionEpisodeActive:false,
    meshJobs:new Map(),meshCommits:new Map(),meshQueueStartedAt:0,meshQueueStats:{},
    scene:new Group(),materials:[{},{}],metrics:{add(){}},meshChanges:[],meshChangeBase:0,
    dirtyScanEditRevision:-1,dirtyScanAddRevision:-1,dirtyScanReady:false,dirtyScanIterator:null,
    dirtyScanWorld:undefined,dirtyScanCameraCell:'',dirtyScanPoolCount:0,dirtyScanInitialSize:0,
    dirtyScanScanned:0,dirtyScanEligible:0,dirtyScanRemesh:0,dirtyScanFirstBuild:0,
    dirtyScanVisibleFirstBuild:0,dirtyScanVisibleReady:0,dirtyScanBackgroundFirstBuild:0,dirtyScanBackgroundReady:0,
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

test('World.markSection journals only new dirty admissions and versions every invalidation', () => {
  const start = worldSource.indexOf('  markSection(');
  const end = worldSource.indexOf('  markDirty(', start);
  const compiled = ts.transpileModule(
    'class W {\n' + worldSource.slice(start, end) + '\n}',
    { compilerOptions:{target:ts.ScriptTarget.ES2022} },
  ).outputText;
  const W = Function('MIN_SECTION','MAX_SECTION','sectionKey',compiled+';return W')(
    -4,19,(cx,sy,cz)=>`${cx},${sy},${cz}`,
  );
  const world = new W();
  Object.assign(world,{dirty:new Set(),dirtyAddQueue:[],dirtyAddQueueSet:new Set(),dirtyAddRevision:0,sectionDirtyRevision:new Map()});
  world.markSection(2,0,-3);
  assert.deepEqual(world.dirtyAddQueue,['2,0,-3']);
  assert.deepEqual([...world.dirtyAddQueueSet],['2,0,-3']);
  assert.equal(world.dirtyAddRevision,1);
  assert.equal(world.sectionDirtyRevision.get('2,0,-3'),1);
  world.markSection(2,0,-3);
  assert.deepEqual(world.dirtyAddQueue,['2,0,-3'],'already-dirty work does not duplicate admission records');
  assert.equal(world.dirtyAddRevision,1);
  assert.equal(world.sectionDirtyRevision.get('2,0,-3'),2,'repeat invalidation advances the section revision');
  world.dirty.delete('2,0,-3');
  world.markSection(2,0,-3);
  assert.deepEqual(world.dirtyAddQueue,['2,0,-3'],'pending re-additions coalesce to one journal entry');
  assert.deepEqual([...world.dirtyAddQueueSet],['2,0,-3']);
  assert.equal(world.dirtyAddRevision,2);
  assert.equal(world.sectionDirtyRevision.get('2,0,-3'),3);
});

test('new streamed sections are admitted incrementally without resetting scan or cancelling unrelated active jobs', () => {
  const cancelled = [];
  function* slowSteps(_world, chunk, _lighting, section) {
    const key = `${chunk.cx},${section},${chunk.cz}`;
    let complete = false;
    try { for(let i=0;i<2000;i++)yield; complete=true; return [empty(),empty()]; }
    finally { if(!complete)cancelled.push(key); }
  }
  const View = extractedView(THREE,slowSteps,fakePerformance);
  const {world,view} = setup(View,['0,0,0','1,0,0']);
  View.prototype.rebuild.call(view,world,2);
  assert.equal(view.meshJobs.size,2);
  const active = new Map([...view.meshJobs].map(([key,job])=>[key,job.iterator]));
  const initialScanned = view.dirtyScanScanned;
  world.chunks.set('2,0',{cx:2,cz:0,blocks:{sections:new Map([[0,{nonAir:1}]])}});
  world.dirty.add('2,0,0');world.dirtyAddQueue.push('2,0,0');
  world.dirtyAddRevision++;world.sectionDirtyRevision.set('2,0,0',1);
  world.navRevision++;world.chunkTopologyRevision++;
  View.prototype.rebuild.call(view,world,2);
  assert.deepEqual(cancelled,[],'topology streaming does not globally cancel active work');
  for(const [key,iterator] of active) assert.equal(view.meshJobs.get(key)?.iterator,iterator,`${key} retains its active iterator`);
  assert.equal(view.dirtyScanScanned,initialScanned,'the original dirty Set snapshot is not rescanned');
  assert.ok(view.meshQueueEntryByKey.has('2,0,0'),'the new section enters the retained candidate map');
  assert.equal(world.dirtyAddQueue.length,0,'the admission journal is acknowledged once all entries are admitted');
  assert.equal(view.meshQueueStats.scanComplete,true);
});

test('large streaming bursts are admitted in bounded 256-key slices while meshing continues', () => {
  function* slowSteps() { for(let i=0;i<3000;i++)yield; return [empty(),empty()]; }
  const View = extractedView(THREE,slowSteps,fakePerformance);
  const {world,view} = setup(View,['0,0,0']);
  View.prototype.rebuild.call(view,world,1);
  view.meshAdmissionHeadroomMs=50;view.dirtyAdmissionCostMsPerKey=0.001;
  const activeIterator = view.meshJobs.get('0,0,0').iterator;
  for(let x=10;x<610;x++){
    const key=`${x},0,0`;
    world.chunks.set(`${x},0`,{cx:x,cz:0,blocks:{sections:new Map([[0,{nonAir:1}]])}});
    world.dirty.add(key);world.dirtyAddQueue.push(key);world.dirtyAddQueueSet.add(key);
    world.sectionDirtyRevision.set(key,1);world.dirtyAddRevision++;
  }
  View.prototype.rebuild.call(view,world,1);
  assert.equal(view.dirtyScanAddCursor,256,'one frame admits no more than 256 streamed dirty keys');
  assert.equal(view.meshQueueEntryByKey.size,257,'the original candidate plus 256 additions are retained');
  assert.equal(view.meshJobs.get('0,0,0')?.iterator,activeIterator,'the active foreground job keeps advancing during admission');
  assert.equal(view.meshQueueStats.scanComplete,false,'readiness remains pending while admission backlog exists');
  View.prototype.rebuild.call(view,world,1);
  assert.equal(view.dirtyScanAddCursor,512);
  View.prototype.rebuild.call(view,world,1);
  assert.equal(world.dirtyAddQueue.length,0);
  assert.equal(view.dirtyScanAddCursor,0);
  assert.equal(view.meshQueueEntryByKey.size,601);
  assert.equal(view.meshQueueStats.scanComplete,true);
});

test('topology changes invalidate only the affected active section job', () => {
  const cancelled = [];
  function* slowSteps(_world, chunk, _lighting, section) {
    const key = `${chunk.cx},${section},${chunk.cz}`;
    let complete = false;
    try { for(let i=0;i<2000;i++)yield; complete=true; return [empty(),empty()]; }
    finally { if(!complete)cancelled.push(key); }
  }
  const View = extractedView(THREE,slowSteps,fakePerformance);
  const {world,view} = setup(View,['0,0,0','1,0,0']);
  view.lighting={signature:1};
  View.prototype.rebuild.call(view,world,2);
  const activeKeys = [...view.meshJobs.keys()];
  assert.equal(activeKeys.length,2);
  const [affected,unaffected] = activeKeys;
  const affectedIterator = view.meshJobs.get(affected).iterator;
  const unaffectedIterator = view.meshJobs.get(unaffected).iterator;
  world.sectionDirtyRevision.set(affected,1);
  world.navRevision++;world.chunkTopologyRevision++;view.lighting.signature=2;
  View.prototype.rebuild.call(view,world,2);
  assert.deepEqual(cancelled,[affected]);
  assert.equal(view.meshJobs.get(unaffected)?.iterator,unaffectedIterator,'unaffected section continues from its existing generator state');
  assert.notEqual(view.meshJobs.get(affected)?.iterator,affectedIterator,'the affected section restarts from fresh world data');
});

test('evicted or deferred active sections release generators and pending commits', () => {
  const cancelled = [];
  function* slowSteps(_world, chunk, _lighting, section) {
    const key = `${chunk.cx},${section},${chunk.cz}`;
    let complete = false;
    try { for(let i=0;i<2000;i++)yield; complete=true; return [empty(),empty()]; }
    finally { if(!complete)cancelled.push(key); }
  }
  const View = extractedView(THREE,slowSteps,fakePerformance);
  const {world,view} = setup(View,['0,0,0','1,0,0']);
  View.prototype.rebuild.call(view,world,2);
  const keys = [...view.meshJobs.keys()];
  assert.equal(keys.length,2);
  const removed = keys[0];
  world.dirty.delete(removed);
  world.chunks.delete(removed.split(',').filter((_,i)=>i!==1).join(','));
  View.prototype.rebuild.call(view,world,2);
  assert.ok(!view.meshJobs.has(removed),'evicted work is not left orphaned');
  assert.ok(cancelled.includes(removed));
  let disposed=0;
  const geometry={dispose(){disposed++;}};
  const commitGroup=new Group();commitGroup.add(new Mesh(geometry,{}));
  view.meshCommits.set('pending-key',{key:'pending-key',group:commitGroup});
  view.cancelMeshWork('pending-key');
  assert.equal(view.meshCommits.has('pending-key'),false);
  assert.equal(disposed,1,'cancelled pending geometry is disposed exactly once');
});

test('pending geometry commits with stale section revisions are disposed before replacement', () => {
  function* slowSteps() { for(let i=0;i<2000;i++)yield; return [empty(),empty()]; }
  const View = extractedView(THREE,slowSteps,fakePerformance);
  const {world,view} = setup(View,['0,0,0']);
  View.prototype.rebuild.call(view,world,1);
  const oldJob=view.meshJobs.get('0,0,0');
  assert.ok(oldJob);
  oldJob.iterator.return?.();view.meshJobs.delete('0,0,0');
  let disposed=0;
  const group=new Group();group.add(new Mesh({dispose(){disposed++;}},{}));
  view.meshCommits.set('0,0,0',{
    key:'0,0,0',cx:0,sy:0,cz:0,columnKey:'0,0',data:[empty(),empty()],
    group,nextMaterial:0,cpuMs:0,meshCpuMs:0,dirtyRevision:0,
  });
  world.sectionDirtyRevision.set('0,0,0',1);
  View.prototype.rebuild.call(view,world,1);
  assert.equal(disposed,1,'stale temporary geometry is disposed exactly once');
  assert.equal(view.meshCommits.has('0,0,0'),false);
  assert.ok(view.meshJobs.has('0,0,0'),'the section restarts from the latest revision');
});
test('consolidated rendering release coverage for incremental dirty admission', () => {
  const pkg=JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'../package.json'),'utf8'));
  assert.ok(pkg.scripts['test:rendering']?.includes('tests/incremental-dirty-admission.test.cjs'), 'Behavioral test must remain in its subsystem suite');
  assert.ok(pkg.scripts['test:regression']?.includes('npm run test:rendering'), 'Regression must execute the subsystem');
  assert.ok(pkg.scripts['test:performance']?.includes('npm run test:rendering'), 'Performance verification must execute rendering');
  assert.match(renderer,/dirtyAddQueue/);
  assert.match(renderer,/dirtyScanAddCursor/);
  assert.match(renderer,/meshQueueEntryByKey/);
  assert.match(renderer,/sectionDirtyRevision/);
  assert.match(renderer,/cancelMeshWork\(key:string\)/);
  assert.match(worldSource,/dirtyAddQueue: string\[\] = \[\]/);
  assert.match(worldSource,/dirtyAddQueueSet = new Set/);
  assert.match(worldSource,/sectionDirtyRevision = new Map/);
});
