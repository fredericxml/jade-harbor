const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../src/render/renderer.ts"), "utf8");

test("geometry commits are resumable across material groups", () => {
  assert.match(source, /type PendingMeshCommit = \{/);
  assert.match(source, /nextMaterial: number/);
  assert.match(source, /private readonly meshCommits = new Map/);
  assert.match(source, /let i = commit\.nextMaterial/);
  assert.match(source, /if \(commit\.nextMaterial < commit\.data\.length\) return false/);
});

test("previous section remains until atomic replacement", () => {
  const method = source.slice(source.indexOf("private advanceMeshCommit"), source.indexOf("rebuild(world"));
  assert.ok(method.indexOf("this.removeSection(commit.key, false)") > method.indexOf("if (commit.nextMaterial < commit.data.length) return false"));
  assert.match(method, /this\.sections\.set\(commit\.key, commit\.group\)/);
});

test("stale and cleared pending commits dispose their temporary geometry", () => {
  assert.match(source, /for \(const commit of this\.meshCommits\.values\(\)\) this\.disposePendingCommit\(commit\)/);
  assert.match(source, /this\.meshCommits\.clear\(\)/);
  assert.match(source, /commit\.group\.traverse/);
  assert.match(source, /o\.geometry\.dispose\(\)/);
});

test("dirty section remains queued until its geometry commit completes", () => {
  const method = source.slice(source.indexOf("private advanceMeshCommit"), source.indexOf("rebuild(world"));
  assert.match(method, /world\.dirty\.delete\(commit\.key\)/);
  assert.match(source, /this\.meshCommits\.has\(entry\.key\)/);
});

test("commit work has a separate bounded timing metric", () => {
  const method = source.slice(source.indexOf("private advanceMeshCommit"), source.indexOf("rebuild(world"));
  assert.match(method, /commit\.cpuMs \+= performance\.now\(\) - commitStarted/);
  assert.match(method, /this\.metrics\.add\("meshCommit", commit\.cpuMs\)/);
});


test("geometry commit uses conservative section bounds instead of scanning every vertex", () => {
  assert.match(source, /const SECTION_BOUNDING_SPHERE = new THREE\.Sphere/);
  assert.match(source, /geometry\.boundingSphere = SECTION_BOUNDING_SPHERE/);
  assert.match(source, /const geo = createSectionGeometry\(d\)/);
  const method = source.slice(source.indexOf("private advanceMeshCommit"), source.indexOf("rebuild(world"));
  assert.doesNotMatch(method, /computeBoundingSphere\s*\(/);
});
