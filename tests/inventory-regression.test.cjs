// Standalone Node regression tests; uses the project's local TypeScript devDependency.
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = function(module, filename) {
  const raw = fs.readFileSync(filename, 'utf8');
  const result = ts.transpileModule(raw, {fileName: filename, compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, moduleResolution: ts.ModuleResolutionKind.NodeJs,
  }, reportDiagnostics: true});
  const errors = (result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, {
    getCurrentDirectory:() => process.cwd(),getCanonicalFileName:x=>x,getNewLine:()=>'\n'
  }));
  module._compile(result.outputText, filename);
};
const {Inventory} = require('../src/game/inventory.ts');
const {item} = require('../src/game/items.ts');
const {sameStack} = require('../src/game/stack.ts');
const total=(all,id)=>all.reduce((n,a)=>n+a.reduce((t,s)=>t+(s?.id===id?s.count:0),0),0);
let count=0;
function test(name,fn){ fn();count++; console.log('PASS',name); }
test('Move from satchel to empty hotbar preserves stack and selected slot',()=>{
 const inv=new Inventory(); inv.slots[12]={id:8,count:34};inv.selected=2;
 assert.equal(inv.move(12,2),true);
 assert.equal(inv.slots[12],null); assert.deepEqual(inv.slots[2],{id:8,count:34});assert.equal(inv.selected,2);
});
test('Merges compatible stacks without exceeding maximum',()=>{
 const inv=new Inventory();inv.slots[0]={id:8,count:54};inv.slots[12]={id:8,count:25};
 assert.equal(inv.move(12,0),true); assert.equal(inv.slots[0].count,64); assert.equal(inv.slots[12].count,15);
 assert.equal(inv.move(12,0),false);assert.equal(total([inv.slots],8),79);
});
test('Swaps unlike items without loss, preserving tool durability and enchantment metadata',()=>{
 const inv=new Inventory();inv.slots[1]={id:135,count:1,durability:52,enchants:{sharpness:2}};inv.slots[3]={id:8,count:17};
 const prior=JSON.stringify([inv.slots[1],inv.slots[3]]);
 assert.equal(inv.move(1,3),true);
 assert.equal(JSON.stringify([inv.slots[3],inv.slots[1]]),prior);
});
test('Moves between external chest and inventory in both directions',()=>{
 const inv=new Inventory(); const chest=[{id:6,count:10},null]; inv.slots[4]={id:8,count:4};
 assert.equal(inv.move(0,4,chest,inv.slots),true);
 assert.deepEqual(inv.slots[4],{id:6,count:10}); assert.deepEqual(chest[0],{id:8,count:4});
 assert.equal(inv.move(4,1,inv.slots,chest),true);assert.deepEqual(chest[1],{id:6,count:10});
});
test('Rejects invalid move requests and no-op drag',()=>{
 const inv=new Inventory();inv.slots[0]={id:8,count:6};
 const before=JSON.stringify(inv.slots);
 for(const [a,b] of [[0,0],[-1,1],[1,0],[0,36],[NaN,4],[2.5,4]]) assert.equal(inv.move(a,b),false);
 assert.equal(JSON.stringify(inv.slots),before);
});
test('Does not merge different enchantments or tool durability',()=>{
 const inv=new Inventory();inv.slots[0]={id:120,count:1,durability:40};inv.slots[1]={id:120,count:1,durability:20};
 assert.equal(sameStack(inv.slots[0],inv.slots[1]),false);
 assert.equal(inv.move(0,1),true);assert.equal(inv.slots[0].durability,20);assert.equal(inv.slots[1].durability,40);
});
test('Durability wear reports break exactly when the held tool is removed',()=>{
 const inv=new Inventory();inv.add(124,1,2);
 assert.equal(inv.wear(),false);assert.equal(inv.held.durability,1);
 assert.equal(inv.wear(),true);assert.equal(inv.held,null);
 assert.equal(inv.wear(),false);
});
test('Moves do not mutate the cursor stack',()=>{
 const inv=new Inventory();inv.slots[0]={id:8,count:12}; inv.cursor={id:103,count:9};
 assert.equal(inv.move(0,5),true);assert.deepEqual(inv.cursor,{id:103,count:9});
});
test('Randomized drag operations conserve all resources across chest, hotbar, satchel',()=>{
 const inv=new Inventory();const chest=Array(18).fill(null);
 for(const id of [6,8,101,103,104])inv.add(id,120);
 const arrays=[inv.slots,chest], ids=[6,8,101,103,104];
 const before=Object.fromEntries(ids.map(id=>[id,total(arrays,id)]));
 // deterministic PRNG
 let seed=123456789;const next=n=>((seed=Math.imul(seed^seed>>>15,2246822519)>>>0)%n);
 for(let k=0;k<5000;k++){
  const a=next(2),b=next(2),src=arrays[a],dst=arrays[b];
  inv.move(next(src.length),next(dst.length),src,dst);
 }
 for(const id of ids) assert.equal(total(arrays,id),before[id],`Conservation failed for ${id}`);
 for(const slots of arrays) for(const s of slots) if(s){
  assert.ok(s.count>0&&s.count<=item(s.id).stack,`Invalid stack ${JSON.stringify(s)}`);
 }
});
test('UI drag operation is a single move event rather than two simulated clicks',()=>{
 const ui=fs.readFileSync(require('node:path').resolve(__dirname,'../src/ui/ui.ts'),'utf8');
 assert.match(ui,/this\.onMove\?\.\(/);
 assert.doesNotMatch(ui,/this\.onAction\?\.\(dragged\.dataset\.action/);
});
test('Creative drop does not consume the original hotbar stack',()=>{
 const game=fs.readFileSync(require('node:path').resolve(__dirname,'../src/core/game.ts'),'utf8');
 assert.match(game,/if \(this\.mode !== "creative"\) this\.inventory\.consumeHeld\(\);\s*this\.scheduleSave\(\);/);
});

// DOM-less event harness verifies delegated drag-and-drop behavior without Chromium.
test('UI DOM drag event dispatches one logical move with correct original indices',()=>{
 const {UI}=require('../src/ui/ui.ts');
 const handlers={};
 const fakeOverlay={addEventListener(type,fn){handlers[type]=fn;},className:'',innerHTML:''};
 const fakeRoot={innerHTML:'',querySelector(selector){
  if(selector==='#overlay')return fakeOverlay;
  if(selector==='#hud')return {hidden:true};
  if(selector==='#toast')return {textContent:'',classList:{add(){},remove(){}}};
  return null;
 }};
 const ui=new UI(fakeRoot);ui.screen='inventory';
 const events=[];ui.onMove=(...args)=>events.push(args);ui.onAction=()=>{throw Error('Unexpected click action');};
 const element=(action,index,filled=true)=>({dataset:{action,index:String(index)},
  getAttribute(name){return name==='draggable'?String(filled):null;},
  closest(){return this;}});
 const e=(target)=>({target,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},dataTransfer:{setData(){},effectAllowed:'',dropEffect:''}});
 const from=e(element('slot',20)),over=e(element('hotbar-select',2)),drop=e(element('hotbar-select',2));
 handlers.dragstart(from);handlers.dragover(over);handlers.drop(drop);
 assert.equal(drop.defaultPrevented,true);
 assert.deepEqual(events,[['slot',20,'hotbar-select',2]]);
 handlers.drop(drop); assert.equal(events.length,1,'Drop event must not replay a previous drag');
});
test('UI ignores unsupported cross-screen and empty source drags',()=>{
 const {UI}=require('../src/ui/ui.ts');const handlers={};
 const fakeOverlay={addEventListener(type,fn){handlers[type]=fn;},className:'',innerHTML:''};
 const ui=new UI({innerHTML:'',querySelector(s){return s==='#overlay'?fakeOverlay:s==='#hud'?{hidden:true}:s==='#toast'?{}:null;}});
 const elem=(act,index,filled)=>({dataset:{action:act,index:String(index)},getAttribute:()=>String(filled),closest(){return this;}});
 const e=t=>({target:t,preventDefault(){},dataTransfer:{setData(){}}});let calls=0;ui.onMove=()=>calls++;
 ui.screen='inventory';handlers.dragstart(e(elem('slot',20,false)));handlers.drop(e(elem('slot',3,true)));
 handlers.dragstart(e(elem('slot',20,true)));ui.screen='chest';handlers.drop(e(elem('slot',3,true)));
 assert.equal(calls,0);
});

console.log(`Passed ${count} inventory regression tests.`);
