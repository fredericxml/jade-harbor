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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  module._compile(output, filename);
};
const { GpuTimer } = require("../src/render/gpu-timer.ts");

function fixture() {
  let disjoint = false, id = 0;
  const queries = [];
  const gl = {
    QUERY_RESULT_AVAILABLE: 1, QUERY_RESULT: 2,
    getExtension: () => ({ TIME_ELAPSED_EXT: 3, GPU_DISJOINT_EXT: 4 }),
    createQuery: () => { const q = { id: ++id, available: false, result: id * 1_000_000, deleted: false }; queries.push(q); return q; },
    beginQuery() {}, endQuery() {}, deleteQuery: q => { q.deleted = true; },
    getParameter: () => disjoint,
    getQueryParameter: (q, key) => key === 1 ? q.available : q.result,
  };
  return { gl, queries, setDisjoint: value => { disjoint = value; } };
}

function submit(timer) {
  assert.equal(timer.begin(), false);
  assert.equal(timer.begin(), false);
  assert.equal(timer.begin(), false);
  assert.equal(timer.begin(), true);
  timer.end();
}

test("pending GPU queries expire after the non-blocking timeout and are deleted", () => {
  const f = fixture(), timer = new GpuTimer(f.gl);
  const startedAt = performance.now();
  for (let i = 0; i < 4; i++) submit(timer);
  assert.equal(f.queries.length, 4);
  assert.equal(timer.poll(startedAt + 1300), null);
  assert.ok(f.queries.every(query => query.deleted), "all timed-out queries are released");
});

test("a stalled query queue recovers and accepts fresh measurements", () => {
  const f = fixture(), timer = new GpuTimer(f.gl);
  const startedAt = performance.now();
  for (let i = 0; i < 4; i++) submit(timer);
  timer.poll(startedAt + 1300);
  submit(timer);
  assert.equal(f.queries.length, 5);
  assert.equal(f.queries[4].deleted, false);
  f.queries[4].available = true;
  const completedAt = performance.now() + 50;
  assert.deepEqual(timer.poll(completedAt), { timeMs: 5, completedAt });
  assert.equal(f.queries[4].deleted, true);
});

test("a result older than the timeout is discarded even if it becomes available late", () => {
  const f = fixture(), timer = new GpuTimer(f.gl);
  const startedAt = performance.now();
  submit(timer);
  f.queries[0].available = true;
  assert.equal(timer.poll(startedAt + 1001), null);
  assert.equal(f.queries[0].deleted, true);
});

test("disjoint timing clears pending queries and later sampling remains available", () => {
  const f = fixture(), timer = new GpuTimer(f.gl);
  submit(timer);
  f.setDisjoint(true);
  assert.equal(timer.poll(performance.now() + 10), null);
  assert.equal(f.queries[0].deleted, true);
  f.setDisjoint(false);
  submit(timer);
  f.queries[1].available = true;
  const completedAt = performance.now() + 50;
  assert.deepEqual(timer.poll(completedAt), { timeMs: 2, completedAt });
});

test("a begin-query driver error releases both the failed query and older pending queries", () => {
  const f = fixture(), timer = new GpuTimer(f.gl);
  submit(timer);
  f.gl.beginQuery = () => { throw new Error("driver failure"); };
  for (let i = 0; i < 3; i++) assert.equal(timer.begin(), false);
  assert.equal(timer.begin(), false);
  assert.ok(f.queries.every(query => query.deleted));
  assert.equal(timer.poll(performance.now() + 10), null);
});

test("an end-query driver error releases active and pending queries", () => {
  const f = fixture(), timer = new GpuTimer(f.gl);
  submit(timer);
  for (let i = 0; i < 3; i++) assert.equal(timer.begin(), false);
  assert.equal(timer.begin(), true);
  f.gl.endQuery = () => { throw new Error("driver failure"); };
  timer.end();
  assert.ok(f.queries.every(query => query.deleted));
  assert.equal(timer.poll(performance.now() + 10), null);
});
