const assert=require('node:assert/strict');
const fs=require('node:fs');
const Module=require('node:module');
const ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,file);
const originalLoad=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='../core/coords'&&parent?.filename.endsWith('/mesh-coverage.ts'))return {MIN_SECTION:-4,MAX_SECTION:19};
  return originalLoad.call(this,request,parent,isMain);
};
const {MeshCoverageIndex}=require('../src/render/mesh-coverage.ts');
Module._load=originalLoad;
const MIN=-4,MAX=19,SIZE=128,LENGTH=SIZE*SIZE*(MAX-MIN+1);
const sectionKey=(x,y,z)=>`${x},${y},${z}`;
const chunkKey=(x,z)=>`${x},${z}`;
function reference(world,meshed,originX,originZ){
  const coverage=new Uint8Array(LENGTH),marked=new Set(),coordinates=new Map(),columns=new Set();
  const mark=(cx,sy,cz)=>{const x=cx-originX/16,z=cz-originZ/16;if(x<0||z<0||x>=SIZE||z>=SIZE||sy<MIN||sy>MAX)return;
    const i=x+(z+(sy-MIN)*SIZE)*SIZE;marked.add(i);coverage[i]=255;};
  for(const key of meshed){const[cx,sy,cz]=key.split(',').map(Number);coordinates.set(key,{cx,sy,cz,column:chunkKey(cx,cz)});mark(cx,sy,cz);columns.add(chunkKey(cx,cz));}
  for(const key of coordinates.keys())if(!meshed.has(key))coordinates.delete(key);
  for(const key of columns){const c=world.chunks.get(key);if(c)for(let sy=MIN;sy<=MAX;sy++)if(!c.blocks.sections.has(sy))mark(c.cx,sy,c.cz);}
  return coverage;
}
function makeWorld(){return {chunks:new Map()};}
function addChunk(world,cx,cz,sections=[]){world.chunks.set(chunkKey(cx,cz),{cx,cz,blocks:{sections:new Map(sections.map(s=>[s,{}]))}});}
function same(actual,expected,label){assert.deepEqual(actual,expected,label);}

// Initial full reconciliation is byte-identical to the previous coverage algorithm.
{
  const world=makeWorld(),meshed=new Set();
  for(let cx=0;cx<8;cx++)for(let cz=0;cz<8;cz++){
    const sections=[];for(let sy=MIN;sy<=MAX;sy++)if((cx*13+cz*7+sy*3)%5===0)sections.push(sy);
    addChunk(world,cx,cz,sections);
    for(let sy=MIN;sy<=MAX;sy++)if((cx*5+cz*11+sy*2)%9===0)meshed.add(sectionKey(cx,sy,cz));
  }
  const coverage=new Uint8Array(LENGTH),index=new MeshCoverageIndex(world,coverage,0,0);
  assert.equal(index.update(meshed,[],0,0,1),true);
  same(coverage,reference(world,meshed,0,0),'initial full sync parity');
}

// Delta additions/removals and nav-revision full reconciliation remain equivalent.
{
  const world=makeWorld();for(let cx=0;cx<6;cx++)for(let cz=0;cz<6;cz++)addChunk(world,cx,cz,[-4,-2,0,3,7,12,19]);
  const meshed=new Set(['0,-4,0','0,0,0','1,3,1','2,7,2','3,12,3']);
  const coverage=new Uint8Array(LENGTH),index=new MeshCoverageIndex(world,coverage,0,0);
  let revision=0,navRevision=1,base=0;const log=[];
  const check=label=>same(coverage,reference(world,meshed,0,0),label);
  index.update(meshed,log,revision,base,navRevision);check('initial coverage');
  const mutate=(key,present)=>{revision++;if(present)meshed.add(key);else meshed.delete(key);log.push({revision,key,present});index.update(meshed,log,revision,base,navRevision);check(`mesh delta ${revision}`);};
  mutate('1,-4,1',true);mutate('1,3,1',false);mutate('2,7,2',false);mutate('2,12,2',true);mutate('3,12,3',false);
  // Loading/evicting or editing a chunk can change which unmeshed sections are known empty.
  world.chunks.get('0,0').blocks.sections.set(5,{});navRevision++;
  assert.equal(index.update(meshed,log,revision,base,navRevision),true);check('nav revision rebuild');
  mutate('4,5,4',true);mutate('4,5,4',false);
  // Renderer clear/reset event followed by new mesh additions.
  revision++;meshed.clear();log.push({revision,key:'',present:false,reset:true});index.update(meshed,log,revision,base,navRevision);check('reset event');
  mutate('5,19,5',true);
  // Journal overflow must recover through a full reconciliation.
  meshed.add('6,18,6');revision++;base=revision;
  assert.equal(index.update(meshed,log,revision,base,navRevision),true);check('journal overflow fallback');
  index.setOrigin(16,16);assert.equal(index.update(meshed,log,revision,base,navRevision),true);
  same(coverage,reference(world,meshed,16,16),'origin reset parity');
  revision++;meshed.delete('6,18,6');log.push({revision,key:'6,18,6',present:false});index.update(meshed,log,revision,base,navRevision);same(coverage,reference(world,meshed,16,16),'post-origin removal parity');
  revision++;meshed.delete('5,19,5');log.push({revision,key:'5,19,5',present:false});index.update(meshed,log,revision,base,navRevision);same(coverage,reference(world,meshed,16,16),'post-origin final removal parity');
}

// Removing a detailed section from a still-active column keeps known-empty coverage,
// while removing the final detailed section clears the entire column.
{
  const world=makeWorld();addChunk(world,0,0,[-4,0,5]);
  const meshed=new Set(['0,0,0','0,5,0','0,7,0']),coverage=new Uint8Array(LENGTH),index=new MeshCoverageIndex(world,coverage,0,0);
  let rev=0;index.update(meshed,[],rev,0,1);
  meshed.delete('0,7,0');rev++;
  index.update(meshed,[{revision:rev,key:'0,7,0',present:false}],rev,0,1);
  same(coverage,reference(world,meshed,0,0),'removed known-empty section remains covered while column active');
  meshed.delete('0,0,0');rev++;
  index.update(meshed,[{revision:rev,key:'0,0,0',present:false}],rev,0,1);
  same(coverage,reference(world,meshed,0,0),'one populated section removed while column active');
  meshed.delete('0,5,0');rev++;
  index.update(meshed,[{revision:rev,key:'0,5,0',present:false}],rev,0,1);
  same(coverage,reference(world,meshed,0,0),'last section removed clears column');
}
console.log('PASS mesh coverage index: initial sync, 9 delta changes, nav invalidation, reset, journal overflow, origin change and empty-section parity');

// Rapid stream eviction/reload must hand coverage cleanly back to distant proxies,
// then restore detailed-section coverage after the replacement chunk is meshed.
{
  const world=makeWorld();addChunk(world,0,0,[-4,0,5]);
  const meshed=new Set(['0,-4,0','0,0,0','0,5,0']);
  const coverage=new Uint8Array(LENGTH),index=new MeshCoverageIndex(world,coverage,0,0);
  let revision=0,navRevision=1,base=0;const log=[];
  index.update(meshed,log,revision,base,navRevision);
  same(coverage,reference(world,meshed,0,0),'loaded chunk detailed coverage');

  world.chunks.delete('0,0');meshed.clear();navRevision++;
  assert.equal(index.update(meshed,log,revision,base,navRevision),true);
  same(coverage,reference(world,meshed,0,0),'evicted chunk returns to distant proxy coverage');

  addChunk(world,0,0,[-4,0,5]);navRevision++;
  assert.equal(index.update(meshed,log,revision,base,navRevision),false,
    'loading an unmeshed chunk must not hide its distant proxy');
  same(coverage,reference(world,meshed,0,0),'reloaded but not-yet-meshed chunk remains proxy-covered');

  meshed.add('0,0,0');revision++;
  log.push({revision,key:'0,0,0',present:true});
  assert.equal(index.update(meshed,log,revision,base,navRevision),true);
  same(coverage,reference(world,meshed,0,0),'detailed coverage takes over after remesh');
}
console.log('PASS mesh coverage stream seam: eviction, reload-before-mesh and detailed remesh handoff');
