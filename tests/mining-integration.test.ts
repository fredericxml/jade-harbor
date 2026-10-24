import { it,expect } from "vitest";
import { Game } from "../src/core/game";
import { World } from "../src/world/world";
import { BlockColumn } from "../src/world/sections";
import { Inventory } from "../src/game/inventory";
import { Entities } from "../src/game/entities";
import { Simulation } from "../src/game/simulation";
import { B } from "../src/world/blocks";
function fixture(id:number,tool=130) {
  const world=new World("mining",{},false);world.chunks.set("0,0",{cx:0,cz:0,blocks:new BlockColumn(),revision:0});world.set(2,-20,2,id);
  const g=Object.create(Game.prototype) as Game;
  Object.assign(g,{world,inventory:new Inventory(),mode:"survival",hit:{x:2,y:-20,z:2,value:id,normal:{x:0,y:0,z:1},distance:2},input:{left:true},mineProgress:0,mineKey:"",xp:0,containers:{},simulation:new Simulation(world),entities:new Entities(world,{entities:[],drops:[]}),effects:{burst:()=>{}},audio:{play:()=>{}},ui:{toast:()=>{}},achievements:new Set()});
  g.inventory.add(tool);return g;
}
function mine(g:Game){let ticks=0;while(g.world.get(2,-20,2)!==0 && ticks<500){g.mine(.05);ticks++;}return ticks;}
it("applies efficiency to actual correct-tool mining but not a mismatched tool",()=>{
  const normal=fixture(B.Stone),fast=fixture(B.Stone);fast.inventory.held!.enchants={efficiency:3};
  const ordinary=mine(normal),improved=mine(fast);expect(improved).toBeLessThan(ordinary);expect(fast.entities.drops[0].stack.id).toBe(B.Stone);
  const wrong=fixture(B.Stone,131),wrongEnchanted=fixture(B.Stone,131);wrongEnchanted.inventory.held!.enchants={efficiency:3};expect(mine(wrongEnchanted)).toBe(mine(wrong));
});
it("uses fortune or silk for real ore drops and prevents silk place/mine XP farming",()=>{
  const fortune=fixture(B.Jade,135);fortune.inventory.held!.enchants={fortune:2};mine(fortune);expect(fortune.entities.drops[0].stack).toEqual({id:103,count:3});expect(fortune.xp).toBe(1);
  const silk=fixture(B.Jade,135);silk.inventory.held!.enchants={silk:1};mine(silk);expect(silk.entities.drops[0].stack).toEqual({id:B.Jade,count:1});expect(silk.xp).toBe(0);
});
it("keeps a full station and its block intact if its whole drop transaction cannot fit",()=>{
  const g=fixture(B.Chest);g.containers["2,-20,2"]=Array(27).fill(null);g.containers["2,-20,2"][0]={id:130,count:1,durability:70,enchants:{efficiency:1}};
  for(let i=0;i<256;i++)g.entities.drop({id:3,count:64},{x:i*3,y:2,z:5});const before=structuredClone(g.containers);
  mine(g);expect(g.world.get(2,-20,2)).toBe(B.Chest);expect(g.containers).toEqual(before);expect(g.inventory.held!.durability).toBe(240);
});
