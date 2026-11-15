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

function setupView(View, keys, facing = [0,0,-1], perf = performance) {
  const chunks = new Map(), dirty = new Set(keys);
  for (const key of keys) {
    const [cx, sy, cz] = key.split(',').map(Number);
    chunks.set(`${cx},${cz}`, { cx, cz, blocks: { sections: new Map([[sy,{nonAir:1}]]) } });
  }
  const camera = {
    position: { x: 8, y: 8, z: 8 },
    facing: [...facing],
    getWorldDirection(target) { [target.x,target.y,target.z] = this.facing; return target; },
  };
  const view = Object.assign(new (class {})(), {
    camera, lastSectionY:0, lastSurfaceY:0, verticalRadius:64, deferred:new Set(),
    sections:new Map(), meshed:new Set(), meshRevision:0, groups:new Map(),
    sectionCoordinates:new Map(), nearestSections:[], nearestSectionPool:[],
    meshQueueHeap:[], meshQueueBackgroundHeap:[], meshQueueForegroundStreak:0,
    meshJobs:new Map(), meshCommits:new Map(), meshQueueStartedAt:0, meshQueueStats:{}, meshAdmissionHeadroomMs:50,
    scene:new Group(), materials:[{},{}], metrics:{add(){}}, meshChanges:[], meshChangeBase:0,
    dirtyScanEditRevision:-1, dirtyScanAddRevision:-1, dirtyScanReady:false, dirtyScanIterator:null,
    dirtyScanWorld:undefined, dirtyScanCameraCell:'', dirtyScanPoolCount:0, dirtyScanInitialSize:0,
    dirtyScanScanned:0, dirtyScanEligible:0, dirtyScanRemesh:0, dirtyScanFirstBuild:0,
    dirtyScanVisibleFirstBuild:0, dirtyScanVisibleReady:0, dirtyScanBackgroundFirstBuild:0, dirtyScanBackgroundReady:0,
    meshQueueForward:new Vector3(0,0,-1), dirtyScanForwardX:0, dirtyScanForwardY:0, dirtyScanForwardZ:-1,
    dirtyScanEyeX:8, dirtyScanEyeY:8, dirtyScanEyeZ:8,
    sectionCoordinate:View.prototype.sectionCoordinate, meshQueueLess:View.prototype.meshQueueLess,
    updateMeshQueueForward:View.prototype.updateMeshQueueForward, updateMeshQueueEntry:View.prototype.updateMeshQueueEntry,
    heapifyMeshQueue:View.prototype.heapifyMeshQueue, refreshMeshQueueFacing:View.prototype.refreshMeshQueueFacing,
    pushMeshQueue:View.prototype.pushMeshQueue, popMeshQueue:View.prototype.popMeshQueue,
    popNextMeshQueue:View.prototype.popNextMeshQueue, recordMeshQueueReady:View.prototype.recordMeshQueueReady,
    resetMeshQueue:View.prototype.resetMeshQueue, recordMeshChange:View.prototype.recordMeshChange,
    advanceMeshCommit:View.prototype.advanceMeshCommit, disposePendingCommit:View.prototype.disposePendingCommit,
    removeSection() {},
  });
  return { world:{dirty,chunks,navRevision:0,dirtyAddRevision:0}, view };
}

test('meshing splits forward-visible and background work while retaining nearest-first ordering within each queue', () => {
  const order = [];
  function* steps(_world, chunk, _lighting, section) {
    order.push(`${chunk.cx},${section},${chunk.cz}`);
    return [empty(),empty()];
  }
  const keys = ['0,0,-2','0,0,2','2,0,0','-2,0,0','0,0,-3','0,0,3'];
  const fakePerformance = { now: (() => { let t=0; return () => ++t; })() };
  const View = extractedView(THREE, steps, fakePerformance);
  const {world,view} = setupView(View, keys, [0,0,-1], fakePerformance);
  View.prototype.rebuild.call(view, world, 2);
  assert.equal(order[0], '0,0,-2', 'the nearest section in the camera-forward cone starts before equally distant rear/side work');
  assert.equal(order[1], '-2,0,0', 'a background section still receives a slot in the same two-slot batch');
  assert.ok(view.meshQueueStats.visibleQueued > 0);
  assert.ok(view.meshQueueStats.backgroundQueued > 0);
  assert.ok(view.meshQueueStats.visibleReady > 0);
  assert.ok(view.meshQueueStats.backgroundReady > 0);
  assert.equal(view.meshQueueStats.visibleWorldReady, false, 'visible readiness remains false while foreground first-build work is pending');
});

test('meshing background service is starvation-free under a sustained foreground backlog', () => {
  const order = [];
  function* steps(_world, chunk, _lighting, section) {
    order.push(`${chunk.cx},${section},${chunk.cz}`);
    return [empty(),empty()];
  }
  const fakePerformance = { now: (() => { let t=0; return () => ++t; })() };
  const View = extractedView(THREE, steps, fakePerformance);
  const keys = [];
  for (let x=1;x<=8;x++) keys.push(`${x*2},0,-${x*2}`); // forward-cone sections
  for (let x=1;x<=8;x++) keys.push(`${x*2},0,${x*2}`);  // rear sections
  const {world,view} = setupView(View, keys, [0,0,-1], fakePerformance);
  for (let i=0;i<4;i++) View.prototype.rebuild.call(view, world, 1);
  assert.equal(order.length, 4);
  assert.ok(order.slice(0,3).every(key => Number(key.split(',')[2]) < 0), 'foreground receives up to three consecutive single-slot services');
  assert.ok(Number(order[3].split(',')[2]) > 0, 'the fourth service is reserved for background work');
});

test('meshing camera turns reprioritize unstarted sections without cancelling active mesh jobs', () => {
  let cancelled = 0;
  function* slowSteps(_world, chunk, _lighting, section) {
    let completed = false;
    try { for(let i=0;i<100;i++)yield; completed = true; return [empty(),empty()]; }
    finally { if (!completed) cancelled++; }
  }
  const fakePerformance = { now: (() => { let t=0; return () => ++t; })() };
  const View = extractedView(THREE, slowSteps, fakePerformance);
  const keys = ['0,0,-3','0,0,3','3,0,0','-3,0,0'];
  const {world,view} = setupView(View, keys, [0,0,-1], fakePerformance);
  View.prototype.rebuild.call(view, world, 1);
  assert.equal(view.meshJobs.size, 1, 'one foreground job is active before the turn');
  const activeKey = [...view.meshJobs.keys()][0];
  view.camera.facing = [1,0,0];
  View.prototype.rebuild.call(view, world, 1);
  assert.equal(cancelled, 0, 'camera-facing priority changes do not cancel resumable active work');
  assert.ok(view.meshJobs.has(activeKey), 'the original active job remains alive');
  assert.ok(view.meshQueueHeap.some(entry => entry.key === '3,0,0'), 'the newly faced section is promoted in the pending foreground heap');
});
test('consolidated rendering release coverage for progressive world rendering', () => {
  const pkg=JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'../package.json'),'utf8'));
  assert.ok(pkg.scripts['test:rendering']?.includes('tests/progressive-world-rendering.test.cjs'), 'Behavioral test must remain in its subsystem suite');
  assert.ok(pkg.scripts['test:regression']?.includes('npm run test:rendering'), 'Regression must execute the subsystem');
  assert.ok(pkg.scripts['test:performance']?.includes('npm run test:rendering'), 'Performance verification must execute rendering');
  for(const field of ['visibleQueued','visibleReady','visiblePending','backgroundQueued','backgroundReady','backgroundPending','visibleWorldReady','visibleWorldProgress']) assert.ok(renderer.includes(field), `Missing readiness metric ${field}`);
  assert.match(game,/Visible mesh readiness/);
});
