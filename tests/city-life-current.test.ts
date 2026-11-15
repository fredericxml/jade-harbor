import { expect,it } from "vitest";
import { scheduleAt, scheduleOffset } from "../src/game/city-life/schedules";
import { World } from "../src/world/world";
import { Entities } from "../src/game/entities";

const hour=(h:number)=>((h-6)/24+1)%1;
it("cycles all six daily phases with distinct per-resident offsets",()=>{
  const phases=[7,9,12.5,15,18,23].map(h=>scheduleAt("sample","merchant","market",hour(h)).phase);
  expect(new Set(phases).size).toBe(6);
  expect(scheduleOffset("same")).toBe(scheduleOffset("same"));
  expect(new Set(Array.from({length:36},(_,i)=>scheduleOffset(`person${i}`))).size).toBeGreaterThan(25);
});
it("preserves profession-specific schedule decisions",()=>{
  expect(scheduleAt("guard","guard","imperial",hour(23)).activity).toBe("guarding");
  expect(scheduleAt("dock","dock_worker","harbor",hour(6)).destination).toBe("work");
  expect(scheduleAt("tea","chef","nightlife",hour(20)).destination).toBe("public");
  expect(scheduleAt("shop","merchant","market",hour(23)).destination).toBe("home");
});
it("simulates active residents without duplicating identities",()=>{
  const world=new World("jade-harbor",{},false);
  const entities=new Entities(world);
  expect(entities.list.filter(v=>v.kind==="villager").length).toBeGreaterThan(1000);
  expect(new Set(entities.list.map(v=>v.id)).size).toBe(entities.list.length);
  entities.dispose();world.dispose();
},30000);
