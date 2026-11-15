const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, file);

const { frameUrgent, hasFrameBackgroundWork } = require('../src/render/frame-pacer.ts');
const distantSource = fs.readFileSync('src/render/distant-world.ts', 'utf8');
const gameSource = fs.readFileSync('src/core/game.ts', 'utf8');
const file = ts.createSourceFile('distant-world.ts', distantSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
let updateMethod;
function visit(node) {
  if (ts.isClassDeclaration(node) && node.name?.text === 'DistantWorld') {
    updateMethod = node.members.find(member => ts.isMethodDeclaration(member) && member.name?.getText(file) === 'update');
  }
  ts.forEachChild(node, visit);
}
visit(file);
assert.ok(updateMethod, 'production DistantWorld.update method found');
const compiled = ts.transpileModule(`class ExtractedDistantWorld { ${updateMethod.getText(file)} }`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const ExtractedDistantWorld = new Function(`${compiled}; return ExtractedDistantWorld;`)();

function fakeDistantWorld(visible) {
  const calls = { build: 0, coverage: 0, camera: 0 };
  return {
    calls,
    disposed: false,
    world: { navRevision: 0 },
    plan: {},
    group: { visible },
    work: { next() { calls.build++; return { done: true }; } },
    coverageIndex: { update() { calls.coverage++; return true; } },
    texture: { needsUpdate: false },
    material: { uniforms: {
      cameraXZ: { value: { set() { calls.camera++; } } },
      daylight: { value: 0 }, fogNear: { value: 0 }, fogFar: { value: 0 }, fogDetail: { value: 0 }
    } },
    waterMaterial: { uniforms: {
      cameraXZ: { value: { set() {} } },
      waterTint: { value: { copy() {} } }, fogColor: { value: { copy() {} } },
      lightTint: { value: { copy() {} } }, daylight: { value: 0 },
      fogNear: { value: 0 }, fogFar: { value: 0 }, fogDetail: { value: 0 }
    } },
    stats: { buildMs: 0, maxBuildSliceMs: 0, updates: 0 },
  };
}

test('hidden distant group does not advance geometry or coverage work', () => {
  const distant = fakeDistantWorld(false);
  ExtractedDistantWorld.prototype.update.call(distant,
    { x: 0, y: 0, z: 0 }, new Set(), { daylight: 1, water: {}, fog: {}, light: {}, fogNear: 1, fogFar: 2, fogDetail: 3 }, 0, [], 0);
  assert.deepEqual(distant.calls, { build: 0, coverage: 0, camera: 0 });
  assert.equal(distant.stats.updates, 0);
  assert.ok(distant.work, 'hidden work remains resumable rather than being discarded');
});

test('visible distant group resumes bounded build and coverage updates', () => {
  const distant = fakeDistantWorld(true);
  ExtractedDistantWorld.prototype.update.call(distant,
    { x: 1, y: 2, z: 3 }, new Set(), { daylight: .5, water: {}, fog: {}, light: {}, fogNear: 10, fogFar: 20, fogDetail: 30 }, 4, [], 0);
  assert.deepEqual(distant.calls, { build: 1, coverage: 1, camera: 1 });
  assert.equal(distant.stats.updates, 1);
  assert.equal(distant.texture.needsUpdate, true);
  assert.equal(distant.work, undefined, 'completed work is released when resumed');
});

test('hidden not-ready distant work does not force urgent paused redraws', () => {
  assert.equal(hasFrameBackgroundWork(false, false, false, false, false), false);
  assert.equal(frameUrgent(false, false, hasFrameBackgroundWork(false, false, false, false, false)), false);
  assert.equal(hasFrameBackgroundWork(false, false, false, true, false), true);
  assert.equal(frameUrgent(false, false, hasFrameBackgroundWork(false, false, false, true, false)), true);
  assert.equal(hasFrameBackgroundWork(true, false, false, false, false), true, 'world mesh work remains urgent');
  assert.equal(hasFrameBackgroundWork(false, true, false, false, false), true, 'generation remains urgent');
  assert.equal(hasFrameBackgroundWork(false, false, true, false, false), true, 'lighting remains urgent');
  assert.equal(hasFrameBackgroundWork(false, false, false, true, true), false, 'ready distant world has no pending work');
});

test('Game frame-pacing uses distant visibility when deciding background work', () => {
  assert.match(gameSource, /hasFrameBackgroundWork\(/);
  assert.match(gameSource, /!!distant\?\.group\.visible/);
  assert.match(gameSource, /!!distant\?\.stats\.ready/);
  assert.match(distantSource, /if\(this\.disposed\|\|!this\.plan\|\|!this\.group\.visible\)return;/);
});

console.log('PASS hidden distant-world work deferral and paused frame-pacing contract');
