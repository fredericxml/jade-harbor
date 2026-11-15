import {expect,it,vi} from "vitest";
import {AdaptiveResolution,adaptivePixelRatio,resolutionScale} from "../src/render/adaptive-resolution";
import {performanceCapabilities} from "../src/render/capabilities";
import {FramePacer,frameRateLimit} from "../src/render/frame-pacer";
import {Metrics} from "../src/core/metrics";
function feed(c:AdaptiveResolution,start:number,duration:number,gap:number,cpu=4){let now=start;for(;now<start+duration;now+=gap)c.observe(now,gap,cpu);return now;}
it("defaults off and ignores frame pressure until explicitly enabled",()=>{const c=new AdaptiveResolution();feed(c,0,120000,100);expect(c.scale).toBe(1);expect(c.sampleCount).toBe(0);expect(c.state).toBe("off");});
it("waits for warmup and sustained windows, then changes gradually within fixed bounds",()=>{const c=new AdaptiveResolution();c.configure(true,0);let t=feed(c,0,12000,100);expect(c.scale).toBe(1);t=feed(c,t,1900,100);expect(c.scale).toBe(1);t=feed(c,t,5000,100);expect(c.scale).toBe(.95);feed(c,t,180000,100);expect(c.scale).toBe(.7);expect(c.sampleCount).toBeLessThanOrEqual(31);});
it.each([90,120,144])("retains a full time window at %s Hz instead of starving evaluation",hz=>{const c=new AdaptiveResolution();c.configure(true,0);feed(c,0,15000,1000/hz);expect(c.scale).toBe(1);expect(c.sampleCount).toBeGreaterThan(120);expect(c.sampleCount).toBeLessThanOrEqual(Math.ceil(hz*3)+2);});
it.each([90,120,144])("recovers after sustained pressure on a %s Hz display",hz=>{const c=new AdaptiveResolution();c.configure(true,0);let t=feed(c,0,19000,25);expect(c.scale).toBe(.95);t=feed(c,t,45000,1000/hz);expect(c.scale).toBeGreaterThan(.95);expect(c.sampleCount).toBeLessThanOrEqual(Math.ceil(hz*3)+2);});
it("does not react to one long frame or neutral frame-time variance",()=>{const c=new AdaptiveResolution();c.configure(true,0);let t=feed(c,0,15000,1000/60);c.observe(t,300,4);t+=300;feed(c,t,20000,1000/60);expect(c.scale).toBe(1);});
it("recovers more slowly and in smaller steps than reductions",()=>{const c=new AdaptiveResolution();c.configure(true,0);let t=feed(c,0,19000,100);expect(c.scale).toBe(.95);t=feed(c,t,18000,1000/60);expect(c.scale).toBe(.95);feed(c,t,7000,1000/60);expect(c.scale).toBe(.975);});
it("holds scale while suspended, clears old samples, and warms up again on return",()=>{const c=new AdaptiveResolution();c.configure(true,0);feed(c,0,19000,100);c.suspend();expect(c.scale).toBe(.95);expect(c.sampleCount).toBe(0);expect(c.state).toBe("warming");feed(c,100000,10000,100);expect(c.scale).toBe(.95);});
it("uses the selected frame budget and resets to full scale when turned off",()=>{const c=new AdaptiveResolution();c.configure(true,30);feed(c,0,60000,1000/30);expect(c.scale).toBe(1);c.configure(true,60);feed(c,70000,19000,1000/30);expect(c.scale).toBeLessThan(1);c.configure(false,60);expect(c.scale).toBe(1);expect(c.state).toBe("off");});
it("rejects invalid samples and treats clock reversal or a discontinuity as suspension",()=>{const c=new AdaptiveResolution();c.configure(true,0);for(const bad of[NaN,Infinity,-Infinity]){c.observe(bad,20,5);c.observe(20,bad,5);c.observe(20,20,bad);}expect(c.sampleCount).toBe(0);feed(c,0,15000,20);c.observe(16000,5000,1);expect(c.sampleCount).toBe(0);c.observe(20000,20,1);c.observe(19000,20,1);expect(c.sampleCount).toBe(0);expect(c.scale).toBe(1);});
it("cannot mistake low CPU cost for GPU execution time or recover under CPU pressure",()=>{const c=new AdaptiveResolution();c.configure(true,0);let t=feed(c,0,19000,100);t=feed(c,t,60000,1000/60,20);expect(c.scale).toBe(.95);});
it.each([.25,.5,.7,.88,1,1.6])("keeps base DPR %s finite, bounded and never supersampled",base=>{for(const scale of[-10,.7,.8,1,100,NaN]){const ratio=adaptivePixelRatio(base,scale,1920,1080);expect(ratio).toBeGreaterThan(0);expect(ratio).toBeLessThanOrEqual(base);expect(ratio).toBeGreaterThanOrEqual(Math.min(base,.7));}expect(adaptivePixelRatio(base,1,1920,1080)).toBe(base);});
it("respects a supported renderbuffer limit without changing layout dimensions",()=>{expect(adaptivePixelRatio(1.6,1,8192,2048,8192)).toBe(1);expect(adaptivePixelRatio(1.6,.7,2000,1000,null)).toBeCloseTo(1.12);expect(resolutionScale(".7")).toBe(1);});
it("reads supported optional capability hints once, tolerates restriction, and freezes only numeric data",()=>{
 const gl={MAX_TEXTURE_SIZE:1,MAX_RENDERBUFFER_SIZE:2,MAX_VERTEX_ATTRIBS:3,getParameter:vi.fn((n:number)=>[0,8192,4096,16][n]),getExtension:vi.fn(()=>({}))};
 const result=performanceCapabilities(gl as unknown as WebGL2RenderingContext,{hardwareConcurrency:8,deviceMemory:4});expect(result).toEqual({maxTextureSize:8192,maxRenderbufferSize:4096,maxVertexAttributes:16,timerQuery:true,logicalCores:8,memoryGiBHint:4});expect(Object.isFrozen(result)).toBe(true);expect(gl.getParameter).toHaveBeenCalledTimes(3);expect(gl.getExtension).toHaveBeenCalledTimes(1);
 gl.getParameter.mockImplementation(()=>{throw Error("restricted");});gl.getExtension.mockImplementation(()=>{throw Error("restricted");});expect(performanceCapabilities(gl as unknown as WebGL2RenderingContext,{hardwareConcurrency:NaN,deviceMemory:-1})).toEqual({maxTextureSize:null,maxRenderbufferSize:null,maxVertexAttributes:null,timerQuery:false,logicalCores:null,memoryGiBHint:null});
});
it.each([30,40,60] as const)("caps actual presentation at %s on a144Hz clock without creating callbacks",limit=>{const c=new FramePacer();let draws=0;for(let frame=0;frame<1440;frame++)if(c.ready(frame*1000/144,"playing",limit))draws++;expect(draws).toBeGreaterThanOrEqual(limit*10-1);expect(draws).toBeLessThanOrEqual(limit*10+1);expect(frameRateLimit(String(limit))).toBe(0);});
it("keeps exactly240 rolling metric samples, computes tails, and labels reciprocal FPS only for frames",()=>{const m=new Metrics();for(let i=1;i<=300;i++)m.add("frame",i);m.add("frame",NaN);const s=m.summary("frame");expect(s).toMatchObject({count:240,p50:181,p95:289,p99:298,max:300,mean:180.5,over50Ms:240});expect(s.onePercentLow).toBeCloseTo(1000/299);m.add("renderSubmit",3);expect(m.summary("renderSubmit").onePercentLow).toBeNull();expect(m.summary("missing").mean).toBe(0);});


it("classifies CPU update pressure without degrading render resolution",()=>{
 const c=new AdaptiveResolution();c.configure(true,60);feed(c,0,19000,100,20);expect(c.scale).toBe(1);expect(c.bottleneck).toBe("cpu");expect(c.decision).toContain("CPU update");
});
it("uses actual GPU timer samples to identify GPU pressure and lower resolution",()=>{
 const c=new AdaptiveResolution();c.configure(true,60);let now=0;
 for(;now<19000;now+=100)c.observe(now,40,5,1,28,60);
 expect(c.scale).toBeLessThan(1);expect(c.bottleneck).toBe("gpu");expect(c.decision).toContain("GPU");
});
it("does not treat CPU render submission time as GPU execution time",()=>{
 const c=new AdaptiveResolution();c.configure(true,60);let now=0;
 for(;now<19000;now+=100)c.observe(now,40,14,12,null,60);
 expect(c.scale).toBe(1);expect(c.bottleneck).toBe("render-cpu");expect(c.decision).toContain("resolution unchanged");
});
it("uses the effective Auto frame target when evaluating frame budgets",()=>{
 const c=new AdaptiveResolution();c.configure(true,"auto");let now=0;
 for(;now<19000;now+=100)c.observe(now,23,5,1,null,45);
 expect(c.scale).toBe(1); // 23 ms is within the 45 FPS target budget.
});

it("does not reduce resolution when measured GPU time is low and CPU work is also low",()=>{
 const c=new AdaptiveResolution();c.configure(true,60);let now=0;
 for(;now<19000;now+=100)c.observe(now,40,5,1,2,60);
 expect(c.scale).toBe(1);expect(c.bottleneck).toBe("unknown");
});
it("classifies simultaneous render-submission CPU and GPU pressure as mixed",()=>{
 const c=new AdaptiveResolution();c.configure(true,60);let now=0;
 for(;now<19000;now+=100)c.observe(now,40,14,9,28,60);
 expect(c.scale).toBeLessThan(1);expect(c.bottleneck).toBe("mixed");
});
