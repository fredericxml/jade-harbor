#!/usr/bin/env node
// Deep functional regression coverage.
// Runs directly against TypeScript source with the globally available TypeScript compiler.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
  fileName: f,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, f);

const { B, block } = require('../src/world/blocks.ts');
const coords = require('../src/core/coords.ts');
const { item } = require('../src/game/items.ts');
const { Inventory } = require('../src/game/inventory.ts');
const { Entities, TRADES, spawnEntity } = require('../src/game/entities.ts');
const { Simulation } = require('../src/game/simulation.ts');
const { StatusEffects, enchantLevel } = require('../src/game/progression.ts');
const { useBucket } = require('../src/game/buckets.ts');
const { freshWorld, validateSave } = require('../src/persistence/saves.ts');
const { generateChunk } = require('../src/world/generator.ts');

let checks = 0;
function test(name, fn) {
  fn();
  checks++;
  console.log('PASS', name);
}
function clone(v) { return structuredClone(v); }

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
    'B','block','item','StatusEffects','enchantLevel','useBucket','overlapsBlock','MIN_Y','MAX_Y','idOf','stateOf','blockKey','packed',
    `${js};return AuditGame`,
  )(
    B, block, item, StatusEffects, enchantLevel, useBucket, () => false,
    coords.MIN_Y, coords.MAX_Y, coords.idOf, coords.stateOf, coords.blockKey, coords.packed,
  );
}

const AuditGame = gameMethods(['mine', 'key']);

function makeMineGame(blockValue, mode = 'survival', heldId = null) {
  const game = new AuditGame();
  const k = coords.blockKey(2, 40, 2);
  const cells = new Map([[k, blockValue]]);
  let lootCalls = 0;
  let loot = [];
  game.mode = mode;
  game.input = { left: true, keys: new Set() };
  game.hit = { x: 2, y: 40, z: 2, value: blockValue, normal: { x: 1, y: 0, z: 0 }, distance: 2 };
  game.mineProgress = 0;
  game.mineKey = '';
  game.inventory = new Inventory();
  if (heldId !== null) assert.equal(game.inventory.add(heldId), 0);
  game.world = {
    get(x, y, z) { return cells.get(coords.blockKey(x, y, z)) ?? 0; },
    set(x, y, z, v) { cells.set(coords.blockKey(x, y, z), v); return true; },
  };
  game.breakContents = (_x, _y, _z, drops) => { lootCalls++; loot = clone(drops); return true; };
  game.effects = { burst() {} };
  game.audio = { play() {} };
  game.ui = { toast() {} };
  game.unlockAchievement = () => {};
  game.xp = 0;
  return { game, cells, lootCalls: () => lootCalls, loot: () => loot };
}

function totals(inv, external = []) {
  const out = new Map();
  const add = s => { if (s) out.set(s.id, (out.get(s.id) ?? 0) + s.count); };
  inv.slots.forEach(add); external.forEach(add); add(inv.cursor);
  return [...out].sort((a,b)=>a[0]-b[0]);
}
function lcg(seed) {
  let x = seed >>> 0;
  return () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 0x100000000);
}

// 1. Inventory fuzz: slot/cursor/external-container interactions must conserve every item.
test('Inventory fuzz conserves items across clicks, split/merge, drag moves and cursor settling', () => {
  const ids = [3, 8, 14, 105, 107, 108, 111];
  const rand = lcg(0x96cafe);
  for (let run = 0; run < 120; run++) {
    const inv = new Inventory();
    const chest = Array(27).fill(null);
    for (let i = 0; i < 24; i++) {
      const id = ids[Math.floor(rand() * ids.length)];
      const count = 1 + Math.floor(rand() * Math.min(32, item(id).stack));
      const target = rand() < 0.7 ? inv.slots : chest;
      const slot = Math.floor(rand() * target.length);
      if (!target[slot]) target[slot] = { id, count };
    }
    const expected = totals(inv, chest);
    for (let step = 0; step < 500; step++) {
      const op = Math.floor(rand() * 6);
      if (op === 0) inv.click(Math.floor(rand()*36), rand()<0.5);
      if (op === 1) inv.click(Math.floor(rand()*27), rand()<0.5, chest);
      if (op === 2) inv.move(Math.floor(rand()*36), Math.floor(rand()*36));
      if (op === 3) inv.move(Math.floor(rand()*36), Math.floor(rand()*27), inv.slots, chest);
      if (op === 4) inv.move(Math.floor(rand()*27), Math.floor(rand()*36), chest, inv.slots);
      if (op === 5) inv.settleCursor();
      assert.deepEqual(totals(inv, chest), expected, `conservation failure run=${run} step=${step}`);
      for (const s of [...inv.slots, ...chest, inv.cursor]) if (s) {
        assert(Number.isInteger(s.count) && s.count > 0 && s.count <= item(s.id).stack, 'invalid stack after fuzz');
      }
    }
  }
});

// 2. All live NPC trade definitions must execute through Inventory.transaction exactly.
test('Every current NPC trade definition is valid and transaction-safe', () => {
  for (const [i, offer] of TRADES.entries()) {
    const inv = new Inventory();
    for (const [id, n] of offer.cost) assert.equal(inv.add(id, n), 0, `cannot seed trade ${i}`);
    const beforeCost = new Map(offer.cost.map(([id]) => [id, inv.count(id)]));
    const beforeOut = inv.count(offer.output[0]);
    assert.equal(inv.transaction(offer.cost, offer.output), true, `trade ${i} failed`);
    for (const [id, n] of offer.cost) {
      const outOverlap = offer.output[0] === id ? offer.output[1] : 0;
      assert.equal(inv.count(id), beforeCost.get(id) - n + outOverlap, `trade ${i} cost mismatch`);
    }
    if (!offer.cost.some(([id]) => id === offer.output[0]))
      assert.equal(inv.count(offer.output[0]), beforeOut + offer.output[1], `trade ${i} output mismatch`);
  }
});

// 3. Fluid blocks are world simulation state, not mineable stackable resources.
test('Survival mining rejects Water and Lava while ordinary blocks still mine', () => {
  for (const fluid of [B.Water, B.Lava]) {
    const { game, cells, lootCalls } = makeMineGame(fluid);
    game.mine(100);
    assert.equal(cells.get('2,40,2'), fluid, `${block(fluid).name} was removed by mining`);
    assert.equal(lootCalls(), 0, `${block(fluid).name} entered loot path`);
  }
  const stone = makeMineGame(B.Stone, 'survival', 120);
  stone.game.mine(100);
  assert.equal(stone.cells.get('2,40,2'), 0, 'positive-control Stone did not mine');
  assert(stone.loot().length > 0, 'positive-control Stone produced no loot');
});

// 4. Spectator mode must not create item drops through the Q key.
test('Spectator Q cannot drop inventory items; Survival Q still drops and consumes one', () => {
  const make = mode => {
    const game = new AuditGame();
    game.active = true;
    game.mode = mode;
    game.ui = { screen: 'none' };
    game.inventory = new Inventory();
    game.inventory.add(105, 2);
    game.direction = () => ({ x: 1, y: 0, z: 0 });
    game.body = { position: { x: 0, y: 40, z: 0 } };
    let drops = 0, saves = 0;
    game.entities = { drop() { drops++; return true; } };
    game.scheduleSave = () => { saves++; };
    game.input = { keys: new Set() };
    return { game, drops: () => drops, saves: () => saves };
  };
  const spectator = make('spectator');
  spectator.game.key('KeyQ');
  assert.equal(spectator.drops(), 0);
  assert.equal(spectator.game.inventory.count(105), 2);
  assert.equal(spectator.saves(), 0);

  const survival = make('survival');
  survival.game.key('KeyQ');
  assert.equal(survival.drops(), 1);
  assert.equal(survival.game.inventory.count(105), 1);
  assert.equal(survival.saves(), 1);
});

// 5. Spectators must not vacuum up dropped items merely by flying near them.
test('Entity drop pickup honors playerInteractive=false for Spectator', () => {
  const make = () => {
    const e = Object.create(Entities.prototype);
    e.world = { loaded: () => true, get: () => 0 };
    e.list = [];
    e.drops = [{ id: 'drop-1', stack: { id: 105, count: 1 }, position: { x: 0, y: 0.72, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, age: 0.6 }];
    e.radius = 64; e.elapsed = 0; e.spawnClock = 0; e.wasNight = false; e.interactingId = '';
    e.navigation = { removeMissing() {}, tick() {}, agents: new Map() };
    return e;
  };
  const p = { x: 0, y: 0, z: 0 };
  let picked = 0;
  const inv1 = new Inventory(), noInteract = make();
  noInteract.tick(0.01, p, inv1, 0.2, false, () => {}, () => picked++, false);
  assert.equal(inv1.count(105), 0);
  assert.equal(noInteract.drops.length, 1);
  assert.equal(picked, 0);

  const inv2 = new Inventory(), interact = make();
  interact.tick(0.01, p, inv2, 0.2, false, () => {}, () => picked++, true);
  assert.equal(inv2.count(105), 1);
  assert.equal(interact.drops.length, 0);
  assert.equal(picked, 1);
});

// 6. Player-only pressure plates must ignore Spectator while remaining usable in normal play.
test('Simulation playerTriggers flag prevents Spectator pressure-plate activation', () => {
  const cells = new Map();
  const world = {
    chunks: new Map(), edits: new Map(), seed: 'deep-regression',
    loaded: () => true,
    get(x,y,z) { return cells.get(`${x},${y},${z}`) ?? 0; },
    set(x,y,z,v) { cells.set(`${x},${y},${z}`,v); return true; },
  };
  world.set(0,40,0,B.Plate);
  const sim = new Simulation(world);
  sim.specials.set('0,40,0', B.Plate);
  sim.tickNo = 3;
  sim.tick(0.05, {x:0.5,y:40,z:0.5}, false);
  assert.equal(coords.stateOf(world.get(0,40,0)) & 1, 0, 'Spectator triggered plate');
  sim.tickNo = 3;
  sim.tick(0.05, {x:0.5,y:40,z:0.5}, true);
  assert.equal(coords.stateOf(world.get(0,40,0)) & 1, 1, 'interactive player did not trigger plate');
});

function validState() {
  const d = freshWorld('Verification', 'deep-regression', 'survival', 'verification-world');
  const entity = spawnEntity('villager', {x:0,y:40,z:0}, 'Audit NPC');
  entity.profession = 'merchant';
  const drop = { id:'drop-a', stack:{id:105,count:1}, position:{x:1,y:40,z:1}, velocity:{x:0,y:0,z:0}, age:1 };
  d.simulation = { entities:[entity], drops:[drop], weather:'rain', weatherTimer:50, elapsed:1, tickNo:1, cropTimer:1 };
  d.weather = 'rain';
  return d;
}
function mustReject(label, mutate) {
  const d = validState();
  mutate(d);
  assert.throws(() => validateSave(d), undefined, label);
}

// 7. Persistence validator must reject state that could poison maps, physics or AI after reload.
test('Save validation rejects duplicate IDs and malformed entity/player/world state', () => {
  assert.doesNotThrow(() => validateSave(validState()));
  mustReject('duplicate entity id accepted', d => d.simulation.entities.push(clone(d.simulation.entities[0])));
  mustReject('duplicate drop id accepted', d => d.simulation.drops.push(clone(d.simulation.drops[0])));
  mustReject('string grounded accepted', d => d.simulation.entities[0].body.grounded = 'yes');
  mustReject('string flying accepted', d => d.simulation.entities[0].body.flying = 'yes');
  mustReject('malformed knockback accepted', d => d.simulation.entities[0].knockback = {y:0,z:0});
  mustReject('non-string state accepted', d => d.simulation.entities[0].state = 7);
  mustReject('fractional trade counter accepted', d => d.simulation.entities[0].trades = 1.5);
  mustReject('non-boolean player.dead accepted', d => d.player.dead = 'no');
  mustReject('far edit coordinate accepted', d => d.edits['10000001,40,0'] = B.Stone);
  mustReject('fractional simulation tick counter accepted', d => d.simulation.tickNo = 1.5);
  mustReject('negative weather timer accepted', d => d.simulation.weatherTimer = -1);
  mustReject('out-of-cycle crop timer accepted', d => d.simulation.cropTimer = 99);
  mustReject('empty world ID accepted', d => d.id = '');
  mustReject('out-of-cycle world time accepted', d => d.time = -0.2);
});

// 8. Guard the exact weather round-trip repair: worldSimulation.weather must feed Simulation again on load.
test('Weather persistence reconstruction keeps weather in simulation state', () => {
  const src = fs.readFileSync(path.join(__dirname, '../src/persistence/saves.ts'), 'utf8');
  assert.match(src, /simulation:\s*\{\s*\.\.\.sim,\s*weather,\s*\.\.\.parts\.blockEntities,\s*\.\.\.parts\.entities\s*\}/s);
  const world = { chunks:new Map(), edits:new Map(), seed:'x', loaded:()=>true, get:()=>0, set:()=>true };
  const sim = new Simulation(world, { weather:'rain', weatherTimer:37 });
  assert.equal(sim.weather, 'rain');
  assert.equal(sim.weatherTimer, 37);
});

function digestColumn(column) {
  const h = crypto.createHash('sha256');
  for (const row of column.serialize().sort((a,b)=>a.sy-b.sy)) {
    h.update(String(row.sy)); h.update('|');
    if (row.data) h.update(Buffer.from(row.data.buffer, row.data.byteOffset, row.data.byteLength));
    else h.update(String(row.uniform ?? 0));
    h.update(';');
  }
  return h.digest('hex');
}

// 9. Generation must be deterministic across signed chunk coordinates and contain only registered blocks.
test('World generation is deterministic across multiple seeds and signed chunk coordinates', () => {
  const samples = [
    ['jade-a',0,0], ['jade-a',-1,-1], ['jade-a',23,-19],
    ['jade-b',0,0], ['jade-b',32,31], ['jade-c',-30,27],
  ];
  for (const [seed,cx,cz] of samples) {
    const a = generateChunk(cx,cz,seed), b = generateChunk(cx,cz,seed);
    assert.equal(digestColumn(a), digestColumn(b), `nondeterministic seed=${seed} chunk=${cx},${cz}`);
    for (const [sy, section] of a.sections) {
      assert(sy >= coords.MIN_SECTION && sy <= coords.MAX_SECTION, `section out of range ${sy}`);
      if (typeof section.values === 'number') assert.equal(block(section.values).id, section.values & 255);
      else for (const v of section.values) assert.equal(block(v).id, v & 255, `invalid block value ${v}`);
    }
  }
  assert.notEqual(digestColumn(generateChunk(32,31,'jade-a')), digestColumn(generateChunk(32,31,'jade-b')), 'different seeds generated identical sampled wilderness chunk');
});

// 10. Active source must not accidentally resurrect rejected branding/viewmodel experiments.
test('Canonical branding and approved viewmodel regression baseline remain intact', () => {
  const sourceFiles = [];
  const walk = dir => { for (const e of fs.readdirSync(dir,{withFileTypes:true})) { const p=path.join(dir,e.name); if(e.isDirectory()) walk(p); else if(/\.(ts|html|css)$/.test(e.name)) sourceFiles.push(p); } };
  walk(path.join(__dirname,'../src'));
  const joined = sourceFiles.map(f=>fs.readFileSync(f,'utf8')).join('\n');
  assert(!/LanternCraft/i.test(joined), 'active source contains stale LanternCraft branding');
  assert(fs.existsSync(path.join(__dirname,'viewmodel-orientation-regression.test.cjs')), 'viewmodel orientation regression test missing');
});

console.log(`PASS deep functional regression: ${checks} groups`);
