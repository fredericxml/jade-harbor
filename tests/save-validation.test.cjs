#!/usr/bin/env node
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
};
const { B } = require("../src/world/blocks.ts");
const { packed } = require("../src/core/coords.ts");
const { freshWorld, validateSave, encodeEdits } = require("../src/persistence/saves.ts");

function base() {
  return freshWorld("save-validation", "save-validation-seed", "creative");
}

test("Rice save state accepts only the four implemented growth stages", () => {
  const data = base();
  for (let stage = 0; stage <= 3; stage++) {
    const result = validateSave({ ...data, edits: { "1,25,1": packed(B.Rice, stage) } });
    assert.equal(result.edits["1,25,1"], packed(B.Rice, stage));
  }
  for (const stage of [4, 5, 7, 15, 255]) {
    assert.throws(
      () => validateSave({ ...data, edits: { "1,25,1": packed(B.Rice, stage) } }),
      /Invalid world block/,
      `Rice stage ${stage} must be rejected`,
    );
  }
});

test("canonical integer coordinate strings are accepted across negative chunk boundaries", () => {
  const edits = { "-1,-63,-1": B.Stone, "0,-63,0": B.Gold, "16,15,16": B.Marble };
  const result = validateSave({ ...base(), edits });
  assert.deepEqual(result.edits, edits);
  const deltas = encodeEdits(result.edits);
  assert.equal(deltas.length, 3);
  assert.ok(deltas.every(delta => delta.entries.length === 2));
});

test("noncanonical numeric spellings are rejected instead of aliasing the same block", () => {
  const invalid = [
    "01,0,2", "+1,0,2", "1,0,02", "1,,2", "1, 0,2",
    "1.0,0,2", "-0,0,0", "1,0,2 ", " 1,0,2",
  ];
  for (const key of invalid) {
    assert.throws(
      () => validateSave({ ...base(), edits: { [key]: B.Stone } }),
      /Invalid world block/,
      `noncanonical key ${JSON.stringify(key)} must be rejected`,
    );
    assert.throws(
      () => encodeEdits({ [key]: B.Stone }),
      /Invalid world block/,
      `encodeEdits must reject ${JSON.stringify(key)} when called directly`,
    );
  }
});

test("direct edit encoding rejects invalid packed block values", () => {
  assert.throws(() => encodeEdits({ "1,20,1": packed(B.Rice, 4) }), /Invalid world block/);
  assert.throws(() => encodeEdits({ "1,20,1": 65536 }), /Invalid world block/);
  assert.throws(() => encodeEdits({ "1,20,1": -1 }), /Invalid world block/);
});

test("valid packed block states and air-removal overlays remain accepted", () => {
  const edits = {
    "1,20,1": B.Air,
    "2,20,2": packed(B.Rice, 3),
    "3,20,3": packed(B.Door, 4 | 16),
    "4,20,4": packed(B.Wire, 15),
  };
  const result = validateSave({ ...base(), edits });
  assert.deepEqual(result.edits, edits);
  assert.ok(encodeEdits(result.edits).length > 0);
});

test("edit encoding produces unique, sorted indices for canonical coordinates", () => {
  const edits = {
    "-1,-63,-1": B.Stone,
    "-2,-63,-1": B.Gold,
    "-1,-62,-1": B.Marble,
  };
  const deltas = encodeEdits(edits);
  const seen = new Set();
  for (const delta of deltas) {
    const indices = [];
    for (let i = 0; i < delta.entries.length; i += 2) indices.push(delta.entries[i]);
    assert.deepEqual(indices, [...indices].sort((a,b) => a-b));
    for (const index of indices) {
      const unique = `${delta.key}:${index}`;
      assert.equal(seen.has(unique), false);
      seen.add(unique);
    }
  }
  assert.equal(seen.size, 3);
});

test("edit coordinate bounds and vertical build limits remain enforced", () => {
  const invalid = ["10000001,20,0", "0,-64,0", "0,320,0", "0,20,-10000001"];
  for (const key of invalid) {
    assert.throws(() => validateSave({ ...base(), edits: { [key]: B.Stone } }), /Invalid world block/);
    assert.throws(() => encodeEdits({ [key]: B.Stone }), /Invalid world block/);
  }
});
