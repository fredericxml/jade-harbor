import { expect, it } from "vitest";
import "fake-indexeddb/auto";
import { World } from "../src/world/world";
import { createV8Generator } from "../src/world/generator-v8";
import { createV7Generator } from "../src/world/generator-v7";
import { createPopulation } from "../src/game/city-life/population";
import { STREET_LIFE_BUDGET } from "../src/game/city-life/street-life";
import { Entities } from "../src/game/entities";
import { scheduleAt } from "../src/game/city-life/schedules";
import { buildingPoint } from "../src/game/professions";
import { Inventory } from "../src/game/inventory";
import { safeActivityPoint } from "../src/game/city-life/runtime";
import { forestMask, forestTreeAllowed, measureLandUse } from "../src/world/geography/land-use";
import { sampleTerrain } from "../src/world/geography/terrain";
import { buildingVolumes } from "../src/world/metropolis/variety";
import { FABRIC_LIMITS } from "../src/world/metropolis/fabric";
import { intersects } from "../src/world/city/plan";
import { footprintsOverlap, footprintDistance } from "../src/world/geography/geometry";
import { roadFootprint } from "../src/world/metropolis/plan";
import { denseCityCopy, freshWorld, loadSave, validateSave, writeSave } from "../src/persistence/saves";
import { B } from "../src/world/blocks";
import type { Vec3 } from "../src/core/coords";

const seeds=["jade-harbor","different-city","长江玉港"],area=(r:{x1:number;x2:number;z1:number;z2:number})=>(r.x2-r.x1+1)*(r.z2-r.z1+1);
function load(w:World,p:Vec3) {
  for(const x of new Set([Math.floor((p.x-.35)/16),Math.floor((p.x+.35)/16)]))for(const z of new Set([Math.floor((p.z-.35)/16),Math.floor((p.z+.35)/16)]))w.ensure(x,z,true);
  while(w.chunks.size>112)w.chunks.delete(w.chunks.keys().next().value!);
}
function signature(g:ReturnType<typeof createV8Generator>,x:number,z:number){return g.generate(x,z).serialize().map(s=>({sy:s.sy,uniform:s.uniform,data:s.data?Array.from(s.data):undefined}));}

it.each(seeds)("packs and expands every developed district without overlap or protected-route encroachment (%s)",seed=>{
  const g=createV8Generator(seed),p=g.density;
  expect(p.diagnostics.candidates).toBeLessThanOrEqual(FABRIC_LIMITS.candidates);expect(p.urban.lots.length).toBeLessThanOrEqual(FABRIC_LIMITS.lots);
  expect(p.diagnostics.expansions).toBeGreaterThan(1000);expect(p.newLots.length).toBeGreaterThan(150);
  expect(new Set(p.urban.roads.map(r=>r.id)).size).toBe(p.urban.roads.length);
  expect(new Set(p.urban.lots.map(l=>l.id)).size).toBe(p.urban.lots.length);
  for(const d of p.urban.districts){
    const before=p.previousUrban.lots.filter(l=>l.districtId===d.id).reduce((n,l)=>n+area(l),0),after=p.urban.lots.filter(l=>l.districtId===d.id).reduce((n,l)=>n+area(l),0);
    expect(after,`${seed}:${d.id} actual parcel expansion`).toBeGreaterThan(before*1.2);
  }
  for(const lot of p.urban.lots) {
    const f={kind:"area" as const,bounds:lot.envelope};
    expect(p.urban.lots.some(other=>other!==lot&&intersects(lot.envelope,other.envelope)),lot.id).toBe(false);
    expect(g.landmarks.reservations.some(r=>footprintsOverlap(f,r.footprint,r.margin)),lot.id).toBe(false);
    expect(p.openSpaces.some(s=>intersects(lot.envelope,s.bounds)),lot.id).toBe(false);
    expect(p.urban.roads.filter(r=>r.owner!==lot.id).some(r=>footprintsOverlap(f,roadFootprint(r),.09)),lot.id).toBe(false);
  }
},45000);

it.each(seeds)("uses multiple physical massing/roof/height families and indexed local realization (%s)",seed=>{
  const g=createV8Generator(seed),p=g.density;
  for(const d of p.urban.districts){const lots=p.urban.lots.filter(l=>l.districtId===d.id),designs=lots.map(l=>p.designs.get(l.id)!);
    expect(new Set(designs.map(d=>d.family)).size,d.id).toBeGreaterThanOrEqual(4);
    expect(new Set(designs.map(d=>d.roof)).size,d.id).toBeGreaterThanOrEqual(4);
    expect(new Set(designs.map(d=>d.floors)).size,d.id).toBeGreaterThanOrEqual(2);
    const roofs=lots.flatMap(l=>buildingVolumes(l,p.designs.get(l.id)!));expect(roofs.every(r=>r.w>=3&&r.d>=2)).toBe(true);
    expect(new Set(designs.map(d=>d.massing)).size,d.id).toBeGreaterThanOrEqual(2);
  }
  expect(Math.max(...[...p.urban.lotsByChunk.values()].map(a=>a.length))).toBeLessThanOrEqual(12);
  expect(p.previousUrban.lots[0].envelope).not.toBe(p.urban.lots[0].envelope);
},30000);

it.each(seeds)("meets district building-volume coverage instead of counting empty courtyard parcels (%s)",seed=>{
  const p=createV8Generator(seed).density,targets:Record<string,number>={heritage:.35,market:.42,hutong:.40,"water-town":.36,imperial:.32,harbor:.20,artisan:.42,scholar:.35,nightlife:.45,highland:.28};
  for(const district of p.urban.districts){const b=district.bounds;let built=0;
    for(const lot of p.urban.lots.filter(l=>l.districtId===district.id)){
      const cells=new Set<string>();for(const v of buildingVolumes(lot,p.designs.get(lot.id)!))for(let z=v.v;z<v.v+v.d;z++)for(let x=v.u;x<v.u+v.w;x++)cells.add(`${x},${z}`);
      for(const key of cells){const[u,v]=key.split(',').map(Number),[x,z]=lot.facing===0?[lot.x1+u,lot.z1+v]:lot.facing===1?[lot.x2-v,lot.z1+u]:lot.facing===2?[lot.x2-u,lot.z2-v]:[lot.x1+v,lot.z2-u];if(x>=b.x1&&x<=b.x2&&z>=b.z1&&z<=b.z2)built++;}
    }
    expect(built/area(b),`${seed}:${district.id} actual occupied-volume projection`).toBeGreaterThanOrEqual(targets[district.id]);
  }
},15000);

it("keeps the Panda column and all eight protected landmark cores byte-identical while permitting surrounding land-use correction",()=>{
  const a=createV7Generator(seeds[0]),b=createV8Generator(seeds[0]);
  const positions=[[-1,-4],[-1,-3],[0,-4],[0,-3],...a.realization.sites.map(s=>{const c=a.realization.components.find(c=>c.site===s.id&&c.kind!=="route")!;return[Math.floor((c.bounds.x1+c.bounds.x2)/32),Math.floor((c.bounds.z1+c.bounds.z2)/32)];})];
  for(const[cx,cz]of positions){const before=a.generate(cx,cz),after=b.generate(cx,cz);
    for(let z=cz*16;z<cz*16+16;z++)for(let x=cx*16;x<cx*16+16;x++) {
      const protectedColumn=(cx===-1||cx===0)&&(cz===-4||cz===-3)||a.landmarks.reservations.some(r=>footprintDistance(r.footprint,x,z)<=r.margin)||a.realization.components.some(c=>c.kind!=="route"&&x>=c.bounds.x1&&x<=c.bounds.x2&&z>=c.bounds.z1&&z<=c.bounds.z2);
      if(protectedColumn)for(let y=-64;y<=319;y++)if(after.get(x-cx*16,y,z-cz*16)!==before.get(x-cx*16,y,z-cz*16))throw Error(`Protected packed voxel changed: ${x},${y},${z}`);
    }
  }
},15000);

it.each(seeds)("reconstructs dense parcels and roofs in normal, reverse, edge-first and center-first orders (%s)",seed=>{
  const a=createV8Generator(seed),b=createV8Generator(seed),points=new Map<string,[number,number]>();
  for(const d of["heritage","market","water-town","harbor","highland"]){const l=a.density.newLots.find(l=>l.districtId===d)!;for(const[x,z]of[[l.x1,l.z1],[l.x2,l.z2],[l.entrance.x,l.entrance.z]])points.set(`${Math.floor(x/16)},${Math.floor(z/16)}`,[Math.floor(x/16),Math.floor(z/16)]);}
  const expected=new Map([...points].map(([k,[x,z]])=>[k,signature(a,x,z)]));
  const list=[...points],orders=[[...list].reverse(),[...list].sort((a,b)=>Math.hypot(...b[1])-Math.hypot(...a[1])),[...list].sort((a,b)=>Math.hypot(...a[1])-Math.hypot(...b[1]))];
  for(const order of orders)for(const[k,[x,z]]of order)expect(signature(b,x,z),`${seed}:${k}`).toEqual(expected.get(k));
},30000);

it.each(seeds)("enforces a seed-independent twelve-percent global woodland upper bound, including negative tiles (%s)",seed=>{
  const g=createV8Generator(seed);
  for(const sx of[-21,-2,0,4,17])for(const sz of[-7,-1,0,9]){let count=0;for(let z=0;z<10;z++)for(let x=0;x<10;x++)if(forestMask(g.plan.seed,sx*400+x*40+20,sz*400+z*40+20))count++;expect(count).toBe(12);}
  const report=measureLandUse(g.plan);expect(report.potentialForest).toBeLessThanOrEqual(.15);expect(report.genericForest).toBeLessThanOrEqual(.15);
  expect(report.counts["terraced-fields"]+report.counts.orchard+report.counts["managed-meadow"]).toBeGreaterThan(report.counts["wild-forest"]*3);
  for(let z=-180;z<180;z+=3)for(let x=-240;x<240;x+=3)if(forestTreeAllowed(g.plan.seed,x,z))for(const[dx,dz]of[[-3,-3],[-3,3],[3,-3],[3,3]])expect(forestMask(g.plan.seed,x+dx,z+dz)).toBe(true);
},30000);

it("realizes rocky/managed scenic ground and small outcrops instead of only deleting trees over empty grass",()=>{
  const g=createV8Generator(seeds[0]);let managed=0,outcrops=0;
  for(const[cx,cz]of[[-40,-12],[-42,-12],[-44,-12]]){const c=g.generate(cx,cz);for(let z=0;z<16;z++)for(let x=0;x<16;x++){
    const t=sampleTerrain(g.plan,cx*16+x,cz*16+z),ground=c.get(x,t.height,z);if(ground===B.Moss||ground===B.Stone)managed++;
    const above=c.get(x,t.height+2,z);if(above===B.Moss||above===B.Stone)outcrops++;
  }}
  expect(managed).toBeGreaterThan(100);expect(outcrops).toBeGreaterThan(0);
},10000);

it("retains every released identity and gives every district fixed additional work/social/circulation addresses without loading voxels",()=>{
  const old=new World(seeds[0],{},false,7),w=new World(seeds[0],{},false,8),a=createPopulation(old)!,b=createPopulation(w)!;
  for(const n of b.presence!.neighborhoods.filter(n=>n.id.startsWith("street8:")))expect(n.residents,`essential local roles at ${n.id}`).toBeGreaterThanOrEqual(4);
  expect(b.residents.length).toBe(STREET_LIFE_BUDGET.residents);expect(new Set(b.residents.map(r=>r.id)).size).toBe(b.residents.length);expect(w.chunks.size).toBe(0);
  for(const r of a.residents)expect(b.byId.has(r.id),r.id).toBe(true);
  for(const d of w.metropolisPlan!.districts){const people=b.residents.filter(r=>r.district===d.id&&r.id.startsWith("inhabitant:"));expect(people.length,d.id).toBeGreaterThan(20);for(const kind of["work","circulation","social"])expect(people.some(r=>r.circuit?.routine===kind),`${d.id}:${kind}`).toBe(true);}
  for(const s of w.landmarkPlan!.sites)expect(b.residents.filter(r=>r.landmark===s.id).length,s.id).toBeGreaterThanOrEqual(10);
  expect(JSON.stringify(b)).toBe(JSON.stringify(createPopulation(w)));old.dispose();w.dispose();
},30000);

it("supports every actual home and authored circuit goal in the dense architecture",()=>{
  const w=new World(seeds[0],{},false,8),population=createPopulation(w)!,points=new Map<string,Vec3>();
  for(const r of population.residents){points.set(`${r.home.x}:${r.home.y}:${r.home.z}`,r.home);for(const p of r.circuit?.points??[])points.set(`${p.x}:${p.y}:${p.z}`,p);}
  const failures:string[]=[];for(const[k,p]of points){load(w,p);if(!safeActivityPoint(w,p))failures.push(k);}
  expect(failures.slice(0,30)).toEqual([]);w.dispose();
},60000);

it("moves a natural avenue population and exercises the 96-active concentration cap with bounded navigation and disposal",()=>{
  const w=new World(seeds[0],{},false,8),es=new Entities(w,undefined,.17),inv=new Inventory(),p={x:.5,y:21.002,z:24.5};
  for(let z=-3;z<=3;z++)for(let x=-3;x<=3;x++)if(x*x+z*z<3.5**2)w.ensure(x,z,true);
  const start=new Map(es.list.map(e=>[e.id,{...e.body.position}]));let peak=0;
  for(let i=0;i<1200;i++){es.tick(.05,p,inv,.17+i*.05/1200,false,()=>{},()=>{});peak=Math.max(peak,es.life!.active.size);expect(es.life!.active.size).toBeLessThanOrEqual(96);expect(es.navigation.agents.size).toBeLessThanOrEqual(102);expect(es.navigation.expandedLastTick).toBeLessThanOrEqual(96);}
  expect(peak).toBeGreaterThanOrEqual(60);expect(es.list.filter(e=>start.has(e.id)&&Math.hypot(e.body.position.x-start.get(e.id)!.x,e.body.position.z-start.get(e.id)!.z)>4).length).toBeGreaterThan(40);
  es.list.filter(e=>e.kind==="villager").slice(0,120).forEach((e,i)=>{e.body.position={x:-2.5+i%6*.9,y:21.002,z:18.5+Math.floor(i/6)*.6};});
  for(let i=0;i<80;i++){es.tick(.05,p,inv,.2,false,()=>{},()=>{});expect(es.life!.active.size).toBe(96);expect(es.navigation.agents.size).toBeLessThanOrEqual(102);expect(es.navigation.expandedLastTick).toBeLessThanOrEqual(96);}
  es.dispose();w.dispose();expect(es.list).toEqual([]);expect(es.navigation.agents.size).toBe(0);expect(w.chunks.size).toBe(0);expect(w.planCount).toBe(0);
},30000);

it("keeps close interactions active and spends the remaining v8 budget on public circulation before hidden interiors",()=>{
  const w=new World(seeds[0],{},false,8),es=new Entities(w),p={x:.5,y:21.002,z:24.5};
  for(let z=-3;z<=4;z++)for(let x=-3;x<=3;x++)w.ensure(x,z,true);
  const interior=w.metropolisPlan!.lots.map(l=>buildingPoint(l,1)).find(q=>Math.hypot(q.x-p.x,q.z-p.z)>12&&Math.hypot(q.x-p.x,q.z-p.z)<28)!;
  expect(interior).toBeDefined();
  const template=es.list.find(e=>e.kind==="villager")!;
  const actor=(id:string,position:Vec3)=>({...template,id,body:{...template.body,position:{...position}}});
  const crowd=[actor("interaction",{...p,x:p.x+2}),...Array.from({length:95},(_,i)=>actor(`public:${i}`,{...p,z:p.z+30})),...Array.from({length:30},(_,i)=>actor(`interior:${i}`,interior))];
  es.life!.prepare(crowd,p,.17,false,0,es.navigation);
  expect(es.life!.active.size).toBe(96);expect(es.life!.active.has("interaction")).toBe(true);
  expect([...es.life!.active].filter(id=>id.startsWith("public:")).length).toBe(95);
  es.dispose();w.dispose();
},15000);

it("completes the nearby Panda at the circular residency edge with bounded ordinary requests and releases it after leaving",()=>{
  const w=new World(seeds[0],{},false,8);
  for(let i=0;i<16;i++){const before=w.chunks.size;w.stream(-40,-16,3);expect(w.chunks.size-before).toBeLessThanOrEqual(4);expect(w.pending.size).toBeLessThanOrEqual(8);}
  for(const x of[-1,0])for(const z of[-4,-3])expect(w.chunks.has(`${x},${z}`)).toBe(true);
  expect(w.chunks.size).toBeLessThanOrEqual(41);w.stream(500,500,3);
  for(const x of[-1,0])for(const z of[-4,-3])expect(w.chunks.has(`${x},${z}`)).toBe(false);w.dispose();
  const old=new World(seeds[0],{},false,7);for(let i=0;i<16;i++)old.stream(-40,-16,3);
  expect(old.chunks.has("0,-4")).toBe(false);expect(old.chunks.size).toBe(37);old.dispose();
},15000);

it("copies v7 explicitly into v8, preserves deaths/progress/trades, and initializes new identities only once",async()=>{
  const w7=new World(seeds[0],{},false,7),old=new Entities(w7),removed=old.list.find(e=>e.id.startsWith("neighbor:"))!.id;
  old.list=old.list.filter(e=>e.id!==removed);old.list[0].trades=7;old.list[0].health=12;
  const source={...freshWorld("Original v7",seeds[0],"creative"),generator:7};source.edits["20,22,24"]=B.Gold;source.achievements=["discovery:imperial-complex"];source.player.slots[0]={id:111,count:7};source.simulation=old.serialize();await writeSave(source);
  const original=await loadSave(source.id),copy=denseCityCopy(original);expect(copy.generator).toBe(8);expect(copy.id).not.toBe(original.id);expect(copy.edits).toEqual(original.edits);expect(copy.player.slots).toEqual(original.player.slots);expect(copy.achievements).toEqual(original.achievements);
  const w=new World(copy.seed,copy.edits,false,8),e=new Entities(w,copy.simulation,copy.time);expect(e.list.some(e=>e.id===removed)).toBe(false);expect(e.list[0].trades).toBe(7);expect(e.list[0].health).toBe(12);expect(e.serialize().cityLifeVersion).toBe(3);
  const missing=e.list.find(e=>e.id.startsWith("inhabitant:"))!.id;e.list=e.list.filter(e=>e.id!==missing);copy.simulation=e.serialize();await writeSave(copy);const loaded=await loadSave(copy.id),again=new Entities(w,loaded.simulation,loaded.time);
  expect(again.list.map(e=>e.id)).toEqual(e.list.map(e=>e.id));expect(again.list.some(e=>[missing,removed].includes(e.id))).toBe(false);expect((await loadSave(source.id)).generator).toBe(7);
  expect(()=>validateSave({...loaded,generator:7})).toThrow();await expect(writeSave({...source,generator:8})).rejects.toThrow("immutable");
  const empty=new Entities(w,{entities:[],cityLifeVersion:2});expect(empty.list).toEqual([]);expect(empty.life).toBeUndefined();expect(empty.serialize().cityLifeVersion).toBe(3);
  empty.dispose();again.dispose();e.dispose();w.dispose();old.dispose();w7.dispose();
},30000);

it("retains old component caps and confines marker 3 and the expanded pool to generator 8",()=>{
  const w=new World(seeds[0],{},false,8),e=new Entities(w),save=freshWorld("Strict dense save",seeds[0],"creative");save.generator=8;save.simulation=e.serialize();expect(validateSave(save).generator).toBe(8);
  for(const generator of[3,4,5,6,7])expect(()=>validateSave({...save,generator})).toThrow();
  for(const marker of[0,4,"3",null,false])expect(()=>validateSave({...save,simulation:{...save.simulation,cityLifeVersion:marker}})).toThrow();
  const excessive=Array.from({length:4097},(_,i)=>({...e.list[0],id:`bound:${i}`}));expect(()=>validateSave({...save,simulation:{entities:excessive,cityLifeVersion:3}})).toThrow();
  expect(()=>validateSave({...save,generator:7,simulation:{entities:excessive.slice(0,1025),cityLifeVersion:2}})).toThrow();
  expect(()=>validateSave({...save,generator:6,simulation:{entities:excessive.slice(0,257),cityLifeVersion:1}})).toThrow();e.dispose();w.dispose();
},15000);

it("retains off-duty harbor public circulation while real dock workers return home",()=>{
  const w=new World(seeds[0],{},false,8),p=createPopulation(w)!,street=p.residents.filter(r=>r.district==="harbor"&&r.id.startsWith("inhabitant:")&&(r.neighborhood?.startsWith("street8:")||r.neighborhood?.startsWith("meeting8:")));
  const pedestrians=street.filter(r=>r.circuit?.routine==="circulation"),workers=street.filter(r=>r.circuit?.routine==="work");
  expect(pedestrians.length).toBeGreaterThan(20);expect(workers.length).toBeGreaterThan(10);
  for(const r of pedestrians){expect(r.profession).toBe("resident");expect(scheduleAt(r.id,r.profession,r.district,.5).destination).toBe("public");}
  for(const r of workers){expect(["dock_worker","fisherman"]).toContain(r.profession);expect(scheduleAt(r.id,r.profession,r.district,.5).destination).toBe("home");}
  w.dispose();
},10000);
