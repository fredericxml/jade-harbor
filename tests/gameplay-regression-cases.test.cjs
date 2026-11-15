#!/usr/bin/env node
"use strict";

// legacy source source stability baseline reproductions.
// These tests intentionally PASS when the audited defect is still reproducible.
// Behavioral corrections must invert each assertion to the desired result.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
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
const { packed, stateOf } = require("../src/core/coords.ts");
const { Simulation } = require("../src/game/simulation.ts");
const { Entities } = require("../src/game/entities.ts");
const { GpuTimer } = require("../src/render/gpu-timer.ts");

test("circuit-controlled door closes after its wire is removed", () => {
  const cells = new Map();
  const world = {
    chunks: new Map(),
    edits: new Map(),
    get(x, y, z) { return cells.get(`${x},${y},${z}`) ?? B.Air; },
    set(x, y, z, value) { cells.set(`${x},${y},${z}`, value); return true; },
    loaded: () => true,
  };
  const sim = new Simulation(world);
  world.set(0, 40, 0, packed(B.Switch, 1));
  world.set(1, 40, 0, B.Wire);
  world.set(2, 40, 0, B.Door);
  world.set(2, 41, 0, packed(B.Door, 8));
  for (const key of ["0,40,0", "1,40,0", "2,40,0", "2,41,0"])
    sim.specials.set(key, world.get(...key.split(",").map(Number)));

  sim.circuits();
  assert.equal(stateOf(world.get(2, 40, 0)) & 4, 4, "precondition: powered door opens");
  assert.equal(stateOf(world.get(2, 41, 0)) & 4, 4, "precondition: upper door opens");

  world.set(1, 40, 0, B.Air);
  sim.specials.delete("1,40,0"); // equivalent to re-indexing after wire removal
  sim.circuits();

  assert.equal(stateOf(world.get(2, 40, 0)) & 4, 0);
  assert.equal(stateOf(world.get(2, 41, 0)) & 4, 0);
  assert.equal(stateOf(world.get(2, 40, 0)) & 16, 0);
  assert.equal(stateOf(world.get(2, 41, 0)) & 16, 0);
  console.log("FIX VERIFIED: both door halves close after circuit disconnection");
});

test("inactive/unrendered resident cannot win player targeting", () => {
  const world = {
    terrainLayout: 3,
    get: () => B.Air,
    loaded: () => true,
  };
  const entities = new Entities(world, { entities: [] });
  const actors = [];
  for (let i = 0; i < 97; i++) {
    actors.push({
      id: `resident-${i}`,
      kind: "villager",
      health: 20,
      body: { position: i === 96 ? { x: 2, y: 0, z: 0 } : { x: 2, y: 0, z: 10 + i } },
    });
  }
  entities.life = { active: new Set(actors.slice(0, 96).map((actor) => actor.id)), activeActors: [] };
  entities.list = actors;

  const rendered = entities.renderActors();
  assert.equal(rendered.length, 96);
  assert.equal(rendered.includes(actors[96]), false);

  const selected = entities.target({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 4);
  assert.equal(selected, null);
  console.log("FIX VERIFIED: invisible 97th resident is excluded from targeting");
});

test("GPU timer selects the newest completed query when several become ready together", () => {
  let nextId = 0;
  const queries = [];
  const gl = {
    QUERY_RESULT_AVAILABLE: 1,
    QUERY_RESULT: 2,
    getExtension: () => ({ TIME_ELAPSED_EXT: 3, GPU_DISJOINT_EXT: 4 }),
    createQuery: () => {
      const query = { id: ++nextId, available: true, result: nextId * 1_000_000 };
      queries.push(query);
      return query;
    },
    beginQuery: () => {},
    endQuery: () => {},
    deleteQuery: () => {},
    getParameter: () => false,
    getQueryParameter: (query, key) => key === 1 ? query.available : query.result,
  };
  const timer = new GpuTimer(gl);
  for (let sample = 0; sample < 4; sample++) {
    for (let frame = 0; frame < 3; frame++) assert.equal(timer.begin(), false);
    assert.equal(timer.begin(), true);
    timer.end();
  }
  assert.equal(queries.length, 4);
  const result = timer.poll(500);
  assert.equal(result.timeMs, 4);
  assert.equal(result.completedAt, 500);
  console.log("FIX VERIFIED: poll() returns the newest 4 ms completed query");
});

test("obsolete chunk jobs are pruned before dispatch after stream moves away", () => {
  const worldSourcePath = path.join(__dirname, "../src/world/world.ts");
  const source = fs.readFileSync(worldSourcePath, "utf8").replaceAll(
    "import.meta.url",
    '"file:///jade-harbor/src/world/world.js"',
  );
  const js = ts.transpileModule(source, {
    fileName: worldSourcePath,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  class FakeWorker {
    static instances = [];
    constructor(url, options) {
      this.url = String(url);
      this.options = options;
      this.messages = [];
      this.terminated = false;
      FakeWorker.instances.push(this);
    }
    postMessage(message) { this.messages.push(message); }
    terminate() { this.terminated = true; }
  }
  const previousWorker = global.Worker;
  global.Worker = FakeWorker;

  class FakeColumn {}
  const mocks = {
    "../core/coords": {
      CHUNK: 16, MIN_Y: -64, MAX_Y: 320, MIN_SECTION: -4, MAX_SECTION: 19,
      sectionKey: (x, y, z) => `${x},${y},${z}`,
      index: () => 0,
      chunkCoord: (n) => Math.floor(n / 16),
      localCoord: (n) => ((n % 16) + 16) % 16,
      chunkKey: (x, z) => `${x},${z}`,
      blockKey: (x, y, z) => `${x},${y},${z}`,
    },
    "./sections": { BlockColumn: FakeColumn },
    "./generator": {
      createGenerator: (_seed) => ({ generate: () => new FakeColumn() }),
      clearGeneratorCache: () => {},
    },
    "./blocks": { B: { Air: 0 } },
    "./metropolis/plan": { urbanAt: () => undefined },
    "./landmarks/builders": { landmarkAt: () => undefined },
  };
  const moduleObject = { exports: {} };
  try {
    Function("require", "module", "exports", js)(
      (id) => Object.prototype.hasOwnProperty.call(mocks, id) ? mocks[id] : require(id),
      moduleObject,
      moduleObject.exports,
    );
    const { World } = moduleObject.exports;
    const world = new World("worker-queue-regression", {}, true, 3);
    const worker = FakeWorker.instances[0];
    assert.ok(worker);

    world.stream(0, 0, 1);
    const firstAreaMessages = worker.messages.length;
    assert.equal(firstAreaMessages, 1, "only one active request is posted at a time");
    assert.equal(world.workerQueue.length, 3);
    world.stream(1600, 1600, 1);

    assert.equal(world.pending.size, 4, "only the latest area's four jobs remain pending");
    assert.equal(worker.messages.length, 1, "obsolete queued jobs must never be posted");
    assert.equal(world.workerQueue.length, 4, "only latest-area work remains queued");
    const staleQueued = world.workerQueue.filter(message => !world.pending.has(`${message.cx},${message.cz}`));
    assert.equal(staleQueued.length, 0);
    const staleActive = worker.messages[0];
    worker.onmessage({ data: { ...staleActive, sections: [], elapsedMs: 1 } });
    assert.equal(world.chunks.has(`${staleActive.cx},${staleActive.cz}`), false, "late stale result must be ignored");
    assert.equal(worker.messages.length, 2, "next worker request belongs to the new streaming area");
    assert.ok(world.pending.has(`${worker.messages[1].cx},${worker.messages[1].cz}`));
    console.log("FIX VERIFIED: obsolete queued jobs are pruned and stale active result is ignored");
    world.dispose();
  } finally {
    if (previousWorker === undefined) delete global.Worker;
    else global.Worker = previousWorker;
  }
});
