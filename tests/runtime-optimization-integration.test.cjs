const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');

class Vector3 {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  copy(p){return this.set(p.x,p.y,p.z);}
  addScaledVector(v,k){this.x+=v.x*k;this.y+=v.y*k;this.z+=v.z*k;return this;}
}
class Color { constructor(value){this.value=value;} set(value){this.value=value;return this;} }
const originalLoad=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='three')return {Vector3,Color};
  return originalLoad.call(this,request,parent,isMain);
};
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText.replace(/import\.meta\.url/g,'"file:///generation.worker.ts"'),file);

const {selectTopK}=require('../src/game/city-life/active-actors.ts');
const {standAt}=require('../src/game/navigation/pathfinder.ts');
const {boxes,B}=require('../src/world/blocks.ts');
const {World}=require('../src/world/world.ts');
const {BlockColumn}=require('../src/world/sections.ts');
const {Lighting}=require('../src/world/lighting.ts');
const {pressureTriggered}=require('../src/game/occupancy.ts');
const {Entities}=require('../src/game/entities.ts');
const {Effects}=require('../src/render/effects.ts');

function seeded(seed=0x51a9e){let state=seed>>>0;return()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);}

test('bounded top-K exactly matches full sort with ties and edge limits',()=>{
  const random=seeded();
  for(let run=0;run<200;run++){
    const items=Array.from({length:Math.floor(random()*500)},(_,i)=>({id:`a${String(i).padStart(4,'0')}`,score:Math.floor(random()*50)/5}));
    const compare=(a,b)=>a.score-b.score||(a.id<b.id?-1:a.id>b.id?1:0);
    for(const k of [0,1,2,7,32,96,items.length,items.length+10])
      assert.deepEqual(selectTopK(items,k,compare),[...items].sort(compare).slice(0,Math.max(0,k)));
  }
});

test('standAt cache preserves returned values, avoids repeat reads, and invalidates by world revision',()=>{
  let reads=0,revision=1,floor=B.Stone,loaded=true;
  const world={get(_x,y){reads++;return y===0?floor:B.Air;},loaded:()=>loaded,get navRevision(){return revision;}};
  const a=standAt(world,.5,.5,1),firstReads=reads;
  assert.deepEqual(a,{x:.5,y:1.002,z:.5});
  const b=standAt(world,.5,.5,1);
  assert.deepEqual(b,a);assert.notStrictEqual(a,b);assert.equal(reads,firstReads);
  floor=B.Air;revision++;
  assert.equal(standAt(world,.5,.5,1),null);
  loaded=false;revision++;
  assert.equal(standAt(world,.5,.5,1),null);
});

test('collision geometry cache shares exact packed-state shapes',()=>{
  for(const value of [B.Stone,B.Lantern,B.Bamboo,B.Stairs,B.Fence])assert.strictEqual(boxes(value),boxes(value));
  assert.notStrictEqual(boxes(B.Stairs),boxes(B.Stairs|(1<<8)));
});

test('typed section lighting preserves cross-chunk values, removal, sampling and eviction cleanup',()=>{
  const world=new World('lighting-regression',{},false,4);
  try{
    world.chunks.set('0,0',{cx:0,cz:0,blocks:new BlockColumn(),revision:0});
    world.chunks.set('1,0',{cx:1,cz:0,blocks:new BlockColumn(),revision:0});
    world.set(15,3,3,B.Lantern);
    const light=new Lighting(world);light.rebuild();
    assert.equal(light.blockLight.get('15,3,3'),14);
    assert.equal(light.blockLight.get('16,3,3'),13);
    assert.equal(light.blockLight.get('17,3,3'),12);
    assert.equal(light.blockLight.size>0,true);
    const out=[0,0];assert.strictEqual(light.sampleInto(16,3,3,out),out);
    assert.deepEqual(out,light.sample(16,3,3));
    assert.equal(light.blockLightSections.get('1,0,0')[16*(3+16*3)],13);
    light.pruneUnloaded(['0,0']);
    assert.equal(light.blockLight.get('15,3,3'),undefined);
    assert.equal(light.blockLight.get('16,3,3'),13);
    world.set(15,3,3,B.Air);light.rebuild();
    assert.equal(light.blockLight.size,0);
    assert.equal(light.blockLightSections.size,0);
    light.dispose();assert.deepEqual(light.sample(16,3,3),[1,0]);
  } finally {world.dispose();}
});

test('lighting cancels stale staged work after a navigation revision changes',()=>{
  const world=new World('lighting-revision',{},false,4);
  try{
    world.chunks.set('0,0',{cx:0,cz:0,blocks:new BlockColumn(),revision:0});
    world.set(2,30,2,B.Lantern);
    const light=new Lighting(world);light.update(0);assert.equal(light.pending,true);
    world.set(2,30,2,B.Air);
    let steps=0;while(light.pending&&steps++<10000)light.update(0);
    assert.ok(steps<10000);assert.equal(light.signature,world.navRevision);assert.equal(light.blockLight.size,0);
    light.dispose();
  } finally {world.dispose();}
});

test('pressure trigger scan preserves exact strict boundaries without concatenating occupant arrays',()=>{
  const random=seeded(5199),loaded=(x,z)=>x>=-20&&x<=20&&z>=-20&&z<=20;
  const old=(x,y,z,player,occupants)=>[...(player?[player]:[]),...occupants].some(p=>loaded(p.x,p.z)&&Math.abs(p.x-x-.5)<.8&&Math.abs(p.z-z-.5)<.8&&p.y>=y-.1&&p.y<=y+1.8);
  for(let i=0;i<1000;i++){
    const x=Math.floor(random()*8)-4,y=Math.floor(random()*8),z=Math.floor(random()*8)-4;
    const occupants=Array.from({length:80},()=>({x:random()*50-25,y:random()*10,z:random()*50-25}));
    const player=i%3===0?undefined:{x:random()*50-25,y:random()*10,z:random()*50-25};
    assert.equal(pressureTriggered(x,y,z,player,occupants,loaded),old(x,y,z,player,occupants));
  }
});

test('Entities reuses local spatial grid, threat buffer, simulated-id set and drop array',()=>{
  const world={terrainLayout:4,seed:'entity-regression',navRevision:0,loaded:()=>true,get:()=>0};
  const entities=new Entities(world,{entities:[],drops:[]},.2);
  const grid=entities.localGrid,threats=entities.threatBuffer,ids=entities.simulatedIds,drops=entities.drops;
  const inv={held:undefined,addStack:()=>0};
  entities.tick(.02,{x:0,y:20,z:0},inv,.2,false,()=>{},()=>{});
  entities.tick(.02,{x:0,y:20,z:0},inv,.2,false,()=>{},()=>{});
  assert.strictEqual(entities.localGrid,grid);assert.strictEqual(entities.threatBuffer,threats);
  assert.strictEqual(entities.simulatedIds,ids);assert.strictEqual(entities.drops,drops);
  entities.dispose();
});

function fakeEffects(){
  const e=Object.create(Effects.prototype);e.particles=[];e.spareParticles=[];
  const attribute=(size)=>({array:new Float32Array(128*size),needsUpdate:false,clearUpdateRanges(){},addUpdateRange(){}});
  e.mesh={count:0,instanceMatrix:attribute(16),instanceColor:attribute(3),setMatrixAt(){},setColorAt(){}};
  e.rain={visible:false,material:{opacity:0},geometry:{attributes:{position:{needsUpdate:false}}}};
  e.rainCount=0;e.rainData=new Float32Array(900);e.disposed=false;
  return e;
}
test('particle pool reuses CPU objects and remains capped at 128 without changing burst size',()=>{
  const e=fakeEffects();e.burst({x:0,y:5,z:0},'#abc');assert.equal(e.particles.length,10);
  const old=new Set(e.particles);for(const p of e.particles)p.age=.71;
  e.update(.016,{x:0,y:5,z:0},false,0);assert.equal(e.particles.length,0);assert.equal(e.spareParticles.length,10);
  e.burst({x:10,y:8,z:-5},'#def');assert.equal(e.particles.length,10);
  assert(e.particles.every(p=>old.has(p)&&p.age===0&&p.color.value==='#def'));
  e.clear();assert.equal(e.particles.length,0);assert.equal(e.spareParticles.length,10);assert.equal(e.mesh.count,0);
  for(let i=0;i<20;i++)e.burst({x:i,y:0,z:0},'#123');assert.equal(e.particles.length,128);
});


test('typed lighting output matches the legacy source Map reference across generated chunks and source removal',()=>{
  const {generateChunk}=require('../src/world/generator.ts');
  const {Lighting:ReferenceLighting}=require('./fixtures/lighting-reference.ts');
  const world=new World('light-map-parity',{},false,4);
  try{
    for(const [cx,cz] of [[-1,0],[0,0],[1,0],[0,1]])
      world.chunks.set(`${cx},${cz}`,{cx,cz,blocks:generateChunk(cx,cz,world.seed),revision:0});
    world.set(15,34,3,B.Lantern);world.set(16,34,3,B.Lantern);
    world.set(2,40,2,B.Furnace);world.set(3,40,2,B.Stone);
    const reference=new ReferenceLighting(world),optimized=new Lighting(world);
    reference.rebuild();optimized.rebuild();
    assert.deepEqual([...optimized.blockLight].sort(),[...reference.blockLight].sort());
    assert.deepEqual([...optimized.sky].map(([k,v])=>[k,Array.from(v)]).sort(),
      [...reference.sky].map(([k,v])=>[k,Array.from(v)]).sort());
    for(let y=-64;y<=319;y+=23)for(let z=-8;z<=24;z+=6)for(let x=-8;x<=24;x+=6)
      assert.deepEqual(optimized.sample(x,y,z),reference.sample(x,y,z),`light ${x},${y},${z}`);
    world.set(16,34,3,B.Air);reference.rebuild();optimized.rebuild();
    assert.deepEqual([...optimized.blockLight].sort(),[...reference.blockLight].sort());
    for(let y=-64;y<=319;y+=31)for(let z=-8;z<=24;z+=7)for(let x=-8;x<=24;x+=7)
      assert.deepEqual(optimized.sample(x,y,z),reference.sample(x,y,z),`post-edit light ${x},${y},${z}`);
    optimized.dispose();
  }finally{world.dispose();}
});


function surfaceCells(mesh, emissiveFallback = 0) {
  const result = new Map();
  const indices = mesh.indices;
  const f = value => Math.round(Math.fround(value) * 1e6) / 1e6;
  for (let i = 0; i + 5 < indices.length; i += 6) {
    const ids = [...new Set([indices[i], indices[i+1], indices[i+2], indices[i+3], indices[i+4], indices[i+5]])];
    assert.equal(ids.length, 4, "each emitted quad must retain four unique vertices");
    const first = ids[0], normal = [mesh.normals[first*3], mesh.normals[first*3+1], mesh.normals[first*3+2]];
    const axis = normal.findIndex(value => Math.abs(value) > .5);
    assert.notEqual(axis, -1, "voxel face normal must be axis aligned");
    const tangents = [0,1,2].filter(value => value !== axis);
    const coordinates = ids.map(id => [mesh.positions[id*3],mesh.positions[id*3+1],mesh.positions[id*3+2]]);
    const plane = f(coordinates[0][axis]);
    const minU = f(Math.min(...coordinates.map(p=>p[tangents[0]])));
    const maxU = f(Math.max(...coordinates.map(p=>p[tangents[0]])));
    const minV = f(Math.min(...coordinates.map(p=>p[tangents[1]])));
    const maxV = f(Math.max(...coordinates.map(p=>p[tangents[1]])));
    const width = maxU-minU,height=maxV-minV;
    const values = attribute => ids.map(id=>f(mesh[attribute][id*(attribute==="colors"?3:1)])).sort((a,b)=>a-b);
    const emissive = ids.map(id => mesh.emissive ? mesh.emissive[id] : emissiveFallback).sort((a,b)=>a-b);
    assert.ok(emissive.every(value=>value===emissive[0]),"a face cannot mix emissive and non-emissive vertices");
    const payload = JSON.stringify({color:values("colors"),sky:values("sky"),light:values("lights"),emissive});
    const prefix = `${normal.join(",")}|${plane}|`;
    const integerGrid = width >= 1 && height >= 1 &&
      Math.abs(width-Math.round(width))<1e-5 && Math.abs(height-Math.round(height))<1e-5;
    if (integerGrid) {
      for (let v=0;v<Math.round(height);v++) for (let u=0;u<Math.round(width);u++) {
        const key=prefix+`${f(minU+u)}|${f(minV+v)}`;
        const existing=result.get(key);
        if(existing)existing.push(payload);else result.set(key,[payload]);
      }
    } else {
      const key=prefix+`${minU}:${maxU}|${minV}:${maxV}`;
      const existing=result.get(key);
      if(existing)existing.push(payload);else result.set(key,[payload]);
    }
  }
  for (const values of result.values()) values.sort();
  return [...result.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
}

test('greedy mesher preserves the complete legacy source exposed surface and lighting data on 26 generated sections',()=>{
  const {generateChunk}=require('../src/world/generator.ts');
  const {meshChunk:referenceMesh}=require('./fixtures/mesher-reference.ts');
  const {meshChunk:optimizedMesh}=require('../src/render/mesher.ts');
  const chunks=new Map();
  for(const [cx,cz] of [[0,0],[1,0],[0,1],[25,25]]){
    const blocks=generateChunk(cx,cz,'jade-harbor');chunks.set(`${cx},${cz}`,{cx,cz,blocks,revision:0});
  }
  const world={chunks};let sections=0;
  for(const chunk of chunks.values())for(const sy of chunk.blocks.sections.keys()){
    const before=referenceMesh(world,chunk,undefined,sy),after=optimizedMesh(world,chunk,undefined,sy);
    assert.equal(before.length,3,"frozen legacy mesher retains its original opaque/transparent/emissive groups");
    assert.equal(after.length,3,"optimized mesher fuses opaque/emissive solids and separates dedicated water from glass/ice");
    const solidReference=[...surfaceCells(before[0],0),...surfaceCells(before[2],1)].sort((a,b)=>a[0].localeCompare(b[0]));
    assert.deepEqual(surfaceCells(after[0]),solidReference,`opaque/emissive surface-lighting mismatch at ${chunk.cx},${sy},${chunk.cz}`);
    const transparentAfter=[...surfaceCells(after[1]),...surfaceCells(after[2])].sort((a,b)=>a[0].localeCompare(b[0]));
    assert.deepEqual(transparentAfter,surfaceCells(before[1],0),`transparent surface-lighting mismatch at ${chunk.cx},${sy},${chunk.cz}`);
    for(let i=0;i<after.length;i++){
      assert.ok(after[i].positions instanceof Float32Array);
      assert.ok(after[i].indices instanceof Uint16Array||after[i].indices instanceof Uint32Array);
      assert.ok(after[i].tiles instanceof Uint8Array);
    }
    sections++;
  }
  assert.equal(sections,26);
});
