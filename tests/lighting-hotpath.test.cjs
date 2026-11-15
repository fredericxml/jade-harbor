const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText.replace(/import\.meta\.url/g, '"file:///generation.worker.ts"'), file);

const { World } = require('../src/world/world.ts');
const { Lighting: Baseline } = require('./fixtures/lighting-optimized-reference.ts');
const { Lighting: Candidate } = require('../src/world/lighting.ts');
const { BlockSection } = require('../src/world/sections.ts');
const { B, block, emits } = require('../src/world/blocks.ts');
const { emits: baselineEmits } = require('./fixtures/blocks-compatibility-reference.ts');
const { packed } = require('../src/core/coords.ts');

function digestLighting(lighting) {
  const rows = [];
  for (const [key, values] of [...lighting.sky].sort((a, b) => a[0].localeCompare(b[0])))
    rows.push(['sky', key, Array.from(values)]);
  for (const [key, values] of [...lighting.blockLightSections].sort((a, b) => a[0].localeCompare(b[0])))
    rows.push(['block', key, Buffer.from(values).toString('hex')]);
  return JSON.stringify({ rows, count: lighting.blockLightCount });
}
function makePair(version = 10) {
  const world = new World('jade-harbor', {}, false, version);
  for (let z = -1; z <= 1; z++) for (let x = -1; x <= 1; x++) world.ensure(x, z, true);
  return { world, baseline: new Baseline(world), candidate: new Candidate(world) };
}
function expectParity(baseline, candidate, context) {
  assert.equal(digestLighting(candidate), digestLighting(baseline), context);
}

test('emission lookup with a caller-provided block definition matches the legacy lookup for all packed values', () => {
  for (let value = 0; value <= 0xffff; value++) {
    const definition = block(value);
    assert.equal(emits(value, definition), baselineEmits(value), `packed block value ${value}`);
  }
});

test('typed-array lighting scan preserves exact sky and block-light output for the single world generator', () => {
  for (const version of [6, 8, 10]) {
    const { world, baseline, candidate } = makePair(version);
    baseline.rebuild(); candidate.rebuild();
    expectParity(baseline, candidate, `generator ${version} initial rebuild`);
    world.set(2, 21, 2, B.Lantern);
    world.set(3, 21, 2, packed(B.Lamp, 1));
    baseline.rebuild(); candidate.rebuild();
    expectParity(baseline, candidate, `generator ${version} after block edits`);
    baseline.dispose(); candidate.dispose(); world.dispose();
  }
});

test('uniform block sections preserve opaque sky and emissive propagation', () => {
  const { world, baseline, candidate } = makePair(10);
  const chunk = world.chunks.get('0,0');
  const fixtures = [
    [-2, B.Stone],
    [-1, B.Water],
    [0, B.Lantern],
    [1, packed(B.Lamp, 1)],
    [2, packed(B.Furnace, 1)],
  ];
  for (const [sy, value] of fixtures) chunk.blocks.sections.set(sy, new BlockSection(value));
  baseline.rebuild(); candidate.rebuild();
  expectParity(baseline, candidate, 'uniform opaque, transparent and emissive sections');
  baseline.dispose(); candidate.dispose(); world.dispose();
});

test('eviction and subsequent lighting rebuild retain exact parity', () => {
  const { world, baseline, candidate } = makePair(10);
  baseline.rebuild(); candidate.rebuild();
  world.chunks.delete('1,1'); world.navRevision++; world.chunkTopologyRevision++;
  baseline.pruneUnloaded(['1,1']); candidate.pruneUnloaded(['1,1']);
  baseline.rebuild(); candidate.rebuild();
  expectParity(baseline, candidate, 'after chunk eviction and lighting rebuild');
  baseline.dispose(); candidate.dispose(); world.dispose();
});

console.log('PASS lighting hot-path parity, packed emission lookup, uniform sections and eviction');
