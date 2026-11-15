const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

function loadTypeScriptModule(file, fakes = {}) {
  const nativeTs = Module._extensions['.ts'];
  const nativeLoad = Module._load;
  try {
    Module._extensions['.ts'] = (mod, filename) => mod._compile(
      ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        fileName:filename, compilerOptions:{ module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022 },
      }).outputText, filename);
    Module._load = function (name, parent, isMain) {
      if (Object.hasOwn(fakes, name)) return fakes[name];
      return nativeLoad.call(this, name, parent, isMain);
    };
    delete require.cache[require.resolve(file)];
    return require(file);
  } finally {
    Module._load = nativeLoad;
    if (nativeTs) Module._extensions['.ts'] = nativeTs;
    else delete Module._extensions['.ts'];
  }
}

class Color { constructor(value){this.value=value;} }
class ShaderMaterial { constructor(options){ Object.assign(this, options); this.name=''; this.forceSinglePass=false; } }
const THREE={Color,ShaderMaterial,FrontSide:0,BackSide:1,DoubleSide:2};
const { terrainMaterial,waterMaterial } = loadTypeScriptModule('../src/render/material.ts',{three:THREE});
const shaders=loadTypeScriptModule('../src/render/shader-quality.ts');
const sorter=loadTypeScriptModule('../src/render/transparency-sort.ts');
const { meshChunk, meshChunkSteps } = loadTypeScriptModule('../src/render/mesher.ts');
const {BlockColumn}=loadTypeScriptModule('../src/world/sections.ts');
const {B}=loadTypeScriptModule('../src/world/blocks.ts');

function geometryFixture() {
  const blocks=new BlockColumn();const chunk={cx:0,cz:0,blocks,revision:0};
  const world={chunks:new Map([['0,0',chunk]])};
  return {blocks,chunk,world};
}
function item(id,anchor=null,z=0,order=0,group=0) {
  return {id,renderOrder:order,groupOrder:group,z,object:{userData:anchor?{transparentSortAnchor:anchor}:{}}};
}
const projection = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];

test('water is a single-pass, depth-tested, depth-nonwriting translucent surface', () => {
  const water=waterMaterial({},'high');
  const glass=terrainMaterial({},true,'high');
  const opaque=terrainMaterial({},false,'high');
  assert.equal(water.side,THREE.DoubleSide);
  assert.equal(water.forceSinglePass,true);
  assert.equal(water.transparent,true);
  assert.equal(water.depthWrite,false,'alpha blending must not hide farther glass or water through depth writes');
  assert.equal(water.uniforms.opacity.value,1);
  assert.equal(water.fragmentShader,shaders.WATER_FRAGMENT_SHADER);
  assert.equal(glass.side,THREE.DoubleSide,'glass/ice original material retained');
  assert.equal(glass.depthWrite,false);
  assert.equal(glass.uniforms.opacity.value,.72);
  assert.equal(glass.fragmentShader,shaders.TERRAIN_FRAGMENT_SHADER);
  assert.equal(opaque.side,THREE.FrontSide);
  assert.equal(opaque.depthWrite,true);
});

test('controlled underside shows only a top water backface, without duplicate side layers', () => {
  const fragment=shaders.WATER_FRAGMENT_SHADER;
  assert.match(fragment,/if\(!gl_FrontFacing && surface<\.5\)discard/);
  assert.match(fragment,/gl_FrontFacing\?mix\(\.28,\.56,surface\):\.38/);
  assert.ok(!fragment.includes('textureGrad('));
  assert.ok(fragment.includes('waterTint')&&fragment.includes('fogColor'));
  assert.ok(shaders.TERRAIN_VERTEX_SHADER.includes('vSurfaceUp=normal.y'));
});

test('water and glass visible-group anchors use section-local block bounds, not extra geometry scans', () => {
  const {blocks,chunk,world}=geometryFixture();
  blocks.set(2,2,2,B.Water);
  blocks.set(8,2,2,B.Glass);
  blocks.set(9,2,2,B.Ice);
  blocks.set(12,2,2,B.Stone);
  const data=meshChunk(world,chunk,undefined,0);
  assert.equal(data.length,3);
  assert.deepEqual(data[2].sortCenter,[2.5,2.5,2.5]);
  assert.deepEqual(data[1].sortCenter,[9,2.5,2.5]);
  assert.equal(data[0].sortCenter,undefined);
  assert.equal(data[2].waterTriangles,12);
  assert.equal(data[0].indices.length/3,12);
  const generator=meshChunkSteps(world,chunk,undefined,0);let slice=generator.next();
  while(!slice.done)slice=generator.next();
  for(let i=0;i<3;i++) {
    assert.deepEqual(slice.value[i].sortCenter,data[i].sortCenter);
    for(const field of ['positions','normals','uvs','tiles','colors','sky','lights','indices'])
      assert.deepEqual([...slice.value[i][field]],[...data[i][field]],`typed geometry ${field} for group ${i} unchanged`);
  }
});

test('alpha rendering sorts water behind a nearer window rather than forcing water to draw last', () => {
  const glass=item(1,[5,3,4]);const water=item(2,[5,3,11]);
  const ordered=[glass,water].sort((a,b)=>sorter.sortTransparentRenderItems(a,b,projection,1));
  assert.deepEqual(ordered.map(v=>v.id),[2,1]);
  assert.equal(water.object.userData.transparentSortCache.frame,1);
  assert.equal(glass.object.userData.transparentSortCache.frame,1);
  assert.equal(water.object.userData.transparentSortCache.depth,11);
});

test('water in front of a window reverses the correct order, including camera-direction change', () => {
  const glass=item(1,[0,3,11]);const water=item(2,[0,3,4]);
  assert.deepEqual([glass,water].sort((a,b)=>sorter.sortTransparentRenderItems(a,b,projection,2)).map(v=>v.id),[1,2]);
  const reverseProjection=[1,0,0,0,0,1,0,0,0,0,-1,0,0,0,0,1];
  assert.deepEqual([glass,water].sort((a,b)=>sorter.sortTransparentRenderItems(a,b,reverseProjection,3)).map(v=>v.id),[2,1]);
  assert.equal(water.object.userData.transparentSortCache.frame,3,'cache invalidates on camera frame change');
});

test('transparent sorting preserves Three.js groupOrder, renderOrder and nonvoxel depth ordering', () => {
  const opaqueSceneOverlay=item(1,null,0,1);
  const water=item(2,[0,0,200],0,0);
  assert.deepEqual([opaqueSceneOverlay,water].sort((a,b)=>sorter.sortTransparentRenderItems(a,b,projection,1)).map(v=>v.id),[2,1]);
  const fromOtherGroup=item(3,null,0,-5,1);
  assert.deepEqual([fromOtherGroup,water].sort((a,b)=>sorter.sortTransparentRenderItems(a,b,projection,1)).map(v=>v.id),[2,3]);
  const others=[item(2,null,.3),item(1,null,.3),item(4,null,.8)];
  assert.deepEqual(others.sort((a,b)=>sorter.sortTransparentRenderItems(a,b,projection,1)).map(v=>v.id),[4,1,2]);
});

test('sort anchor is projected to clip-space depth without NaN when clip W approaches zero', () => {
  const zeroW=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0];
  const obj=item(1,[2,2,2],.25),fallback=item(2,null,.5);
  const result=sorter.sortTransparentRenderItems(obj,fallback,zeroW,9);
  assert.ok(Number.isFinite(result));
  assert.equal(obj.object.userData.transparentSortCache.depth,.25);
});

test('renderer uses camera-projective ordering without vertex rescans or forced water-after-glass order', () => {
  const renderer=read('src/render/renderer.ts');
  assert.match(renderer,/setTransparentSort\(\(a,b\)=>sortTransparentRenderItems/);
  assert.match(renderer,/transparentSortProjection\.multiplyMatrices\(this\.camera\.projectionMatrix,this\.camera\.matrixWorldInverse\)/);
  assert.match(renderer,/transparentSortFrame\+\+/);
  assert.match(renderer,/commit\.cx\*16\+d\.sortCenter\[0\]/);
  assert.match(renderer,/commit\.sy\*16\+d\.sortCenter\[1\]/);
  assert.match(renderer,/commit\.cz\*16\+d\.sortCenter\[2\]/);
  assert.doesNotMatch(renderer,/mesh\.renderOrder\s*=\s*1/);
  assert.doesNotMatch(renderer,/computeBoundingSphere\s*\(/);
  assert.match(renderer,/if \(commit\.nextMaterial < commit\.data\.length\) return false/);
  assert.match(renderer,/this\.removeSection\(commit\.key, false\)/);
});

test('transparent-surface ordering remains part of the consolidated renderer suite', () => {
  const pkg=JSON.parse(read('package.json'));
  assert.ok(pkg.scripts['test:rendering'].includes('tests/transparent-surface-ordering.test.cjs'));
  assert.ok(pkg.scripts['test:performance'].includes('npm run test:rendering'));
  assert.ok(pkg.scripts['test:regression'].includes('npm run test:rendering'));
});
