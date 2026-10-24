import {
  CHUNK,
  MIN_Y, MAX_Y, MIN_SECTION, MAX_SECTION, sectionKey,
  index,
  chunkCoord,
  localCoord,
  chunkKey,
  blockKey,
} from "../core/coords";
import { BlockColumn, SectionData } from "./sections";
import { generateChunk } from "./generator";
import { B } from "./blocks";
export type Chunk = {
  cx: number;
  cz: number;
  blocks: BlockColumn;
  revision: number;
};
export class World {
  chunks = new Map<string, Chunk>();
  edits = new Map<string, number>();
  dirty = new Set<string>();
  pending = new Set<string>();
  dirtyEdits = new Map<string, number>();
  private editSequence = 0;
  private editChunks = new Map<string, Map<string, number>>();
  private worker?: Worker;
  private epoch = 0;
  private ticket = 0;
  private tickets = new Map<string, number>();
  evictionBlocked = 0;
  navRevision = 0;
  onEvictionPending?: () => void;
  onGeneration?: (ms:number) => void;
  onChange?: (x: number, y: number, z: number, v: number) => void;
  constructor(
    public seed: string,
    edits: Record<string, number> = {},
    worker = true,
  ) {
    this.edits = new Map(Object.entries(edits));
    for (const [key, value] of this.edits) this.indexEdit(key, value);
    if (worker && typeof Worker !== "undefined") {
      this.worker = new Worker(
        new URL("./generation.worker.ts", import.meta.url),
        { type: "module" },
      );
      this.worker.onmessage = (e) => {
        const key = chunkKey(e.data.cx, e.data.cz);
        if (e.data.epoch === this.epoch && this.tickets.get(key) === e.data.ticket) {
          this.onGeneration?.(e.data.elapsedMs);
          this.accept(e.data.cx, e.data.cz, BlockColumn.from(e.data.sections as SectionData[]));
        }
      };
      this.worker.onerror = () => {
        this.worker?.terminate();
        this.worker = undefined;
        this.pending.clear();
        this.tickets.clear();
      };
    }
  }
  accept(cx: number, cz: number, blocks: BlockColumn) {
    const key = chunkKey(cx, cz);
    if (!this.pending.has(key) && this.chunks.has(key)) return;
    for(let sy=MIN_SECTION;sy<=MAX_SECTION;sy++) for (const [k, v] of this.editChunks.get(sectionKey(cx,sy,cz)) ?? []) {
      const [x, y, z] = k.split(",").map(Number);
      blocks.set(localCoord(x), y, localCoord(z), v);
    }
    this.navRevision++;
    this.chunks.set(key, { cx, cz, blocks, revision: 0 });
    this.pending.delete(key);
    this.tickets.delete(key);
    this.markDirty(cx, cz);
  }
  ensure(cx: number, cz: number, sync = false) {
    const key = chunkKey(cx, cz);
    if (this.chunks.has(key) || (this.pending.has(key) && !sync)) return;
    this.pending.add(key);
    if (this.worker && !sync)
      {
        const ticket = ++this.ticket;
        this.tickets.set(key,ticket);
        this.worker.postMessage({ cx, cz, seed: this.seed, epoch: this.epoch, ticket });
      }
    else this.accept(cx, cz, generateChunk(cx, cz, this.seed));
  }
  get(x: number, y: number, z: number) {
    x = Math.floor(x);
    y = Math.floor(y);
    z = Math.floor(z);
    if (y < MIN_Y) return B.Obsidian;
    if (y > MAX_Y) return B.Air;
    return (
      this.chunks.get(chunkKey(chunkCoord(x), chunkCoord(z)))?.blocks.get(localCoord(x), y, localCoord(z)) ?? B.Air
    );
  }
  loaded(x: number, z: number) {
    return this.chunks.has(chunkKey(chunkCoord(x), chunkCoord(z)));
  }
  set(x: number, y: number, z: number, v: number) {
    if (![x, y, z, v].every(Number.isInteger) || y <= MIN_Y || y > MAX_Y)
      return false;
    if(this.loaded(x,z) && this.get(x,y,z)===v) return true;
    this.navRevision++;
    const editKey = blockKey(x, y, z);
    this.edits.set(editKey, v);
    this.indexEdit(editKey, v);
    this.dirtyEdits.set(
      sectionKey(chunkCoord(x),chunkCoord(y),chunkCoord(z)),
      ++this.editSequence,
    );
    const cx = chunkCoord(x),
      cz = chunkCoord(z),
      chunk = this.chunks.get(chunkKey(cx, cz));
    if (chunk) {
      chunk.blocks.set(localCoord(x), y, localCoord(z), v);
      chunk.revision++;
    }
    this.markSection(cx,chunkCoord(y),cz);
    if(localCoord(x)===0) this.markSection(cx-1,chunkCoord(y),cz);
    if(localCoord(x)===15) this.markSection(cx+1,chunkCoord(y),cz);
    if(localCoord(z)===0) this.markSection(cx,chunkCoord(y),cz-1);
    if(localCoord(z)===15) this.markSection(cx,chunkCoord(y),cz+1);
    if(localCoord(y)===0) this.markSection(cx,chunkCoord(y)-1,cz);
    if(localCoord(y)===15) this.markSection(cx,chunkCoord(y)+1,cz);
    this.onChange?.(x, y, z, v);
    return true;
  }
  indexEdit(key: string, value: number) {
    const [x, y, z] = key.split(",").map(Number),
      ck = sectionKey(chunkCoord(x),chunkCoord(y),chunkCoord(z));
    let edits = this.editChunks.get(ck);
    if (!edits) this.editChunks.set(ck, (edits = new Map()));
    edits.set(key, value);
  }
  captureChanges() {
    // Canonical ordering makes equivalent edit overlays produce identical
    // chunk deltas/checksums regardless of the order edits happened in.
    const revisions = new Map([...this.dirtyEdits].sort(([a],[b])=>a.localeCompare(b)));
    const chunks = [...revisions.keys()].map((key) => {
      const entries: [number,number][] = [];
      for (const [k, v] of this.editChunks.get(key) ?? []) {
        const [x, y, z] = k.split(",").map(Number);
        entries.push([index(localCoord(x), localCoord(y), localCoord(z)), v]);
      }
      entries.sort((a,b)=>a[0]-b[0]);
      const packedEntries=new Uint16Array(entries.length*2);
      for(let i=0;i<entries.length;i++){packedEntries[i*2]=entries[i][0];packedEntries[i*2+1]=entries[i][1];}
      return { key, entries: packedEntries };
    });
    return { revisions, chunks };
  }
  acknowledgeChanges(revisions: Map<string, number>) {
    for (const [key, revision] of revisions)
      if (this.dirtyEdits.get(key) === revision) this.dirtyEdits.delete(key);
  }
  markSection(cx:number,sy:number,cz:number) {
    if(sy>=MIN_SECTION && sy<=MAX_SECTION) this.dirty.add(sectionKey(cx,sy,cz));
  }
  markDirty(cx:number,cz:number) {
    for(const [dx,dz] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]) {
      const c=this.chunks.get(chunkKey(cx+dx,cz+dz));
      if(c) for(const sy of c.blocks.sections.keys()) this.markSection(c.cx,sy,c.cz);
    }
  }
  hasDirtyColumn(cx:number,cz:number) {
    for(let sy=MIN_SECTION;sy<=MAX_SECTION;sy++) if(this.dirtyEdits.has(sectionKey(cx,sy,cz))) return true;
    return false;
  }
  stream(x: number, z: number, radius: number, yaw = 0) {
    const cx = chunkCoord(x),
      cz = chunkCoord(z);
    let requests = 0;
    const positions: [number, number, number][] = [];
    for (let dz = -radius; dz <= radius; dz++)
      for (let dx = -radius; dx <= radius; dx++)
        if (dx * dx + dz * dz <= (radius + 0.5) ** 2)
          positions.push([cx + dx, cz + dz, dx * dx + dz * dz + 0.7*(dx*Math.sin(yaw)+dz*Math.cos(yaw))]);
    positions.sort((a, b) => a[2] - b[2]);
    for (const [a, b] of positions) {
      if (this.evictionBlocked > 64 || this.pending.size >= 8 || requests >= 4) break;
      const k = chunkKey(a, b);
      if (!this.chunks.has(k) && !this.pending.has(k)) {
        this.ensure(a, b);
        requests++;
      }
    }
    const removed: string[] = [];
    this.evictionBlocked = 0;
    for (const key of this.pending) {
      const [a,b]=key.split(",").map(Number);
      if(Math.abs(a-cx)>radius+2 || Math.abs(b-cz)>radius+2) { this.pending.delete(key); this.tickets.delete(key); }
    }
    for (const [k, c] of this.chunks)
      if (
        Math.abs(c.cx - cx) > radius + 2 ||
        Math.abs(c.cz - cz) > radius + 2
      ) {
        // Unsaved edits are an engine-level durability invariant, not a UI
        // callback convention. Always pin the column until its captured
        // sequence commits; the callback only requests an earlier save.
        if (this.hasDirtyColumn(c.cx,c.cz)) { this.evictionBlocked++; continue; }
        this.navRevision++;
        this.chunks.delete(k);
        for(let sy=MIN_SECTION;sy<=MAX_SECTION;sy++) this.dirty.delete(sectionKey(c.cx,sy,c.cz));
        this.markDirty(c.cx,c.cz);
        removed.push(k);
      }
    if(this.evictionBlocked) this.onEvictionPending?.();
    return removed;
  }
  dispose() {
    this.epoch++;
    this.worker?.terminate();
    this.worker = undefined;
    this.chunks.clear();
    this.pending.clear();
    this.tickets.clear();
    this.dirty.clear();
    this.dirtyEdits.clear();
    this.editChunks.clear();
    this.edits.clear();
    this.onEvictionPending = undefined;
    this.onGeneration = undefined;
    this.onChange = undefined;
  }
}
