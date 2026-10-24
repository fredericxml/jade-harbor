#!/usr/bin/env node
// Engine reliability invariants: canonical persistence, strict state validation,
// dirty-edit durability, lifecycle cleanup and destructive recovery wiring.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (mod, file) => {
  const js = ts.transpileModule(fs.readFileSync(file,'utf8'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText;
  mod._compile(js.replace(/import\.meta\.url/g,'"file:///virtual-generation-worker.ts"'),file);
};
const { freshWorld, validateSave, encodeEdits } = require('../src/persistence/saves.ts');
const { World } = require('../src/world/world.ts');
const { B } = require('../src/world/blocks.ts');

let passed=0;
function test(name,fn){fn();passed++;console.log(`PASS ${name}`);}
function pairs(delta){return [...delta.entries];}

test('equivalent edit maps encode to canonical deterministic deltas',()=>{
  const a={
    '17,25,1':B.Jade,
    '1,25,1':B.Red,
    '-1,25,-1':B.Gold,
    '2,25,1':B.Glass,
  };
  const b=Object.fromEntries(Object.entries(a).reverse());
  const ea=encodeEdits(a),eb=encodeEdits(b);
  assert.deepEqual(ea.map(x=>x.key),eb.map(x=>x.key));
  assert.deepEqual(ea.map(pairs),eb.map(pairs));
  for(const d of ea) for(let i=2;i<d.entries.length;i+=2)
    assert.ok(d.entries[i-2] < d.entries[i],`non-canonical entry order in ${d.key}`);
});

test('validateSave sanitizes a clone instead of mutating caller state',()=>{
  const raw=freshWorld('n'.repeat(100),'s'.repeat(150),'creative','reliability-clone');
  const clean=validateSave(raw);
  assert.equal(clean.name.length,64);
  assert.equal(clean.seed.length,100);
  assert.equal(raw.name.length,100);
  assert.equal(raw.seed.length,150);
  assert.notEqual(clean,raw);
  assert.notEqual(clean.player,raw.player);
});

test('strict schema rejects arbitrary top-level, player and simulation payloads',()=>{
  const base=freshWorld('strict','reliability','creative','reliability-strict');
  assert.throws(()=>validateSave({...base,unexpected:true}),/Unsupported or damaged/);
  assert.throws(()=>validateSave({...base,player:{...base.player,unexpected:true}}),/Unsupported or damaged/);
  assert.throws(()=>validateSave({...base,simulation:{mystery:{payload:'x'}}}),/simulation/);
  assert.throws(()=>validateSave({...base,achievements:Array(257).fill('x')}),/Unsupported or damaged/);
  assert.throws(()=>validateSave({...base,achievements:['same','same']}),/Unsupported or damaged/);
});

test('pathological persisted entity clocks and drop ages are rejected',()=>{
  const base=freshWorld('bounds','reliability','creative','reliability-bounds');
  const entity={
    id:'e',kind:'spirit',name:'spirit',
    body:{position:{x:0,y:21,z:0},velocity:{x:0,y:0,z:0},grounded:true,flying:false,fallStart:21},
    health:16,home:{x:0,y:21,z:0},goal:{x:1,y:21,z:0},timer:0,cooldown:0,yaw:0,state:'idle',trades:0,
  };
  for(const variant of [{timer:1e300},{cooldown:-1},{cooldown:1e6},{yaw:1e300}])
    assert.throws(()=>validateSave({...base,simulation:{entities:[{...entity,...variant}],drops:[]}}),/simulation/);
  const drop={id:'d',stack:{id:B.Red,count:1},position:{x:0,y:21,z:0},velocity:{x:0,y:0,z:0},age:601};
  assert.throws(()=>validateSave({...base,simulation:{entities:[],drops:[drop]}}),/simulation/);
});

test('unsaved edited columns are pinned even without an autosave callback',()=>{
  const w=new World('reliability',{},false);
  w.ensure(0,0,true);
  w.set(1,25,1,B.Red);
  assert.equal(w.onEvictionPending,undefined);
  w.stream(1000,1000,0);
  assert.equal(w.chunks.has('0,0'),true,'dirty chunk was evicted without callback');
  assert.equal(w.evictionBlocked,1);
  const snap=w.captureChanges();
  w.acknowledgeChanges(snap.revisions);
  w.stream(1000,1000,0);
  assert.equal(w.chunks.has('0,0'),false,'acknowledged chunk stayed pinned');
});

test('dirty capture is deterministic and newer edits survive old acknowledgements',()=>{
  const a=new World('reliability',{},false),b=new World('reliability',{},false);
  a.set(2,25,1,B.Glass);a.set(1,25,1,B.Red);
  b.set(1,25,1,B.Red);b.set(2,25,1,B.Glass);
  assert.deepEqual(a.captureChanges().chunks.map(x=>[x.key,[...x.entries]]),b.captureChanges().chunks.map(x=>[x.key,[...x.entries]]));
  const old=a.captureChanges();
  a.set(3,25,1,B.Jade);
  a.acknowledgeChanges(old.revisions);
  assert.equal(a.captureChanges().chunks.length,1);
  assert.equal(a.captureChanges().chunks[0].entries.length,6);
});

test('dispose tears down worker/lifecycle references and buffered edit state',()=>{
  const w=new World('reliability',{},false);
  w.set(1,25,1,B.Red);
  w.pending.add('3,3');
  w.onChange=()=>{};w.onGeneration=()=>{};w.onEvictionPending=()=>{};
  w.dispose();
  assert.equal(w.chunks.size,0);assert.equal(w.pending.size,0);assert.equal(w.dirty.size,0);
  assert.equal(w.dirtyEdits.size,0);assert.equal(w.edits.size,0);
  assert.equal(w.onChange,undefined);assert.equal(w.onGeneration,undefined);assert.equal(w.onEvictionPending,undefined);
});

test('damaged-world reset is wired as an atomic full replacement recovery path',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../src/persistence/saves.ts'),'utf8');
  assert.match(source,/async function recoveryWorldMeta\(id: string\)/);
  assert.match(source,/fresh = freshWorld\(old\.name, old\.seed, old\.mode, id\)/);
  assert.match(source,/commitSave\(fresh, undefined, old\.revision, true\)/);
  assert.match(source,/if \(allowRecovery && changes !== undefined\)/);
  assert.match(source,/Recovery writes must replace the complete save/);
});

test('IndexedDB bootstrap is idempotent for future schema upgrades',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../src/persistence/saves.ts'),'utf8');
  assert.match(source,/DATABASE_VERSION = 1/);
  assert.match(source,/objectStoreNames\.contains\(name\)/);
  assert.match(source,/indexNames\.contains\("worldId"\)/);
});

console.log(`${passed} engine reliability regression checks passed.`);
