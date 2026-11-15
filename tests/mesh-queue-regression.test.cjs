const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
class Group {constructor(){this.children=[];this.position={set(){}};} add(obj){this.children.push(obj);} removeFromParent(){} traverse(fn){for(const child of this.children)fn(child);} }
class Geometry {setAttribute(){return this;}setIndex(){return this;}computeBoundingSphere(){}dispose(){}}
class Attribute{constructor() {}}
class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;}}
const THREE={Group,BufferGeometry:Geometry,Float32BufferAttribute:Attribute,Mesh};
const empty=()=>({positions:[],normals:[],uvs:[],colors:[],emissive:[],sky:[],lights:[],indices:[],emissiveTriangles:0,waterTriangles:0});
const renderer=fs.readFileSync('src/render/renderer.ts','utf8');
const start=renderer.indexOf('  rebuild(world: World, budget = 2) {'),end=renderer.indexOf('  removeSection(',start);
assert.ok(start>=0&&end>start);
const sourceJs=ts.transpileModule('class T {\n'+renderer.slice(renderer.indexOf('  private recordMeshChange('),renderer.indexOf('  resize('))+renderer.slice(renderer.indexOf('  private disposePendingCommit('),start)+renderer.slice(start,end)+'\n}',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
let recorded=[];
const generateSteps=function*(_world,chunk,_lighting,section){recorded.push(`${chunk.cx},${section},${chunk.cz}`);return [empty(),empty()];};
// Scheduling invariants must be independent of host CPU speed or concurrent
// Node test workers. Dedicated budget tests exercise the timer limits.
// A deterministic monotonic clock makes the three-section cap repeatable.
const deterministicPerformance={time:0,now(){return this.time+=0.005;}};
const Source=Function('THREE','meshChunkSteps','performance','MIN_SECTION','MAX_SECTION',sourceJs+';return T')(THREE,generateSteps,deterministicPerformance,-4,19);
function setup(){
 const chunks=new Map(),dirty=new Set();
 for(let cx=-2;cx<=2;cx++)for(let cz=-2;cz<=2;cz++){
  chunks.set(`${cx},${cz}`,{cx,cz});for(let sy=-2;sy<=2;sy++)dirty.add(`${cx},${sy},${cz}`);
 }
 dirty.add('99,0,99');dirty.add('0,19,0');
 return {world:{dirty,chunks,navRevision:0},view:Object.assign(new (class{})(),{meshJobs:new Map(),meshCommits:new Map(),dirtyScanEditRevision:0,camera:{position:{x:8,y:8,z:8}},lastSectionY:0,verticalRadius:64,deferred:new Set(),sections:new Map(),meshed:new Set(),meshRevision:0,groups:new Map(),sectionCoordinates:new Map(),sectionCoordinate:Source.prototype.sectionCoordinate,meshQueueLess:Source.prototype.meshQueueLess,pushMeshQueue:Source.prototype.pushMeshQueue,popMeshQueue:Source.prototype.popMeshQueue,popNextMeshQueue:Source.prototype.popNextMeshQueue,updateMeshQueueForward:Source.prototype.updateMeshQueueForward,updateMeshQueueEntry:Source.prototype.updateMeshQueueEntry,heapifyMeshQueue:Source.prototype.heapifyMeshQueue,refreshMeshQueueFacing:Source.prototype.refreshMeshQueueFacing,recordMeshQueueReady:Source.prototype.recordMeshQueueReady,resetMeshQueue:Source.prototype.resetMeshQueue,recordMeshChange:Source.prototype.recordMeshChange,advanceMeshCommit:Source.prototype.advanceMeshCommit,disposePendingCommit:Source.prototype.disposePendingCommit,meshJobs:new Map(),meshCommits:new Map(),dirtyScanEditRevision:0,scene:{add(){}},materials:[{}, {}],metrics:{add(){}},meshRevision:0,meshChanges:[],meshChangeBase:0,nearestSections:[],nearestSectionPool:[],meshQueueHeap:[],meshQueueBackgroundHeap:[],meshQueueForegroundStreak:0,meshQueueStartedAt:0,meshQueueStats:{queuedBefore:0,queuedAfter:0,scanned:0,eligible:0,dirtyRemesh:0,dirtyFirstBuild:0,processed:0,rendered:0,empty:0,deferred:0,meshed:0,renderedSections:0,queueAgeMs:0,maxSectionMs:0},removeSection(){}})};
}
for(const [name,Cl] of [['source',Source]]){
 const {world,view}=setup();recorded=[];Source.prototype.rebuild.call(view,world,3);
 assert.equal(recorded.length,3,`${name} processes 3 nearest sections`);
 assert.ok(recorded.includes('0,0,0'),`${name} center section prioritized`);
 assert.ok(!world.dirty.has('99,0,99'),`${name} discarded absent chunk`);
 assert.ok(view.deferred.has('0,19,0'),`${name} deferred far vertical section`);
 assert.ok(world.dirty.size>0,`${name} kept remaining mesh work queued`);
 assert.equal(view.meshQueueStats.queuedBefore,127,`${name} records the queue size before work`);
 assert.equal(view.meshQueueStats.scanned,127,`${name} counts every dirty key scanned`);
 assert.equal(view.meshQueueStats.scanComplete,true,`${name} completes small queue scans in one frame`);
 assert.equal(view.meshQueueStats.eligible,125,`${name} excludes unloaded and out-of-range keys from eligible work`);
 assert.equal(view.meshQueueStats.processed,3,`${name} records sections actually meshed`);
 assert.equal(view.meshQueueStats.empty,3,`${name} distinguishes completed empty sections`);
 assert.equal(view.meshQueueStats.queuedAfter,122,`${name} records remaining dirty work`);
 assert.equal(view.meshQueueStats.deferred,1,`${name} records deferred vertical sections`);
 assert.equal(view.meshQueueStats.meshed,3,`${name} reports completed section membership`);
 assert.ok(view.meshQueueStats.maxSectionMs>=0,`${name} reports maximum per-section build time`);
 assert.ok(view.meshQueueStats.queueAgeMs>=0,`${name} reports non-empty backlog episode duration`);
 world.dirty.clear();
 Source.prototype.rebuild.call(view,world,3);
 assert.equal(view.meshQueueStats.queuedBefore,0,`${name} resets the queue snapshot when settled`);
 assert.equal(view.meshQueueStats.queuedAfter,0,`${name} reports a fully drained queue`);
 assert.equal(view.meshQueueStats.queueAgeMs,0,`${name} clears backlog age after settling`);
 console.log(`PASS ${name}: nearest work ordering, capped per-frame meshing, unloaded cleanup, deferred sections and exact queue telemetry`);
}

// Large dirty queues are discovered over multiple frames. The accumulated
// candidate set must still select the globally nearest sections after the
// complete live Set iterator has been consumed.
{
 const chunks=new Map(),dirty=new Set();
 for(let cx=-300;cx<300;cx++){chunks.set(`${cx},0`,{cx,cz:0});dirty.add(`${cx},0,0`);}
 const world={dirty,chunks,navRevision:0,dirtyAddRevision:0,lightingEditRevision:0,dirtyAddQueue:[],sectionDirtyRevision:new Map()};
 const view=Object.assign(new (class{})(),{
  camera:{position:{x:8,y:8,z:8}},lastSectionY:0,verticalRadius:64,deferred:new Set(),sections:new Map(),meshed:new Set(),
  meshRevision:0,groups:new Map(),sectionCoordinates:new Map(),sectionCoordinate:Source.prototype.sectionCoordinate,meshQueueLess:Source.prototype.meshQueueLess,pushMeshQueue:Source.prototype.pushMeshQueue,popMeshQueue:Source.prototype.popMeshQueue,popNextMeshQueue:Source.prototype.popNextMeshQueue,updateMeshQueueForward:Source.prototype.updateMeshQueueForward,updateMeshQueueEntry:Source.prototype.updateMeshQueueEntry,heapifyMeshQueue:Source.prototype.heapifyMeshQueue,refreshMeshQueueFacing:Source.prototype.refreshMeshQueueFacing,recordMeshQueueReady:Source.prototype.recordMeshQueueReady,resetMeshQueue:Source.prototype.resetMeshQueue,
  recordMeshChange:Source.prototype.recordMeshChange,advanceMeshCommit:Source.prototype.advanceMeshCommit,disposePendingCommit:Source.prototype.disposePendingCommit,meshJobs:new Map(),meshCommits:new Map(),dirtyScanEditRevision:0,scene:{add(){}},materials:[{}, {}],metrics:{add(){}},meshChanges:[],meshChangeBase:0,
  nearestSections:[],nearestSectionPool:[],meshQueueHeap:[],meshQueueBackgroundHeap:[],meshQueueForegroundStreak:0,meshQueueStartedAt:0,meshQueueStats:{},meshAdmissionHeadroomMs:50,removeSection(){},
 });
 recorded=[];
 Source.prototype.rebuild.call(view,world,3);
 assert.equal(view.meshQueueStats.scanComplete,false,'large queue scan is deferred after bounded work');
 assert.equal(view.meshQueueStats.scanned,256,'first frame scans at most 256 dirty keys');
 assert.equal(view.meshQueueStats.scanRemaining,344,'first frame reports remaining discovery work');
 assert.equal(view.meshQueueStats.processed,0,'no section is processed before global nearest-first scan completes');
 Source.prototype.rebuild.call(view,world,3);
 assert.equal(view.meshQueueStats.scanComplete,false,'second frame continues the same scan');
 assert.equal(view.meshQueueStats.scanned,512,'scan progress accumulates across frames');
 Source.prototype.rebuild.call(view,world,3);
 assert.equal(view.meshQueueStats.scanComplete,true,'third frame completes the scan');
 assert.equal(view.meshQueueStats.scanned,600,'all dirty keys are considered');
 assert.equal(view.meshQueueStats.eligible,600,'all loaded in-range sections are eligible');
 assert.equal(view.meshQueueStats.processed,3,'normal per-frame mesh count remains bounded');
 assert.deepEqual(recorded,['0,0,0','-1,0,0','-2,0,0'],'camera-neighborhood foreground is prioritized while a background slot is reserved');
 console.log('PASS bounded dirty scan: 256-key frame cap, resumable progress and global nearest-first selection');
}

// A large backlog is discovered once, then drained from the persistent heap.
// Further scheduling passes must not restart a full scan of the remaining dirty Set.
{
 const chunks=new Map(),dirty=new Set();
 for(let cx=-372;cx<=372;cx++){chunks.set(`${cx},0`,{cx,cz:0});dirty.add(`${cx},0,0`);}
 const world={dirty,chunks,navRevision:0,dirtyAddRevision:0,lightingEditRevision:0,dirtyAddQueue:[],sectionDirtyRevision:new Map(),chunkTopologyRevision:0};
 const view=Object.assign(new (class{})(),{
  camera:{position:{x:8,y:8,z:8}},lastSectionY:0,verticalRadius:64,deferred:new Set(),sections:new Map(),meshed:new Set(),
  meshRevision:0,groups:new Map(),sectionCoordinates:new Map(),sectionCoordinate:Source.prototype.sectionCoordinate,meshQueueLess:Source.prototype.meshQueueLess,pushMeshQueue:Source.prototype.pushMeshQueue,popMeshQueue:Source.prototype.popMeshQueue,popNextMeshQueue:Source.prototype.popNextMeshQueue,updateMeshQueueForward:Source.prototype.updateMeshQueueForward,updateMeshQueueEntry:Source.prototype.updateMeshQueueEntry,heapifyMeshQueue:Source.prototype.heapifyMeshQueue,refreshMeshQueueFacing:Source.prototype.refreshMeshQueueFacing,recordMeshQueueReady:Source.prototype.recordMeshQueueReady,resetMeshQueue:Source.prototype.resetMeshQueue,
  recordMeshChange:Source.prototype.recordMeshChange,advanceMeshCommit:Source.prototype.advanceMeshCommit,disposePendingCommit:Source.prototype.disposePendingCommit,
  meshJobs:new Map(),meshCommits:new Map(),dirtyScanEditRevision:0,dirtyScanReady:false,dirtyScanIterator:null,dirtyScanWorld:undefined,dirtyScanCameraCell:'',
  dirtyScanPoolCount:0,dirtyScanInitialSize:0,dirtyScanScanned:0,dirtyScanEligible:0,dirtyScanRemesh:0,dirtyScanFirstBuild:0,
  nearestSections:[],nearestSectionPool:[],meshQueueHeap:[],meshQueueBackgroundHeap:[],meshQueueForegroundStreak:0,meshQueueStartedAt:0,meshQueueStats:{},meshAdmissionHeadroomMs:50,scene:{add(){}},materials:[{},{}],
  metrics:{add(){}},meshChanges:[],meshChangeBase:0,removeSection(){},
 });
 recorded=[];
 Source.prototype.rebuild.call(view,world,6);
 assert.equal(view.meshQueueStats.scanComplete,false);
 Source.prototype.rebuild.call(view,world,6);
 assert.equal(view.meshQueueStats.scanComplete,false);
 Source.prototype.rebuild.call(view,world,6);
 assert.equal(view.meshQueueStats.scanComplete,true);
 assert.equal(view.meshQueueStats.scanned,745);
 assert.deepEqual(recorded,['0,0,0','-1,0,0','1,0,0','-2,0,0','2,0,0','-3,0,0'],'heap preserves deterministic global nearest-first order');
 assert.equal(world.dirty.size,739);
 assert.equal(view.meshQueueHeap.length+view.meshQueueBackgroundHeap.length,733,'all remaining candidates stay queued after the first active batch');
 // Drain all remaining sections. The cumulative discovery count must remain
 // constant across every subsequent active batch.
 let frames=0;
 while(world.dirty.size&&frames<130){
  Source.prototype.rebuild.call(view,world,6);
  assert.equal(view.meshQueueStats.scanned,745,'subsequent scheduling passes must not rescan the dirty Set');
  frames++;
 }
 assert.equal(world.dirty.size,0,'the persistent queue eventually drains every eligible section');
 assert.equal(recorded.length,745,'every dirty section is meshed exactly once');
 assert.equal(view.meshQueueStats.visibleWorldReady,true,'visible first-build geometry is fully ready after the complete queue drains');
 assert.equal(view.meshQueueStats.visiblePending,0);
 assert.equal(view.meshQueueStats.backgroundPending,0);
 const actualOrder=recorded.map(key=>Number(key.split(',')[0]));
 const expectedOrder=[0];for(let distance=1;distance<=372;distance++)expectedOrder.push(-distance,distance);
 assert.deepEqual(actualOrder,expectedOrder,'the complete backlog remains globally nearest-first, not merely the first batch');
 assert.ok(frames<=124,'745 sections drain in at most 124 six-slot scheduling passes after discovery');
 console.log(`PASS persistent mesh heap: 745 sections discovered once, nearest-first order retained, drained in ${frames} frames without rescanning`);
}

// World/edit invalidation resets the queue; camera relocation reprioritizes without rescanning.
{
 const chunks=new Map(),dirty=new Set();
 for(let cx=-10;cx<=10;cx++){chunks.set(`${cx},0`,{cx,cz:0});dirty.add(`${cx},0,0`);}
 const world={dirty,chunks,navRevision:0,dirtyAddRevision:0,lightingEditRevision:0,dirtyAddQueue:[],sectionDirtyRevision:new Map(),chunkTopologyRevision:0};
 const view=Object.assign(new (class{})(),{
  camera:{position:{x:8,y:8,z:8}},lastSectionY:0,verticalRadius:64,deferred:new Set(),sections:new Map(),meshed:new Set(),
  meshRevision:0,groups:new Map(),sectionCoordinates:new Map(),sectionCoordinate:Source.prototype.sectionCoordinate,meshQueueLess:Source.prototype.meshQueueLess,pushMeshQueue:Source.prototype.pushMeshQueue,popMeshQueue:Source.prototype.popMeshQueue,popNextMeshQueue:Source.prototype.popNextMeshQueue,updateMeshQueueForward:Source.prototype.updateMeshQueueForward,updateMeshQueueEntry:Source.prototype.updateMeshQueueEntry,heapifyMeshQueue:Source.prototype.heapifyMeshQueue,refreshMeshQueueFacing:Source.prototype.refreshMeshQueueFacing,recordMeshQueueReady:Source.prototype.recordMeshQueueReady,resetMeshQueue:Source.prototype.resetMeshQueue,
  recordMeshChange:Source.prototype.recordMeshChange,advanceMeshCommit:Source.prototype.advanceMeshCommit,disposePendingCommit:Source.prototype.disposePendingCommit,
  meshJobs:new Map(),meshCommits:new Map(),dirtyScanEditRevision:0,dirtyScanReady:false,dirtyScanIterator:null,dirtyScanWorld:undefined,dirtyScanCameraCell:'',
  dirtyScanPoolCount:0,dirtyScanInitialSize:0,dirtyScanScanned:0,dirtyScanEligible:0,dirtyScanRemesh:0,dirtyScanFirstBuild:0,
  nearestSections:[],nearestSectionPool:[],meshQueueHeap:[],meshQueueBackgroundHeap:[],meshQueueForegroundStreak:0,meshQueueStartedAt:0,meshQueueStats:{},meshAdmissionHeadroomMs:50,scene:{add(){}},materials:[{},{}],
  metrics:{add(){}},meshChanges:[],meshChangeBase:0,removeSection(){},
 });
 recorded=[];
 Source.prototype.rebuild.call(view,world,2);
 assert.equal(view.meshQueueStats.scanned,21);
 assert.equal(view.meshQueueHeap.length+view.meshQueueBackgroundHeap.length,17);
 world.dirty.add('100,0,0');world.dirtyAddQueue.push('100,0,0');world.sectionDirtyRevision.set('100,0,0',1);world.chunks.set('100,0',{cx:100,cz:0});world.dirtyAddRevision++;world.navRevision++;world.chunkTopologyRevision++;
 Source.prototype.rebuild.call(view,world,2);
 assert.equal(view.meshQueueStats.scanned,21,'chunk topology changes do not restart the original dirty scan');
 assert.ok(view.meshQueueEntryByKey.has('100,0,0'),'newly dirtied section is admitted from the incremental journal');
 assert.ok(view.meshQueueHeap.length+view.meshQueueBackgroundHeap.length>0);
 view.camera.position.x=1608;
 Source.prototype.rebuild.call(view,world,2);
 assert.equal(view.meshQueueStats.scanned,21,'camera-cell changes reprioritize without rescanning the snapshot');
 assert.equal(recorded.at(-2),'100,0,0','new camera location promotes its nearest section');
 console.log('PASS mesh queue invalidation: incremental topology admission and camera-cell reprioritization');
}

// A lighting-style dirty addition invalidates partial jobs even when the
// world navigation revision is unchanged; the new section must be rediscovered.
{
 let cancelled=0;
 const slowSteps=function*(_world,chunk,_lighting,section){
  let completed=false;
  try{recorded.push(`${chunk.cx},${section},${chunk.cz}`);for(let i=0;i<100;i++)yield;completed=true;return [empty(),empty()];}
  finally{if(!completed)cancelled++;}
 };
 const fakePerformance={clock:0,now(){return ++this.clock;}};
 const SlowSource=Function('THREE','meshChunkSteps','performance','MIN_SECTION','MAX_SECTION',sourceJs+';return T')(THREE,slowSteps,fakePerformance,-4,19);
 const chunks=new Map(),dirty=new Set(['-1,0,0','0,0,0','1,0,0','0,1,0']);
 for(const key of dirty){const [cx,,cz]=key.split(',').map(Number);chunks.set(`${cx},${cz}`,{cx,cz});}
 const world={dirty,chunks,navRevision:0,dirtyAddRevision:0,lightingEditRevision:0,dirtyAddQueue:[],sectionDirtyRevision:new Map(),chunkTopologyRevision:0};
 const view=Object.assign(new (class{})(),{
  camera:{position:{x:8,y:8,z:8}},lastSectionY:0,verticalRadius:64,deferred:new Set(),sections:new Map(),meshed:new Set(),
  meshRevision:0,groups:new Map(),sectionCoordinates:new Map(),sectionCoordinate:SlowSource.prototype.sectionCoordinate,
  meshQueueLess:SlowSource.prototype.meshQueueLess,pushMeshQueue:SlowSource.prototype.pushMeshQueue,popMeshQueue:SlowSource.prototype.popMeshQueue,popNextMeshQueue:SlowSource.prototype.popNextMeshQueue,updateMeshQueueForward:SlowSource.prototype.updateMeshQueueForward,updateMeshQueueEntry:SlowSource.prototype.updateMeshQueueEntry,heapifyMeshQueue:SlowSource.prototype.heapifyMeshQueue,refreshMeshQueueFacing:SlowSource.prototype.refreshMeshQueueFacing,recordMeshQueueReady:SlowSource.prototype.recordMeshQueueReady,
  resetMeshQueue:SlowSource.prototype.resetMeshQueue,recordMeshChange:SlowSource.prototype.recordMeshChange,
  advanceMeshCommit:SlowSource.prototype.advanceMeshCommit,disposePendingCommit:SlowSource.prototype.disposePendingCommit,
  meshJobs:new Map(),meshCommits:new Map(),dirtyScanEditRevision:0,dirtyScanAddRevision:0,dirtyScanReady:false,
  dirtyScanIterator:null,dirtyScanWorld:undefined,dirtyScanCameraCell:'',dirtyScanPoolCount:0,dirtyScanInitialSize:0,
  dirtyScanScanned:0,dirtyScanEligible:0,dirtyScanRemesh:0,dirtyScanFirstBuild:0,
  nearestSections:[],nearestSectionPool:[],meshQueueHeap:[],meshQueueBackgroundHeap:[],meshQueueForegroundStreak:0,meshQueueStartedAt:0,meshQueueStats:{},meshAdmissionHeadroomMs:50,
  scene:{add(){}},materials:[{},{}],metrics:{add(){}},meshChanges:[],meshChangeBase:0,removeSection(){},
 });
 recorded=[];
 SlowSource.prototype.rebuild.call(view,world,2);
 assert.equal(view.meshJobs.size,2,'initial active section jobs begin');
 world.dirty.add('0,-1,0');world.dirtyAddQueue.push('0,-1,0');world.sectionDirtyRevision.set('0,-1,0',1);world.dirtyAddRevision++;
 SlowSource.prototype.rebuild.call(view,world,2);
 assert.equal(cancelled,0,'new dirty sections do not cancel unrelated active partial jobs');
  assert.equal(view.meshJobs.size,2,'both original active jobs remain alive');
 assert.equal(view.meshQueueStats.scanned,4,'the original dirty snapshot is not rescanned for additions');
 assert.ok([...view.nearestSections,...view.meshQueueHeap,...view.meshQueueBackgroundHeap].some(entry=>entry.key==='0,-1,0'),
  'new lighting-dirty section is retained in the persistent candidate queue');
 view.resetMeshQueue();
 console.log('PASS incremental dirty admission: new lighting sections preserve unrelated active jobs and avoid snapshot rescans');
}

// Once the queue is idle, steady-state frames must not clear/rebuild the
// retained candidate pool or repeatedly initialize an empty Set iterator.
{
 const world={dirty:new Set(),chunks:new Map(),navRevision:0,dirtyAddRevision:0};
 const view=Object.assign(new (class{})(),{
  camera:{position:{x:8,y:8,z:8}},lastSectionY:0,verticalRadius:64,deferred:new Set(),sections:new Map(),meshed:new Set(),
  meshRevision:0,groups:new Map(),sectionCoordinates:new Map(),sectionCoordinate:Source.prototype.sectionCoordinate,
  meshQueueLess:Source.prototype.meshQueueLess,pushMeshQueue:Source.prototype.pushMeshQueue,popMeshQueue:Source.prototype.popMeshQueue,popNextMeshQueue:Source.prototype.popNextMeshQueue,updateMeshQueueForward:Source.prototype.updateMeshQueueForward,updateMeshQueueEntry:Source.prototype.updateMeshQueueEntry,heapifyMeshQueue:Source.prototype.heapifyMeshQueue,refreshMeshQueueFacing:Source.prototype.refreshMeshQueueFacing,recordMeshQueueReady:Source.prototype.recordMeshQueueReady,
  resetMeshQueue:Source.prototype.resetMeshQueue,recordMeshChange:Source.prototype.recordMeshChange,
  advanceMeshCommit:Source.prototype.advanceMeshCommit,disposePendingCommit:Source.prototype.disposePendingCommit,
  meshJobs:new Map(),meshCommits:new Map(),dirtyScanEditRevision:-1,dirtyScanReady:false,dirtyScanIterator:null,dirtyScanWorld:undefined,dirtyScanCameraCell:'',
  dirtyScanPoolCount:0,dirtyScanInitialSize:0,dirtyScanScanned:0,dirtyScanEligible:0,dirtyScanRemesh:0,dirtyScanFirstBuild:0,
  nearestSections:[],nearestSectionPool:[{key:'retained',cx:0,sy:0,cz:0,distance:0}],meshQueueHeap:[],meshQueueBackgroundHeap:[],meshQueueForegroundStreak:0,meshQueueStartedAt:0,
  meshQueueStats:{},scene:{add(){}},materials:[{},{}],metrics:{add(){}},meshChanges:[],meshChangeBase:0,removeSection(){},
 });
 let resets=0;const reset=Source.prototype.resetMeshQueue;
 view.resetMeshQueue=function(...args){resets++;return reset.apply(this,args);};
 Source.prototype.rebuild.call(view,world,6);
 assert.equal(resets,1,'first idle frame establishes an idle queue state');
 view.nearestSectionPool[0].key='steady-state-sentinel';
 Source.prototype.rebuild.call(view,world,6);
 assert.equal(resets,1,'steady-state idle frames do not reset the queue pool');
 assert.equal(view.nearestSectionPool[0].key,'steady-state-sentinel','idle frames retain pooled candidate storage');
 console.log('PASS idle mesh queue: no per-frame pool reset or empty-Set iterator recreation');
}

// The distant-world mesh journal is bounded and exposes a revision base for
// MeshCoverageIndex to trigger a safe full resync after overflow.
{
 const journal={meshRevision:0,meshChanges:[],meshChangeBase:0};
 for(let i=0;i<8193;i++)Source.prototype.recordMeshChange.call(journal,`${i},0,0`,true);
 assert.equal(journal.meshRevision,8193);
 assert.equal(journal.meshChanges.length,7169);
 assert.equal(journal.meshChangeBase,1024);
 assert.equal(journal.meshChanges[0].revision,1025);
 Source.prototype.recordMeshChange.call(journal,'',false,true);
 assert.equal(journal.meshChanges.at(-1).reset,true);
 assert.equal(journal.meshRevision,8194);
 console.log('PASS mesh-change journal: monotonic revisions, bounded overflow trimming and reset event');
}
