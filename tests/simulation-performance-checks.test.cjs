const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const game = fs.readFileSync(path.join(root, 'src/core/game.ts'), 'utf8');
const metricsSource = fs.readFileSync(path.join(root, 'src/core/metrics.ts'), 'utf8');
const adaptive = fs.readFileSync(path.join(root, 'src/render/adaptive-resolution.ts'), 'utf8');
const graphics = fs.readFileSync(path.join(root, 'src/render/graphics.ts'), 'utf8');
const world = fs.readFileSync(path.join(root, 'src/world/world.ts'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'src/render/renderer.ts'), 'utf8');
const lighting = fs.readFileSync(path.join(root, 'src/world/lighting.ts'), 'utf8');
const distant = fs.readFileSync(path.join(root, 'src/render/distant-world.ts'), 'utf8');
const coverage = fs.readFileSync(path.join(root, 'src/render/mesh-coverage.ts'), 'utf8');

// Exercise the production Metrics implementation, not a test double.
const compiled = ts.transpileModule(metricsSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', compiled)(mod, mod.exports);
const { Metrics } = mod.exports;
const metrics = new Metrics();
for (let i = 0; i < 300; i++) metrics.add('worldStream', i);
assert.equal(metrics.summary('worldStream').count, 240, 'rolling metrics remain bounded');
assert.equal(metrics.summary('worldStream').p50, 180, 'rolling percentile uses retained samples');

for (const key of ['worldStream', 'worldEviction', 'meshQueue', 'simulation', 'entities', 'actorRender', 'effects', 'hud']) {
  assert(game.includes(`metrics.add("${key}"`), `missing runtime metric ${key}`);
}
for (const key of ['cityLife', 'navigation', 'entities', 'distant', 'maxBuildSliceMs', 'planMs']) {
  assert(game.includes(`${key}:`), `missing performance-report field ${key}`);
}
assert.match(game, /CPU subsystem samples are separate categories and may be nested\/overlap; do not sum them/);
assert.match(game, /renderSubmit is CPU-side submission, not GPU execution/);

// The quality/adaptive policy must remain stable.
assert.match(adaptive, /MIN_RESOLUTION_SCALE = \.7/);
assert.match(graphics, /GRAPHICS_PROFILES/);
assert.doesNotMatch(world, /positions\.sort\(\(a, b\) => a\[2\] - b\[2\]\)/, 'streaming no longer sorts every candidate position');
assert.match(world, /requestLimit=this\.evictionBlocked>64\?0:Math\.min\(4,Math\.max\(0,8-this\.pending\.size\)\)/, 'streaming uses the existing request/backpressure budget');
assert.match(world, /while\(at>0&&candidates\[at-1\]\.distance>distance\)/, 'streaming retains stable nearest-first bounded selection');
assert.match(renderer, /dirtyScanIterator: Iterator<string> \| null = null/, 'dirty discovery retains a resumable iterator');
assert.match(renderer, /const scanLimit=256/, 'dirty discovery is capped per frame');
assert.match(renderer, /scanComplete/, 'dirty discovery exposes completion telemetry');
assert.doesNotMatch(renderer, /for \(const key of world\.dirty\)/, 'dirty discovery no longer scans the full Set in one frame');
assert.match(lighting, /this\.worldSignature\(\)!==signature/);
assert.match(distant, /coverageIndex\?\.update/);
assert.match(renderer, /this\.recordMeshChange\(commit\.key,\s*true\)/, 'completed geometry commits publish the mesh-coverage journal change');
assert.match(coverage, /navRevision!==this\.lastNavRevision/);
assert.match(coverage, /this\.cursor<changeBase/);

console.log('PASS simulation performance contracts: bounded subsystem metrics, streaming top-K, incremental distant coverage, and locked preset/adaptive policy');
