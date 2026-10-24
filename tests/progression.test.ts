import { describe,it,expect } from "vitest";
import "fake-indexeddb/auto";
import { Inventory, RECIPES, cloneStack } from "../src/game/inventory";
import { Equipment } from "../src/game/equipment";
import { enchantHeld,repairHeld,StatusEffects,validEffects,validMetadata } from "../src/game/progression";
import { newBrewer,tickBrewer,brewingWater,INFUSIONS } from "../src/game/brewing";
import { freshWorld,writeSave,loadSave,validateSave } from "../src/persistence/saves";
import { World } from "../src/world/world";
import { Simulation } from "../src/game/simulation";
import { Entities } from "../src/game/entities";
import { B,block } from "../src/world/blocks";
import { item } from "../src/game/items";
describe("exact item operations",()=>{
  it("aggregates repeated costs and rejects invalid quantities atomically",()=>{
    const i=new Inventory();i.add(B.Planks,3);const before=structuredClone(i.slots);
    expect(i.transaction([[B.Planks,2],[B.Planks,2]],[104,4])).toBe(false);
    for(const n of [-1,0,.5,NaN,Infinity])expect(i.transaction([[B.Planks,n]],[104,4])).toBe(false);
    expect(i.transaction([[B.Planks,1]],[104,-1])).toBe(false);expect(i.slots).toEqual(before);
    i.add(B.Planks,1);expect(i.transaction([[B.Planks,2],[B.Planks,2]],[104,4])).toBe(true);
    expect(i.count(B.Planks)).toBe(0);expect(i.count(104)).toBe(4);
  });
  it("does not consume ingredients when output cannot fit",()=>{
    const i=new Inventory(Array.from({length:36},()=>({id:B.Planks,count:64})));
    const before=structuredClone(i.slots);expect(i.transaction([[B.Planks,1]],[160,1])).toBe(false);expect(i.slots).toEqual(before);
  });
  it("keeps enchantment metadata independent through copy, cursor, armor and pickup",()=>{
    const i=new Inventory();i.addStack({id:130,count:1,durability:100,enchants:{efficiency:2,unbreaking:1},wearCounter:1});
    const original=cloneStack(i.held);const copy=new Inventory(i.slots);copy.held!.enchants!.efficiency=3;expect(i.held).toEqual(original);
    i.click(0,true);expect(i.settleCursor()).toBe(true);expect(i.held).toEqual(original);
    const w=new World("metadata",{},false);w.ensure(0,0,true);w.ensure(0,1,true);const e=new Entities(w,{entities:[],drops:[]});
    e.drop(i.held!,{x:0.5,y:22,z:24.5});i.held!.enchants!.efficiency=1;
    expect(e.drops[0].stack.enchants!.efficiency).toBe(2);
    const bag=new Inventory();e.tick(.6,{x:.5,y:22,z:24.5},bag,.2,false,()=>{},()=>{});
    expect(bag.held?.enchants).toEqual(original!.enchants);
    const armor=new Equipment([{id:150,count:1,durability:160,enchants:{protection:1}},null,null,null]);
    const other=new Equipment(armor.slots);other.slots[0]!.enchants!.protection=2;expect(armor.slots[0]!.enchants!.protection).toBe(1);
  });
});
describe("inscriptions and repair",()=>{
  it("charges XP and jade once, enforces compatibility, caps and exclusions",()=>{
    const i=new Inventory();i.add(130);i.add(103,20);let xp=100;
    for(let n=0;n<3;n++){const r=enchantHeld(i,xp,"efficiency");expect(r.ok).toBe(true);xp=r.xp;}
    expect(xp).toBe(64);expect(i.count(103)).toBe(14);
    expect(enchantHeld(i,xp,"efficiency").ok).toBe(false);
    expect(enchantHeld(i,xp,"protection").ok).toBe(false);
    expect(enchantHeld(i,xp,"silk").ok).toBe(true);
    const before=structuredClone(i.slots);expect(enchantHeld(i,xp,"fortune").ok).toBe(false);expect(i.slots).toEqual(before);
  });
  it("rejects an unaffordable enchant without altering anything",()=>{
    const i=new Inventory();i.add(130);i.add(103,2);const before=structuredClone(i.slots);
    expect(enchantHeld(i,7,"unbreaking")).toEqual({ok:false,xp:7});expect(i.slots).toEqual(before);
  });
  it("applies durable use counters and preserves inscriptions during material repair",()=>{
    const i=new Inventory();i.addStack({id:130,count:1,durability:4,enchants:{unbreaking:2,efficiency:1}});i.add(102,1);
    i.wear();i.wear();expect(i.held!.durability).toBe(4);i.wear();expect(i.held!.durability).toBe(3);
    expect(repairHeld(i,10)).toEqual({ok:true,xp:8});expect(i.held!.durability).toBe(63);expect(i.held!.enchants!.efficiency).toBe(1);expect(i.count(102)).toBe(0);
    const before=structuredClone(i.slots);expect(repairHeld(i,10).ok).toBe(false);expect(i.slots).toEqual(before);
  });
  it("reduces real combat and fire damage with the corresponding armor inscription",()=>{
    const plain=()=>new Equipment([{id:150,count:1,durability:160},null,null,null]);
    const combat=plain(),fire=plain();combat.slots[0]!.enchants={protection:3};fire.slots[0]!.enchants={fire_protection:3};
    expect(combat.absorb(10)).toBeCloseTo(plain().absorb(10)*.91);
    expect(fire.absorb(10,true)).toBeCloseTo(plain().absorb(10,true)*.82);
    expect(fire.absorb(10)).toBeCloseTo(plain().absorb(10));
  });
  it("rejects unsupported, conflicting and out-of-range item metadata",()=>{
    for(const s of [
      {id:3,count:1,enchants:{efficiency:1}}, {id:130,count:1,enchants:{efficiency:4}},
      {id:130,count:1,enchants:{silk:1,fortune:1}}, {id:130,count:1,wearCounter:1},
      {id:130,count:1,enchants:{arbitrary:1}},
    ])expect(validMetadata(s as never)).toBe(false);
  });
});
describe("brewing and timed effects",()=>{
  it("requires flask, ingredient, bamboo and water; produces exact output after six active seconds",()=>{
    const b=newBrewer();b.slots=[{id:160,count:2},{id:109,count:2},{id:B.Bamboo,count:1},null];
    tickBrewer(b,3,false);expect(b.progress).toBe(0);expect(b.slots[2]!.count).toBe(1);
    for(let i=0;i<119;i++)tickBrewer(b,.05,true);expect(b.slots[3]).toBeNull();
    tickBrewer(b,.05,true);expect(b.slots[3]).toEqual({id:162,count:1});expect(b.slots[0]!.count).toBe(1);expect(b.slots[1]!.count).toBe(1);
    expect(b.slots[2]).toBeNull();expect(b.fuel).toBeCloseTo(6);
    for(let i=0;i<120;i++)tickBrewer(b,.05,true);expect(b.slots[3]!.count).toBe(2);expect(b.slots[0]).toBeNull();expect(b.slots[1]).toBeNull();
  });
  it("pauses without water, changes recipe without carrying work, and cannot overflow output",()=>{
    const b=newBrewer();b.slots=[{id:160,count:2},{id:109,count:1},{id:B.Bamboo,count:1},null];
    tickBrewer(b,3,true);tickBrewer(b,4,false);expect(b.progress).toBe(3);expect(b.fuel).toBe(9);
    b.slots[1]={id:103,count:1};tickBrewer(b,1,true);expect(b.progress).toBe(1);
    b.slots[3]={id:163,count:16};const before=structuredClone(b.slots);tickBrewer(b,6,true);expect(b.slots).toEqual(before);
  });
  it("connects crafted workstation recipes, real water blocks and simulation range",()=>{
    const i=new Inventory();for(const r of RECIPES.filter(r=>[66,67,68,160].includes(r.output[0]))) {
      for(const [id,n] of r.cost)i.add(id,n);expect(i.transaction(r.cost,r.output)).toBe(true);expect(item(r.output[0])).toBeTruthy();
    }
    for(const id of [66,67,68])expect(block(id).id).toBe(id);
    const w=new World("brew",{},false);w.ensure(0,0,true);w.set(3,90,3,B.Apothecary);w.set(5,89,3,B.Water);
    expect(brewingWater(w,3,90,3)).toBe(true);const sim=new Simulation(w);const b=sim.brewer("3,90,3");
    b.slots=[{id:160,count:1},{id:105,count:1},{id:B.Bamboo,count:1},null];
    sim.tick(2,{x:400,y:90,z:3});expect(b.progress).toBe(0);sim.tick(.05,{x:3,y:90,z:3});expect(b.progress).toBe(.05);
  });
  it("processes every advertised recipe to a registered infusion",()=>{
    for(const [ingredient,result] of Object.entries(INFUSIONS)) {
      const b=newBrewer();b.slots=[{id:160,count:1},{id:+ingredient,count:1},{id:B.Bamboo,count:1},null];
      for(let n=0;n<120;n++)tickBrewer(b,.05,true);
      expect(b.slots[3]).toEqual({id:result,count:1});expect(item(result)?.stack).toBe(16);
    }
  });
  it("refreshes instead of stacking, ticks regeneration/poison, expires and resumes pulse timing",()=>{
    const e=new StatusEffects();e.apply("speed");e.tick(4,10);e.apply("speed");expect(e.list).toHaveLength(1);expect(e.list[0].remaining).toBe(60);
    e.apply("regeneration");expect(e.tick(1.5,10)).toBe(10);const restored=new StatusEffects(e.list);expect(restored.tick(.5,10)).toBe(11);
    const poison=new StatusEffects();poison.apply("poison");expect(poison.tick(14,3)).toBe(1);poison.tick(1,1);expect(poison.has("poison")).toBe(false);
    expect(validEffects([{id:"speed",remaining:200,pulse:0}])).toBe(false);expect(validEffects([...e.list,...e.list])).toBe(false);
    restored.tick(90,20);expect(restored.list).toEqual([]);
  });
  it("saves a working kettle, enchanted items, effect clocks and survival meters atomically",async()=>{
    const d=freshWorld("apothecary","jade-harbor","survival"),i=new Inventory();i.add(130);i.add(103,4);enchantHeld(i,20,"efficiency");
    d.player.slots=i.slots;d.player.effects=[{id:"regeneration",remaining:20,pulse:1.5}];d.player.saturation=3;d.player.exhaustion=2.5;d.player.breath=4;
    const b=newBrewer();b.slots=[{id:160,count:1},{id:109,count:1},{id:B.Bamboo,count:1},null];tickBrewer(b,2,true);
    d.simulation={brewers:{"3,-20,5":b},entities:[],drops:[]};await writeSave(d);const r=await loadSave(d.id);
    expect(r.player).toEqual(d.player);const kettle=(r.simulation!.brewers as Record<string,typeof b>)["3,-20,5"];
    for(let n=0;n<80;n++)tickBrewer(kettle,.05,true);expect(kettle.slots[3]).toEqual({id:162,count:1});
    const bad=structuredClone(r);bad.player.slots[0]!.enchants={fortune:8};expect(()=>validateSave(bad)).toThrow("item stack");
    const invalid=structuredClone(r);(invalid.simulation!.brewers as Record<string,typeof b>)["3,-20,5"].progress=100;
    await expect(writeSave(invalid)).rejects.toThrow("simulation");expect((await loadSave(d.id)).player).toEqual(d.player);
  });
  it("expires poison without damage while invulnerable, but resumes damage after a mode change",()=>{
    const e=new StatusEffects();e.apply("poison");
    expect(e.tick(6,20,true)).toBe(20);expect(e.list[0].remaining).toBe(9);
    expect(e.tick(2,20,false)).toBe(19);
    expect(e.tick(7,20,true)).toBe(20);expect(e.has("poison")).toBe(false);
  });
});
