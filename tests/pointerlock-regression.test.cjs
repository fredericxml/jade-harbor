const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const inputSrc = fs.readFileSync('src/player/input.ts','utf8');
function extractedInput(text){
  return ts.transpileModule(text.replace('export class Input','class g0'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText.replace('export {};','');
}
function mockInput(js){
  const handlers=new Map(), canvasHandlers=new Map();
  let clock=1000;
  const oldPerformance=global.performance;
  const doc={pointerLockElement:null,addEventListener:(name,cb)=>handlers.set(name,cb),exitPointerLock(){this.pointerLockElement=null;queueMicrotask(()=>handlers.get('pointerlockchange')?.())}};
  const canvas={addEventListener:(name,cb)=>canvasHandlers.set(name,cb),requestPointerLock(){doc.pointerLockElement=canvas;queueMicrotask(()=>handlers.get('pointerlockchange')?.());return Promise.resolve();}};
  const Class=Function('document','addEventListener','HTMLInputElement','HTMLSelectElement','HTMLTextAreaElement','performance',js+';return g0')(doc,()=>{},class {},class {},class {},{now:()=>clock});
  const input=new Class(canvas);
  const tick=()=>new Promise(resolve=>setTimeout(resolve,110));
  const emitEscape=()=>handlers.get('keydown')({code:'Escape',repeat:false,preventDefault(){}});
  return {input,doc,canvas,tick,emitEscape,handlers,advance:n=>{clock+=n;}};
}
(async()=>{
for(const [label,js] of [['source',extractedInput(inputSrc)]]){
  const e=mockInput(js);let screen='none',pauses=0;
  e.input.onUnlock=()=>{if(screen==='none'){screen='pause';pauses++;e.input.unlock();}};
  e.input.onKey=(k)=>{if(k!=='Escape')return;if(screen==='none'){screen='pause';pauses++;e.input.unlock();}else if(screen==='pause'){screen='none';e.input.prepareResume();}};
  await e.input.lock();await e.tick();e.advance(600);
  // Keyboard Escape fires before browser's implicit pointer-unlock.
  e.emitEscape();await e.tick();assert.equal(screen,'pause');
  e.emitEscape();await e.tick();assert.equal(screen,'none');
  e.handlers.get('pointerlockchange')();await e.tick();assert.equal(screen,'none',label+' late unlock must not re-pause');
  assert.equal(pauses,1);
  // Click reacquires pointer lock; native Escape is handled without keydown.
  await e.input.lock();await e.tick();e.advance(600);
  e.doc.pointerLockElement=null;e.handlers.get('pointerlockchange')();await e.tick();
  assert.equal(screen,'pause',label+' browser native Escape must pause');
  assert.equal(pauses,2);
  e.emitEscape();assert.equal(screen,'pause',label+' delayed native keydown ignored');
  e.advance(400);e.emitEscape();assert.equal(screen,'none',label+' next Escape must close');
  e.handlers.get('pointerlockchange')();await e.tick();assert.equal(screen,'none');
  console.log('PASS',label,'keyboard-first / browser-first Escape / stale unlock / reacquire');
}
assert.match(fs.readFileSync('src/core/game.ts','utf8'),/this\.resume\(false\)/);
const rendererSource=fs.readFileSync('src/render/renderer.ts','utf8');
for(const [label,text] of [['source',rendererSource]]){
  assert.match(text,/viewmodelCamera/);
  assert.match(text,/viewmodelScene/);
  assert.match(text,/clearDepth\(/);
  assert.doesNotMatch(text,/camera\.add\(this\.hand\)/);
  assert.match(text,/\.viewmodelScene\.add\(this\.hand\)/);
  console.log('PASS',label,'separate viewmodel rendering, no world depth intersection');
}
// Test real geometry objects without requiring WebGL / Three npm package.
class Group{children=[];rotation={set:(x,y,z,order)=>{this.pose=[x,y,z,order]}};add(o){this.children.push(o)}remove(o){this.children.splice(this.children.indexOf(o),1)}}
class BoxGeometry{constructor(...dim){this.dimensions=dim;this.attributes={uv:{setXY(){}}}}setAttribute(k,v){this.attributes[k]=v}getAttribute(k){return this.attributes[k]}dispose(){this.disposed=true}}
class Float32BufferAttribute{constructor(data,dim){this.data=data;this.dim=dim}}
class MeshBasicMaterial{constructor(opts){Object.assign(this,opts)}dispose(){this.disposed=true}}
class Mesh{constructor(geo,mat){this.geometry=geo;this.material=mat;this.position={set:(...v)=>this.xyz=v};this.rotation={z:0}}}
const TH={BoxGeometry,Float32BufferAttribute,MeshBasicMaterial,Mesh};
const defs={4:{block:4,color:'#cc7755'},135:{tool:'pickaxe',color:'#87dba5'},139:{tool:'sword',color:'#aaccdd'},103:{category:'Materials',color:'#88cbaa'}};
const rendererTree=ts.createSourceFile('renderer.ts',rendererSource,ts.ScriptTarget.ES2022,true);
const viewClass=rendererTree.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='View');
const heldMethod=viewClass?.members.find(n=>ts.isMethodDeclaration(n)&&n.name.getText(rendererTree)==='setHeldItem');
assert(heldMethod,'View.setHeldItem must exist');
const sourceMethod=heldMethod.getText(rendererTree);
const sourceJS=ts.transpileModule('class T{'+sourceMethod+'}',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const comp=Function('THREE','item',sourceJS+';return T')(TH,id=>defs[id]);
for(const [label,Cl] of [['source',comp]]){
 const vm=new Cl();vm.heldModel=new Group();vm.atlas={texture:{name:"atlas"}};vm.setHeldItem(135);
 assert.equal(vm.heldModel.children.length,6);
 for(const part of vm.heldModel.children){assert.ok(part.geometry.dimensions.every(n=>n<=.68));assert.ok(part.geometry.attributes.color)}
 let old=vm.heldModel.children.slice();vm.setHeldItem(4);
 assert.equal(vm.heldModel.children.length,1);
 assert.equal(vm.heldModel.children[0].geometry.dimensions[0],.32);assert.equal(vm.heldModel.children[0].material.map,vm.atlas.texture);
 assert.ok(old.every(x=>x.geometry.disposed&&x.material.disposed));
 console.log('PASS',label,'connected model primitive sizes / disposal');
}
console.log('PASS pointer-lock and viewmodel source checks');
})().catch(e=>{console.error(e);process.exitCode=1});
