#!/usr/bin/env node
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
};

const { BlockColumn } = require("../src/world/sections.ts");
const { B } = require("../src/world/blocks.ts");
const { encodeEdits } = require("../src/persistence/saves.ts");

function loadWorld() {
  const worldPath = path.join(__dirname, "../src/world/world.ts");
  const source = fs.readFileSync(worldPath, "utf8").replaceAll("import.meta.url", '"file:///jade-harbor/src/world/world.js"');
  const js = ts.transpileModule(source, {
    fileName: worldPath,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  let syncGenerations = 0;
  const mocks = {
    "../core/coords": require("../src/core/coords.ts"),
    "./sections": require("../src/world/sections.ts"),
    "./generator": {
      createGenerator: (_seed) => ({ generate: () => { syncGenerations++; return new BlockColumn(); } }),
      clearGeneratorCache: () => {},
    },
    "./blocks": { B },
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

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

test("generated section decoder rejects malformed, duplicate and out-of-range section records", () => {
  assert.throws(() => BlockColumn.from(null), /Invalid generated chunk sections/);
  assert.throws(() => BlockColumn.from([{ sy: 0, data: new Uint16Array(3) }]), /Invalid generated chunk section/);
  assert.throws(() => BlockColumn.from([{ sy: 0, data: new Uint16Array(4096), uniform: 1 }]), /Invalid generated chunk section/);
  assert.throws(() => BlockColumn.from([{ sy: 0, uniform: 1 }, { sy: 0, uniform: 2 }]), /Invalid generated chunk section/);
  assert.throws(() => BlockColumn.from([{ sy: 100, uniform: 1 }]), /Invalid generated chunk section/);
  assert.throws(() => BlockColumn.from([{ sy: 0, uniform: 1.5 }]), /Invalid generated chunk section/);
  assert.throws(() => BlockColumn.from([{ sy: 0 }]), /Invalid generated chunk section/);
  const data = new Uint16Array(4096); data[0] = B.Stone;
  const column = BlockColumn.from([{ sy: 0, data }, { sy: 1, uniform: B.Gold }]);
  assert.equal(column.get(0, 0, 0), B.Stone);
  assert.equal(column.get(0, 16, 0), B.Gold);
});

test("malformed matching worker payload is rejected and the exact request is retried", () => {
  const previous = global.Worker; FakeWorker.instances = []; global.Worker = FakeWorker;
  try {
    const { World, getSyncGenerations } = loadWorld();
    const world = new World("worker-malformed-payload", {}, true, 3);
    world.ensure(3, 4);
    const first = FakeWorker.instances[0], request = first.messages[0];
    first.onmessage({ data: { ...request, sections: [{ sy: 0, data: new Uint16Array(3) }], elapsedMs: 1 } });
    assert.equal(first.terminated, true);
    assert.equal(world.pending.has("3,4"), true);
    assert.equal(world.chunks.has("3,4"), false);
    const replacement = FakeWorker.instances[1];
    assert.deepEqual(replacement.messages[0], request);
    assert.equal(getSyncGenerations(), 0);
    replacement.onmessage({ data: { ...request, sections: [], elapsedMs: 2 } });
    assert.equal(world.chunks.has("3,4"), true);
    assert.equal(world.pending.has("3,4"), false);
    world.dispose();
  } finally { if (previous === undefined) delete global.Worker; else global.Worker = previous; }
});

test("worker queue recovers after two consecutive failures without synchronous generation", async () => {
  const previous = global.Worker; FakeWorker.instances = []; global.Worker = FakeWorker;
  try {
    const { World, getSyncGenerations } = loadWorld();
    const world = new World("worker-repeated-worker-failure", {}, true, 3);
    world.ensure(0, 0);
    const request = FakeWorker.instances[0].messages[0];
    FakeWorker.instances[0].onerror({ preventDefault() {} });
    assert.equal(FakeWorker.instances.length, 2, "first transient failure keeps immediate restart behavior");
    FakeWorker.instances[1].onerror({ preventDefault() {} });
    assert.equal(FakeWorker.instances.length, 2, "second consecutive failure opens a retry cooldown");
    assert.equal(world.pending.has("0,0"), true);
    assert.equal(getSyncGenerations(), 0);

    await delay(300);
    // No new chunk is needed: the normal streaming loop must still pump the
    // queued request after the retry cooldown expires.
    world.stream(0, 0, 0);
    assert.equal(FakeWorker.instances.length, 3);
    const recovered = FakeWorker.instances[2];
    assert.deepEqual(recovered.messages[0], request);
    recovered.onmessage({ data: { ...request, sections: [], elapsedMs: 2 } });
    assert.equal(world.chunks.has("0,0"), true);
    assert.equal(world.pending.size, 0);
    assert.equal(getSyncGenerations(), 0);
    world.dispose();
  } finally { if (previous === undefined) delete global.Worker; else global.Worker = previous; }
});

test("dense single-section edit encoding remains complete and deterministic", () => {
  const edits = {};
  for (let y = 0; y < 16; y++) for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++)
    edits[`${x},${y},${z}`] = B.Stone;
  const [delta] = encodeEdits(edits);
  assert.equal(delta.key, "0,0,0");
  assert.equal(delta.entries.length, 8192);
  assert.equal(delta.entries[0], 0);
  assert.equal(delta.entries[delta.entries.length - 2], 4095);
  for (let i = 2; i < delta.entries.length; i += 2)
    assert.ok(delta.entries[i] > delta.entries[i - 2], "every local index must remain unique and sorted");
});
