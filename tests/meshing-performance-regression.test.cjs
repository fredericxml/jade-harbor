const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Module = require('node:module');
const ts = require('typescript');
const oldLoad = Module._load;
Module._load = function(request, parent, isMain) {
  // The CPU meshing test doesn't use the atlas canvas or GPU. Three.js is
  // intentionally mocked, so this test runs without a browser or WebGL.
  if (request === 'three') return {};
  if (parent?.filename?.endsWith('fixtures/mesher-baseline.ts') && request.startsWith('.')) {
    request = path.resolve(__dirname, '../src/render', request);
  }
  return oldLoad.call(this, request, parent, isMain);
};
Module._extensions['.ts'] = (mod, file) => mod._compile(
  ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText, file,
);
const { generateChunk } = require('../src/world/generator.ts');
const { meshChunk: currentMesher } = require('../src/render/mesher.ts');
const { meshChunk: baselineMesher } = require('./fixtures/mesher-baseline.ts');
const { Lighting } = require('../src/world/lighting.ts');
const seed = 'jade-harbor';
const world = { chunks: new Map(), navRevision: 5 };
for (const [cx, cz] of [[0,0],[1,0],[0,1],[25,25]]) {
  const blocks = generateChunk(cx,cz,seed);
  world.chunks.set(`${cx},${cz}`, {cx,cz,blocks,revision:0});
}
const cases = [...world.chunks.values()].flatMap(chunk => [...chunk.blocks.sections.keys()].map(sy=>({chunk,sy})));
const digest = (meshes) => {
  const h=crypto.createHash('sha256');
  for (const mesh of meshes) for (const k of ['positions','normals','uvs','colors','indices','sky','lights']) h.update(JSON.stringify(mesh[k]));
  return h.digest('hex');
};
for (const {chunk,sy} of cases) {
  assert.equal(digest(currentMesher(world,chunk,undefined,sy)),digest(baselineMesher(world,chunk,undefined,sy)),`mesh output changed at ${chunk.cx},${sy},${chunk.cz}`);
}
console.log(`PASS geometry parity: ${cases.length} sections including Chinatown, wilderness, horizontal neighbors`);
// This verifies the revision-based signature responds to all world mutations.
const lighting = new Lighting(world);
assert.equal(lighting.worldSignature(), 5);
world.navRevision++;
assert.equal(lighting.worldSignature(), 6);
console.log('PASS lighting generation signature follows world revision');
// After JIT warm-up, compare medians across repeated full-section runs.
for (let i=0;i<3;i++) for(const {chunk,sy} of cases) {baselineMesher(world,chunk,undefined,sy);currentMesher(world,chunk,undefined,sy)}
const elapsed = (fn) => {
  const t=performance.now();for(const {chunk,sy} of cases) fn(world,chunk,undefined,sy);
  return performance.now()-t;
};
const base=[],improved=[];
for(let i=0;i<8;i++) {
  if(i%2===0){base.push(elapsed(baselineMesher));improved.push(elapsed(currentMesher));}
  else {improved.push(elapsed(currentMesher));base.push(elapsed(baselineMesher));}
}
const med=(v)=>[...v].sort((a,b)=>a-b)[Math.floor(v.length/2)];
console.log(`CPU mesh baseline median ${med(base).toFixed(2)} ms; optimized median ${med(improved).toFixed(2)} ms (${((1-med(improved)/med(base))*100).toFixed(1)}% less CPU time).`);
console.log('Note: Node CPU timings are not GPU/browser FPS benchmarks.');
