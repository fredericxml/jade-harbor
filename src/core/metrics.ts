/** Bounded rolling samples; elapsed frame time is not GPU execution time. */
const SAMPLE_LIMIT = 240;
type MetricWindow = {
  values: Float64Array;
  sorted: Float64Array;
  count: number;
  write: number;
};

export class Metrics {
  private samples = new Map<string, MetricWindow>();

  add(name:string, value:number) {
    if(!Number.isFinite(value) || value < 0) return;
    let window=this.samples.get(name);
    if(!window){
      window={values:new Float64Array(SAMPLE_LIMIT),sorted:new Float64Array(SAMPLE_LIMIT),count:0,write:0};
      this.samples.set(name,window);
    }
    window.values[window.write]=value;
    window.write=(window.write+1)%SAMPLE_LIMIT;
    if(window.count<SAMPLE_LIMIT)window.count++;
  }

  summary(name:string) {
    const window=this.samples.get(name),count=window?.count??0;
    if(!window||count===0)return {count:0,p50:0,p95:0,p99:0,mean:0,max:0,over50Ms:0,onePercentLow:null};
    const values=window.values,sorted=window.sorted,oldest=(window.write-count+SAMPLE_LIMIT)%SAMPLE_LIMIT;
    let total=0;
    for(let i=0;i<count;i++){
      const value=values[(oldest+i)%SAMPLE_LIMIT];
      sorted[i]=value;total+=value;
    }
    sorted.fill(Infinity,count);
    sorted.sort();
    const q=(p:number)=>sorted[Math.min(count-1,Math.floor(count*p))]??0;
    let over50Ms=0;
    for(let i=0;i<count;i++)if(sorted[i]>50)over50Ms++;
    // Preserve the previous definition: the slowest (largest-duration) 1%
    // of the sorted sample window is used for the displayed one-percent-low.
    const slowCount=Math.max(1,Math.ceil(count*.01));
    let slowTotal=0;
    for(let i=count-slowCount;i<count;i++)slowTotal+=sorted[i];
    const slowMean=slowTotal/slowCount;
    return {count,p50:q(.5),p95:q(.95),p99:q(.99),mean:total/count,max:sorted[count-1]??0,over50Ms,
      onePercentLow:name==="frame"&&slowMean>0?1000/slowMean:null};
  }

  snapshot() {
    return Object.fromEntries([...this.samples.keys()].map(name=>[name,this.summary(name)]));
  }
}
