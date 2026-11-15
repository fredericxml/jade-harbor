const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');

const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/render/renderer.ts'),'utf8');
const gameSource=fs.readFileSync(path.join(root,'src/core/game.ts'),'utf8');
const start=source.indexOf('  /** Commit a player\'s mined block');
const end=source.indexOf('  removeSection(key:string',start);
assert.ok(start>=0&&end>start,'player edit visual commit method exists');
const js=ts.transpileModule(`class TestView {\n${source.slice(start,end)}\n}`,{
  compilerOptions:{target:ts.ScriptTarget.ES2022},
}).outputText;

class Group {
  constructor(){this.position={set(){}};}
}
function fixture(initialVisible=true){
  const calls=[];
  const section={id:'before'};
  const world={
    chunks:new Map([['0,0',{cx:0,cz:0,blocks:{sections:new Map([[0,{}]])}}]]),
    dirty:new Set(['0,0,0']),sectionDirtyRevision:new Map([['0,0,0',2]]),
  };
  function* meshSteps(_world,chunk,_lighting,sectionY){
    calls.push(['mesh',chunk.cx,chunk.cz,sectionY]);
    yield;
    yield;
    return [{indices:new Uint16Array(0)}];
  }
  const clock={now:(()=>{let n=0;return ()=>++n;})()};
  const T=Function('THREE','meshChunkSteps','performance',`${js}; return TestView;`)({Group},meshSteps,clock);
  const view=Object.assign(new T(),{
    sections:new Map(initialVisible?[['0,0,0',section]]:[]),
    meshCommits:new Map(),
    meshQueueEntryByKey:new Map([['0,0,0',{firstBuild:false,ready:false}]]),
    meshFrameSequence:4,
    lighting:{},
    metrics:{add(name,value){calls.push(['metric',name,value]);}},
    cancelMeshWork(key){calls.push(['cancel',key]);},
    advanceMeshCommit(w,commit){
      calls.push(['commit',commit.key]);
      w.dirty.delete(commit.key);
      this.meshCommits.delete(commit.key);
      this.sections.set(commit.key,{id:'after'});
      return true;
    },
    recordMeshQueueReady(entry){calls.push(['ready',entry]);},
  });
  return {world,view,calls,section};
}

test('player mining replaces the already-visible section before returning, independently of background queue',()=>{
  const {world,view,calls,section}=fixture();
  view.commitMinedBlock(world,2,4,8);
  assert.notEqual(view.sections.get('0,0,0'),section);
  assert.ok(!world.dirty.has('0,0,0'));
  assert.ok(!view.meshQueueEntryByKey.has('0,0,0'));
  assert.deepEqual(calls.filter(c=>c[0]==='mesh').length,1);
  assert.deepEqual(calls.filter(c=>c[0]==='cancel').length,1);
  assert.deepEqual(calls.filter(c=>c[0]==='commit').length,1);
});

test('unrendered sections stay on the normal meshing scheduler',()=>{
  const {world,view,calls}=fixture(false);
  view.commitMinedBlock(world,1,2,3);
  assert.equal(calls.length,0);
  assert.ok(world.dirty.has('0,0,0'));
});

test('player mine commits world data before refreshing visual, and only on successful edit',()=>{
  const start=gameSource.indexOf('  mine(dt: number)');
  const end=gameSource.indexOf('  showCraft()',start);
  assert.ok(start>=0&&end>start);
  const mine=gameSource.slice(start,end);
  const edit=mine.indexOf('if(!this.world.set(hit.x, hit.y, hit.z, 0)) return;');
  const visual=mine.indexOf('this.view.commitMinedBlock(this.world, hit.x, hit.y, hit.z);');
  const effects=mine.indexOf('this.effects.burst(hit, b.color);');
  assert.ok(edit>=0&&visual>edit&&effects>visual);
});
