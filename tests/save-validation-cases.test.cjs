#!/usr/bin/env node
"use strict";

// legacy source source stability save-validation regressions. adaptive pacing converts the original reproductions into fixed assertions.
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
const { packed, stateOf } = require("../src/core/coords.ts");
const { freshWorld, validateSave, encodeEdits } = require("../src/persistence/saves.ts");

test("save validation rejects impossible packed Rice growth state 4", () => {
  const data = freshWorld("rice-state-validation", "validation-seed", "creative");
  assert.throws(() => validateSave({ ...data, edits: { "1,25,1": packed(B.Rice, 4) } }), /Invalid world block/);
  for (let stage = 0; stage <= 3; stage++) {
    const accepted = validateSave({ ...data, edits: { "1,25,1": packed(B.Rice, stage) } });
    assert.equal(stateOf(accepted.edits["1,25,1"]), stage);
  }
});

test("save validation rejects noncanonical duplicate edit coordinates", () => {
  const data = freshWorld("edit-key-validation", "validation-seed", "creative");
  assert.throws(() => validateSave({ ...data, edits: { "1,,2": B.Stone, "1,0,2": B.Gold } }), /Invalid world block/);
  assert.throws(() => encodeEdits({ "1,,2": B.Stone, "1,0,2": B.Gold }), /Invalid world block/);
});
