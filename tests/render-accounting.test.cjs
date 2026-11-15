#!/usr/bin/env node
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  // The mesher only needs tileUV from atlas.ts; no canvas or WebGL is used.
  if (request === "three") return {};
  return originalLoad.call(this, request, parent, isMain);
};

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

const {
  RenderWorkloadAudit,
  RENDER_AUDIT_CATEGORIES,
} = require("../src/render/render-audit.ts");
const { meshChunk } = require("../src/render/mesher.ts");
const { BlockColumn } = require("../src/world/sections.ts");
const { B } = require("../src/world/blocks.ts");
Module._load = originalLoad;

function fakeRenderable(options = {}) {
  return {
    userData: {},
    isMesh: options.isMesh ?? true,
    isInstancedMesh: options.isInstancedMesh ?? false,
    isPoints: options.isPoints ?? false,
    isLine: options.isLine ?? false,
    isSprite: options.isSprite ?? false,
    name: options.name ?? "",
    id: options.id ?? 0,
    count: options.count ?? 1,
    originalCalls: 0,
    onBeforeRender() { this.originalCalls++; },
  };
}
function fakeGeometry({ id = 1, indexCount = 36, positionCount = 24, start = 0, count = Infinity } = {}) {
  return {
    id,
    index: indexCount === null ? null : { count: indexCount },
    attributes: { position: { count: positionCount } },
    drawRange: { start, count },
  };
}
function draw(object, geometry, group = null) {
  object.onBeforeRender({}, {}, {}, geometry, {}, group);
}

test("category inventory covers the visual layers required for the preset audit", () => {
  assert.deepEqual(RENDER_AUDIT_CATEGORIES, [
    "voxel-opaque", "voxel-transparent", "water", "voxel-emissive",
    "distant-terrain", "distant-structures", "npc", "drops",
    "particles", "rain", "clouds", "sky", "player", "interaction",
  ]);
});

test("audit hooks are absent while disabled and preserve the original callback", () => {
  const audit = new RenderWorkloadAudit();
  const mesh = fakeRenderable();
  const original = mesh.onBeforeRender;
  audit.tag(mesh, "voxel-opaque");
  assert.equal(mesh.onBeforeRender, original);
  draw(mesh, fakeGeometry());
  assert.equal(mesh.originalCalls, 1);
  assert.equal(audit.snapshot(12, 1), null);
  audit.dispose();
  assert.equal(mesh.onBeforeRender, original);
});

test("indexed, instanced and geometry-group triangle accounting matches the submitted range", () => {
  const audit = new RenderWorkloadAudit();
  const mesh = fakeRenderable({ isInstancedMesh: true, count: 3 });
  const original = mesh.onBeforeRender;
  audit.tag(mesh, "voxel-transparent");
  audit.setEnabled(true);
  assert.notEqual(mesh.onBeforeRender, original);

  // drawRange [3,27) intersect group [6,18) = 12 indices = 4 triangles.
  // InstancedMesh submits three copies: 12 triangles total.
  draw(mesh, fakeGeometry({ id: 42, indexCount: 36, start: 3, count: 24 }), { start: 6, count: 12 });
  const snapshot = audit.snapshot(12, 1);
  assert.equal(snapshot.trackedTriangles, 12);
  assert.equal(snapshot.trackedCalls, 1);
  assert.equal(snapshot.unclassifiedTriangles, 0);
  assert.equal(snapshot.unclassifiedCalls, 0);
  assert.deepEqual(snapshot.categories["voxel-transparent"], {
    calls: 1, triangles: 12, geometries: 1,
  });
  assert.equal(mesh.originalCalls, 1);
  audit.dispose();
  assert.equal(mesh.onBeforeRender, original);
});

test("non-indexed mesh geometry uses position count and honors drawRange", () => {
  const audit = new RenderWorkloadAudit();
  const mesh = fakeRenderable();
  audit.tag(mesh, "distant-terrain");
  audit.setEnabled(true);
  draw(mesh, fakeGeometry({ id: 7, indexCount: null, positionCount: 30, start: 3, count: 18 }));
  const snapshot = audit.snapshot(6, 1);
  assert.equal(snapshot.categories["distant-terrain"].triangles, 6);
  assert.equal(snapshot.categories["distant-terrain"].calls, 1);
  audit.dispose();
});

test("points and line draw calls are counted without being misreported as triangles", () => {
  const audit = new RenderWorkloadAudit();
  const points = fakeRenderable({ isMesh: false });
  audit.tag(points, "rain");
  audit.setEnabled(true);
  draw(points, fakeGeometry({ id: 8 }));
  const snapshot = audit.snapshot(0, 1);
  assert.equal(snapshot.categories.rain.calls, 1);
  assert.equal(snapshot.categories.rain.triangles, 0);
  assert.equal(snapshot.unclassifiedCalls, 0);
  audit.dispose();
});

test("zero-instance and zero-range renderables are not counted as submitted draws", () => {
  const audit = new RenderWorkloadAudit();
  const emptyParticles = fakeRenderable({ isInstancedMesh: true, count: 0 });
  const emptyRange = fakeRenderable();
  audit.tag(emptyParticles, "particles");
  audit.tag(emptyRange, "interaction");
  audit.setEnabled(true);

  draw(emptyParticles, fakeGeometry({ id: 81 }));
  draw(emptyRange, fakeGeometry({ id: 82, start: 0, count: 0 }));

  const snapshot = audit.snapshot(0, 0);
  assert.equal(snapshot.categories.particles.calls, 0);
  assert.equal(snapshot.categories.interaction.calls, 0);
  assert.equal(snapshot.trackedCalls, 0);
  assert.equal(snapshot.unclassifiedCalls, 0);
  assert.match(audit.format(snapshot), /Audit remainder tri\/draw: 0\/0/);
  audit.dispose();
});

test("visible renderable inventory identifies untagged objects but ignores hidden objects", () => {
  const audit = new RenderWorkloadAudit();
  const tagged = fakeRenderable({ name: "tagged", id: 1 });
  const untaggedMesh = fakeRenderable({ name: "unknown mesh", id: 2 });
  const untaggedPoints = fakeRenderable({ name: "unknown points", id: 3, isMesh: false, isPoints: true });
  const hidden = fakeRenderable({ name: "hidden mesh", id: 4 });
  hidden.visible = false;
  audit.tag(tagged, "npc");
  const root = {
    traverseVisible(fn) {
      fn(this);
      fn(tagged);
      fn(untaggedMesh);
      fn(untaggedPoints);
      // A real Object3D.traverseVisible would not visit descendants of a
      // hidden parent; keep this object out of the traversal fixture.
    },
  };
  audit.setEnabled(true);
  const result = audit.inspectUntracked(root);
  assert.equal(result.count, 2);
  assert.deepEqual(result.examples, [
    "unknown mesh (Mesh#2)",
    "unknown points (Points#3)",
  ]);
  draw(untaggedMesh, fakeGeometry({ id: 51, indexCount: 36 }));
  const snapshot = audit.snapshot(12, 1);
  assert.equal(snapshot.untrackedSubmittedCalls, 1);
  assert.equal(snapshot.untrackedSubmittedObjects, "unknown mesh×1");
  assert.equal(snapshot.unclassifiedCalls, 1);
  assert.match(audit.format(snapshot), /untagged submitted 1 \(unknown mesh×1\)/);
  const afterRemoval = { traverseVisible(fn) { fn(this); } };
  audit.inspectUntracked(afterRemoval);
  assert.equal(untaggedMesh.onBeforeRender.name, "onBeforeRender",
    "objects removed from the visible scene must have their original callback restored");
  audit.dispose();
  assert.equal(untaggedMesh.originalCalls, 1);
});

test("category counters accumulate multiple draws and expose unclassified remainder", () => {
  const audit = new RenderWorkloadAudit();
  const a = fakeRenderable();
  const b = fakeRenderable({ isMesh: false });
  audit.tag(a, "voxel-opaque");
  audit.tag(b, "clouds");
  audit.setEnabled(true);
  draw(a, fakeGeometry({ id: 1, indexCount: 12 }));
  draw(b, fakeGeometry({ id: 2 }));
  const snapshot = audit.snapshot(5, 3);
  assert.equal(snapshot.trackedTriangles, 4);
  assert.equal(snapshot.trackedCalls, 2);
  assert.equal(snapshot.unclassifiedTriangles, 1);
  assert.equal(snapshot.unclassifiedCalls, 1);
  assert.equal(snapshot.categories["voxel-opaque"].geometries, 1);
  assert.equal(snapshot.categories.clouds.geometries, 1);
  assert.match(audit.format(snapshot), /voxel-O/);
  assert.match(audit.format(snapshot), /Audit remainder tri\/draw: 1\/1/);
  audit.dispose();
});


test("water has its own audited draw while glass keeps its original transparent category", () => {
  const blocks = new BlockColumn();
  blocks.set(8, 0, 8, B.Water);
  blocks.set(9, 0, 8, B.Water);
  blocks.set(11, 0, 8, B.Glass);
  const chunk = { cx: 0, cz: 0, blocks };
  const world = { chunks: new Map([["0,0", chunk]]) };
  const meshes = meshChunk(world, chunk, undefined, 0);
  const glass = meshes[1], water = meshes[2];
  assert.equal(water.waterTriangles, 20);
  assert.equal(water.indices.length / 3, 20);
  assert.equal(glass.waterTriangles, 0);
  assert.equal(glass.indices.length / 3, 12);
  const audit = new RenderWorkloadAudit();
  const glassMesh = fakeRenderable(), waterMesh = fakeRenderable();
  audit.tag(glassMesh, "voxel-transparent");
  audit.tag(waterMesh, "water");
  audit.setEnabled(true);
  draw(glassMesh, fakeGeometry({id: 31, indexCount: glass.indices.length, positionCount: glass.positions.length / 3}));
  draw(waterMesh, fakeGeometry({id: 32, indexCount: water.indices.length, positionCount: water.positions.length / 3}));
  const snapshot = audit.snapshot(32, 2);
  assert.equal(snapshot.categories.water.triangles, 20);
  assert.equal(snapshot.categories.water.calls, 1);
  assert.equal(snapshot.categories["voxel-transparent"].triangles, 12);
  assert.equal(snapshot.categories["voxel-transparent"].calls, 1);
  assert.equal(snapshot.trackedTriangles, 32);
  assert.equal(snapshot.trackedCalls, 2);
  assert.equal(snapshot.unclassifiedTriangles, 0);
  assert.equal(snapshot.unclassifiedCalls, 0);
  audit.dispose();
});

test("emissive triangles are attributed inside the shared opaque draw without a second call", () => {
  const audit = new RenderWorkloadAudit();
  const mesh = fakeRenderable();
  audit.tag(mesh, "voxel-opaque", { "voxel-emissive": 6 });
  audit.setEnabled(true);
  draw(mesh, fakeGeometry({ id: 33, indexCount: 36 }));
  const snapshot = audit.snapshot(12, 1);
  assert.equal(snapshot.categories["voxel-opaque"].triangles, 6);
  assert.equal(snapshot.categories["voxel-opaque"].calls, 1);
  assert.equal(snapshot.categories["voxel-emissive"].triangles, 6);
  assert.equal(snapshot.categories["voxel-emissive"].calls, 0);
  assert.equal(snapshot.trackedTriangles, 12);
  assert.equal(snapshot.trackedCalls, 1);
  assert.equal(snapshot.unclassifiedTriangles, 0);
  audit.dispose();
});

test("partial geometry submissions do not apply whole-mesh water metadata", () => {
  const audit = new RenderWorkloadAudit();
  const mesh = fakeRenderable();
  audit.tag(mesh, "voxel-transparent", { water: 4 });
  audit.setEnabled(true);
  draw(mesh, fakeGeometry({ id: 32, indexCount: 12, start: 0, count: 6 }), { start: 0, count: 6 });
  const snapshot = audit.snapshot(2, 1);
  assert.equal(snapshot.categories.water.triangles, 0);
  assert.equal(snapshot.categories["voxel-transparent"].triangles, 2);
  assert.equal(snapshot.unclassifiedTriangles, 0);
  audit.dispose();
});

test("per-category counters and geometry sets are reused between render passes", () => {
  const audit = new RenderWorkloadAudit();
  const mesh = fakeRenderable();
  audit.tag(mesh, "npc");
  const counter = audit.counters.get("npc");
  const geometryIds = counter.geometryIds;
  audit.setEnabled(true);
  audit.beginPass();
  draw(mesh, fakeGeometry({ id: 33 }));
  assert.equal(counter.calls, 1);
  assert.equal(geometryIds.size, 1);
  audit.beginPass();
  assert.equal(audit.counters.get("npc"), counter);
  assert.equal(counter.geometryIds, geometryIds);
  assert.equal(counter.calls, 0);
  assert.equal(counter.triangles, 0);
  assert.equal(geometryIds.size, 0);
  audit.dispose();
});


test("snapshot category objects are reused across frames and passes", () => {
  const audit = new RenderWorkloadAudit();
  const mesh = fakeRenderable();
  audit.tag(mesh, "npc");
  audit.setEnabled(true);
  audit.beginPass();
  draw(mesh, fakeGeometry({ id: 34, indexCount: 6 }));
  const first = audit.snapshot(2, 1);
  const npcStats = first.categories.npc;

  audit.beginPass();
  draw(mesh, fakeGeometry({ id: 34, indexCount: 12 }));
  const second = audit.snapshot(4, 1, first);

  assert.equal(second, first);
  assert.equal(second.categories.npc, npcStats);
  assert.equal(second.categories.npc.triangles, 4);
  assert.equal(second.categories.npc.calls, 1);
  assert.equal(second.unclassifiedTriangles, 0);
  audit.dispose();
});

test("disable and untag restore callbacks without leaving stale wrappers", () => {
  const audit = new RenderWorkloadAudit();
  const mesh = fakeRenderable();
  const original = mesh.onBeforeRender;
  audit.tag(mesh, "npc");
  audit.setEnabled(true);
  const wrapper = mesh.onBeforeRender;
  assert.notEqual(wrapper, original);
  audit.setEnabled(false);
  assert.equal(mesh.onBeforeRender, original);
  audit.setEnabled(true);
  assert.notEqual(mesh.onBeforeRender, original);
  audit.untag(mesh);
  assert.equal(mesh.onBeforeRender, original);
  audit.setEnabled(false);
  draw(mesh, fakeGeometry());
  assert.equal(mesh.originalCalls, 1);
  audit.dispose();
});

test("retagging an enabled object changes its category without double-counting", () => {
  const audit = new RenderWorkloadAudit();
  const mesh = fakeRenderable();
  audit.tag(mesh, "npc");
  audit.setEnabled(true);
  audit.tag(mesh, "drops");
  draw(mesh, fakeGeometry({ id: 9, indexCount: 6 }));
  const snapshot = audit.snapshot(2, 1);
  assert.equal(snapshot.categories.npc.calls, 0);
  assert.equal(snapshot.categories.drops.calls, 1);
  assert.equal(snapshot.trackedCalls, 1);
  audit.dispose();
});

test("renderer, entities, effects and distant-world objects are assigned to audit categories", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../src/render/renderer.ts"), "utf8");
  const entities = fs.readFileSync(path.join(__dirname, "../src/render/entity-view.ts"), "utf8");
  const effects = fs.readFileSync(path.join(__dirname, "../src/render/effects.ts"), "utf8");
  const distant = fs.readFileSync(path.join(__dirname, "../src/render/distant-world.ts"), "utf8");
  const game = fs.readFileSync(path.join(__dirname, "../src/core/game.ts"), "utf8");

  for (const category of ["voxel-opaque", "voxel-transparent", "voxel-emissive", "interaction", "clouds", "sky", "player"])
    assert.ok(renderer.includes(`"${category}"`), `renderer missing ${category}`);
  assert.match(renderer, /renderAudit\?\.tag\(mesh, category, breakdown\)/);
  assert.match(renderer, /"voxel-emissive": d\.emissiveTriangles/);
  for (const category of ["npc", "drops"]) assert.ok(entities.includes(`"${category}"`), `entity view missing ${category}`);
  for (const category of ["particles", "rain"]) assert.ok(effects.includes(`"${category}"`), `effects missing ${category}`);
  for (const category of ["distant-terrain", "distant-structures"]) assert.ok(distant.includes(`"${category}"`), `distant world missing ${category}`);
  assert.match(game, /new EntityView\(this\.view\.scene,\s*this\.view\.renderAudit\)/);
  assert.match(game, /new Effects\(this\.view\.scene,\s*this\.view\.renderAudit\)/);
  assert.match(game, /setRenderAuditEnabled\(this\.debug\)/);
  assert.match(game, /renderAuditDebug\(\)/);
  assert.match(game, /renderAuditUntrackedDebug\(t\)/);
  assert.match(game, /frameWork\.f3On/);
  assert.match(game, /frameWork\.f3Off/);
  assert.match(game, /renderSubmit\.f3On/);
  assert.match(game, /renderSubmit\.f3Off/);
  assert.match(game, /debugInspect/);
  assert.match(game, /debugHud/);
  assert.match(game, /viewmodelRender:v\.viewmodelRenderStats/);
});

test("visual profile contract stays in presentation code, not simulation/world rules", () => {
  const graphics = fs.readFileSync(path.join(__dirname, "../src/render/graphics.ts"), "utf8");
  const simulation = fs.readFileSync(path.join(__dirname, "../src/game/simulation.ts"), "utf8");
  const entities = fs.readFileSync(path.join(__dirname, "../src/game/entities.ts"), "utf8");
  const world = fs.readFileSync(path.join(__dirname, "../src/world/world.ts"), "utf8");
  const mesher = fs.readFileSync(path.join(__dirname, "../src/render/mesher.ts"), "utf8");

  assert.match(graphics, /export type GraphicsQuality = "low" \| "medium" \| "high"/);
  assert.match(mesher, /if \(id === B\.Water\) material\.waterTriangles \+= 2/);
  assert.doesNotMatch(graphics, /population|simulationTick|navigationBudget|worldSeed/i);
  assert.doesNotMatch(simulation, /GraphicsProfile|graphicsProfile|renderScale/);
  assert.doesNotMatch(entities, /GraphicsProfile|graphicsProfile|renderScale/);
  assert.doesNotMatch(world, /GraphicsProfile|graphicsProfile|renderScale/);
  assert.doesNotMatch(mesher, /GraphicsProfile|graphicsProfile|renderScale/);
});

test("render audit remains opt-in and does not alter simulation or rendering when F3 is off", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/render/renderer.ts"), "utf8");
  const audit = fs.readFileSync(path.join(__dirname, "../src/render/render-audit.ts"), "utf8");
  assert.match(source, /setRenderAuditEnabled\(enabled:boolean\)\s*\{\s*this\.renderAudit\.setEnabled\(enabled\);\s*\}/);
  assert.match(source, /audit\?\.beginPass\(\)/);
  assert.match(audit, /if \(!this\.enabled\) return;/);
  assert.match(audit, /object\.onBeforeRender = wrapper/);
  assert.match(audit, /object\.onBeforeRender = original/);
});
