import { expect,it } from "vitest";
import "fake-indexeddb/auto";
import v4Hashes from "./fixtures/generator-v4.json";
import { createGenerator,generateChunk } from "../src/world/generator";
import { createV5Generator } from "../src/world/generator-v5";
import { createV4Generator } from "../src/world/generator-v4";
import { World } from "../src/world/world";
import { B } from "../src/world/blocks";
import { BlockColumn } from "../src/world/sections";
import { footprintDistance,footprintsOverlap } from "../src/world/geography/geometry";
import { PANDA_PROTECTION,roadFootprint,nearestRoadPoint,roadElevation,type UrbanLot } from "../src/world/metropolis/plan";
import { contains,intersects } from "../src/world/city/plan";
import { collides,moveBody,type Body } from "../src/player/physics";
import { standAt,traversable,PathSearch } from "../src/game/navigation/pathfinder";
import { buildingPoint,residents } from "../src/game/professions";
import { freshWorld,writeSave,loadSave,validateSave } from "../src/persistence/saves";

const seed="jade-harbor",g=createV5Generator(seed),p=g.metropolis;
const area=(bounds:{x1:number;x2:number;z1:number;z2:number})=>({kind:"area" as const,bounds});
const seeds=[seed,"different-city","","长江玉港","panda",...Array.from({length:20},(_,i)=>`district-${i}`)];
async function digest(c:BlockColumn){
  const data=new Uint8Array(16*16*384*2),view=new DataView(data.buffer);let i=0;
  for(let y=-64;y<=319;y++)for(let z=0;z<16;z++)for(let x=0;x<16;x++){view.setUint16(i,c.get(x,y,z),true);i+=2;}
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256",data))].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function ensure(w:World,x:number,z:number,r=1){for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++)w.ensure(Math.floor(x/16)+dx,Math.floor(z/16)+dz,true);}
function local(l:UrbanLot,u:number,v:number){return l.facing===0?{x:l.x1+u,z:l.z1+v}:l.facing===1?{x:l.x2+1-v,z:l.z1+u}:l.facing===2?{x:l.x2+1-u,z:l.z2+1-v}:{x:l.x1+v,z:l.z2+1-u};}

it("freezes all 24 pre-overhaul v4 column hashes and leaves the original geography plan macro plan intact",async()=>{
  for(const f of v4Hashes)expect(await digest(generateChunk(f.cx,f.cz,f.seed,4)),JSON.stringify(f)).toBe(f.sha256);
  const old=createV4Generator(seed);expect(g.plan).toEqual(old.plan);expect(g.landmarks).toEqual(old.landmarks);
});
it("has ten structurally distinct districts with weighted heights, lot scales and roof/facade grammars",()=>{
  expect(p.districts).toHaveLength(10);expect(new Set(p.lots.map(l=>l.archetype)).size).toBeGreaterThanOrEqual(10);
  expect(new Set(p.lots.map(l=>l.roofFamily)).size).toBe(5);expect(new Set(p.lots.map(l=>l.facade)).size).toBe(5);
  const lots=(id:string)=>p.lots.filter(l=>l.districtId===id),mean=(ls:UrbanLot[],fn:(l:UrbanLot)=>number)=>ls.reduce((n,l)=>n+fn(l),0)/ls.length;
  expect(mean(lots("nightlife"),l=>l.floors)).toBeGreaterThan(3);expect(mean(lots("hutong"),l=>l.floors)).toBe(1);
  expect(mean(lots("imperial"),l=>(l.x2-l.x1)*(l.z2-l.z1))).toBeGreaterThan(mean(lots("market"),l=>(l.x2-l.x1)*(l.z2-l.z1))*8);
  expect(lots("market").filter(l=>l.archetype==="shophouse").length/lots("market").length).toBeGreaterThan(.5);
  expect(lots("harbor").filter(l=>l.archetype==="warehouse").length).toBeGreaterThanOrEqual(3);
  expect(lots("scholar").some(l=>l.archetype==="garden")).toBe(true);
  expect(lots("highland").some(l=>l.baseY>=32)).toBe(true);
  expect(new Set(p.roads.map(r=>r.kind)).size).toBeGreaterThanOrEqual(8);
});
it("keeps 25 seeds bounded, deterministic, overlap-free and clear of all landmark and approach reservations",()=>{
  const fingerprints=new Set<string>();
  for(const text of seeds){const a=createV5Generator(text),city=a.metropolis;
    fingerprints.add(JSON.stringify(city.lots.map(l=>[l.id,l.archetype,l.floors,l.roofFamily])));
    expect(city.lots.length).toBeLessThan(800);expect(city.roads.length).toBeLessThan(500);
    expect(city.roads.reduce((n,r)=>n+r.points.length,0)).toBeLessThan(12000);
    for(const d of city.districts)expect(city.lots.filter(l=>l.districtId===d.id).length,`${text}:${d.id}`).toBeGreaterThanOrEqual(d.id==="market"?20:2);
    for(let i=0;i<city.lots.length;i++){const lot=city.lots[i];
      expect(intersects(lot.envelope,PANDA_PROTECTION)).toBe(false);
      for(const other of city.lots.slice(i+1))expect(intersects(lot.envelope,other.envelope),`${lot.id}/${other.id}`).toBe(false);
      for(const r of a.landmarks.reservations)expect(footprintsOverlap(area(lot.envelope),r.footprint,r.margin),`${lot.id}/${r.id}`).toBe(false);
      for(const c of a.plan.connections)expect(footprintsOverlap(area(lot.envelope),{kind:"corridor",points:c.points,halfWidth:c.halfWidth}),`${lot.id}/${c.id}`).toBe(false);
      for(const road of city.roads.filter(r=>!r.owner))expect(footprintsOverlap(area(lot.envelope),roadFootprint(road)),`${lot.id}/${road.id}`).toBe(false);
      expect(city.roads.some(r=>r.owner===lot.id),`missing entrance ${text}:${lot.id}`).toBe(true);
    }
    for(const r of city.roads)for(const reserve of a.landmarks.reservations)expect(footprintsOverlap(roadFootprint(r),reserve.footprint,reserve.margin),`${r.id}/${reserve.id}`).toBe(false);
    for(const reserve of a.landmarks.reservations)expect(footprintsOverlap(area(city.gate),reserve.footprint,reserve.margin)).toBe(false);
    for(const lot of city.lots)expect(intersects(city.gate,lot.envelope)).toBe(false);
    expect(Math.max(...[...city.lotsByChunk.values()].map(a=>a.length))).toBeLessThan(12);
    expect(Math.max(...[...city.roadsByChunk.values()].map(a=>a.length))).toBeLessThan(32);
  }
  expect(fingerprints.size).toBe(seeds.length);
},30000);
it("connects every district and entrance to the core through a continuous road graph",()=>{
  const reached=new Set([p.roads.findIndex(r=>r.id==="lantern-south")]);let changed=true;
  while(changed){changed=false;for(let i=0;i<p.roads.length;i++)if(!reached.has(i)&&[...reached].some(j=>footprintsOverlap(roadFootprint(p.roads[i]),roadFootprint(p.roads[j])))){reached.add(i);changed=true;}}
  expect(p.roads.filter((_,i)=>!reached.has(i)).map(r=>r.id)).toEqual([]);
  for(const connector of p.connectors)expect(p.roads.some(r=>nearestRoadPoint(r,connector.point.x,connector.point.z).distance<=r.half),connector.district).toBe(true);
});
it("matches reverse generation order, fresh contexts and both sides of chunk boundaries in all districts",async()=>{
  const coords=p.districts.map(d=>{const l=p.lots.find(l=>l.districtId===d.id)!;return [Math.floor(l.x1/16),Math.floor(l.z1/16)] as const;});
  const a=createGenerator(seed,5),b=createGenerator(seed,5),hashes=new Map<string,string>();
  for(const [x,z] of coords)for(const dx of [0,1])hashes.set(`${x+dx},${z}`,await digest(a.generate(x+dx,z)));
  for(const [x,z] of coords.reverse())for(const dx of [1,0])expect(await digest(b.generate(x+dx,z))).toBe(hashes.get(`${x+dx},${z}`));
},20000);
it("preserves every Panda monument/plaza voxel and keeps its front approach dry",()=>{
  const a=new World(seed,{},false,4),b=new World(seed,{},false,5);
  for(let z=-71;z<=-27;z++)for(let x=-21;x<=21;x++){
    a.ensure(Math.floor(x/16),Math.floor(z/16),true);b.ensure(Math.floor(x/16),Math.floor(z/16),true);
    for(let y=20;y<=52;y++)expect(b.get(x,y,z),`${x},${y},${z}`).toBe(a.get(x,y,z));
  }
  for(let z=-26;z<=24;z++){ensure(b,0,z,0);expect(standAt(b,.5,z+.5,21)).not.toBeNull();}
  a.dispose();b.dispose();
},15000);
it("provides supported clear entrances for all lots and existing NPC home/work points",()=>{
  const w=new World(seed,{},false,5);
  for(const lot of p.lots){for(const v of [1,2]){const q=buildingPoint(lot,v);ensure(w,q.x,q.z);expect(collides(w,q),`${lot.id}:v${v}`).toBe(false);expect(standAt(w,q.x,q.z,q.y),lot.id).not.toBeNull();}}
  for(const npc of residents(seed,p.residentCity))for(const q of [npc.home,npc.workplace]){ensure(w,q.x,q.z);expect(collides(w,q),npc.name).toBe(false);expect(standAt(w,q.x,q.z,q.y)).not.toBeNull();}
  w.dispose();
},30000);
it("walks canal bridges at surface level while retaining water below and water-town doors above it",()=>{
  const w=new World(seed,{},false,5);
  for(const z of [-204,-160,-100,8,60,104,120]){
    ensure(w,144,z,1);let q={x:135.5,y:21.002,z:z+.5};
    for(let x=136;x<=158;x++){const next=standAt(w,x+.5,z+.5,q.y);expect(next,`${x},${z}`).not.toBeNull();expect(traversable(w,q,next!),`${x},${z}`).toBe(true);q=next!;}
    expect(w.get(144,19,z)).toBe(B.Water);expect(w.get(144,18,z)).toBe(B.Water);
  }
  expect(w.get(144,20,-176)).toBe(B.Air);w.dispose();
},10000);
it("finds existing NPC home-to-work routes with the unchanged navigation budget",()=>{
  const w=new World(seed,{},false,5);
  for(const npc of residents(seed,p.residentCity)){
    ensure(w,npc.home.x,npc.home.z,3);ensure(w,npc.workplace.x,npc.workplace.z,3);
    const search=new PathSearch(w,npc.home,npc.workplace);
    while(search.status==="searching")search.step(64);
    expect(search.status,npc.name).toBe("ready");
  }
  w.dispose();
},20000);
it("retains a walkable south gate and releases all v5 planner ownership on disposal",()=>{
  for(const text of [seed,"different-city","长江玉港"]){
    const w=new World(text,{},false,5);expect(w.planCount).toBe(1);expect(w.metropolisPlan).toBeDefined();
    for(let z=298;z<=311;z++){ensure(w,0,z,0);expect(standAt(w,.5,z+.5,21)).not.toBeNull();}
    ensure(w,-6,304,0);expect(w.get(-6,25,304)).toBe(B.Red);
    w.dispose();expect(w.planCount).toBe(0);expect(w.metropolisPlan).toBeUndefined();expect(w.cityPlan).toBeUndefined();
    w.ensure(0,19,true);expect(w.chunks.size).toBe(0);
  }
},15000);
it("traverses graded highland and harbor roads without full-block ascents or wet feet",()=>{
  const w=new World(seed,{},false,5);
  for(const road of p.roads.filter(r=>r.id==="highland-switchbacks"||r.id.startsWith("harbor-")||r.owner&&r.district==="highland")){
    let previous:ReturnType<typeof standAt>=null;
    for(let i=1;i<road.points.length;i++){
      const a=road.points[i-1],b=road.points[i],length=Math.hypot(b.x-a.x,b.z-a.z);
      for(let step=0;step<=Math.ceil(length);step++){
        const t=step/Math.ceil(length),x=Math.floor(a.x+(b.x-a.x)*t)+.5,z=Math.floor(a.z+(b.z-a.z)*t)+.5;
        ensure(w,x,z,0);const q=standAt(w,x,z,roadElevation(g.plan,road,x-.5,z-.5)+1.002);
        expect(q,`${road.id}@${x},${z}`).not.toBeNull();
        if(previous&&Math.hypot(q!.x-previous.x,q!.z-previous.z)<1.5)expect(Math.abs(q!.y-previous.y),`${road.id}@${x},${z}`).toBeLessThanOrEqual(.501);
        previous=q;
      }
    }
  }
  w.dispose();
},30000);
it("climbs the real generated interior switchback stairs in all four orientations",()=>{
  for(let facing=0;facing<4;facing++){
    const lot=p.lots.find(l=>l.facing===facing&&l.floors>=2&&["shophouse","merchant","mixed-use","water-house","hillside"].includes(l.archetype))!;
    expect(lot).toBeDefined();const w=new World(seed,{},false,5);ensure(w,(lot.x1+lot.x2)/2,(lot.z1+lot.z2)/2,2);
    const start=local(lot,1.5,2.3),body:Body={position:{...start,y:lot.baseY+1.002},velocity:{x:0,y:0,z:0},grounded:true,flying:false,fallStart:lot.baseY+1};
    for(const [u,v] of [[1.5,7.5],[3.5,7.5],[3.5,2.5]]){
      const target=local(lot,u,v);
      for(let t=0;t<160&&Math.hypot(body.position.x-target.x,body.position.z-target.z)>.08;t++){
        const dx=target.x-body.position.x,dz=target.z-body.position.z,length=Math.hypot(dx,dz);body.velocity={x:dx/length*2,y:-2,z:dz/length*2};moveBody(w,body,.04);
      }
    }
    expect(body.position.y,`${lot.id}:facing${facing}`).toBeGreaterThan(lot.baseY+5.8);w.dispose();
  }
},15000);
it("retains edits in all ten districts across eviction, database save, export/import and reload",async()=>{
  const meta={...freshWorld("Metropolis durability",seed,"creative"),generator:5},w=new World(seed,{},false,5);
  const edits=p.districts.map((d,i)=>({x:d.bounds.x1,y:i%2?-16:70,z:d.bounds.z1,value:i%2?B.Red:B.Air}));
  for(const q of edits){ensure(w,q.x,q.z,0);w.set(q.x,q.y,q.z,q.value);}
  const initial=await writeSave(meta),captured=w.captureChanges(),revision=await writeSave(meta,captured.chunks,initial);w.acknowledgeChanges(captured.revisions);w.stream(-10000,10000,0);
  for(const q of edits){ensure(w,q.x,q.z,0);expect(w.get(q.x,q.y,q.z)).toBe(q.value);}w.dispose();
  const exported=validateSave(JSON.parse(JSON.stringify(await loadSave(meta.id))));expect(exported.generator).toBe(5);expect(exported.revision).toBe(revision);
  const loaded=new World(seed,exported.edits,false,exported.generator);for(const q of edits){ensure(loaded,q.x,q.z,0);expect(loaded.get(q.x,q.y,q.z)).toBe(q.value);}loaded.dispose();
},10000);
