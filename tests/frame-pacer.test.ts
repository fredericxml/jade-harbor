import {expect,it} from "vitest";
import {FramePacer,frameRateLimit,frameUrgent,hasFrameBackgroundWork} from "../src/render/frame-pacer";

it("keeps ordinary gameplay at the existing display cadence",()=>{
 const p=new FramePacer();for(let i=0;i<600;i++)expect(p.ready(i*1000/60,"playing")).toBe(true);
});
it.each([30,40,60]as const)("paces %s FPS without a callback loop or accumulated drift",limit=>{
 const p=new FramePacer();let frames=0;for(let i=0;i<600;i++)if(p.ready(i*1000/60,"playing",limit))frames++;
 expect(Math.abs(frames-limit*10)).toBeLessThanOrEqual(1);
});
it("limits settled paused scenery to two frames per second",()=>{
 const p=new FramePacer();let frames=0;for(let i=0;i<600;i++)if(p.ready(i*1000/60,"paused"))frames++;
 expect(frames).toBe(20);
});
it("keeps urgent loading and resize work responsive in a paused scene",()=>{
 const p=new FramePacer();expect(p.ready(0,"paused")).toBe(true);expect(p.ready(16,"paused")).toBe(false);
 expect(p.ready(32,"paused",0,true)).toBe(true);expect(p.ready(48,"paused")).toBe(false);expect(p.ready(533,"paused")).toBe(true);
});
it("does no hidden presentation work even for an urgent resize",()=>{
 const p=new FramePacer();for(let i=0;i<20;i++)expect(p.ready(i*1000,"hidden",0,true)).toBe(false);
});
it("restores immediately and marks the timing discontinuity",()=>{
 const p=new FramePacer();p.ready(0,"playing");p.ready(16,"hidden");expect(p.transitioned).toBe(true);
 expect(p.ready(50000,"paused")).toBe(true);expect(p.transitioned).toBe(true);
 expect(p.ready(50016,"paused")).toBe(false);expect(p.transitioned).toBe(false);
 expect(p.ready(50032,"playing",30)).toBe(true);expect(p.transitioned).toBe(true);
});
it("does not replay presentation work after a large scheduling gap",()=>{
 const p=new FramePacer();p.ready(0,"playing",30);expect(p.ready(10000,"playing",30)).toBe(true);
 expect(p.ready(10001,"playing",30)).toBe(false);expect(p.ready(10034,"playing",30)).toBe(true);
});
it("rejects nonfinite clocks and handles a restarted clock",()=>{
 const p=new FramePacer();for(const n of[NaN,Infinity,-Infinity])expect(p.ready(n,"playing")).toBe(false);
 p.ready(5000,"paused");expect(p.ready(0,"paused")).toBe(true);expect(p.transitioned).toBe(true);
});
it("resets without retaining a previous world's cadence",()=>{
 const p=new FramePacer();p.ready(800,"paused");p.reset();expect(p.ready(810,"playing")).toBe(true);expect(p.transitioned).toBe(true);
});
it.each([undefined,null,"30",-1,NaN,Infinity,1,120])("ignores an invalid saved frame limit %s",value=>expect(frameRateLimit(value)).toBe(0));
it("accepts only the explicit player frame limits",()=>{for(const n of[0,30,40,60])expect(frameRateLimit(n)).toBe(n);});


it("auto-paces high-refresh displays at an even divisor no higher than 60 FPS",()=>{
 const cases=[[60,60],[72,36],[75,37.5],[90,45],[120,60],[144,48],[165,55],[30,30]] as const;
 for(const [hz,target] of cases){
  const p=new FramePacer();let draws=0;
  for(let frame=0;frame<=hz*2;frame++)p.ready(frame*1000/hz,"playing","auto");
  expect(p.targetFps).toBe(target);
  const before=draws;
  for(let frame=hz*2+1;frame<=hz*6;frame++)if(p.ready(frame*1000/hz,"playing","auto"))draws++;
  expect(draws-before).toBeGreaterThanOrEqual(target*4-2);
  expect(draws-before).toBeLessThanOrEqual(target*4+2);
 }
});
it("keeps explicit display-rate and manual frame-limit preferences distinct from Auto",()=>{
 expect(frameRateLimit("auto")).toBe("auto");expect(frameRateLimit(0)).toBe(0);expect(frameRateLimit(30)).toBe(30);
 const p=new FramePacer();for(let i=0;i<300;i++)p.ready(i*1000/120,"playing",0);expect(p.targetFps).toBe(120);
});

it("does not let active gameplay chunk queues bypass the presentation cap",()=>{
 expect(frameUrgent(true,false,true)).toBe(false);
 expect(frameUrgent(true,true,true)).toBe(true);
 expect(frameUrgent(false,false,true)).toBe(true);
 expect(frameUrgent(true,false,false)).toBe(false);
});


it("does not treat hidden distant-world build work as pending background work",()=>{
 expect(hasFrameBackgroundWork(false,false,false,false,false)).toBe(false);
 expect(hasFrameBackgroundWork(false,false,false,true,false)).toBe(true);
 expect(hasFrameBackgroundWork(false,false,false,true,true)).toBe(false);
 expect(hasFrameBackgroundWork(true,false,false,false,false)).toBe(true);
});
