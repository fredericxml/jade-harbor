import {expect,it,vi} from "vitest";
import {Entities,spawnEntity,type Entity} from "../src/game/entities";
import {simulationCandidates,activeSimulationCandidates} from "../src/game/city-life/active-actors";
import {reference,candidates} from "./fixtures/actors-210-baseline";

const actor=(id:string,x:number,y:number,z:number,kind:Entity["kind"]="villager")=>({...spawnEntity(kind,{x,y,z}),id});
it("preserves candidate membership/order with and without CityLife, at radius and health boundaries",()=>{
 const list=Array.from({length:4080},(_,i)=>actor(String(i),(i%100)-50,20,Math.floor(i/100)-20,i%17===0?"panda":i%31===0?"spirit":"villager"));
 for(let i=0;i<list.length;i+=19)list[i].health=0;
 const before=JSON.stringify(list),player={x:0,y:20,z:0};
 for(const active of[undefined,new Set<string>(),new Set(list.filter((_,i)=>i%43===0).map(e=>e.id))])for(const radius of[0,1,32,64]){
  const loaded=(x:number,z:number)=>(Math.floor(x/16)+Math.floor(z/16))%3!==0;
  expect(simulationCandidates(list,{loaded},player,radius,active)).toEqual(candidates(list,{loaded},player,radius,active));
 }
 expect(JSON.stringify(list)).toBe(before);
 const loaded=vi.fn(()=>true),active=new Set(list.slice(0,96).map(e=>e.id));
 simulationCandidates(list,{loaded},player,64,active);
 expect(loaded.mock.calls.length).toBeLessThan(600);
});
it.each([
 [{x:0,y:21,z:0},{x:0,y:0,z:1},4],
 [{x:-4,y:21,z:-4},{x:1,y:0,z:0},4],
 [{x:0,y:21,z:0},{x:2,y:0,z:-3},8],
 [{x:0,y:21,z:0},{x:0,y:0,z:0},4],
 [{x:0,y:25,z:0},{x:0,y:-1,z:0},8],
 [{x:0,y:20,z:0},{x:.0000000001,y:1,z:0},4],
 [{x:0,y:21,z:0},{x:1,y:0,z:0},0],
 [{x:0,y:21,z:0},{x:-1,y:0,z:0},-1],
] as const)("preserves exact target/tie selection for ray %#",(origin,dir,reach)=>{
 const list:Entity[]=[];
 for(let z=-9;z<=9;z++)for(let x=-9;x<=9;x++)for(const y of[18,20,22])list.push(actor(`${x}/${y}/${z}`,x,y,z,(x+z)%3===0?"panda":"villager"));
 list.push(actor("tie-last",0,20,3),actor("dead",0,20,1));list.at(-1)!.health=0;
 const context={list,renderActors:()=>list,world:{loaded:(x:number,z:number)=>(x+z)%5!==0}};
 expect(Entities.prototype.target.call(context as unknown as Entities,origin,dir,reach)).toBe(reference.target.call(context,origin,dir,reach));
});
it("rejects thousands of far residents before chunk lookup without reducing the target list",()=>{
 const list=Array.from({length:4080},(_,i)=>actor(String(i),100+i,20,100));list.push(actor("near",0,20,3));
 const loaded=vi.fn(()=>true),context={list,renderActors:()=>list,world:{loaded}};
 expect(Entities.prototype.target.call(context as unknown as Entities,{x:0,y:21,z:0},{x:0,y:0,z:1})?.id).toBe("near");
 expect(loaded).toHaveBeenCalledTimes(1);expect(list).toHaveLength(4081);
});

it("uses only the bounded active-resident list for the hot simulation candidate path",()=>{
 const all=Array.from({length:4080},(_,i)=>actor(String(i),i%80,20,Math.floor(i/80)));
 const active=all.filter((_,i)=>i%43===0).slice(0,96),others=[actor("panda",0,20,0,"panda")];
 const loaded=vi.fn(()=>true),out=activeSimulationCandidates(active,others,{loaded},{x:0,y:20,z:0},64);
 expect(out).toEqual([...active,others[0]].filter(e=>Math.hypot(e.body.position.x,e.body.position.z)<=64));expect(loaded.mock.calls.length).toBeLessThan(active.length+1);expect(all).toHaveLength(4080);
});
