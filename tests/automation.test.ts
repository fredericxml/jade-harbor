import { beforeAll,beforeEach,afterEach,afterAll,describe,it,expect } from "vitest";
import "fake-indexeddb/auto";
import { World } from "../src/world/world";
import { BlockColumn } from "../src/world/sections";
import { B } from "../src/world/blocks";
import { packed,stateOf } from "../src/core/coords";
import { Simulation } from "../src/game/simulation";
import { useBucket } from "../src/game/buckets";
import { Inventory } from "../src/game/inventory";
import { Entities } from "../src/game/entities";
import { chestInventory } from "../src/game/storage";
import { freshWorld,writeSave,loadSave } from "../src/persistence/saves";
const p={x:15.5,y:1,z:.5};
const fixtureWorlds:World[]=[];let preparedMachineWorld:World|undefined;
function makeWorld(){const w=new World("machines",{},false);for(let x=-1;x<=2;x++){const c=new BlockColumn();for(let z=0;z<16;z++)for(let n=0;n<16;n++)c.set(n,0,z,B.Stone);w.chunks.set(`${x},0`,{cx:x,cz:0,blocks:c,revision:0});}fixtureWorlds.push(w);return w;}
function world(){const w=preparedMachineWorld??makeWorld();preparedMachineWorld=undefined;return w;}
beforeEach(()=>{preparedMachineWorld=makeWorld();},20000);
afterEach(()=>{preparedMachineWorld=undefined;for(const w of fixtureWorlds.splice(0))w.dispose();});
it("automates chest → hopper → kiln input/fuel → hopper → chest across a chunk boundary",()=>{
  const w=world(),s=new Simulation(w),a=s.automation;
  for(const [x,y,id,state] of [[15,4,B.Chest,0],[15,3,B.Hopper,0],[15,2,B.Furnace,0],[15,1,B.Hopper,2],[16,1,B.Chest,0],[14,2,B.Hopper,2],[14,3,B.Chest,0]])w.set(x,y,1,packed(id,state));
  chestInventory(w,"15,4,1",a.containers)[0]={id:B.Iron,count:3};chestInventory(w,"14,3,1",a.containers)[0]={id:101,count:1};
  s.indexChunks();for(let i=0;i<400;i++)s.tick(.05,p);
  expect(a.containers["16,1,1"].filter(Boolean)).toEqual([{id:102,count:3}]);
  expect(a.containers["15,4,1"].some(Boolean)).toBe(false);expect(a.containers["14,3,1"].some(Boolean)).toBe(false);
  expect(Object.values(a.hoppers).every(h=>h.slots.every(v=>!v))).toBe(true);expect(s.furnaces["15,2,1"].slots[0]).toBeNull();
});
it("keeps items in a powered or full hopper and resumes exactly when capacity is available",()=>{
  const w=world(),s=new Simulation(w),a=s.automation;w.set(15,1,1,packed(B.Hopper,2));w.set(16,1,1,B.Chest);w.set(15,1,2,packed(B.Switch,1));
  const h=a.hopper("15,1,1");h.slots[0]={id:130,count:1,durability:30,enchants:{efficiency:2}};s.indexChunks();
  for(let n=0;n<25;n++)s.tick(.05,p);expect(h.slots[0]?.id).toBe(130);
  w.set(15,1,2,B.Switch);a.containers["16,1,1"]=Array.from({length:27},()=>({id:3,count:64}));
  for(let n=0;n<25;n++)s.tick(.05,p);expect(h.slots[0]?.id).toBe(130);
  a.containers["16,1,1"][0]=null;for(let n=0;n<25;n++)s.tick(.05,p);
  expect(h.slots[0]).toBeNull();expect(a.containers["16,1,1"][0]).toMatchObject({enchants:{efficiency:2}});
});
describe("saved hopper transfer fixture",()=>{
  let w:World,w2:World;
  beforeAll(()=>{w=world();w2=world();},20000);
  afterAll(()=>{w.dispose();w2.dispose();});
it("never loads a chunk for transfer and reconciles the saved hopper when the destination returns",async()=>{
  const s=new Simulation(w);w.set(15,1,1,packed(B.Hopper,2));w.set(16,1,1,B.Chest);s.automation.hopper("15,1,1").slots[0]={id:103,count:4};
  w.chunks.delete("1,0");for(let i=0;i<30;i++)s.tick(.05,p);expect(w.chunks.has("1,0")).toBe(false);expect(s.automation.hoppers["15,1,1"].slots[0]?.count).toBe(4);
  const d=freshWorld("hopper","machines","survival");d.edits=Object.fromEntries(w.edits);d.simulation={...s.serialize(),containers:s.automation.containers};await writeSave(d);
  const loaded=await loadSave(d.id);for(const [k,v] of Object.entries(loaded.edits)){const [x,y,z]=k.split(",").map(Number);w2.set(x,y,z,v);}
  const resumed=new Simulation(w2,loaded.simulation);resumed.automation.containers=(loaded.simulation!.containers as typeof s.automation.containers);
  for(let i=0;i<45;i++)resumed.tick(.05,p);expect(resumed.automation.containers["16,1,1"][0]).toEqual({id:103,count:4});
});
});
it("collects a dropped stack once and preserves enchanted metadata",()=>{
  const w=world(),s=new Simulation(w),e=new Entities(w,{entities:[],drops:[]});w.set(4,1,4,B.Hopper);w.set(4,0,4,B.Chest);s.indexChunks();
  e.drop({id:130,count:1,durability:50,enchants:{unbreaking:1},wearCounter:1},{x:4.5,y:2.1,z:4.5});s.automation.drops=e.drops;
  for(let n=0;n<25;n++)s.tick(.05,p);
  expect(e.drops[0].stack.count).toBe(0);expect(s.automation.containers["4,0,4"][0]).toEqual({id:130,count:1,durability:50,enchants:{unbreaking:1},wearCounter:1});
});
it("runs a repeatable timer and a pressure-operated two-block door across chunk edges",()=>{
  const w=world(),s=new Simulation(w);w.set(14,1,2,packed(B.Timer,6));w.set(15,1,2,B.Wire);w.set(16,1,2,B.Lamp);s.indexChunks();
  const observed=new Set<number>();for(let i=0;i<100;i++){s.tick(.05,p);observed.add(stateOf(w.get(16,1,2)));}expect([...observed].sort()).toEqual([0,1]);
  w.set(14,1,2,B.Timer);for(let i=0;i<10;i++)s.tick(.05,p);expect(stateOf(w.get(16,1,2))).toBe(0);
  w.set(14,1,4,B.Plate);w.set(15,1,4,B.Wire);w.set(16,1,4,B.Door);w.set(16,2,4,packed(B.Door,8));s.indexChunks();
  s.circuits({x:14.5,y:1.002,z:4.5});expect(stateOf(w.get(16,1,4))&4).toBe(4);expect(stateOf(w.get(16,2,4))&4).toBe(4);
  s.circuits(p);expect(stateOf(w.get(16,1,4))&4).toBe(0);
  s.occupants=[{x:14.5,y:1.2,z:4.5}];s.circuits(p);expect(stateOf(w.get(16,1,4))&4).toBe(4);
});
it("restores circuit cycle state and pending fluid work instead of resetting on load",async()=>{
  const w=world(),s=new Simulation(w);w.set(14,1,2,packed(B.Timer,6));s.indexChunks();s.tick(.65,p);s.queue.add("32,3,1");s.updates(64);expect(s.queue.has("32,3,1")).toBe(false);
  s.queue.add("48,3,1");s.updates(64);expect(s.queue.has("48,3,1")).toBe(true);
  const d=freshWorld("clock","machines","survival");d.simulation=s.serialize();await writeSave(d);const r=await loadSave(d.id),s2=new Simulation(w,r.simulation);
  expect(s2.elapsed).toBe(.65);expect(s2.queue.has("48,3,1")).toBe(true);
});
it("collects only source fluid and places a bucket once without deleting an occupied block",()=>{
  const w=world(),i=new Inventory();i.add(168);w.set(2,1,2,B.Water);
  const hit={x:2,y:1,z:2,value:B.Water,normal:{x:0,y:1,z:0},distance:2};
  expect(useBucket(w,i,{...hit,value:packed(B.Water,1)},p)).toBe(false);expect(i.held!.id).toBe(168);
  expect(useBucket(w,i,hit,p)).toBe(true);expect(w.get(2,1,2)).toBe(0);expect(i.held!.id).toBe(169);
  const ground={...hit,y:0,value:B.Stone};expect(useBucket(w,i,ground,p)).toBe(true);expect(i.held!.id).toBe(168);expect(w.get(2,1,2)).toBe(B.Water);
  i.slots[0]={id:170,count:1};expect(useBucket(w,i,ground,p)).toBe(false);expect(i.held!.id).toBe(170);
});
it("commits a multi-stack drop atomically at the cap and merges compatible nearby stacks",()=>{
  const e=new Entities(world(),{entities:[],drops:[]});for(let n=0;n<255;n++)expect(e.drop({id:3,count:64},{x:n*3,y:2,z:8})).toBe(true);
  const before=structuredClone(e.drops);expect(e.dropMany([{id:130,count:1,durability:10},{id:103,count:2}],{x:1,y:2,z:1})).toBe(false);expect(e.drops).toEqual(before);
  expect(e.drop({id:103,count:2},{x:1,y:2,z:1})).toBe(true);expect(e.drop({id:103,count:4},{x:1,y:2,z:1})).toBe(true);expect(e.drops.at(-1)!.stack.count).toBe(6);
});
it("does not regenerate discovery loot in player-placed or replaced chests",()=>{
  const w=new World("jade-harbor",{},false);w.ensure(25,0,true);const c={};w.set(400,80,2,B.Chest);
  expect(chestInventory(w,"400,80,2",c).some(Boolean)).toBe(false);
  chestInventory(w,"400,80,2",c)[0]={id:103,count:2};expect(chestInventory(w,"400,80,2",c)[0]?.count).toBe(2);
});
