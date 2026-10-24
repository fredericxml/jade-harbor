const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {Simulation}=require('../src/game/simulation.ts'),{B}=require('../src/world/blocks.ts'),{packed,idOf,stateOf}=require('../src/core/coords.ts');
const create=()=>{const cells=new Map(),edits=new Map();let writes=0;const world={chunks:new Map(),edits,seed:'systems',
 get:(x,y,z)=>cells.get(`${x},${y},${z}`)??0,
 loaded:()=>true,
 set(x,y,z,value){cells.set(`${x},${y},${z}`,value);edits.set(`${x},${y},${z}`,value);writes++;return true}};
 return {world,cells,writes:()=>writes,sim:new Simulation(world)};
};
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS',name)};
test('Switch -> wire -> lamp energizes and de-energizes when flipped',()=>{
 const {world,sim}=create();world.set(0,40,0,packed(B.Switch,1));world.set(1,40,0,B.Wire);world.set(2,40,0,B.Lamp);
 for(const k of ['0,40,0','1,40,0','2,40,0'])sim.specials.set(k,world.get(...k.split(',').map(Number)));
 sim.circuits();assert(stateOf(world.get(1,40,0))>0);assert.equal(stateOf(world.get(2,40,0)),1);
 world.set(0,40,0,packed(B.Switch,0));sim.circuits();assert.equal(stateOf(world.get(1,40,0)),0);assert.equal(stateOf(world.get(2,40,0)),0);
});
test('Powered two-block door preserves its top/bottom pairing',()=>{
 const {world,sim}=create();world.set(0,40,0,packed(B.Switch,1));world.set(1,40,0,B.Door);world.set(1,41,0,packed(B.Door,8));
 for(const k of ['0,40,0','1,40,0','1,41,0'])sim.specials.set(k,world.get(...k.split(',').map(Number)));
 sim.circuits();assert.equal(stateOf(world.get(1,40,0))&4,4);assert.equal(stateOf(world.get(1,41,0))&4,4);
 world.set(0,40,0,packed(B.Switch,0));sim.circuits();assert.equal(stateOf(world.get(1,40,0))&4,0);assert.equal(stateOf(world.get(1,41,0))&4,0);
});
test('Zero simulation work budget never mutates queued blocks',()=>{
 const {world,sim}=create();world.set(0,44,0,B.Sand);sim.changed(0,44,0);const size=sim.queue.size;
 sim.updates(0);assert.equal(world.get(0,44,0),B.Sand);assert.equal(sim.queue.size,size);
});
test('Sand falls exactly one cell into air and retains block identity',()=>{
 const {world,sim}=create();world.set(0,43,0,B.Sand);sim.changed(0,43,0);sim.updates(64);
 assert.equal(world.get(0,43,0),0);assert.equal(idOf(world.get(0,42,0)),B.Sand);
});
test('Water-lava reaction hardens lava without deleting unrelated blocks',()=>{
 const {world,sim}=create();world.set(0,40,0,B.Water);world.set(1,40,0,B.Lava);world.set(2,40,0,B.Stone);
 sim.changed(1,40,0);sim.updates(64);
 assert([B.Obsidian,B.Stone].includes(idOf(world.get(1,40,0))));
 assert.equal(world.get(2,40,0),B.Stone);
});
test('Rice growth progresses while hydrated by rain, without placing blocks above crops',()=>{
 const {world,sim}=create();sim.weather='rain';world.set(2,40,3,B.Rice);sim.specials.set('2,40,3',B.Rice);
 let grown=false;
 for(let i=0;i<30;i++){
  sim.tick(12,{x:2,y:40,z:3});
  const now=world.get(2,40,3);
  if(stateOf(now)>0){grown=true;break;}
 }
 assert(grown,'Rain-hydrated rice never grew');assert.equal(world.get(2,41,3),0);
});
console.log('PASS world simulation/circuits/farming:',checks,'systems');
