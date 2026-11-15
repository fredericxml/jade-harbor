const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const ts = require('typescript');
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText.replace(/import\\.meta\\.url/g, '"file:///generation.worker.ts"'), file);
const { candidateSegmentPairs } = require('../src/world/metropolis/grading.ts');
const { createGenerator } = require('../src/world/generator.ts');

function brutePairs(segments) {
  const out=[];
  for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){
    const a=segments[i],b=segments[j];
    const aminX=Math.min(a.a.x,a.b.x),amaxX=Math.max(a.a.x,a.b.x),aminZ=Math.min(a.a.z,a.b.z),amaxZ=Math.max(a.a.z,a.b.z);
    const bminX=Math.min(b.a.x,b.b.x),bmaxX=Math.max(b.a.x,b.b.x),bminZ=Math.min(b.a.z,b.b.z),bmaxZ=Math.max(b.a.z,b.b.z);
    if(aminX<=bmaxX&&amaxX>=bminX&&aminZ<=bmaxZ&&amaxZ>=bminZ)out.push(`${i}:${j}`);
  }
  return out.sort();
}

test('spatial broad-phase includes exactly every AABB-overlapping pair for boundary and negative coordinates',()=>{
  const s=[
    {a:{x:-32,z:-32},b:{x:0,z:0}},
    {a:{x:0,z:0},b:{x:32,z:0}},
    {a:{x:32,z:0},b:{x:32,z:32}},
    {a:{x:100,z:100},b:{x:100,z:100}},
    {a:{x:-5000,z:5},b:{x:5000,z:5}},
    {a:{x:-16,z:4},b:{x:16,z:4}},
    {a:{x:800,z:900},b:{x:850,z:950}}
  ];
  const got=candidateSegmentPairs(s).map(([i,j])=>`${i}:${j}`).sort();
  assert.deepEqual(got,brutePairs(s));
});

test('spatial broad-phase matches brute-force AABB pairs on deterministic randomized segments',()=>{
  let state=0x5eed1234;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/0x100000000;};
  for(const cellSize of [8,16,32,64]){
    const s=Array.from({length:700},()=>{const x=(random()-.5)*2400,z=(random()-.5)*2400,dx=(random()-.5)*240,dz=(random()-.5)*240;return{a:{x,z},b:{x:x+dx,z:z+dz}};});
    const got=candidateSegmentPairs(s,cellSize).map(([i,j])=>`${i}:${j}`).sort();
    assert.deepEqual(got,brutePairs(s),`cellSize=${cellSize}`);
  }
});

test('current road plan stays deterministic across freshly created generator contexts',()=>{
  for(const seed of ['jade-harbor','different-city','长江玉港']) {
    const a=createGenerator(seed),b=createGenerator(seed);
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(a.metropolis.roads)).digest('hex'),
      crypto.createHash('sha256').update(JSON.stringify(b.metropolis.roads)).digest('hex'));
  }
});
