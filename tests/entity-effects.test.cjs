#!/usr/bin/env node
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");

class BufferAttribute {
  constructor(array, itemSize) { this.array=array; this.itemSize=itemSize; this.count=array.length/itemSize; this.updateRanges=[]; this.version=0; }
  setUsage() { return this; }
  clearUpdateRanges() { this.updateRanges.length=0; }
  addUpdateRange(start,count) { this.updateRanges.push({start,count}); }
  set needsUpdate(value) { if(value) this.version++; }
}
class Vector3 {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  setScalar(v){this.x=this.y=this.z=v;return this;}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
  addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}
  distanceToSquared(v){const x=this.x-v.x,y=this.y-v.y,z=this.z-v.z;return x*x+y*y+z*z;}
}
class Matrix4 {
  constructor(){this.elements=new Float32Array(16);this.identity();}
  identity(){this.elements.fill(0);this.elements[0]=this.elements[5]=this.elements[10]=this.elements[15]=1;return this;}
  makeRotationY(y){this.identity();this.elements[0]=Math.cos(y);this.elements[2]=-Math.sin(y);this.elements[8]=Math.sin(y);this.elements[10]=Math.cos(y);return this;}
  setPosition(x,y,z){this.elements[12]=x;this.elements[13]=y;this.elements[14]=z;return this;}
  scale(v){const e=this.elements;e[0]*=v.x;e[1]*=v.x;e[2]*=v.x;e[3]*=v.x;e[4]*=v.y;e[5]*=v.y;e[6]*=v.y;e[7]*=v.y;e[8]*=v.z;e[9]*=v.z;e[10]*=v.z;e[11]*=v.z;return this;}
  multiplyMatrices(a,b){const ae=a.elements,be=b.elements,te=this.elements;const out=new Float32Array(16);for(let r=0;r<4;r++)for(let c=0;c<4;c++){let v=0;for(let k=0;k<4;k++)v+=ae[k*4+r]*be[c*4+k];out[c*4+r]=v;}te.set(out);return this;}
}
class Object3D {
  constructor(){this.position=new Vector3();this.scale=new Vector3(1,1,1);this.rotation=new Vector3();this.matrix=new Matrix4();}
  updateMatrix(){this.matrix.identity();this.matrix.elements[0]=this.scale.x;this.matrix.elements[5]=this.scale.y;this.matrix.elements[10]=this.scale.z;this.matrix.elements[12]=this.position.x;this.matrix.elements[13]=this.position.y;this.matrix.elements[14]=this.position.z;return this;}
}
class Color {
  constructor(value="#ffffff"){this.set(value);}
  set(value){if(typeof value==="string"&&value[0]==="#"){const n=parseInt(value.slice(1),16);this.r=((n>>16)&255)/255;this.g=((n>>8)&255)/255;this.b=(n&255)/255;}else{this.r=this.g=this.b=1;}return this;}
}
class InstancedMesh {
  constructor(geometry,material,count){this.geometry=geometry;this.material=material;this.capacity=count;this.count=count;this.visible=true;this.frustumCulled=true;this.instanceMatrix=new BufferAttribute(new Float32Array(count*16),16);this.instanceColor=null;}
  setMatrixAt(index,matrix){this.instanceMatrix.array.set(matrix.elements,index*16);}
  setColorAt(index,color){if(!this.instanceColor)this.instanceColor=new BufferAttribute(new Float32Array(this.capacity*3),3);const a=this.instanceColor.array;a[index*3]=color.r;a[index*3+1]=color.g;a[index*3+2]=color.b;}
}
class Geometry { constructor(){this.attributes={};} setAttribute(name,value){this.attributes[name]=value;} setDrawRange(start,count){this.drawRange={start,count};} dispose(){} }
class Material { constructor(opts={}){Object.assign(this,opts);} dispose(){} }
class Scene { constructor(){this.children=[];} add(o){if(!this.children.includes(o))this.children.push(o);o.parent=this;} remove(o){this.children=this.children.filter(x=>x!==o);o.parent=null;} }
class Group extends Scene { constructor(){super();this.position=new Vector3();this.rotation=new Vector3();} }
class Mesh { constructor(geometry,material){this.geometry=geometry;this.material=material;this.position=new Vector3();this.scale=new Vector3(1,1,1);this.rotation=new Vector3();this.children=[];this.userData={};} }
class Points { constructor(geometry,material){this.geometry=geometry;this.material=material;this.visible=true;this.frustumCulled=true;} }
class Sphere { constructor(center,radius){this.center=center;this.radius=radius;} }
class Frustum { setFromProjectionMatrix(){} intersectsSphere(){return true;} }
const THREE={
  BoxGeometry:Geometry,BufferGeometry:Geometry,BufferAttribute,Vector3,Matrix4,Object3D,Color,
  InstancedMesh,MeshLambertMaterial:Material,MeshBasicMaterial:Material,PointsMaterial:Material,
  Points,Group,Mesh,Sphere,Frustum,DynamicDrawUsage:35048,
};
const originalLoad=Module._load;
Module._load=function(request,parent,isMain){if(request==="three")return THREE;return originalLoad.call(this,request,parent,isMain);};
require.extensions[".ts"]=(module,filename)=>{
  const ts=require("typescript");
  const output=ts.transpileModule(fs.readFileSync(filename,"utf8"),{fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  module._compile(output,filename);
};
const {EntityView}=require("../src/render/entity-view.ts");
const {Effects}=require("../src/render/effects.ts");
const {GRAPHICS_PROFILES}=require("../src/render/graphics.ts");
Module._load=originalLoad;

function resident(id="r1") {
  return {id,name:"Resident",kind:"villager",profession:undefined,state:"idle",yaw:0,
    body:{position:{x:1,y:2,z:3},velocity:{x:0,y:0,z:0}}};
}
function entities(actors, tasks=new Map(), states=new Map()) {
  return {renderActors:()=>actors,world:{loaded:()=>true},drops:[],
    life:{active:new Map(actors.map(e=>[e.id,e])),plan:{byId:tasks},states}};
}

test("static resident poses are not re-uploaded when neither pose nor appearance changes",()=>{
  const scene=new Scene(),view=new EntityView(scene),actors=[resident()];
  const world=entities(actors);
  view.update(world,1);
  const matrixVersion=view.civilians.instanceMatrix.version;
  const colorVersion=view.civilians.instanceColor.version;
  view.update(world,2); // An idle resident has no time-dependent pose.
  assert.equal(view.civilians.instanceMatrix.version,matrixVersion);
  assert.equal(view.civilians.instanceColor.version,colorVersion);
  view.dispose();
});

test("moving residents update matrices without re-uploading unchanged colors",()=>{
  const scene=new Scene(),view=new EntityView(scene),actor=resident(),world=entities([actor]);
  view.update(world,1);
  const matrixVersion=view.civilians.instanceMatrix.version;
  const colorVersion=view.civilians.instanceColor.version;
  actor.body.position.x+=1;
  view.update(world,1);
  assert.equal(view.civilians.instanceMatrix.version,matrixVersion+1);
  assert.equal(view.civilians.instanceColor.version,colorVersion);
  view.dispose();
});

test("appearance changes update both resident matrix and color ranges",()=>{
  const scene=new Scene(),view=new EntityView(scene),actor=resident(),world=entities([actor]);
  view.update(world,1);
  const colorVersion=view.civilians.instanceColor.version;
  actor.profession="merchant";
  view.update(world,1);
  assert.equal(view.civilians.instanceColor.version,colorVersion+1);
  assert.ok(view.civilians.instanceColor.updateRanges.length>0);
  view.dispose();
});



test("profile LOD changes rebuild only the visual representation while retaining the resident",()=>{
  const scene=new Scene(),view=new EntityView(scene),actor=resident();
  actor.body.position.x=40;
  const world=entities([actor]);
  const camera={position:new Vector3(0,0,0),projectionMatrix:new Matrix4(),matrixWorldInverse:new Matrix4(),updateMatrixWorld(){}};
  view.update(world,1,camera,GRAPHICS_PROFILES.low);
  const lowParts=view.civilians.count;
  assert.equal(view.stats.far,1);
  view.update(world,1,camera,GRAPHICS_PROFILES.medium);
  const mediumParts=view.civilians.count;
  assert.equal(view.stats.mid,1);
  assert.ok(mediumParts>lowParts,"Medium retains the same resident with a more detailed render representation");
  view.update(world,1,camera,GRAPHICS_PROFILES.high);
  assert.equal(view.stats.full,1);
  assert.ok(view.civilians.count>mediumParts,"High retains the same resident with a more detailed render representation");
  assert.equal(view.stats.simulated,1);
  view.dispose();
});

test("purposeful resident action changes refresh pose matrices but preserve appearance colors",()=>{
  const scene=new Scene(),view=new EntityView(scene),actor=resident();
  const task={prop:"basket",look:{upper:"#a65c48",lower:"#3f5148",sash:"#c9ad72",hair:"#303d34",
    skin:"#c8aa7e",hat:"cap",hatColor:"#303d34",width:1,height:1,apron:true,fingerprint:"test-look"}};
  const state={taskActing:true,taskAction:"greet"};
  const world=entities([actor],new Map([[actor.id,{task}]]),new Map([[actor.id,state]]));
  view.update(world,1);
  const matrixVersion=view.civilians.instanceMatrix.version;
  const colorVersion=view.civilians.instanceColor.version;
  state.taskAction="hammer";
  view.update(world,1.1);
  assert.equal(view.civilians.instanceMatrix.version,matrixVersion+1);
  assert.equal(view.civilians.instanceColor.version,colorVersion);
  view.dispose();
});

test("particle transforms update each frame but unchanged instance colors upload only once",()=>{
  const scene=new Scene(),effects=new Effects(scene);
  const oldRandom=Math.random;Math.random=()=>.5;
  try{
    effects.burst({x:1,y:2,z:3},"#ff0000");
    effects.update(1/60,{x:0,y:0,z:0},false,1);
    const matrixVersion=effects.mesh.instanceMatrix.version;
    const colorVersion=effects.mesh.instanceColor.version;
    const firstScale=effects.mesh.instanceMatrix.array[0];
    assert.ok(firstScale>0&&firstScale<1);
    assert.equal(effects.mesh.instanceMatrix.array[15],1);
    effects.update(1/60,{x:0,y:0,z:0},false,2);
    assert.equal(effects.mesh.instanceMatrix.version,matrixVersion+1);
    assert.equal(effects.mesh.instanceColor.version,colorVersion);
    effects.clear();
    effects.burst({x:1,y:2,z:3},"#00ff00");
    effects.update(1/60,{x:0,y:0,z:0},false,3);
    assert.equal(effects.mesh.instanceColor.version,colorVersion+1);
  }finally{Math.random=oldRandom;effects.dispose();}
});


test("particle compaction rebinds colors when surviving particles move to new instance slots",()=>{
  const scene=new Scene(),effects=new Effects(scene);
  const oldRandom=Math.random;Math.random=()=>.5;
  try{
    effects.burst({x:0,y:1,z:0},"#abcdef");
    effects.update(1/60,{x:0,y:0,z:0},false,1);
    const colorVersion=effects.mesh.instanceColor.version;
    effects.particles[0].age=.71;
    effects.update(1/60,{x:0,y:0,z:0},false,2);
    assert.equal(effects.mesh.count,9);
    assert.equal(effects.mesh.instanceColor.version,colorVersion+1);
  }finally{Math.random=oldRandom;effects.dispose();}
});

test("rain, clouds, transparent materials and NPCs remain represented in every preset",()=>{
  const graphics=fs.readFileSync(require("node:path").join(__dirname,"../src/render/graphics.ts"),"utf8");
  const renderer=fs.readFileSync(require("node:path").join(__dirname,"../src/render/renderer.ts"),"utf8");
  const effects=fs.readFileSync(require("node:path").join(__dirname,"../src/render/effects.ts"),"utf8");
  assert.match(graphics,/rainParticleCount:90/);
  assert.match(graphics,/cloudCount:16/);
  assert.match(renderer,/cloudBatch=new THREE\.InstancedMesh\(geo,cloudMat,28\)/);
  assert.match(renderer,/cloud\.count=profile\.cloudCount/);
  assert.match(effects,/this\.rain\.visible = wet>\.015/);
  assert.match(renderer,/terrainMaterial\(this\.atlas\.texture, true, this\.graphicsProfile\.quality\)/);
  assert.match(renderer,/terrainMaterial\(this\.atlas\.texture, false, this\.graphicsProfile\.quality\)/);
  assert.match(renderer,/setAttribute\("emissive", new THREE\.BufferAttribute\(data\.emissive, 1\)\)/);
  assert.match(renderer,/this\.renderAudit\?\.tag\(cloudBatch, "clouds"\)/);
});
