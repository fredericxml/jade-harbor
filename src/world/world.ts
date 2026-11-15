import {
  MIN_Y, MAX_Y, MIN_SECTION, MAX_SECTION, sectionKey,
  index,
  chunkCoord,
  localCoord,
  chunkKey,
  blockKey,
} from "../core/coords";
import { BlockColumn, SectionData } from "./sections";
import { createGenerator, clearGeneratorCache, type Generator } from "./generator";
import { B } from "./blocks";
import { urbanAt } from "./metropolis/plan";
import { landmarkAt } from "./landmarks/builders";
import type { GenerationRequest } from "./generation-protocol";
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
  // Append-only until the renderer acknowledges the current backlog. The
  // renderer clears this journal only after admitting every queued key.
  dirtyAddQueue: string[] = [];
  dirtyAddQueueSet = new Set<string>();
  // Per-section invalidation lets chunk topology changes restart only jobs
  // whose own section or boundary neighborhood was affected.
  sectionDirtyRevision = new Map<string, number>();
  pending = new Set<string>();
  dirtyEdits = new Map<string, number>();
  private editSequence = 0;
  private editChunks = new Map<string, Map<string, number>>();
  private worker?: Worker;
  private workerMode = false;
  private workerQueue: GenerationRequest[] = [];
  private workerBusy?: GenerationRequest;
  private workerBusySince = 0;
  private workerPreemptions = 0;
  private workerQueueTimes = new Map<number,number>();
  private workerQueueHighWater = 0;
  private pendingHighWater = 0;
  private workerQueuePruned = 0;
  private workerQueueWaitTotalMs = 0;
  private workerQueueWaitMaxMs = 0;
  private workerQueueWaitSamples = 0;
  private streamFrames = 0;
  private streamRequests = 0;
  private streamEvictions = 0;
  private workerFailures = 0;
  private workerRetryAt = 0;
  private workerRetryDelay = 250;
  // Reused streaming scratch storage avoids per-frame Set/array churn.
  private readonly streamFeature = new Set<string>();
  private readonly streamCandidates: Array<{a:number;b:number;distance:number;key:string}> = [];
  private readonly streamRemoved: string[] = [];
  private generator?: Generator;
  private disposed = false;
  inspectTerrain(x: number, z: number) { return this.generator?.inspect?.(x, z); }
  get cityPlan() { return this.generator?.city; }
  get macroPlan() { return this.generator?.plan; }
  get metropolisPlan() { return this.generator && "metropolis" in this.generator ? this.generator.metropolis : undefined; }
  inspectDistrict(x:number,z:number) { const plan=this.metropolisPlan;return plan?urbanAt(plan,x,z):undefined; }
  get landmarkPlan() { return this.generator && "realization" in this.generator ? this.generator.realization : undefined; }
  get densityPlan() { return this.generator && "density" in this.generator ? this.generator.density : undefined; }
  get regionalPlan() { return this.generator && "regions" in this.generator ? this.generator.regions : undefined; }
  inspectLandmark(x:number,z:number) { const plan=this.landmarkPlan;return plan?landmarkAt(plan,x,z):undefined; }
  get planCount() { return this.generator?.plan ? 1 : 0; }
  private epoch = 0;
  private ticket = 0;
  private tickets = new Map<string, number>();
  evictionBlocked = 0;
  navRevision = 0;
  // Monotonic signal for newly queued mesh sections (including lighting commits).
  // The renderer uses it to append/rebuild candidates without polling the Set.
  dirtyAddRevision = 0;
  // Separate lighting invalidation channels let the renderer coalesce chunk
  // topology churn without delaying a newly edited light source.
  lightingEditRevision = 0;
  chunkTopologyRevision = 0;
  onEvictionPending?: () => void;
  onGeneration?: (ms:number) => void;
  onChange?: (x: number, y: number, z: number, v: number) => void;
  constructor(
    public seed: string,
    edits: Record<string, number> = {},
    worker = true,
  ) {
    this.generator = createGenerator(seed);
    this.edits = new Map(Object.entries(edits));
    for (const [key, value] of this.edits) this.indexEdit(key, value);
    this.workerMode = worker && typeof Worker !== "undefined";
    if (this.workerMode && !this.createWorker()) this.deferWorkerRetry();
  }
  private deferWorkerRetry() {
    this.workerRetryAt = performance.now() + this.workerRetryDelay;
    this.workerRetryDelay = Math.min(5000, this.workerRetryDelay * 2);
  }
  private createWorker() {
    if (this.disposed || !this.workerMode || this.worker) return !!this.worker;
    try {
      const worker = new Worker(
        new URL("./generation.worker.ts", import.meta.url),
        { type: "module" },
      );
      this.worker = worker;
      worker.onmessage = (event: MessageEvent<any>) => {
        const request = this.workerBusy;
        if (!request || this.worker !== worker) return;
        const result = event.data;
        const responseMatches = !!result &&
          result.cx === request.cx && result.cz === request.cz &&
          result.epoch === request.epoch &&
          result.ticket === request.ticket;
        if (!responseMatches) {
          // Keep workerBusy set so the failed active request is requeued.
          this.handleWorkerFailure(worker);
          return;
        }
        try {
          if (this.requestIsCurrent(request)) {
            this.onGeneration?.(Number.isFinite(result.elapsedMs) ? result.elapsedMs : 0);
            this.accept(result.cx, result.cz, BlockColumn.from(result.sections as SectionData[]));
          }
          // A matching but obsolete result is intentionally discarded. It
          // still releases the single in-flight slot for current-area work.
          this.workerBusy = undefined;
          this.workerBusySince = 0;
          this.workerFailures = 0;
          this.workerRetryAt = 0;
          this.workerRetryDelay = 250;
          this.dispatchWorker();
        } catch {
          // Keep workerBusy set so the failed active request is requeued.
          this.handleWorkerFailure(worker);
        }
      };
      worker.onerror = (event) => {
        event.preventDefault?.();
        this.handleWorkerFailure(worker);
      };
      worker.onmessageerror = () => this.handleWorkerFailure(worker);
      return true;
    } catch {
      // Keep requests queued. A worker-construction failure must not trigger
      // expensive synchronous terrain generation on the rendering thread.
      this.worker = undefined;
      return false;
    }
  }
  private requestIsCurrent(request: GenerationRequest) {
    const key = chunkKey(request.cx, request.cz);
    return !this.disposed && request.epoch === this.epoch && this.pending.has(key) &&
      this.tickets.get(key) === request.ticket;
  }
  private dispatchWorker() {
    if (this.disposed || !this.workerMode || this.workerBusy) return;
    if (!this.worker) {
      if (performance.now() < this.workerRetryAt) return;
      if (!this.createWorker()) { this.deferWorkerRetry(); return; }
    }
    const worker = this.worker;
    if (!worker) return;
    while (this.workerQueue.length) {
      const request = this.workerQueue.shift()!;
      const queuedAt=this.workerQueueTimes.get(request.ticket);
      this.workerQueueTimes.delete(request.ticket);
      if (!this.requestIsCurrent(request)) continue;
      if(queuedAt!==undefined){const wait=Math.max(0,performance.now()-queuedAt);this.workerQueueWaitTotalMs+=wait;this.workerQueueWaitMaxMs=Math.max(this.workerQueueWaitMaxMs,wait);this.workerQueueWaitSamples++;}
      this.workerBusy = request;
      this.workerBusySince = performance.now();
      try {
        worker.postMessage(request);
      } catch {
        this.workerBusy = undefined;
        this.workerBusySince = 0;
        this.workerQueue.unshift(request);
        this.workerQueueTimes.set(request.ticket,performance.now());
        this.workerQueueHighWater=Math.max(this.workerQueueHighWater,this.workerQueue.length);
        this.handleWorkerFailure(worker);
      }
      return;
    }
  }
  private handleWorkerFailure(worker: Worker) {
    if (this.disposed || this.worker !== worker) return;
    const active = this.workerBusy;
    this.workerBusy = undefined;
    this.workerBusySince = 0;
    worker.onmessage = null;
    worker.onerror = null;
    worker.onmessageerror = null;
    worker.terminate();
    this.worker = undefined;
    if (active && this.requestIsCurrent(active) &&
      !this.workerQueue.some(request => request.ticket === active.ticket)){
      this.workerQueue.unshift(active);
      if(!this.workerQueueTimes.has(active.ticket))this.workerQueueTimes.set(active.ticket,performance.now());
      this.workerQueueHighWater=Math.max(this.workerQueueHighWater,this.workerQueue.length);
    }
    this.workerFailures++;
    // Preserve the fast one-time restart, then use bounded exponential retry.
    // Streaming keeps pumping the queue, so a second failure cannot strand all
    // pending chunks until the world is reopened. Never generate synchronously.
    if (this.workerFailures < 2) {
      if (this.createWorker()) this.dispatchWorker();
      else this.deferWorkerRetry();
    } else this.deferWorkerRetry();
  }
  /**
   * A worker runs one synchronous generation request at a time, so a request
   * for a column that has left the streaming window can temporarily block all
   * current-area work. Let ordinary jobs finish; only preempt an obsolete job
   * after a grace period and when a valid replacement is waiting.
   */
  private preemptStaleWorkerRequest(now = performance.now()) {
    const active = this.workerBusy, worker = this.worker;
    if (!active || !worker || this.requestIsCurrent(active) || now - this.workerBusySince < 120) return false;
    let replacementWaiting = false;
    for (const request of this.workerQueue) {
      if (this.requestIsCurrent(request)) { replacementWaiting = true; break; }
    }
    if (!replacementWaiting) return false;
    worker.onmessage = null;
    worker.onerror = null;
    worker.onmessageerror = null;
    worker.terminate();
    this.worker = undefined;
    this.workerBusy = undefined;
    this.workerBusySince = 0;
    this.workerPreemptions++;
    if (!this.createWorker()) {
      this.deferWorkerRetry();
      return true;
    }
    this.dispatchWorker();
    return true;
  }
  get streamingDiagnostics() {
    const now=performance.now();let oldestQueuedAt=now;
    for(const request of this.workerQueue){
      const queuedAt=this.workerQueueTimes.get(request.ticket)??now;
      if(queuedAt<oldestQueuedAt)oldestQueuedAt=queuedAt;
    }
    return {
      workerBusy:!!this.workerBusy,workerQueued:this.workerQueue.length,
      workerPreemptions: this.workerPreemptions, pendingChunks: this.pending.size,
      pendingHighWater:this.pendingHighWater,workerQueueHighWater:this.workerQueueHighWater,
      workerQueuePruned:this.workerQueuePruned,workerQueueWaitSamples:this.workerQueueWaitSamples,
      workerQueueWaitAverageMs:this.workerQueueWaitSamples?this.workerQueueWaitTotalMs/this.workerQueueWaitSamples:0,
      workerQueueWaitMaxMs:this.workerQueueWaitMaxMs,
      workerBusyAgeMs:this.workerBusy?Math.max(0,now-this.workerBusySince):0,
      oldestQueuedAgeMs:this.workerQueue.length?Math.max(0,now-oldestQueuedAt):0,
      streamFrames:this.streamFrames,streamRequests:this.streamRequests,streamEvictions:this.streamEvictions,
    };
  }
  private cancelQueuedRequest(key: string) {
    let write=0;
    for(let read=0;read<this.workerQueue.length;read++){
      const request=this.workerQueue[read];
      if(chunkKey(request.cx,request.cz)===key){this.workerQueueTimes.delete(request.ticket);this.workerQueuePruned++;continue;}
      this.workerQueue[write++]=request;
    }
    this.workerQueue.length=write;
  }
  private pruneWorkerQueue() {
    let write=0;
    for(let read=0;read<this.workerQueue.length;read++){
      const request=this.workerQueue[read];
      if(!this.requestIsCurrent(request)){this.workerQueueTimes.delete(request.ticket);this.workerQueuePruned++;continue;}
      this.workerQueue[write++]=request;
    }
    this.workerQueue.length=write;
  }
  accept(cx: number, cz: number, blocks: BlockColumn) {
    if (this.disposed) return;
    const key = chunkKey(cx, cz);
    if (!this.pending.has(key) && this.chunks.has(key)) return;
    for(let sy=MIN_SECTION;sy<=MAX_SECTION;sy++) for (const [k, v] of this.editChunks.get(sectionKey(cx,sy,cz)) ?? []) {
      const [x, y, z] = k.split(",").map(Number);
      blocks.set(localCoord(x), y, localCoord(z), v);
    }
    this.navRevision++;
    this.chunkTopologyRevision++;
    this.chunks.set(key, { cx, cz, blocks, revision: 0 });
    this.pending.delete(key);
    this.tickets.delete(key);
    this.markDirty(cx, cz);
  }
  ensure(cx: number, cz: number, sync = false) {
    if (this.disposed) return;
    if (!Number.isSafeInteger(cx) || !Number.isSafeInteger(cz) || Math.abs(cx) > 625000 || Math.abs(cz) > 625000) throw new Error("Invalid chunk coordinate.");
    const key = chunkKey(cx, cz);
    if (this.chunks.has(key)) return;
    if (this.pending.has(key) && !sync) { this.dispatchWorker(); return; }
    if (sync && this.pending.has(key)) {
      this.cancelQueuedRequest(key);
      this.tickets.delete(key);
    }
    this.pending.add(key);
    if (this.workerMode && !sync) {
      const request: GenerationRequest = {
        cx, cz, seed: this.seed,
        epoch: this.epoch, ticket: ++this.ticket,
      };
      this.tickets.set(key, request.ticket);
      this.workerQueue.push(request);
      this.workerQueueTimes.set(request.ticket,performance.now());
      this.workerQueueHighWater=Math.max(this.workerQueueHighWater,this.workerQueue.length);
      this.pendingHighWater=Math.max(this.pendingHighWater,this.pending.size);
      this.dispatchWorker();
    } else this.accept(cx, cz, this.generator!.generate(cx, cz));
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
    this.lightingEditRevision++;
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
    if(sy<MIN_SECTION||sy>MAX_SECTION)return;
    const key=sectionKey(cx,sy,cz),size=this.dirty.size;
    this.sectionDirtyRevision.set(key,(this.sectionDirtyRevision.get(key)??0)+1);
    this.dirty.add(key);
    if(this.dirty.size!==size){
      this.dirtyAddRevision++;
      if(!this.dirtyAddQueueSet.has(key)){this.dirtyAddQueueSet.add(key);this.dirtyAddQueue.push(key);}
    }
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
  /** Stream one frame. The returned eviction list is reusable scratch storage:
   * consume it before the next stream() call and do not retain it. */
  stream(x: number, z: number, radius: number, yaw = 0) {
    this.streamFrames++;
    const cx = chunkCoord(x), cz = chunkCoord(z);
    // Only up to four new columns can be requested per frame (and never more
    // than the eight-item worker backpressure cap). Keep those nearest missing
    // candidates in stable distance order instead of allocating and sorting
    // every position in the streaming circle on every rendered frame.
    const requestLimit=this.evictionBlocked>64?0:Math.min(4,Math.max(0,8-this.pending.size));
    const candidates=this.streamCandidates;candidates.length=0;
    const feature=this.streamFeature;feature.clear();
    const sin=Math.sin(yaw),cos=Math.cos(yaw),radiusSq=(radius+0.5)**2;
    const consider=(a:number,b:number,distance:number,key=chunkKey(a,b))=>{
      if(this.chunks.has(key)||this.pending.has(key)||requestLimit===0)return;
      let at=candidates.length;
      while(at>0&&candidates[at-1].distance>distance)at--;
      if(at>=requestLimit)return;
      if(candidates.length<requestLimit)candidates.push({a,b,distance,key});
      for(let i=candidates.length-1;i>at;i--){
        const previous=candidates[i-1],slot=candidates[i];
        slot.a=previous.a;slot.b=previous.b;slot.distance=previous.distance;slot.key=previous.key;
      }
      const slot=candidates[at];slot.a=a;slot.b=b;slot.distance=distance;slot.key=key;
    };
    for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
      const distanceSq=dx*dx+dz*dz;
      if(distanceSq>radiusSq)continue;
      const a=cx+dx,b=cz+dz,key=chunkKey(a,b);
      consider(a,b,distanceSq+0.7*(dx*sin+dz*cos),key);
    }
    // A nearby monument must not lose half its body at the circular streaming
    // edge. At most four ordinary columns complete the Panda and its plinth;
    // requests still use the existing worker/backpressure budgets. V3–v7 keep
    // their released residency policy, and leaving the area releases the pin.
    const panda=this.metropolisPlan?.panda;
    if(panda){
      const px=(panda.x1+panda.x2)/2,pz=(panda.z1+panda.z2)/2;
      if(Math.hypot(x-px,z-pz)<=64)for(let b=chunkCoord(pz-6);b<=chunkCoord(pz+7);b++)for(let a=chunkCoord(px-9);a<=chunkCoord(px+9);a++){
        const key=chunkKey(a,b);feature.add(key);
        const dx=a-cx,dz=b-cz;
        if(Math.abs(dx)>radius||Math.abs(dz)>radius||dx*dx+dz*dz>radiusSq)
          consider(a,b,dx*dx+dz*dz,key);
      }
    }
    let requests=0;
    for(const candidate of candidates){
      if(this.evictionBlocked>64||this.pending.size>=8||requests>=4)break;
      if(!this.chunks.has(candidate.key)&&!this.pending.has(candidate.key)){
        this.ensure(candidate.a,candidate.b);requests++;this.streamRequests++;
      }
    }
    const removed=this.streamRemoved;removed.length=0;
    this.evictionBlocked = 0;
    for (const key of this.pending) {
      const [a,b]=key.split(",").map(Number);
      if(!feature.has(key)&&(Math.abs(a-cx)>radius+2 || Math.abs(b-cz)>radius+2)) {
        this.pending.delete(key);
        this.tickets.delete(key);
        this.cancelQueuedRequest(key);
      }
    }
    this.pruneWorkerQueue();
    this.preemptStaleWorkerRequest();
    // Pump already-pending work even when no new chunk can be enqueued. This
    // lets the normal frame stream recover after a worker outage at the cap.
    this.dispatchWorker();
    for (const [k, c] of this.chunks)
      if (!feature.has(k) && (
        Math.abs(c.cx - cx) > radius + 2 ||
        Math.abs(c.cz - cz) > radius + 2
      )) {
        // Unsaved edits are an engine-level durability invariant, not a UI
        // callback convention. Always pin the column until its captured
        // sequence commits; the callback only requests an earlier save.
        if (this.hasDirtyColumn(c.cx,c.cz)) { this.evictionBlocked++; continue; }
        this.navRevision++;
        this.chunkTopologyRevision++;
        this.chunks.delete(k);
        for(let sy=MIN_SECTION;sy<=MAX_SECTION;sy++){
          const section=sectionKey(c.cx,sy,c.cz);
          this.dirty.delete(section);this.sectionDirtyRevision.delete(section);
        }
        this.markDirty(c.cx,c.cz);
        removed.push(k);this.streamEvictions++;
      }
    if(this.evictionBlocked) this.onEvictionPending?.();
    return removed;
  }
  dispose() {
    if(this.disposed)return;
    this.disposed = true;
    this.generator = undefined;
    clearGeneratorCache(this.seed);
    this.epoch++;
    if(this.worker){this.worker.onmessage=null;this.worker.onerror=null;this.worker.terminate();}
    this.worker = undefined;
    this.workerBusy = undefined;
    this.workerQueue.length = 0;
    this.workerQueueTimes.clear();
    this.workerRetryAt = 0;
    this.workerMode = false;
    this.chunks.clear();
    this.pending.clear();
    this.tickets.clear();
    this.dirty.clear();this.dirtyAddQueue.length=0;this.dirtyAddQueueSet.clear();this.sectionDirtyRevision.clear();
    this.dirtyEdits.clear();
    this.editChunks.clear();
    this.edits.clear();
    this.streamFeature.clear();this.streamCandidates.length=0;this.streamRemoved.length=0;
    this.onEvictionPending = undefined;
    this.onGeneration = undefined;
    this.onChange = undefined;
  }
}
