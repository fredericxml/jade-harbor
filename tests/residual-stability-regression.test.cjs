#!/usr/bin/env node
// Residual stability regression coverage for high-value edge cases.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
  fileName: f,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, f);

const { B, block } = require('../src/world/blocks.ts');
const coords = require('../src/core/coords.ts');
const { item } = require('../src/game/items.ts');
const { Inventory } = require('../src/game/inventory.ts');
const { Entities, spawnEntity } = require('../src/game/entities.ts');
const { StatusEffects, POTIONS } = require('../src/game/progression.ts');
const { freshWorld, validateSave } = require('../src/persistence/saves.ts');

let checks = 0;
function test(name, fn) {
  fn();
  checks++;
  console.log('PASS', name);
}

function gameMethods(names) {
  const source = fs.readFileSync(path.join(__dirname, '../src/core/game.ts'), 'utf8');
  const ast = ts.createSourceFile('game.ts', source, ts.ScriptTarget.ES2022, true);
  const cls = ast.statements.find(n => ts.isClassDeclaration(n) && n.name?.text === 'Game');
  const methods = names.map(name => {
    const member = cls?.members.find(m => ts.isMethodDeclaration(m) && m.name.getText(ast) === name);
    assert(member, `Missing Game.${name}`);
    return member.getText(ast);
  });
  const js = ts.transpileModule(`class AuditGame {${methods.join('\n')}}`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return Function(
    'B','block','item','POTIONS','Inventory','MIN_Y','MAX_Y','collides','idOf','clamp',
    `${js};return AuditGame`,
  )(
    B, block, item, POTIONS, Inventory, coords.MIN_Y, coords.MAX_Y,
    (_world, p) => p.y <= 100,
    coords.idOf, coords.clamp,
  );
}

const AuditGame = gameMethods(['safeSpawn', 'use', 'applySettings']);

// 1. Dropped item persistence must never accept null stacks. Inventory slots may be
// null, but Drop.stack is structurally required and entity ticking dereferences it.
test('Save validator rejects dropped entities with null stacks', () => {
  const data = freshWorld('Regression', 'drop-null', 'survival');
  data.simulation = {
    ...(data.simulation ?? {}),
    drops: [{
      id: 'bad-drop',
      stack: null,
      position: { x: 0, y: 40, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      age: 1,
    }],
  };
  assert.throws(() => validateSave(data), /Invalid world simulation data/);
});


// 1b. World edits must be an object map. A malformed primitive/array used to
// pass validation and then silently behave like an empty edit set on import.
test('Save validator rejects non-object world edit maps', () => {
  for (const edits of [1, [], 'edits']) {
    const data = freshWorld('Regression', 'bad-edits', 'survival');
    data.edits = edits;
    assert.throws(() => validateSave(data), /Unsupported or damaged Jade Harbor save/);
  }
});

// 1c. Furnace progress state is persisted. Corrupt recipe identifiers must not
// be accepted as arbitrary finite values.
test('Save validator rejects invalid furnace recipe identifiers', () => {
  for (const recipe of [1.5, -1, 999]) {
    const data = freshWorld('Regression', 'bad-furnace', 'survival');
    data.simulation = {
      furnaces: {
        '0,20,0': { slots: [null, null, null], burn: 0, progress: 0, recipe },
      },
    };
    assert.throws(() => validateSave(data), /Invalid world simulation data/);
  }
});

// 1d. Scheduled block ticks must stay inside the signed world height. Invalid Y
// coordinates otherwise survive import and enter the simulation queue.
test('Save validator rejects pending ticks outside world bounds', () => {
  for (const key of [`0,${coords.MIN_Y},0`, `0,${coords.MAX_Y + 1},0`]) {
    const data = freshWorld('Regression', 'bad-pending-tick', 'survival');
    data.simulation = { pendingTicks: [key] };
    assert.throws(() => validateSave(data), /Invalid world simulation data/);
  }
});

// 2. safeSpawn's fallback path must clear stale fall/knockback velocity just like
// the nearby-search path does.
test('safeSpawn fallback clears stale velocity', () => {
  const game = new AuditGame();
  game.spawn = { x: 0.5, y: 20.1, z: 0.5 };
  game.body = {
    position: { x: 0.5, y: -200, z: 0.5 },
    velocity: { x: 8, y: -19, z: -5 },
  };
  game.previous = { ...game.body.position };
  game.world = {
    ensure() {},
    get(_x, y, _z) { return y <= 100 ? B.Stone : B.Air; },
  };
  game.safeSpawn();
  assert(game.body.position.y > 100, 'fallback did not find the top-down stand position');
  assert.deepEqual(game.body.velocity, { x: 0, y: 0, z: 0 });
  assert.deepEqual(game.previous, game.body.position);
});

// 3. A guard may kill a spirit before its turn in the same tick. The dead spirit
// must not receive one final AI/attack update before final list cleanup.
test('Entity killed earlier in a tick cannot attack later in that same tick', () => {
  const world = { seed: 'stability-regression', loaded: () => true, get: () => B.Air, set: () => true, navRevision: 0 };
  const entities = Object.create(Entities.prototype);
  entities.world = world;
  entities.navigation = { steer: () => null, agents: new Map(), removeMissing() {}, tick() {} };
  entities.radius = 64;
  entities.elapsed = 0;
  entities.spawnClock = 0;
  entities.wasNight = true;
  entities.interactingId = '';
  entities.drops = [];
  const guard = spawnEntity('villager', { x: 0, y: 40, z: 0 }, 'Guard');
  guard.profession = 'guard';
  guard.workplace = { x: 0, y: 40, z: 0 };
  const spirit = spawnEntity('spirit', { x: 0.5, y: 40, z: 0 }, 'Spirit');
  spirit.health = 4; // one guard hit is lethal
  entities.list = [guard, spirit];
  let playerDamageCalls = 0;
  entities.tick(
    0.05,
    { x: 0.5, y: 40, z: 0 },
    new Inventory(),
    0.8,
    true,
    () => { playerDamageCalls++; },
    () => {},
    true,
  );
  assert.equal(spirit.health, 0, 'guard did not kill the positive-control spirit');
  assert.equal(playerDamageCalls, 0, 'dead spirit attacked after being killed in the same tick');
  assert(!entities.list.includes(spirit), 'dead spirit was not cleaned up');
});

function potionGame(potionCount, fillOtherSlots, dropResult) {
  const game = new AuditGame();
  game.cooldown = 0;
  game.mode = 'survival';
  game.inventory = new Inventory();
  game.inventory.selected = 0;
  game.inventory.slots[0] = { id: 161, count: potionCount };
  if (fillOtherSlots) {
    for (let i = 1; i < game.inventory.slots.length; i++) game.inventory.slots[i] = { id: 3, count: item(3).stack };
  }
  game.target = () => null;
  game.direction = () => ({ x: 0, y: 0, z: -1 });
  game.input = { keys: new Set() };
  game.entities = {
    target: () => null,
    dropCalls: 0,
    drop(stack) { this.dropCalls++; this.lastDrop = structuredClone(stack); return dropResult; },
  };
  game.body = { position: { x: 0, y: 40, z: 0 } };
  game.health = 10;
  game.status = new StatusEffects();
  game.audio = { play() {} };
  game.scheduleSave = () => { game.saved = (game.saved ?? 0) + 1; };
  game.ui = { toast(message) { game.toast = message; } };
  return game;
}

// 4. Potion use is a resource transaction: effect + potion consumption + empty
// flask return must commit together, or the action must abort without loss.
test('Potion use preserves empty flask under full inventory/drop-pool pressure', () => {
  const blocked = potionGame(2, true, false);
  blocked.use();
  assert.equal(blocked.inventory.slots[0].count, 2, 'blocked potion use consumed the potion');
  assert.equal(blocked.health, 10, 'blocked potion use applied healing');
  assert.match(blocked.toast ?? '', /empty flask/i);
  assert.equal(blocked.saved ?? 0, 0, 'aborted potion use scheduled a save');

  const dropFallback = potionGame(2, true, true);
  dropFallback.use();
  assert.equal(dropFallback.inventory.slots[0].count, 1);
  assert.equal(dropFallback.health, 16);
  assert.equal(dropFallback.entities.dropCalls, 1);
  assert.deepEqual(dropFallback.entities.lastDrop, { id: 160, count: 1 });

  const freedSlot = potionGame(1, true, false);
  freedSlot.use();
  assert.equal(freedSlot.health, 16);
  assert.equal(freedSlot.entities.dropCalls, 0, 'flask was dropped despite the consumed potion freeing a slot');
  assert.deepEqual(freedSlot.inventory.slots[0], { id: 160, count: 1 });
});

// 5. Persisted settings are untrusted browser state. Corrupt values must not put
// NaN/Infinity into the Three.js camera/fog or input calculations.
test('applySettings sanitizes corrupt persisted numeric values', () => {
  const game = new AuditGame();
  game.settings = {
    fov: NaN,
    distance: Infinity,
    simulationDistance: -Infinity,
    sensitivity: 'broken',
    volume: null,
  };
  let projectionUpdates = 0;
  game.view = {
    camera: { fov: 0, updateProjectionMatrix() { projectionUpdates++; } },
    scene: { fog: { near: 0, far: 0 } },
  };
  game.audio = { volume: -1 };
  game.applySettings();
  assert.deepEqual(game.settings, { fov: 75, distance: 5, simulationDistance: 4, sensitivity: 4, volume: 30 });
  assert.equal(game.view.camera.fov, 75);
  assert.equal(game.view.scene.fog.near, 50);
  assert.equal(game.view.scene.fog.far, 120);
  assert.equal(game.audio.volume, 0.3);
  assert.equal(projectionUpdates, 1);
});

console.log(`PASS residual stability regression (${checks} groups)`);
