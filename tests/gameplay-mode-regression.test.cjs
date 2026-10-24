const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/core/game.ts', 'utf8');
const saveSource = fs.readFileSync('src/persistence/saves.ts', 'utf8');
const checks = [];
const check = (label, cb) => { cb(); checks.push(label); console.log('PASS', label); };

check('Creative flight persistence is stored in snapshots', () => {
  assert.match(source, /flying:\s*this\.mode === "spectator" \|\|\s*\(this\.mode === "creative" && this\.body\.flying\)/);
});
check('Creative flight restores while Survival does not', () => {
  assert.match(source, /this\.body\.flying = this\.mode === "spectator" \|\|\s*\(this\.mode === "creative" && data\.player\.flying === true\)/);
  for (const mode of ['survival', 'adventure', 'hardcore']) assert.equal(mode === 'spectator' || (mode === 'creative' && true), false);
});
check('G and double-Space creative flight toggles request persistence', () => {
  assert.match(source, /now - this\.lastJump < 280[^]*?this\.body\.flying = !this\.body\.flying;\s*this\.scheduleSave\(\)/);
  assert.match(source, /code === "KeyG" && this\.mode === "creative"\) \{\s*this\.body\.flying = !this\.body\.flying;\s*this\.scheduleSave\(\)/);
});
check('Save schema includes validated optional boolean and initial flying state', () => {
  assert.match(saveSource, /flying\?: boolean;/);
  assert.match(saveSource, /flying: mode === "spectator"/);
  assert.match(saveSource, /typeof p\.flying !== "boolean"/);
});

const sampleWorld = {
  ensure() {},
  get(x,y,z) { x=Math.floor(x); y=Math.floor(y); z=Math.floor(z); return y === 20 ? 3 : (x === 0 && z === 0 && y === 21 ? 5 : 0); }
};
function setup(Class) {
  const g = new Class();
  g.spawn = {x:.5,y:21.1,z:.5};
  g.world = sampleWorld;
  g.body = {position:{...g.spawn},velocity:{x:0,y:0,z:0}};
  g.previous = {...g.spawn};
  return g;
}
const collides = (world,p) => world.get(p.x,p.y,p.z) === 3;
const idOf = v => v & 255;
const block = v => ({solid:(v & 255) === 3});
const start = source.indexOf('  safeSpawn() {');
const end = source.indexOf('  snapshot(', start);
assert.ok(start >= 0 && end > start);
const transpiled = ts.transpileModule('class T {' + source.slice(start,end) + '}', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const Source = Function('collides','idOf','block','B','MIN_Y','MAX_Y', transpiled + ';return T;')(collides,idOf,block,{Water:5,Lava:37},-64,319);
for (const [label,Cl] of [['source',Source]]) {
  check(label + ' safe respawn avoids water and uses nearby supported dry ground', () => {
    const g=setup(Cl);g.safeSpawn();
    assert.equal(g.body.position.y,21.1);
    assert.notEqual(Math.floor(g.body.position.x) === 0 && Math.floor(g.body.position.z) === 0, true);
    assert.notEqual(sampleWorld.get(g.body.position.x,g.body.position.y,g.body.position.z),5);
    assert.equal(sampleWorld.get(g.body.position.x,g.body.position.y-.15,g.body.position.z),3);
  });
}
console.log('PASS '+checks.length+' gameplay regression checks');
