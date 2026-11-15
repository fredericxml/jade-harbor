const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const renderer=fs.readFileSync(path.join(root,'src/render/renderer.ts'),'utf8');
const game=fs.readFileSync(path.join(root,'src/core/game.ts'),'utf8');

function extractedView(perf){
  const start=renderer.indexOf('  private recordMeshChange(');
  const resize=renderer.indexOf('  resize(width?:number,height?:number) {',start);
  const dispose=renderer.indexOf('  private disposePendingCommit(',resize);
  const rebuild=renderer.indexOf('  rebuild(world: World, budget = 2) {',dispose);
  const remove=renderer.indexOf('  removeSection(',rebuild);
  assert.ok(start>=0&&resize>start&&dispose>resize&&rebuild>dispose&&remove>rebuild);
  const js=ts.transpileModule('class T {\n'+renderer.slice(start,resize)+renderer.slice(dispose,remove)+'\n}',
    {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  class Group{constructor(){this.children=[];this.position={set(){}};}add(x){this.children.push(x);}removeFromParent(){}traverse(fn){this.children.forEach(fn);}clear(){this.children.length=0;}}
  class Vector3{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}}
  const THREE={Group,Vector3};
  return Function('THREE','meshChunkSteps','performance','MIN_SECTION','MAX_SECTION',
    js+';return T')(THREE,function*(){return [[],[]];},perf,-4,19);
}
function setup(View,perf,headroom=50,commitCostMs=.2){
  let clock=0;
  perf.now=()=>clock;
  const keys=Array.from({length:6},(_,i)=>`${i},0,0`);
  const chunks=new Map(keys.map(k=>{const [cx,sy,cz]=k.split(',').map(Number);return [`${cx},${cz}`,{cx,cz,blocks:{sections:new Map([[sy,{nonAir:1}]])}}];}));
  const world={dirty:new Set(keys),chunks,navRevision:0,lightingEditRevision:0,dirtyAddRevision:0,
    dirtyAddQueue:[],dirtyAddQueueSet:new Set(),sectionDirtyRevision:new Map(keys.map(k=>[k,0]))};
  const view=Object.assign(new (class {})(),{
    camera:{position:{x:8,y:8,z:8},facing:[0,0,-1],getWorldDirection(t){t.x=0;t.y=0;t.z=-1;return t;}},
    lastSectionY:0,lastSurfaceY:0,verticalRadius:64,deferred:new Set(),
    sections:new Map(),meshed:new Set(),meshRevision:0,groups:new Map(),sectionCoordinates:new Map(),
    nearestSections:[],nearestSectionPool:[],meshQueueHeap:[],meshQueueBackgroundHeap:[],meshQueueForegroundStreak:0,
    meshQueueEntryByKey:new Map(),dirtyScanAddCursor:0,meshAdmissionHeadroomMs:headroom,dirtyAdmissionCostMsPerKey:.01,
    dirtyAdmissionBacklogHighWater:0,dirtyAdmissionEpisodeActive:false,meshFrameSequence:0,
    meshJobs:new Map(),meshCommits:new Map(),meshQueueStartedAt:0,meshQueueStats:{},
    scene:{add(){}},materials:[{},{}],metrics:{add(){}},meshChanges:[],meshChangeBase:0,
    dirtyScanEditRevision:-1,dirtyScanReady:false,dirtyScanIterator:null,dirtyScanWorld:undefined,
    dirtyScanCameraCell:'',dirtyScanPoolCount:0,dirtyScanInitialSize:0,dirtyScanScanned:0,
    dirtyScanEligible:0,dirtyScanRemesh:0,dirtyScanFirstBuild:0,dirtyScanVisibleFirstBuild:0,
    dirtyScanVisibleReady:0,dirtyScanBackgroundFirstBuild:0,dirtyScanBackgroundReady:0,
    meshQueueForward:{x:0,y:0,z:-1},dirtyScanForwardX:0,dirtyScanForwardY:0,dirtyScanForwardZ:-1,
    dirtyScanEyeX:8,dirtyScanEyeY:8,dirtyScanEyeZ:8,staleCoordinateSweep:null,evictionQueueRefresh:false,
    sectionCoordinate:View.prototype.sectionCoordinate,meshQueueLess:View.prototype.meshQueueLess,
    updateMeshQueueForward:View.prototype.updateMeshQueueForward,updateMeshQueueEntry:View.prototype.updateMeshQueueEntry,
    heapifyMeshQueue:View.prototype.heapifyMeshQueue,refreshMeshQueueFacing:View.prototype.refreshMeshQueueFacing,
    pushMeshQueue:View.prototype.pushMeshQueue,popMeshQueue:View.prototype.popMeshQueue,popNextMeshQueue:View.prototype.popNextMeshQueue,
    recordMeshQueueReady:View.prototype.recordMeshQueueReady,resetMeshQueue:View.prototype.resetMeshQueue,
    recordMeshChange:View.prototype.recordMeshChange,advanceMeshCommit:View.prototype.advanceMeshCommit,
    disposePendingCommit:View.prototype.disposePendingCommit,removeSection(){},
  });
  const advanced=[];
  view.advanceMeshCommit=(_world,commit)=>{advanced.push(commit.key);clock+=commitCostMs;return false;};
  return {view,world,advanced,getClock:()=>clock};
}
test('an unfinished section commit no longer blocks the other active sections',()=>{
  const perf={now:()=>0},View=extractedView(perf),state=setup(View,perf,50,.2);
  View.prototype.rebuild.call(state.view,state.world,6);
  assert.equal(state.advanced.length,6,'all six active sections should advance one commit slice in the same frame');
  assert.equal(new Set(state.advanced).size,6,'each section advances at most once in the frame');
  assert.equal(state.view.meshQueueStats.pendingCommits,6);
  assert.equal(state.view.meshQueueStats.activeMeshingMs,1.2);
});
test('mesh commit work scales down with low previous-frame CPU headroom',()=>{
  const perf={now:()=>0},View=extractedView(perf),state=setup(View,perf,1,.6);
  View.prototype.rebuild.call(state.view,state.world,6);
  assert.equal(state.advanced.length,2,'one indivisible geometry commit may cross the 1 ms soft floor, then the frame yields');
  assert.ok(state.view.meshQueueStats.activeMeshingMs<=1.21);
});
test('mesh work budget remains bounded between 1 and 7 ms and is based on measured headroom',()=>{
  assert.match(renderer,/const meshBudgetMs=Math\.max\(1,Math\.min\(7,this\.meshAdmissionHeadroomMs\*0\.5\)\)/);
  assert.match(renderer,/stats\.meshBudgetMs=meshBudgetMs/);
  assert.match(game,/metricFormat\("meshCommit"\)/);
  assert.match(game,/metricFormat\("generation"\)/);
  assert.match(game,/streaming\.workerBusyAgeMs/);
  assert.match(renderer,/if\(performance\.now\(\)-started>meshBudgetMs\)break/);
  assert.match(game,/this\.view\.setMeshAdmissionHeadroom\(frameHeadroomMs\)/);
  assert.match(game,/this\.view\.rebuild\(this\.world, 6\)/,'active-section cap remains six for memory stability');
});
