const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText.replace(/import\\.meta\\.url/g,'"file:///generation.worker.ts"'),file);
const geometry=require('../src/world/geography/geometry.ts');
const {segmentDistance,pathDistance,footprintDistance,footprintBounds,footprintsOverlap}=geometry;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function oldSegmentDistance(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
function oldPathDistance(points,x,z){let d=Infinity;for(let i=1;i<points.length;i++)d=Math.min(d,oldSegmentDistance({x,z},points[i-1],points[i]));return d;}
function oldFootprintBounds(f){if(f.kind==='area')return f.bounds;const points=f.kind==='point'?[f.center]:f.points,r=f.kind==='point'?f.radius:f.halfWidth;return{x1:Math.min(...points.map(p=>p.x))-r,x2:Math.max(...points.map(p=>p.x))+r,z1:Math.min(...points.map(p=>p.z))-r,z2:Math.max(...points.map(p=>p.z))+r};}
function oldSegments(f){if(f.kind==='point')return[[f.center,f.center]];if(f.kind==='corridor')return f.points.slice(1).map((p,i)=>[f.points[i],p]);const b=f.bounds,p=[{x:b.x1,z:b.z1},{x:b.x2,z:b.z1},{x:b.x2,z:b.z2},{x:b.x1,z:b.z2}];return p.map((v,i)=>[v,p[(i+1)%4]]);}
function cross(a,b,c){return(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);}
function oldSegmentGap(a,b,c,d){if(Math.max(a.x,b.x)>=Math.min(c.x,d.x)&&Math.max(c.x,d.x)>=Math.min(a.x,b.x)&&Math.max(a.z,b.z)>=Math.min(c.z,d.z)&&Math.max(c.z,d.z)>=Math.min(a.z,b.z)&&cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0)return 0;return Math.min(oldSegmentDistance(a,c,d),oldSegmentDistance(b,c,d),oldSegmentDistance(c,a,b),oldSegmentDistance(d,a,b));}
function oldFootprintDistance(f,x,z){if(f.kind==='point')return Math.hypot(x-f.center.x,z-f.center.z)-f.radius;if(f.kind==='corridor')return oldPathDistance(f.points,x,z)-f.halfWidth;const b=f.bounds,dx=Math.max(b.x1-x,x-b.x2),dz=Math.max(b.z1-z,z-b.z2);return Math.hypot(Math.max(0,dx),Math.max(0,dz))+Math.min(0,Math.max(dx,dz));}
function oldFootprintsOverlap(a,b,margin=0){const aa=oldFootprintBounds(a),bb=oldFootprintBounds(b);if(aa.x1-margin>bb.x2||aa.x2+margin<bb.x1||aa.z1-margin>bb.z2||aa.z2+margin<bb.z1)return false;const sa=oldSegments(a),sb=oldSegments(b);if(oldFootprintDistance(a,sb[0][0].x,sb[0][0].z)<=margin||oldFootprintDistance(b,sa[0][0].x,sa[0][0].z)<=margin)return true;const radius=f=>f.kind==='point'?f.radius:f.kind==='corridor'?f.halfWidth:0;return sa.some(([p,q])=>sb.some(([r,s])=>oldSegmentGap(p,q,r,s)<=radius(a)+radius(b)+margin));}
let state=0xdecafbad;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/0x100000000;};
function point(){return{x:(random()-.5)*1600,z:(random()-.5)*1600};}
function footprint(){const kind=['point','area','corridor'][Math.floor(random()*3)];if(kind==='point'){const center=point();return{kind,center,radius:random()*30};}if(kind==='area'){const a=point(),b=point();return{kind,bounds:{x1:Math.min(a.x,b.x),x2:Math.max(a.x,b.x),z1:Math.min(a.z,b.z),z2:Math.max(a.z,b.z)}};}const n=2+Math.floor(random()*7),points=Array.from({length:n},point);return{kind,points,halfWidth:random()*15};}

test('path and segment distances remain exactly equal to the pre-optimization implementation',()=>{
  for(let i=0;i<12000;i++){const a=point(),b=point(),p=point();assert.equal(segmentDistance(p,a,b),oldSegmentDistance(p,a,b));const pts=Array.from({length:2+Math.floor(random()*12)},point);assert.equal(pathDistance(pts,p.x,p.z),oldPathDistance(pts,p.x,p.z));}
  assert.equal(pathDistance([],0,0),Infinity);
});

test('frozen path memoization is exact and mutable paths are never cached stale',()=>{
  const pts=Object.freeze([Object.freeze({x:0,z:0}),Object.freeze({x:10,z:0}),Object.freeze({x:10,z:10})]);
  for(const [x,z] of [[2,4],[8,3],[15,7],[-4,-4]])assert.equal(pathDistance(pts,x,z),oldPathDistance(pts,x,z));
  const mutable=[{x:0,z:0},{x:10,z:0}],before=pathDistance(mutable,5,5);mutable[1].z=10;
  assert.notEqual(pathDistance(mutable,5,5),before);assert.equal(pathDistance(mutable,5,5),oldPathDistance(mutable,5,5));
});

test('footprint bounds, distances and overlap decisions remain exact across randomized footprint pairs',()=>{
  for(let i=0;i<5000;i++){const a=footprint(),b=footprint(),x=(random()-.5)*2000,z=(random()-.5)*2000,margin=random()*20;assert.deepEqual(footprintBounds(a),oldFootprintBounds(a));assert.equal(footprintDistance(a,x,z),oldFootprintDistance(a,x,z));assert.equal(footprintsOverlap(a,b,margin),oldFootprintsOverlap(a,b,margin));}
});

test('Current world-plan payloads remain byte-for-byte deterministic for compatibility seeds',()=>{
  const {createGenerator}=require('../src/world/generator.ts');
  const expected={
    'jade-harbor':'ac5415e3aae6cf64f34d3ce57a902b2f98ec52e82dbd847238140207ba2c62ec',
    'different-city':'1e2fbf720ab550c954bd0a5fe414d44d672cf49b43d694f54484cd6097593166',
    '长江玉港':'f42bb9c12b04bd99f4b2189c4b1877299c764aa297df57c1b2f48db242b04439'
  };
  for(const [seed,hash] of Object.entries(expected)){const g=createGenerator(seed),payload={roads:g.metropolis.roads,lots:g.metropolis.lots,landmarks:g.landmarks.reservations,realizedSites:g.realization.sites,infill:g.density.infill,regionSites:g.regions.sites};assert.equal(crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex'),hash,`V10 plan changed for ${seed}`);}
});
