const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const oldLoad = Module._load;
Module._load = function(request, parent, isMain) {
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
const round = value => Math.round(value * 1e5) / 1e5;
function surfaceSummary(meshes) {
  const summary = new Map();
  let triangles = 0, vertices = 0;
  const byGroupTriangles = [0,0,0], byGroupVertices = [0,0,0];
  for (let group = 0; group < meshes.length; group++) {
    const mesh = meshes[group], indices = mesh.indices;
    vertices += mesh.positions.length / 3;
    if (mesh.emissive) {
      for (let vertex = 0; vertex < mesh.emissive.length; vertex++)
        byGroupVertices[group === 1 || (group === 2 && mesh.waterTriangles > 0) ? 1 : mesh.emissive[vertex] ? 2 : 0]++;
    } else byGroupVertices[group] += mesh.positions.length / 3;
    for (let i = 0; i < indices.length; i += 3) {
      const ids = [indices[i], indices[i+1], indices[i+2]];
      const p = ids.map(id => [mesh.positions[id*3], mesh.positions[id*3+1], mesh.positions[id*3+2]]);
      const a = p[1].map((v,k)=>v-p[0][k]), b = p[2].map((v,k)=>v-p[0][k]);
      const cross = [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
      const area = Math.hypot(...cross) / 2;
      if (area < 1e-8) continue;
      const normal = [mesh.normals[ids[0]*3],mesh.normals[ids[0]*3+1],mesh.normals[ids[0]*3+2]].map(round);
      const axis = normal.findIndex(v => Math.abs(v) > .5);
      const plane = round(p[0][axis]);
      let tileX, tileY;
      if (mesh.tiles) { tileX = mesh.tiles[ids[0]*2]; tileY = mesh.tiles[ids[0]*2+1]; }
      else {
        const u = mesh.uvs[ids[0]*2], v = mesh.uvs[ids[0]*2+1];
        tileX = Math.floor(u*16 + 1e-6);
        tileY = Math.floor((1-v)*16 + 1e-6);
      }
      const color = round(ids.reduce((sum,id)=>sum+mesh.colors[id*3],0)/3);
      const average = key => round(ids.reduce((sum,id)=>sum+mesh[key][id],0)/3);
      const sky = average('sky'), light = average('lights');
      const emissive = mesh.emissive ? mesh.emissive[ids[0]] : group === 2 && !mesh.waterTriangles ? 1 : 0;
      for (const id of ids) assert.equal(mesh.emissive ? mesh.emissive[id] : emissive, emissive, 'face emissive flag is uniform');
      const semanticGroup = group === 1 || (group === 2 && mesh.waterTriangles > 0) ? 1 : emissive ? 2 : 0;
      const key = [semanticGroup,...normal,plane,tileX,tileY,color,sky,light].join('|');
      summary.set(key,(summary.get(key)||0)+area);
      triangles++;
      byGroupTriangles[semanticGroup]++;
    }
  }
  return {summary,triangles,vertices,byGroupTriangles,byGroupVertices};
}
function assertSameSurface(a,b,label) {
  const keys = new Set([...a.summary.keys(),...b.summary.keys()]);
  for (const key of keys) {
    const left=a.summary.get(key)||0,right=b.summary.get(key)||0;
    assert.ok(Math.abs(left-right)<1e-4,`${label}: surface mismatch ${key}: ${left} vs ${right}`);
  }
}
let baselineTriangles=0,greedyTriangles=0,baselineVertices=0,greedyVertices=0;
const baselineGroupTriangles=[0,0,0],greedyGroupTriangles=[0,0,0];
for (const {chunk,sy} of cases) {
  const current = currentMesher(world,chunk,undefined,sy);
  const baseline = baselineMesher(world,chunk,undefined,sy);
  // Renderer commits each section in section-local coordinates and uses a
  // conservative [0,16]^3 bounding sphere instead of scanning all vertices.
  for (const mesh of current) for (let i=0;i<mesh.positions.length;i++) {
    assert.ok(mesh.positions[i]>=-1e-5 && mesh.positions[i]<=16+1e-5,
      `section-local vertex ${mesh.positions[i]} stays inside the conservative 16-cube bounds`);
  }
  const currentStats=surfaceSummary(current),baselineStats=surfaceSummary(baseline);
  assertSameSurface(currentStats,baselineStats,`surface ${chunk.cx},${sy},${chunk.cz}`);
  assert.equal(current[0].tiles.length, current[0].positions.length / 3 * 2);
  baselineTriangles+=baselineStats.triangles;greedyTriangles+=currentStats.triangles;
  baselineVertices+=baselineStats.vertices;greedyVertices+=currentStats.vertices;
  for(let group=0;group<3;group++){baselineGroupTriangles[group]+=baselineStats.byGroupTriangles[group];greedyGroupTriangles[group]+=currentStats.byGroupTriangles[group];}
}
assert.ok(greedyTriangles<=baselineTriangles,`greedy triangle count ${greedyTriangles} must not exceed baseline ${baselineTriangles}`);
assert.ok(greedyVertices<=baselineVertices,`greedy vertex count ${greedyVertices} must not exceed baseline ${baselineVertices}`);
console.log(`PASS exposed-surface parity: ${cases.length} sections across city, wilderness and chunk edges; atlas tile, face orientation, color, sky/block light and area are preserved.`);
console.log(`Geometry: ${baselineTriangles}→${greedyTriangles} triangles (${(100*(1-greedyTriangles/baselineTriangles)).toFixed(1)}% reduction); ${baselineVertices}→${greedyVertices} vertices (${(100*(1-greedyVertices/baselineVertices)).toFixed(1)}% reduction).`);
console.log(`Triangles by group (opaque / transparent / emissive): ${baselineGroupTriangles.join('/')} → ${greedyGroupTriangles.join('/')}.`);
const lighting = new Lighting(world);
assert.equal(lighting.worldSignature(), 5);
world.navRevision++;
assert.equal(lighting.worldSignature(), 6);
console.log('PASS lighting generation signature follows world revision');
const varyingLighting = {
  sample(x,y,z) { return [((Math.abs(x*3+y*5+z*7)%5)+1)/5, (Math.abs(x+y*3+z*2)%4)/4]; },
  sampleInto(x,y,z,out) { const value=this.sample(x,y,z);out[0]=value[0];out[1]=value[1];return out; },
};
for (const {chunk,sy} of cases) {
  const current=currentMesher(world,chunk,varyingLighting,sy);
  const baseline=baselineMesher(world,chunk,varyingLighting,sy);
  assertSameSurface(surfaceSummary(current),surfaceSummary(baseline),`lit surface ${chunk.cx},${sy},${chunk.cz}`);
}
console.log('PASS varying sky/block-light surface parity: faces with different light samples remain split and unchanged.');
for (let i=0;i<3;i++) for(const {chunk,sy} of cases) {baselineMesher(world,chunk,undefined,sy);currentMesher(world,chunk,undefined,sy)}
const elapsed = fn => { const t=performance.now();for(const {chunk,sy} of cases) fn(world,chunk,undefined,sy);return performance.now()-t; };
const base=[],improved=[];
for(let i=0;i<8;i++) {
  if(i%2===0){base.push(elapsed(baselineMesher));improved.push(elapsed(currentMesher));}
  else {improved.push(elapsed(currentMesher));base.push(elapsed(baselineMesher));}
}
const med=v=>[...v].sort((a,b)=>a-b)[Math.floor(v.length/2)];
console.log(`CPU mesh baseline median ${med(base).toFixed(2)} ms; greedy median ${med(improved).toFixed(2)} ms (${((1-med(improved)/med(base))*100).toFixed(1)}% CPU change).`);
console.log('Note: Node CPU timings are not GPU/browser FPS benchmarks.');

// The resumable mesher must yield at fine-grained voxel/face work boundaries
// and produce byte-identical mesh attributes to the synchronous compatibility API.
{
  const { meshChunkSteps } = require('../src/render/mesher.ts');
  const { chunk, sy } = cases.find(entry => entry.chunk.blocks.sections.has(entry.sy));
  const sync = currentMesher(world, chunk, undefined, sy);
  const iterator = meshChunkSteps(world, chunk, undefined, sy);
  let yields = 0, result = iterator.next();
  while (!result.done) { yields++; result = iterator.next(); }
  assert.ok(yields > 16, `fine-grained work slicing must yield more often than the former 16 layer boundaries (got ${yields})`);
  assert.equal(result.value.length, sync.length);
  for (let group=0; group<sync.length; group++) {
    for (const field of ['positions','normals','uvs','tiles','colors','indices','sky','lights']) {
      assert.deepEqual(Array.from(result.value[group][field]), Array.from(sync[group][field]), `${field} group ${group} parity`);
    }
    assert.equal(result.value[group].waterTriangles, sync[group].waterTriangles);
  }
  console.log(`PASS fine-grained resumable mesher: ${yields} bounded-work yields and exact synchronous mesh parity`);
}
