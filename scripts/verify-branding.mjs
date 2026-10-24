import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
const root = process.cwd();
const read = file => readFileSync(join(root, file), "utf8");
const metadata = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
assert.equal(metadata.name, "jade-harbor");
assert.equal(lock.name, "jade-harbor");
assert.equal(lock.packages[""].name, "jade-harbor");
const sourceHtml = read("index.html");
assert.match(sourceHtml, /Jade Harbor — Build Beyond Boundaries/);
assert.doesNotMatch(sourceHtml, /lanterncraft/i);
for (const name of ["src/ui/ui.ts", "src/main.ts", "src/persistence/saves.ts", "src/core/game.ts"]) {
  const source = read(name);
  assert.doesNotMatch(source, /lanterncraft/i, `${name}: stale public identity`);
}
if (existsSync(join(root, "dist/index.html"))) {
  const distHtml = read("dist/index.html");
  assert.match(distHtml, /Jade Harbor — Build Beyond Boundaries/);
  assert.doesNotMatch(distHtml, /lanterncraft/i);
  const compiled = readdirSync(join(root, "dist/assets")).filter(x=>/^index-.*\.js$/.test(x));
  assert.equal(compiled.length, 1, "Expected one compiled main bundle");
  assert.match(distHtml, new RegExp(compiled[0].replaceAll(".", "\\.")));
}
assert.equal(JSON.parse(read("package.json")).scripts["test:branding"], "node scripts/verify-branding.mjs");
assert.match(read("src/persistence/saves.ts"), /DATABASE_NAME = "jade-harbor-engine-v1"/);
assert.match(read("src/persistence/saves.ts"), /format: "jade-harbor-engine"/);
console.log("PASS: Jade Harbor package metadata, source identity, HTML and storage identifiers align.");
