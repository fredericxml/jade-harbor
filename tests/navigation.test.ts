import {beforeAll,beforeEach,afterEach,afterAll,describe,it,expect} from 'vitest';
import 'fake-indexeddb/auto';
import {World} from '../src/world/world';
import {BlockColumn} from '../src/world/sections';
import {B} from '../src/world/blocks';
import {packed,Vec3} from '../src/core/coords';
import {PathSearch,traversable,Navigation} from '../src/game/navigation/pathfinder';
import {Entities,spawnEntity,offersFor,type Entity} from '../src/game/entities';
import {Inventory} from '../src/game/inventory';
import {freshWorld,writeSave,loadSave} from '../src/persistence/saves';
let flatWorld:World;
function floor() {const w=flatWorld;for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++){const blocks=new BlockColumn();for(let a=0;a<16;a++)for(let b=0;b<16;b++)blocks.set(a,0,b,B.Stone);w.chunks.set(`${x},${z}`,{cx:x,cz:z,blocks,revision:0});}return w;}
function solve(w:World,from:Vec3,to:Vec3,doors=true) {const s=new PathSearch(w,from,to,doors);let loops=0;while(s.status==='searching' && loops++<150)s.step(32);return s;}
describe('flat navigation fixtures',()=>{
 beforeEach(()=>{flatWorld=new World('a',{},false);},20000);
 afterEach(()=>flatWorld.dispose());
it('routes around a wall across a negative chunk boundary without teleporting',()=>{
 const w=floor();for(let z=-3;z<=3;z++)for(let y=1;y<=3;y++)w.set(0,y,z,B.Stone);
 const s=solve(w,{x:-4.5,y:1,z:.5},{x:4.5,y:1,z:.5});expect(s.status).toBe('ready');expect(s.path.some(p=>Math.abs(p.z)>3)).toBe(true);
 for(let i=1;i<s.path.length;i++)expect(traversable(w,s.path[i-1],s.path[i])).toBe(true);
});
it('avoids lava, cliffs and insufficient head clearance',()=>{
 const w=floor();for(let x=0;x<6;x++){w.set(x,1,0,B.Lava);w.set(x,2,1,B.Stone);w.set(x,0,-1,0);}
 const s=solve(w,{x:-2.5,y:1,z:.5},{x:8.5,y:1,z:.5});expect(s.status).toBe('ready');expect(s.path.filter(p=>p.x>0&&p.x<6).every(p=>Math.abs(p.z)>1.5)).toBe(true);
});
it('uses actual slab and stair geometry and refuses a full-height wall climb',()=>{
 const w=floor();w.set(1,1,0,B.Slab);w.set(2,1,0,B.Stone);w.set(3,2,0,packed(B.Stairs,3));
 expect(solve(w,{x:.5,y:1,z:.5},{x:2.5,y:2,z:.5}).status).toBe('ready');
 expect(traversable(w,{x:5.5,y:1,z:.5},{x:6.5,y:2,z:.5})).toBe(false);
});
it('can plan through a door, with bounded search and graceful unloaded targets',()=>{
 const w=floor();for(let z=-16;z<32;z++)for(let y=1;y<=3;y++)w.set(0,y,z,B.Stone);
 w.set(0,1,0,packed(B.Door,1));w.set(0,2,0,packed(B.Door,9));
 expect(solve(w,{x:-2.5,y:1,z:.5},{x:2.5,y:1,z:.5}).status).toBe('ready');
 expect(solve(w,{x:-2.5,y:1,z:.5},{x:2.5,y:1,z:.5},false).status).toBe('blocked');
 expect(solve(w,{x:-2.5,y:1,z:.5},{x:200,y:1,z:.5}).status).toBe('unloaded');
 const nav=new Navigation(w);for(let i=0;i<10;i++)nav.steer(String(i),{x:-2.5,y:1,z:.5},{x:25.5,y:1,z:20.5},.05);nav.tick(32,100);expect(nav.expandedLastTick).toBeLessThanOrEqual(32);
});
describe('worker lifecycle fixture',()=>{
 let e:Entity,es:Entities,inv:Inventory;
 beforeEach(()=>{
 const w=floor();e={...spawnEntity('villager',{x:-4.5,y:1.01,z:.5},'Worker'),profession:'merchant' as const,workplace:{x:8.5,y:1.002,z:.5}};es=new Entities(w,{entities:[e],drops:[],cityLifeVersion:5});expect(es.list).toHaveLength(1);inv=new Inventory();
 },20000);
 afterEach(()=>es.dispose());
it('physically follows a villager home/work route, replans a construction obstruction and persists its identity',async()=>{
 const w=flatWorld;
 for(let i=0;i<110;i++)es.tick(.05,{x:0,y:1,z:0},inv,.24,false,()=>{},()=>{});
 const before=e.body.position.x;expect(before).toBeGreaterThan(-4);
 for(let z=-2;z<=2;z++)for(let y=1;y<4;y++)w.set(4,y,z,B.Red);
 for(let i=0;i<800;i++)es.tick(.05,{x:0,y:1,z:0},inv,.24,false,()=>{},()=>{});
 expect(e.body.position.x).toBeGreaterThan(8);expect(e.state).toBe('working');
 const d=freshWorld('npc','a','survival');d.simulation=es.serialize();await writeSave(d);const loaded=await loadSave(d.id);expect((loaded.simulation!.entities as any[])[0]).toMatchObject({id:e.id,profession:'merchant',state:'working',workplace:e.workplace});
 for(let i=0;i<900;i++)es.tick(.05,{x:0,y:1,z:0},inv,.7,false,()=>{},()=>{});
 expect(e.body.position.x).toBeLessThan(-4);expect(e.state).toBe('sleeping');expect(offersFor(e).length).toBe(5);
});
});
});
describe('current generated-city route fixture',()=>{
 let w:World,es:Entities;
 beforeAll(()=>{
  w=new World('jade-harbor',{},false);es=new Entities(w);
  for(const e of es.list.filter(e=>e.kind==='villager').slice(0,3))
   for(let x=Math.floor(Math.min(e.home.x,e.workplace!.x)/16)-2;x<=Math.floor(Math.max(e.home.x,e.workplace!.x)/16)+2;x++)for(let z=Math.floor(Math.min(e.home.z,e.workplace!.z)/16)-2;z<=Math.floor(Math.max(e.home.z,e.workplace!.z)/16)+2;z++)w.ensure(x,z,true);
 },30000);
 afterAll(()=>{es.dispose();w.dispose();});
it('places real city residents in clear interiors and finds representative workplace routes',()=>{
 for(const e of es.list.filter(e=>e.kind==='villager').slice(0,3)){
   const s=solve(w,e.home,e.workplace!);expect(s.status,e.name).toBe('ready');
 }
});

});
