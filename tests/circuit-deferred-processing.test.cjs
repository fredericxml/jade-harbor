#!/usr/bin/env node
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => {
  const fs = require("node:fs");
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  module._compile(output, filename);
};
const { B } = require("../src/world/blocks.ts");
const { packed, stateOf } = require("../src/core/coords.ts");
const { Simulation } = require("../src/game/simulation.ts");

function makeWorld() {
  const cells = new Map();
  const chunks = new Map();
  const loaded = new Set(["0,0"]);
  const world = {
    chunks, edits: new Map(),
    loaded(x,z) { return loaded.has(`${Math.floor(x/16)},${Math.floor(z/16)}`); },
    get(x,y,z) { return cells.get(`${x},${y},${z}`) ?? B.Air; },
    set(x,y,z,value) { cells.set(`${x},${y},${z}`,value); return true; },
    addChunk(cx,cz) {
      loaded.add(`${cx},${cz}`);
      chunks.set(`${cx},${cz}`, {cx,cz,revision:0,blocks:{sections:new Map()}});
    },
    setLoaded(x,y,z,value) { cells.set(`${x},${y},${z}`,value); },
  };
  return world;
}

test("circuit-owned two-block door closes and clears ownership when its wire is removed", () => {
  const world = makeWorld();
  const sim = new Simulation(world);
  const entries = [
    ["0,40,0", packed(B.Switch,1)],
    ["1,40,0", B.Wire],
    ["2,40,0", B.Door],
    ["2,41,0", packed(B.Door,8)],
  ];
  for (const [key,value] of entries) {
    const [x,y,z] = key.split(",").map(Number);
    world.set(x,y,z,value);
    sim.specials.set(key,value);
  }
  sim.circuits();
  assert.equal(stateOf(world.get(2,40,0)) & 4,4);
  assert.equal(stateOf(world.get(2,41,0)) & 4,4);
  assert.equal(stateOf(world.get(2,40,0)) & 16,16);
  assert.equal(stateOf(world.get(2,41,0)) & 16,16);

  world.set(1,40,0,B.Air);
  sim.specials.delete("1,40,0");
  sim.circuits();
  assert.equal(stateOf(world.get(2,40,0)) & 4,0);
  assert.equal(stateOf(world.get(2,41,0)) & 4,0);
  assert.equal(stateOf(world.get(2,40,0)) & 16,0);
  assert.equal(stateOf(world.get(2,41,0)) & 16,0);
});

test("manual two-block door without circuit ownership remains manually open", () => {
  const world = makeWorld();
  const sim = new Simulation(world);
  const lower = packed(B.Door,4);
  const upper = packed(B.Door,8|4);
  world.set(4,40,4,lower);
  world.set(4,41,4,upper);
  sim.specials.set("4,40,4",lower);
  sim.specials.set("4,41,4",upper);
  sim.circuits();
  assert.equal(stateOf(world.get(4,40,4)) & 4,4);
  assert.equal(stateOf(world.get(4,41,4)) & 4,4);
  assert.equal(stateOf(world.get(4,40,4)) & 16,0);
  assert.equal(stateOf(world.get(4,41,4)) & 16,0);
});

test("unloaded chunk work is deferred instead of occupying the live update queue", () => {
  const world = makeWorld();
  const sim = new Simulation(world);
  world.setLoaded(16,40,0,B.Sand);
  sim.changed(16,40,0);
  assert.equal(sim.queue.has("16,40,0"),false);
  assert.equal(sim.deferred.get("1,0")?.has("16,40,0"),true);
  assert.equal(sim.serialize().pendingTicks.includes("16,40,0"),true);
});

test("deferred work is promoted and processed when its chunk becomes resident", () => {
  const world = makeWorld();
  const sim = new Simulation(world);
  world.setLoaded(16,40,0,B.Sand);
  sim.changed(16,40,0);
  world.addChunk(1,0);
  sim.indexChunks();
  assert.equal(sim.deferred.has("1,0"),false);
  assert.equal(sim.queue.has("16,40,0"),true);
  sim.updates(64);
  assert.equal(world.get(16,40,0),B.Air);
  assert.equal(world.get(16,39,0),B.Sand);
});

test("deferred work survives serialize/restore and activates after chunk reload", () => {
  const world = makeWorld();
  const first = new Simulation(world);
  world.setLoaded(32,40,0,B.Gravel);
  first.changed(32,40,0);
  const saved = first.serialize();
  assert.ok(saved.pendingTicks.includes("32,40,0"));

  const restored = new Simulation(world,saved);
  assert.equal(restored.queue.has("32,40,0"),false);
  assert.equal(restored.deferred.get("2,0")?.has("32,40,0"),true);
  world.addChunk(2,0);
  restored.indexChunks();
  assert.equal(restored.queue.has("32,40,0"),true);
  restored.updates(64);
  assert.equal(world.get(32,39,0),B.Gravel);
});

test("large multi-source circuit propagation is not truncated at 4096 queued sources", () => {
  const world = makeWorld();
  const sim = new Simulation(world);
  const count = 4100;
  for (let i=0;i<count;i++) {
    const x=i*3;
    const switchKey=`${x},50,0`, wireKey=`${x+1},50,0`;
    const switchValue=packed(B.Switch,1);
    world.set(x,50,0,switchValue);
    world.set(x+1,50,0,B.Wire);
    sim.specials.set(switchKey,switchValue);
    sim.specials.set(wireKey,B.Wire);
  }
  sim.circuits();
  assert.equal(stateOf(world.get((count-1)*3+1,50,0)),14);
});

test("deferred chunk work does not consume the active update budget", () => {
  const world = makeWorld();
  const sim = new Simulation(world);
  // A large cold backlog is retained separately from live work.
  for (let i=0;i<1000;i++) {
    const x=1600+i*16;
    world.setLoaded(x,40,0,B.Sand);
    sim.changed(x,40,0);
  }
  world.setLoaded(4,40,4,B.Sand);
  sim.changed(4,40,4);
  assert.equal(sim.queue.has("4,40,4"),true);
  sim.updates(1);
  assert.equal(world.get(4,39,4),B.Sand);
  assert.ok(sim.deferred.size>0);
});
