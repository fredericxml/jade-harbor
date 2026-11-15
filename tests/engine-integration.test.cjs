const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('package, lockfile and menu footer use one current release identity', () => {
  const pkg = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  const ui = read('src/ui/ui.ts');
  assert.equal(pkg.version, '2.1.0');
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
  assert.match(ui, /import \{ version as appVersion \} from "\.\.\/\.\.\/package\.json"/);
  assert.ok(ui.includes('JADE HARBOR · v${appVersion}'));
});

test('world replacement disposes world-bound owners before constructing the next world', () => {
  const source = read('src/core/game.ts');
  const start = source.indexOf('private async startOwnedWorld(');
  const end = source.indexOf('\n  safeSpawn()', start);
  assert.ok(start >= 0 && end > start, 'startOwnedWorld method must exist');
  const body = source.slice(start, end);
  const ordered = [
    'this.discoveries?.dispose()',
    'this.simulation.dispose()',
    'this.entities.dispose()',
    'this.lighting.dispose()',
    'this.world.dispose()',
    'this.view.clear()',
    'this.world = new World(',
    'this.simulation = new Simulation(',
    'this.entities = new Entities(',
    'this.entityView.clear()',
    'this.lighting = new Lighting(',
    'this.view.attachWorld(this.world',
  ];
  let previous = -1;
  for (const token of ordered) {
    const index = body.indexOf(token);
    assert.ok(index > previous, `Expected ordered world transition token: ${token}`);
    previous = index;
  }
  assert.doesNotMatch(body, /this\.view\.dispose\(\)|this\.entityView\.dispose\(\)/,
    'world replacement must retain reusable renderer owners');
});

test('permanent Game shutdown saves before disposing owners and cancels its only RAF', () => {
  const source = read('src/core/game.ts');
  const start = source.indexOf('dispose():Promise<void>');
  const end = source.indexOf('\n  resume(', start);
  assert.ok(start >= 0 && end > start, 'Game.dispose must exist');
  const body = source.slice(start, end);
  assert.match(body, /if\(this\.disposeTask\)return this\.disposeTask/);
  assert.match(body, /this\.disposed=true/);
  assert.match(body, /cancelAnimationFrame\(this\.frameHandle\)/);
  const save = body.indexOf('await(this.saveTask??this.save())');
  const resources = body.indexOf('this.simulation.dispose()');
  assert.ok(save >= 0 && resources > save, 'active world save must be awaited before resource teardown');
  for (const owner of ['this.ui.dispose()', 'this.simulation.dispose()', 'this.entities.dispose()',
    'this.lighting.dispose()', 'this.world.dispose()', 'this.entityView.dispose()',
    'this.effects.dispose()', 'this.view.dispose()', 'await this.audio.dispose()']) {
    assert.ok(body.includes(owner), `permanent shutdown must dispose ${owner}`);
  }
});

test('world disposal invalidates pending async work and releases retained world registries', () => {
  const source = read('src/world/world.ts');
  const start = source.indexOf('  dispose() {');
  assert.ok(start >= 0);
  const body = source.slice(start);
  for (const token of ['this.disposed = true', 'this.epoch++', 'this.worker.onmessage=null',
    'this.worker.onerror=null', 'this.worker.terminate()', 'this.chunks.clear()',
    'this.pending.clear()', 'this.tickets.clear()', 'this.dirty.clear()',
    'this.dirtyEdits.clear()', 'this.editChunks.clear()', 'this.edits.clear()',
    'this.onEvictionPending = undefined', 'this.onGeneration = undefined', 'this.onChange = undefined']) {
    assert.ok(body.includes(token), `World.dispose missing ${token}`);
  }
});

test('simulation and entity teardown clear aliases and indexes without mutating saved snapshots', () => {
  const entities = read('src/game/entities.ts');
  const simulation = read('src/game/simulation.ts');
  const automation = read('src/game/automation.ts');
  assert.match(entities, /dispose\(\)\s*\{[\s\S]*?this\.list\s*=\s*\[\][\s\S]*?this\.drops\s*=\s*\[\][\s\S]*?this\.entityById\.clear\(\)/);
  assert.match(simulation, /dispose\(\)\s*\{[\s\S]*?this\.automation\.dispose\(\)[\s\S]*?this\.occupants\.length\s*=\s*0/);
  assert.match(automation, /dispose\(\)\s*\{[\s\S]*?this\.drops\.length\s*=\s*0[\s\S]*?this\.hoppers[\s\S]*?this\.containers[\s\S]*?this\.furnaces/);
});

test('renderer final teardown is idempotent and distinct from reusable world clear', () => {
  const source = read('src/render/renderer.ts');
  const start = source.indexOf('  dispose(){', source.indexOf('export class View'));
  assert.ok(start >= 0);
  const body = source.slice(start);
  assert.match(body, /if\(this\.disposed\)return/);
  assert.match(body, /this\.disposed=true/);
  assert.match(body, /this\.gpuTimer\.dispose\(\)/);
  assert.match(body, /for\(const geometry of geometries\)geometry\.dispose\(\)/);
  assert.match(body, /for\(const material of materials\)material\.dispose\(\)/);
  assert.match(body, /this\.renderer\.dispose\(\)/);
  const clear = source.indexOf('  clear() {');
  assert.ok(clear >= 0 && clear < start, 'reusable clear() remains available before final dispose()');
});
test('consolidated engine release coverage for engine integration', () => {
  const pkg=JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'../package.json'),'utf8'));
  assert.ok(pkg.scripts['test:engine']?.includes('tests/engine-integration.test.cjs'), 'Behavioral test must remain in its subsystem suite');
  assert.ok(pkg.scripts['test:regression']?.includes('npm run test:engine'), 'Regression must execute the subsystem');
});
