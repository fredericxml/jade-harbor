#!/usr/bin/env node
// Informational CPU profile for persistence/reliability primitives. This is not a GPU/FPS benchmark.
const fs=require('node:fs');
const ts=require('typescript')
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText.replace(/import\.meta\.url/g,'"file:///virtual-generation-worker.ts"'),f);
const {freshWorld,validateSave,encodeEdits,checksum}=require('../src/persistence/saves.ts');
const {World}=require('../src/world/world.ts');
const {B}=require('../src/world/blocks.ts');
const measure=(label,fn)=>{for(let i=0;i<2;i++)fn();const samples=[];for(let i=0;i<7;i++){const t=performance.now();fn();samples.push(performance.now()-t)}samples.sort((a,b)=>a-b);console.log(`${label}: median ${samples[3].toFixed(2)} ms`)};
const edits={};
for(let i=0;i<50000;i++){const x=(i%500)-250,z=(Math.floor(i/500)%100)-50,y=20+(i%32);edits[`${x},${y},${z}`]=i%3===0?B.Jade:i%3===1?B.Red:B.Glass;}
const save=freshWorld('profile','reliability','creative','profile');save.edits=edits;
measure('validate 50k-edit save',()=>validateSave(save));
measure('encode 50k edits to canonical chunk deltas',()=>encodeEdits(edits));
const deltas=encodeEdits(edits);
measure('checksum 50k-edit chunk payloads',()=>{for(const d of deltas)checksum(d.entries)});
const w=new World('reliability',{},false);for(let z=0;z<16;z++)for(let x=0;x<16;x++)for(let y=20;y<36;y++)w.set(x,y,z,(x+y+z)%2?B.Red:B.Jade);
measure('capture one fully edited 16x16x16 section',()=>w.captureChanges());
console.log(`Profile payload: ${Object.keys(edits).length} edits, ${deltas.length} edited sections.`);
console.log('Informational Node CPU timings only; use browser profiling for rendering/frame-time decisions.');
