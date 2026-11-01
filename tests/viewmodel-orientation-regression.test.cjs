const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const source = fs.readFileSync('src/render/renderer.ts','utf8');

class Group {
  constructor(){this.children=[];this.pose=[0,0,0,'XYZ'];this.rotation={set:(x,y,z,order='XYZ')=>{this.pose=[x,y,z,order]}};}
  add(o){this.children.push(o);}
  remove(o){this.children.splice(this.children.indexOf(o),1);}
}
class BoxGeometry {
  constructor(...size){this.size=size;this.disposed=false;this.attributes={uv:{setXY(){},needsUpdate:false}};}
  setAttribute(n,v){this.attributes[n]=v;}
  getAttribute(n){return this.attributes[n];}
  dispose(){this.disposed=true;}
}
class Float32BufferAttribute{constructor(...args){this.args=args;}}
class MeshBasicMaterial{constructor(value){Object.assign(this,value);}dispose(){this.disposed=true;}}
class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;this.rotation={z:0};this.position={set:(x,y,z)=>{this.xyz=[x,y,z]}};}}
const THREE={Mesh,BoxGeometry,MeshBasicMaterial,Float32BufferAttribute};
const definitions = {};
const tools=['pickaxe','axe','shovel','hoe','sword'];
for(let tier=0;tier<4;tier++)for(let t=0;t<5;t++){
  const id=120+5*tier+t;
  definitions[id]={id,category:'Tools',tool:tools[t],color:'#bbcbbb'};
}
definitions[999]={id:999,category:'Tools',tool:'future-lance',color:'#aabbcc'};
definitions[4]={id:4,category:'Architecture',block:4,color:'#bbccaa'};
definitions[103]={id:103,category:'Materials',color:'#abcabc'};
const item=id=>definitions[id];
const rendererTree=ts.createSourceFile('renderer.ts',source,ts.ScriptTarget.ES2022,true);
const viewClass=rendererTree.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='View');
const heldMethod=viewClass?.members.find(n=>ts.isMethodDeclaration(n)&&n.name.getText(rendererTree)==='setHeldItem');
assert(heldMethod,'View.setHeldItem must exist');
const sourceJs=ts.transpileModule('class T {'+heldMethod.getText(rendererTree)+'}',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const Src=Function('THREE','item',sourceJs+';return T')(THREE,item);

// Three.js Euler XYZ, applied to the local +Y shaft / weapon blade axis.
function toolTipDirection([pitch,yaw,roll]){
  const sx=Math.sin(pitch),cx=Math.cos(pitch);
  const sy=Math.sin(yaw),cy=Math.cos(yaw);
  const sz=Math.sin(roll),cz=Math.cos(roll);
  return [-cy*sz, cx*cz-sx*sy*sz, sx*cz+cx*sy*sz];
}
for (const [label,Cl] of [['source',Src]]) {
 const model=new Cl();model.heldModel=new Group();model.atlas={texture:{}};
 const seen=new Set();
 for(let id=120;id<140;id++) {
   model.setHeldItem(id);
   const pose=model.heldModel.pose;
   assert.equal(pose[3],'XYZ',`${label} correct rotation order for tool ${id}`);
   assert.ok(pose.slice(0,3).every(Number.isFinite),`${label} finite pose`);
   const tip=toolTipDirection(pose);
   assert.ok(tip[2] < -0.30,`${label} ${definitions[id].tool} tier ${id} points FORWARD into -Z, got ${tip[2]}`);
   assert.ok(tip[1] > 0.45,`${label} ${definitions[id].tool} remains visible upward, got ${tip[1]}`);
   assert.ok(tip[0] < -0.14,`${label} ${definitions[id].tool} aims inward from right toward crosshair, got ${tip[0]}`);
   const key=definitions[id].tool;
   const coordinates=pose.slice(0,3).join(',');
   const existing=[...seen].find(x=>x.startsWith(key+':'));
   if(existing)assert.equal(existing,key+':'+coordinates,`${label} tiers share a stable ${key} pose`);
   seen.add(key+':'+coordinates);
   const prev=model.heldModel.children.slice();
   model.setHeldItem(id);
   assert.equal(model.heldModel.children[0],prev[0],`${label} repeated selection does not rebuild meshes`);
 }
 assert.equal(seen.size,5,`${label} five category-specific poses`);
 model.setHeldItem(999);
 assert.ok(toolTipDirection(model.heldModel.pose)[2] < -0.3,`${label} unknown future tool also points forward`);
 const parts=model.heldModel.children.slice();
 model.setHeldItem(4);
 assert.ok(Math.abs(model.heldModel.pose[0])<0.3,`${label} building block uses non-weapon pose`);
 assert.ok(parts.every(p=>p.geometry.disposed&&p.material.disposed),`${label} geometry cleaned when switching categories`);
 model.setHeldItem(103);
 assert.ok(Math.abs(model.heldModel.pose[0])<0.3,`${label} materials use non-weapon pose`);
 model.setHeldItem(null);
 assert.deepEqual(model.heldModel.pose.slice(0,3),[0,0,0],`${label} empty slot resets pose`);
 assert.equal(model.heldModel.children.length,0,`${label} empty slot clears item`);
 console.log(`PASS ${label}: 20 tools across 4 tiers, 5 unique forward poses, fallback, grip reset, and cleanup`);
}
console.log('PASS source viewmodel pose regression');
