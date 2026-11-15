#!/usr/bin/env node
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");

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

const { Metrics } = require("../src/core/metrics.ts");

test("metrics retain bounded rolling samples and expose p50, p95 and maximum", () => {
  const metrics = new Metrics();
  for (let value = 1; value <= 300; value++) metrics.add("mesh", value);
  const summary = metrics.summary("mesh");
  assert.equal(summary.count, 240);
  assert.equal(summary.p50, 181);
  assert.equal(summary.p95, 289);
  assert.equal(summary.p99, 298);
  assert.equal(summary.max, 300);
});

test("invalid and negative timing samples are ignored", () => {
  const metrics = new Metrics();
  metrics.add("tick", -1);
  metrics.add("tick", NaN);
  metrics.add("tick", Infinity);
  assert.equal(metrics.summary("tick").count, 0);
  metrics.add("tick", 2.5);
  assert.equal(metrics.summary("tick").p50, 2.5);
  assert.equal(metrics.summary("tick").max, 2.5);
});

test("F3 enabled and disabled samples are stored separately for same-scene A/B", () => {
  const game = fs.readFileSync(path.join(root, "src/core/game.ts"), "utf8");
  assert.match(game, /frameWork\.f3On/);
  assert.match(game, /frameWork\.f3Off/);
  assert.match(game, /renderSubmit\.f3On/);
  assert.match(game, /renderSubmit\.f3Off/);
  assert.match(game, /F3 A\/B p50/);
  assert.match(game, /debugInspect/);
  assert.match(game, /debugHud/);
  assert.match(game, /debugBenchmarkActive = this\.active/);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.ok(pkg.scripts['test:rendering']?.includes('tests/rendering-diagnostics.test.cjs'));
  assert.ok(pkg.scripts['test:regression']?.includes('npm run test:rendering'));
});

test("all diagnostics renderer diagnostic state is initialized before the first preview frame", () => {
  const renderer = fs.readFileSync(path.join(root, "src/render/renderer.ts"), "utf8");
  const sourceFile = ts.createSourceFile("renderer.ts", renderer, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const viewClass = sourceFile.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === "View");
  assert.ok(viewClass, "View class must exist");
  const fields = new Map(viewClass.members.filter(ts.isPropertyDeclaration).map(member => [member.name.getText(sourceFile), member]));
  const queueField = fields.get("meshQueueStats");
  assert.ok(queueField?.initializer && ts.isCallExpression(queueField.initializer), "meshQueueStats must be eagerly initialized in the View field declarations");
  assert.equal(queueField.initializer.expression.getText(sourceFile), "createMeshQueueDiagnostics");
  const factory = sourceFile.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "createMeshQueueDiagnostics");
  assert.ok(factory?.body, "mesh queue diagnostic factory must exist");
  const returned = factory.body.statements.find(ts.isReturnStatement);
  assert.ok(returned?.expression && ts.isObjectLiteralExpression(returned.expression), "diagnostic factory must return an initialized object");
  const queueKeys = new Set(returned.expression.properties.filter(ts.isPropertyAssignment).map(property => property.name.getText(sourceFile)));
  for (const key of [
    "queuedBefore", "queuedAfter", "scanned", "eligible", "dirtyRemesh", "dirtyFirstBuild",
    "processed", "rendered", "empty", "deferred", "meshed", "renderedSections", "queueAgeMs", "maxSectionMs",
    "visibleQueued", "visibleReady", "visiblePending", "backgroundQueued", "backgroundReady", "backgroundPending",
    "visibleWorldReady", "visibleWorldProgress",
  ]) assert.ok(queueKeys.has(key), `meshQueueStats must initialize ${key}`);
  assert.equal(fields.get("meshQueueStartedAt")?.initializer?.getText(sourceFile), "0");
  assert.equal(fields.get("untrackedAuditScannedAt")?.initializer?.getText(sourceFile), "-Infinity");
  const untracked = fields.get("untrackedAuditStats")?.initializer;
  assert.ok(untracked && ts.isObjectLiteralExpression(untracked), "untracked audit snapshot must be initialized");
  const untrackedKeys = new Set(untracked.properties.filter(ts.isPropertyAssignment).map(property => property.name.getText(sourceFile)));
  assert.ok(untrackedKeys.has("count") && untrackedKeys.has("examples"));
});

test("mesh queue diagnostics have eager and defensive lazy initialization", () => {
  const renderer = fs.readFileSync(path.join(root, "src/render/renderer.ts"), "utf8");
  assert.match(renderer, /function createMeshQueueDiagnostics\(\): MeshQueueDiagnostics/);
  assert.match(renderer, /meshQueueStats: MeshQueueDiagnostics = createMeshQueueDiagnostics\(\)/);
  assert.match(renderer, /this\.meshQueueStats \?\? \(this\.meshQueueStats = createMeshQueueDiagnostics\(\)\)/);
});

test("development runtime exposes a unique build fingerprint and refuses port fallback", () => {
  const renderer = fs.readFileSync(path.join(root, "src/render/renderer.ts"), "utf8");
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.match(renderer, /appVersion/);
  assert.match(renderer, /__jadeHarborBuildId/);
  assert.match(pkg.scripts.dev, /--strictPort/);
});

test("mesh queue diagnostics distinguish queued, eligible, remesh, first build and completed geometry", () => {
  const renderer = fs.readFileSync(path.join(root, "src/render/renderer.ts"), "utf8");
  const game = fs.readFileSync(path.join(root, "src/core/game.ts"), "utf8");
  for (const field of [
    "queuedBefore", "queuedAfter", "scanned", "eligible", "dirtyRemesh",
    "dirtyFirstBuild", "processed", "rendered", "empty", "deferred",
    "meshed", "renderedSections", "queueAgeMs", "maxSectionMs", "visibleQueued", "visibleReady",
    "visiblePending", "backgroundQueued", "backgroundReady", "backgroundPending", "visibleWorldReady", "visibleWorldProgress",
  ]) assert.ok(renderer.includes(field), `missing mesh queue diagnostic ${field}`);
  assert.match(game, /Sections data/);
  assert.match(game, /eligible\/scanned/);
  assert.match(game, /Visible mesh readiness/);
  assert.match(game, /visibleReady/);
});

test("untracked renderable inventory is debug-only and reports examples without changing scene state", () => {
  const audit = fs.readFileSync(path.join(root, "src/render/render-audit.ts"), "utf8");
  const renderer = fs.readFileSync(path.join(root, "src/render/renderer.ts"), "utf8");
  assert.match(audit, /inspectUntracked\(/);
  assert.match(audit, /root\.traverseVisible/);
  assert.match(renderer, /now - this\.untrackedAuditScannedAt >= 1000/);
  assert.match(renderer, /renderAuditUntrackedDebug/);
});

test("expanded F3 diagnostics remain bounded and scrollable on short viewports", () => {
  const css = fs.readFileSync(path.join(root, "src/ui/style.css"), "utf8");
  const debugRule = css.match(/\.debug\s*\{[^}]*\}/)?.[0] ?? "";
  assert.match(debugRule, /max-height:\s*calc\(100vh - 120px\)/);
  assert.match(debugRule, /overflow:\s*auto/);
  assert.match(debugRule, /white-space:\s*pre-wrap/);
});
