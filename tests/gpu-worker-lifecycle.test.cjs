#!/usr/bin/env node
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Module = require("node:module");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  module._compile(output, filename);
};

const { GpuTimer } = require("../src/render/gpu-timer.ts");

test("GPU timer chooses the newest submitted query among all completed results", () => {
  let id = 0;
  const queries = [];
  const gl = {
    QUERY_RESULT_AVAILABLE: 1, QUERY_RESULT: 2,
    getExtension: () => ({ TIME_ELAPSED_EXT: 3, GPU_DISJOINT_EXT: 4 }),
    createQuery: () => { const q = { id: ++id, available: true, result: id * 1_000_000 }; queries.push(q); return q; },
    beginQuery() {}, endQuery() {}, deleteQuery() {}, getParameter: () => false,
    getQueryParameter: (q, key) => key === 1 ? q.available : q.result,
  };
  const timer = new GpuTimer(gl);
  for (let i = 0; i < 4; i++) {
    for (let frame = 0; frame < 3; frame++) assert.equal(timer.begin(), false);
    assert.equal(timer.begin(), true); timer.end();
  }
  assert.equal(timer.poll(500).timeMs, 4);
  assert.equal(queries.every(q => q), true);
});

test("GPU timer chooses newest available result and retains a newer pending query", () => {
  let id = 0;
  const queries = [];
  const gl = {
    QUERY_RESULT_AVAILABLE: 1, QUERY_RESULT: 2,
    getExtension: () => ({ TIME_ELAPSED_EXT: 3, GPU_DISJOINT_EXT: 4 }),
    createQuery: () => { const q = { id: ++id, available: false, result: id * 1_000_000, deleted: false }; queries.push(q); return q; },
    beginQuery() {}, endQuery() {}, deleteQuery: q => { q.deleted = true; }, getParameter: () => false,
    getQueryParameter: (q, key) => key === 1 ? q.available : q.result,
  };
  const timer = new GpuTimer(gl);
  for (let i = 0; i < 4; i++) {
    for (let frame = 0; frame < 3; frame++) timer.begin();
    timer.begin(); timer.end();
  }
  queries[0].available = true;
  queries[1].available = true;
  queries[2].available = true;
  assert.equal(timer.poll(600).timeMs, 3);
  assert.equal(queries[3].deleted, false);
  queries[3].available = true;
  assert.equal(timer.poll(616).timeMs, 4);
  assert.equal(queries[3].deleted, true);
});

function loadWorld(FakeWorker) {
  const worldPath = path.join(__dirname, "../src/world/world.ts");
  const source = fs.readFileSync(worldPath, "utf8").replaceAll("import.meta.url", '"file:///jade-harbor/src/world/world.js"');
  const js = ts.transpileModule(source, {
    fileName: worldPath,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  class FakeColumn {
    constructor() { this.sections = new Map(); }
    set() {}
    static from() { return new FakeColumn(); }
  }
  let syncGenerations = 0;
  const mocks = {
    "../core/coords": {
      CHUNK: 16, MIN_Y: -64, MAX_Y: 320, MIN_SECTION: -4, MAX_SECTION: 19,
      sectionKey: (x,y,z) => `${x},${y},${z}`, index: () => 0,
      chunkCoord: n => Math.floor(n / 16), localCoord: n => ((n % 16) + 16) % 16,
      chunkKey: (x,z) => `${x},${z}`, blockKey: (x,y,z) => `${x},${y},${z}`,
    },
    "./sections": { BlockColumn: FakeColumn },
    "./generator": {
      createGenerator: (_seed) => ({ generate: () => { syncGenerations++; return new FakeColumn(); } }),
      clearGeneratorCache: () => {},
    },
    "./blocks": { B: { Air: 0 } },
    "./metropolis/plan": { urbanAt: () => undefined },
    "./landmarks/builders": { landmarkAt: () => undefined },
  };
  const moduleObject = { exports: {} };
  Function("require", "module", "exports", js)(id => {
    if (Object.prototype.hasOwnProperty.call(mocks, id)) return mocks[id];
    return require(id);
  }, moduleObject, moduleObject.exports);
  return { World: moduleObject.exports.World, getSyncGenerations: () => syncGenerations };
}

class FakeWorker {
  static instances = [];
  constructor() { this.messages = []; this.terminated = false; this.onmessage = null; this.onerror = null; this.onmessageerror = null; FakeWorker.instances.push(this); }
  postMessage(message) { this.messages.push(message); }
  terminate() { this.terminated = true; }
}

test("rapid streaming posts only one active job and prunes obsolete queued jobs", () => {
  const previous = global.Worker; FakeWorker.instances = []; global.Worker = FakeWorker;
  try {
    const { World } = loadWorld(FakeWorker);
    const world = new World("worker-stream", {}, true, 3);
    world.stream(0, 0, 1);
    const worker = FakeWorker.instances[0];
    assert.equal(worker.messages.length, 1);
    assert.equal(world.workerQueue.length, 3);
    world.stream(1600, 1600, 1);
    assert.equal(world.pending.size, 4);
    assert.equal(worker.messages.length, 1, "queued requests are not posted before the active request finishes");
    assert.equal(world.workerQueue.length, 4);
    assert.ok(world.workerQueue.every(r => world.pending.has(`${r.cx},${r.cz}`)));

    const stale = worker.messages[0];
    worker.onmessage({ data: { ...stale, sections: [], elapsedMs: 1 } });
    assert.equal(world.chunks.has(`${stale.cx},${stale.cz}`), false);
    assert.equal(worker.messages.length, 2);
    assert.ok(world.pending.has(`${worker.messages[1].cx},${worker.messages[1].cz}`));

    for (let i = 1; i < 5; i++) {
      const request = worker.messages[i];
      assert.ok(request, `request ${i} should be dispatched in order`);
      worker.onmessage({ data: { ...request, sections: [], elapsedMs: 1 } });
    }
    assert.equal(world.pending.size, 0);
    assert.equal(world.chunks.size, 4);
    world.dispose();
  } finally { if (previous === undefined) delete global.Worker; else global.Worker = previous; }
});

test("worker crash restarts the worker and retries active generation without main-thread fallback", () => {
  const previous = global.Worker; FakeWorker.instances = []; global.Worker = FakeWorker;
  try {
    const { World, getSyncGenerations } = loadWorld(FakeWorker);
    const world = new World("worker-restart", {}, true, 3);
    world.ensure(0, 0);
    const first = FakeWorker.instances[0];
    assert.equal(first.messages.length, 1);
    const request = first.messages[0];
    first.onerror({ preventDefault() {} });
    assert.equal(first.terminated, true);
    assert.equal(FakeWorker.instances.length, 2);
    const replacement = FakeWorker.instances[1];
    assert.deepEqual(replacement.messages[0], request);
    assert.equal(getSyncGenerations(), 0, "worker failure must not run expensive generation synchronously on the main thread");
    replacement.onmessage({ data: { ...request, sections: [], elapsedMs: 2 } });
    assert.equal(world.chunks.has("0,0"), true);
    assert.equal(world.pending.size, 0);
    world.dispose();
  } finally { if (previous === undefined) delete global.Worker; else global.Worker = previous; }
});
test("malformed worker reply retries the active request instead of stranding its pending ticket", () => {
  const previous = global.Worker; FakeWorker.instances = []; global.Worker = FakeWorker;
  try {
    const { World, getSyncGenerations } = loadWorld(FakeWorker);
    const world = new World("worker-malformed", {}, true, 3);
    world.ensure(3, 4);
    const first = FakeWorker.instances[0];
    const request = first.messages[0];
    first.onmessage({ data: { ...request, ticket: request.ticket + 100, sections: [], elapsedMs: 1 } });
    assert.equal(first.terminated, true);
    assert.equal(world.pending.has("3,4"), true);
    assert.equal(FakeWorker.instances.length, 2);
    const replacement = FakeWorker.instances[1];
    assert.deepEqual(replacement.messages[0], request);
    assert.equal(getSyncGenerations(), 0);
    replacement.onmessage({ data: { ...request, sections: [], elapsedMs: 1 } });
    assert.equal(world.chunks.has("3,4"), true);
    assert.equal(world.pending.has("3,4"), false);
    world.dispose();
  } finally { if (previous === undefined) delete global.Worker; else global.Worker = previous; }
});


test("stale in-flight generation is preempted only after grace when current-area work is waiting", () => {
  const previous = global.Worker; FakeWorker.instances = []; global.Worker = FakeWorker;
  try {
    const { World } = loadWorld(FakeWorker);
    const world = new World("worker-stale-preempt", {}, true, 3);
    world.stream(0, 0, 1);
    const oldWorker = FakeWorker.instances[0];
    const staleRequest = oldWorker.messages[0];
    const staleHandler = oldWorker.onmessage;

    world.stream(1600, 1600, 1);
    assert.equal(oldWorker.terminated, false, "normal worker work gets a grace period");
    assert.equal(FakeWorker.instances.length, 1);
    assert.ok(world.workerQueue.length > 0, "current-area requests wait behind the stale request");

    world.workerBusySince = performance.now() - 121;
    world.stream(1600, 1600, 1);
    assert.equal(oldWorker.terminated, true, "obsolete worker is stopped after the grace period");
    assert.equal(FakeWorker.instances.length, 2, "replacement worker is created");
    const replacement = FakeWorker.instances[1];
    assert.equal(replacement.messages.length, 1, "current-area work is dispatched immediately");
    assert.ok(world.streamingDiagnostics.workerPreemptions >= 1);

    // A late event from the terminated worker cannot mutate the current world.
    staleHandler({ data: { ...staleRequest, sections: [], elapsedMs: 1 } });
    assert.equal(world.chunks.has(`${staleRequest.cx},${staleRequest.cz}`), false);
    assert.equal(world.workerBusy.ticket, replacement.messages[0].ticket,
      "the replacement worker owns the current-area request");

    let cursor = 0;
    while (cursor < replacement.messages.length) {
      const request = replacement.messages[cursor++];
      replacement.onmessage({ data: { ...request, sections: [], elapsedMs: 1 } });
    }
    assert.ok(world.pending.size <= 8);
    assert.ok(world.workerQueue.every(request => world.pending.has(`${request.cx},${request.cz}`)));
    world.dispose();
  } finally { if (previous === undefined) delete global.Worker; else global.Worker = previous; }
});

test("stale worker is not preempted when no current-area replacement is waiting", () => {
  const previous = global.Worker; FakeWorker.instances = []; global.Worker = FakeWorker;
  try {
    const { World } = loadWorld(FakeWorker);
    const world = new World("worker-no-preempt", {}, true, 3);
    world.ensure(0, 0);
    const worker = FakeWorker.instances[0];
    world.pending.delete("0,0");
    world.workerQueue.length = 0;
    world.workerBusySince = performance.now() - 500;
    assert.equal(world.preemptStaleWorkerRequest(), false);
    assert.equal(worker.terminated, false);
    assert.equal(FakeWorker.instances.length, 1);
    world.dispose();
  } finally { if (previous === undefined) delete global.Worker; else global.Worker = previous; }
});
