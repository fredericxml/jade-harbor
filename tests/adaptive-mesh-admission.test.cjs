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

test('adaptive admission scales with measured frame headroom and never exceeds the 256-key hard cap', () => {
  const View=extractedView(THREE,slowSteps,fakePerformance);
  const high=setup(View),low=setup(View);
  View.prototype.rebuild.call(high.view,high.world,1);
  View.prototype.rebuild.call(low.view,low.world,1);
  addStreamingSections(high.world,10,600);
  addStreamingSections(low.world,10,600);

  View.prototype.setMeshAdmissionHeadroom.call(high.view,50);
  high.view.dirtyAdmissionCostMsPerKey=0.001;
  View.prototype.setMeshAdmissionHeadroom.call(low.view,0.2);
  low.view.dirtyAdmissionCostMsPerKey=0.02;

  View.prototype.rebuild.call(high.view,high.world,1);
  View.prototype.rebuild.call(low.view,low.world,1);

  const hs=high.view.meshQueueStats,ls=low.view.meshQueueStats;
  assert.equal(hs.admissionLimit,256,'high headroom reaches but never exceeds the hard cap');
  assert.equal(hs.admittedThisFrame,256);
  assert.equal(ls.admissionLimit,16,'low headroom selects the conservative minimum slice');
  assert.equal(ls.admittedThisFrame,16);
  assert.ok(hs.admittedThisFrame>ls.admittedThisFrame,'more headroom admits more keys');
  assert.equal(hs.admissionBacklog,344);
  assert.equal(ls.admissionBacklog,584);
  assert.equal(hs.admissionBacklogHighWater,600);
  assert.equal(ls.admissionBacklogHighWater,600);
  assert.ok(hs.admissionTimeMs>=0&&ls.admissionTimeMs>=0);
  assert.ok(hs.admissionBudgetMs>ls.admissionBudgetMs);
  assert.ok(hs.admissionHeadroomMs>ls.admissionHeadroomMs);
});

test('admission controller adapts upward after headroom recovers and drains every journal key exactly once', () => {
  const View=extractedView(THREE,slowSteps,fakePerformance);
  const {world,view}=setup(View);
  View.prototype.rebuild.call(view,world,1);
  addStreamingSections(world,10,600);

  View.prototype.setMeshAdmissionHeadroom.call(view,0.2);
  view.dirtyAdmissionCostMsPerKey=0.02;
  View.prototype.rebuild.call(view,world,1);
  const conservative=view.meshQueueStats.admittedThisFrame;
  assert.equal(conservative,16);

  View.prototype.setMeshAdmissionHeadroom.call(view,50);
  let admitted=conservative;
  let frames=1;
  while(world.dirtyAddQueue.length&&frames<20){
    View.prototype.rebuild.call(view,world,1);
    admitted+=view.meshQueueStats.admittedThisFrame;
    frames++;
  }
  assert.equal(world.dirtyAddQueue.length,0,'the retained admission journal eventually drains');
  assert.equal(view.meshQueueEntryByKey.size,601,'all baseline and streamed dirty sections have one candidate');
  assert.equal(admitted,600,'every streamed section is admitted exactly once');
  assert.ok(view.meshQueueStats.admittedThisFrame>conservative,'admission rate increases when headroom recovers');
  assert.ok(view.meshQueueStats.admissionBacklogHighWater>=600);
});

test('admission backlog telemetry is separate from active meshing and queued candidate pressure', () => {
  const View=extractedView(THREE,slowSteps,fakePerformance);
  const {world,view}=setup(View);
  View.prototype.rebuild.call(view,world,1);
  addStreamingSections(world,10,80);
  View.prototype.setMeshAdmissionHeadroom.call(view,0.2);
  View.prototype.rebuild.call(view,world,1);
  const stats=view.meshQueueStats;
  assert.equal(stats.admissionBacklog,64);
  assert.equal(stats.activeSections,1);
  assert.equal(stats.activeJobs,1);
  assert.ok(stats.queuedCandidates>0);
  assert.ok(stats.activeMeshingMs>=0);
  assert.ok(stats.admissionPressure>0&&stats.admissionPressure<=1);
  assert.equal(stats.pendingCommits,0);
});

test('game supplies prior-frame CPU headroom and F3/performance reports expose the separate lanes', () => {
  assert.ok(game.includes('private lastFrameWorkMs = 0'));
  assert.ok(game.includes('const targetFrameMs=1000/Math.max(1,this.framePacer.targetFps||60)'));
  assert.ok(game.includes('const frameHeadroomMs=Math.max(0,targetFrameMs-this.lastFrameWorkMs)'));
  assert.ok(game.includes('this.view.setMeshAdmissionHeadroom(frameHeadroomMs)'));
  assert.ok(game.includes('this.lastFrameWorkMs=cpu'));
  assert.ok(game.includes('Admission ${queue.admissionBacklog} pending'));
  assert.ok(game.includes('queuedCandidates'));
  assert.ok(game.includes('admissionHeadroomMs is estimated from the target frame interval'));
  for(const key of ['admissionBacklog','admittedThisFrame','admissionHeadroomMs','queuedCandidates','activeSections','activeMeshingMs']){
    assert.ok(renderer.includes(key),`renderer publishes ${key}`);
  }
});
test('consolidated rendering release coverage for adaptive mesh admission', () => {
  const pkg=JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'../package.json'),'utf8'));
  assert.ok(pkg.scripts['test:rendering']?.includes('tests/adaptive-mesh-admission.test.cjs'), 'Behavioral test must remain in its subsystem suite');
  assert.ok(pkg.scripts['test:regression']?.includes('npm run test:rendering'), 'Regression must execute the subsystem');
  assert.ok(pkg.scripts['test:performance']?.includes('npm run test:rendering'), 'Performance verification must execute rendering');
  assert.ok(renderer.includes('appVersion')); 
});
