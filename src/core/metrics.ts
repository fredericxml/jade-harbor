/** Bounded rolling samples; elapsed frame time is not GPU execution time. */
export class Metrics {
  private samples = new Map<string, number[]>();
  add(name:string, value:number) {
    if(!Number.isFinite(value) || value < 0) return;
    const a=this.samples.get(name) ?? [];
    if(a.length === 240) a.shift();
    a.push(value); this.samples.set(name,a);
  }
  summary(name:string) {
    const a=[...(this.samples.get(name) ?? [])].sort((a,b)=>a-b);
    return { count:a.length, p50:a[Math.floor(a.length*.5)] ?? 0, p95:a[Math.min(a.length-1,Math.floor(a.length*.95))] ?? 0 };
  }
  snapshot() { return Object.fromEntries([...this.samples.keys()].map(n=>[n,this.summary(n)])); }
}
