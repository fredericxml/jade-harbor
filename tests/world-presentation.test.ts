import {beforeAll,afterAll,it,expect} from "vitest";
import * as THREE from "three";
import {B,block} from "../src/world/blocks";
import {World} from "../src/world/world";
import {journalPlaces,travelDestinations,travelUnlocked,travelColumns,safeTravelArrival} from "../src/game/city-life/travel";
import {discoveryRegistry} from "../src/game/city-life/discoveries";
import {Atmosphere} from "../src/render/atmosphere";
import {distantPlan,distantSurface,DistantWorld,DISTANT_RADIUS} from "../src/render/distant-world";
import frozenWorld from "./fixtures/generator-v10-world.json";
import discoveries from "./fixtures/journal-v9.json";
const worlds:World[]=[];
beforeAll(()=>{for(const seed of["jade-harbor","different-city"])worlds.push(new World(seed,{},false,10));});
afterAll(()=>worlds.forEach(w=>w.dispose()));
it("keeps every accepted generator and generation dependency byte-identical",async()=>{
 const raw=import.meta.glob<string>("../src/world/**/*.ts",{query:"?raw",import:"default",eager:true});expect(Object.keys(raw)).toHaveLength(Object.keys(frozenWorld).length);
 for(const[file,sha]of Object.entries(frozenWorld)){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(raw["../"+file]));expect([...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,"0")).join(""),file).toBe(sha);}
});
it.each([0,1])("projects all 33 discoveries into 18 unique area owners without orphans (%i)",i=>{
 const w=worlds[i],places=journalPlaces(w),hubs=travelDestinations(w);expect(places).toHaveLength(33);expect(hubs).toHaveLength(18);expect(new Set(hubs.map(h=>h.id)).size).toBe(18);expect(places.filter(p=>p.travelHub)).toHaveLength(18);
 expect(places.filter(p=>!hubs.some(h=>h.id===p.parentHubId))).toEqual([]);
 expect(hubs.flatMap(h=>h.discoveryIds).sort()).toEqual(places.map(p=>p.discoveryId).sort());
 expect(hubs.filter(h=>h.category==="district")).toHaveLength(10);expect(hubs.filter(h=>h.category==="region")).toHaveLength(5);
 expect(hubs.some(h=>h.id==="district:panda-plaza"||h.id==="district:avenue"||h.id.startsWith("walk:"))).toBe(false);
 if(i===0)expect(discoveryRegistry(w).map(({id,position,radius})=>({id,position,radius})).sort((a,b)=>a.id.localeCompare(b.id))).toEqual(discoveries.map(({id,position,radius})=>({id,position,radius})).sort((a,b)=>a.id.localeCompare(b.id)));
});
it("derives normal unlocks from every old member achievement without modifying progress",()=>{
 for(const w of worlds)for(const h of travelDestinations(w)){
  for(const mode of["creative","spectator"] as const)expect(travelUnlocked(h,mode,new Set())).toBe(true);
  for(const mode of["survival","adventure","hardcore"] as const){expect(travelUnlocked(h,mode,new Set())).toBe(false);for(const id of h.discoveryIds){const old=new Set([id]);expect(travelUnlocked(h,mode,old)).toBe(true);expect([...old]).toEqual([id]);}}
 }
 const hs=travelDestinations(worlds[0]);expect(hs.find(h=>h.id==="area:western-highlands")!.discoveryIds).toHaveLength(4);expect(hs.find(h=>h.id==="district:heritage")!.discoveryIds).toHaveLength(3);
});
it.each([0,1])("retains bounded safe primary/secondary hub arrivals (%i)",i=>{
 const w=worlds[i];for(const h of travelDestinations(w))for(const arrival of[h.arrival,h.fallback!]){
  expect(arrival,h.id).toBeDefined();const candidate={arrival};expect(travelColumns(candidate).length).toBeLessThanOrEqual(4);for(const c of travelColumns(candidate))w.ensure(c.cx,c.cz,true);expect(safeTravelArrival(w,candidate),h.id).toBeDefined();if(w.chunks.size>60)w.chunks.clear();
 }
},30000);
it("keeps atmosphere finite, cyclic and smooth through the complete day at all supported distances",()=>{
 const a=new Atmosphere(),identities=[a.zenith,a.horizon,a.fog,a.light,a.water,a.cloud],previous=new THREE.Color();let maxStep=0;
 for(const distance of[3,5,8])for(const rain of[false,true]){
  a.reset(0,rain,distance);previous.copy(a.zenith);
  for(let i=1;i<=2400;i++){a.update(i/2400,rain,false,distance,.05);for(const c of identities)expect([c.r,c.g,c.b].every(v=>Number.isFinite(v)&&v>=0&&v<=1.01)).toBe(true);maxStep=Math.max(maxStep,Math.abs(a.zenith.r-previous.r),Math.abs(a.zenith.g-previous.g),Math.abs(a.zenith.b-previous.b));previous.copy(a.zenith);expect(a.fogNear).toBeGreaterThan(20);expect(a.fogFar).toBeGreaterThan(a.fogNear+100);}
 }
 expect(maxStep).toBeLessThan(.015);[a.zenith,a.horizon,a.fog,a.light,a.water,a.cloud].forEach((c,i)=>expect(c).toBe(identities[i]));
 a.reset(.93,false);const before=a.zenith.clone();a.update(.93,true,false,5,1/60);expect(a.rain).toBeGreaterThan(0);expect(a.rain).toBeLessThan(.01);expect(Math.abs(a.zenith.r-before.r)+Math.abs(a.zenith.g-before.g)+Math.abs(a.zenith.b-before.b)).toBeLessThan(.01);
 a.update(.8,true,true,5,.05);expect(a.daylight).toBe(1);expect(a.ambient).toBe(2.05);
 a.update(NaN,false,false,NaN,NaN);expect(Number.isFinite(a.fogFar+a.zenith.r+a.sunDirection.y)).toBe(true);
});
it("builds deterministic bounded plan-derived silhouettes without changing authoritative state",()=>{
 const w=worlds[0],before={chunks:w.chunks.size,edits:w.edits.size,revision:w.navRevision},p=distantPlan(w)!;
 expect(p).toEqual(distantPlan(w));expect(p.width).toBeLessThanOrEqual(128);expect(p.depth).toBeLessThanOrEqual(128);expect(p.boxes.length).toBeGreaterThan(100);expect(p.boxes.length).toBeLessThanOrEqual(1500);expect(p.boxes.every(b=>[b.x,b.y,b.z,b.w,b.h,b.d,b.yaw].every(Number.isFinite))).toBe(true);
 expect(p.boxes.some(b=>b.id.startsWith("imperial-complex"))).toBe(true);expect(p.boxes.some(b=>b.id.startsWith("harbor-front"))).toBe(true);expect(p.boxes.some(b=>b.id.startsWith("western-viewpoint"))).toBe(true);expect(p.boxes.some(b=>b.id.startsWith("ridge:"))).toBe(true);
 expect({chunks:w.chunks.size,edits:w.edits.size,revision:w.navRevision}).toEqual(before);expect(distantPlan(worlds[1])).not.toEqual(p);expect(DISTANT_RADIUS).toBeLessThan(960);
});
it("supports raised skyline bodies down to the actual coarse terrain without white foundation walls",()=>{
 const w=worlds[0],plan=distantPlan(w)!;
 for(const b of plan.boxes.filter(b=>b.id.startsWith("crown:")&&b.id.includes(":body:")||b.id.endsWith(":body:0"))){
   const f=plan.boxes.find(f=>f.id===b.id.replace(/:body:\d+$/,":foundation"));expect(f,b.id).toBeDefined();
   expect(f!.y+f!.h/2).toBeGreaterThanOrEqual(b.y-b.h/2);
   for(const x of [b.x-b.w/2,b.x,b.x+b.w/2])for(const z of [b.z-b.d/2,b.z,b.z+b.d/2]){
     const gx=Math.floor(x/16)*16,gz=Math.floor(z/16)*16,tx=(x-gx)/16,tz=(z-gz)/16;
     const [a,c,d,e]=[[0,0],[16,0],[0,16],[16,16]].map(([dx,dz])=>distantSurface(w,gx+dx,gz+dz));
     const ground=tx+tz<=1?a*(1-tx-tz)+c*tx+d*tz:c*(1-tz)+d*(1-tx)+e*(tx+tz-1);
     expect(f!.y-f!.h/2,b.id).toBeLessThanOrEqual(ground+.01);
   }
 }
 expect(plan.boxes.filter(b=>b.id.endsWith(":foundation")).every(b=>b.color===block(B.SculptureStone).color)).toBe(true);
});
it("suppresses detailed sections including empty edits, releases coverage on eviction, and disposes every resource",()=>{
 const w=worlds[0],a=new Atmosphere(),lod=new DistantWorld(w,a),before={chunks:w.chunks.size,edits:w.edits.size,revision:w.navRevision};let revision=1;
 for(let i=0;i<512&&!lod.stats.ready;i++)lod.update({x:0,y:90,z:0},new Set(),a,revision);
 expect(lod.stats.ready).toBe(true);expect(lod.stats.terrainTriangles).toBeLessThanOrEqual(32768);expect(lod.stats.anchorTriangles).toBeLessThan(18001);expect(lod.group.children).toHaveLength(2);
 const rendered=new Set(["0,1,0"]);lod.update({x:0,y:90,z:0},rendered,a,++revision);expect(lod.coverage.filter(n=>n>0)).toHaveLength(1);
 // Coverage is a meshed-section fact, so a deliberately cleared/empty edit
 // stays suppressed too; an eviction or vertical deferral releases it.
 lod.update({x:0,y:90,z:0},rendered,a,revision);expect(lod.coverage.filter(n=>n>0)).toHaveLength(1);lod.update({x:0,y:90,z:0},new Set(),a,++revision);expect(lod.coverage.some(n=>n>0)).toBe(false);
 let geometries=0,materials=0,textures=0;lod.group.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.addEventListener("dispose",()=>geometries++);});lod.material.addEventListener("dispose",()=>materials++);lod.texture.addEventListener("dispose",()=>textures++);lod.dispose();lod.dispose();expect([geometries,materials,textures]).toEqual([2,1,1]);expect(lod.group.children).toHaveLength(0);expect(lod.stats.ready).toBe(false);expect({chunks:w.chunks.size,edits:w.edits.size,revision:w.navRevision}).toEqual(before);
});
it("treats known air as empty when detail is rendered, so coarse slopes cannot fill cliff cutouts",()=>{
 const w=new World("jade-harbor",{},false,10);w.ensure(0,0,true);const a=new Atmosphere(),lod=new DistantWorld(w,a),p=lod.plan!,x=-p.originX/16,z=-p.originZ/16,sky=x+(z+(19+4)*128)*128;
 expect(w.chunks.get("0,0")!.blocks.sections.has(19)).toBe(false);const revision=w.navRevision;
 lod.update({x:0,y:90,z:0},new Set(["0,1,0"]),a,1);expect(lod.coverage[sky]).toBe(255);
 lod.update({x:0,y:90,z:0},new Set(),a,2);expect(lod.coverage[sky]).toBe(0);expect(w.navRevision).toBe(revision);lod.dispose();w.dispose();
});
it("degrades old supported worlds to their own plans, with no v10 anchor in v3",()=>{
 for(const version of[3,4,5,6,7,8,9] as const){const w=new World("jade-harbor",{},false,version),p=distantPlan(w);if(version===3)expect(p).toBeUndefined();else{expect(p).toBeDefined();if(version<6)expect(p!.boxes).toHaveLength(0);expect(journalPlaces(w).length).toBe(version>=9?33:version>=6?28:0);expect(travelDestinations(w).length).toBe(version>=9?18:version>=6?13:0);}w.dispose();}
});
