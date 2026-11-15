const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const scripts=pkg.scripts;
const commands=Object.values(scripts).join('\n');
const testFiles=fs.readdirSync(path.join(root,'tests')).filter(x=>fs.statSync(path.join(root,'tests',x)).isFile());

test('release runners use functional names instead of engineering checkpoint names',()=>{
  assert.equal(pkg.version,'2.1.0');
  const forbidden=/\b(?:rc\d+|vp\d+|b\d+\.\d+|dev\.\d+|stage[-.]?[a-f0-9]+|batch[-.]?\d+|shot\d+|patch[-.]?[a-d])\b/i;
  for(const script of Object.keys(scripts))assert.doesNotMatch(script,forbidden,`Non-product runner: ${script}`);
  for(const file of testFiles)assert.doesNotMatch(file,forbidden,`Historical test file: ${file}`);
  assert.ok(scripts['test:regression'].includes('npm test'), 'Unit tests must run with the full regression chain');
});

test('every dependency-free Node regression remains reachable through its consolidated suite',()=>{
  for(const file of testFiles.filter(n=>n.endsWith('.test.cjs')))
    assert.ok(commands.includes('tests/'+file),`Unreachable Node regression: ${file}`);
  assert.ok(scripts['test:engine'].includes('tests/resource-lifecycle.test.cjs'));
  assert.ok(scripts['test:rendering'].includes('tests/mesh-scheduler-throughput-regression.test.cjs'));
  assert.ok(scripts['test:world:runtime'].includes('tests/streaming-soak.test.cjs'));
});

test('all browser acceptance and optional benchmark entrypoints remain reachable',()=>{
  for(const file of testFiles.filter(n=>n.endsWith('-browser.mjs')))
    assert.ok(commands.includes('tests/'+file),`Unreachable browser acceptance: ${file}`);
  for(const file of ['atmosphere-material-profile.mjs','input-poll-profile.mjs',
    'performance-foundation-profile.mjs','touch-controls-live-profile.mjs','touch-controls-profile.mjs'])
    assert.ok(scripts['test:benchmarks:browser'].includes('tests/'+file),`Unreachable optional benchmark: ${file}`);
});

test('release integrity remains fail-closed and never packages an unverified build',()=>{
  assert.equal(scripts.build,'node scripts/build-release.mjs');
  assert.ok(scripts['test:release'].includes('npm run build'));
  assert.ok(scripts['test:release:checks'].includes('npm run test:regression'));
  assert.ok(scripts['package:verified'].includes('npm run verify:dist'));
  assert.ok(scripts['test:release-integrity'].includes('tests/release-integrity.test.mjs'));
  for(const name of ['docs/development-history.md','docs/feature-matrix.md','docs/testing-results.md',
    'docs/world-plan.md','docs/known-limitations.md','docs/travel-journal.md'])
    assert.ok(fs.existsSync(path.join(root,name)),`Public release reference lost: ${name}`);
});
