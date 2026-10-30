import { B } from "../blocks";
import { hash } from "../noise";
import { contains, intersects, inCity, type Rect, type Structure } from "../city/plan";
import type { MacroPlan } from "../geography/plan";
import type { LandmarkPlan } from "../geography/landmarks";
import type { RealizationPlan } from "../landmarks/types";
import { footprintsOverlap, type Footprint, type Point } from "../geography/geometry";
import { cityElevation, sampleTerrain } from "../geography/terrain";
import { FAMILY, districtSpec, type DistrictId, type Archetype } from "./districts";
import { nearestRoadPoint, roadBounds, roadElevation, type UrbanLot, type UrbanPlan, type UrbanRoad } from "./plan";
import { INTENTIONAL_OPEN_SPACES, type DensityPlan } from "./density";
import { designBuildings, type BuildingDesign } from "./variety";

export const FABRIC_LIMITS={lots:2000,candidates:120000,maxCut:7,maxFill:10,entryLength:38} as const;
export type FabricPlan=DensityPlan&{previousUrban:UrbanPlan;designs:Map<string,BuildingDesign>;newLots:UrbanLot[];settlements:{site:string;lots:number}[]};
type Segment={road:UrbanRoad;a:Point&{y:number};b:Point&{y:number};bounds:Rect};
type Anchor={road:UrbanRoad;x:number;z:number;tx:number;tz:number;district:DistrictId;station:number};
const cmp=(a:string,b:string)=>a<b?-1:a>b?1:0;
const area=(bounds:Rect):Footprint=>({kind:"area",bounds});
const expand=(r:Rect,n:number):Rect=>({x1:r.x1-n,x2:r.x2+n,z1:r.z1-n,z2:r.z2+n});
const size=(r:Rect)=>(r.x2-r.x1+1)*(r.z2-r.z1+1);
function keys(r:Rect){const a:string[]=[];for(let z=Math.floor(r.z1/16);z<=Math.floor(r.z2/16);z++)for(let x=Math.floor(r.x1/16);x<=Math.floor(r.x2/16);x++)a.push(`${x},${z}`);return a;}
function index<T>(map:Map<string,T[]>,r:Rect,v:T){for(const k of keys(r)){const a=map.get(k)??[];a.push(v);map.set(k,a);}}
function query<T>(map:Map<string,T[]>,r:Rect){const a=new Set<T>();for(const k of keys(r))for(const v of map.get(k)??[])a.add(v);return a;}
const segmentFootprint=(s:Segment):Footprint=>({kind:"corridor",points:[s.a,s.b],halfWidth:s.road.half});

/** V8 packs the remaining frontage and usable block interiors. The v7 plan is
 * retained separately for released resident addresses and frozen reconstruction.
 * A candidate is never accepted without a clear, short connection to a real
 * public route; no per-chunk random placement or neighboring generation occurs. */
export function createFabricPlan(m:MacroPlan,reservations:LandmarkPlan,realized:RealizationPlan,previous:DensityPlan):FabricPlan {
  const old=previous.urban,newLots:UrbanLot[]=[],newLinks:UrbanRoad[]=[],allLots=old.lots.map(l=>({...l,envelope:expand(l,1)}));
  // Several minor streets paralleled a major avenue only 18–24 blocks away.
  // Their old 5–9-block paving consumed most of the intervening block. Retain
  // connected centerlines as intimate lanes; civic axes, boulevards, canal
  // bridges, quays and graded hill roads keep their existing clear widths.
  const allRoads=old.roads.map(r=>!r.owner&&["lane","market-alley","commercial","garden-path"].includes(r.kind)&&!r.id.startsWith("water-bridge-")?{...r,half:Math.min(r.half,r.kind==="market-alley"?1.1:1.5)}:r),diagnostics:Record<string,number>={candidates:0};
  const major=allRoads.filter(r=>!r.owner&&["ceremonial","boulevard","quay"].includes(r.kind));
  for(let i=0;i<allRoads.length;i++) {
    const r=allRoads[i];if(r.owner||!["lane","commercial","market-alley"].includes(r.kind)||r.id.startsWith("water-bridge-"))continue;
    const a=r.points[0],b=r.points.at(-1)!,length=Math.hypot(b.x-a.x,b.z-a.z);if(length<24)continue;
    const target=major.find(other=>{
      const c=other.points[0],d=other.points.at(-1)!,n=Math.hypot(d.x-c.x,d.z-c.z)||1;
      if(Math.abs((b.x-a.x)*(d.z-c.z)-(b.z-a.z)*(d.x-c.x))/(length*n)>.05)return false;
      return[a,r.points[Math.floor(r.points.length/2)],b].every(p=>{const q=nearestRoadPoint(other,p.x,p.z);return q.distance>.1&&q.distance<=10&&Math.abs(q.y-p.y)<.51;});
    });
    if(target){allRoads[i]={...r,points:r.points.map(p=>{const q=nearestRoadPoint(target,p.x,p.z);return{x:Math.round(q.x),y:q.y,z:Math.round(q.z)};})};diagnostics.mergedParallelLanes=(diagnostics.mergedParallelLanes??0)+1;}
  }
  const lotIndex=new Map<string,UrbanLot[]>(),segments=new Map<string,Segment[]>();
  for(const lot of allLots)index(lotIndex,lot.envelope,lot);
  const addRoad=(road:UrbanRoad)=>{for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],pad=road.half+.5,bounds={x1:Math.min(a.x,b.x)-pad,x2:Math.max(a.x,b.x)+pad,z1:Math.min(a.z,b.z)-pad,z2:Math.max(a.z,b.z)+pad};index(segments,bounds,{road,a,b,bounds});}};
  for(const road of allRoads)addRoad(road);
  // Full approach corridors carry small service settlements too; a final tail
  // alone left long developed journeys empty between the city and destination.
  for(const a of realized.approaches.filter(a=>a.nodes.length>8&&!a.id.includes("stairs")&&!a.id.includes("steps"))) {
    const site=realized.sites.find(s=>s.id===a.site)!,district:DistrictId=site.id==="imperial-complex"?"imperial":site.id==="harbor-front"?"harbor":site.id==="archaeology"?"artisan":site.id==="scenic-landscape"?"scholar":"highland";
    const road:UrbanRoad={id:`v8:settlement:${a.site}:${a.id}`,district,kind:"approach",points:a.nodes.filter((_,i)=>i%4===0||i===a.nodes.length-1),half:a.half,surface:a.surface,lanternSpacing:0};
    allRoads.push(road);addRoad(road);
  }
  const reject=(why:string)=>{diagnostics[why]=(diagnostics[why]??0)+1;return false;};
  const protectedAt=(r:Rect)=>{
    const f=area(r);
    return INTENTIONAL_OPEN_SPACES.some(s=>intersects(r,s.bounds))||reservations.reservations.some(s=>footprintsOverlap(f,s.footprint,s.margin))||
      m.connections.some(c=>footprintsOverlap(f,{kind:"corridor",points:c.points,halfWidth:c.halfWidth},.25))||old.canals.some(c=>intersects(r,c,1))||footprintsOverlap(f,old.canalLink,.5)||
      [...query(realized.byChunk,r)].some(c=>intersects(r,c.bounds,.5))||intersects(r,expand(old.gate,2));
  };
  const entrance=(r:Rect,facing:number)=>facing===0?{x:Math.floor((r.x1+r.x2)/2),z:r.z1-1}:facing===1?{x:r.x2+1,z:Math.floor((r.z1+r.z2)/2)}:facing===2?{x:Math.floor((r.x1+r.x2)/2),z:r.z2+1}:{x:r.x1-1,z:Math.floor((r.z1+r.z2)/2)};
  // Released parcel buffers described a sparse layout, not a permanent v8
  // exclusion zone. Widen both sides symmetrically and deepen the rear while
  // retaining the exact doorway center and original home/work aisle. Actual
  // one-block roof envelopes, public routes and support still bound every step.
  for(let round=0;round<12;round++)for(const lot of allLots)for(const mode of round<4?["width","depth","front"]:round<7?["width","depth"]:["depth"]) {
    if(mode==="front"){const access=allRoads.find(r=>r.owner===lot.id);if(access&&access.points.some(p=>Math.abs(p.y-lot.baseY)>.51))continue;}
    const r={x1:lot.x1,x2:lot.x2,z1:lot.z1,z2:lot.z2};
    if(mode==="width"){if(lot.facing%2){r.z1--;r.z2++;}else{r.x1--;r.x2++;}}
    else if(mode==="front"){if(lot.facing===0)r.z1--;else if(lot.facing===1)r.x2++;else if(lot.facing===2)r.z2++;else r.x1--;}
    else if(lot.facing===0)r.z2++;else if(lot.facing===1)r.x1--;else if(lot.facing===2)r.z1--;else r.x2++;
    const envelope=expand(r,1),f=area(envelope);
    if(protectedAt(envelope)||[...query(lotIndex,envelope)].some(l=>l!==lot&&intersects(envelope,l.envelope)))continue;
    if([...query(segments,envelope)].some(s=>s.road.owner!==lot.id&&footprintsOverlap(f,segmentFootprint(s),.1)))continue;
    const supported=[[r.x1,r.z1],[r.x2,r.z1],[r.x1,r.z2],[r.x2,r.z2]].every(([x,z])=>{const t=inCity(x,z)?{height:cityElevation(m,x),water:false}:sampleTerrain(m,x,z);return(!t.water||lot.districtId==="harbor")&&lot.baseY-t.height<=FABRIC_LIMITS.maxFill&&t.height-lot.baseY<=FABRIC_LIMITS.maxCut;});
    if(!supported)continue;
    Object.assign(lot,r,{envelope,entrance:entrance(r,lot.facing)});index(lotIndex,envelope,lot);diagnostics.expansions=(diagnostics.expansions??0)+1;
  }
  lotIndex.clear();for(const lot of allLots)index(lotIndex,lot.envelope,lot);
  const reshaped=new Map(allLots.map(l=>[l.id,l]));
  for(let i=0;i<allRoads.length;i++){const r=allRoads[i],lot=r.owner?reshaped.get(r.owner):undefined;if(lot)allRoads[i]={...r,points:[{...lot.entrance,y:lot.baseY},...r.points.slice(1)]};}
  segments.clear();for(const r of allRoads)addRoad(r);
  function offer(r:Rect,district:DistrictId,facing:number,parent:UrbanRoad,block:string) {
    if(diagnostics.candidates>=FABRIC_LIMITS.candidates||allLots.length>=FABRIC_LIMITS.lots)return false;
    diagnostics.candidates++;
    const envelope=expand(r,1),f=area(envelope);
    if([...query(lotIndex,envelope)].some(l=>intersects(envelope,l.envelope)))return reject("parcel");
    if(protectedAt(envelope))return reject("protected");
    if([...query(segments,envelope)].some(s=>footprintsOverlap(f,segmentFootprint(s),.1)))return reject("route");
    const entry=entrance(r,facing),q=nearestRoadPoint(parent,entry.x,entry.z);
    if(q.distance>FABRIC_LIMITS.entryLength)return reject("entry-distance");
    const baseY=Math.round(inCity(entry.x,entry.z)&&!parent.owner?.startsWith("v7:")&&!parent.owner?.startsWith("v8:")?cityElevation(m,entry.x):q.y);
    const probes=[[envelope.x1,envelope.z1],[envelope.x2,envelope.z1],[envelope.x1,envelope.z2],[envelope.x2,envelope.z2],[(r.x1+r.x2)/2,(r.z1+r.z2)/2]];
    const samples=probes.map(([x,z])=>inCity(x,z)?{height:cityElevation(m,x),water:false}:sampleTerrain(m,x,z));
    const stilt=district==="harbor"&&samples.some(t=>t.water);
    if(baseY>165||samples.some(t=>t.water&&!stilt||baseY-t.height>FABRIC_LIMITS.maxFill||t.height-baseY>FABRIC_LIMITS.maxCut))return reject("terrain");
    const id=`v8:${district}:${r.x1}:${r.z1}`,link:UrbanRoad={id:`entry:${id}`,owner:id,district,kind:"lane",points:[{...entry,y:baseY},{x:Math.round(q.x),z:Math.round(q.z),y:Math.round(q.y*2)/2}],half:.65,surface:stilt?B.Planks:B.Paving,lanternSpacing:0};
    const lf:Footprint={kind:"corridor",points:link.points,halfWidth:link.half};
    if([...query(lotIndex,roadBounds(link))].some(l=>footprintsOverlap(lf,area(l.envelope),.15)))return reject("entry-blocked");
    if(reservations.reservations.some(s=>footprintsOverlap(lf,s.footprint,s.margin))||old.canals.some(c=>footprintsOverlap(lf,area(c),.2))||footprintsOverlap(lf,old.canalLink))return reject("entry-protected");
    const n=Math.floor(hash(r.x1,r.z1,m.seed,8803)*0x7fffffff),spec=districtSpec(district),archetype:Archetype=district==="harbor"?n%3===0?"warehouse":"merchant":district==="water-town"?"water-house":district==="hutong"?"courtyard":district==="artisan"?"workyard":district==="scholar"?"courtyard":district==="highland"?"hillside":district==="imperial"?"civic":district==="nightlife"?"mixed-use":"shophouse";
    const lot:UrbanLot={...r,envelope,id,district:spec.legacy,districtId:district,blockId:block,kind:FAMILY[archetype],archetype,roofFamily:"gable",facade:n%3===0?"arcade":"timber",facing,floors:2,roof:spec.tile,style:n%5,seed:n,baseY,entrance:entry,balcony:n%2===0,arcade:n%3===0,corner:block.includes("interior"),greenery:false};
    newLots.push(lot);allLots.push(lot);newLinks.push(link);allRoads.push(link);index(lotIndex,envelope,lot);addRoad(link);return true;
  }
  const anchors=new Map<DistrictId,Anchor[]>();
  for(const road of allRoads.filter(r=>!r.owner&&!r.id.startsWith("settlement:"))) {
    let walked=0,next=2;
    for(let i=1;i<road.points.length;i++) {
      const a=road.points[i-1],b=road.points[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(!length)continue;
      for(;next<=walked+length;next+=3) {
        const t=(next-walked)/length,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
        const district=old.districts.find(d=>contains(d.bounds,x,z))?.id??(road.id.startsWith("v8:settlement:")?road.district:undefined);if(!district)continue;
        const list=anchors.get(district)??[];list.push({road,x,z,tx:(b.x-a.x)/length,tz:(b.z-a.z)/length,district,station:Math.round(next)});anchors.set(district,list);
      }walked+=length;
    }
  }
  const ordered=old.districts.map(d=>anchors.get(d.id)??[]),max=Math.max(...ordered.map(a=>a.length));
  // Interleave districts so the bounded search cannot spend its budget on the
  // first commercial corridor and leave later districts underdeveloped.
  for(let slot=0;slot<max;slot++)for(const list of ordered) {
    const a=list[slot];if(!a)continue;
    const horizontal=Math.abs(a.tx)>=Math.abs(a.tz),n=Math.floor(hash(Math.round(a.x),Math.round(a.z),m.seed,89)*1000);
    // A narrow realized trail can consume a wider geographic corridor. Fronts
    // stand beyond that real reserve instead of repeatedly proposing buildings
    // inside it and leaving every landmark approach without service frontage.
    const axialSpaces=INTENTIONAL_OPEN_SPACES.filter(s=>contains(s.bounds,a.x,a.z)&&(horizontal?s.bounds.x2-s.bounds.x1>=(s.bounds.z2-s.bounds.z1)*2:s.bounds.z2-s.bounds.z1>=(s.bounds.x2-s.bounds.x1)*2));
    const clearance=Math.max(a.road.half,...m.connections.filter(c=>footprintsOverlap({kind:"point",center:{x:a.x,z:a.z},radius:.1},{kind:"corridor",points:c.points,halfWidth:c.halfWidth})).map(c=>c.halfWidth+.5),...axialSpaces.map(s=>horizontal?Math.max(a.z-s.bounds.z1,s.bounds.z2-a.z):Math.max(a.x-s.bounds.x1,s.bounds.x2-a.x)));
    for(const side of[-1,1]) {
      let accepted=false;
      for(const width of[10+n%7,8,5])for(const depth of[11+n%6,7]) {
        if(accepted)continue;
        const front=Math.round((horizontal?a.z:a.x)+side*(clearance+2)),start=Math.round(horizontal?a.x:a.z)-Math.floor(width/2);
        const r:Rect=horizontal?{x1:start,x2:start+width-1,z1:side>0?front:front-depth+1,z2:side>0?front+depth-1:front}:{x1:side>0?front:front-depth+1,x2:side>0?front+depth-1:front,z1:start,z2:start+width-1};
        accepted=offer(r,a.district,horizontal?side>0?0:2:side>0?3:1,a.road,`front:${a.road.id}:${a.station}`);
      }
    }
  }
  // Remaining paved block interiors get compact buildings connected through a
  // real existing entry alley. No new lot is hidden behind an unbroken wall.
  for(const district of old.districts)for(let z=district.bounds.z1+6;z<district.bounds.z2-5;z+=9)for(let x=district.bounds.x1+6;x<district.bounds.x2-5;x+=9) {
    if(allLots.length>=FABRIC_LIMITS.lots||diagnostics.candidates>=FABRIC_LIMITS.candidates)break;
    const local=[...query(segments,{x1:x-30,x2:x+30,z1:z-30,z2:z+30})],nearby=[...new Set(local.map(s=>s.road))].map(road=>({road,q:nearestRoadPoint(road,x,z)})).filter(a=>a.q.distance<30).sort((a,b)=>a.q.distance-b.q.distance||cmp(a.road.id,b.road.id)).slice(0,3);
    if(!nearby.length)continue;
    const n=Math.floor(hash(x,z,m.seed,809)*1000);
    for(const width of[10+n%5,6]) {
      let accepted=false;
      for(const {road,q}of nearby) {
        const facing=Math.abs(q.x-x)>Math.abs(q.z-z)?q.x>x?1:3:q.z>z?2:0,depth=width===6?7:9+n%5;
        const r={x1:Math.round(x-width/2),x2:Math.round(x-width/2)+width-1,z1:Math.round(z-depth/2),z2:Math.round(z-depth/2)+depth-1};
        if(offer(r,district.id,facing,road,`interior:${district.id}:${x}:${z}`)){accepted=true;break;}
      }if(accepted)break;
    }
  }
  const designs=designBuildings(allLots,m.seed);
  // Display metadata follows actual architecture, while coordinates/IDs of all
  // released lots remain available for the old resident plan.
  const varied=allLots.map(l=>({...l,floors:designs.get(l.id)!.floors,roof:designs.get(l.id)!.tile})),lookup=new Map(varied.map(l=>[l.id,l]));
  const lotsByChunk=new Map<string,UrbanLot[]>(),roadsByChunk=new Map<string,UrbanRoad[]>();
  for(const l of varied)index(lotsByChunk,l.envelope,l);for(const r of allRoads)index(roadsByChunk,roadBounds(r),r);
  const structures:Structure[]=[old.panda,old.gate,...varied],byChunk=new Map<string,Structure[]>();for(const s of structures)index(byChunk,expand(s,3),s);
  const urban:UrbanPlan={...old,lots:varied,roads:allRoads,lotsByChunk,roadsByChunk,residentCity:{...old.residentCity,structures,byChunk}};
  const infill=[...previous.infill,...newLots].map(l=>lookup.get(l.id)!),infillIndex=new Map<string,UrbanLot[]>(),linksIndex=new Map<string,UrbanRoad[]>();
  for(const l of infill)index(infillIndex,l.envelope,l);for(const r of[...previous.links,...newLinks])index(linksIndex,roadBounds(r),r);
  const districts=old.districts.map(d=>{const before=old.lots.filter(l=>l.districtId===d.id),added=newLots.filter(l=>l.districtId===d.id);return{id:d.id,before:before.length,added:added.length,beforeArea:before.reduce((n,l)=>n+size(l),0),addedArea:added.reduce((n,l)=>n+size(l),0),frontage:added.reduce((n,l)=>n+(l.facing%2?l.z2-l.z1+1:l.x2-l.x1+1),0)};});
  diagnostics.added=newLots.length;diagnostics.total=varied.length;diagnostics.maxLocalLots=Math.max(0,...[...lotsByChunk.values()].map(a=>a.length));
  return{baseUrban:previous.baseUrban,previousUrban:old,urban,infill,links:[...previous.links,...newLinks],byChunk:infillIndex,linksByChunk:linksIndex,openSpaces:INTENTIONAL_OPEN_SPACES,diagnostics,districts,designs,newLots:newLots.map(l=>lookup.get(l.id)!),settlements:realized.sites.map(s=>({site:s.id,lots:newLots.filter(l=>l.blockId.includes(`v8:settlement:${s.id}:`)).length}))};
}
