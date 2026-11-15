import { World } from "./world";
import { emits, block } from "./blocks";
import {
  index, MIN_Y, MAX_Y, MIN_SECTION, MAX_SECTION, sectionKey,
  chunkKey, chunkCoord, localCoord,
} from "../core/coords";

const LIGHT_DIRECTIONS = [1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1] as const;

function parseBlockKey(key:string):[number,number,number]|undefined {
  const first=key.indexOf(","),second=key.indexOf(",",first+1);
  if(first<0||second<0)return undefined;
  const x=Number(key.slice(0,first)),y=Number(key.slice(first+1,second)),z=Number(key.slice(second+1));
  return Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z)?[x,y,z]:undefined;
}

function lightAtSample(sections:Map<string,Uint8Array>,x:number,y:number,z:number) {
  return sections.get(sectionKey(chunkCoord(x),chunkCoord(y),chunkCoord(z)))?.[
    index(localCoord(x),localCoord(y),localCoord(z))
  ]??0;
}

/** Map-compatible diagnostic view backed by compact 16³ section arrays. */
class BlockLightLookup {
  constructor(private owner:Lighting) {}
  get size(){return this.owner.blockLightCount;}
  get(key:string){const p=parseBlockKey(key);return p?this.owner.readBlockLight(p[0],p[1],p[2])||undefined:undefined;}
  has(key:string){return this.get(key)!==undefined;}
  set(key:string,value:number){const p=parseBlockKey(key);if(p)this.owner.writeBlockLight(p[0],p[1],p[2],value);return this;}
  delete(key:string){const p=parseBlockKey(key);return p?this.owner.writeBlockLight(p[0],p[1],p[2],0):false;}
  clear(){this.owner.clearBlockLight();}
  *entries():IterableIterator<[string,number]>{
    for(const [section,values] of this.owner.blockLightSections){
      const [cx,sy,cz]=section.split(",").map(Number);
      for(let i=0;i<values.length;i++){const value=values[i];if(!value)continue;
        const x=i%16,z=Math.floor(i/16)%16,y=Math.floor(i/256);
        yield [`${cx*16+x},${sy*16+y},${cz*16+z}`,value];
      }
    }
  }
  [Symbol.iterator](){return this.entries();}
}

export class Lighting {
  // Compact section arrays are authoritative; the compatibility lookup avoids
  // duplicating every lit voxel in a string-keyed Map.
  blockLightSections=new Map<string,Uint8Array>();
  blockLightCount=0;
  private readonly blockLightView=new BlockLightLookup(this);
  get blockLight(){return this.blockLightView;}
  // Keep the legacy assignment shape available to existing diagnostic tests/tools.
  set blockLight(value:Map<string,number>|BlockLightLookup){
    if(value===this.blockLightView)return;
    this.clearBlockLight();
    for(const [key,light] of value)this.blockLightView.set(key,light);
  }
  sky=new Map<string,Int16Array>();
  private blockLightChunks=new Map<string,string[]>();
  private disposed=false;
  signature=-1;
  constructor(public world:World){
    this.committedEditRevision=this.worldEditSignature();
    this.committedTopologyRevision=this.worldTopologySignature();
  }
  private job?:Generator<void,boolean>;
  private jobSignature=-1;
  private jobEditSignature=-1;
  private jobTopologySignature=-1;
  private committedEditRevision=-1;
  private committedTopologyRevision=-1;
  private attemptedEditRevision=-1;
  private worldSignature(){return this.world.navRevision;}
  private worldEditSignature(){return this.world.lightingEditRevision??this.world.navRevision;}
  private worldTopologySignature(){return this.world.chunkTopologyRevision??this.world.navRevision;}
  private pendingChunkCount(){return this.world.pending?.size??0;}
  /**
   * True when a new block edit deserves one urgent attempt, or when chunk
   * topology has settled and the coalesced world lighting pass can resume.
   */
  get needsUpdate(){
    if(this.disposed||this.job)return false;
    const edit=this.worldEditSignature(),topology=this.worldTopologySignature();
    const editPending=edit!==this.committedEditRevision;
    const topologyPending=topology!==this.committedTopologyRevision||this.signature!==this.worldSignature();
    const urgentEdit=editPending&&this.attemptedEditRevision!==edit;
    return urgentEdit||(topologyPending&&this.pendingChunkCount()===0);
  }
  readBlockLight(x:number,y:number,z:number){
    return this.blockLightSections.get(sectionKey(chunkCoord(x),chunkCoord(y),chunkCoord(z)))?.[
      index(localCoord(x),localCoord(y),localCoord(z))
    ]??0;
  }
  writeBlockLight(x:number,y:number,z:number,value:number){
    if(!Number.isInteger(value)||value<0||value>15)return false;
    const sk=sectionKey(chunkCoord(x),chunkCoord(y),chunkCoord(z)),offset=index(localCoord(x),localCoord(y),localCoord(z));
    let values=this.blockLightSections.get(sk);
    if(!values){if(value===0)return false;this.blockLightSections.set(sk,values=new Uint8Array(4096));
      const ck=chunkKey(chunkCoord(x),chunkCoord(z));let keys=this.blockLightChunks.get(ck);if(!keys)this.blockLightChunks.set(ck,keys=[]);keys.push(sk);}
    const old=values[offset];if(old===value)return false;
    if(old===0&&value>0)this.blockLightCount++;else if(old>0&&value===0)this.blockLightCount--;
    values[offset]=value;return true;
  }
  clearBlockLight(){this.blockLightSections.clear();this.blockLightChunks.clear();this.blockLightCount=0;}
  /** Synchronous path for deterministic engine tests and offline benchmarks. */
  rebuild(){
    if(this.disposed)return false;
    this.cancelJob();
    const work=this.compute();let step=work.next();while(!step.done)step=work.next();return step.value;
  }
  /** Browser path: spread propagation and diffing over a small per-frame CPU budget. */
  update(budgetMs=4){
    if(this.disposed)return false;
    const signature=this.worldSignature(),edit=this.worldEditSignature(),topology=this.worldTopologySignature();
    const editPending=edit!==this.committedEditRevision;
    const topologyPending=topology!==this.committedTopologyRevision||this.signature!==signature;
    if(this.job){
      const editChanged=this.jobEditSignature!==edit;
      const topologyChanged=this.jobTopologySignature!==topology||this.jobSignature!==signature;
      if(editChanged||topologyChanged){
        this.cancelJob();
        // A topology-only revision makes the in-flight snapshot stale. If
        // more chunks are still pending, discard it once and wait for the
        // stable topology instead of rebuilding the same world repeatedly.
        if(topologyChanged&&!editChanged&&this.pendingChunkCount()>0)return false;
      }
    }
    if(!this.job){
      const urgentEdit=editPending&&this.attemptedEditRevision!==edit;
      if(topologyPending&&this.pendingChunkCount()>0&&!urgentEdit)return false;
      if(urgentEdit)this.attemptedEditRevision=edit;
      this.job=this.compute();
      this.jobSignature=signature;
      this.jobEditSignature=edit;
      this.jobTopologySignature=topology;
    }
    const end=performance.now()+budgetMs;
    do{const step=this.job.next();if(step.done){this.job=undefined;this.jobSignature=-1;this.jobEditSignature=-1;this.jobTopologySignature=-1;return step.value;}}
    while(performance.now()<end);
    return false;
  }
  get pending(){return !!this.job;}
  private *compute():Generator<void,boolean>{
    const signature=this.worldSignature();
    const editSignature=this.worldEditSignature();
    const topologySignature=this.worldTopologySignature();
    if(signature===this.signature)return false;
    const oldLightSections=this.blockLightSections,oldSky=this.sky;
    const blockLightSections=new Map<string,Uint8Array>(),skies=new Map<string,Int16Array>(),lightKeysByChunk=new Map<string,string[]>();
    let blockLightCount=0;
    const setLight=(x:number,y:number,z:number,value:number)=>{
      const sk=sectionKey(chunkCoord(x),chunkCoord(y),chunkCoord(z));let values=blockLightSections.get(sk);
      if(!values){blockLightSections.set(sk,values=new Uint8Array(4096));const ck=chunkKey(chunkCoord(x),chunkCoord(z));let keys=lightKeysByChunk.get(ck);if(!keys)lightKeysByChunk.set(ck,keys=[]);keys.push(sk);}
      const offset=index(localCoord(x),localCoord(y),localCoord(z));if(values[offset]===0)blockLightCount++;values[offset]=value;
    };
    const lightAt=(x:number,y:number,z:number)=>blockLightSections.get(sectionKey(chunkCoord(x),chunkCoord(y),chunkCoord(z)))?.[
      index(localCoord(x),localCoord(y),localCoord(z))
    ]??0;
    let queue=new Int32Array(4096),queueCount=0;
    const enqueue=(x:number,y:number,z:number,light:number)=>{
      const offset=queueCount*4;
      if(offset+3>=queue.length){const grown=new Int32Array(queue.length*2);grown.set(queue);queue=grown;}
      queue[offset]=x;queue[offset+1]=y;queue[offset+2]=z;queue[offset+3]=light;queueCount++;
    };
    const dirty=new Set<string>();
    for(const [key,c] of this.world.chunks){
      const sky=new Int16Array(256).fill(MIN_Y-1);
      for(let sy=MAX_SECTION;sy>=MIN_SECTION;sy--){
        const section=c.blocks.sections.get(sy);if(!section)continue;
        const values=section.values;
        if(typeof values==="number"){
          const definition=block(values),emission=emits(values,definition),topY=sy*16+15;
          if(definition.opaque)for(let i=0;i<256;i++)if(sky[i]<topY)sky[i]=topY;
          if(emission)for(let ly=15;ly>=0;ly--)for(let z=0;z<16;z++)for(let x=0;x<16;x++){
            const y=sy*16+ly,wx=c.cx*16+x,wz=c.cz*16+z;setLight(wx,y,wz,emission);enqueue(wx,y,wz,emission);
          }
          yield;continue;
        }
        for(let ly=15;ly>=0;ly--){
          const y=sy*16+ly,row=ly*256;
          for(let z=0;z<16;z++){
            const column=z*16,base=row+column;
            for(let x=0;x<16;x++){
              const v=values[base+x];if(v===0)continue;
              const definition=block(v);
              if(definition.opaque&&sky[x+column]<y)sky[x+column]=y;
              const emission=emits(v,definition);
              if(emission){const wx=c.cx*16+x,wz=c.cz*16+z;setLight(wx,y,wz,emission);enqueue(wx,y,wz,emission);}
            }
          }
        }
        yield;
      }
      skies.set(key,sky);yield;
    }
    // Keep propagation bounded while preserving the existing lighting result.
    for(let i=0;i<queueCount&&i<250000;i++){
      if(i%256===0)yield;
      const offset=i*4,x=queue[offset],y=queue[offset+1],z=queue[offset+2],light=queue[offset+3];
      if(light<=1)continue;
      for(let d=0;d<LIGHT_DIRECTIONS.length;d+=3){
        const nx=x+LIGHT_DIRECTIONS[d],ny=y+LIGHT_DIRECTIONS[d+1],nz=z+LIGHT_DIRECTIONS[d+2];
        if(ny<MIN_Y||ny>MAX_Y||!this.world.loaded(nx,nz)||block(this.world.get(nx,ny,nz)).opaque)continue;
        if(lightAt(nx,ny,nz)>=light-1)continue;
        setLight(nx,ny,nz,light-1);enqueue(nx,ny,nz,light-1);
      }
    }
    for(const [key,values] of skies){
      const old=oldSky.get(key);let changed=!old;
      if(old)for(let i=0;i<values.length;i++)if(values[i]!==old[i]){changed=true;break;}
      if(changed){const c=this.world.chunks.get(key);if(!c)return false;for(const sy of c.blocks.sections.keys())dirty.add(sectionKey(c.cx,sy,c.cz));}
      yield;
    }
    let scanned=0;
    for(const [key,values] of blockLightSections){
      if(++scanned%16===0)yield;
      const old=oldLightSections.get(key);let changed=!old;
      if(old)for(let i=0;i<values.length;i++)if(values[i]!==old[i]){changed=true;break;}
      if(changed)dirty.add(key);
    }
    for(const key of oldLightSections.keys()){if(++scanned%16===0)yield;if(!blockLightSections.has(key))dirty.add(key);}
    if(this.worldSignature()!==signature||this.worldEditSignature()!==editSignature||this.worldTopologySignature()!==topologySignature)return false;
    this.signature=signature;
    this.committedEditRevision=editSignature;
    this.committedTopologyRevision=topologySignature;
    this.blockLightSections=blockLightSections;this.blockLightCount=blockLightCount;this.blockLightChunks=lightKeysByChunk;this.sky=skies;
    for(const key of dirty){
      const first=key.indexOf(","),second=key.indexOf(",",first+1);
      const cx=Number(key.slice(0,first)),sy=Number(key.slice(first+1,second)),cz=Number(key.slice(second+1));
      if(this.world.chunks.has(chunkKey(cx,cz)))this.world.markSection(cx,sy,cz);
    }
    return true;
  }
  private cancelJob(){if(!this.job)return;try{this.job.return(false);}catch{/* generator may already have completed */}this.job=undefined;this.jobSignature=-1;this.jobEditSignature=-1;this.jobTopologySignature=-1;}
  /** Drop compact lighting sections for evicted columns immediately. */
  pruneUnloaded(chunkKeys:readonly string[]){
    if(this.disposed||!chunkKeys.length)return;
    this.cancelJob();
    for(const key of chunkKeys){
      const sections=this.blockLightChunks.get(key);
      if(sections)for(const sectionKeyValue of sections){const values=this.blockLightSections.get(sectionKeyValue);if(values){for(let i=0;i<values.length;i++)if(values[i])this.blockLightCount--;this.blockLightSections.delete(sectionKeyValue);}}
      this.blockLightChunks.delete(key);this.sky.delete(key);
    }
    this.signature=-1;
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.cancelJob();this.clearBlockLight();this.sky.clear();this.signature=-1;}
  /**
   * Build a short-lived sampler for one chunk section. Meshing samples only
   * the section and its immediate x/y/z neighbors, so resolving the relevant
   * light arrays once avoids allocating section-key strings and performing
   * Map lookups for every exposed face.
   *
   * Coordinates passed to the returned sampler are local to the chunk and
   * section (normally -1..16). The result is identical to sampleInto().
   */
  createSectionSampler(cx:number,sy:number,cz:number){
    const blockSections=new Array<Uint8Array|undefined>(27);
    const skyColumns=new Array<Int16Array|undefined>(9);
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
      const columnIndex=(dz+1)*3+(dx+1);
      skyColumns[columnIndex]=this.sky.get(chunkKey(cx+dx,cz+dz));
      for(let dy=-1;dy<=1;dy++){
        const sectionIndex=(dy+1)*9+columnIndex;
        blockSections[sectionIndex]=this.blockLightSections.get(sectionKey(cx+dx,sy+dy,cz+dz));
      }
    }
    return (x:number,y:number,z:number,out:[number,number])=>{
      if(this.disposed){out[0]=1;out[1]=0;return out;}
      const worldY=sy*16+y;
      if(worldY>MAX_Y){out[0]=1;out[1]=0;return out;}
      if(worldY<MIN_Y){out[0]=0;out[1]=0;return out;}
      const dx=x<0?-1:x>15?1:0,dz=z<0?-1:z>15?1:0,dy=y<0?-1:y>15?1:0;
      const lx=(x+16)%16,ly=(y+16)%16,lz=(z+16)%16;
      const columnIndex=(dz+1)*3+(dx+1);
      const sky=skyColumns[columnIndex]?.[lx+lz*16];
      out[0]=sky===undefined||worldY>=sky?1:0;
      const values=blockSections[(dy+1)*9+columnIndex];
      out[1]=(values?.[index(lx,ly,lz)]??0)/15;
      return out;
    };
  }
  sampleInto(x:number,y:number,z:number,out:[number,number]){
    if(this.disposed){out[0]=1;out[1]=0;return out;}
    if(y>MAX_Y){out[0]=1;out[1]=0;return out;}
    if(y<MIN_Y){out[0]=0;out[1]=0;return out;}
    const sky=this.sky.get(chunkKey(chunkCoord(x),chunkCoord(z)))?.[localCoord(x)+localCoord(z)*16];
    out[0]=sky===undefined||y>=sky?1:0;
    out[1]=lightAtSample(this.blockLightSections,x,y,z)/15;
    return out;
  }
  sample(x:number,y:number,z:number){return this.sampleInto(x,y,z,[0,0]);}
}
