/* Source integration tests: transpile actual TypeScript source with the local TypeScript devDependency.
 * Run: node tests/combat-regression.test.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  module._compile(code, filename);
};
const { Entities, spawnEntity } = require('../src/game/entities.ts');
const { rayBoxDistance, clearMeleeSight, meleeSightBetween } = require('../src/game/combat.ts');
const { Inventory } = require('../src/game/inventory.ts');
const { B } = require('../src/world/blocks.ts');
const here = (x=0.5,y=1.01,z=0.5) => ({x,y,z});
function flatWorld(blocker = () => false) {
  return {
    seed:'combat-regression', navRevision: 0, loaded:()=>true,
    get(x,y,z) {return blocker(Math.floor(x), Math.floor(y), Math.floor(z)) ? B.Stone : Math.floor(y) <= 0 ? B.Stone : B.Air;},
    set() {return true;}
  };
}
let count = 0;
function test(name, fn) { try { fn(); console.log('PASS', name); count++; } catch(e) {console.error('FAIL',name);throw e;} }
function encounter(e, world=flatWorld()) {return new Entities(world, {entities:[e], drops:[]});}

test('ray-box selects the first surface rather than requiring aim at center', () => {
  const distance = rayBoxDistance(here(0,1.6,0),{x:0,y:0,z:1}, here(-.36,1,2.64),here(.36,2.76,3.36));
  assert.ok(distance > 2.63 && distance < 2.65);
});
test('ray-box rejects rays outside hitbox and rays pointed away', () => {
  assert.equal(rayBoxDistance(here(1,1.6,0),{x:0,y:0,z:1},here(-.3,1,2.6),here(.3,2.7,3.4)),null);
  assert.equal(rayBoxDistance(here(0,1.6,0),{x:0,y:0,z:-1},here(-.3,1,2.6),here(.3,2.7,3.4)),null);
});
test('melee sight succeeds through empty space',()=>{
  assert.equal(meleeSightBetween(flatWorld(),here(.5,1.01,.5),here(.5,1.01,2.2)),true);
});
test('solid walls prevent melee through surfaces',()=>{
  const wall=flatWorld((x,y,z)=>z===1 && y>=1 && y<=3);
  assert.equal(meleeSightBetween(wall,here(.5,1.01,.5),here(.5,1.01,2.2)),false);
  assert.equal(clearMeleeSight(wall,here(.5,2.5,.5),here(.5,2.5,2.5)),false);
});
test('targeting ignores dead entities',()=>{
  const spirit=spawnEntity('spirit',here(.5,1,3));spirit.health=0;
  assert.equal(encounter(spirit).target(here(.5,2.2,.5),{x:0,y:0,z:1},4),null);
});
test('targeting chooses closer living entity',()=>{
  const near=spawnEntity('spirit',here(.5,1,2.5));const far=spawnEntity('spirit',here(.5,1,3.8));
  const entities=new Entities(flatWorld(),{entities:[far,near],drops:[]});
  assert.equal(entities.target(here(.5,2.2,.5),{x:0,y:0,z:1},4),near);
});
test('targeting rejects ungenerated chunks',()=>{
  const spirit=spawnEntity('spirit',here(.5,1,3));
  const world=flatWorld();world.loaded=()=>false;
  assert.equal(encounter(spirit,world).target(here(.5,2,.5),{x:0,y:0,z:1},4),null);
});
test('16 basic hits defeat one 16-HP spirit with exactly one loot drop',()=>{
  const spirit=spawnEntity('spirit',here());const entities=encounter(spirit);
  for(let i=0;i<15;i++) {
    assert.deepEqual(entities.applyHit(spirit,1,here(1,0,0)).status,'hit');
    assert.equal(spirit.health,15-i);
  }
  assert.equal(entities.applyHit(spirit,1,here(1,0,0)).status,'killed');
  assert.equal(entities.drops.length,1);
  assert.equal(entities.drops[0].stack.id,103);
  assert.equal(entities.applyHit(spirit,3,here(1,0,0)).status,'invalid');
  assert.equal(entities.drops.length,1);
});
test('attack rejects invalid and out-of-list targets',()=>{
  const e=spawnEntity('spirit',here()),entities=encounter(e);
  assert.equal(entities.applyHit(e,0,here()).status,'invalid');
  assert.equal(entities.applyHit(e,Number.NaN,here()).status,'invalid');
  assert.equal(entities.applyHit(spawnEntity('spirit',here()),10,here()).status,'invalid');
  assert.equal(e.health,16);
});
test('simultaneous guard hits cannot duplicate loot from an already-dead mob',()=>{
  const e=spawnEntity('spirit',here()),entities=encounter(e);
  assert.equal(entities.attack(e,16,here(1,0,0)),true);
  assert.equal(entities.attack(e,16,here(1,0,0)),false);
  assert.equal(entities.drops.length,1);
});
test('saturated dropped-item storage prevents silent loot deletion',()=>{
  const e=spawnEntity('spirit',here()),entities=encounter(e);
  entities.drops=Array.from({length:256},(_,i)=>({id:`item-${i}`,stack:{id:103,count:64},position:here(200+i,1,200),velocity:here(0,0,0),age:0}));
  const r=entities.applyHit(e,25,here(1,0,0));
  assert.equal(r.status,'blocked');
  assert.equal(e.health,16);
  assert.equal(entities.drops.length,256);
});
test('weapon knockback is applied and stored for AI movement',()=>{
  const e=spawnEntity('spirit',here()),entities=encounter(e);
  entities.applyHit(e,2,{x:3,y:0,z:4});
  assert.ok(e.knockback.x > 0 && e.knockback.z > 0);
  assert.ok(e.body.velocity.y>=2.5);
});
test('a guard cannot strike a spirit through a stone wall',()=>{
  const guard=spawnEntity('villager',here(.5,1.01,.5));guard.profession='guard';guard.workplace=here(.5,1.01,.5);
  const spirit=spawnEntity('spirit',here(.5,1.01,2));
  const entities=new Entities(flatWorld((x,y,z)=>z===1 && y>=1 && y<=3),{entities:[guard,spirit],drops:[]});
  entities.tick(.05,here(20,1.01,20),new Inventory(),.6,false,()=>{},()=>{});
  assert.equal(spirit.health,16);
});
test('spirit keeps closing distance while the player strafes across target cells',()=>{
  const spirit=spawnEntity('spirit',here(.5,1.01,12.5));
  const entities=encounter(spirit);
  const inv=new Inventory();
  const startZ=spirit.body.position.z;
  for(let i=0;i<60;i++) {
    const player=here(i%2===0?-.75:1.75,1.01,.5);
    entities.tick(.05,player,inv,.6,true,()=>{},()=>{});
  }
  assert.ok(spirit.body.position.z < startZ-5,
    `melee hostile failed to close distance while target strafed: z=${spirit.body.position.z}`);
});
test('spirit cannot damage a player on the other side of a wall',()=>{
  const spirit=spawnEntity('spirit',here(.5,1.01,.5));
  const entities=encounter(spirit,flatWorld((x,y,z)=>z===1 && y>=1 && y<=3));
  let damage=0;
  entities.tick(.05,here(.5,1.01,2),new Inventory(),.6,true,n=>damage+=n,()=>{});
  assert.equal(damage,0);
});
test('guard still attacks a visible nearby threat',()=>{
  const guard=spawnEntity('villager',here(.5,1.01,.5));guard.profession='guard';guard.workplace=here(.5,1.01,.5);
  const spirit=spawnEntity('spirit',here(.5,1.01,1.9));
  const entities=new Entities(flatWorld(),{entities:[guard,spirit],drops:[]});
  entities.tick(.05,here(20,1.01,20),new Inventory(),.6,false,()=>{},()=>{});
  assert.equal(spirit.health,12);
});
console.log(`${count} combat & entity integration checks passed.`);
