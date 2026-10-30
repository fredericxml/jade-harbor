// Same dependency-light TypeScript loader used by profile-reliability.cjs.
const fs = require('node:fs'), ts = require('typescript');
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText.replace(/import\.meta\.url/g, '"file:///generation.worker.ts"'), file);
const { createGenerator } = require('../src/world/generator.ts');
const { World } = require('../src/world/world.ts');
const { meshChunk } = require('../src/render/mesher.ts');
const { Lighting } = require('../src/world/lighting.ts');
const report = { node: process.version, platform: process.platform, architecture: process.arch, seed: 'jade-harbor', regions: [] };
for (const [name, x, z] of [['primary-city', 0, 24], ['harbor', 200, 530], ['ridge', 160, -630], ['cliff', 620, -430], ['mine', 360, 112]]) {
  const world = new World(report.seed, {}, false, 4), timings = [], t = performance.now();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const start = performance.now(); world.ensure(Math.floor(x / 16) + dx, Math.floor(z / 16) + dz, true); timings.push(performance.now() - start);
  }
  const generationMs = performance.now() - t, lighting = new Lighting(world), lightStart = performance.now(); lighting.rebuild();
  const lightingMs = performance.now() - lightStart, meshStart = performance.now(); let triangles = 0;
  for (const chunk of world.chunks.values()) for (const mesh of meshChunk(world, chunk, lighting)) triangles += mesh.indices.length / 3;
  report.regions.push({ name, columns: world.chunks.size, planMs: world.inspectTerrain(x, z).planMs, generationMs, medianMs: timings.sort((a, b) => a - b)[4],
    lightingMs, meshingMs: performance.now() - meshStart, triangles, blockBytes: [...world.chunks.values()].reduce((n, c) => n + c.blocks.byteLength, 0) });
  world.dispose();
}
const generator = createGenerator(report.seed), queryStart = performance.now();
for (let i = 0; i < 10000; i++) generator.terrainHeight(i % 100 * 16 - 800, Math.floor(i / 100) * 16 - 800);
report.terrain10000QueriesMs = performance.now() - queryStart;
fs.mkdirSync('test-results', { recursive: true });
fs.writeFileSync('test-results/world-performance.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
