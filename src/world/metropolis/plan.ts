import { hash } from "../noise";
import { B } from "../blocks";
import { contains, intersects, inCity, type CityPlan, type Rect, type Structure } from "../city/plan";
import { footprintDistance, footprintsOverlap, type Footprint, type Point } from "../geography/geometry";
import type { MacroPlan } from "../geography/plan";
import type { LandmarkPlan } from "../geography/landmarks";
import { sampleTerrain, cityElevation } from "../geography/terrain";
import { DISTRICT_SPECS, FAMILY, districtSpec, type DistrictId, type DistrictSpec, type Archetype, type RoofFamily, type FacadeFamily, type Weights } from "./districts";
import { gradeRoads } from "./grading";

export type RoadClass = "ceremonial" | "boulevard" | "commercial" | "lane" | "market-alley" | "garden-path" | "quay" | "hill-road" | "approach";
export type UrbanRoad = Readonly<{ id: string; district: DistrictId; kind: RoadClass; points: readonly (Point & { y: number })[]; half: number; surface: number; lanternSpacing: number; owner?: string }>;
export type UrbanLot = Structure & { districtId: DistrictId; blockId: string; envelope: Rect; archetype: Archetype; roofFamily: RoofFamily; facade: FacadeFamily;
  balcony: boolean; arcade: boolean; corner: boolean; baseY: number; entrance: Point; greenery: boolean };
export type UrbanBlock = Readonly<{ id: string; district: DistrictId; bounds: Rect }>;
export type UrbanPlan = {
  seed: number; districts: readonly DistrictSpec[]; blocks: UrbanBlock[]; lots: UrbanLot[]; roads: UrbanRoad[]; canals: Rect[]; canalLink: Footprint;
  lotsByChunk: Map<string, UrbanLot[]>; roadsByChunk: Map<string, UrbanRoad[]>; connectors: { district: DistrictId; point: Point }[];
  diagnostics: Record<string, number>; panda: Structure; gate: Structure; residentCity: CityPlan;
};
const footprint = (r: Rect): Footprint => ({ kind: "area", bounds: r });
export const roadFootprint = (r: UrbanRoad): Footprint => ({ kind: "corridor", points: r.points, halfWidth: r.half });
export const PANDA_PROTECTION: Rect = { x1:-30,z1:-80,x2:30,z2:-18 };
export function nearestRoadPoint(r: UrbanRoad, x: number, z: number) {
  let distance = Infinity, result = { x:0,z:0,y:20 };
  for(let i=1;i<r.points.length;i++) {
    const a=r.points[i-1],b=r.points[i],dx=b.x-a.x,dz=b.z-a.z;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));
    const q={x:a.x+dx*t,z:a.z+dz*t,y:a.y+(b.y-a.y)*t}, d=Math.hypot(x-q.x,z-q.z);
    if(d<distance){distance=d;result=q;}
  }
  return { ...result, distance };
}
export function roadElevation(m: MacroPlan, r: UrbanRoad, x: number, z: number) {
  return inCity(x,z) ? cityElevation(m,x) : Math.round(nearestRoadPoint(r,x,z).y*2)/2;
}
function index<T>(items: readonly T[], bounds: (item:T)=>Rect): Map<string,T[]> {
  const result=new Map<string,T[]>();
  for(const item of items){const b=bounds(item);for(let z=Math.floor(b.z1/16);z<=Math.floor(b.z2/16);z++)for(let x=Math.floor(b.x1/16);x<=Math.floor(b.x2/16);x++){
    const key=`${x},${z}`,list=result.get(key)??[];list.push(item);result.set(key,list);
  }}return result;
}
export function roadBounds(r: UrbanRoad): Rect {
  const pad=r.half+3;return {x1:Math.min(...r.points.map(p=>p.x))-pad,x2:Math.max(...r.points.map(p=>p.x))+pad,z1:Math.min(...r.points.map(p=>p.z))-pad,z2:Math.max(...r.points.map(p=>p.z))+pad};
}
function pick<T>(choices: Weights<T>, n: number, previous: readonly T[]=[]): T {
  const weights=choices.map(([value,weight])=>[value,weight*(previous.includes(value)?.45:1)] as const),sum=weights.reduce((s,[,w])=>s+w,0);
  let t=n*sum;for(const [value,w] of weights){t-=w;if(t<=0)return value;}return weights.at(-1)![0];
}
export function createUrbanPlan(m: MacroPlan, landmarks: LandmarkPlan): UrbanPlan {
  const seed=m.seed, roads:UrbanRoad[]=[],lots:UrbanLot[]=[],blocks:UrbanBlock[]=[],diagnostics:Record<string,number>={};
  const reject=(reason:string)=>{diagnostics[reason]=(diagnostics[reason]??0)+1;};
  const blocked=(f:Footprint, margin=0)=>landmarks.reservations.some(r=>footprintsOverlap(f,r.footprint,r.margin+margin));
  const canals:Rect[]=[{x1:140,z1:-204,x2:148,z2:143},{x1:144,z1:-52,x2:306,z2:-44}];
  const link=m.connections.find(c=>c.id==="canal-link")!;
  const canalLink:Footprint={kind:"corridor",points:link.points,halfWidth:link.halfWidth};
  const addRoad=(id:string,district:DistrictId,kind:RoadClass,points:readonly Point[],half:number,owner?:string)=>{
    const spec=districtSpec(district),r:UrbanRoad={id,district,kind,points:points.map(p=>({...p,y:sampleTerrain(m,p.x,p.z).elevation})),half,
      surface:kind==="quay"?B.Planks:kind==="garden-path"?B.Gravel:spec.pavement,lanternSpacing:district==="nightlife"?16:district==="market"?20:32,owner};
    if(blocked(roadFootprint(r))||footprintsOverlap(roadFootprint(r),footprint(PANDA_PROTECTION))){reject("protected-road");return;}
    roads.push(r);
  };
  const p=(x:number,z:number):Point=>({x,z});
  // A connected city skeleton, with the monument's central body left untouched.
  addRoad("lantern-south","heritage","ceremonial",[p(0,-10),p(0,312)],5);
  addRoad("lantern-north","heritage","ceremonial",[p(0,-88),p(0,-376)],5);
  for(const z of [-216,-112,120,312])addRoad(`cross-${z}`,"heritage","boulevard",[p(-316,z),p(320,z)],4);
  for(const x of [-320,-84,100,320])addRoad(`ring-${x}`,"heritage","boulevard",[p(x,-320),p(x,312)],3);
  addRoad("plaza-west","heritage","ceremonial",[p(-40,-112),p(-40,120)],4);
  addRoad("plaza-east","heritage","ceremonial",[p(40,-112),p(40,120)],4);
  addRoad("plaza-south","heritage","ceremonial",[p(-84,48),p(100,48)],4);
  addRoad("plaza-east-cross","heritage","lane",[p(40,-56),p(100,-56)],3);
  addRoad("harbor-link","harbor","quay",[p(0,312),p(48,312),p(48,430),p(100,430)],4);
  addRoad("harbor-north-quay","harbor","quay",[p(48,340),p(176,340)],3);
  addRoad("harbor-east-quay","harbor","quay",[p(224,340),p(288,340)],3);
  addRoad("harbor-outer-quay","harbor","quay",[p(320,312),p(338,312),p(338,394),p(330,394)],3);
  addRoad("harbor-east-link","harbor","quay",[p(288,312),p(288,374),p(330,394)],3);
  addRoad("highland-switchbacks","highland","hill-road",[p(-224,-216),p(-224,-344),p(-310,-344),p(-310,-380),p(-224,-380),p(-224,-416),p(-310,-416),p(-310,-452),p(-224,-452)],3);
  addRoad("archaeology-approach","artisan","approach",[p(-320,120),p(-435,160)],3);
  addRoad("farm-approach","water-town","approach",[p(320,120),p(338,120),p(338,174)],2);
  addRoad("mine-approach","water-town","approach",[p(320,0),p(360,0)],3);
  addRoad("hutong-link","hutong","lane",[p(-84,-20),p(-310,-20)],2);
  addRoad("artisan-link","artisan","lane",[p(-84,186),p(-310,186)],3);
  addRoad("scholar-link","scholar","garden-path",[p(100,204),p(320,204)],2);
  addRoad("scholar-spine","scholar","garden-path",[p(200,120),p(200,296),p(320,296)],2);
  // District block partitions are finite and authored in world space, never per chunk.
  for(const d of DISTRICT_SPECS.filter(d=>!["harbor","highland","water-town","imperial","scholar"].includes(d.id))) {
    const cuts=(start:number,end:number,size:number,axis:number)=>{
      const values=[start];for(let n=1;start+n*size<end-20;n++){
        let value=start+n*size+(d.id==="market"?Math.floor(hash(n,axis,seed)*5)-2:0);
        const arterial=(axis===7?[-224,0,100]:[-216,-112,120,312]).find(a=>Math.abs(value-a)<=8);
        if(arterial!==undefined)value=arterial;values.push(value);
      }values.push(end);return [...new Set(values)].sort((a,b)=>a-b);
    };
    const xs=cuts(d.bounds.x1,d.bounds.x2,d.block[0],7),zs=cuts(d.bounds.z1,d.bounds.z2,d.block[1],19);
    const kind:RoadClass=d.id==="market"?"market-alley":d.id==="scholar"?"garden-path":d.id==="imperial"?"ceremonial":d.id==="nightlife"?"commercial":"lane";
    for(const x of xs)addRoad(`${d.id}:vertical:${x}`,d.id,kind,[p(x,d.bounds.z1),p(x,d.bounds.z2)],d.lane);
    for(let i=0;i<zs.length;i++) {
      const z=zs[i];
      // A staggered market cross street and bent garden path alter the grid rhythm.
      const bend=(d.id==="market"||d.id==="scholar")&&i>0&&i<zs.length-1?4:0;
      addRoad(`${d.id}:cross:${z}`,d.id,kind,[p(d.bounds.x1,z),p(Math.round((d.bounds.x1+d.bounds.x2)/2),z),p(Math.round((d.bounds.x1+d.bounds.x2)/2)+8,z+bend),p(d.bounds.x2,z+bend)],d.lane);
    }
    for(let iz=0;iz<zs.length-1;iz++)for(let ix=0;ix<xs.length-1;ix++)blocks.push({id:`${d.id}:${ix}:${iz}`,district:d.id,bounds:{x1:xs[ix],x2:xs[ix+1],z1:zs[iz],z2:zs[iz+1]}});
  }
  for(const x of [132,156,212,264,314])addRoad(`water-bank-${x}`,"water-town","lane",[p(x,-204),p(x,104)],2);
  for(const z of [-204,-160,-100,8,60,104])addRoad(`water-bridge-${z}`,"water-town","lane",[p(100,z),p(320,z)],2);
  // Water-facing rows follow the canal rather than generic inland house orientation.
  for(let z=-190;z<86;z+=36)for(const [x1,x2,facing] of [[110,124,1],[164,184,3],[222,244,3],[274,300,3]])
    blocks.push({id:`water-town:${x1}:${z}:${facing}`,district:"water-town",bounds:{x1,x2,z1:z,z2:z+23}});
  for(const [x1,z1,x2,z2] of [[110,320,142,331],[154,320,186,331],[202,320,234,331],[246,320,276,331],[301,322,328,343],[86,358,106,371],[302,352,326,367]])
    blocks.push({id:`harbor:${x1}:${z1}`,district:"harbor",bounds:{x1,z1,x2,z2}});
  for(const z of [-370,-406,-442])for(const x of [-296,-260])blocks.push({id:`highland:${x}:${z}`,district:"highland",bounds:{x1:x,z1:z,x2:x+27,z2:z+16}});
  for(const [x1,x2] of [[-68,-14],[14,86],[114,184],[210,300]])blocks.push({id:`imperial:${x1}`,district:"imperial",bounds:{x1,x2,z1:-306,z2:-246}});
  for(const [x1,z1,x2,z2] of [[114,218,178,286],[214,130,272,180],[284,130,308,190],[224,268,286,288]])blocks.push({id:`scholar:${x1}:${z1}`,district:"scholar",bounds:{x1,z1,x2,z2}});
  addRoad("imperial-forecourt","imperial","ceremonial",[p(-76,-236),p(314,-236)],5);
  roads.splice(0,roads.length,...gradeRoads(m,roads));
  const previous=new Map<DistrictId,{types:Archetype[];roofs:RoofFamily[];floors:number[]}>();
  const offer=(r:Rect,d:DistrictSpec,blockId:string,facing:number,corner=false)=>{
    if(lots.length>=800)throw Error("Metropolis lot budget exceeded");
    const envelope={x1:r.x1-2,z1:r.z1-2,x2:r.x2+2,z2:r.z2+2},f=footprint(envelope);
    if(blocked(f)||intersects(envelope,PANDA_PROTECTION,2)){reject("protected-lot");return;}
    if(m.connections.some(c=>footprintsOverlap(f,{kind:"corridor",points:c.points,halfWidth:c.halfWidth},1))){reject("reserved-route");return;}
    if(canals.some(c=>intersects(c,envelope,3))||roads.some(road=>footprintsOverlap(f,roadFootprint(road),.5))){reject("road-or-water");return;}
    if(lots.some(l=>intersects(l.envelope,envelope,1))){reject("neighbor");return;}
    const probes=[p(r.x1,r.z1),p(r.x2,r.z1),p(r.x1,r.z2),p(r.x2,r.z2),p((r.x1+r.x2)/2,(r.z1+r.z2)/2)];
    const samples=probes.map(q=>sampleTerrain(m,q.x,q.z));
    if(samples.some(t=>t.water)||!samples.some(t=>d.regions.includes(t.region))){reject("terrain-region");return;}
    const baseY=Math.round(samples[4].elevation);
    if(samples.some(t=>Math.abs(t.elevation-baseY)>(d.id==="highland"?8:d.id==="harbor"?6:3))||baseY>100){reject("terrain-support");return;}
    if(d.id==="highland"){
      const center=probes[4],near=roads.map(r=>({r,d:nearestRoadPoint(r,center.x,center.z).distance})).sort((a,b)=>a.d-b.d)[0].r;
      if(Math.abs(roadElevation(m,near,center.x,center.z)-baseY)>12){reject("terrain-access");return;}
    }
    if(inCity(r.x1,r.z1)&&inCity(r.x2,r.z2)&&samples.some(t=>t.elevation!==baseY)){reject("urban-ramp");return;}
    const n=Math.floor(hash(r.x1,r.z1,seed,131)*0x7fffffff),prev=previous.get(d.id)??{types:[],roofs:[],floors:[]};
    const archetype=pick(d.archetypes,hash(n,1,seed),prev.types),roofFamily=pick(d.roofs,hash(n,2,seed),prev.roofs),floors=pick(d.floors,hash(n,3,seed),prev.floors);
    const lot:UrbanLot={...r,envelope,id:`v5:${d.id}:${r.x1}:${r.z1}`,district:d.legacy,districtId:d.id,blockId,kind:FAMILY[archetype],archetype,
      facing,floors,roof:d.tile,roofFamily,facade:pick(d.facades,hash(n,4,seed)),style:n%5,seed:n,baseY,corner,
      balcony:hash(n,5,seed)<d.balcony,arcade:hash(n,6,seed)<d.arcade,greenery:hash(n,7,seed)<d.greenery,
      entrance:facing===0?p(Math.floor((r.x1+r.x2)/2),r.z1-1):facing===1?p(r.x2+1,Math.floor((r.z1+r.z2)/2)):facing===2?p(Math.floor((r.x1+r.x2)/2),r.z2+1):p(r.x1-1,Math.floor((r.z1+r.z2)/2))};
    lots.push(lot);previous.set(d.id,{types:[...prev.types.slice(-1),archetype],roofs:[roofFamily],floors:[floors]});
  };
  for(const block of blocks){const d=districtSpec(block.district),b=block.bounds;
    if(["water-town","harbor","highland","imperial","scholar"].includes(d.id)){
      const before=lots.length;
      offer(b,d,block.id,d.id==="water-town"?Number(block.id.split(":").at(-1)):d.id==="harbor"&&b.x1>=300?1:d.id==="imperial"||d.id==="harbor"&&b.z1<340?2:0);
      if(d.id==="highland"&&lots.length===before)offer({x1:b.x1+5,x2:b.x1+20,z1:b.z1+2,z2:b.z1+12},d,block.id,0);
      continue;
    }
    const inset=d.lane+d.setback+2,inner={x1:b.x1+inset,x2:b.x2-inset,z1:b.z1+inset,z2:b.z2-inset};
    if(["hutong","imperial","scholar","artisan"].includes(d.id)){
      const w=Math.min(inner.x2-inner.x1+1,d.frontage[1]),depth=Math.min(inner.z2-inner.z1+1,d.depth);
      if(w>=20&&depth>=20)offer({x1:inner.x1,x2:inner.x1+w-1,z1:inner.z1,z2:inner.z1+depth-1},d,block.id,0);continue;
    }
    const pairedDepth=Math.min(d.depth,Math.floor((inner.z2-inner.z1-7)/2));
    for(const facing of pairedDepth<10?[0]:[0,2])for(let x=inner.x1,slot=0;x+d.frontage[0]<=inner.x2;x+=0){
      const n=hash(x,b.z1+facing,seed),width=Math.min(inner.x2-x+1,Math.floor(d.frontage[0]+n*(d.frontage[1]-d.frontage[0]+1)));
      const depth=pairedDepth<10?Math.min(d.depth,inner.z2-inner.z1-5):pairedDepth;
      const bend=d.id==="market"&&pairedDepth<10&&x>(d.bounds.x1+d.bounds.x2)/2?4:0;
      const z1=facing===0?inner.z1+bend:inner.z2-depth+1;
      if(depth>=10&&hash(x,z1,seed+93)>d.openSpace)offer({x1:x,x2:x+width-1,z1,z2:z1+depth-1},d,block.id,facing,slot===0);
      x+=width+5;slot++;
    }
  }
  // Rugged seeds may reject the upper terraces. Small lower-edge parcels are
  // bounded fallback candidates, not a license to level an entire mountain.
  if(lots.filter(l=>l.districtId==="highland").length<2)for(const x of [-300,-274,-248])offer({x1:x,x2:x+16,z1:-338,z2:-330},districtSpec("highland"),`highland:lower:${x}`,0);
  // Every entrance has an explicit, indexed path to a street. Extra run on steep
  // terraces keeps steps at half-block increments without flattening the hillside.
  const streetRoads=[...roads];
  for(const lot of lots){
    const direction=[[0,-1],[1,0],[0,1],[-1,0]][lot.facing];
    let end:Point|undefined,target:UrbanRoad|undefined;
    for(let step=2;step<=64&&!end;step++){
      const q=p(lot.entrance.x+direction[0]*step,lot.entrance.z+direction[1]*step);
      const hit=streetRoads.find(r=>nearestRoadPoint(r,q.x,q.z).distance<=r.half);
      if(hit){end=q;target=hit;}
    }
    if(!end||!target){reject("entrance-without-street");continue;}
    const endY=roadElevation(m,target,end.x,end.z),start=lot.entrance;
    let points:Point[]=[start,end];
    const run=Math.hypot(end.x-start.x,end.z-start.z),extra=Math.ceil(Math.max(0,Math.abs(endY-lot.baseY)*2.1-run)/2);
    if(extra>0){const offset=extra+2,side={x:direction[1],z:-direction[0]};points=[start,p(start.x+direction[0]*2,start.z+direction[1]*2),p(start.x+direction[0]*2+side.x*offset,start.z+direction[1]*2+side.z*offset),p(end.x+side.x*offset,end.z+side.z*offset),end];}
    const lengths=points.slice(1).map((q,i)=>Math.hypot(q.x-points[i].x,q.z-points[i].z)),total=lengths.reduce((a,b)=>a+b,0);let walked=0;
    let access:UrbanRoad={id:`entry:${lot.id}`,district:lot.districtId,kind:"lane",half:1,surface:B.Paving,lanternSpacing:0,owner:lot.id,
      points:points.map((q,i)=>{if(i)walked+=lengths[i-1];return {...q,y:lot.baseY+(endY-lot.baseY)*walked/total};})};
    const conflict=(r:UrbanRoad)=>lots.some(other=>other!==lot&&footprintsOverlap(roadFootprint(r),footprint(other.envelope)))||blocked(roadFootprint(r))||footprintsOverlap(roadFootprint(r),footprint(PANDA_PROTECTION));
    if(conflict(access)&&extra>0)access={...access,points:access.points.map(q=>({...q,x:direction[0]===0?2*start.x-q.x:q.x,z:direction[1]===0?2*start.z-q.z:q.z}))};
    if(conflict(access)){reject("entrance-conflict");continue;}
    roads.push(access);
  }
  // Rejected access is a rejected parcel, never an occupied but unreachable home.
  const accessible=new Set(roads.map(r=>r.owner));
  for(let i=lots.length-1;i>=0;i--)if(!accessible.has(lots[i].id)){lots.splice(i,1);reject("inaccessible-lot");}
  const connectors=[{district:"heritage",point:p(0,48)},{district:"market",point:p(-84,-112)},{district:"hutong",point:p(-84,-20)},
    {district:"water-town",point:p(100,8)},{district:"imperial",point:p(0,-224)},{district:"harbor",point:p(48,340)},
    {district:"artisan",point:p(-84,186)},{district:"scholar",point:p(100,204)},{district:"nightlife",point:p(0,180)},{district:"highland",point:p(-224,-344)}] as {district:DistrictId;point:Point}[];
  const panda:Structure={x1:-21,z1:-71,x2:21,z2:-27,id:"v5:panda-plaza",kind:"panda-plaza",district:"Grand Lantern Avenue",facing:2,floors:1,roof:B.JadeRoof,style:0,seed,baseY:20};
  const lotsByChunk=index(lots,l=>l.envelope),roadsByChunk=index(roads,roadBounds);
  const gate:Structure={x1:-9,z1:301,x2:9,z2:307,id:"v5:south-gate",kind:"gate",district:"Grand Lantern Avenue",facing:0,floors:1,roof:B.JadeRoof,style:0,seed,baseY:20};
  const residentCity:CityPlan={seed,ox:0,oz:0,roads:[],structures:[panda,gate,...lots],byChunk:index<Structure>([panda,gate,...lots],s=>({x1:s.x1-3,z1:s.z1-3,x2:s.x2+3,z2:s.z2+3})),reservations:[PANDA_PROTECTION],parks:[],alleys:[]};
  return {seed,districts:DISTRICT_SPECS,blocks,lots,roads,canals,canalLink,lotsByChunk,roadsByChunk,connectors,diagnostics,panda,gate,residentCity};
}

export function urbanAt(p: UrbanPlan,x:number,z:number) {
  const key=`${Math.floor(x/16)},${Math.floor(z/16)}`,lot=p.lotsByChunk.get(key)?.find(l=>contains(l.envelope,x,z));
  let road:UrbanRoad|undefined,distance=Infinity;
  for(const r of p.roadsByChunk.get(key)??[]){const d=nearestRoadPoint(r,x,z).distance;if(d<=r.half&&d<distance){road=r;distance=d;}}
  const district=lot?districtSpec(lot.districtId):p.districts.find(d=>contains(d.bounds,x,z));
  return {lot,road,district,canal:p.canals.some(c=>contains(c,x,z))||footprintDistance(p.canalLink,x,z)<=0};
}
