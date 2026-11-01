import {beforeAll,expect,it} from "vitest";
import "fake-indexeddb/auto";
import {World} from "../src/world/world";
import {createV9Generator} from "../src/world/generator-v9";
import {createV10Generator} from "../src/world/generator-v10";
import {createGenerationSession} from "../src/world/generation-protocol";
import {BlockColumn} from "../src/world/sections";
import {VoxelWriter} from "../src/world/city/writer";
import {B} from "../src/world/blocks";
import type {UrbanLot} from "../src/world/metropolis/plan";
import {buildingVolumes} from "../src/world/metropolis/variety";
import {planRichBuilding,drawRichLot,FACADE_GRAMMARS,type RichDesign} from "../src/world/metropolis/richness";
import {Entities} from "../src/game/entities";
import {Inventory} from "../src/game/inventory";
import {createPopulation} from "../src/game/city-life/population";
import {safeActivityPoint} from "../src/game/city-life/runtime";
import {travelDestinations,travelColumns,safeTravelArrival,travelUnlocked} from "../src/game/city-life/travel";
import {discoveryRegistry} from "../src/game/city-life/discoveries";
import {measureRegionalLandUse} from "../src/world/regions/land-use";
import {collides} from "../src/player/physics";
import {denseCityCopy,freshWorld,validateSave,writeSave,loadSave} from "../src/persistence/saves";
import frozen from "./fixtures/generator-v9.json";
import oldJournal from "./fixtures/journal-v9.json";

const seeds=["jade-harbor","different-city","长江玉港"],current=new Map<string,ReturnType<typeof createV10Generator>>();
beforeAll(()=>{for(const seed of seeds)current.set(seed,createV10Generator(seed));},30000);
const digest=async(c:BlockColumn)=>{
  const data=new Uint8Array(16*16*384*2);let i=0;
  for(let y=-64;y<=319;y++)for(let z=0;z<16;z++)for(let x=0;x<16;x++){const v=c.get(x,y,z);data[i++]=v&255;data[i++]=v>>8;}
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256",data))].map(n=>n.toString(16).padStart(2,"0")).join("");
};
const occupied=(volumes:readonly {u:number;v:number;w:number;d:number}[])=>{
  const out=new Set<string>();for(const v of volumes)for(let z=v.v;z<v.v+v.d;z++)for(let x=v.u;x<v.u+v.w;x++)out.add(`${x},${z}`);return out;
};
function emitted(lot:UrbanLot,d:RichDesign) {
  const result=new Map<string,number>(),a=planRichBuilding(lot,d),top=lot.baseY+Math.max(...a.volumes.map(v=>v.floors))*5+12;
  for(let cz=Math.floor((lot.z1-1)/16);cz<=Math.floor((lot.z2+1)/16);cz++)for(let cx=Math.floor((lot.x1-1)/16);cx<=Math.floor((lot.x2+1)/16);cx++) {
    const c=new BlockColumn();drawRichLot(new VoxelWriter(c,cx*16,cz*16),lot,d,a);
    for(let y=lot.baseY;y<=top;y++)for(let z=0;z<16;z++)for(let x=0;x<16;x++){const id=c.get(x,y,z);if(id!==B.Air)result.set(`${cx*16+x},${y},${cz*16+z}`,id);}
  }
  return result;
}
function disconnected(cells:Map<string,number>,base:number) {
  const seen=new Set<string>(),queue:string[]=[];
  for(const k of cells.keys())if(Number(k.split(",")[1])===base){seen.add(k);queue.push(k);}
  for(let i=0;i<queue.length;i++){const[x,y,z]=queue[i].split(",").map(Number);for(const[dx,dy,dz]of[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const k=`${x+dx},${y+dy},${z+dz}`;if(cells.has(k)&&!seen.has(k)){seen.add(k);queue.push(k);}}}
  return [...cells.keys()].filter(k=>!seen.has(k));
}

it.each(frozen)("preserves the accepted generator 9 full-column checksums ($seed)",async row=>{
  const g=createV9Generator(row.seed);for(const p of row.columns)expect(await digest(g.generate(p.cx,p.cz))).toBe(p.sha256);
},20000);
it.each(seeds)("preserves all dense parcel footprints, routes, regional reserves and forest bounds (%s)",seed=>{
  const old=createV9Generator(seed),g=current.get(seed)!;
  const geometry=(lots:typeof g.metropolis.lots)=>lots.map(({id,x1,x2,z1,z2,baseY,entrance,envelope})=>({id,x1,x2,z1,z2,baseY,entrance,envelope}));
  expect(geometry(g.metropolis.lots)).toEqual(geometry(old.metropolis.lots));expect(g.metropolis.roads).toEqual(old.metropolis.roads);expect(g.plan.envelope).toEqual(old.plan.envelope);expect(g.regions).toEqual(old.regions);
  expect(measureRegionalLandUse(g.plan,g.regions).genericForest).toBeLessThan(.05);
  for(const lot of g.metropolis.lots) {
    const a=g.assemblies.get(lot.id)!,before=buildingVolumes(lot,old.density.designs.get(lot.id)!);
    expect(occupied(a.volumes),lot.id).toEqual(occupied(before));
    expect(a.volumes.every(v=>v.floors>=1&&v.floors<=4&&v.u>=0&&v.v>=0&&v.u+v.w<=a.width&&v.v+v.d<=a.depth)).toBe(true);
  }
},25000);
it("physically emits at least 25 distinct descendants from a single fixed generator 9 building, without labels or recolors",()=>{
  const g=current.get(seeds[0])!,source=g.metropolis.lots.find(l=>l.facing===0)!,lot={...source,x1:1,x2:12,z1:1,z2:12,baseY:20,facing:0};
  const base={...g.density.designs.get(source.id)!,floors:2,composition:"hall" as const,roofGrammar:"gable" as const,rise:4,eave:1,bay:5,rhythm:0,balcony:false,footprint:[{u:0,v:0,w:12,d:12,floors:2}]};
  const outcomes=new Set<string>();
  for(const axis of[0,1] as const)for(const facadeGrammar of FACADE_GRAMMARS)for(const frontage of["flush","shop-canopy","arcade","recessed-porch"] as const) {
    const d={...base,axis,facadeGrammar,frontage},cells=emitted(lot,d);
    outcomes.add([...cells].sort(([a],[b])=>a.localeCompare(b)).map(([p,id])=>`${p}:${id}`).join(";"));
    expect(disconnected(cells,20),`${axis}/${facadeGrammar}/${frontage}`).toEqual([]);
  }
  expect(outcomes.size).toBeGreaterThanOrEqual(25);
},30000);
it("keeps every building body, roof and attachment connected to the foundation across the complete city",()=>{
  const g=current.get(seeds[0])!;
  for(const lot of g.metropolis.lots)expect(disconnected(emitted(lot,g.density.designs.get(lot.id)!),lot.baseY),lot.id).toEqual([]);
},90000);
it.each(seeds)("fills every district with realized roof, facade, height and street relationship diversity (%s)",seed=>{
  const g=current.get(seed)!;
  for(const district of g.metropolis.districts) {
    const ds=g.metropolis.lots.filter(l=>l.districtId===district.id).map(l=>g.density.designs.get(l.id)!);
    expect(new Set(ds.map(d=>d.subfamily)).size,district.id).toBeGreaterThanOrEqual(5);
    expect(new Set(ds.map(d=>d.roofGrammar)).size,district.id).toBeGreaterThanOrEqual(5);
    expect(new Set(ds.map(d=>d.facadeGrammar)).size,district.id).toBeGreaterThanOrEqual(6);
    expect(new Set(ds.map(d=>d.frontage)).size,district.id).toBeGreaterThanOrEqual(5);
    expect(new Set(ds.map(d=>d.axis)).size).toBe(2);expect(new Set(ds.map(d=>d.floors)).size).toBeGreaterThanOrEqual(2);
  }
});
it.each(seeds)("gives every journal entry a collision-safe minimum footprint, preserving old discovery rules (%s)",seed=>{
  const w=new World(seed,{},false,10),registry=travelDestinations(w),book=discoveryRegistry(w);
  expect(new Set(registry.map(d=>d.id)).size).toBe(registry.length);expect(registry.flatMap(d=>d.discoveryIds).sort()).toEqual(book.map(d=>d.id).sort());
  if(seed===seeds[0])expect(book.map(({id,position,radius})=>({id,position,radius})).sort((a,b)=>a.id.localeCompare(b.id))).toEqual(oldJournal.map(({id,position,radius})=>({id,position,radius})).sort((a,b)=>a.id.localeCompare(b.id)));
  for(const d of registry){const columns=travelColumns(d);expect(columns.length).toBeLessThanOrEqual(4);for(const c of columns)w.ensure(c.cx,c.cz,true);const p=safeTravelArrival(w,d);expect(p,d.id).toBeDefined();expect(collides(w,p!)).toBe(false);
    expect(d.fallback,`${d.id} secondary`).toBeDefined();const secondary={...d,arrival:d.fallback!};for(const c of travelColumns(secondary))w.ensure(c.cx,c.cz,true);expect(safeTravelArrival(w,secondary),`${d.id} secondary`).toBeDefined();
    for(const mode of["creative","spectator"] as const)expect(travelUnlocked(d,mode,new Set())).toBe(true);for(const mode of["survival","adventure","hardcore"] as const){expect(travelUnlocked(d,mode,new Set())).toBe(false);expect(travelUnlocked(d,mode,new Set([d.discoveryId]))).toBe(true);}if(w.chunks.size>70)w.chunks.clear();}w.dispose();
},30000);
it("runs v10 chunks independently of order and worker sessions",async()=>{
  const g=current.get(seeds[0])!,points=[...g.metropolis.lots.filter((_,i)=>i%61===0).map(l=>[Math.floor(l.x1/16),Math.floor(l.z1/16)]),...g.regions.sites.map(s=>[Math.floor(s.buildings[0].bounds.x1/16),Math.floor(s.buildings[0].bounds.z1/16)])],expected=new Map<string,string>();
  for(const[x,z]of points)expected.set(`${x},${z}`,await digest(g.generate(x,z)));
  for(const order of[[...points].reverse(),[...points].sort((a,b)=>Math.hypot(...a)-Math.hypot(...b)),[...points].sort((a,b)=>Math.hypot(...b)-Math.hypot(...a))])for(const[x,z]of order)expect(await digest(g.generate(x,z))).toBe(expected.get(`${x},${z}`));
  const session=createGenerationSession();for(const[x,z]of points.slice(0,4)){const r=session.run({cx:x,cz:z,seed:seeds[0],generator:10,epoch:7,ticket:9});expect(await digest(BlockColumn.from(r.sections))).toBe(expected.get(`${x},${z}`));}session.dispose();expect(session.size).toBe(0);
},30000);
it("preserves every resident, uses cheap distinct outfits and attaches real short role chains",()=>{
  const before=new World(seeds[0],{},false,9),w=new World(seeds[0],{},false,10),old=createPopulation(before)!,now=createPopulation(w)!;
  expect(now.residents.map(r=>r.id).sort()).toEqual(old.residents.map(r=>r.id).sort());expect(now.presence?.active).toBe(96);
  for(const r of now.residents.filter(r=>r.landmark))expect(r.task,r.id).toBeDefined();
  expect(new Set(now.residents.filter(r=>r.landmark==="ridge-fortification").map(r=>r.task?.role)).size).toBeGreaterThanOrEqual(3);
  const tasks=now.residents.filter(r=>r.task);expect(tasks.length).toBeGreaterThan(3900);expect(new Set(tasks.map(r=>r.task!.look.fingerprint)).size).toBeGreaterThan(3500);expect(new Set(tasks.map(r=>r.task!.role)).size).toBeGreaterThan(20);
  for(const r of tasks)expect(new Set(r.task!.nodes.map(n=>`${n.position.x},${n.position.z}`)).size).toBeGreaterThanOrEqual(2);
  for(const r of tasks.filter((r,i)=>!!r.landmark||i%37===0))for(const node of r.task!.nodes){for(let z=Math.floor((node.position.z-3)/16);z<=Math.floor((node.position.z+3)/16);z++)for(let x=Math.floor((node.position.x-3)/16);x<=Math.floor((node.position.x+3)/16);x++)w.ensure(x,z,true);expect(safeActivityPoint(w,node.position),r.id).toBeDefined();if(w.chunks.size>80)w.chunks.clear();}
  before.dispose();w.dispose();
},30000);
it("executes observable micro-actions through real physics with bounded detail and navigation",()=>{
  const w=new World(seeds[0],{},false,10),d=travelDestinations(w).find(d=>d.id==="region:amber-village")!;
  for(let z=-3;z<=3;z++)for(let x=-3;x<=3;x++)if(x*x+z*z<=12.25)w.ensure(Math.floor(d.arrival.x/16)+x,Math.floor(d.arrival.z/16)+z,true);
  const e=new Entities(w,undefined,1/6),inv=new Inventory(),seen=new Set<string>();
  for(let t=0;t<1200;t++){e.tick(.05,d.arrival,inv,1/6,false,()=>{},()=>{});expect(e.life!.active.size).toBeLessThanOrEqual(96);expect(e.navigation.expandedLastTick).toBeLessThanOrEqual(96);for(const [id,s]of e.life!.states)if(s.taskActing&&e.life!.active.has(id))seen.add(s.taskAction!);}
  expect(e.life!.purposeMetrics.completedActions).toBeGreaterThan(135);expect(seen.size).toBeGreaterThanOrEqual(7);expect(new Set(e.list.map(e=>e.id)).size).toBe(e.list.length);e.dispose();w.dispose();
},20000);
it("copies generator 9 explicitly to v10 without rewriting the source or resurrecting removed residents",async()=>{
  const w=new World(seeds[0],{},false,9),entities=new Entities(w),source={...freshWorld("generator 9 source",seeds[0],"survival"),generator:9};source.simulation=entities.serialize();source.edits={"-247,28,-215":B.Porcelain};source.achievements=["discovery:ridge-watch"];source.player.health=13;
  const dead=entities.list.find(e=>e.kind==="villager")!.id;source.simulation.entities=(source.simulation.entities as {id:string}[]).filter(e=>e.id!==dead);await writeSave(source);
  const copy=denseCityCopy(source,10);expect(copy.id).not.toBe(source.id);expect(copy.edits).toEqual(source.edits);expect(copy.achievements).toEqual(source.achievements);expect(copy.player.health).toBe(13);await writeSave(copy);
  const loaded=await loadSave(copy.id),world=new World(loaded.seed,loaded.edits,false,10),es=new Entities(world,loaded.simulation,loaded.time);expect(es.list.some(e=>e.id===dead)).toBe(false);expect(es.list.filter(e=>e.kind==="villager")).toHaveLength(4079);loaded.simulation=es.serialize();expect(loaded.simulation.cityLifeVersion).toBe(5);expect(validateSave(loaded).generator).toBe(10);await writeSave(loaded);expect((await loadSave(source.id)).generator).toBe(9);expect((await loadSave(source.id)).simulation?.cityLifeVersion).toBe(4);
  const reopened=new Entities(world,(await loadSave(copy.id)).simulation);expect(reopened.list.map(e=>e.id)).toEqual(es.list.map(e=>e.id));reopened.dispose();es.dispose();world.dispose();entities.dispose();w.dispose();
},20000);
it("retains marker 5 when every entity has been removed and never repopulates that saved component",()=>{
  const w=new World(seeds[0],{},false,10),e=new Entities(w,{entities:[],drops:[],cityLifeVersion:5});
  expect(e.list).toEqual([]);expect(e.life).toBeUndefined();const saved=e.serialize();expect(saved.cityLifeVersion).toBe(5);
  const reopened=new Entities(w,saved);expect(reopened.list).toEqual([]);expect(reopened.serialize().cityLifeVersion).toBe(5);
  reopened.dispose();e.dispose();w.dispose();
},10000);
