import {beforeAll,expect,it} from "vitest";
import "fake-indexeddb/auto";
import {World} from "../src/world/world";
import {createV8Generator} from "../src/world/generator-v8";
import {createV9Generator} from "../src/world/generator-v9";
import {B,block} from "../src/world/blocks";
import {idOf} from "../src/core/coords";
import {planBuilding} from "../src/world/metropolis/quality";
import {buildingVolumes} from "../src/world/metropolis/variety";
import {regionalForestMask,regionalForestTreeAllowed,measureRegionalLandUse} from "../src/world/regions/land-use";
import {footprintBounds,footprintsOverlap} from "../src/world/geography/geometry";
import {forestCellRank} from "../src/world/regions/forest-policy";
import {landscapeAt} from "../src/world/regions/landscapes";
import {regionalLandUseAt} from "../src/world/regions/land-use";
import {sampleTerrain} from "../src/world/geography/terrain";
import {REGIONAL_IDS} from "../src/world/regions/plan";
import {travelDestinations,travelUnlocked,safeTravelArrival,travelColumns} from "../src/game/city-life/travel";
import {createPopulation} from "../src/game/city-life/population";
import {Discoveries} from "../src/game/city-life/discoveries";
import {Entities} from "../src/game/entities";
import {Inventory} from "../src/game/inventory";
import {denseCityCopy,freshWorld,validateSave,writeSave,loadSave} from "../src/persistence/saves";
import {collides,moveBody} from "../src/player/physics";
import {raycast} from "../src/player/raycast";
import {safeActivityPoint} from "../src/game/city-life/runtime";

import frozen from "./fixtures/generator-v8.json";

const seeds=["jade-harbor","different-city","长江玉港"],generators=new Map<string,ReturnType<typeof createV9Generator>>();
beforeAll(()=>{for(const s of seeds)generators.set(s,createV9Generator(s));},30000);
const load=(w:World,p:{x:number;z:number},r=1)=>{for(let z=-r;z<=r;z++)for(let x=-r;x<=r;x++)w.ensure(Math.floor(p.x/16)+x,Math.floor(p.z/16)+z,true);};
const digest=async(g:ReturnType<typeof createV8Generator>|ReturnType<typeof createV9Generator>,cx:number,cz:number)=>{
  const c=g.generate(cx,cz),data=new Uint8Array(16*16*384*2);let i=0;
  for(let y=-64;y<=319;y++)for(let z=0;z<16;z++)for(let x=0;x<16;x++){const v=c.get(x,y,z);data[i++]=v&255;data[i++]=v>>8;}
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256",data))].map(v=>v.toString(16).padStart(2,"0")).join("");
};
it("retains released v8 full-column reconstruction, including woodland and future regional sites",async()=>{
  for(const fixture of frozen){const g=createV8Generator(fixture.seed);for(const p of fixture.columns)expect(await digest(g,p.cx,p.cz)).toBe(p.sha256);}
},20000);
it.each(seeds)("retains every dense parcel, design family and original map boundary (%s)",seed=>{
  const old=createV8Generator(seed),now=generators.get(seed)!;
  expect(now.metropolis.lots).toEqual(old.metropolis.lots);expect(now.density.designs).toEqual(old.density.designs);expect(now.plan.envelope).toEqual(old.plan.envelope);
  for(const lot of now.metropolis.lots){const design=now.density.designs.get(lot.id)!,a=now.assemblies.get(lot.id)!;expect(a.volumes).toEqual(buildingVolumes(lot,design));expect(a.roofs.every(r=>r.w>=3&&r.d>=2&&r.level>=r.support&&r.level-r.support<=2)).toBe(true);}
},20000);
it("makes split and stepped clerestories physically connected instead of floating roof fragments",()=>{
  const w=new World(seeds[0],{},false,9),g=generators.get(seeds[0])!;
  for(const profile of["split","stepped"]){const lot=g.metropolis.lots.find(l=>g.density.designs.get(l.id)!.roof===profile&&g.assemblies.get(l.id)!.roofs.some(r=>r.level>r.support))!,a=planBuilding(lot,g.density.designs.get(lot.id)!);
    for(const r of a.roofs.filter(r=>r.level>r.support)){
      const u=r.u+1,v=r.v+1,[x,z]=lot.facing===0?[lot.x1+u,lot.z1+v]:lot.facing===1?[lot.x2-v,lot.z1+u]:lot.facing===2?[lot.x2-u,lot.z2-v]:[lot.x1+v,lot.z2-u];load(w,{x,z});
      expect(block(w.get(x,r.support,z)).solid).toBe(true);
      for(let y=r.support;y<=r.level;y++)expect([[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]].some(([dx,dy,dz])=>block(w.get(x+dx,y+dy,z+dz)).solid)).toBe(true);
    }
  }w.dispose();
},15000);
it.each(seeds)("reserves complementary destinations without old city/landmark overlap or map expansion (%s)",seed=>{
  const g=generators.get(seed)!,regions=g.regions,bounds=footprintBounds(g.plan.envelope);expect(regions.sites.map(s=>s.id)).toEqual([...REGIONAL_IDS]);
  for(const s of regions.sites){const b=footprintBounds(s.reservation.footprint);expect(b.x1>=bounds.x1&&b.x2<=bounds.x2&&b.z1>=bounds.z1&&b.z2<=bounds.z2).toBe(true);expect(s.buildings.length).toBeGreaterThanOrEqual(3);expect(s.loop.length).toBeGreaterThan(10);
    expect(g.landmarks.reservations.some(old=>footprintsOverlap(old.footprint,s.reservation.footprint,old.margin+5))).toBe(false);
    expect(g.metropolis.lots.some(l=>footprintsOverlap({kind:"area",bounds:l.envelope},s.reservation.footprint,5))).toBe(false);
    expect(s.routes[0].length).toBeGreaterThan(8);for(const route of s.routes)for(let i=1;i<route.length;i++)expect(Math.abs(route[i].y-route[i-1].y)).toBeLessThanOrEqual(.5);
  }
  expect(Math.max(...[...regions.routesByChunk.values()].map(a=>a.length))).toBeLessThanOrEqual(512);
},10000);
it.each(seeds)("keeps actual generic forest below five percent and whole canopies within a global four-percent mask (%s)",seed=>{
  const g=generators.get(seed)!,m=measureRegionalLandUse(g.plan,g.regions);expect(m.genericForest).toBeLessThan(.05);expect(m.convertedRegion).toBeGreaterThan(.02);
  for(const sx of[-21,-1,0,5,19])for(const sz of[-9,-1,0,11]){let count=0;for(let z=0;z<10;z++)for(let x=0;x<10;x++)if(regionalForestMask(g.plan.seed,sx*400+x*40+20,sz*400+z*40+20))count++;expect(count).toBe(4);}
  for(let z=-800;z<800;z+=8)for(let x=-720;x<760;x+=8)if(regionalForestTreeAllowed(g.plan.seed,x,z))for(const[dx,dz]of[[-3,-3],[-3,3],[3,-3],[3,3]])expect(regionalForestMask(g.plan.seed,x+dx,z+dz)).toBe(true);
},10000);
it.each(seeds)("finds dry supported arrivals and correct identities for every district, landmark and region (%s)",seed=>{
  const w=new World(seed,{},false,9),registry=travelDestinations(w);expect(registry.flatMap(d=>d.discoveryIds).sort()).toEqual(new Discoveries(w,new Set()).entries.map(d=>d.id).sort());expect(new Set(registry.map(d=>d.id)).size).toBe(registry.length);
  for(const d of registry){load(w,d.arrival);const p=safeTravelArrival(w,d);expect(p,d.id).toBeDefined();expect(collides(w,p!)).toBe(false);expect(travelColumns(d).length).toBeLessThanOrEqual(49);
    if(d.id==="region:amber-village") {
      // A collision-safe outer approach could still face a retaining cut and
      // hide every inhabitant. At the public arrival, several circuit points
      // must be visible through actual loaded opaque-voxel collision geometry.
      const site=w.regionalPlan!.sites.find(s=>s.id==="amber-village")!,eye={...p!,y:p!.y+1.61},fx=d.focus.x-eye.x,fz=d.focus.z-eye.z,fn=Math.hypot(fx,fz);let visible=0;
      for(const q of site.loop){const target={x:q.x+.5,y:q.y+2.4,z:q.z+.5},delta={x:target.x-eye.x,y:target.y-eye.y,z:target.z-eye.z},n=Math.hypot(delta.x,delta.y,delta.z);if(n<2||n>40)continue;
        if((delta.x*fx+delta.z*fz)/(Math.hypot(delta.x,delta.z)*fn)<.5)continue;
        const hit=raycast((x,y,z)=>{w.ensure(Math.floor(x/16),Math.floor(z/16),true);const v=w.get(x,y,z);return block(v).opaque?v:0;},eye,{x:delta.x/n,y:delta.y/n,z:delta.z/n},n-.3);if(!hit)visible++;
      }expect(visible,"Amber public arrival must see its inhabited circuit").toBeGreaterThanOrEqual(3);
    }
    const body={position:{...p!},velocity:{x:0,y:-.5,z:0},grounded:false,flying:false,fallStart:p!.y};for(let i=0;i<20;i++){body.velocity.y-=.5;moveBody(w,body,.05);}expect(Math.abs(body.position.y-p!.y)).toBeLessThan(.04);
    if(w.chunks.size>80)w.chunks.clear();
  }w.dispose();
},30000);
it("gates all normal modes through the durable discovery set while creative/spectator have full access",()=>{
  const w=new World(seeds[0],{},false,9),recorded=new Set<string>(),book=new Discoveries(w,recorded);
  for(const d of travelDestinations(w)){for(const mode of["survival","adventure","hardcore"] as const)expect(travelUnlocked(d,mode,recorded)).toBe(false);for(const mode of["creative","spectator"] as const)expect(travelUnlocked(d,mode,recorded)).toBe(true);}
  const destination=travelDestinations(w).find(d=>d.id==="district:market")!;load(w,destination.arrival);book.visit(destination.arrival,true);expect(recorded.has(destination.discoveryId)).toBe(true);expect(travelUnlocked(destination,"survival",recorded)).toBe(true);book.dispose();w.dispose();
},20000);
it("fails closed for completely obstructed, wet, missing or cliff-edge arrival areas without editing them",()=>{
  const w=new World(seeds[0],{},false,9),d=travelDestinations(w).find(d=>d.id==="district:heritage")!;expect(safeTravelArrival(w,d)).toBeUndefined();load(w,d.arrival);
  for(let z=-7;z<=7;z++)for(let x=-7;x<=7;x++)for(let y=20;y<=26;y++)w.set(Math.floor(d.arrival.x)+x,y,Math.floor(d.arrival.z)+z,B.Stone);
  const before=w.edits.size;expect(safeTravelArrival(w,d)).toBeUndefined();expect(w.edits.size).toBe(before);w.dispose();
},20000);
it.each(seeds)("adds purposeful local work/social/patrol circuits while preserving every released identity and the detail cap (%s)",seed=>{
  const old=new World(seed,{},false,8),w=new World(seed,{},false,9),before=createPopulation(old)!,after=createPopulation(w)!;
  expect(after.residents).toHaveLength(4080);expect(after.presence?.active).toBe(96);for(const r of before.residents)expect(after.byId.has(r.id)).toBe(true);
  const local=after.residents.filter(r=>r.id.includes(":region9:"));expect(local).toHaveLength(80);
  for(const s of REGIONAL_IDS){const residents=local.filter(r=>r.neighborhood===`region9:${s}`);expect(new Set(residents.map(r=>r.circuit!.routine)).size).toBe(4);}
  const seen=new Set<string>();for(const r of local)for(const p of r.circuit!.points){const key=`${p.x},${p.y},${p.z}`;if(seen.has(key))continue;seen.add(key);load(w,p,0);const safe=safeActivityPoint(w,p);expect(safe,`${r.id}: ${key}`).toBeDefined();expect(Math.abs(safe!.y-p.y)).toBeLessThan(.01);if(w.chunks.size>80)w.chunks.clear();}
  old.dispose();w.dispose();
},30000);
it("keeps regional residents moving through real physics without duplicates or larger navigation budgets",()=>{
  const w=new World(seeds[0],{},false,9),d=travelDestinations(w).find(d=>d.id==="region:amber-village")!;load(w,d.arrival,3);const es=new Entities(w,undefined,.17),positions=new Map(es.list.map(e=>[e.id,{...e.body.position}])),walked=new Map<string,number>();
  for(let t=0;t<1200;t++){es.tick(.05,d.arrival,new Inventory(),.17,false,()=>{},()=>{});expect(es.life!.active.size).toBeLessThanOrEqual(96);expect(es.navigation.expandedLastTick).toBeLessThanOrEqual(96);expect(es.navigation.agents.size).toBeLessThanOrEqual(102);if(t%20===0)for(const e of es.list.filter(e=>es.life!.active.has(e.id))){const p=positions.get(e.id)!;walked.set(e.id,(walked.get(e.id)??0)+Math.hypot(p.x-e.body.position.x,p.z-e.body.position.z));positions.set(e.id,{...e.body.position});}}
  expect([...walked.values()].filter(n=>n>4).length).toBeGreaterThanOrEqual(6);expect(new Set(es.list.map(e=>e.id)).size).toBe(es.list.length);es.dispose();w.dispose();
},20000);
it("copies v8 to v9 explicitly, preserves edits/discoveries/health and never resurrects removed residents on reload",async()=>{
  const old=new World(seeds[0],{},false,8),es=new Entities(old),source=freshWorld("Compatibility source",seeds[0],"survival");source.generator=8;source.edits={"-520,30,416":B.Porcelain};source.achievements=["discovery:archaeology"];source.simulation=es.serialize();source.player.health=13;
  const killed=es.list.find(e=>e.kind==="villager")!.id;source.simulation.entities=(source.simulation.entities as {id:string}[]).filter(e=>e.id!==killed);await writeSave(source);
  const copy=denseCityCopy(source,9);expect(copy.id).not.toBe(source.id);expect(copy.achievements).toEqual(source.achievements);expect(copy.edits).toEqual(source.edits);expect(copy.player.health).toBe(13);await writeSave(copy);
  const loaded=await loadSave(copy.id),world=new World(loaded.seed,loaded.edits,false,loaded.generator),updated=new Entities(world,loaded.simulation,loaded.time);expect(updated.list.some(e=>e.id===killed)).toBe(false);expect(updated.list.filter(e=>e.kind==="villager")).toHaveLength(4079);
  loaded.simulation=updated.serialize();expect(loaded.simulation.cityLifeVersion).toBe(4);expect(validateSave(loaded).generator).toBe(9);await writeSave(loaded);expect((await loadSave(source.id)).generator).toBe(8);
  const reopened=new Entities(world,(await loadSave(copy.id)).simulation);expect(reopened.list.map(e=>e.id)).toEqual(updated.list.map(e=>e.id));reopened.dispose();updated.dispose();world.dispose();es.dispose();old.dispose();
},25000);
it("reconstructs new regional pieces independently of chunk order, eviction and saved overlays",async()=>{
  const g=generators.get(seeds[0])!,points=[...g.regions.sites.flatMap(s=>[s.arrival,...s.buildings.map(b=>({x:b.bounds.x1,z:b.bounds.z1}))]),...g.regions.landscapes.patches.slice(0,5).flatMap(a=>[{x:a.x,z:a.z},{x:a.bounds.x1,z:a.bounds.z1}])].map(p=>[Math.floor(p.x/16),Math.floor(p.z/16)]),unique=[...new Map(points.map(p=>[p.join(","),p])).values()],expected=new Map<string,string>();for(const[x,z]of unique)expected.set(`${x},${z}`,await digest(g,x,z));
  for(const order of[[...unique].reverse(),[...unique].sort((a,b)=>Math.hypot(...a)-Math.hypot(...b)),[...unique].sort((a,b)=>Math.hypot(...b)-Math.hypot(...a))])for(const[x,z]of order)expect(await digest(g,x,z)).toBe(expected.get(`${x},${z}`));
  const save={...freshWorld("Regional durability",seeds[0],"creative"),generator:9},w=new World(save.seed,{},false,9);for(const s of g.regions.sites){load(w,s.arrival,0);w.set(s.arrival.x,s.arrival.y+2,s.arrival.z,B.Porcelain);}save.edits=Object.fromEntries(w.edits);await writeSave(save);w.dispose();const loaded=await loadSave(save.id),reopened=new World(loaded.seed,loaded.edits,false,loaded.generator);for(const[k,v]of Object.entries(loaded.edits)){const[x,y,z]=k.split(",").map(Number);load(reopened,{x,z},0);expect(idOf(reopened.get(x,y,z))).toBe(v);}reopened.dispose();
},40000);

it.each(seeds)("physically plans every removed woodland footprint as contextual regional landscape (%s)",seed=>{
  const g=generators.get(seed)!,p=g.regions.landscapes,b=footprintBounds(g.plan.envelope);expect(p.patches.length).toBeGreaterThan(40);expect(p.patches.length).toBeLessThanOrEqual(256);
  for(let z=b.z1;z<b.z2;z+=8)for(let x=b.x1;x<b.x2;x+=8){const rank=forestCellRank(g.plan.seed,x,z),t=sampleTerrain(g.plan,x,z);if(rank<4||rank>=12||t.urban||t.water||t.region==="cliff"||t.region==="ridge")continue;expect(landscapeAt(p,x,z),`${x},${z}`).toBeDefined();expect(["regional-destination","regional-landscape"]).toContain(regionalLandUseAt(g.plan,g.regions,x,z,t));}
  const selected=[...new Map(p.patches.map(a=>[a.theme,a])).values()];for(const a of selected){expect(a.context.length).toBeGreaterThan(3);expect(a.bounds.x1).toBeLessThanOrEqual(a.bounds.x2);}
},15000);
