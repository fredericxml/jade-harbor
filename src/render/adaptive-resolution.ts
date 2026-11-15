import type { FrameRateLimit } from "./frame-pacer";
export const MIN_RESOLUTION_SCALE = .7;
export function resolutionScale(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(MIN_RESOLUTION_SCALE, Math.min(1, value)) : 1;
}
export function adaptivePixelRatio(base: number, scale: number, width: number, height: number, maxDimension?: number | null) {
  const wanted = Math.max(Math.min(base, .7), base * resolutionScale(scale));
  const supported = typeof maxDimension === "number" && Number.isFinite(maxDimension) && maxDimension > 0 ? maxDimension : Infinity;
  return Math.min(wanted, supported / Math.max(1, width), supported / Math.max(1, height));
}
export type AdaptiveBottleneck = "unknown" | "cpu" | "render-cpu" | "gpu" | "mixed" | "presentation";
type Sample = { at:number; gap:number; cpu:number; renderCpu:number; gpuMs:number | null };
const SAMPLE_WINDOW_MS = 3000;
const MIN_SAMPLE_SPAN_MS = 1500;
const EVALUATION_INTERVAL_MS = 2000;
const WARMUP_MS = 12000;
const MAX_SAMPLE_HEAD_BEFORE_COMPACT = 256;
const percentile=(values:number[],p:number)=>values.length?values[Math.min(values.length-1,Math.floor(values.length*p))]:0;

/** Opt-in presentation controller fed by the existing engine RAF. CPU update,
 * CPU render submission and optional asynchronous GPU timer results are kept
 * separate. CPU submission time is never mislabeled as GPU execution time. */
export class AdaptiveResolution {
  scale = 1;
  state: "off" | "warming" | "stable" | "limited" = "off";
  decision = "Disabled";
  bottleneck: AdaptiveBottleneck = "unknown";
  private enabled = false;
  private limit: FrameRateLimit = 0;
  private samples: Sample[] = [];
  private sampleHead = 0;
  private started = -1;
  private evaluated = -Infinity;
  private changed = -Infinity;
  private stableSince = -1;
  private pressure = 0;
  private last = -Infinity;
  private targetFpsSeen = -1;
  get sampleCount() {return this.samples.length - this.sampleHead;}
  configure(enabled:boolean, limit:FrameRateLimit) {
    if(enabled === this.enabled && limit === this.limit) return;
    this.enabled=enabled;this.limit=limit;this.suspend();
    if(!enabled){this.scale=1;this.decision="Disabled";this.bottleneck="unknown";}
  }
  suspend() {
    this.samples.length=0;this.sampleHead=0;this.started=-1;this.evaluated=-Infinity;this.last=-Infinity;
    this.stableSince=-1;this.pressure=0;this.bottleneck="unknown";this.targetFpsSeen=-1;
    this.state=this.enabled?"warming":"off";
    this.decision=this.enabled?"Waiting for active gameplay samples":"Disabled";
  }
  observe(now:number, gap:number, cpu:number, renderCpu=0, gpuMs:number|null=null, targetFps?:number) {
    if(!this.enabled)return this.scale;
    if(!Number.isFinite(now)||!Number.isFinite(gap)||!Number.isFinite(cpu)||!Number.isFinite(renderCpu)||gap<=0||cpu<0||renderCpu<0||
      (gpuMs!==null&&(!Number.isFinite(gpuMs)||gpuMs<0))||(targetFps!==undefined&&(!Number.isFinite(targetFps)||targetFps<=0)))return this.scale;
    if(now<this.last||gap>1000){this.suspend();return this.scale;}
    const selectedTarget=targetFps??(typeof this.limit==="number"&&this.limit>0?this.limit:60);
    if(this.targetFpsSeen>0&&Math.abs(selectedTarget-this.targetFpsSeen)>1){
      this.samples.length=0;this.sampleHead=0;this.started=now;this.evaluated=now;this.stableSince=-1;this.pressure=0;this.bottleneck="unknown";this.state="warming";
      this.decision="Frame target changed — collecting a new baseline";
    }
    this.targetFpsSeen=selectedTarget;
    this.last=now;
    if(this.started<0){this.started=now;this.evaluated=now;this.state="warming";this.decision="Collecting active-play performance samples";}
    this.samples.push({at:now,gap,cpu,renderCpu,gpuMs});
    // A time-based window works on 60–240 Hz displays; no fixed frame cap can
    // starve the minimum observation span on high-refresh panels.
    const cutoff=now-SAMPLE_WINDOW_MS;
    while(this.sampleHead<this.samples.length&&this.samples[this.sampleHead].at<cutoff)this.sampleHead++;
    if(this.sampleHead>MAX_SAMPLE_HEAD_BEFORE_COMPACT&&this.sampleHead*2>=this.samples.length){
      this.samples=this.samples.slice(this.sampleHead);this.sampleHead=0;
    }
    // Keep the hot RAF path allocation-light: only materialize a window view
    // when an evaluation is actually due, not once per rendered frame.
    const activeCount=this.samples.length-this.sampleHead;
    if(now-this.started<WARMUP_MS||now-this.evaluated<EVALUATION_INTERVAL_MS||activeCount<24||
      now-this.samples[this.sampleHead].at<MIN_SAMPLE_SPAN_MS){
      if(this.state==="warming"&&(this.decision==="Waiting for active gameplay samples"||this.decision==="Collecting active-play performance samples"))
        this.decision="Collecting active-play performance samples";
      return this.scale;
    }
    this.evaluated=now;
    const windowSamples=this.samples.slice(this.sampleHead);
    const gaps=windowSamples.map(s=>s.gap).sort((a,b)=>a-b),budget=1000/Math.max(15,Math.min(300,selectedTarget));
    const updateCpu=windowSamples.map(s=>Math.max(0,s.cpu-s.renderCpu)).sort((a,b)=>a-b);
    const renderCpuSamples=windowSamples.map(s=>s.renderCpu).sort((a,b)=>a-b);
    const gpuSamples=windowSamples.filter(s=>s.gpuMs!==null).map(s=>s.gpuMs!).sort((a,b)=>a-b);
    const p50=percentile(gaps,.5),p95=percentile(gaps,.95),updateCpu95=percentile(updateCpu,.95),renderCpu95=percentile(renderCpuSamples,.95);
    // At least six independent, non-disjoint GPU results are needed before
    // classifying GPU pressure. Otherwise the controller uses honest proxies.
    const gpu95=gpuSamples.length>=6?percentile(gpuSamples,.95):null;
    const cpuPressure=updateCpu95>budget*.7;
    const renderCpuPressure=renderCpu95>budget*.45;
    const gpuPressure=gpu95!==null&&gpu95>budget*.7;
    const framePressure=p50>budget*1.25&&p95>budget*1.4;
    if(framePressure){
      const next:AdaptiveBottleneck=(cpuPressure||renderCpuPressure)&&gpuPressure?"mixed":cpuPressure?"cpu":renderCpuPressure?"render-cpu":gpuPressure?"gpu":
        updateCpu95<budget*.55&&renderCpu95<budget*.4&&gpu95===null?"presentation":"unknown";
      if(next!==this.bottleneck)this.pressure=0;
      this.bottleneck=next;this.pressure++;this.stableSince=-1;this.state="limited";
      if(next==="cpu")this.decision="CPU update pressure — resolution unchanged";
      else if(next==="render-cpu")this.decision="CPU render-submission pressure — resolution unchanged";
      else if(next==="unknown")this.decision="Frame pressure detected — bottleneck uncertain; holding resolution";
      else if(this.pressure>=3){
        if(now-this.changed>=5000){
          if(this.scale<=MIN_RESOLUTION_SCALE){
            this.changed=now;this.pressure=0;this.decision="Render pressure persists — minimum resolution reached (70%)";
          }else{
            this.scale=Math.max(MIN_RESOLUTION_SCALE,Math.round((this.scale-.05)*1000)/1000);
            this.changed=now;this.pressure=0;
            this.decision=next==="gpu"?`Measured GPU pressure — reducing resolution to ${Math.round(this.scale*100)}%`:
              next==="mixed"?`Mixed CPU/GPU pressure — cautiously reducing resolution to ${Math.round(this.scale*100)}%`:
              `Render/presentation pressure — reducing resolution to ${Math.round(this.scale*100)}% (GPU timing unavailable or insufficient)`;
          }
        }else this.decision="Render pressure confirmed — waiting for the resolution adjustment cooldown";
      }else if(this.scale<1&&now-this.changed<5000)this.decision=next==="gpu"?`GPU pressure persists — holding ${Math.round(this.scale*100)}% during adjustment cooldown`:
        next==="mixed"?`Mixed CPU/GPU pressure persists — holding ${Math.round(this.scale*100)}% during adjustment cooldown`:
        `Render/presentation pressure persists — holding ${Math.round(this.scale*100)}% during adjustment cooldown`;
      else this.decision=next==="gpu"?"GPU pressure detected — confirming before reducing resolution":
        next==="mixed"?"Mixed CPU/GPU pressure detected — confirming before reducing resolution":
        "Render/presentation pressure likely — confirming before reducing resolution";
    }else if(p50<=budget*1.1&&p95<=budget*1.2&&updateCpu95<budget*.65&&renderCpu95<budget*.35&&(gpu95===null||gpu95<budget*.6)){
      this.pressure=0;this.state="stable";this.bottleneck="unknown";if(this.stableSince<0)this.stableSince=now;
      if(this.scale<1&&now-this.stableSince>=20000&&now-this.changed>=20000){
        this.scale=Math.min(1,Math.round((this.scale+.025)*1000)/1000);this.changed=now;this.stableSince=now;
        this.decision=this.scale===1?"Performance recovered — full resolution restored":`Performance stable — gradual recovery to ${Math.round(this.scale*100)}%`;
      }else if(this.scale<1)this.decision="Performance stable — waiting before gradual resolution recovery";
      else this.decision="Performance within target — holding full resolution";
    }else{
      this.pressure=0;this.stableSince=-1;this.state="stable";this.bottleneck="unknown";
      this.decision="Performance fluctuating — holding current resolution";
    }
    return this.scale;
  }
}
