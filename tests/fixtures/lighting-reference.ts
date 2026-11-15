import { World } from "../../src/world/world";
import { emits, block } from "../../src/world/blocks";
import {
  blockKey,
  index,
  MIN_Y, MAX_Y, sectionKey,
  chunkKey,
  chunkCoord,
  localCoord,
} from "../../src/core/coords";
export class Lighting {
  blockLight = new Map<string, number>();
  sky = new Map<string, Int16Array>();
  private blockLightChunks = new Map<string,string[]>();
  private disposed=false;
  signature = -1;
  constructor(public world: World) {}
  private job?: Generator<void, boolean>;
  private worldSignature() {
    // World increments navRevision whenever a chunk is accepted/evicted or a
    // block changes. This is equivalent to scanning all chunk revisions, but
    // avoids allocating a long string on every lighting update.
    return this.world.navRevision;
  }
  /** Synchronous path for deterministic engine tests and offline benchmarks. */
  rebuild() {
    if(this.disposed)return false;
    this.cancelJob();
    const work = this.compute();
    let step = work.next();
    while (!step.done) step = work.next();
    return step.value;
  }
  /** Browser path: spread propagation and diffing over a small per-frame CPU budget. */
  update(budgetMs = 4) {
    if(this.disposed)return false;
    if (!this.job) this.job = this.compute();
    const end = performance.now() + budgetMs;
    do {
      const step = this.job.next();
      if (step.done) {
        this.job = undefined;
        return step.value;
      }
    } while (performance.now() < end);
    return false;
  }
  get pending() {
    return !!this.job;
  }
  private *compute(): Generator<void, boolean> {
    const signature = this.worldSignature();
    if (signature === this.signature) return false;
    const oldLight = this.blockLight,
      oldSky = this.sky;
    const blockLight = new Map<string, number>(),
      skies = new Map<string, Int16Array>(),
      lightKeysByChunk = new Map<string,string[]>();
    const setLight=(x:number,y:number,z:number,value:number)=>{
      const key=blockKey(x,y,z),ck=chunkKey(chunkCoord(x),chunkCoord(z));let keys=lightKeysByChunk.get(ck);
      if(!keys)lightKeysByChunk.set(ck,keys=[]);if(!blockLight.has(key))keys.push(key);blockLight.set(key,value);
    };
    const dirty = new Set<string>();
    const queue: [number, number, number, number][] = [];
    for (const [key, c] of this.world.chunks) {
      const sky = new Int16Array(256).fill(MIN_Y-1);
      for(const [sy,section] of [...c.blocks.sections].sort((a,b)=>b[0]-a[0])) {
        for(let ly=15;ly>=0;ly--) for(let z=0;z<16;z++) for(let x=0;x<16;x++) {
          const y=sy*16+ly, v=section.get(index(x,ly,z));
          if(block(v).opaque && sky[x+z*16]<y) sky[x+z*16]=y;
          const emission=emits(v);
          if(emission) {
            const wx=c.cx*16+x,wz=c.cz*16+z;
            setLight(wx,y,wz,emission);queue.push([wx,y,wz,emission]);
          }
        }
        yield;
      }
      skies.set(key, sky);
      yield;
    }
    for (let i = 0; i < queue.length && i < 250000; i++) {
      if (i % 256 === 0) yield;
      const [x, y, z, l] = queue[i];
      if (l <= 1) continue;
      for (const [dx, dy, dz] of [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
        [0, 0, -1],
      ]) {
        const nx = x + dx,
          ny = y + dy,
          nz = z + dz;
        if (
          ny < MIN_Y ||
          ny > MAX_Y ||
          !this.world.loaded(nx, nz) ||
          block(this.world.get(nx, ny, nz)).opaque
        )
          continue;
        const k = blockKey(nx, ny, nz);
        if ((blockLight.get(k) ?? 0) >= l - 1) continue;
        setLight(nx,ny,nz,l-1);
        queue.push([nx, ny, nz, l - 1]);
      }
    }
    for (const [key, s] of skies) {
      const old = oldSky.get(key);
      if (!old || s.some((v, i) => v !== old[i])) {
        const c=this.world.chunks.get(key);
        if(!c) return false;
        for(const sy of c.blocks.sections.keys()) dirty.add(sectionKey(c.cx,sy,c.cz));
      }
      yield;
    }
    let scanned = 0;
    for (const [key, l] of blockLight) {
      if (++scanned % 512 === 0) yield;
      if (oldLight.get(key) !== l) {
        const [x,y,z] = key.split(",").map(Number);
        dirty.add(sectionKey(chunkCoord(x),chunkCoord(y),chunkCoord(z)));
      }
    }
    for (const key of oldLight.keys()) {
      if (++scanned % 512 === 0) yield;
      if (!blockLight.has(key)) {
        const [x,y,z] = key.split(",").map(Number);
        dirty.add(sectionKey(chunkCoord(x),chunkCoord(y),chunkCoord(z)));
      }
    }
    // A chunk changed or streamed out during propagation: discard the staging result.
    if (this.worldSignature() !== signature) return false;
    this.signature = signature;
    this.blockLight = blockLight;
    this.blockLightChunks = lightKeysByChunk;
    this.sky = skies;
    for (const key of dirty)
      { const [x,,z]=key.split(",").map(Number);if(this.world.chunks.has(chunkKey(x,z))) this.world.dirty.add(key); }
    return true;
  }
  private cancelJob(){if(!this.job)return;try{this.job.return(false);}catch{/* A generator may already have completed. */}this.job=undefined;}
  /** Drop lighting data for evicted columns immediately instead of retaining it until a full propagation pass. */
  pruneUnloaded(chunkKeys:readonly string[]){
    if(this.disposed||!chunkKeys.length)return;
    this.cancelJob();
    for(const key of chunkKeys){const lightKeys=this.blockLightChunks.get(key);if(lightKeys)for(const lightKey of lightKeys)this.blockLight.delete(lightKey);this.blockLightChunks.delete(key);this.sky.delete(key);}
    this.signature=-1;
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.cancelJob();this.blockLight.clear();this.sky.clear();this.blockLightChunks.clear();this.signature=-1;}
  sample(x: number, y: number, z: number) {
    if(this.disposed)return [1,0];
    if (y > MAX_Y) return [1, 0];
    if (y < MIN_Y) return [0, 0];
    const sky = this.sky.get(chunkKey(chunkCoord(x), chunkCoord(z)))?.[
      localCoord(x)+localCoord(z)*16
    ];
    return [
      sky === undefined || y >= sky ? 1 : 0,
      (this.blockLight.get(blockKey(x, y, z)) ?? 0) / 15,
    ];
  }
}
