const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
function loadTs(relative, stubs = {}) {
  const filename = path.join(root, relative);
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  const mod = { exports: {} };
  const localRequire = (id) => {
    if (Object.prototype.hasOwnProperty.call(stubs, id)) return stubs[id];
    throw new Error(`Unexpected module in isolated NPC test: ${id}`);
  };
  new Function('require', 'module', 'exports', output)(localRequire, mod, mod.exports);
  return mod.exports;
}

const occupancy = loadTs('src/game/occupancy.ts');
const B = { Door: 2, Lava: 3, Water: 4 };
const block = (id) => ({ solid: id === 1 || id === 5 });
const boxes = (id) => id === 1 || id === 5 ? [[0,0,0,1,1,1]] : [];
const collides = (world, p, height, radius) => {
  for (let x = Math.floor(p.x-radius); x <= Math.floor(p.x+radius); x++)
    for (let z = Math.floor(p.z-radius); z <= Math.floor(p.z+radius); z++)
      for (let y = Math.floor(p.y+.01); y <= Math.floor(p.y+height-.01); y++)
        if (block(world.get(x,y,z)).solid) return true;
  return false;
};
const coords = { idOf: (v) => v, chunkCoord: (v) => Math.floor(v/16), MIN_Y: -64, MAX_Y: 320 };
const pathfinder = loadTs('src/game/navigation/pathfinder.ts', {
  '../../core/coords': coords,
  '../../world/blocks': { B, block, boxes },
  '../../player/physics': { collides },
});

function flatWorld(wall = false) {
  return {
    navRevision: 0,
    loaded: () => true,
    get(x,y,z) {
      if (y === 0) return 1;
      if (wall && x === 1 && y === 1 && z === 0) return 5;
      return 0;
    },
  };
}

test('stationary lower-ID NPC is not treated as a permanent crowd roadblock', () => {
  const shouldYield = occupancy.shouldYieldToMovingActor;
  assert.equal(shouldYield('npc-b', {x:0,y:1,z:0}, {x:1,y:0,z:0}, 'npc-a', {x:.4,y:1,z:0}, {x:0,y:0,z:0}), false);
});

test('NPC yields when a moving higher-priority actor is converging into the same space', () => {
  const shouldYield = occupancy.shouldYieldToMovingActor;
  assert.equal(shouldYield('npc-b', {x:0,y:1,z:0}, {x:1,y:0,z:0}, 'npc-a', {x:1,y:1,z:0}, {x:-1,y:0,z:0}), true);
});

test('NPC does not yield to a same-lane actor moving away or to a lower-priority actor', () => {
  const shouldYield = occupancy.shouldYieldToMovingActor;
  assert.equal(shouldYield('npc-b', {x:0,y:1,z:0}, {x:-1,y:0,z:0}, 'npc-a', {x:1,y:1,z:0}, {x:1,y:0,z:0}), false);
  assert.equal(shouldYield('npc-a', {x:0,y:1,z:0}, {x:1,y:0,z:0}, 'npc-b', {x:1,y:1,z:0}, {x:-1,y:0,z:0}), false);
});

test('short unobstructed street circuits move immediately without waiting for A* queue', () => {
  const world = flatWorld();
  const nav = new pathfinder.Navigation(world);
  let p = {x:.5,y:1.002,z:.5};
  const target = {x:4.5,y:1.002,z:.5};
  let moved = 0;
  for (let i=0; i<16; i++) {
    const next = nav.steer('resident:direct', p, target, .05);
    if (!next) break;
    assert.ok(Math.hypot(next.x-p.x,next.z-p.z)>.08);
    p = next;
    moved++;
  }
  assert.ok(moved >= 5, `expected several immediate local steps, got ${moved}`);
  assert.equal(nav.searchesStarted, 0, 'clear local circuit must bypass global A* queue');
  assert.equal(nav.agents.get('resident:direct').status, 'arrived');
});

test('a dense group of nearby residents can all advance on clear short routes in the same tick', () => {
  const world = flatWorld();
  const nav = new pathfinder.Navigation(world);
  let moved = 0;
  for (let i=0; i<48; i++) {
    const p = {x:.5,y:1.002,z:i*2+.5};
    const target = {x:4.5,y:1.002,z:i*2+.5};
    const next = nav.steer(`resident:${String(i).padStart(3,'0')}`, p, target, .05);
    if (next && Math.hypot(next.x-p.x,next.z-p.z)>.08) moved++;
  }
  assert.equal(moved,48,'all 48 active resident slots receive immediate local movement');
  assert.equal(nav.searchesStarted,0,'open-street crowd does not enqueue 48 redundant A* searches');
});

test('blocked local segment falls back to the existing A* pathfinder', () => {
  const world = flatWorld(true);
  const nav = new pathfinder.Navigation(world);
  const p = {x:.5,y:1.002,z:.5};
  const target = {x:4.5,y:1.002,z:.5};
  const next = nav.steer('resident:blocked', p, target, .05);
  assert.equal(next, null, 'blocked direct probe waits for safe A* route');
  assert.equal(nav.searchesStarted, 1);
  assert.ok(nav.agents.get('resident:blocked').search, 'A* fallback remains active');
});

test('entities uses predictive crowd yielding and keeps the bounded active simulation budget', () => {
  const entities = fs.readFileSync(path.join(root, 'src/game/entities.ts'), 'utf8');
  const presence = fs.readFileSync(path.join(root, 'src/game/city-life/presence.ts'), 'utf8');
  assert.ok(entities.includes('shouldYieldToMovingActor(e.id,p,v,q.id,q.body.position,q.body.velocity)'));
  assert.ok(entities.includes('if(crowded) {v.x*=.35;v.z*=.35;}'));
  assert.ok(presence.includes('active: 48'));
  assert.ok(pathfinderSource().includes('not make every unobstructed local trip wait behind the shared A* queue'));
});

function pathfinderSource() {
  return fs.readFileSync(path.join(root, 'src/game/navigation/pathfinder.ts'), 'utf8');
}
