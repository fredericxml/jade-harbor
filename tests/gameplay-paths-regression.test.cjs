#!/usr/bin/env node
// Tests actual Game.use/Game.mine methods, not catalog metadata or simulated placeholders.
// Can run offline with global TypeScript, without Vite or Three.js.
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {B,BLOCKS,block}=require('../src/world/blocks.ts');
const {ITEMS,item}=require('../src/game/items.ts');
const {Inventory}=require('../src/game/inventory.ts');
const {POTIONS,StatusEffects,enchantLevel}=require('../src/game/progression.ts');
const {useBucket}=require('../src/game/buckets.ts');
const coords=require('../src/core/coords.ts');
const gameText=fs.readFileSync(path.join(__dirname,'../src/core/game.ts'),'utf8');
const ast=ts.createSourceFile('game.ts',gameText,ts.ScriptTarget.ES2022,true);
const gameClass=ast.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='Game');
const methods=['use','mine'].map(name=>{const member=gameClass?.members.find(m=>ts.isMethodDeclaration(m)&&m.name.getText(ast)===name);assert(member,`Missing Game.${name}`);return member.getText(ast);});
let js=ts.transpileModule(`class GameplayMethods {${methods.join('\n')}}`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const GameplayMethods=Function('B','block','item','POTIONS','StatusEffects','enchantLevel','useBucket','Inventory','overlapsBlock','MIN_Y','MAX_Y','idOf','stateOf','blockKey','packed',js+';return GameplayMethods')(
 B,block,item,POTIONS,StatusEffects,enchantLevel,useBucket,Inventory,()=>false,coords.MIN_Y,coords.MAX_Y,coords.idOf,coords.stateOf,coords.blockKey,coords.packed);
const position={x:0,y:40,z:0};
const mk=(selectedId,mode='survival',hitBlock=B.Stone)=>{
 const game=new GameplayMethods(), cells=new Map([[coords.blockKey(2,40,2),hitBlock]]), mutations=[];
 game.mode=mode;game.cooldown=0;game.health=12;game.hunger=8;game.saturation=5;game.xp=0;game.mineProgress=0;
 game.input={keys:new Set(),left:true};game.body={position:{...position}};
 game.inventory=new Inventory();if(selectedId!==null) assert.equal(game.inventory.add(selectedId),0,`Cannot insert item ${selectedId}`);
 game.world={get(x,y,z){return cells.get(coords.blockKey(x,y,z))??0},loaded:()=>true,set(x,y,z,v){cells.set(coords.blockKey(x,y,z),v);mutations.push([x,y,z,v]);return true}};
 game.hit={x:2,y:40,z:2,value:hitBlock,normal:{x:1,y:0,z:0},distance:2};game.target=()=>game.hit;
 game.entities={target:()=>null,drop:()=>true};game.direction=()=>({x:1,y:0,z:0});game.audio={play:()=>{}};
 game.ui={toast:()=>{}};game.effects={burst:()=>{}};game.unlockAchievement=()=>{};game.scheduleSave=()=>{};
 game.status=new StatusEffects();game.yaw=0;
 let loot=[];game.breakContents=(_x,_y,_z,drops)=>{loot=drops;return true};
 return {game,cells,mutations,loot:()=>loot};
};
let checks=0;function test(label,fn){fn();checks++;console.log('PASS',label)}
test('All placeable block IDs execute player.use and create the correct world block in Survival',()=>{
 let n=0;
 for(const d of ITEMS.filter(x=>x.block!==undefined)){
  const {game,cells}=mk(d.id);game.use();
  assert.equal(coords.idOf(cells.get('3,40,2')??0),d.block,`Placement failed: ${d.name}`);
  assert.equal(game.inventory.count(d.id),0,`Survival did not consume ${d.name}`);
  if(d.id===B.Door)assert.equal(coords.idOf(cells.get('3,41,2')),B.Door,'Door top half missing');
  n++;
 }
 console.log('INFO',n,'distinct placeable block IDs exercised');
});
test('Creative placement retains the full selected stack for every placeable block',()=>{
 for(const d of ITEMS.filter(x=>x.block!==undefined)){
  const {game,cells}=mk(d.id,'creative');const before=game.inventory.count(d.id);game.use();
  assert.equal(coords.idOf(cells.get('3,40,2')??0),d.block,`Creative placement failed ${d.name}`);
  assert.equal(game.inventory.count(d.id),before,`Creative stack consumed ${d.name}`);
 }
});
test('Adventure and Spectator cannot place any block',()=>{
 for(const mode of ['adventure','spectator'])for(const d of ITEMS.filter(x=>x.block!==undefined)){
  const {game,mutations}=mk(d.id,mode);game.use();assert.equal(mutations.length,0,`${mode} placed ${d.name}`);
 }
});
test('All solid visible blocks execute actual mining with an eligible tool and return appropriate loot',()=>{
 let n=0;
 for(const d of BLOCKS.filter(x=>!x.hidden && x.solid && x.hardness>0)){
  let tool=null;
  if(d.tool){const match=ITEMS.find(i=>i.tool===d.tool && (i.tier??0)>= (d.tier??0));assert(match,`No tool can mine ${d.name}`);tool=match.id;}
  const {game,cells,loot}=mk(tool,'survival',d.id);game.mine(100);
  assert.equal(cells.get('2,40,2'),0,`${d.name} did not mine`);
  if(!d.tier || d.tool)assert(loot().length>=1,`${d.name} has no loot`);
  n++;
 }
 console.log('INFO',n,'solid block mining paths exercised');
});
test('Every one of the 20 tiered tools executes its own mining-and-durability path',()=>{
 for(const d of ITEMS.filter(x=>x.tool)){
  const suitable=BLOCKS.find(b=>b.tool===d.tool && (b.tier??0)<=d.tier && b.hardness>0)
   ?? BLOCKS.find(b=>b.hardness>0 && b.solid && !b.hidden);
  assert(suitable,`No test target for ${d.name}`);
  const {game,cells}=mk(d.id,'survival',suitable.id);
  const original=game.inventory.held.durability;
  game.mine(100);
  assert.equal(cells.get('2,40,2'),0,`${d.name} mining path failed`);
  assert.equal(game.inventory.held?.durability,original-1,`${d.name} was not worn by mining`);
 }
});
test('Mining mode restrictions, mismatch tier and durability',()=>{
 for(const mode of ['adventure','spectator']){const {game,mutations}=mk(139,mode,B.Stone);game.mine(100);assert.equal(mutations.length,0);}
 {const {game,loot}=mk(null,'survival',B.Iron);game.mine(100);assert.equal(loot().length,0,'Bare hands harvested tiered ore');}
 {const {game}=mk(120,'survival',B.Stone);const before=game.inventory.held.durability;game.mine(100);assert.equal(game.inventory.held.durability,before-1);}
 {const {game,loot}=mk(139,'creative',B.Stone);game.mine(100);assert.equal(loot().length,0,'Creative dropped mining loot');}
});
test('Hoe prepares farmland, seed planting consumes one seed, and crop mining drops real items',()=>{
 const hoe=mk(128,'survival',B.Dirt);const before=hoe.game.inventory.held.durability;hoe.game.use();
 assert.equal(hoe.cells.get('2,40,2'),B.Farmland);assert.equal(hoe.game.inventory.held.durability,before-1);
 const rice=mk(107,'survival',B.Farmland);rice.game.use();assert.equal(rice.cells.get('2,41,2'),B.Rice);assert.equal(rice.game.inventory.count(107),0);
 const harvested=mk(null,'survival',coords.packed(B.Rice,3));harvested.game.mine(100);
 assert(harvested.loot().some(x=>x.id===108),'Mature rice did not produce harvested rice');
 assert(harvested.loot().some(x=>x.id===107),'Mature rice did not return seeds');
});
test('All food restores hunger and consumes exactly one, while full hunger prevents consumption',()=>{
 for(const d of ITEMS.filter(x=>x.food)){
  const {game}=mk(d.id);game.use();assert.equal(game.hunger,Math.min(20,8+d.food),d.name);
  assert.equal(game.inventory.count(d.id),0,`${d.name} not consumed`);
  const full=mk(d.id);full.game.hunger=20;full.game.use();assert.equal(full.game.inventory.count(d.id),1,`${d.name} consumed with full hunger`);
 }
});
test('All seven infusion items apply the appropriate effect and return one empty flask',()=>{
 for(const [id,effect] of Object.entries(POTIONS)){
  const {game}=mk(Number(id));game.use();
  assert.equal(game.inventory.count(Number(id)),0,`Infusion ${id} was not consumed`);
  assert.equal(game.inventory.count(160),1,`Infusion ${id} did not return flask`);
  if(effect==='healing')assert.equal(game.health,18);else assert(game.status.has(effect),`Missing status ${effect}`);
 }
});
test('All eight armor items equip into the correct slot via normal right-click',()=>{
 for(const d of ITEMS.filter(x=>x.armorSlot)){
  const {game}=mk(d.id);game.use();const index=['helmet','tunic','greaves','boots'].indexOf(d.armorSlot);
  assert.equal(game.inventory.equipment.slots[index]?.id,d.id);assert.equal(game.inventory.held,null);
 }
});
test('Water and lava buckets place and collect fluid through player.use',()=>{
 for(const id of [169,170])for(const mode of ['survival','creative']){
  const {game,cells}=mk(id,mode);game.use();assert.equal(cells.get('3,40,2'),id===169?B.Water:B.Lava);
  assert.equal(game.inventory.held?.id,mode==='creative'?id:168);
 }
 for(const id of [B.Water,B.Lava]){
  const {game,cells}=mk(168,'survival',id);game.use();assert.equal(cells.get('2,40,2'),0);
  assert.equal(game.inventory.held?.id,id===B.Water?169:170);
 }
});
test('Invalid equipment indices reject without altering cursor, armor or array shape',()=>{
 const inv=new Inventory();inv.cursor={id:150,count:1,durability:item(150).durability};const before=JSON.stringify(inv.cursor);
 for(const index of [NaN,Infinity,-Infinity,1.5,-1,4,undefined]){
  assert.equal(inv.equipment.click(index,inv),false);
  assert.equal(JSON.stringify(inv.cursor),before);
  assert.deepEqual(Object.keys(inv.equipment.slots),['0','1','2','3']);
 }
});
console.log('PASS gameplay execution paths:',checks,'groups');
