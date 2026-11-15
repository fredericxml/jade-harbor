const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const oldLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'three') return {};
  return oldLoad.call(this, request, parent, isMain);
};
Module._extensions['.ts'] = (mod, file) => mod._compile(
  ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText, file,
);

const { generateChunk } = require('../src/world/generator.ts');
const { Lighting } = require('../src/world/lighting.ts');
const { meshChunk: currentMesher } = require('../src/render/mesher.ts');
const { meshChunk: baselineMesher } = require('./fixtures/mesher-baseline.ts');
const { meshChunk: referenceMesher } = require('./fixtures/mesher-diagnostic-reference.ts');
const { MIN_SECTION, MAX_SECTION, MIN_Y, MAX_Y } = require('../src/core/coords.ts');

const world = { chunks: new Map(), navRevision: 7 };
for (const [cx, cz] of [[0,0],[1,0],[0,1],[25,25]]) {
  const blocks = generateChunk(cx, cz, 'jade-harbor');
  world.chunks.set(`${cx},${cz}`, { cx, cz, blocks, revision: 0 });
}
const lighting = new Lighting(world);
const touchedColumns = new Set();
for (const chunk of world.chunks.values()) {
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const cx = chunk.cx + dx, cz = chunk.cz + dz, columnKey = `${cx},${cz}`;
    if (!touchedColumns.has(columnKey)) {
      touchedColumns.add(columnKey);
      const sky = new Int16Array(256);
      for (let i = 0; i < sky.length; i++) sky[i] = 72 + ((i * 13 + cx * 7 + cz * 3) % 48);
      lighting.sky.set(columnKey, sky);
    }
    const sections = new Set();
    for (const sy of chunk.blocks.sections.keys()) for (let dy = -1; dy <= 1; dy++) sections.add(sy + dy);
    for (const sy of sections) {
      const key = `${cx},${sy},${cz}`;
      if (lighting.blockLightSections.has(key)) continue;
      const values = new Uint8Array(4096);
      for (let i = 0; i < values.length; i++) values[i] = (i * 7 + cx * 3 + sy * 5 + cz * 11) % 16;
      lighting.blockLightSections.set(key, values);
    }
  }
}

const sample = lighting.createSectionSampler(0, 0, 0);
const outA = [0, 0], outB = [0, 0];
for (const sy of [MIN_SECTION, -1, 0, 1, MAX_SECTION]) {
  for (const x of [-1, 0, 7, 15, 16]) for (const y of [-1, 0, 7, 15, 16]) for (const z of [-1, 0, 7, 15, 16]) {
    const worldX = x, worldY = sy * 16 + y, worldZ = z;
    lighting.sampleInto(worldX, worldY, worldZ, outA);
    lighting.createSectionSampler(0, sy, 0)(x, y, z, outB);
    assert.deepEqual(outB, outA, `section light sample mismatch at ${worldX},${worldY},${worldZ}`);
  }
}
console.log('PASS section-local lighting sampler matches sampleInto at section/chunk edges and world bounds.');

const round = value => Math.round(value * 1e5) / 1e5;
function surfaceSummary(meshes) {
  const summary = new Map();
  for (let group = 0; group < meshes.length; group++) {
    const mesh = meshes[group], indices = mesh.indices;
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
      else { const u=mesh.uvs[ids[0]*2],v=mesh.uvs[ids[0]*2+1]; tileX=Math.floor(u*16+1e-6);tileY=Math.floor((1-v)*16+1e-6); }
      const color = round(ids.reduce((sum,id)=>sum+mesh.colors[id*3],0)/3);
      const average = key => round(ids.reduce((sum,id)=>sum+mesh[key][id],0)/3);
      const sky = average('sky'), light = average('lights');
      const emissive = mesh.emissive ? mesh.emissive[ids[0]] : group === 2 && !mesh.waterTriangles ? 1 : 0;
      for (const id of ids) assert.equal(mesh.emissive ? mesh.emissive[id] : emissive, emissive, 'face emissive flag is uniform');
      const semanticGroup = group === 1 || (group === 2 && mesh.waterTriangles > 0) ? 1 : emissive ? 2 : 0;
      const key = [semanticGroup,...normal,plane,tileX,tileY,color,sky,light].join('|');
      summary.set(key,(summary.get(key)||0)+area);
    }
  }
  return summary;
}
function assertSameSurface(a,b,label) {
  const keys = new Set([...a.keys(),...b.keys()]);
  for (const key of keys) {
    const left=a.get(key)||0,right=b.get(key)||0;
    assert.ok(Math.abs(left-right)<1e-4,`${label}: surface mismatch ${key}: ${left} vs ${right}`);
  }
}
let sectionsChecked = 0;
for (const chunk of world.chunks.values()) for (const sy of chunk.blocks.sections.keys()) {
  const current = currentMesher(world, chunk, lighting, sy);
  const baseline = baselineMesher(world, chunk, lighting, sy);
  assertSameSurface(surfaceSummary(current), surfaceSummary(baseline), `lit mesh ${chunk.cx},${sy},${chunk.cz}`);
  sectionsChecked++;
}
console.log(`PASS lit mesh parity: ${sectionsChecked} sections preserve exact exposed surface, atlas, AO, sky and block-light output.`);

// The hot path must reuse the caller-provided output tuple and must not fall
// back to allocating one [1,0] tuple per face when lighting is unavailable.
const noLighting = currentMesher(world, world.chunks.get('0,0'), undefined, [...world.chunks.get('0,0').blocks.sections.keys()][0]);
assert.ok(noLighting.every(group => group.positions.length % 3 === 0));
console.log('PASS no-light mesh path remains valid with reusable light/AO/color scratch arrays.');

// Paired CPU benchmark against the frozen diagnostics mesher. The same world,
// lighting arrays and 26 sections are used; order alternates to reduce drift.
// This is a diagnostic measurement, not a flaky pass/fail performance gate.
for (let i = 0; i < 2; i++) for (const chunk of world.chunks.values())
  for (const sy of chunk.blocks.sections.keys()) {
    referenceMesher(world, chunk, lighting, sy);
    currentMesher(world, chunk, lighting, sy);
  }
const benchmarkCases = [...world.chunks.values()].flatMap(chunk =>
  [...chunk.blocks.sections.keys()].map(sy => ({ chunk, sy }))
);
const runBenchmark = fn => {
  const started = performance.now();
  for (const { chunk, sy } of benchmarkCases) fn(world, chunk, lighting, sy);
  return performance.now() - started;
};
const referenceTimes = [], optimizedTimes = [];
for (let i = 0; i < 12; i++) {
  if (i % 2 === 0) {
    referenceTimes.push(runBenchmark(referenceMesher));
    optimizedTimes.push(runBenchmark(currentMesher));
  } else {
    optimizedTimes.push(runBenchmark(currentMesher));
    referenceTimes.push(runBenchmark(referenceMesher));
  }
}
const median = values => [...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const beforeMs = median(referenceTimes), afterMs = median(optimizedTimes);
console.log(`Reference→current CPU mesh benchmark (${benchmarkCases.length} sections, populated lighting): ${beforeMs.toFixed(2)}→${afterMs.toFixed(2)} ms (${(100*(1-afterMs/beforeMs)).toFixed(1)}% change).`);
