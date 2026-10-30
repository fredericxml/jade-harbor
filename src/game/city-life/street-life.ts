import type { Vec3 } from "../../core/coords";
import type { World } from "../../world/world";
import type { UrbanRoad, UrbanLot } from "../../world/metropolis/plan";
import { nearestRoadPoint } from "../../world/metropolis/plan";
import { cityElevation } from "../../world/geography/terrain";
import { inCity } from "../../world/city/plan";
import { buildingPoint, PROFESSIONS, type Profession } from "../professions";
import { identityHash } from "./schedules";
import type { Circuit, Routine } from "./presence";
import type { PopulationPlan, ResidentPlan } from "./population";

export const STREET_LIFE_BUDGET={residents:4000,active:96,saveEntities:4096} as const;
const near=(a:Vec3,b:Vec3)=>Math.hypot(a.x-b.x,a.z-b.z),cmp=(a:string,b:string)=>a<b?-1:a>b?1:0;
const WORKERS:Record<string,readonly Profession[]>={heritage:["merchant","attendant"],market:["merchant","chef"],hutong:["resident","carpenter"],"water-town":["fisherman","chef"],imperial:["attendant","guard"],harbor:["dock_worker","fisherman"],artisan:["potter","blacksmith","carpenter"],scholar:["scholar","caretaker"],nightlife:["chef","merchant","lantern_maker"],highland:["resident","guard"]};
const GIVEN=["An","Bai","Cheng","Fang","Guo","Han","Jing","Kai","Luo","Meng","Ning","Qian","Ren","Shan","Tian","Wen","Xiang","Yan","Zhi","Yu"];
const SURNAMES=["Chen","Lin","Wang","Zhao","Wu","Huang","He","Sun","Liu","Zhou","Xu","Liang"];
function samples(road:UrbanRoad,world:World) {
  const result:Vec3[]=[];let walked=0,next=0;
  const point=(x:number,y:number,z:number)=>({x:Math.floor(x)+.5,y:inCity(x,z)&&!road.owner?.startsWith("v7:")&&!road.owner?.startsWith("v8:")?cityElevation(world.macroPlan!,Math.floor(x))+1.002:Math.round(y*2)/2+1.002,z:Math.floor(z)+.5});
  for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(!length)continue;for(;next<=walked+length;next+=4){const t=(next-walked)/length;result.push(point(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,a.z+(b.z-a.z)*t));}walked+=length;}
  const p=road.points.at(-1)!;result.push(point(p.x,p.y,p.z));return result;
}
function lane(points:Vec3[],at:number,offset:number,world:World,road:UrbanRoad) {
  const a=points[Math.max(0,at-1)],b=points[Math.min(points.length-1,at+1)],n=near(a,b)||1,p=points[at];
  const q={...p,x:p.x-(b.z-a.z)/n*offset,z:p.z+(b.x-a.x)/n*offset};
  if(inCity(q.x,q.z)&&!road.owner?.startsWith("v7:")&&!road.owner?.startsWith("v8:"))q.y=cityElevation(world.macroPlan!,Math.floor(q.x))+1.002;
  return q;
}
function loop(points:Vec3[],at:number,reach:number,world:World,road:UrbanRoad) {
  const a=Math.max(0,at-reach),b=Math.min(points.length-1,at+reach),offset=Math.max(.65,Math.min(2,road.half-.7)),out:Vec3[]=[];
  for(let i=a;i<=b;i+=2)out.push(lane(points,i,offset,world,road));out.push(lane(points,b,offset,world,road));
  for(let i=b;i>=a;i-=2)out.push(lane(points,i,-offset,world,road));out.push(lane(points,a,-offset,world,road));return out;
}
/** New v8 street addresses augment, rather than replace, every released v7
 * identity. They are fixed to actual frontage, public routes and shared nodes;
 * player movement never creates a crowd or enlarges the finite registry. */
export function addStreetLife(world:World,old:PopulationPlan):PopulationPlan {
  const urban=world.metropolisPlan!,roads=urban.roads.filter(r=>!r.owner&&!r.id.startsWith("settlement:")),entry=new Map(urban.roads.filter(r=>r.owner).map(r=>[r.owner!,r]));
  const roadPoints=new Map(roads.map(r=>[r,samples(r,world)]));
  type Address={id:string;lot:UrbanLot;road:UrbanRoad;point:Vec3;at:number;hub:boolean;weight:number};
  const addresses:Address[]=[],claimed=new Set<string>();
  for(const road of roads) {
    const points=roadPoints.get(road)!;
    for(let at=2;at<points.length-1;at+=8) {
      const point=points[at],lots=urban.lots.filter(l=>Math.hypot((l.x1+l.x2)/2-point.x,(l.z1+l.z2)/2-point.z)<35).sort((a,b)=>Math.hypot(a.entrance.x-point.x,a.entrance.z-point.z)-Math.hypot(b.entrance.x-point.x,b.entrance.z-point.z)||cmp(a.id,b.id));
      const lot=lots[0];if(!lot)continue;
      const key=`${lot.districtId}:${Math.floor(point.x/24)}:${Math.floor(point.z/24)}:${Math.abs(points[at+1].x-points[at-1].x)>Math.abs(points[at+1].z-points[at-1].z)?"x":"z"}`;
      if(claimed.has(key))continue;claimed.add(key);
      addresses.push({id:`street8:${key}`,lot,road,point,at,hub:false,weight:["market","heritage","nightlife","water-town"].includes(lot.districtId)?5:4});
    }
  }
  for(const hub of old.presence?.neighborhoods.filter(n=>n.kind!=="street")??[]) {
    const point=hub.position,road=roads.filter(r=>r.district===hub.district||nearestRoadPoint(r,point.x,point.z).distance<2).sort((a,b)=>nearestRoadPoint(a,point.x,point.z).distance-nearestRoadPoint(b,point.x,point.z).distance||cmp(a.id,b.id))[0];if(!road)continue;
    const lot=urban.lots.filter(l=>l.districtId===hub.district).sort((a,b)=>near(buildingPoint(a,1),point)-near(buildingPoint(b,1),point)||cmp(a.id,b.id))[0];if(!lot)continue;
    const points=roadPoints.get(road)!,at=points.reduce((best,p,i)=>near(p,point)<near(points[best],point)?i:best,0);
    addresses.push({id:`meeting8:${hub.id}`,lot,road,point,at,hub:true,weight:8});
    if(hub.kind==="landing")for(const side of[-1,1]) {
      const landing=Math.max(0,Math.min(points.length-1,at+side*3)),p=points[landing];
      if(near(p,point)<5||addresses.some(a=>a.hub&&near(a.point,p)<5))continue;
      addresses.push({id:`meeting8:${hub.id}:landing:${side}`,lot,road,point:p,at:landing,hub:true,weight:8});
    }
  }
  for(const space of old.spaces) {
    const road=roads.filter(r=>r.district===space.district).sort((a,b)=>nearestRoadPoint(a,space.position.x,space.position.z).distance-nearestRoadPoint(b,space.position.x,space.position.z).distance||cmp(a.id,b.id))[0];if(!road)continue;
    const points=roadPoints.get(road)!,at=points.reduce((best,p,i)=>near(p,space.position)<near(points[best],space.position)?i:best,0),point=points[at];
    if(addresses.some(a=>a.hub&&near(a.point,point)<5))continue;
    const lot=urban.lots.filter(l=>l.districtId===space.district).sort((a,b)=>near(buildingPoint(a,1),point)-near(buildingPoint(b,1),point)||cmp(a.id,b.id))[0];if(!lot)continue;
    addresses.push({id:`meeting8:public:${space.id}`,lot,road,point,at,hub:true,weight:8});
  }
  addresses.sort((a,b)=>cmp(a.id,b.id));
  const residents=[...old.residents],allocation=new Map(addresses.map(a=>[a.id,0]));
  const visitorReserve=64+24,remaining=STREET_LIFE_BUDGET.residents-residents.length-visitorReserve;
  let used=0;
  const hubs=addresses.filter(a=>a.hub),reserved=Math.min(8,Math.max(2,Math.floor((remaining-(addresses.length-hubs.length)*2)/Math.max(1,hubs.length))));
  for(const a of hubs){allocation.set(a.id,reserved);used+=reserved;}
  // Broad civic frontage, graded hill streets and quays carry traffic as
  // well as home/entry visits. Reserve their real local roles before the
  // optional fourth person in an ordinary lane; the global/detail caps stay
  // unchanged. This is a street-use policy, independent of the observer.
  for(const a of addresses.filter(a=>!a.hub&&(a.road.kind==="hill-road"||a.road.kind==="quay"||a.lot.districtId==="imperial"&&a.road.kind==="ceremonial"))) {
    a.weight=6;allocation.set(a.id,6);used+=6;
  }
  const allocationOrder=[...addresses].sort((a,b)=>identityHash(a.id)-identityHash(b.id)||cmp(a.id,b.id));
  for(let round=0;round<8;round++)for(const a of allocationOrder)if(round<a.weight&&allocation.get(a.id)!<=round&&used<remaining){allocation.set(a.id,allocation.get(a.id)!+1);used++;}
  for(const a of addresses) {
    const points=roadPoints.get(a.road)!,access=entry.get(a.lot.id),path=access?samples(access,world):[{...a.lot.entrance,y:a.lot.baseY+1.002},a.point];
    const short=loop(points,a.at,a.hub?2:3,world,a.road),medium=loop(points,a.at,a.hub?4:7,world,a.road),home=buildingPoint(a.lot,1),focus=lane(points,a.at,Math.max(.65,a.road.half-1),world,a.road);
    for(let slot=0;slot<allocation.get(a.id)!;slot++) {
      const id=`inhabitant:${world.seed}:${a.id}:${slot}`,h=identityHash(id),routine:Routine=slot===0?"work":a.hub&&[2,3,6,7].includes(slot)||!a.hub&&slot===3?"social":slot===4&&["heritage","imperial","harbor","highland"].includes(a.lot.districtId)?"patrol":"circulation";
      const profession:Profession=routine==="work"?WORKERS[a.lot.districtId][h%WORKERS[a.lot.districtId].length]:routine==="patrol"?"guard":a.lot.districtId==="scholar"?"scholar":"resident";
      let circuitPoints:Vec3[],dwellPoints:number[]=[],dwell=2,socialFocus=focus;
      if(routine==="work") {circuitPoints=[buildingPoint(a.lot,2),...path,...short,...[...path].reverse(),home];dwellPoints=[0,path.length+1];dwell=a.lot.districtId==="harbor"?1.6:2.4;}
      else if(routine==="social") {socialFocus=slot>=6?lane(points,Math.min(points.length-1,a.at+1),Math.max(.65,a.road.half-1),world,a.road):focus;const side=slot%2?-.8:.8,meet={...socialFocus,x:socialFocus.x+side};if(inCity(meet.x,meet.z))meet.y=cityElevation(world.macroPlan!,Math.floor(meet.x))+1.002;circuitPoints=[...short,meet];dwellPoints=[circuitPoints.length-1];dwell=4.5;}
      else if(slot===1&&["market","nightlife","water-town","heritage"].includes(a.lot.districtId)) {
        const other=urban.lots.filter(l=>l.id!==a.lot.id&&l.districtId===a.lot.districtId&&Math.hypot(l.entrance.x-a.point.x,l.entrance.z-a.point.z)<25&&entry.has(l.id)).sort((l,r)=>Math.hypot(l.entrance.x-a.point.x,l.entrance.z-a.point.z)-Math.hypot(r.entrance.x-a.point.x,r.entrance.z-a.point.z)||cmp(l.id,r.id))[0];
        const second=other?samples(entry.get(other.id)!,world):[];
        circuitPoints=[buildingPoint(a.lot,2),...path,...short.slice(0,4),...[...second].reverse(),...(other?[buildingPoint(other,2)]:[]),...second,...medium.slice(-4),...[...path].reverse()];
        dwellPoints=[0,path.length+4+second.length+1];dwell=1.7;
      }else{circuitPoints=slot===2?short:medium;dwellPoints=routine==="patrol"?[0,Math.floor(medium.length/2)]:[];dwell=1.4;}
      const circuit:Circuit={points:circuitPoints,routine,dwell,focus:routine==="work"?buildingPoint(a.lot,3):routine==="social"?socialFocus:focus,dwellPoints,pace:routine==="work"?1.3:routine==="social"?1.45:routine==="patrol"?1.55:1.65+(h%4)*.08};
      const workplace=circuitPoints[h%circuitPoints.length];residents.push({id,name:`${GIVEN[h%GIVEN.length]} ${SURNAMES[Math.floor(h/GIVEN.length)%SURNAMES.length]} · ${PROFESSIONS[profession].label}`,profession,district:a.lot.districtId,home,workplace,workLoop:[workplace],public:a.point,legacy:false,neighborhood:a.id,circuit});
    }
  }
  for(const source of old.residents.filter(r=>r.landmark&&!r.neighborhood)) {
    const site=world.landmarkPlan!.sites.find(s=>s.id===source.landmark)!,approach=world.landmarkPlan!.approaches.filter(a=>a.site===site.id).sort((a,b)=>near(a.nodes.at(-1)!,site.entry)-near(b.nodes.at(-1)!,site.entry)||cmp(a.id,b.id))[0];
    const path=approach?.nodes.slice(-49).filter((_,i)=>i%4===0).map(p=>({x:p.x+.5,y:p.y+1.002,z:p.z+.5}))??[source.workplace];
    const route=[...path,...[...path].reverse()],local=source.workLoop;
    for(let slot=0;slot<8;slot++) {
      const id=`inhabitant:${world.seed}:site8:${site.id}:${slot}`,profession:Profession=slot===0?"guard":source.profession,h=identityHash(id),points=slot<2?route:site.id==="harbor-front"?Array.from({length:6},(_,i)=>({x:site.entry.x+(slot%2?8.5:-7.5),y:site.level+1.002,z:site.entry.z+5.5+(i<3?i:5-i)*3})): [...local,...[...local].reverse()];
      residents.push({...source,id,name:`${GIVEN[h%GIVEN.length]} ${SURNAMES[h%SURNAMES.length]} · ${PROFESSIONS[profession].label}`,profession,legacy:false,neighborhood:`site8:${site.id}`,workplace:points[h%points.length],circuit:{points,routine:slot===0?"patrol":"circulation",dwell:1.3,focus:source.workplace,dwellPoints:[0],pace:1.3+(slot%3)*.15}});
    }
  }
  // The protected monument court is a destination in its own right, rather
  // than an empty reservation whose residents all use the surrounding roads.
  // These fixed visits follow its clear perimeter, outside the editable plinth,
  // benches and planting. Homes still belong to accepted heritage residences.
  const monument=urban.panda,cx=(monument.x1+monument.x2)/2,cz=(monument.z1+monument.z2)/2;
  const courtLots=urban.lots.filter(l=>l.districtId==="heritage").sort((a,b)=>near(buildingPoint(a,1),{x:cx,y:21.002,z:cz})-near(buildingPoint(b,1),{x:cx,y:21.002,z:cz})||cmp(a.id,b.id));
  const perimeter:Vec3[]=[];
  for(let z=cz-15.5;z<=cz+18.5;z+=4)perimeter.push({x:cx-11.5,y:21.002,z});
  for(let x=cx-11.5;x<=cx+11.5;x+=4)perimeter.push({x,y:21.002,z:cz+18.5});
  for(let z=cz+18.5;z>=cz-15.5;z-=4)perimeter.push({x:cx+11.5,y:21.002,z});
  for(let x=cx+11.5;x>=cx-11.5;x-=4)perimeter.push({x,y:21.002,z:cz-15.5});
  for(let slot=0;slot<24;slot++) {
    const id=`inhabitant:${world.seed}:monument8:${slot}`,h=identityHash(id),profession:Profession=slot<2?"guard":slot<4?"attendant":slot%4===0?"scholar":"resident",home=buildingPoint(courtLots[slot%courtLots.length],1),points=slot%2?[...perimeter].reverse():[...perimeter],workplace=points[h%points.length];
    residents.push({id,name:`${GIVEN[h%GIVEN.length]} ${SURNAMES[Math.floor(h/GIVEN.length)%SURNAMES.length]} · ${PROFESSIONS[profession].label}`,profession,district:"heritage",home,workplace,workLoop:[workplace],public:workplace,legacy:false,neighborhood:"monument8:panda",circuit:{points,routine:slot<2?"patrol":"circulation",dwell:slot<4?2:3.5,focus:{x:cx,y:27,z:cz},dwellPoints:[8,14,22,28],pace:1.25+slot%5*.12}});
  }
  if(residents.length>STREET_LIFE_BUDGET.residents)throw Error("Street population budget exceeded");
  return{...old,residents,byId:new Map(residents.map(r=>[r.id,r])),presence:{active:STREET_LIFE_BUDGET.active,neighborhoods:[...(old.presence?.neighborhoods??[]),...addresses.map(a=>({id:a.id,district:a.lot.districtId,position:a.point,residents:allocation.get(a.id)!,kind:a.hub?"junction" as const:"street" as const}))]}};
}
