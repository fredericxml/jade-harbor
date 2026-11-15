const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root=path.resolve(__dirname,'..');
const renderer=fs.readFileSync(path.join(root,'src/render/renderer.ts'),'utf8');
const worldSource=fs.readFileSync(path.join(root,'src/world/world.ts'),'utf8');

class Group {
  constructor(){this.children=[];this.position={set(){}};}
  add(child){this.children.push(child);child.parent=this;}
  removeFromParent(){if(this.parent){this.parent.children=this.parent.children.filter(child=>child!==this);this.parent=undefined;}}
  traverse(fn){for(const child of this.children)fn(child);}
  clear(){this.children.length=0;}
}
class Mesh {constructor(geometry,material){this.geometry=geometry;this.material=material;}}
class Vector3 {constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}}
const THREE={Mesh,Group,Vector3,BufferGeometry:class{},BufferAttribute:class{}};
const fakePerformance={now:(()=>{let t=0;return ()=>t+=0.01;})()};
const empty=()=>({positions:new Float32Array(),normals:new Float32Array(),uvs:new Float32Array(),tiles:new Uint8Array(),colors:new Float32Array(),emissive:new Uint8Array(),indices:new Uint16Array(),sky:new Float32Array(),lights:new Float32Array(),emissiveTriangles:0,waterTriangles:0});
function extractedView(steps){
  const start=renderer.indexOf('  private recordMeshChange(');
  const resize=renderer.indexOf('  resize(width?:number,height?:number)',start);
  const dispose=renderer.indexOf('  private disposePendingCommit(',resize);
  const rebuild=renderer.indexOf('  rebuild(world: World, budget = 2)',dispose);
  const clearDistant=renderer.indexOf('  attachWorld(',rebuild);
  assert.ok(start>=0&&resize>start&&dispose>resize&&rebuild>dispose&&clearDistant>rebuild);
  const code=ts.transpileModule('class T {\n'+renderer.slice(start,resize)+renderer.slice(dispose,clearDistant)+'\n}',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  return Function('THREE','meshChunkSteps','performance','MIN_SECTION','MAX_SECTION','createSectionGeometry',code+';return T')(
    THREE,steps,fakePerformance,-4,19,()=>({dispose(){}}));
}
function fixture(View){
  const chunks=new Map([['0,0',{cx:0,cz:0,blocks:{sections:new Map([[0,{nonAir:1}]])}}]]);
  const world={dirty:new Set(['0,0,0']),chunks,navRevision:0,lightingEditRevision:0,sectionDirtyRevision:new Map(),dirtyAddQueue:[],dirtyAddQueueSet:new Set()};
  const view=Object.assign(new class {},{
    camera:{position:{x:8,y:8,z:8},getWorldDirection(target){target.x=0;target.y=0;target.z=-1;return target;}},
    lastSectionY:0,lastSurfaceY:0,verticalRadius:64,deferred:new Set(),sections:new Map(),meshed:new Set(),meshRevision:0,
    groups:new Map(),sectionCoordinates:new Map(),staleCoordinateSweep:null,evictionQueueRefresh:false,
    meshQueueEntryByKey:new Map(),nearestSections:[],nearestSectionPool:[],meshQueueHeap:[],meshQueueBackgroundHeap:[],
    meshQueueForegroundStreak:0,meshJobs:new Map(),meshCommits:new Map(),meshQueueStartedAt:0,meshQueueStats:{},
    meshAdmissionHeadroomMs:4,dirtyAdmissionCostMsPerKey:0.01,dirtyAdmissionBacklogHighWater:0,dirtyAdmissionEpisodeActive:false,
    scene:new Group(),materials:[{},{}],metrics:{add(){}},meshChanges:[],meshChangeBase:0,
    dirtyScanEditRevision:-1,dirtyScanReady:false,dirtyScanIterator:null,dirtyScanWorld:undefined,
    dirtyScanCameraCell:'',dirtyScanPoolCount:0,dirtyScanInitialSize:0,dirtyScanScanned:0,
    dirtyScanEligible:0,dirtyScanRemesh:0,dirtyScanFirstBuild:0,dirtyScanVisibleFirstBuild:0,
    dirtyScanVisibleReady:0,dirtyScanBackgroundFirstBuild:0,dirtyScanBackgroundReady:0,
    meshQueueForward:new Vector3(0,0,-1),dirtyScanForwardX:0,dirtyScanForwardY:0,dirtyScanForwardZ:-1,
    dirtyScanEyeX:8,dirtyScanEyeY:8,dirtyScanEyeZ:8,
  });
  for(const name of ['sectionCoordinate','pruneStaleSectionCoordinates','meshQueueLess','updateMeshQueueForward',
    'updateMeshQueueEntry','heapifyMeshQueue','refreshMeshQueueFacing','pushMeshQueue','popMeshQueue',
    'popNextMeshQueue','recordMeshQueueReady','resetMeshQueue','recordMeshChange','advanceMeshCommit',
    'disposePendingCommit','cancelMeshWork','rebuild','removeSection','remove','clear','clearDistant']){
    view[name]=View.prototype[name];
  }
  return {view,world};
}
function* longSteps(){for(let i=0;i<3000;i++)yield;return [empty(),empty()];}

// The View.remove call is invoked immediately after a World.tick() chunk eviction,
// before the next frame's renderer.rebuild. It must not hold any unowned GPU data.
test('chunk eviction immediately cancels only its mesh jobs and disposes its partial commits',()=>{
  const View=extractedView(longSteps),{view,world}=fixture(View);
  world.chunks.set('1,0',{cx:1,cz:0});world.dirty.add('1,0,0');
  View.prototype.rebuild.call(view,world,2);
  assert.equal(view.meshJobs.size,2);
  const retainedKey='0,0,0',evictedKey='1,0,0';
  const retainedIterator=view.meshJobs.get(retainedKey).iterator;
  let cancelled=0;
  const evictedJob=view.meshJobs.get(evictedKey);
  evictedJob.iterator.return=()=>{cancelled++;return {done:true};};
  view.meshJobs.delete(evictedKey);
  let disposed=0;
  const group=new Group();group.add(new Mesh({dispose(){disposed++;}},{}));
  view.meshCommits.set(evictedKey,{key:evictedKey,group});
  view.sectionCoordinate(evictedKey);view.meshed.add(evictedKey);
  world.chunks.delete('1,0');world.dirty.delete(evictedKey);
  view.remove('1,0');
  assert.equal(view.meshCommits.has(evictedKey),false,'evicted pending geometry cannot survive to another frame');
  assert.equal(disposed,1,'orphaned temporary GPU geometry released synchronously');
  assert.equal(view.meshQueueEntryByKey.has(evictedKey),false);
  assert.equal(view.sectionCoordinates.has(evictedKey),false);
  assert.equal(view.meshed.has(evictedKey),false);
  assert.equal(view.meshJobs.get(retainedKey).iterator,retainedIterator,'unrelated in-flight generator survives');
  assert.equal(cancelled,0);
  assert.equal(view.evictionQueueRefresh,true,'heap refresh is coalesced into the next rebuild');
  view.remove('1,0');
  assert.equal(disposed,1,'repeat eviction does not dispose a pending commit twice');
});

test('synchronous eviction cancels an in-flight generator and does not affect other columns',()=>{
  const View=extractedView(longSteps),{view,world}=fixture(View);
  world.chunks.set('1,0',{cx:1,cz:0});world.dirty.add('1,0,0');
  view.rebuild(world,2);
  const other=view.meshJobs.get('0,0,0').iterator;
  const candidate=view.meshJobs.get('1,0,0');assert.ok(candidate);
  let returned=0;candidate.iterator.return=()=>{returned++;return {done:true};};
  world.chunks.delete('1,0');world.dirty.delete('1,0,0');
  view.remove('1,0');
  assert.equal(returned,1);
  assert.equal(view.meshJobs.has('1,0,0'),false);
  assert.equal(view.meshJobs.get('0,0,0').iterator,other);
  view.rebuild(world,2);
  assert.equal(view.evictionQueueRefresh,false);
  assert.equal(view.meshQueueEntryByKey.has('1,0,0'),false);
});

test('2000 simulated chunk arrivals and evictions do not retain old coordinate keys or jobs',()=>{
  const View=extractedView(longSteps),{view,world}=fixture(View);
  for(let x=1;x<=2000;x++){
    const column=`${x},0`,key=`${x},0,0`;
    world.chunks.set(column,{cx:x,cz:0});world.dirty.add(key);
    view.sectionCoordinate(key);
    world.chunks.delete(column);world.dirty.delete(key);
    view.remove(column);
  }
  assert.equal(view.sectionCoordinates.size,0,'column eviction reclaims cache entries immediately');
  assert.equal(view.meshJobs.size,0);
  assert.equal(view.meshCommits.size,0);
  assert.equal(view.meshQueueEntryByKey.size,0);
  assert.equal(view.nearestSectionPool.length,0);
  assert.equal(view.evictionQueueRefresh,true);
});

test('orphan coordinate sweep is 128-key bounded and preserves loaded and active sections',()=>{
  const View=extractedView(longSteps),{view,world}=fixture(View);
  view.sectionCoordinate('0,0,0');
  for(let x=2;x<=1200;x++)view.sectionCoordinate(`${x},0,0`);
  const initial=view.sectionCoordinates.size;
  view.pruneStaleSectionCoordinates(world);
  assert.ok(initial-view.sectionCoordinates.size<=128,'each call scans at most 128 entries');
  for(let i=0;i<16;i++)view.pruneStaleSectionCoordinates(world);
  assert.ok(view.sectionCoordinates.size<=280,'unloaded orphan cache is bounded by loaded-column capacity plus 256 spares');
  assert.equal(view.sectionCoordinates.has('0,0,0'),true,'loaded section remains cached');
  // A dirty orphan remains protected until its work is acknowledged.
  view.sectionCoordinate('5000,0,0');world.dirty.add('5000,0,0');
  for(let x=6000;x<7000;x++)view.sectionCoordinate(`${x},0,0`);
  for(let i=0;i<12;i++)view.pruneStaleSectionCoordinates(world);
  assert.equal(view.sectionCoordinates.has('5000,0,0'),true);
});

test('missing-chunk dirty section releases the World revision and coordinate cache',()=>{
  const View=extractedView(longSteps),{view,world}=fixture(View);
  world.dirty.add('100,0,0');world.sectionDirtyRevision.set('100,0,0',8);
  view.rebuild(world,1);
  assert.equal(world.dirty.has('100,0,0'),false);
  assert.equal(world.sectionDirtyRevision.has('100,0,0'),false);
  assert.equal(view.sectionCoordinates.has('100,0,0'),false);
});

test('world clear releases all pending commits, discards pooled keys and caps reusable allocations',()=>{
  const View=extractedView(longSteps),{view,world}=fixture(View);
  view.rebuild(world,1);
  let disposed=0;
  const group=new Group();group.add(new Mesh({dispose(){disposed++;}},{}));
  view.meshCommits.set('77,0,0',{key:'77,0,0',group});
  for(let x=1;x<=1600;x++){
    view.nearestSectionPool.push({key:`${x},0,0`,cx:x,sy:0,cz:0,queued:false,ready:false,firstBuild:false});
    view.sectionCoordinate(`${x},0,0`);
  }
  view.clear();
  assert.equal(disposed,1);
  assert.equal(view.meshJobs.size,0);
  assert.equal(view.meshCommits.size,0);
  assert.equal(view.meshQueueEntryByKey.size,0);
  assert.equal(view.sectionCoordinates.size,0);
  assert.ok(view.nearestSectionPool.length<=256,'new world cannot inherit previous peak scratch allocations');
  assert.equal(view.staleCoordinateSweep,null);
  assert.equal(view.evictionQueueRefresh,false);
});

test('memory telemetry reports section-coordinate records and pooled candidates without claiming RAM bytes',()=>{
  assert.match(renderer,/stats\.sectionCoordinateCache=this\.sectionCoordinates\.size/);
  assert.match(renderer,/stats\.candidatePoolCapacity=this\.nearestSectionPool\.length/);
  const game=fs.readFileSync(path.join(root,'src/core/game.ts'),'utf8');
  assert.ok(game.includes('Mesh memory: ${queue.sectionCoordinateCache} coordinate records'));
});
test('consolidated rendering release coverage for mesh memory lifecycle', () => {
  const pkg=JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'../package.json'),'utf8'));
  assert.ok(pkg.scripts['test:rendering']?.includes('tests/mesh-memory-lifecycle.test.cjs'), 'Behavioral test must remain in its subsystem suite');
  assert.ok(pkg.scripts['test:regression']?.includes('npm run test:rendering'), 'Regression must execute the subsystem');
  assert.ok(pkg.scripts['test:performance']?.includes('npm run test:rendering'), 'Performance verification must execute rendering');
  assert.match(renderer,/pruneStaleSectionCoordinates/);
});
