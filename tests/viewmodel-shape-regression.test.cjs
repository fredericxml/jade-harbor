const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/render/renderer.ts', 'utf8');
class Group {constructor(){this.children=[];this.rotation={set:(x,y,z,order)=>{this.pose=[x,y,z,order]}};}add(o){this.children.push(o);}remove(o){const i=this.children.indexOf(o);if(i>=0)this.children.splice(i,1);}}
class Attr {constructor(){this.coords=new Map();this.needsUpdate=false;} setXY(i,u,v){this.coords.set(i,[u,v]);}}
class BoxGeometry {
 constructor(...size){this.size=size;this.dimensions=size;this.disposed=false;this.attributes={uv:new Attr()};}
 getAttribute(name){return this.attributes[name];}
 setAttribute(name,value){this.attributes[name]=value;}
 dispose(){this.disposed=true;}
}
class Float32BufferAttribute {constructor(data,n){this.data=data;this.n=n;}}
class MeshBasicMaterial {constructor(p){Object.assign(this,p);this.disposed=false;}dispose(){this.disposed=true;}}
class Mesh {constructor(geometry,material){this.geometry=geometry;this.material=material;this.position={set:(x,y,z)=>{this.xyz=[x,y,z];}};this.rotation={z:0};}}
const THREE={Group, Mesh,BoxGeometry,Float32BufferAttribute,MeshBasicMaterial};
const items={
  130:{tool:'pickaxe',color:'#8ad9b4'},
  131:{tool:'axe',color:'#b5cbd5'},
  132:{tool:'shovel',color:'#a5afb1'},
  133:{tool:'hoe',color:'#d7d9d1'},
  134:{tool:'sword',color:'#d9e0e4'},
  4:{block:4,color:'#dfb67e'},
  103:{category:'Materials',color:'#77c9a5'},
  105:{category:'Food',color:'#e3d9bb'},
  161:{category:'Brewing',color:'#b9e2df'},
};
const srcMethod=source.match(/  setHeldItem\(id: number \| null\) \{[\s\S]*?\n  \}\n  resize\(\)/)[0].replace(/\n  resize\(\)$/,'');
const srcJS=ts.transpileModule('class T{'+srcMethod+'}',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const Src=Function('THREE','item',srcJS+';return T')(THREE,i=>items[i]);
const includes=(a,b)=>a.toLowerCase().includes(b);
for(const [label,Cl] of [['source',Src]]){
  const vm=new Cl();vm.heldModel=new Group();vm.atlas={texture:{name:'block-atlas'}};
  for(const id of Object.keys(items).map(Number)){
    vm.setHeldItem(id);const parts=vm.heldModel.children;
    assert.ok(parts.length>0,`${label} item ${id} must appear`);
    assert.ok(parts.every(p=>p.geometry.size.every(v=>v>0&&v<1.1)),`${label} item ${id} reasonable dimensions`);
    assert.ok(parts.every(p=>p.xyz.every(Number.isFinite)),`${label} item ${id} finite coordinates`);
    if(items[id].tool){
      assert.ok(parts.length>=3,`${label} ${items[id].tool} has multiple parts`);
      // Every tool shaft starts low enough to intersect the palm at local y ~= 0.
      const bottom=Math.min(...parts.map(p=>p.xyz[1]-p.geometry.size[1]/2));
      assert.ok(bottom<=0.05,`${label} ${items[id].tool} reaches the grip`);
      const top=Math.max(...parts.map(p=>p.xyz[1]+p.geometry.size[1]/2));
      assert.ok(top>=0.5,`${label} ${items[id].tool} head readable`);
    }
    if(id===4){
      assert.equal(parts.length,1,`${label} blocks have one solid cube`);
      assert.equal(parts[0].material.map,vm.atlas.texture,`${label} block uses world atlas`);
      assert.equal(parts[0].geometry.attributes.uv.coords.size,24,`${label} all six block faces mapped`);
      assert.ok([...parts[0].geometry.attributes.uv.coords.values()].every(([u,v])=>u>=0&&u<=1&&v>=0&&v<=1),`${label} atlas UV valid`);
    }
    const previous=[...parts];
    vm.setHeldItem(id);assert.equal(vm.heldModel.children[0],previous[0],`${label} same item retains geometry`);
    vm.setHeldItem(null);assert.equal(vm.heldModel.children.length,0);
    assert.ok(previous.every(p=>p.geometry.disposed&&p.material.disposed),`${label} resources disposed`);
  }
  console.log(`PASS ${label}: all tool silhouettes, block texture, materials, grip, disposal`);
}
assert.match(source,/new THREE\.PerspectiveCamera\(56,/);
assert.match(source,/this\.renderer\.clearDepth\(\)/);
assert.match(source,/this\.hand\.position\.set\(0\.51, -0\.64, -1\.15\)/);
console.log('PASS: source projection, pose, and independent depth rendering');
