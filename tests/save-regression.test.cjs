#!/usr/bin/env node
// Exercises the actual save methods extracted from game.ts using the project's
// local TypeScript devDependency for parser/transpiler support.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const vm = require('vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/core/game.ts'), 'utf8');
const ast = ts.createSourceFile('game.ts', source, ts.ScriptTarget.ES2022, true);
const gameClass = ast.statements.find(n => ts.isClassDeclaration(n) && n.name?.text === 'Game');
assert(gameClass, 'Game class must exist');
const methods = ['scheduleSave', 'save'].map(name => {
  const member = gameClass.members.find(n => ts.isMethodDeclaration(n) && n.name.getText(ast) === name);
  assert(member, `${name} must exist in Game`);
  return member.getText(ast);
});
const compiled = ts.transpileModule(`class SaveMethods { ${methods.join('\n')} }\nthis.SaveMethods = SaveMethods;`, {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const ctx = {Error, performance:{now:()=>Date.now()}, timers:new Map(), nextTimerId:0,
  window:{setTimeout:(fn)=>{const id=++ctx.nextTimerId;ctx.timers.set(id,fn);return id;}},
  clearTimeout:(id)=>ctx.timers.delete(id), writeSave:()=>Promise.resolve(1)};
vm.runInNewContext(compiled, ctx);
function deferred() {let resolve,reject; const promise=new Promise((res,rej)=>{resolve=res;reject=rej;});return {promise,resolve,reject};}
function createGame(writer) {
  const g = new ctx.SaveMethods();
  g.active = true; g.meta={id:'world-a'};g.saveRevision=0;g.saveTask=null;g.saveAgain=false;g.saveActivityVersion=0;
  const changes=new Map([['0,1,0',1]]);
  const log=[];
  g.world={dirtyEdits:changes, captureChanges:()=>({revisions:new Map(changes), chunks:[{key:'0,1,0',entries:new Uint16Array([1,10])}]}),
    acknowledgeChanges:rs=>{for(const [k,v] of rs)if(changes.get(k)===v) changes.delete(k);}};
  g.ui={saveStatus:x=>log.push('status:'+x),toast:x=>log.push('toast:'+x)};
  g.view={metrics:{add:(...a)=>log.push('metric')}};
  g.snapshot=()=>({world:'world-a',version:g.saveActivityVersion});
  ctx.writeSave=writer;
  return {g,log,changes};
}
async function spin() {await Promise.resolve();await Promise.resolve();await new Promise(r=>setImmediate(r));}
(async()=>{
  let passed=0;const test=async(name,fn)=>{await fn();console.log('PASS',name);passed++;};
  await test('100 overlapping save calls coalesce into just two transactions',async()=>{
    const first=deferred();let calls=0;
    const {g}=createGame(async()=>{calls++;return calls===1?first.promise:calls;});
    const all=[g.save()];for(let i=0;i<99;i++) all.push(g.save());
    assert.equal(calls,1);first.resolve(1);
    assert((await Promise.all(all)).every(Boolean));assert.equal(calls,2);assert.equal(g.saveRevision,2);
  });
  await test('changes during save are not falsely called fully saved; subsequent save persists',async()=>{
    const first=deferred();let calls=0;let snapshots=[];
    const {g,log,changes}=createGame(async d=>{snapshots.push(d.version);calls++;return calls===1?first.promise:calls;});
    const a=g.save();g.scheduleSave();changes.set('0,1,0',2);g.save();first.resolve(1);
    assert.equal(await a,true);assert.equal(calls,2);assert(snapshots.includes(1));
    assert(log.includes('status:Saved · newer changes pending'));
    assert(log.includes('status:✓ All changes saved'));
    assert.equal(changes.size,0);
  });
  await test('aborted transaction retains dirty data and reports failure',async()=>{
    const {g,log,changes}=createGame(async()=>{throw Error('QuotaExceededError');});
    assert.equal(await g.save(),false);assert.equal(changes.size,1);
    assert(log.some(x=>x.includes('Save failed')));assert(log.some(x=>x.includes('QuotaExceededError')));
  });
  await test('retry after failure commits original dirty data',async()=>{
    let calls=0;const {g,changes}=createGame(async()=>{if(++calls===1)throw Error('write failed');return calls;});
    assert.equal(await g.save(),false);assert.equal(changes.size,1);
    assert.equal(await g.save(),true);assert.equal(changes.size,0);
  });
  await test('world switch prevents a queued follow-up save from writing old world',async()=>{
    const first=deferred();let calls=0;
    const {g}=createGame(async()=>{calls++;return calls===1?first.promise:calls;});
    const saving=g.save();g.save(); // request a second commit during the first
    g.meta={id:'replacement-world'};
    first.resolve(1);
    assert.equal(await saving,false);
    assert.equal(calls,1); // no write into a different world
  });
  await test('save schedule increments activity marker and batches timeout',async()=>{
    const {g}=createGame(async()=>1);const before=ctx.timers.size;
    g.scheduleSave();g.scheduleSave();g.scheduleSave();
    assert.equal(g.saveActivityVersion,3);assert.equal(ctx.timers.size,before+1); // old timers cancelled
  });
  console.log(`${passed} save reliability tests passed.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
