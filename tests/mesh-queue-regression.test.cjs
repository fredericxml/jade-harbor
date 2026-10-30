const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
class Group {constructor(){this.children=[];this.position={set(){}};} add(obj){this.children.push(obj);} removeFromParent(){} traverse(fn){for(const child of this.children)fn(child);} }
class Geometry {setAttribute(){return this;}setIndex(){return this;}computeBoundingSphere(){}dispose(){}}
class Attribute{constructor() {}}
class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;}}
const THREE={Group,BufferGeometry:Geometry,Float32BufferAttribute:Attribute,Mesh};
const empty=()=>({positions:[],normals:[],uvs:[],colors:[],sky:[],lights:[],indices:[]});
const renderer=fs.readFileSync('src/render/renderer.ts','utf8');
const start=renderer.indexOf('  rebuild(world: World, budget = 2) {'),end=renderer.indexOf('  removeSection(key:string)',start);
assert.ok(start>=0&&end>start);
const sourceJs=ts.transpileModule('class T {\n'+renderer.slice(start,end)+'\n}',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
let recorded=[];
const generate=(_world,chunk,_lighting,section)=>{recorded.push(`${chunk.cx},${section},${chunk.cz}`);return [empty(),empty(),empty()];};
const Source=Function('THREE','meshChunk','performance',sourceJs+';return T')(THREE,generate,performance);
function setup(){
 const chunks=new Map(),dirty=new Set();
 for(let cx=-2;cx<=2;cx++)for(let cz=-2;cz<=2;cz++){
  chunks.set(`${cx},${cz}`,{cx,cz});for(let sy=-2;sy<=2;sy++)dirty.add(`${cx},${sy},${cz}`);
 }
 dirty.add('99,0,99');dirty.add('0,19,0');
 return {world:{dirty,chunks},view:Object.assign(new (class{})(),{camera:{position:{x:8,y:8,z:8}},lastSectionY:0,verticalRadius:64,deferred:new Set(),sections:new Map(),meshed:new Set(),meshRevision:0,groups:new Map(),scene:{add(){}},materials:[{}, {}, {}],metrics:{add(){}},removeSection(){}})};
}
for(const [name,Cl] of [['source',Source]]){
 const {world,view}=setup();recorded=[];Cl.prototype.rebuild.call(view,world,3);
 assert.equal(recorded.length,3,`${name} processes 3 nearest sections`);
 assert.ok(recorded.includes('0,0,0'),`${name} center section prioritized`);
 assert.ok(!world.dirty.has('99,0,99'),`${name} discarded absent chunk`);
 assert.ok(view.deferred.has('0,19,0'),`${name} deferred far vertical section`);
 assert.ok(world.dirty.size>0,`${name} kept remaining mesh work queued`);
 console.log(`PASS ${name}: nearest work ordering, capped per-frame meshing, unloaded cleanup and deferred vertical section`);
}
