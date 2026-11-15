import type { World } from "../world/world";
import { MIN_SECTION, MAX_SECTION } from "../core/coords";

export type MeshCoverageChange = {
  revision: number;
  key: string;
  present: boolean;
  reset?: boolean;
};

type Coordinate = { cx:number; sy:number; cz:number; column:string };

/**
 * Incrementally maintains the distant-world coverage bitmap from renderer mesh
 * membership changes. A full Set reconciliation is only used on first sync or
 * when the bounded renderer change journal has overflowed.
 */
export class MeshCoverageIndex {
  private readonly coordinates = new Map<string,Coordinate>();
  private readonly columnCounts = new Map<string,number>();
  private readonly marked = new Set<number>();
  private readonly scratch:Uint8Array;
  private writeTarget:Uint8Array;
  private cursor = -1;
  private lastNavRevision = -1;
  private originX:number;
  private originZ:number;

  constructor(private readonly world:Pick<World,"chunks">,
    private readonly coverage:Uint8Array,originX:number,originZ:number) {
    this.originX=originX;this.originZ=originZ;this.writeTarget=coverage;this.scratch=new Uint8Array(coverage.length);
  }

  setOrigin(originX:number,originZ:number) {
    if(this.originX===originX&&this.originZ===originZ)return false;
    this.originX=originX;this.originZ=originZ;const changed=this.clear();this.cursor=-1;this.lastNavRevision=-1;return changed;
  }

  private index(cx:number,sy:number,cz:number) {
    const x=cx-this.originX/16,z=cz-this.originZ/16;
    if(x<0||z<0||x>=128||z>=128||sy<MIN_SECTION||sy>MAX_SECTION)return -1;
    return x+(z+(sy-MIN_SECTION)*128)*128;
  }

  private mark(cx:number,sy:number,cz:number) {
    const i=this.index(cx,sy,cz);if(i<0)return false;
    if(this.writeTarget[i]===255)return false;
    this.writeTarget[i]=255;this.marked.add(i);return true;
  }

  private unmark(cx:number,sy:number,cz:number) {
    const i=this.index(cx,sy,cz);if(i<0)return false;
    if(this.writeTarget[i]===0)return false;
    this.writeTarget[i]=0;this.marked.delete(i);return true;
  }

  private clearColumn(cx:number,cz:number) {
    let changed=false;
    for(let sy=MIN_SECTION;sy<=MAX_SECTION;sy++)if(this.unmark(cx,sy,cz))changed=true;
    return changed;
  }

  private add(key:string) {
    if(this.coordinates.has(key))return false;
    const first=key.indexOf(","),second=key.indexOf(",",first+1);
    if(first<0||second<0)return false;
    const cx=Number(key.slice(0,first)),sy=Number(key.slice(first+1,second)),cz=Number(key.slice(second+1));
    const q={cx,sy,cz,column:`${cx},${cz}`};
    this.coordinates.set(key,q);
    const count=this.columnCounts.get(q.column)??0;
    this.columnCounts.set(q.column,count+1);
    let changed=this.mark(cx,sy,cz);
    if(count===0){
      const chunk=this.world.chunks.get(q.column);
      if(chunk)for(let section=MIN_SECTION;section<=MAX_SECTION;section++)
        if(!chunk.blocks.sections.has(section)&&this.mark(cx,section,cz))changed=true;
    }
    return changed;
  }

  private remove(key:string) {
    const q=this.coordinates.get(key);if(!q)return false;
    this.coordinates.delete(key);
    const count=(this.columnCounts.get(q.column)??1)-1;
    if(count<=0){this.columnCounts.delete(q.column);return this.clearColumn(q.cx,q.cz);}
    this.columnCounts.set(q.column,count);
    const chunk=this.world.chunks.get(q.column);
    // The full reconciliation also marks empty sections inside any column
    // that still has at least one detailed section. Preserve that rule when
    // a section is temporarily deferred or removed from the rendered set.
    if(chunk&&!chunk.blocks.sections.has(q.sy))return this.mark(q.cx,q.sy,q.cz);
    return this.unmark(q.cx,q.sy,q.cz);
  }

  clear() {
    const changed=this.marked.size>0;
    this.writeTarget=this.coverage;this.coverage.fill(0);this.scratch.fill(0);
    this.marked.clear();this.coordinates.clear();this.columnCounts.clear();
    return changed;
  }

  private rebuild(meshed:ReadonlySet<string>,revision:number,navRevision:number) {
    this.scratch.fill(0);this.marked.clear();this.coordinates.clear();this.columnCounts.clear();
    this.writeTarget=this.scratch;
    for(const key of meshed)this.add(key);
    this.writeTarget=this.coverage;
    let changed=false;
    for(let i=0;i<this.coverage.length;i++)if(this.coverage[i]!==this.scratch[i]){changed=true;break;}
    if(changed)this.coverage.set(this.scratch);
    this.cursor=revision;this.lastNavRevision=navRevision;
    return changed;
  }

  update(meshed:ReadonlySet<string>,changes:readonly MeshCoverageChange[],revision:number,changeBase:number,navRevision:number) {
    // Chunk load/eviction and block edits can change which sections are known
    // empty even when mesh membership is unchanged. Preserve the previous
    // full reconciliation on nav changes; mesh-only changes use the delta log.
    if(this.cursor<0||this.cursor<changeBase||navRevision!==this.lastNavRevision)return this.rebuild(meshed,revision,navRevision);
    if(revision<=this.cursor)return false;
    let changed=false;
    // The bounded journal contains historical events too. Binary-search the
    // first unseen revision so a one-section change does not rescan the whole
    // journal on every rendered frame.
    let low=0,high=changes.length;
    while(low<high){const mid=(low+high)>>>1;if(changes[mid].revision<=this.cursor)low=mid+1;else high=mid;}
    for(let i=low;i<changes.length;i++){
      const event=changes[i];if(event.revision>revision)break;
      if(event.reset){if(this.clear())changed=true;continue;}
      if(event.present){if(this.add(event.key))changed=true;}
      else if(this.remove(event.key))changed=true;
    }
    this.cursor=revision;this.lastNavRevision=navRevision;
    return changed;
  }

  get lastRevision(){return this.cursor;}
}
