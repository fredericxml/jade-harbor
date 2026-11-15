const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
class Group {constructor(){this.children=[];this.position={set(){}};} add(obj){this.children.push(obj);obj.parent=this;} removeFromParent(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);} clear(){this.children=[];} traverse(fn){for(const child of this.children)fn(child);} }
class Geometry {setAttribute(){return this;}setIndex(){return this;}computeBoundingSphere(){}dispose(){} }
class Attribute {constructor(array,itemSize){this.array=array;this.itemSize=itemSize;} }
class Mesh {constructor(geometry,material){this.geometry=geometry;this.material=material;} }
const THREE={Group,BufferGeometry:Geometry,BufferAttribute:Attribute,Mesh};
const createSectionGeometry=data=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(data.positions,3));geo.setAttribute('normal',new THREE.BufferAttribute(data.normals,3));geo.setAttribute('uv',new THREE.BufferAttribute(data.uvs,2));geo.setAttribute('tile',new THREE.BufferAttribute(data.tiles,2));geo.setAttribute('color',new THREE.BufferAttribute(data.colors,3));geo.setAttribute('emissive',new THREE.BufferAttribute(data.emissive,1));geo.setAttribute('sky',new THREE.BufferAttribute(data.sky,1));geo.setAttribute('blockLight',new THREE.BufferAttribute(data.lights,1));geo.setIndex(new THREE.BufferAttribute(data.indices,1));return geo;};
const empty=()=>({positions:new Float32Array(),normals:new Float32Array(),uvs:new Float32Array(),tiles:new Uint8Array(),colors:new Float32Array(),emissive:new Uint8Array(),indices:new Uint16Array(),sky:new Float32Array(),lights:new Float32Array(),emissiveTriangles:0,waterTriangles:0});
const built=()=>({positions:new Float32Array([0,0,0,1,0,0,0,1,0]),normals:new Float32Array([0,0,1,0,0,1,0,0,1]),uvs:new Float32Array([0,0,1,0,0,1]),tiles:new Uint8Array([0,0,0,0,0,0]),colors:new Float32Array([1,1,1,1,1,1,1,1,1]),emissive:new Uint8Array([0,0,0]),indices:new Uint16Array([0,1,2]),sky:new Float32Array([1,1,1]),lights:new Float32Array([0,0,0]),emissiveTriangles:0,waterTriangles:0});
const renderer=fs.readFileSync('src/render/renderer.ts','utf8');
const start=renderer.indexOf('  rebuild(world: World, budget = 2) {'),end=renderer.indexOf('  removeSection(',start);
const src=ts.transpileModule('class T {\n'+renderer.slice(renderer.indexOf('  private recordMeshChange('),renderer.indexOf('  resize('))+renderer.slice(renderer.indexOf('  private disposePendingCommit('),start)+renderer.slice(start,end)+'\n}',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
let recorded=[];
const steps=function*(_world,chunk,_lighting,section){for(let i=0;i<8;i++){recorded.push(`${chunk.cx},${section},${chunk.cz}`);yield;}return [built(),empty()];};
const fakePerformance={clock:0,now(){return ++this.clock;}};
const View=Function('THREE','meshChunkSteps','performance','MIN_SECTION','MAX_SECTION','createSectionGeometry',src+';return T')(THREE,steps,fakePerformance,-4,19,createSectionGeometry);
function setup(keys=['0,0,0']){
 const chunks=new Map(),dirty=new Set(keys),groups=new Map(),sections=new Map(keys.map(key=>[key,new Group()]));
 for(const key of keys){const [cx,sy,cz]=key.split(',').map(Number),column=`${cx},${cz}`;chunks.set(column,{cx,cz,blocks:{sections:new Map([[sy,{nonAir:1}]])}});groups.set(column,new Group());}
 const world={dirty,chunks,navRevision:0,dirtyAddRevision:0},old=sections.get(keys[0]);
 const view=Object.assign(new (class{})(),{camera:{position:{x:8,y:8,z:8}},lastSectionY:0,lastSurfaceY:0,verticalRadius:64,deferred:new Set(),sections,meshed:new Set(keys),meshRevision:0,groups,sectionCoordinates:new Map(),sectionCoordinate:View.prototype.sectionCoordinate,meshQueueLess:View.prototype.meshQueueLess,pushMeshQueue:View.prototype.pushMeshQueue,popMeshQueue:View.prototype.popMeshQueue,popNextMeshQueue:View.prototype.popNextMeshQueue,updateMeshQueueForward:View.prototype.updateMeshQueueForward,updateMeshQueueEntry:View.prototype.updateMeshQueueEntry,heapifyMeshQueue:View.prototype.heapifyMeshQueue,refreshMeshQueueFacing:View.prototype.refreshMeshQueueFacing,recordMeshQueueReady:View.prototype.recordMeshQueueReady,resetMeshQueue:View.prototype.resetMeshQueue,recordMeshChange:View.prototype.recordMeshChange,advanceMeshCommit:View.prototype.advanceMeshCommit,disposePendingCommit:View.prototype.disposePendingCommit,meshJobs:new Map(),meshCommits:new Map(),meshAdmissionHeadroomMs:50,dirtyScanEditRevision:0,dirtyScanAddRevision:0,dirtyScanReady:false,dirtyScanIterator:null,dirtyScanWorld:undefined,dirtyScanCameraCell:'',dirtyScanPoolCount:0,dirtyScanInitialSize:0,dirtyScanScanned:0,dirtyScanEligible:0,dirtyScanRemesh:0,dirtyScanFirstBuild:0,nearestSections:[],nearestSectionPool:[],meshQueueHeap:[],meshQueueBackgroundHeap:[],meshQueueForegroundStreak:0,meshQueueStartedAt:0,meshQueueStats:{},scene:new Group(),materials:[{},{}],metrics:{add(){}},meshChanges:[],meshChangeBase:0,removeSection(key){this.sections.delete(key);}});
 return {world,view,old,key:keys[0]};
}
{
 const {world,view,old,key}=setup();
 let frames=0,totalSlices=0;
 while(world.dirty.has(key)&&frames<12){
  View.prototype.rebuild.call(view,world,6);frames++;totalSlices+=view.meshQueueStats.slicesThisFrame;
  if(world.dirty.has(key)){
   assert.equal(view.sections.get(key),old,'previous geometry remains visible until the complete replacement commits');
   assert.equal(view.meshJobs.size+view.meshCommits.size,1,'partial meshing or geometry commit remains resumable across frames');
  }else assert.notEqual(view.sections.get(key),old,'replacement becomes visible only after complete commit');
  assert.ok(view.meshQueueStats.slicesThisFrame<=3,'the shared frame budget admits only bounded resumable slices');
 }
 assert.equal(world.dirty.has(key),false,'dirty key removed only after successful completion');
 assert.ok(frames>=3,'fine-grained jobs span multiple frames instead of completing in one large slice');
 assert.ok(totalSlices>=8,'all eight resumable mesher slices were advanced');
 assert.notEqual(view.sections.get(key),old,'new geometry replaces old geometry at commit');
 assert.equal(view.meshJobs.size,0,'completed job released');
 console.log('PASS resumable renderer job: fine-grained slices preserve old geometry until atomic replacement');
}
{
 const {world,view,old,key}=setup();
 View.prototype.rebuild.call(view,world,6);
 assert.equal(view.meshJobs.size,1);
 world.navRevision++;
 View.prototype.rebuild.call(view,world,6);
 assert.equal(view.meshJobs.size,1,'stale job cancelled and a fresh revision job started');
 assert.equal(view.sections.get(key),old,'revision cancellation never removes the last committed geometry');
 assert.ok(world.dirty.has(key),'cancelled work remains queued for rebuilding');
 console.log('PASS stale-job cancellation: world revision invalidates partial work without losing committed geometry');
}
{
 const {world,view}=setup(['0,0,0','1,0,0']);
 recorded=[];
 View.prototype.rebuild.call(view,world,2);
 assert.deepEqual(recorded.slice(0,3),['0,0,0','1,0,0','0,0,0'],'active jobs advance in nearest-first round-robin order');
 assert.ok(view.meshQueueStats.slicesThisFrame>0&&view.meshQueueStats.slicesThisFrame<=3,'the shared frame budget admits multiple bounded rounds');
 assert.equal(view.meshJobs.size,2,'both active jobs retain resumable progress');
 console.log('PASS round-robin frame pacing: multiple small slices share the frame budget without starving the second job');
}
