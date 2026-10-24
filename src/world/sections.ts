import { MIN_Y, MAX_Y, MIN_SECTION, MAX_SECTION, chunkCoord, localCoord, index } from '../core/coords';
export type SectionData = { sy:number; uniform?:number; data?:Uint16Array };
/** Air sections are absent. Uniform sections use one value; edited/mixed sections use 16³ values. */
export class BlockSection {
  values:number | Uint16Array = 0;
  nonAir = 0;
  revision = 0;
  constructor(values:number | Uint16Array = 0) {
    this.values=values;
    this.nonAir=typeof values === 'number' ? (values ? 4096 : 0) : values.reduce((n,v)=>n+Number(v!==0),0);
  }
  get(i:number) { return typeof this.values === 'number' ? this.values : this.values[i]; }
  set(i:number,v:number) {
    const old=this.get(i); if(old===v) return false;
    if(typeof this.values === 'number') this.values=new Uint16Array(4096).fill(this.values);
    this.values[i]=v; this.nonAir+=Number(v!==0)-Number(old!==0); this.revision++;
    return true;
  }
  compact() {
    const values=this.values;
    if(values instanceof Uint16Array && values.every(v=>v===values[0])) this.values=values[0];
  }
  get byteLength() { return typeof this.values === 'number' ? 2 : this.values.byteLength; }
}
export class BlockColumn {
  sections=new Map<number,BlockSection>();
  get(x:number,y:number,z:number) {
    return this.sections.get(chunkCoord(y))?.get(index(x,localCoord(y),z)) ?? 0;
  }
  set(x:number,y:number,z:number,v:number) {
    if(y<MIN_Y || y>MAX_Y) return false;
    const sy=chunkCoord(y); let s=this.sections.get(sy);
    if(!s) { if(!v) return false; s=new BlockSection();this.sections.set(sy,s); }
    const changed=s.set(index(x,localCoord(y),z),v);
    if(s.nonAir===0) this.sections.delete(sy);
    return changed;
  }
  some(predicate:(v:number)=>boolean) {
    for(const s of this.sections.values()) {
      if(typeof s.values==='number') {if(predicate(s.values)) return true;}
      else if(s.values.some(predicate)) return true;
    }
    return this.sections.size<(MAX_SECTION-MIN_SECTION+1) && predicate(0);
  }
  compact() { for(const s of this.sections.values()) s.compact(); }
  get byteLength() { let n=0;for(const s of this.sections.values()) n+=s.byteLength;return n; }
  serialize():SectionData[] { return [...this.sections].map(([sy,s])=>typeof s.values==='number'?{sy,uniform:s.values}:{sy,data:s.values}); }
  static from(rows:SectionData[]) {
    const c=new BlockColumn(); for(const r of rows) c.sections.set(r.sy,new BlockSection(r.data ?? r.uniform ?? 0)); return c;
  }
}
