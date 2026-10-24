/* Source regression tests for Jade Harbor physics, placement, and voxel chunk edges.
 * Uses the project's local TypeScript devDependency.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (mod, file) => {
  const js = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  mod._compile(js.replace(/import\.meta\.url/g, '"file:///virtual-generation-worker.ts"'),file);
};
const {B, block, boxes} = require('../src/world/blocks.ts');
const {moveBody, collides, overlapsBlock}=require('../src/player/physics.ts');
const {BlockColumn}=require('../src/world/sections.ts');
const {World}=require('../src/world/world.ts');
const {packed}=require('../src/core/coords.ts');
// Mesh builder references the atlas module, but tests use tileUV only.
// Mock Three.js without downloading packages; no rendering is asserted here.
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function(request,parent,isMain) {
  if (request === 'three') return {};
  return originalLoad.call(this,request,parent,isMain);
};
const {meshChunk}=require('../src/render/mesher.ts');
Module._load = originalLoad;


let checks=0;
function test(name,fn){try{fn();checks++;console.log('PASS',name);}catch(e){console.error('FAIL',name);throw e;}}
function arena(extra=()=>0){return {loaded:()=>true,get(x,y,z){x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);return extra(x,y,z)|| (y<=0?B.Stone:B.Air);}};}
function body(x=.5,y=1.01,z=.5,vx=0){return {position:{x,y,z},velocity:{x:vx,y:0,z:0},grounded:true,flying:false,fallStart:y};}
function stoneWall(x,y,z){return x===1&&y>=1&&y<=4&&z===0?B.Stone:0;}
function singleSlab(x,y,z){return x===1&&y===1&&z===0?B.Slab:0;}

test('walking at high speed cannot step onto a full-height wall',()=>{
  const w=arena(stoneWall),b=body(.5,1.01,.5,40);
  moveBody(w,b,.18);
  assert(b.position.x<.75,`x=${b.position.x}`);
  assert(b.position.y<1.12,`y=${b.position.y}`);
  assert(!collides(w,b.position));
});
test('grounded player can step up onto a half-height slab',()=>{
  const w=arena(singleSlab),b=body(.5,1.01,.5,6);
  moveBody(w,b,.16);
  assert(b.position.x>.75,`x=${b.position.x}`);
  assert(b.position.y>=1.5 && b.position.y<1.53,`y=${b.position.y}`);
  assert(!collides(w,b.position));
});
test('two successive obstacles cannot force multiple .501 ascents within one tick',()=>{
  const w=arena((x,y,z)=> x===1&&y===1&&z===0?B.Slab : x===2&&y===2&&z===0?B.Slab:0);
  const b=body(.5,1.01,.5,35);
  moveBody(w,b,.18);
  assert(b.position.y<=1.53,`y=${b.position.y}`);
  assert(!collides(w,b.position));
});
test('headroom prevents auto stepping into low ceiling',()=>{
  const w=arena((x,y,z)=>singleSlab(x,y,z)||(y===3&&x>=0&&x<=2&&z===0?B.Stone:0));
  const b=body(.5,1.01,.5,10);
  moveBody(w,b,.15);
  assert(b.position.y<=1.03);
  assert(!collides(w,b.position));
});
test('spectator bypasses collisions without automatic stepping',()=>{
  const w=arena(stoneWall),b=body(.5,1.01,.5,15);
  moveBody(w,b,.12,true);
  assert(b.position.x>1.5);
  assert(b.position.y===1.01);
});
test('non-solid lantern and crops do not prevent placement in player AABB',()=>{
  assert.equal(overlapsBlock({x:.5,y:1.01,z:.5},0,1,0,B.Lantern),false);
  assert.equal(overlapsBlock({x:.5,y:1.01,z:.5},0,1,0,B.Rice),false);
  assert.equal(overlapsBlock({x:.5,y:1.01,z:.5},0,1,0,B.Stone),true);
});
test('bottom slab and far door edge use actual collision volumes',()=>{
  assert.equal(overlapsBlock({x:.5,y:1.51,z:.5},0,1,0,B.Slab),false);
  assert.equal(overlapsBlock({x:.5,y:1.4,z:.5},0,1,0,B.Slab),true);
  assert.equal(overlapsBlock({x:.5,y:1.01,z:.5},0,1,0,B.Door),false);
  assert.equal(overlapsBlock({x:.5,y:1.01,z:.12},0,1,0,B.Door),true);
});
test('combining a slab into a solid full block rejects a player overlapping new top half',()=>{
  const p={x:.5,y:1.51,z:.5};
  assert.equal(overlapsBlock(p,0,1,0,B.Slab),false);
  assert.equal(overlapsBlock(p,0,1,0,packed(B.Slab,1)),true);
});
test('negative world coordinates map to correct chunks',()=>{
  const w=new World('unit',{},false);
  const c={cx:-1,cz:-1,blocks:new BlockColumn(),revision:0};w.chunks.set('-1,-1',c);
  assert.equal(w.set(-1,21,-1,B.Red),true);
  assert.equal(w.get(-1,21,-1),B.Red);
  assert.equal(c.blocks.get(15,21,15),B.Red);
});
test('chunk edge edit marks correct neighbor section and retains value',()=>{
  const w=new World('unit',{},false);
  for(const cx of [0,1])w.chunks.set(`${cx},0`,{cx,cz:0,blocks:new BlockColumn(),revision:0});
  w.dirty.clear();w.set(15,16,0,B.Stone);
  assert(w.dirty.has('0,1,0'));
  assert(w.dirty.has('1,1,0'));
  w.dirty.clear();w.set(16,16,0,B.Stone);
  assert(w.dirty.has('0,1,0'));
  assert(w.dirty.has('1,1,0'));
});
test('vertical section edge edit invalidates both section levels',()=>{
  const w=new World('unit',{},false);
  w.chunks.set('0,0',{cx:0,cz:0,blocks:new BlockColumn(),revision:0});
  w.set(1,15,1,B.Stone);w.dirty.clear();w.set(1,16,1,B.Stone);
  assert(w.dirty.has('0,0,0'));
  assert(w.dirty.has('0,1,0'));
});
test('horizontal chunk-border faces are culled then restored after removing neighbor',()=>{
  const w=new World('mesh',{},false);
  const a={cx:0,cz:0,blocks:new BlockColumn(),revision:0};
  const b={cx:1,cz:0,blocks:new BlockColumn(),revision:0};
  w.chunks.set('0,0',a);w.chunks.set('1,0',b);
  a.blocks.set(15,16,5,B.Stone);b.blocks.set(0,16,5,B.Stone);
  assert.equal(meshChunk(w,a,undefined,1)[0].indices.length,30);
  assert.equal(meshChunk(w,b,undefined,1)[0].indices.length,30);
  w.set(16,16,5,B.Air);
  assert.equal(meshChunk(w,a,undefined,1)[0].indices.length,36);
  assert.equal(meshChunk(w,b,undefined,1)[0].indices.length,0);
});
test('vertical section-border faces are culled then restored after deletion',()=>{
  const w=new World('mesh',{},false);
  const a={cx:0,cz:0,blocks:new BlockColumn(),revision:0};w.chunks.set('0,0',a);
  a.blocks.set(4,15,4,B.Stone);a.blocks.set(4,16,4,B.Stone);
  assert.equal(meshChunk(w,a,undefined,0)[0].indices.length,30);
  assert.equal(meshChunk(w,a,undefined,1)[0].indices.length,30);
  w.set(4,16,4,B.Air);
  assert.equal(meshChunk(w,a,undefined,0)[0].indices.length,36);
  assert.equal(meshChunk(w,a,undefined,1)[0].indices.length,0);
});
console.log(`${checks} collision/chunk checks passed.`);
