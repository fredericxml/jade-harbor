#!/usr/bin/env node
// Deep integrity regression coverage.
// Covers source-level defects found by independent call-path and invariant sweeps.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
  fileName: f,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, f);

const { B, block } = require('../src/world/blocks.ts');
const coords = require('../src/core/coords.ts');
const { chestInventory } = require('../src/game/storage.ts');
const { clearMeleeSight } = require('../src/game/combat.ts');
const { freshWorld, validateSave } = require('../src/persistence/saves.ts');

let checks = 0;
function test(name, fn) {
  fn();
  checks++;
  console.log('PASS', name);
}

function extractGameMethod(name) {
  const source = fs.readFileSync(path.join(__dirname, '../src/core/game.ts'), 'utf8');
  const ast = ts.createSourceFile('game.ts', source, ts.ScriptTarget.ES2022, true);
  const cls = ast.statements.find(n => ts.isClassDeclaration(n) && n.name?.text === 'Game');
  const member = cls?.members.find(m => ts.isMethodDeclaration(m) && m.name.getText(ast) === name);
  assert(member, `Missing Game.${name}`);
  const js = ts.transpileModule(`class AuditGame {${member.getText(ast)}}`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return Function('B','idOf','stateOf','blockKey','chestInventory', `${js};return AuditGame`)(
    B, coords.idOf, coords.stateOf, coords.blockKey, chestInventory,
  );
}
const BreakGame = extractGameMethod('breakContents');

// 1. Generated chest discovery loot is lazy. Mining an unopened generated chest
// must materialize and drop the same contents that opening it would reveal.
test('Mining an unopened generated chest preserves discovery loot', () => {
  const key = coords.blockKey(100, 20, 0);
  const world = {
    edits: new Map(),
    get(x,y,z) { return x === 100 && y === 20 && z === 0 ? B.Chest : B.Air; },
    set() { return true; },
  };
  const game = new BreakGame();
  game.world = world;
  game.containers = {};
  game.simulation = { furnaces:{}, brewers:{}, automation:{ hoppers:{} } };
  let dropped;
  game.entities = { dropMany(contents) { dropped = structuredClone(contents.filter(Boolean)); return true; } };
  assert.equal(game.breakContents(100,20,0,[{id:B.Chest,count:1}]), true);
  assert(dropped.some(s => s.id === 111 && s.count === 2), 'jade-token discovery loot vanished');
  assert(dropped.some(s => s.id === 105 && s.count === 3), 'food discovery loot vanished');
  assert(dropped.some(s => s.id === B.Chest && s.count === 1), 'chest block loot vanished');
  assert.equal(game.containers[key], undefined, 'broken chest container was not cleared');
});

test('Blocked unopened chest mining is atomic and does not duplicate discovery loot', () => {
  const key = coords.blockKey(100,20,0);
  const world = { edits:new Map(), get:()=>B.Chest, set:()=>true };
  const game = new BreakGame();
  game.world=world; game.containers={};
  game.simulation={furnaces:{},brewers:{},automation:{hoppers:{}}};
  game.entities={dropMany(){return false;}};
  assert.equal(game.breakContents(100,20,0,[{id:B.Chest,count:1}]),false);
  assert.deepEqual(game.containers[key].slice(0,2),[{id:111,count:2},{id:105,count:3}]);
  let dropped;
  game.entities={dropMany(contents){dropped=structuredClone(contents.filter(Boolean));return true;}};
  assert.equal(game.breakContents(100,20,0,[{id:B.Chest,count:1}]),true);
  assert.equal(dropped.filter(s=>s.id===111).reduce((n,s)=>n+s.count,0),2);
  assert.equal(dropped.filter(s=>s.id===105).reduce((n,s)=>n+s.count,0),3);
});

// 2. Physics substep count is proportional to persisted speed. Reject corrupt
// million-unit velocity/knockback instead of allowing a main-thread freeze.
test('Save validator rejects pathological entity and drop motion', () => {
  const normal = freshWorld('Regression','motion-normal','survival');
  normal.simulation = { entities: [{
    id:'e',kind:'spirit',name:'Spirit',state:'idle',body:{position:{x:0,y:40,z:0},velocity:{x:2,y:-20,z:1},grounded:false,flying:false,fallStart:40},
    health:16,home:{x:0,y:40,z:0},goal:{x:1,y:40,z:1},timer:0,cooldown:0,yaw:0,trades:0,knockback:{x:3,y:0,z:2},
  }], drops:[{id:'d',stack:{id:103,count:1},position:{x:0,y:40,z:0},velocity:{x:0,y:2,z:0},age:1}] };
  assert.doesNotThrow(()=>validateSave(normal));

  for (const mutate of [
    d => d.simulation.entities[0].body.velocity.x = 1e7,
    d => d.simulation.entities[0].knockback.x = 1e7,
    d => d.simulation.drops[0].velocity.y = 1e7,
  ]) {
    const bad = structuredClone(normal); mutate(bad);
    assert.throws(()=>validateSave(bad),/Invalid world simulation data/);
  }
});

// 3. Simulation is persisted untrusted data; primitives/arrays are malformed,
// not a valid empty simulation object.
test('Save validator rejects primitive/array simulation payloads', () => {
  for (const simulation of [42, 'sim', [], null]) {
    const d = freshWorld('Regression','bad-sim','survival');
    d.simulation = simulation;
    assert.throws(()=>validateSave(d),/Invalid world simulation data/);
  }
});

// 4. Air has exactly one canonical encoding (0). Air with state bits is invisible
// but raw-zero checks treat it as occupied, creating ghost placement/fluid blockers.
test('Save validator rejects packed/stateful Air world edits', () => {
  const d = freshWorld('Regression','ghost-air','survival');
  d.edits['0,20,0'] = coords.packed(B.Air,1);
  assert.throws(()=>validateSave(d),/Invalid world block/);
});

// Also execute the private chunk-delta validator extracted from actual source so
// corruption in IndexedDB chunk records is covered, not only imported JSON edits.
test('Chunk-delta validator rejects packed/stateful Air records', () => {
  const source = fs.readFileSync(path.join(__dirname,'../src/persistence/saves.ts'),'utf8');
  const ast = ts.createSourceFile('saves.ts',source,ts.ScriptTarget.ES2022,true);
  const wanted = ['validSectionKey','validBlockValue','validateDelta'];
  const decls = wanted.map(name => {
    const n = ast.statements.find(x=>ts.isFunctionDeclaration(x)&&x.name?.text===name);
    assert(n,`Missing ${name}`); return n.getText(ast);
  });
  const js = ts.transpileModule(decls.join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  const validateDelta = Function('B','block','MIN_SECTION','MAX_SECTION',`${js};return validateDelta`)(B,block,coords.MIN_SECTION,coords.MAX_SECTION);
  assert.doesNotThrow(()=>validateDelta({key:'0,1,0',entries:new Uint16Array([0,B.Stone])}));
  assert.throws(()=>validateDelta({key:'0,1,0',entries:new Uint16Array([0,coords.packed(B.Air,1)])}),/Invalid or duplicate chunk entry/);
});

// 5. Melee line-of-sight follows collision semantics. Thin/decorative non-solid
// blocks must not behave as invisible combat walls.
test('Melee sight ignores non-solid decorations but solid walls still block', () => {
  const from={x:.5,y:2.5,z:.5}, to={x:.5,y:2.5,z:2.5};
  const worldFor = value => ({ get(_x,_y,z) { return Math.floor(z)===1 ? value : B.Air; } });
  assert.equal(clearMeleeSight(worldFor(B.Stone),from,to),false);
  assert.equal(clearMeleeSight(worldFor(B.Glass),from,to),false);
  for (const v of [B.Water,B.Wire,B.Lantern,B.Flower,B.Lotus])
    assert.equal(clearMeleeSight(worldFor(v),from,to),true,`${block(v).name} incorrectly blocked melee sight`);
});

console.log(`PASS deep integrity regression (${checks} groups)`);
