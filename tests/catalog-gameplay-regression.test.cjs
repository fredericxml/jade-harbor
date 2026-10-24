const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (m, file) => m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,file);
const {BLOCKS} = require('../src/world/blocks.ts');
const {ITEMS,item} = require('../src/game/items.ts');
const {Inventory,RECIPES} = require('../src/game/inventory.ts');
const {GRID_RECIPES, matchGrid, craftGrid} = require('../src/game/crafting.ts');
const {UI,icon} = require('../src/ui/ui.ts');
const {useBucket} = require('../src/game/buckets.ts');
const {tickFurnace,SMELTING,FUEL} = require('../src/game/simulation.ts');
const {INFUSIONS,newBrewer,tickBrewer} = require('../src/game/brewing.ts');
const {transferOne} = require('../src/game/automation.ts');
const {freshWorld,validateSave} = require('../src/persistence/saves.ts');
const {POTIONS,StatusEffects} = require('../src/game/progression.ts');
const {enchantHeld,compatible,repairHeld,ENCHANTMENTS} = require('../src/game/progression.ts');
const ids=new Set();
for (const i of ITEMS) {
 assert(!ids.has(i.id),`Duplicate item id ${i.id}`);ids.add(i.id);
 assert.equal(item(i.id)?.name,i.name);
 assert(i.name.trim() && i.category.trim() && /^#[\da-f]{6}$/i.test(i.color));
 assert([1,16,64].includes(i.stack),`Invalid stack capacity: ${i.name}`);
 if (i.block !== undefined) assert(BLOCKS.some(b=>b.id===i.block && !b.hidden));
 if (i.tool || i.armorSlot) {assert.equal(i.stack,1);assert(i.durability>0);}
 const h=icon(i.id);assert(h.includes(`data-item-id="${i.id}"`),`${i.name} missing icon`);
 if(i.block!==undefined) {
   const tile=i.block*3+1;
   assert(h.includes('block-texture')&&h.includes(`--atlas-x:${tile%16}`)&&h.includes(`--atlas-y:${Math.floor(tile/16)}`),`${i.name} icon does not use its atlas tile`);
 } else {
   assert(h.includes('<svg'),`${i.name} icon is generic or blank`);
 }
}
assert(ITEMS.length>110, 'Audit should cover the entire current catalog');
assert.deepEqual(ITEMS.filter(x=>x.tool).length,20);
assert.deepEqual(ITEMS.filter(x=>x.armorSlot).length,8);
for(const armor of ['helmet','tunic','greaves','boots']) assert.equal(ITEMS.filter(i=>i.armorSlot===armor).length,2);
const armorIcon = ['helmet','tunic','greaves','boots'].map(s=>icon(ITEMS.find(i=>i.armorSlot===s).id).match(/<svg[\s\S]*?<\/svg>/)[0]);
assert.equal(new Set(armorIcon).size,4,'All armor slot icons must have distinct silhouettes');
const html=UI.prototype.catalog.call({},'All','');
assert.equal((html.match(/data-action="choose"/g)||[]).length,ITEMS.length,'Creative catalog missing items');
for (const category of new Set(ITEMS.map(i=>i.category))) {
 const catalog=UI.prototype.catalog.call({},category,'');
 assert.equal((catalog.match(/data-action="choose"/g)||[]).length, ITEMS.filter(i=>i.category===category).length,`${category} filter mismatch`);
}
// Every category in the canonical catalog must have a reachable Creative filter tab.
const viewMock={screen:'none',overlay:{querySelector:()=>null},panel(_screen,_title,_subtitle,body){this.panelHtml=body;},catalog:UI.prototype.catalog};
UI.prototype.inventory.call(viewMock,new Inventory(),true);
for (const category of new Set(ITEMS.map(i=>i.category)))
 assert(viewMock.panelHtml.includes(`data-category="${category}"`),`Category ${category} is unreachable from Creative filters`);

for(const recipe of RECIPES){
 assert(ids.has(recipe.output[0]) && recipe.output[1]>=1 && recipe.output[1]<=item(recipe.output[0]).stack,`Invalid recipe output ${recipe.id}`);
 const amounts=new Map();
 for(const [id,count] of recipe.cost){assert(ids.has(id)&&count>0,`Invalid recipe ingredient ${recipe.id}`); amounts.set(id,(amounts.get(id)||0)+count);}
 const inv=new Inventory();
 for(const [id,count] of amounts)assert.equal(inv.add(id,count),0);
 assert(inv.transaction(recipe.cost,recipe.output),`Recipe cannot craft ${recipe.id}`);
 assert.equal(inv.count(recipe.output[0]),recipe.output[1],`Wrong recipe output ${recipe.id}`);
}
for(const recipe of GRID_RECIPES){
 assert(ids.has(recipe.output[0]));
 const width=Math.max(recipe.pattern.length,recipe.pattern[0].length,2);
 assert(width<=3,`Pattern too large: ${recipe.name}`);
 assert(recipe.pattern.every(r=>r.length===recipe.pattern[0].length),`Unequal recipe rows: ${recipe.name}`);
 const grid=Array(9).fill(null);
 for(let row=0;row<recipe.pattern.length;row++)for(let col=0;col<recipe.pattern[0].length;col++){
  const k=recipe.pattern[row][col],id=recipe.keys[k]; if(id) {assert(ids.has(id));grid[row*width+col]={id,count:1};}
 }
 const matched=matchGrid(grid,width);
 assert(matched,`Pattern not discoverable ${recipe.name}`);
 const inv=new Inventory();
 assert(craftGrid(grid,width,inv),`Grid recipe cannot craft ${recipe.name}`);
 assert.equal(inv.count(recipe.output[0]),recipe.output[1],`Wrong grid output ${recipe.name}`);
}
// Stress all 122 item limits and cursor behaviors.
for (const def of ITEMS) {
 const inv=new Inventory();
 assert.equal(inv.add(def.id,def.stack),0,`Cannot insert full stack: ${def.name}`);
 assert.equal(inv.count(def.id),def.stack);
 assert.equal(inv.slots[0].count,def.stack);
 inv.click(0,true);assert(inv.cursor);
 inv.click(1,true);assert.equal(inv.slots[1].count,1);
 inv.click(1,false);assert(!inv.slots[1] || inv.slots[1].count<=def.stack);
 assert(inv.settleCursor());
 assert.equal(inv.count(def.id),def.stack,`Conservation failure for ${def.name}`);
}
// Station functional tests, not merely presence checks.
for (const [id,out] of Object.entries(SMELTING)) {
 const f={slots:[{id:+id,count:1},{id:101,count:1},null],burn:0,progress:0,recipe:0};
 for(let i=0;i<5;i++)tickFurnace(f,1);
 assert.equal(f.slots[2]?.id,out,`Failed furnace recipe ${id}`);
}
for (const [id,out] of Object.entries(INFUSIONS)) {
 const b=newBrewer();b.slots=[{id:160,count:1},{id:+id,count:1},{id:16,count:1},null];
 for(let i=0;i<7;i++)tickBrewer(b,1,true);
 assert.equal(b.slots[3]?.id,out,`Failed brewing recipe ${id}`);
}
const from={slots:[{id:101,count:3}],extracts:()=>true,accepts:()=>true},to={slots:[null],extracts:()=>true,accepts:()=>true};
assert(transferOne(from,to));assert.equal(from.slots[0].count,2);assert.equal(to.slots[0].count,1);
// Both bucket types must return success, including Creative placement.
function worldFactory(){return {loaded:()=>true, get:()=>0, set(){return true;}}}
const hit={x:3,y:25,z:4,normal:{x:1,y:0,z:0},value:3};
for (const creative of [false,true]) for(const id of [169,170]) {
 const inv=new Inventory();inv.add(id);
 assert.equal(useBucket(worldFactory(),inv,hit,{x:0,y:25,z:0},creative),true,`Bucket failure ${id}/${creative}`);
 assert.equal(inv.held.id, creative?id:168,`Wrong bucket conversion ${id}/${creative}`);
}
// Fresh worlds must have a complete player state for all five game modes.
for (const mode of ['creative','survival','adventure','spectator','hardcore']) {
 const save=freshWorld('Verification World','verification-seed',mode);
 assert.equal(validateSave(save).mode,mode);
 assert.equal(save.player.slots.length,36);
 assert.equal(save.player.armor.length,4);
 assert.equal(save.player.grid.length,9);
 assert.equal(save.player.flying,mode==='spectator');
}
// Equipment must accept only its corresponding armor slot and preserve state.
for (const def of ITEMS.filter(i=>i.armorSlot)) {
 const inv=new Inventory();inv.add(def.id);
 assert(inv.equipment.equipHeld(inv),`Unable to equip ${def.name}`);
 const index=['helmet','tunic','greaves','boots'].indexOf(def.armorSlot);
 assert.equal(inv.equipment.slots[index]?.id,def.id);
 assert.equal(inv.held,null);
}
// Validate that every brewed potion leads to a known effect (or healing).
for(const id of [161,162,163,164,165,166,167]) {
 assert(POTIONS[id],`Missing gameplay effect ${id}`);
 if(POTIONS[id]!=='healing'){
  const effect=new StatusEffects();effect.apply(POTIONS[id]);assert(effect.has(POTIONS[id]));
 }
}
for(const def of ITEMS.filter(i=>i.durability)) {
 const inv=new Inventory();inv.add(def.id,1);assert(inv.held?.durability>0);
 for(const key of Object.keys(ENCHANTMENTS)) if(compatible(def.id,key)) {
  const temp=new Inventory();temp.add(def.id,1);temp.add(103,5);
  const result=enchantHeld(temp,100,key);
  assert(result.ok,`${def.name} enchanting ${key}`);
  break;
 }
}
console.log(`PASS catalog: ${ITEMS.length} catalog entries/icons, ${RECIPES.length} book recipes, ${GRID_RECIPES.length} grid recipes, 5 fresh/save modes, 8 armor equip checks, 7 potion effects, smelting/brewing/buckets/inventory`);
