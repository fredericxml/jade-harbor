const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const nativeLoad = Module._load;
const nativeTs = Module._extensions['.ts'];
class Color { constructor(value) { this.value = value; } }
class ShaderMaterial { constructor(options) { Object.assign(this, options); this.name = ''; } }
const fakeTHREE = { ShaderMaterial, Color, FrontSide: 0, BackSide: 1, DoubleSide: 2 };
Module._load = function(name, parent, isMain) {
  if (name === 'three') return fakeTHREE;
  return nativeLoad.call(this, name, parent, isMain);
};
Module._extensions['.ts'] = (module, file) => module._compile(
  ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, file,
);
const { waterMaterial, terrainMaterial } = require('../src/render/material.ts');
const { meshChunk, meshChunkSteps } = require('../src/render/mesher.ts');
const { BlockColumn } = require('../src/world/sections.ts');
const { B } = require('../src/world/blocks.ts');
const { WATER_FRAGMENT_SHADER, TERRAIN_VERTEX_SHADER, TERRAIN_FRAGMENT_SHADER } = require('../src/render/shader-quality.ts');
Module._load = nativeLoad;
if (nativeTs) Module._extensions['.ts'] = nativeTs;
else delete Module._extensions['.ts'];

function fixture() {
  const blocks = new BlockColumn();
  const chunk = {cx:0,cz:0,blocks,revision:0};
  return {blocks,chunk,world:{chunks:new Map([['0,0',chunk]])}};
}

test('water is its own mesh output; glass, ice, solid and emissive are unchanged', () => {
  const {blocks,chunk,world} = fixture();
  blocks.set(2,2,2,B.Water);blocks.set(3,2,2,B.Water);
  blocks.set(5,2,2,B.Glass);blocks.set(6,2,2,B.Ice);
  blocks.set(9,2,2,B.Stone);
  const out=meshChunk(world,chunk,undefined,0);
  assert.equal(out.length,3);
  assert.equal(out[0].waterTriangles,0);
  assert.equal(out[1].waterTriangles,0);
  assert.equal(out[2].waterTriangles,20,'two adjacent water cubes expose ten faces');
  assert.equal(out[2].indices.length/3,20);
  assert.equal(out[1].indices.length/3,24,'glass and ice interfaces remain visible');
  assert.equal(out[0].indices.length/3,12,'solid block geometry unchanged');
  const generator=meshChunkSteps(world,chunk,undefined,0);let step=generator.next();
  while(!step.done)step=generator.next();
  assert.equal(step.value.length,3);
  for(let i=0;i<3;i++)for(const field of ['positions','normals','uvs','tiles','colors','sky','lights','indices'])
    assert.deepEqual([...step.value[i][field]],[...out[i][field]],`${field} group ${i} parity`);
});

test('water shader removes noisy atlas sampling, keeps fog/daylight and varies transparency by surface orientation', () => {
  assert.ok(TERRAIN_VERTEX_SHADER.includes('vSurfaceUp=normal.y'));
  assert.ok(WATER_FRAGMENT_SHADER.includes('varying float vSurfaceUp'));
  assert.ok(!WATER_FRAGMENT_SHADER.includes('textureGrad('),'water no longer repeats the noisy atlas texture');
  assert.ok(WATER_FRAGMENT_SHADER.includes('waterTint'));
  assert.ok(WATER_FRAGMENT_SHADER.includes('daylight'));
  assert.ok(WATER_FRAGMENT_SHADER.includes('fogColor'));
  assert.ok(WATER_FRAGMENT_SHADER.includes('mix(.28,.56,surface)'));
  assert.ok(TERRAIN_FRAGMENT_SHADER.includes('textureGrad('),'solid/glass/ice keep their existing atlas shader');
});

test('water material uses a single-pass controlled underside, no translucent depth writes; glass/ice unchanged', () => {
  const texture={};
  const water=waterMaterial(texture,'high');
  const glass=terrainMaterial(texture,true,'high');
  const solid=terrainMaterial(texture,false,'high');
  assert.equal(water.name,'JadeHarborWater');
  assert.equal(water.side,fakeTHREE.DoubleSide);
  assert.equal(water.forceSinglePass,true);
  assert.equal(water.transparent,true);
  assert.equal(water.depthWrite,false);
  assert.equal(water.uniforms.opacity.value,1);
  assert.equal(water.fragmentShader,WATER_FRAGMENT_SHADER);
  assert.equal(water.vertexShader,TERRAIN_VERTEX_SHADER);
  assert.equal(glass.side,fakeTHREE.DoubleSide);
  assert.equal(glass.depthWrite,false);
  assert.equal(glass.uniforms.opacity.value,.72);
  assert.equal(glass.fragmentShader,TERRAIN_FRAGMENT_SHADER);
  assert.equal(solid.side,fakeTHREE.FrontSide);
  assert.equal(solid.transparent,false);
});

test('renderer assigns material index 2 only to water, retains atomic commits and the water audit category', () => {
  const renderer=read('src/render/renderer.ts');
  const mesher=read('src/render/mesher.ts');
  assert.match(mesher,/id === B\.Water \? out\[2\] : transparent \? out\[1\] : out\[0\]/);
  assert.match(renderer,/waterMaterial\(this\.atlas\.texture, this\.graphicsProfile\.quality\)/);
  assert.match(renderer,/i === 1 \? "voxel-transparent" : "water"/);
  assert.match(renderer,/sortTransparentRenderItems/);
  assert.doesNotMatch(renderer,/if \(i === 2\) mesh\.renderOrder = 1/);
  assert.match(renderer,/if \(commit\.nextMaterial < commit\.data\.length\) return false/);
  assert.match(renderer,/this\.removeSection\(commit\.key, false\)/);
});
