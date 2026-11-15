const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));

test('package, lockfile, menu and debug build identity use the same 2.1.0 version', () => {
  const pkg = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(pkg.version, '2.1.0');
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
  assert.deepEqual(lock.packages[''].dependencies, pkg.dependencies);
  assert.deepEqual(lock.packages[''].devDependencies, pkg.devDependencies);
  const ui = read('src/ui/ui.ts'), renderer = read('src/render/renderer.ts');
  assert.match(ui, /import \{ version as appVersion \} from "\.\.\/\.\.\/package\.json"/);
  assert.ok(ui.includes('JADE HARBOR · v${appVersion}'));
  assert.match(renderer, /__jadeHarborBuildId = appVersion/);
  assert.doesNotMatch(ui, /JADE HARBOR · v2\.1\.0-rc/);
});

test('one canonical world generator is used, without historical generator selectors', () => {
  const generator = read('src/world/generator.ts');
  const world = read('src/world/world.ts');
  const protocol = read('src/world/generation-protocol.ts');
  const saves = read('src/persistence/saves.ts');
  assert.match(generator, /export function createGenerator\(/);
  assert.match(generator, /export function generateChunk\(/);
  assert.equal(require('node:fs').readdirSync(path.join(root,'src/world')).filter(n => /^generator.*\.ts$/.test(n)).join(','), 'generator.ts');
  assert.doesNotMatch(world, /generatorVersion|GENERATOR_VERSION/);
  assert.doesNotMatch(protocol, /requireGeneratorVersion|generator: number/);
  assert.doesNotMatch(saves, /generator: number|GENERATOR_VERSION/);
  assert.ok(saves.includes('jade-harbor-engine-v1'));
  assert.ok(saves.includes('jade-harbor-engine'));
});

test('product documentation retains public release history without internal candidate manifests', () => {
  for (const rel of ['README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'docs/release-notes.md',
    'docs/architecture.md','docs/controls.md','docs/browser-support.md','docs/save-format.md',
    'docs/performance.md','docs/performance-controls.md','docs/release.md','docs/development-history.md',
    'docs/feature-matrix.md','docs/travel-journal.md','docs/known-limitations.md','docs/testing-results.md',
    'docs/world-plan.md','docs/licenses/THREE-MIT.txt'])
    assert.ok(exists(rel), `Missing essential release resource ${rel}`);
  for (const doc of fs.readdirSync(path.join(root, 'docs')).filter(f => f.endsWith('.md'))) {
    const text = read(`docs/${doc}`);
    assert.doesNotMatch(text, /2\.1\.0-(?:rc|dev)\./i, `Outdated prerelease identifier in ${doc}`);
    assert.doesNotMatch(text, /(?:Stage [A-F]|Batch [1-9]) (?:implemented|completed|audit)/i, `Development history in ${doc}`);
  }
  const history=read('docs/development-history.md');
  for(const v of ['v1.0.0','2.0.0','2.0.1','2.1.0']) assert.ok(history.includes(v),`Public version history missing ${v}`);
  assert.equal((history.match(/^## 2026-11 — Jade Harbor 2\.1\.0/gm)??[]).length,1, '2.1.0 must be one integrated release entry');
  assert.doesNotMatch(history,/2\.1\.0-(?:rc|dev)\./i);
  assert.ok(!exists('FINAL_RELEASE_GATE.md'));
  assert.ok(!exists('STAGE2_BUILD_REQUIRED.md'));
  assert.ok(!exists('STAGE3_BUILD_REQUIRED.md'));
  assert.ok(!exists('STAGE5_BUILD_REQUIRED.md'));
  assert.equal(fs.readdirSync(path.join(root, 'docs')).filter(f => /manifest\.json$/.test(f)).length, 0);
});

test('release build fails closed, and production package excludes unverifiable source-only builds', () => {
  const build = read('scripts/build-release.mjs'), manifest = read('scripts/release-integrity.mjs');
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.scripts.build === 'node scripts/build-release.mjs');
  assert.ok(pkg.scripts['verify:dist'] === 'node scripts/verify-dist.mjs');
  assert.ok(pkg.scripts['package:verified'].includes('verify:dist'));
  assert.match(build, /rmSync\(join\(root,'dist'\)/);
  assert.match(build, /run\(tsc,\['--noEmit'\]\)/);
  assert.match(build, /verifyReleaseManifest/);
  assert.match(manifest, /Source or build inputs changed after the production build/);
  assert.match(manifest, /Production assets changed after the build/);
  assert.match(read('docs/release.md'), /npm ci/);
  assert.match(read('docs/release.md'), /npm run verify:dist/);
});

test('release scripts reference present entry points and do not invoke deleted profile scripts', () => {
  const pkg = JSON.parse(read('package.json'));
  for (const [name, command] of Object.entries(pkg.scripts)) {
    assert.doesNotMatch(name, /^profile:/);
    for (const match of command.matchAll(/npm run ([\w:.\-]+)/g))
      assert.ok(pkg.scripts[match[1]], `${name} references missing script ${match[1]}`);
    for (const match of command.matchAll(/(?:node(?: --[\w.-]+)*|vitest run)\s+(?:scripts\/|tests\/)([\w.\/-]+)/g))
      assert.ok(exists(match[0].split(' ').slice(-1)[0]), `${name} references missing file ${match[0]}`);
  }
  assert.ok(pkg.scripts['test:regression'].includes('test:source'));
});

test('input/mobile UI copy and source do not retain obsolete release labels', () => {
  const ui = read('src/ui/ui.ts'), style = read('src/ui/style.css');
  assert.match(ui, /Saved locally in this browser/);
  assert.match(ui, /Create your world/);
  assert.match(ui, /Save & return home/);
  assert.match(ui, /Export backup/);
  assert.match(ui, /JADE HARBOR · v\$\{appVersion\}/);
  assert.doesNotMatch(style, /right: 12px; bottom: 2px; font-size: 7px;right:/);
});


test('published source, suites and fixtures contain no internal release-step identifiers', () => {
  const internalLabel = /\b(?:rc[0-9]+(?:[-_.][0-9]+)?|vp[0-9]+(?:\.[0-9]+)?|b[0-9]+\.[0-9]+(?:\.[0-9]+)?|(?:batch|shot)[-_ .]?[0-9]+|(?:stage|patch)[-_ .]+[a-f](?:\.[0-9]+)?|dev\.[0-9]+(?:\.[0-9]+)*|hotfix)\b/i;
  const excluded = new Set(['node_modules','dist','test-results','coverage','.git','.cache','.vite']);
  const textExtensions = new Set(['.md','.ts','.js','.mjs','.cjs','.json','.css','.html','.py']);
  const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
    if (excluded.has(entry.name)) return [];
    const file=path.join(dir,entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
  for(const file of ['README.md','index.html',...walk(path.join(root,'docs')),
    ...walk(path.join(root,'src')),...walk(path.join(root,'scripts')),...walk(path.join(root,'tests'))]) {
    const full=path.isAbsolute(file)?file:path.join(root,file);
    if (!textExtensions.has(path.extname(full))||full===__filename) continue;
    const rel=path.relative(root,full).split(path.sep).join('/');
    assert.doesNotMatch(rel, internalLabel, `Internal file name in ${rel}`);
    assert.doesNotMatch(fs.readFileSync(full,'utf8'),internalLabel, `Intermediate engineering label in ${rel}`);
  }
  const history=read('docs/development-history.md');
  for(const version of ['v1.0.0','2.0.0','2.0.1','2.1.0'])
    assert.ok(history.includes(version),`Published version history missing ${version}`);
  assert.equal((history.match(/^## 2026-11 — Jade Harbor 2\.1\.0$/gm)??[]).length,1);
});

test('published Markdown document links resolve to existing release resources', () => {
  const docs=['README.md',...fs.readdirSync(path.join(root,'docs')).filter(f=>f.endsWith('.md')).map(f=>`docs/${f}`)];
  for(const doc of docs)for(const [,target] of read(doc).matchAll(/\]\(([^)]+)\)/g)){
    if(/^(?:https?:|mailto:|#)/.test(target))continue;
    const local=target.split('#',1)[0];if(!local)continue;
    assert.ok(fs.existsSync(path.resolve(path.dirname(path.join(root,doc)),local)),`Broken Markdown link in ${doc}: ${target}`);
  }
});

test('runtime source files are reachable from the application or generation worker', () => {
  // A compiler AST handles compact import syntax, type-only imports and workers
  // without mistaking ordinary string literals for executable dependencies.
  const ts = require('typescript');
  const files = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
      const full=path.join(dir,entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.ts')) files.push(full);
    }
  };
  walk(path.join(root,'src'));
  const known=new Set(files);
  const resolve=(from,spec)=>{
    if(!spec.startsWith('.'))return null;
    const base=path.resolve(path.dirname(from),spec);
    return [base,`${base}.ts`,path.join(base,'index.ts')].find(x=>known.has(x))??null;
  };
  const graph=new Map();
  for (const file of files) {
    const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
    const imports=new Set();
    const visit=node=>{
      if ((ts.isImportDeclaration(node)||ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier))
        imports.add(node.moduleSpecifier.text);
      if (ts.isCallExpression(node) && node.expression.kind===ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0]))
        imports.add(node.arguments[0].text);
      if (ts.isNewExpression(node) && node.expression.getText(source)==='URL' && node.arguments?.length && ts.isStringLiteral(node.arguments[0]))
        imports.add(node.arguments[0].text);
      ts.forEachChild(node,visit);
    };
    visit(source);
    graph.set(file,[...imports].map(s=>resolve(file,s)).filter(Boolean));
  }
  const visited=new Set(),pending=[path.join(root,'src/main.ts'),path.join(root,'src/world/generation.worker.ts')];
  while(pending.length){
    const file=pending.pop();
    if(!known.has(file)||visited.has(file))continue;
    visited.add(file);
    pending.push(...graph.get(file));
  }
  assert.deepEqual(files.filter(f=>!visited.has(f)).map(f=>path.relative(root,f)),[],
    'Unreachable source modules must be removed or integrated into the runtime');
});

test('public documentation does not reference deleted npm commands or obsolete test snapshots', () => {
  const scripts=JSON.parse(read('package.json')).scripts;
  for(const file of ['README.md',...fs.readdirSync(path.join(root,'docs')).filter(x=>x.endsWith('.md')).map(x=>`docs/${x}`)]) {
    for(const m of read(file).matchAll(/npm run ([\w:.-]+)/g))
      assert.ok(scripts[m[1]],`${file} mentions nonexistent command npm run ${m[1]}`);
  }
  for(const file of ['tests/fixtures/performance-frozen-200.json','tests/fixtures/presentation-reference-world.json'])
    assert.ok(!exists(file),`Obsolete source-hash snapshot should not be in current release: ${file}`);
});
