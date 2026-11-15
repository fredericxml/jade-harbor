#!/usr/bin/env node
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
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
Module._load = originalLoad;
const read = file => fs.readFileSync(path.join(root, file), "utf8");

function fixture() {
  const blocks = new BlockColumn();
  const chunk = { cx: 0, cz: 0, blocks, revision: 0 };
  return { blocks, chunk, world: { chunks: new Map([["0,0", chunk]]) } };
}

test("C1: emissive solid faces share the opaque draw with exact per-face classification", () => {
  const { blocks, chunk, world } = fixture();
  blocks.set(2, 2, 2, B.Stone);
  blocks.set(4, 2, 2, packed(B.Furnace, 1));
  const meshes = meshChunk(world, chunk, undefined, 0);
  assert.equal(meshes.length, 3, "opaque/emissive, glass/ice and water each have distinct material slots");
  const solid = meshes[0];
  assert.equal(solid.emissiveTriangles, 12);
  assert.equal(solid.indices.length / 3, 24, "stone and furnace surfaces share one indexed mesh");
  assert.ok(solid.emissive.includes(0));
  assert.ok(solid.emissive.includes(1));
  assert.equal(meshes[1].emissiveTriangles, 0);
  const shader = read("src/render/shader-quality.ts");
  const renderer = read("src/render/renderer.ts");
  assert.match(shader, /attribute float emissive/);
  assert.match(shader, /vEmissive=emissive/);
  assert.match(shader, /mix\(ambient\+warm,vec3\(1\.,\.94,\.82\)\*hierarchy,step\(\.5,vEmissive\)\)/);
  assert.match(renderer, /setAttribute\("emissive", new THREE\.BufferAttribute\(data\.emissive, 1\)\)/);
  assert.match(renderer, /"voxel-emissive": d\.emissiveTriangles/);
});

test("C2: index buffers avoid 32-bit staging, trim slack and promote safely", () => {
  const small = fixture();
  small.blocks.set(2, 2, 2, B.Stone);
  const indices16 = meshChunk(small.world, small.chunk, undefined, 0)[0].indices;
  assert.ok(indices16 instanceof Uint16Array);
  assert.equal(indices16.buffer.byteLength, indices16.byteLength, "sparse output trims excess capacity");
  const packedFixture=fixture();
  packedFixture.blocks.set(2,2,2,B.Stone);
  packedFixture.blocks.set(3,2,2,B.Dirt);
  const compactView=meshChunk(packedFixture.world,packedFixture.chunk,undefined,0)[0].indices;
  assert.equal(compactView.length,60);
  assert.ok(compactView.buffer.byteLength>compactView.byteLength);
  assert.ok(compactView.buffer.byteLength<=compactView.byteLength*1.25);

  const blocks = new BlockColumn();
  for (let y = 0; y < 16; y++) for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++)
    if ((x + y + z) % 2 === 0) blocks.set(x, y, z, B.Ladder);
  const chunk = { cx: 0, cz: 0, blocks };
  const world = { chunks: new Map([["0,0", chunk]]) };
  const indices32 = meshChunk(world, chunk, undefined, 0)[0].indices;
  assert.ok(indices32.length > 65535);
  assert.ok(indices32 instanceof Uint32Array, "overflow promotion occurs before index truncation");
  assert.ok(indices32.buffer.byteLength<=indices32.byteLength*1.25,"oversized output also trims or bounds unused capacity");
  const renderer = read("src/render/renderer.ts");
  assert.match(renderer, /geometry\.boundingSphere = SECTION_BOUNDING_SPHERE/, "conservative section bounds remain available for frustum culling without scanning vertices");
});

test("C3: spatial section granularity remains aligned with atomic incremental commits", () => {
  const renderer = read("src/render/renderer.ts");
  assert.match(renderer, /sections = new Map<string, THREE\.Group>\(\)/);
  assert.match(renderer, /this\.sections\.set\(commit\.key, commit\.group\)/);
  assert.match(renderer, /if \(commit\.nextMaterial < commit\.data\.length\) return false/);
  assert.match(renderer, /this\.removeSection\(commit\.key, false\)/);
  assert.doesNotMatch(renderer, /BatchedMesh|mergeGeometries/,
    "cross-section batching is intentionally not introduced without draw-call versus culling/edit-rebuild evidence");
});

test("C4: transparent shared faces are culled without removing distinct glass/ice interfaces", () => {
  const water = fixture();
  water.blocks.set(2, 2, 2, B.Water);
  water.blocks.set(3, 2, 2, B.Water);
  const waterMesh = meshChunk(water.world, water.chunk, undefined, 0)[2];
  assert.equal(waterMesh.waterTriangles, 20, "the shared water face is removed");

  const interfaceFixture = fixture();
  interfaceFixture.blocks.set(2, 2, 2, B.Glass);
  interfaceFixture.blocks.set(3, 2, 2, B.Ice);
  const interfaceMesh = meshChunk(interfaceFixture.world, interfaceFixture.chunk, undefined, 0)[1];
  assert.equal(interfaceMesh.indices.length / 3, 24,
    "different transparent materials retain both sides of their visible interface");
  const material = read("src/render/material.ts");
  assert.match(material, /depthWrite: !transparent/);
  assert.match(material, /side: transparent \? THREE\.DoubleSide : THREE\.FrontSide/);
});

test("C5: distant shader reuses unit geometry normals and retains uniform quality selection", () => {
  const distant = read("src/render/distant-world.ts");
  const shaders = read("src/render/shader-quality.ts");
  assert.match(distant, /length=Math\.sqrt\(x\*x\+y\*y\+z\*z\)\|\|1;x\/=length;y\/=length;z\/=length/);
  assert.match(shaders, /dot\(vNormal,sunDirection\)/);
  assert.doesNotMatch(shaders, /normalize\(vNormal\)/);
  assert.match(shaders, /uniform float qualityLevel/);
});

console.log("PASS rendering efficiency contracts: emissive draw fusion, adaptive index buffers, section culling, transparent interfaces and shader normal reuse.");
