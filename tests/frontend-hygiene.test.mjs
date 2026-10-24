import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const sourceCss = readFileSync("src/ui/style.css", "utf8");
const distHtml = readFileSync("dist/index.html", "utf8");
const cssAsset = distHtml.match(/assets\/(index-[^"']+\.css)/)?.[1];
assert(cssAsset, "dist/index.html must reference the production stylesheet");
assert(statSync(`dist/assets/${cssAsset}`).isFile(), "production stylesheet asset must exist");

assert.equal(
  [...sourceCss.matchAll(/(?:^|})\s*\.world-tools\s*\{/g)].length,
  1,
  ".world-tools must have one canonical rule block",
);
assert.doesNotMatch(sourceCss, /margin-top:\s*9px/);
assert.doesNotMatch(sourceCss, /#7c8c7d/i);
assert.doesNotMatch(sourceCss, /\.lantern-icon\b/);

function matchingBrace(text, open) {
  let depth = 1;
  let quote = "";
  let escaped = false;
  for (let i = open + 1; i < text.length; i++) {
    const char = text[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "{") depth++;
    else if (char === "}" && --depth === 0) return i;
  }
  throw new Error(`Unclosed CSS block at offset ${open}`);
}

function auditRules(text, scope = "<root>", duplicates = []) {
  let cursor = 0;
  const seen = new Map();
  while (cursor < text.length) {
    const open = text.indexOf("{", cursor);
    if (open < 0) break;
    const header = text.slice(cursor, open).trim().replace(/\s+/g, " ");
    const close = matchingBrace(text, open);
    const body = text.slice(open + 1, close);

    if (/^@(media|supports|container|layer)\b/i.test(header)) {
      auditRules(body, `${scope} > ${header}`, duplicates);
    } else if (!/^@(keyframes|-\w+-keyframes|font-face|property)\b/i.test(header)) {
      const previous = seen.get(header);
      if (previous) duplicates.push(`${scope}: ${header}`);
      else if (header) seen.set(header, true);
    }
    cursor = close + 1;
  }
  return duplicates;
}

const cssWithoutComments = sourceCss.replace(/\/\*[\s\S]*?\*\//g, "");
assert.deepEqual(
  auditRules(cssWithoutComments),
  [],
  "stylesheet must not contain duplicate selectors in the same cascade scope",
);

const sourceHtml = readFileSync("index.html", "utf8");
assert.doesNotMatch(sourceHtml, /\son(?:click|input|change|submit)\s*=/i);
assert.doesNotMatch(sourceHtml, /javascript:/i);
assert.match(sourceHtml, /<div id="app"><\/div>/);

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(pkg.version, "1.0.0", "frontend refactors must not bump the release version");

console.log("PASS frontend CSS/HTML hygiene and v1.0.0 lock");
