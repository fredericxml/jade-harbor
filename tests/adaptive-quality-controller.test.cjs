#!/usr/bin/env node
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  module._compile(output, filename);
};

const { AdaptiveResolution } = require("../src/render/adaptive-resolution.ts");
const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

function feed(controller, start, duration, gap, cpu = 4, renderCpu = 1, gpuMs = null, target = 60) {
  let now = start;
  for (; now < start + duration; now += gap) controller.observe(now, gap, cpu, renderCpu, gpuMs, target);
  return now;
}

test("Adaptive stays opt-in and explains disabled/warming states accurately", () => {
  const controller = new AdaptiveResolution();
  assert.equal(controller.state, "off");
  assert.equal(controller.decision, "Disabled");
  controller.configure(true, 60);
  assert.equal(controller.state, "warming");
  assert.match(controller.decision, /Waiting for active gameplay/);
  controller.observe(100, 16.7, 5, 1, 2, 60);
  assert.match(controller.decision, /Collecting active-play/);
  controller.configure(false, 60);
  assert.equal(controller.scale, 1);
  assert.equal(controller.state, "off");
  assert.equal(controller.decision, "Disabled");
});

test("the RAF hot path does not slice the rolling sample window on every frame", () => {
  const controller = new AdaptiveResolution();
  controller.configure(true, 60);
  const sampleArray = controller.samples;
  const originalSlice = Array.prototype.slice;
  let sampleSlices = 0;
  Array.prototype.slice = function (...args) {
    if (this === sampleArray) sampleSlices++;
    return originalSlice.apply(this, args);
  };
  try {
    feed(controller, 0, 11000, 100, 4, 1, 2, 60);
    assert.equal(sampleSlices, 0, "no rolling-window copy before an evaluation is due");
    feed(controller, 11000, 1500, 100, 4, 1, 2, 60);
    assert.equal(sampleSlices, 1, "one window copy at the first scheduled evaluation");
  } finally {
    Array.prototype.slice = originalSlice;
  }
});

test("CPU update pressure holds resolution and gives a current explanation", () => {
  const controller = new AdaptiveResolution();
  controller.configure(true, 60);
  feed(controller, 0, 19000, 100, 20, 1, 2, 60);
  assert.equal(controller.scale, 1);
  assert.equal(controller.bottleneck, "cpu");
  assert.match(controller.decision, /CPU update pressure.*resolution unchanged/);
});

test("CPU render-submission pressure does not masquerade as GPU pressure", () => {
  const controller = new AdaptiveResolution();
  controller.configure(true, 60);
  feed(controller, 0, 19000, 100, 14, 12, 2, 60);
  assert.equal(controller.scale, 1);
  assert.equal(controller.bottleneck, "render-cpu");
  assert.match(controller.decision, /CPU render-submission pressure.*resolution unchanged/);
});

test("measured GPU pressure lowers resolution only after sustained confirmation", () => {
  const controller = new AdaptiveResolution();
  controller.configure(true, 60);
  feed(controller, 0, 15000, 100, 5, 1, 28, 60);
  assert.equal(controller.scale, 1, "warmup and confirmation prevent a reaction to a short burst");
  feed(controller, 15000, 2000, 100, 5, 1, 28, 60);
  assert.equal(controller.scale, 0.95);
  assert.equal(controller.bottleneck, "gpu");
  assert.match(controller.decision, /Measured GPU pressure/);
});

test("mixed CPU/GPU pressure is identified separately", () => {
  const controller = new AdaptiveResolution();
  controller.configure(true, 60);
  feed(controller, 0, 19000, 100, 14, 9, 28, 60);
  assert.equal(controller.bottleneck, "mixed");
  assert.equal(controller.scale, 0.95);
  assert.match(controller.decision, /Mixed CPU\/GPU pressure/);
});

test("GPU-timer fallback is explicitly described rather than presented as measured GPU timing", () => {
  const controller = new AdaptiveResolution();
  controller.configure(true, 60);
  feed(controller, 0, 19000, 100, 5, 1, null, 60);
  assert.equal(controller.scale, 0.95);
  assert.equal(controller.bottleneck, "presentation");
  assert.match(controller.decision, /Render\/presentation pressure persists.*adjustment cooldown/);
});

test("a target-FPS change resets the sample baseline without changing the preset or scale", () => {
  const controller = new AdaptiveResolution();
  controller.configure(true, 60);
  feed(controller, 0, 19000, 100, 5, 1, 28, 60);
  assert.equal(controller.scale, 0.95);
  controller.observe(19000, 16.7, 5, 1, 2, 48);
  assert.equal(controller.scale, 0.95);
  assert.equal(controller.sampleCount, 1);
  assert.equal(controller.state, "warming");
  assert.match(controller.decision, /Frame target changed/);
});

test("stable performance recovers slowly and refreshes the decision text", () => {
  const controller = new AdaptiveResolution();
  controller.configure(true, 60);
  let now = feed(controller, 0, 19000, 100, 5, 1, 28, 60);
  assert.equal(controller.scale, 0.95);
  now = feed(controller, now, 24000, 1000 / 60, 4, 1, 2, 60);
  assert.equal(controller.scale, 0.975);
  assert.match(controller.decision, /gradual recovery to 98%/);
  controller.suspend();
  assert.equal(controller.scale, 0.975);
  assert.match(controller.decision, /Waiting for active gameplay/);
});

for (const hz of [90, 120, 144]) {
  test(`time-based sampling retains enough history and recovers at ${hz} Hz`, () => {
    const controller = new AdaptiveResolution();
    controller.configure(true, 0);
    let now = feed(controller, 0, 19000, 25, 5, 1, 28, hz);
    assert.equal(controller.scale, 0.95);
    now = feed(controller, now, 45000, 1000 / hz, 4, 1, 2, hz);
    assert.ok(controller.scale > 0.95);
    assert.ok(controller.sampleCount <= Math.ceil(hz * 3) + 2);
  });
}

test("engine samples active play after streaming, meshing and rendering", () => {
  const game = read("src/core/game.ts");
  const rebuild = game.indexOf("this.view.rebuild(this.world, 6)");
  const render = game.indexOf("this.view.render();", rebuild);
  const observe = game.indexOf("this.adaptive.observe(t,elapsed,cpu,renderCpu", render);
  assert.ok(rebuild >= 0 && render > rebuild && observe > render, "observation must include chunk/mesh work and render submission");
  assert.match(game.slice(observe - 220, observe + 180), /adaptiveGameplay=this.active&&!this.dead&&this.ui.screen==="none"&&!this.travelState/);
});

test("settings explain Adaptive as independent of the three quality presets", () => {
  const ui = read("src/ui/ui.ts");
  assert.match(ui, /adjusts only the internal 3D render resolution/);
  assert.match(ui, /CPU-bound slowdowns do not lower resolution/);
  assert.match(ui, /Independent of the High, Medium and Low graphics preset/);
  assert.doesNotMatch(ui, /Choosing a graphics preset turns this off/);
  const controls = read("docs/performance-controls.md");
  assert.match(controls, /Changing a graphics preset does not turn adaptation off/);
  assert.doesNotMatch(controls, /Choosing a graphics preset turns adaptation off/);
});

test("debug and exported performance diagnostics expose the current decision and sample count", () => {
  const game = read("src/core/game.ts");
  assert.match(game, /this\.adaptive\.decision/);
  assert.match(game, /adaptiveSampleCount:this\.adaptive\.sampleCount/);
  assert.match(game, /adaptiveBottleneck:this\.adaptive\.bottleneck/);
});
