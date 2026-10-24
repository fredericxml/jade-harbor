import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function compiledMethod(file, className, methodName, bindings = {}) {
  const source = readFileSync(resolve(root, file), 'utf8');
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const klass = tree.statements.find(n => ts.isClassDeclaration(n) && n.name?.text === className);
  assert.ok(klass, `Found ${className}`);
  const method = klass.members.find(n => ts.isMethodDeclaration(n) && n.name.getText(tree) === methodName);
  assert.ok(method, `Found ${methodName}`);
  const compiled = ts.transpileModule(`class Test { ${method.getText(tree)} }`, {compilerOptions: {target: ts.ScriptTarget.ES2022}});
  return Function(...Object.keys(bindings), `${compiled.outputText}; return Test`)(...Object.values(bindings));
}

// Player can toggle pause on Escape; subdialogs return to pause instead of losing state.
const GameKey = compiledMethod('src/core/game.ts','Game','key');
const game = new GameKey();
const GameBack = compiledMethod('src/core/game.ts','Game','backToPreviousScreen');
game.backToPreviousScreen = GameBack.prototype.backToPreviousScreen.bind(game);
game.returnScreen = 'pause';
const calls = [];
game.active = true; game.dead = false; game.mode = 'creative'; game.meta={name:'Test world'};
game.ui = {screen:'none', pause:()=>{game.ui.screen='pause';calls.push('pause-screen')}, menu:()=>calls.push('menu')};
game.inventory = {selected:0, held:null};
game.pause = ()=>{game.ui.screen='pause';calls.push('pause')};
game.resume = ()=>{game.ui.screen='none';calls.push('resume')};
game.showDeath=()=>calls.push('death');
game.key('Escape');
assert.deepEqual(calls,['pause']);
game.key('Escape');
assert.deepEqual(calls,['pause','resume']);
game.ui.screen = 'settings';game.key('Escape');
assert.equal(game.ui.screen,'pause');
game.ui.screen = 'inventory';game.key('Escape');
assert.equal(game.ui.screen,'none');
game.ui.screen = 'pause';game.key('Digit2');
assert.equal(game.inventory.selected,0,'number keys do not modify hotbar behind Pause');
console.log('PASS Escape pause toggle, settings return, inventory close, no pause hotkeys');

class Group {
 constructor(){this.children=[];this.rotation={set:(x,y,z,order)=>{this.pose=[x,y,z,order]}};}
 add(o){this.children.push(o);}
 remove(o){this.children.splice(this.children.indexOf(o),1);}
}
class BoxGeometry {constructor(...size){this.size=size;this.disposed=false;this.attributes={uv:{setXY(){},needsUpdate:false}};} setAttribute(key,value){this.attributes[key]=value;} getAttribute(k){return this.attributes[k]}; dispose(){this.disposed=true}}
class Float32BufferAttribute {constructor(values,size){this.array=values;this.itemSize=size;}}
class MeshBasicMaterial {constructor(def){Object.assign(this,def);this.disposed=false;}dispose(){this.disposed=true;}}
class Mesh {constructor(geometry,material){this.geometry=geometry;this.material=material;this.position={set:(...p)=>{this.position.coords=p}};this.rotation={z:0,y:0};}}
const THREE={Mesh,BoxGeometry,MeshBasicMaterial,Float32BufferAttribute};
const item=id=>({
  120:{id:120, tool:'pickaxe',color:'#a9885d',category:'Tools'},
  135:{id:135, tool:'pickaxe',color:'#8dd6b3',category:'Tools'},
  103:{id:103,category:'Materials',color:'#77c9a5'},
  4:{id:4,block:4,category:'Architecture',color:'#d68a66'}
}[id]);
const ViewModel=compiledMethod('src/render/renderer.ts','View','setHeldItem',{THREE,item});
const view=new ViewModel();view.heldModel=new Group();view.lastHeldItem=undefined;view.atlas={texture:{name:"jade-harbor-atlas"}};
view.setHeldItem(103);
assert.equal(view.heldModel.children.length,2,'Jade shard has a material body and a light-catching face');
const old=view.heldModel.children[0];
view.setHeldItem(135);
assert.equal(old.geometry.disposed,true,'Previous geometry is disposed');
assert.equal(old.material.disposed,true,'Previous material is disposed');
assert.equal(view.heldModel.children.length,6,'Pickaxe has connected handle, socket, head and two tips');
const pickaxe=view.heldModel.children[0];
view.setHeldItem(135);
assert.equal(view.heldModel.children.length,6,'Same item does not cause reallocation');
assert.equal(pickaxe.geometry.disposed,false);
view.setHeldItem(4);
assert.equal(view.heldModel.children.length,1,'Building blocks use a single cohesive voxel (no disconnected cap)');
assert.equal(view.heldModel.children[0].material.map,view.atlas.texture, 'Held block uses its actual texture atlas');
view.setHeldItem(null);
assert.equal(view.heldModel.children.length,0,'Empty slot clears held model');
console.log('PASS first-person item change, tool model, block model, no needless allocations, cleanup');
