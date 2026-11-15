const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const source = fs.readFileSync('src/world/world.ts', 'utf8');
const file = ts.createSourceFile('world.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
let streamMethod;
function visit(node) {
  if (ts.isClassDeclaration(node) && node.name?.text === 'World') {
    streamMethod = node.members.find(m => ts.isMethodDeclaration(m) && m.name?.getText(file) === 'stream');
  }
  ts.forEachChild(node, visit);
}
visit(file);
assert.ok(streamMethod, 'production World.stream method found');
const compiled = ts.transpileModule(`class ExtractedWorld { ${streamMethod.getText(file)} }`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const ExtractedWorld = new Function('chunkCoord','chunkKey','MIN_SECTION','MAX_SECTION','sectionKey', `${compiled}; return ExtractedWorld;`)(n => Math.floor(n / 16), (x,z) => `${x},${z}`, -4, 19, (x,y,z) => `${x},${y},${z}`);
ExtractedWorld.prototype.preemptStaleWorkerRequest = function(){ return false; };

const chunkCoord = n => Math.floor(n / 16);
const chunkKey = (x, z) => `${x},${z}`;

function makeWorld(config = {}) {
  const w = Object.create(ExtractedWorld.prototype);
  w.terrainLayout = config.terrainLayout ?? 10;
  w.streamFeature = new Set();w.streamCandidates = [];w.streamRemoved = [];
  w.metropolisPlan = config.panda ? { panda: config.panda } : undefined;
  w.chunks = new Map();
  for (const [cx, cz] of config.loaded ?? []) w.chunks.set(chunkKey(cx, cz), {
    cx, cz, blocks: { sections: new Map() }
  });
  w.pending = new Set((config.pending ?? []).map(([x,z]) => chunkKey(x,z)));
  w.tickets = new Map();
  w.workerQueue = [];
  w.evictionBlocked = config.evictionBlocked ?? 0;
  w.navRevision = 0;
  w.dirty = new Set();
  w.sectionDirtyRevision = new Map();
  w.requests = [];
  w.evictionPending = 0;
  w.ensure = (cx, cz) => {
    const key = chunkKey(cx,cz);
    if (w.chunks.has(key) || w.pending.has(key)) return;
    w.pending.add(key);
    w.requests.push([cx,cz]);
  };
  w.cancelQueuedRequest = key => { w.workerQueue = w.workerQueue.filter(r => chunkKey(r.cx,r.cz) !== key); };
  w.pruneWorkerQueue = () => {};
  w.dispatchWorker = () => {};
  w.hasDirtyColumn = (cx,cz) => (config.dirtyColumns ?? []).some(([x,z]) => x===cx && z===cz);
  w.markDirty = () => {};
  w.onEvictionPending = () => { w.evictionPending++; };
  return w;
}

// Behavioral oracle matching the reference full-sort implementation.
function legacyStream(x, z, radius, yaw = 0) {
  const cx=chunkCoord(x),cz=chunkCoord(z);let requests=0;
  const positions=[];
  for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++)
    if(dx*dx+dz*dz<=(radius+0.5)**2)
      positions.push([cx+dx,cz+dz,dx*dx+dz*dz+0.7*(dx*Math.sin(yaw)+dz*Math.cos(yaw))]);
  const feature=new Set(),panda=this.terrainLayout>=8?this.metropolisPlan?.panda:undefined;
  if(panda){const px=(panda.x1+panda.x2)/2,pz=(panda.z1+panda.z2)/2;
    if(Math.hypot(x-px,z-pz)<=64)for(let b=chunkCoord(pz-6);b<=chunkCoord(pz+7);b++)for(let a=chunkCoord(px-9);a<=chunkCoord(px+9);a++){
      feature.add(chunkKey(a,b));if(!positions.some(p=>p[0]===a&&p[1]===b))positions.push([a,b,(a-cx)**2+(b-cz)**2]);
    }
  }
  positions.sort((a,b)=>a[2]-b[2]);
  for(const [a,b] of positions){if(this.evictionBlocked>64||this.pending.size>=8||requests>=4)break;
    const k=chunkKey(a,b);if(!this.chunks.has(k)&&!this.pending.has(k)){this.ensure(a,b);requests++;}}
  const removed=[];this.evictionBlocked=0;
  for(const key of this.pending){const[a,b]=key.split(',').map(Number);
    if(!feature.has(key)&&(Math.abs(a-cx)>radius+2||Math.abs(b-cz)>radius+2)){this.pending.delete(key);this.tickets.delete(key);this.cancelQueuedRequest(key);}}
  this.pruneWorkerQueue();this.dispatchWorker();
  for(const[k,c]of this.chunks)if(!feature.has(k)&&(Math.abs(c.cx-cx)>radius+2||Math.abs(c.cz-cz)>radius+2)){
    if(this.hasDirtyColumn(c.cx,c.cz)){this.evictionBlocked++;continue;}
    this.navRevision++;this.chunks.delete(k);for(let sy=-4;sy<=19;sy++)this.dirty.delete(`${c.cx},${sy},${c.cz}`);this.markDirty(c.cx,c.cz);removed.push(k);
  }
  if(this.evictionBlocked)this.onEvictionPending?.();
  return removed;
}
function snapshot(w, removed) {
  return {
    requests:w.requests,
    pending:[...w.pending].sort(),
    chunks:[...w.chunks.keys()].sort(),
    navRevision:w.navRevision,
    evictionBlocked:w.evictionBlocked,
    evictionPending:w.evictionPending,
    removed
  };
}

let seed=0x5eed1234;
function random(){seed=(seed*1664525+1013904223)>>>0;return seed/0x100000000;}
for(let trial=0;trial<500;trial++){
  const x=(random()*3000-1500),z=(random()*3000-1500),radius=Math.floor(random()*9),yaw=random()*Math.PI*2;
  const cx=chunkCoord(x),cz=chunkCoord(z),loaded=[],pending=[],dirtyColumns=[];
  for(let i=0;i<35;i++){
    const a=cx+Math.floor(random()* (radius*2+9))-radius-4;
    const b=cz+Math.floor(random()* (radius*2+9))-radius-4;
    if(random()<0.5)loaded.push([a,b]);else pending.push([a,b]);
    if(random()<0.04)dirtyColumns.push([a,b]);
  }
  const usePanda=trial%3===0;
  const panda=usePanda?{x1:x-24,x2:x+24,z1:z-18,z2:z+18}:undefined;
  const config={loaded,pending,dirtyColumns,panda,terrainLayout:trial%5===0?7:10,evictionBlocked:trial%17===0?65:0};
  const expected=makeWorld(config),actual=makeWorld(config);
  const oldRemoved=legacyStream.call(expected,x,z,radius,yaw);
  const newRemoved=actual.stream(x,z,radius,yaw);
  assert.deepEqual(snapshot(actual,newRemoved),snapshot(expected,oldRemoved),`stream parity trial ${trial}`);
}

// The production stream method retains its scratch containers across frames.
{
  const w=makeWorld();w.stream(0,0,8,0.4);
  const candidates=w.streamCandidates,feature=w.streamFeature,removed=w.streamRemoved;
  w.pending.clear();w.requests.length=0;
  const nextRemoved=w.stream(0,0,8,0.4);
  assert.strictEqual(w.streamCandidates,candidates,'candidate array is reused');
  assert.strictEqual(w.streamFeature,feature,'feature set is reused');
  assert.strictEqual(w.streamRemoved,removed,'eviction result array is reused');
  assert.strictEqual(nextRemoved,removed,'stream returns the reusable eviction result');
}

// Explicit edge contracts: pending cap, blocked eviction, panda pin and unsaved edit pin.
for(const pendingCount of [0,1,4,5,6,7,8]){
  const pending=[];for(let i=0;i<pendingCount;i++)pending.push([i+40,40]);
  const config={pending};const a=makeWorld(config),b=makeWorld(config);
  assert.deepEqual(snapshot(b,b.stream(0,0,3,0)),snapshot(a,legacyStream.call(a,0,0,3,0)),`pending cap ${pendingCount}`);
}
const { performance } = require('node:perf_hooks');
function resetForProfile(w){w.chunks.clear();w.pending.clear();w.requests.length=0;w.evictionBlocked=0;w.navRevision=0;}
const oldProfile=makeWorld(),newProfile=makeWorld();
for(let i=0;i<200;i++){legacyStream.call(oldProfile,0,0,8,0.73);resetForProfile(oldProfile);newProfile.stream(0,0,8,0.73);resetForProfile(newProfile);}
function profile(fn,w){const samples=[];for(let run=0;run<9;run++){const begin=performance.now();for(let i=0;i<3000;i++){fn(w);resetForProfile(w);}samples.push((performance.now()-begin)/3000);}samples.sort((a,b)=>a-b);return samples[4];}
const oldMs=profile(w=>legacyStream.call(w,0,0,8,0.73),oldProfile);
const newMs=profile(w=>w.stream(0,0,8,0.73),newProfile);
console.log(JSON.stringify({status:'PASS',differentialCases:500,pendingCapCases:7,streamProfile:{radius:8,medianMs:{legacy:oldMs,optimized:newMs},speedup:oldMs/newMs}},null,2));
