import { expect, it } from "vitest";
import "fake-indexeddb/auto";
import hashes from "./fixtures/generator-v6.json";
import { World } from "../src/world/world";
import { createV6Generator } from "../src/world/generator-v6";
import { Entities, spawnEntity, offersFor } from "../src/game/entities";
import { residents, PROFESSIONS } from "../src/game/professions";
import { Inventory } from "../src/game/inventory";
import { CITY_LIFE_BUDGET, createPopulation } from "../src/game/city-life/population";
import { CityLife, safeActivityPoint } from "../src/game/city-life/runtime";
import { scheduleAt, scheduleOffset } from "../src/game/city-life/schedules";
import { Discoveries, discoveryRegistry } from "../src/game/city-life/discoveries";
import { Navigation, PathSearch, standAt, traversable } from "../src/game/navigation/pathfinder";
import { activityRoute } from "../src/game/city-life/routes";
import { freshWorld, writeSave, loadSave, validateSave } from "../src/persistence/saves";
import { B } from "../src/world/blocks";
import { collides } from "../src/player/physics";
import type { Vec3 } from "../src/core/coords";
import { packed, stateOf } from "../src/core/coords";

const seed = "jade-harbor", hour = (h: number) => ((h - 6) / 24 + 1) % 1;
function ensure(w: World, p: Vec3, radius = 1) { for (let z = -radius; z <= radius; z++) for (let x = -radius; x <= radius; x++) w.ensure(Math.floor(p.x / 16) + x, Math.floor(p.z / 16) + z, true); }
function solve(w: World, a: Vec3, b: Vec3) {
  for (let z = Math.floor(Math.min(a.z,b.z)/16)-3; z <= Math.floor(Math.max(a.z,b.z)/16)+3; z++) for (let x = Math.floor(Math.min(a.x,b.x)/16)-3; x <= Math.floor(Math.max(a.x,b.x)/16)+3; x++) w.ensure(x,z,true);
  const search = new PathSearch(w,a,b); while (search.status === "searching") search.step(96); return search;
}
it("preserves forty pre-change full-height v6 column hashes", async () => {
  const contexts = new Map<string, ReturnType<typeof createV6Generator>>();
  for (const f of hashes) {
    let g = contexts.get(f.seed); if (!g) { g = createV6Generator(f.seed); contexts.set(f.seed,g); }
    const c = g.generate(f.cx,f.cz), bytes = new Uint8Array(16*16*384*2), view = new DataView(bytes.buffer); let offset = 0;
    for (let y=-64;y<=319;y++) for (let z=0;z<16;z++) for (let x=0;x<16;x++) { view.setUint16(offset,c.get(x,y,z),true); offset+=2; }
    const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))].map(v=>v.toString(16).padStart(2,"0")).join("");
    expect(digest,JSON.stringify(f)).toBe(f.sha256);
  }
},15000);
it("plans 36 deterministic distinct identities, retains the original ten and differentiates every district", () => {
  for (const text of [seed,"different-city","长江玉港"]) {
    const w=new World(text,{},false,6), p=createPopulation(w)!;
    expect(p).toEqual(createPopulation(w)); expect(p.residents).toHaveLength(36);
    expect(new Set(p.residents.map(r=>r.id)).size).toBe(36); expect(new Set(p.residents.map(r=>r.name)).size).toBe(36);
    expect(p.residents.filter(r=>r.legacy).map(({id,name,profession,home,workplace})=>({id,name,profession,home,workplace}))).toEqual(residents(text,w.cityPlan));
    expect(new Set(p.residents.map(r=>r.district)).size).toBe(10);
    expect(new Set(p.residents.filter(r=>r.landmark).map(r=>r.landmark)).size).toBe(8);
    for(const r of p.residents)expect(PROFESSIONS[r.profession]).toBeDefined();
    w.dispose();
  }
},15000);
it("uses the shared clock, all six phases, stable offsets and distinct guard/harbor/nightlife/weather schedules", () => {
  const phases=[7,9,12.5,15,18,23].map(h=>scheduleAt("sample","merchant","market",hour(h)).phase);
  expect(new Set(phases).size).toBe(6); expect(scheduleOffset("same")).toBe(scheduleOffset("same"));
  expect(new Set(Array.from({length:36},(_,i)=>scheduleOffset(`person${i}`))).size).toBeGreaterThan(25);
  expect(scheduleAt("guard","guard","imperial",hour(23)).activity).toBe("guarding");
  expect(scheduleAt("dock","dock_worker","harbor",hour(6)).destination).toBe("work");
  expect(scheduleAt("tea","chef","nightlife",hour(20)).destination).toBe("public");
  expect(scheduleAt("shop","merchant","market",hour(23)).destination).toBe("home");
  expect(scheduleAt("garden","scholar","scholar",hour(12.5),true).destination).toBe("work");
});
it("extends an old ten-resident v6 save once without resetting trades or resurrecting removed residents", () => {
  const w=new World(seed,{},false,6), old=residents(seed,w.cityPlan).map(r=>({...spawnEntity("villager",r.home,r.name),...r}));
  old[0].trades=7; old.splice(2,1);
  const e=new Entities(w,{entities:old,drops:[]});expect(e.list).toHaveLength(35); // 9 original + 26 new
  expect(e.list.find(q=>q.id===old[0].id)?.trades).toBe(7);
  expect(e.list.some(q=>q.id===`resident:${seed}:2`)).toBe(false);
  const removed=e.list.find(q=>q.id.startsWith("citizen:"))!.id;e.list=e.list.filter(q=>q.id!==removed);
  const resumed=new Entities(w,e.serialize());expect(resumed.list.some(q=>q.id===removed)).toBe(false);
  expect(new Set(resumed.list.map(q=>q.id)).size).toBe(resumed.list.length);
  e.dispose();resumed.dispose();w.dispose();
});
it("degrades to the original residents and no landmark discoveries in v3/v4/v5", () => {
  for(const version of [3,4,5]){const w=new World(seed,{},false,version),e=new Entities(w);
    expect(e.life).toBeUndefined();expect(e.list.filter(q=>q.kind==="villager")).toHaveLength(10);expect(discoveryRegistry(w)).toEqual([]);
    expect(validateSave({...freshWorld("old",seed,"creative"),generator:version,simulation:e.serialize()}).generator).toBe(version);
    e.dispose();w.dispose();}
});
for(const text of [seed,"different-city"])it(`assigns supported clear homes/work/local activities and bounded city commutes on ${text}`,()=>{
  const w=new World(text,{},false,6),p=createPopulation(w)!;
  for(const r of p.residents){
    for(const q of [r.home,r.workplace,...r.workLoop,r.public]){ensure(w,q);const safe=safeActivityPoint(w,q);expect(safe,`${r.name}@${JSON.stringify(q)}`).toBeDefined();expect(collides(w,safe!)).toBe(false);}
    for(const q of [r.home,r.workplace]){expect(standAt(w,q.x,q.z,q.y),`${r.name} raw home/work support`).not.toBeNull();expect(collides(w,q),`${r.name} raw home/work clearance`).toBe(false);}
    if(!r.landmark){const route=solve(w,r.home,r.workplace);expect(route.status,r.name).toBe("ready");expect(route.expanded).toBeLessThanOrEqual(2400);}
  }
  w.dispose();
},40000);
it("routes selected agents through every landmark, including pit, half steps, ridge and both tower interiors",()=>{
  const w=new World(seed,{},false,6),p=createPopulation(w)!,landmarks=w.landmarkPlan!;
  for(const r of p.residents.filter(r=>r.landmark)){
    const s=landmarks.sites.find(s=>s.id===r.landmark)!, entry={x:s.entry.x+.5,y:s.entry.y+1.002,z:s.entry.z+.5};
    const goals=[r.workplace,...r.workLoop];
    if(r.landmark==="archaeology")goals.push({x:s.publicSpaces[1].x+.5,y:s.publicSpaces[1].y+1.002,z:s.publicSpaces[1].z+.5});
    for(const goal of goals){
      const route=solve(w,entry,goal);expect(route.status,`${r.name}@${JSON.stringify(goal)}`).toBe("ready");
      for(let i=1;i<route.path.length;i++)expect(traversable(w,route.path[i-1],route.path[i]),r.name).toBe(true);
    }
  }
  w.dispose();
},30000);
it("physically moves a planned resident from home to work and changes activity when the clock changes",()=>{
  const w=new World(seed,{},false,6),r=createPopulation(w)!.residents.find(r=>!r.legacy&&r.district==="hutong")!;
  const route=solve(w,r.home,r.workplace);expect(route.status).toBe("ready");
  const entity={...spawnEntity("villager",r.home,r.name),id:r.id,profession:r.profession,workplace:r.workplace},es=new Entities(w,{entities:[entity],cityLifeVersion:1}),inv=new Inventory(),start={...entity.body.position};
  for(let n=0;n<1800;n++)es.tick(.05,r.workplace,inv,hour(9),false,()=>{},()=>{});
  expect(Math.hypot(entity.body.position.x-start.x,entity.body.position.z-start.z)).toBeGreaterThan(1);
  expect(es.life!.states.get(r.id)!.phase).toBe("morning");
  es.tick(.05,r.workplace,inv,hour(23),false,()=>{},()=>{});expect(es.life!.states.get(r.id)!.activity).toBe("sleeping");
  es.dispose();w.dispose();
},20000);
it("caps active residents, navigation jobs and event participants, then cleans transient state on rain/disposal",()=>{
  const w=new World(seed,{},false,6),es=new Entities(w),space=es.life!.plan!.spaces.find(s=>s.id==="panda-plaza")!;ensure(w,space.position,3);
  const people=es.list.filter(e=>e.kind==="villager");
  people.forEach((e,i)=>{e.body.position={...space.position,x:space.position.x-7+i%8*2,z:space.position.z+Math.floor(i/8)*2};});
  es.tick(.05,space.position,new Inventory(),hour(18),false,()=>{},()=>{});
  expect(es.life!.active.size).toBeLessThanOrEqual(16);expect(es.navigation.agents.size).toBeLessThanOrEqual(17);expect(es.navigation.expandedLastTick).toBeLessThanOrEqual(96);
  expect(es.life!.event?.participants.length).toBeGreaterThanOrEqual(2);expect(es.life!.event!.participants.length).toBeLessThanOrEqual(3);
  expect(new Set([...es.life!.event!.slots.values()].map(p=>`${p.x},${p.z}`)).size).toBe(es.life!.event!.participants.length);
  es.weather="rain";for(let i=0;i<22;i++)es.tick(.05,space.position,new Inventory(),hour(18),false,()=>{},()=>{});expect(es.life!.event).toBeUndefined();
  const life=es.life!;es.dispose();expect(life.plan).toBeUndefined();expect(life.states.size).toBe(0);expect(es.navigation.agents.size).toBe(0);w.dispose();
});
it("progresses an unloaded remote actor logically without generating chunks or teleporting a visible actor",()=>{
  const w=new World(seed,{},false,6),es=new Entities(w),r=es.life!.plan!.residents.find(r=>r.landmark==="imperial-complex")!,e=es.list.find(e=>e.id===r.id)!;
  ensure(w,r.workplace,2);e.body.position={x:900,y:21,z:900};const count=w.chunks.size,player={...r.workplace,z:r.workplace.z+25};
  es.tick(.05,player,new Inventory(),hour(9),false,()=>{},()=>{});expect(es.life!.metrics.relocations).toBe(1);expect(w.chunks.size).toBe(count);
  const before={...e.body.position};es.tick(.05,player,new Inventory(),hour(23),false,()=>{},()=>{});
  expect(Math.hypot(e.body.position.x-before.x,e.body.position.z-before.z)).toBeLessThan(1);expect(es.life!.metrics.relocations).toBe(1);
  es.dispose();w.dispose();
});
it("abandons edited/unreachable activity safely with bounded search and keeps save validation intact",()=>{
  const w=new World(seed,{},false,6),es=new Entities(w),r=es.life!.plan!.residents.find(r=>r.landmark==="imperial-complex")!,e=es.list.find(e=>e.id===r.id)!;ensure(w,r.workplace,2);
  e.body.position={...r.workplace};
  for(let z=-3;z<=3;z++)for(let x=-3;x<=3;x++)for(let y=0;y<4;y++)w.set(Math.floor(r.workplace.x)+x,Math.floor(r.workplace.y)+y,Math.floor(r.workplace.z)+z,B.Stone);
  for(let n=0;n<300;n++){es.tick(.05,r.workplace,new Inventory(),hour(9),false,()=>{},()=>{});expect(es.navigation.expandedLastTick).toBeLessThanOrEqual(96);}
  expect(validateSave({...freshWorld("edits",seed,"creative"),generator:6,simulation:es.serialize()}).generator).toBe(6);es.dispose();w.dispose();
});
it("records the sixteen original discoveries plus district entries once, requires walking and persists through DB/export/restart",async()=>{
  const w=new World(seed,{},false,6),flags=new Set<string>(["first-trade"]),book=new Discoveries(w,flags);
  expect(book.entries.filter(d=>!d.id.startsWith("discovery:district:"))).toHaveLength(16);
  expect(book.entries.filter(d=>d.id.startsWith("discovery:district:"))).toHaveLength(12);
  for(const d of book.entries){ensure(w,d.position);expect(standAt(w,d.position.x,d.position.z,d.position.y,false),d.id).not.toBeNull();
    expect(book.visit(d.position,false)).toBeUndefined();
    // A district-sized public zone can contain an original small discovery.
    // Drain co-located records while requiring each durable ID exactly once.
    const added=new Set<string>(),before=book.count;
    for(let i=0;i<=book.entries.length;i++){const found=book.visit(d.position,true);if(!found)break;expect(added.has(found.id)).toBe(false);added.add(found.id);}
    expect(book.has(d.id),d.id).toBe(true);expect(book.count-before).toBe(added.size);expect(book.visit(d.position,true)).toBeUndefined();}
  expect(book.count).toBe(28);
  const save=freshWorld("travel",seed,"adventure");save.achievements=[...flags];save.simulation={cityLifeVersion:1};await writeSave(save);
  const loaded=validateSave(JSON.parse(JSON.stringify(await loadSave(save.id)))),restored=new Discoveries(w,new Set(loaded.achievements));
  expect(restored.count).toBe(28);expect(restored.visit(book.entries[0].position,true)).toBeUndefined();expect(loaded.achievements).toContain("first-trade");
  book.dispose();restored.dispose();w.dispose();
},20000);
it("defaults old discovery state safely and rejects malformed new population metadata",()=>{
  const w=new World(seed,{},false,6),book=new Discoveries(w,new Set());expect(book.count).toBe(0);
  const old={...freshWorld("old",seed,"creative"),generator:6};expect(validateSave(old).simulation).toBeUndefined();
  const empty=new Entities(w,{entities:[],cityLifeVersion:1});expect(empty.life).toBeUndefined();expect(empty.serialize().cityLifeVersion).toBe(1);expect(empty.list).toEqual([]);empty.dispose();
  for(const value of [0,2,"1",{},null])expect(()=>validateSave({...old,simulation:{cityLifeVersion:value}})).toThrow();
  expect(validateSave({...old,simulation:{cityLifeVersion:1}}).simulation?.cityLifeVersion).toBe(1);book.dispose();w.dispose();
});
it("keeps profession offers within the existing trade catalog and gives new roles spatially distinct purposes",()=>{
  const w=new World(seed,{},false,6),es=new Entities(w);
  for(const e of es.list.filter(e=>e.kind==="villager"))for(const o of offersFor(e))expect(o.id).toBeLessThan(9);
  expect(es.life!.plan!.residents.find(r=>r.profession==="researcher")?.landmark).toBeDefined();
  expect(es.life!.plan!.residents.find(r=>r.profession==="caretaker")?.landmark).toBeDefined();
  expect(CITY_LIFE_BUDGET.visitors).toBe(0);es.dispose();w.dispose();
});
it("guides a canal commute through an existing bridge using short bounded voxel searches",()=>{
  const w=new World(seed,{},false,6),r=residents(seed,w.cityPlan).find(r=>r.profession==="fisherman")!,route=activityRoute(w,r.home,r.workplace);
  expect(route).toHaveLength(3);let from=r.home;
  for(const to of route){const search=solve(w,from,to);expect(search.status).toBe("ready");expect(search.expanded).toBeLessThanOrEqual(2400);from=to;}
  expect(w.get(144,19,-100)).toBe(B.Water);w.dispose();
},15000);
it("detects a stationary agent and bounds replans instead of retaining an ever-growing route",()=>{
  const w=new World(seed,{},false,6),from={x:-14.5,y:36.002,z:-425.5},to={x:14.5,y:36.002,z:-425.5};ensure(w,from,2);ensure(w,to,2);
  const nav=new Navigation(w);for(let n=0;n<600;n++){nav.steer("stuck",from,to,.05);nav.tick(96,100);expect(nav.expandedLastTick).toBeLessThanOrEqual(96);}
  expect(nav.searchesStarted).toBeGreaterThan(1);expect(nav.searchesStarted).toBeLessThan(20);expect(nav.agents.size).toBe(1);expect(nav.agents.get("stuck")!.path.length).toBeLessThanOrEqual(129);
  nav.removeMissing(new Set());expect(nav.agents.size).toBe(0);w.dispose();
});
it("lets two residents physically pass a shared two-part door without corrupting its state",()=>{
  const blocks=new Map<string,number>();
  const w={navRevision:0,get:(x:number,y:number,z:number)=>blocks.get(`${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`)??(Math.floor(y)===0?B.Stone:0),
    loaded:(x:number,z:number)=>Math.abs(x)<16&&Math.abs(z)<16,set(x:number,y:number,z:number,v:number){blocks.set(`${x},${y},${z}`,v);w.navRevision++;return true;}} as unknown as World;
  for(let z=-15;z<16;z++)for(let y=1;y<=3;y++)w.set(0,y,z,B.Stone);w.set(0,1,0,packed(B.Door,1));w.set(0,2,0,packed(B.Door,9));
  const actors=[-1.5,1.5].map((z,i)=>({...spawnEntity("villager",{x:-4.5,y:1.002,z},"Door visitor"),id:`door-${i}`,profession:"resident" as const,workplace:{x:5.5,y:1.002,z:.5}}));
  const es=new Entities(w,{entities:actors});for(let i=0;i<1000;i++)es.tick(.05,{x:0,y:1,z:0},new Inventory(),.24,false,()=>{},()=>{});
  expect(actors.every(e=>e.body.position.x>1)).toBe(true);expect(stateOf(w.get(0,1,0))&4).toBe(4);expect(stateOf(w.get(0,2,0))&12).toBe(12);es.dispose();
});
it("keeps gathering slots stable when participants change distance order",()=>{
  const w=new World(seed,{},false,6),es=new Entities(w),space=es.life!.plan!.spaces.find(s=>s.id==="panda-plaza")!;ensure(w,space.position,2);
  es.list=es.list.filter(e=>e.id.includes(":heritage:")).slice(0,3);
  es.list.forEach((e,i)=>{e.body.position={...space.position,x:space.position.x+(i+1)*2};});
  es.life!.prepare(es.list,space.position,hour(18),false,1,es.navigation);const first=[...es.life!.event!.slots].sort(([a],[b])=>a<b?-1:1);
  es.list.forEach((e,i)=>{e.body.position={...space.position,x:space.position.x+(3-i)*2};});
  es.life!.prepare(es.list,space.position,hour(18),false,3,es.navigation);expect([...es.life!.event!.slots].sort(([a],[b])=>a<b?-1:1)).toEqual(first);
  es.dispose();w.dispose();
});

it.each(["harbor-front","western-viewpoint"] as const)("physically reaches and leaves the %s upper floor without a clock loop reversing the trip",landmark=>{
  const w=new World(seed,{},false,6),r=createPopulation(w)!.residents.find(r=>r.landmark===landmark)!,site=w.landmarkPlan!.sites.find(s=>s.id===landmark)!;
  ensure(w,r.workplace,3);const actor={...spawnEntity("villager",r.workplace,r.name),id:r.id,profession:r.profession,home:r.home,workplace:r.workplace},es=new Entities(w,{entities:[actor],cityLifeVersion:1}),inv=new Inventory();let top=actor.body.position.y;
  for(let i=0;i<2400;i++){es.tick(.05,r.workplace,inv,hour(9)+i*.05/1200,false,()=>{},()=>{});top=Math.max(top,actor.body.position.y);}
  expect(top).toBeGreaterThanOrEqual(site.viewpoints[0].y+.9);
  for(let i=0;i<2000;i++)es.tick(.05,r.workplace,inv,hour(23),false,()=>{},()=>{});
  expect(actor.body.position.y).toBeLessThanOrEqual(r.workplace.y+1);expect(es.navigation.expandedLastTick).toBeLessThanOrEqual(96);es.dispose();w.dispose();
},20000);
