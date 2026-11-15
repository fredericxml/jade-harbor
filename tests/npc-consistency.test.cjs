#!/usr/bin/env node
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  module._compile(output, filename);
};

const { B } = require("../src/world/blocks.ts");
const { stateOf, packed } = require("../src/core/coords.ts");
const { Entities, spawnEntity } = require("../src/game/entities.ts");
const { Simulation } = require("../src/game/simulation.ts");

function makeWorld() {
  const cells = new Map();
  const world = {
    terrainLayout: 3,
    landmarkPlan: undefined,
    seed: "npc-consistency",
    cityPlan: undefined,
    edits: new Map(),
    chunks: new Map(),
    get(x, y, z) { return cells.get(`${x},${y},${z}`) ?? B.Air; },
    set(x, y, z, value) { cells.set(`${x},${y},${z}`, value); return true; },
    loaded(x, z) { return Math.floor(x / 16) === 0 && Math.floor(z / 16) === 0; },
  };
  return world;
}
function makeEntities(world, residents, otherActors = []) {
  const entities = new Entities(world, { entities: [] });
  const active = new Set(residents.filter(e => e.activeForTest).map(e => e.id));
  entities.life = { active, activeActors: [] };
  entities.list = [...residents, ...otherActors];
  return entities;
}
function resident(id, position, activeForTest = false) {
  const e = spawnEntity("villager", position, id);
  e.id = id;
  e.activeForTest = activeForTest;
  return e;
}

test("targeting cannot select an inactive resident even when it is closer than an active actor", () => {
  const world = makeWorld();
  const active = resident("active-near", { x: 3, y: 0, z: 0 }, true);
  const inactive = resident("inactive-closer", { x: 1.5, y: 0, z: 0 }, false);
  const entities = makeEntities(world, [active, inactive]);

  assert.deepEqual(entities.renderActors(), [active]);
  assert.equal(
    entities.target({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 4),
    active,
  );
});

test("active resident, panda and spirit remain targetable; dead and unloaded actors do not", () => {
  const world = makeWorld();
  const active = resident("active", { x: 1.5, y: 0, z: 0 }, true);
  const panda = spawnEntity("panda", { x: 2, y: 0, z: 0 }, "Panda");
  const spirit = spawnEntity("spirit", { x: 3, y: 0, z: 0 }, "Spirit");
  const inactive = resident("inactive", { x: 1, y: 0, z: 0 }, false);
  const dead = resident("dead", { x: 1.5, y: 0, z: 0 }, true);
  dead.health = 0;
  const unloaded = resident("unloaded", { x: 18, y: 0, z: 0 }, true);
  const entities = makeEntities(world, [active, inactive, dead, unloaded], [panda, spirit]);

  const target = entities.target({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 4);
  assert.equal(target, active);
  entities.list = [panda, spirit];
  assert.equal(entities.target({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 4), panda);
  entities.list = [spirit];
  assert.equal(entities.target({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 4), spirit);
});

test("pressure-plate occupants use active actors and drops, with live chunk gating", () => {
  const world = makeWorld();
  const active = resident("active-on-plate", { x: 0.5, y: 40, z: 0.5 }, true);
  const inactive = resident("inactive-on-plate", { x: 0.5, y: 40, z: 0.5 }, false);
  const panda = spawnEntity("panda", { x: 0.5, y: 40, z: 0.5 }, "Panda");
  const entities = makeEntities(world, [active, inactive], [panda]);
  entities.drops = [
    { id: "loaded-drop", stack: { id: B.Stone, count: 1 }, position: { x: 0.5, y: 40, z: 0.5 }, velocity: { x: 0, y: 0, z: 0 }, age: 1 },
    { id: "unloaded-drop", stack: { id: B.Stone, count: 1 }, position: { x: 18.5, y: 40, z: 0.5 }, velocity: { x: 0, y: 0, z: 0 }, age: 1 },
  ];
  const occupants = entities.occupantPositions;
  assert.deepEqual(occupants, [active.body.position, panda.body.position, entities.drops[0].position, entities.drops[1].position]);
  assert.equal(entities.occupantPositions, occupants, "occupant list remains cached between invalidations");

  const sim = new Simulation(world);
  world.set(0, 40, 0, packed(B.Plate, 0));
  sim.specials.set("0,40,0", packed(B.Plate, 0));
  sim.occupants = occupants;
  sim.circuits();
  assert.equal(stateOf(world.get(0, 40, 0)) & 1, 1, "active actor/drop presses the plate");

  // Remove the active resident and drop; the inactive persistent resident must
  // not keep the plate pressed after the cache is refreshed.
  entities.life.active.clear();
  entities.life.activeActors.length = 0;
  panda.body.position.x = 4;
  entities.drops = [];
  entities.refreshOccupants();
  sim.occupants = entities.occupantPositions;
  sim.circuits();
  assert.equal(stateOf(world.get(0, 40, 0)) & 1, 0, "inactive resident cannot press the plate");
});

test("occupant cache invalidates after list replacement and excludes dead actors", () => {
  const world = makeWorld();
  const first = resident("first", { x: 1, y: 40, z: 1 }, true);
  const entities = makeEntities(world, [first]);
  assert.deepEqual(entities.occupantPositions, [first.body.position]);

  const dead = resident("dead", { x: 2, y: 40, z: 2 }, true);
  dead.health = 0;
  const replacement = resident("replacement", { x: 3, y: 40, z: 3 }, true);
  entities.life.active.clear();
  entities.life.active.add(replacement.id);
  entities.list = [dead, replacement];
  const next = entities.occupantPositions;
  assert.deepEqual(next, [replacement.body.position]);
  assert.notEqual(next[0], first.body.position);
});

test("pressure plate releases an actor whose cached position belongs to an unloaded chunk", () => {
  const world = makeWorld();
  const loaded = new Set(["0,0", "1,0"]);
  world.loaded = (x,z) => loaded.has(`${Math.floor(x/16)},${Math.floor(z/16)}`);
  const actor = resident("edge-actor", { x: 16.1, y: 40, z: 0.5 }, true);
  const entities = makeEntities(world, [actor]);
  const sim = new Simulation(world);
  world.set(15, 40, 0, packed(B.Plate, 0));
  sim.specials.set("15,40,0", packed(B.Plate, 0));
  sim.occupants = entities.occupantPositions;
  sim.circuits();
  assert.equal(stateOf(world.get(15, 40, 0)) & 1, 1);
  loaded.delete("1,0");
  sim.circuits();
  assert.equal(stateOf(world.get(15, 40, 0)) & 1, 0);
});

test("shared interaction eligibility rejects inactive, dead, unloaded and out-of-range actors", () => {
  const world = makeWorld();
  const active = resident("active", { x: 2, y: 0, z: 0 }, true);
  const inactive = resident("inactive", { x: 1, y: 0, z: 0 }, false);
  const dead = resident("dead", { x: 2, y: 0, z: 0 }, true);
  dead.health = 0;
  const unloaded = resident("unloaded", { x: 18, y: 0, z: 0 }, true);
  const entities = makeEntities(world, [active, inactive, dead, unloaded]);
  const origin = { x: 0, y: 0, z: 0 };
  assert.equal(entities.canInteractWith(active, origin, 5), true);
  assert.equal(entities.canInteractWith(inactive, origin, 5), false);
  assert.equal(entities.canInteractWith(dead, origin, 5), false);
  assert.equal(entities.canInteractWith(unloaded, origin, 5), false);
  assert.equal(entities.canInteractWith(active, origin, 1), false);
});

test("pressure plate recognizes a cached active actor when its chunk loads", () => {
  const world = makeWorld();
  const loaded = new Set(["0,0"]);
  world.loaded = (x,z) => loaded.has(`${Math.floor(x/16)},${Math.floor(z/16)}`);
  const actor = resident("edge-actor", { x: 16.1, y: 40, z: 0.5 }, true);
  const entities = makeEntities(world, [actor]);
  const sim = new Simulation(world);
  world.set(15, 40, 0, packed(B.Plate, 0));
  sim.specials.set("15,40,0", packed(B.Plate, 0));
  sim.occupants = entities.occupantPositions;
  sim.circuits();
  assert.equal(stateOf(world.get(15, 40, 0)) & 1, 0);
  loaded.add("1,0");
  sim.circuits();
  assert.equal(stateOf(world.get(15, 40, 0)) & 1, 1);
});
