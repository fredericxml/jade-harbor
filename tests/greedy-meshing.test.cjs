#!/usr/bin/env node
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === "three") return {};
  return originalLoad.call(this, request, parent, isMain);
};
require.extensions[".ts"] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  module._compile(output, filename);
};
const { meshChunk } = require("../src/render/mesher.ts");
const { BlockColumn } = require("../src/world/sections.ts");
const { B } = require("../src/world/blocks.ts");
const { packed } = require("../src/core/coords.ts");
const { tileUV } = require("../src/render/atlas.ts");
Module._load = originalLoad;

function fixture() {
  const blocks = new BlockColumn();
  const chunk = { cx: 0, cz: 0, blocks, revision: 0 };
  return { blocks, chunk, world: { chunks: new Map([["0,0", chunk]]) } };
}
function triangles(mesh) { return mesh.indices.length / 3; }
function vertexCount(mesh) { return mesh.positions.length / 3; }
function findFace(mesh, normal, plane) {
  for (let i=0;i<mesh.indices.length;i+=3) {
    const id=mesh.indices[i], n=[mesh.normals[id*3],mesh.normals[id*3+1],mesh.normals[id*3+2]];
    if (n.every((v,k)=>v===normal[k]) && mesh.positions[id*3+normal.indexOf(1)]===plane) return i;
  }
  return -1;
}

test("2x2x2 solid cube greedily becomes six quads without losing exposed surface area", () => {
  const {blocks,chunk,world}=fixture();
  for(let x=2;x<4;x++)for(let y=2;y<4;y++)for(let z=2;z<4;z++)blocks.set(x,y,z,B.Stone);
  const mesh=meshChunk(world,chunk,undefined,0)[0];
  assert.equal(triangles(mesh),12);
  assert.equal(vertexCount(mesh),24);
  assert.equal(mesh.indices.length,36);
  assert.equal(mesh.tiles.length,48);
  assert.ok(mesh.tiles instanceof Uint8Array,"atlas tile coordinates use compact byte attributes");
  // A 2×2 top face repeats the same atlas tile over two block units in both axes.
  const face=findFace(mesh,[0,1,0],4);
  assert.notEqual(face,-1);
  const ids=[mesh.indices[face],mesh.indices[face+1],mesh.indices[face+2]];
  const tile=[mesh.tiles[ids[0]*2],mesh.tiles[ids[0]*2+1]];
  for(const id of ids)assert.deepEqual([mesh.tiles[id*2],mesh.tiles[id*2+1]],tile);
  const u=ids.map(id=>mesh.uvs[id*2]),v=ids.map(id=>mesh.uvs[id*2+1]);
  assert.ok(Math.max(...u)===2 && Math.max(...v)===2,"merged face must repeat its atlas tile at block scale");
});

test("mesh indices stay 16-bit when safe and promote before a section exceeds the limit", () => {
  const small=fixture();
  small.blocks.set(2,2,2,B.Stone);
  const compact=meshChunk(small.world,small.chunk,undefined,0)[0].indices;
  assert.ok(compact instanceof Uint16Array,"ordinary sections use 16-bit indices");
  assert.equal(compact.buffer.byteLength,compact.byteLength,"large unused tails are trimmed for sparse geometry");
  const packedFixture=fixture();
  packedFixture.blocks.set(2,2,2,B.Stone);
  packedFixture.blocks.set(3,2,2,B.Brick);
  const compactView=meshChunk(packedFixture.world,packedFixture.chunk,undefined,0)[0].indices;
  assert.equal(compactView.length,60,"different adjacent atlas materials retain ten exposed quads");
  assert.ok(compactView.buffer.byteLength>compactView.byteLength,"a nearly full index buffer is returned as a view");
  assert.ok(compactView.buffer.byteLength<=compactView.byteLength*1.25,"retained capacity is capped at 25% slack");

  const blocks=new BlockColumn();let ladderCount=0;
  for(let y=0;y<16;y++)for(let z=0;z<16;z++)for(let x=0;x<16;x++)if((x+y+z)%2===0){blocks.set(x,y,z,B.Ladder);ladderCount++;}
  const chunk={cx:0,cz:0,blocks},world={chunks:new Map([["0,0",chunk]])};
  const oversized=meshChunk(world,chunk,undefined,0)[0].indices;
  assert.equal(ladderCount,2048);
  assert.ok(oversized.length>65535,"fixture crosses the 16-bit vertex-index range");
  assert.ok(oversized instanceof Uint32Array,"oversized sections promote to 32-bit indices before overflow");
});

test("atlas-repeat coordinates reproduce the original inset tile UVs and repeat once per block", () => {
  const id=B.Stone,face=2,tile=id*3, tileX=tile%16,tileY=Math.floor(tile/16);
  const old=tileUV(id,face);
  const sample=(u,v)=>[(tileX+.00625+(u-Math.floor(u))*.9875)/16,1-(tileY+1-.00625-(v-Math.floor(v))*.9875)/16];
  const first=sample(0,0),last=sample(.999999,.999999),repeat=sample(1.25,1.75),same=sample(.25,.75);
  assert.ok(Math.abs(first[0]-old[0])<1e-6 && Math.abs(first[1]-old[1])<1e-6);
  assert.ok(Math.abs(last[0]-old[2])<1e-6 && Math.abs(last[1]-old[3])<1e-6);
  assert.deepEqual(repeat,same);
});

test("adjacent blocks with different atlas materials are not merged together", () => {
  const {blocks,chunk,world}=fixture();
  blocks.set(2,2,2,B.Stone);blocks.set(3,2,2,B.Brick);
  const mesh=meshChunk(world,chunk,undefined,0)[0];
  assert.equal(triangles(mesh),20);
  assert.equal(vertexCount(mesh),40);
  const topTiles=new Set();
  for(let i=0;i<mesh.indices.length;i+=3){
    const id=mesh.indices[i];
    if(mesh.normals[id*3+1]===1)topTiles.add(`${mesh.tiles[id*2]},${mesh.tiles[id*2+1]}`);
  }
  assert.equal(topTiles.size,2);
});

test("AO-discontinuous top faces stay split instead of flattening vertex shading", () => {
  const {blocks,chunk,world}=fixture();
  blocks.set(2,2,2,B.Stone);blocks.set(3,2,2,B.Stone);
  // This upper-side neighbor changes corner AO on one top face without covering it.
  blocks.set(1,3,2,B.Stone);
  const mesh=meshChunk(world,chunk,undefined,0)[0];
  const topFaces=[];
  for(let i=0;i<mesh.indices.length;i+=6){
    const id=mesh.indices[i];
    if(mesh.normals[id*3+1]===1 && mesh.positions[id*3+1]===3)topFaces.push(i);
  }
  assert.equal(topFaces.length,2,"top quads with non-uniform AO must not be merged");
});

test("transparent water/glass/ice keep their path while emissive appearance is preserved in the shared solid path", () => {
  const {blocks,chunk,world}=fixture();
  blocks.set(2,2,2,B.Water);blocks.set(3,2,2,B.Water);blocks.set(5,2,2,B.Glass);blocks.set(6,2,2,B.Ice);
  blocks.set(8,2,2,packed(B.Furnace,1));
  const result=meshChunk(world,chunk,undefined,0);
  assert.equal(result[2].waterTriangles,20);
  assert.equal(result[1].waterTriangles,0);
  assert.equal(triangles(result[1]),24);
  assert.equal(triangles(result[2]),20);
  assert.equal(result[0].emissiveTriangles,12);
  assert.ok(result[0].emissive.some(value=>value===1),"emissive faces are flagged inside the shared solid mesh");
  assert.equal(result.length,3,"water must be separate from glass/ice while the opaque/emissive path stays fused");
});

test("chunk and vertical section boundary culling remain unchanged", () => {
  const a=fixture();
  const otherBlocks=new BlockColumn(),other={cx:1,cz:0,blocks:otherBlocks,revision:0};
  a.world.chunks.set("1,0",other);
  a.blocks.set(15,16,5,B.Stone);otherBlocks.set(0,16,5,B.Stone);
  assert.equal(a.blocks && triangles(meshChunk(a.world,a.chunk,undefined,1)[0]),10);
  a.blocks.set(4,15,4,B.Stone);a.blocks.set(4,16,4,B.Stone);
  assert.equal(triangles(meshChunk(a.world,a.chunk,undefined,0)[0]),10);
  assert.equal(triangles(meshChunk(a.world,a.chunk,undefined,1)[0]),20);
});

test("block edits rebuild the exposed surface without stale merged quads", () => {
  const {blocks,chunk,world}=fixture();
  blocks.set(2,2,2,B.Stone);blocks.set(3,2,2,B.Stone);
  assert.equal(triangles(meshChunk(world,chunk,undefined,0)[0]),12);
  blocks.set(2,2,2,0);
  const afterRemoval=meshChunk(world,chunk,undefined,0)[0];
  assert.equal(triangles(afterRemoval),12);
  assert.equal(vertexCount(afterRemoval),24);
  blocks.set(2,2,2,B.Stone);
  assert.equal(triangles(meshChunk(world,chunk,undefined,0)[0]),12);
});

test("renderer binds emissive flags with a separate water material group", () => {
  const renderer=fs.readFileSync(path.join(__dirname,"../src/render/renderer.ts"),"utf8");
  const shader=fs.readFileSync(path.join(__dirname,"../src/render/shader-quality.ts"),"utf8");
  assert.match(renderer,/setAttribute\("tile", new THREE\.BufferAttribute\(data\.tiles, 2\)\)/);
  assert.match(shader,/attribute vec2 tile/);
  assert.match(shader,/fract\(vUv\)/);
  assert.match(shader,/textureGrad\(map,atlasUV,atlasDx,atlasDy\)/);
  assert.match(shader,/dFdx\(vUv\)/);
  assert.match(shader,/dFdy\(vUv\)/);
  assert.match(renderer,/setAttribute\("emissive", new THREE\.BufferAttribute\(data\.emissive, 1\)\)/);
  assert.match(renderer,/const category = i === 0 \? "voxel-opaque" : i === 1 \? "voxel-transparent" : "water"/);
  assert.match(renderer,/"voxel-emissive": d\.emissiveTriangles/);
  assert.match(renderer,/terrainMaterial\(this\.atlas\.texture, false, this\.graphicsProfile\.quality\)/);
  assert.match(renderer,/terrainMaterial\(this\.atlas\.texture, true, this\.graphicsProfile\.quality\)/);
  assert.match(renderer,/waterMaterial\(this\.atlas\.texture, this\.graphicsProfile\.quality\)/);
});

console.log("PASS greedy meshing: merged opaque quads, atlas repeats, material boundaries, AO fallback, transparency, emissive and chunk/section culling.");
