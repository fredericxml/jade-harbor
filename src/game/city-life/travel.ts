import type { Vec3 } from "../../core/coords";
import type { World } from "../../world/world";
import type { Mode } from "../../persistence/saves";
import { nearestRoadPoint, roadElevation, type UrbanRoad } from "../../world/metropolis/plan";
import { standAt } from "../navigation/pathfinder";

export type PlaceKind="district"|"landmark"|"region"|"walk";
export type TravelAnchor={arrival:Vec3;focus:Vec3;fallback?:Vec3};
export type JournalPlace={id:string;title:string;description:string;discoveryId:string;category:PlaceKind;
  discoveryPosition:Vec3;discoveryRadius:number;parentHubId:string;travelHub?:TravelAnchor & {title?:string;description?:string}};
export type TravelDestination=TravelAnchor & {id:string;title:string;description:string;category:PlaceKind;discoveryId:string;discoveryIds:readonly string[]};
type PlannedPlace={id:string;title:string;description:string;discoveryId:string;category:PlaceKind;arrival:Vec3;focus:Vec3;discoveryPosition?:Vec3;discoveryRadius?:number;fallback?:Vec3};
const journals=new WeakMap<World,readonly JournalPlace[]>();
export function journalPlaces(world:World):readonly JournalPlace[] {
  const cached=journals.get(world);if(cached)return cached;
  const urban=world.metropolisPlan,landmarks=world.landmarkPlan;if(!urban||!landmarks)return [];
  const result:PlannedPlace[]=[],feet=(p:Vec3)=>({x:Math.floor(p.x)+.5,y:p.y+1.002,z:Math.floor(p.z)+.5});
  const roadFallback=(road:UrbanRoad,p:Vec3)=>{
    const first=road.points[0],last=road.points.at(-1)!,length=Math.hypot(last.x-first.x,last.z-first.z)||1;
    let q=nearestRoadPoint(road,p.x+(last.x-first.x)/length*14,p.z+(last.z-first.z)/length*14);
    if(Math.hypot(q.x-p.x,q.z-p.z)<6)q=nearestRoadPoint(road,p.x-(last.x-first.x)/length*14,p.z-(last.z-first.z)/length*14);
    return feet({x:q.x,y:roadElevation(world.macroPlan!,road,q.x,q.z),z:q.z});
  };
  const district=(id:string,title:string,description:string,x:number,z:number,lookX:number,lookZ:number,owner?:string)=>{
    const roads=urban.roads.filter(r=>!r.owner&&(!owner||r.district===owner));
    const road=roads.sort((a,b)=>nearestRoadPoint(a,x,z).distance-nearestRoadPoint(b,x,z).distance||(a.id<b.id?-1:1))[0];if(!road)return;
    const q=nearestRoadPoint(road,x,z),p={x:Math.floor(q.x),y:roadElevation(world.macroPlan!,road,q.x,q.z),z:Math.floor(q.z)};
    result.push({id:`district:${id}`,title,description,discoveryId:`discovery:district:${id}`,category:"district",arrival:feet(p),focus:{x:lookX,y:p.y+3,z:lookZ},fallback:roadFallback(road,p)});
  };
  district("panda-plaza","Panda Plaza","The monument court at the heart of the city.",0,-22,0,-48);
  district("avenue","Grand Lantern Avenue","The main commercial and ceremonial street.",0,24,0,-48);
  const preferred:Record<string,number[]>={heritage:[0,-112,0,-48],market:[-248,-216,-290,-216],hutong:[-144,-20,-210,-20],"water-town":[132,-100,190,-100],harbor:[120,340,170,340],imperial:[20,-236,90,-236],artisan:[-248,186,-290,186],scholar:[200,204,200,150],nightlife:[0,180,0,245],highland:[-224,-344,-280,-344]};
  for(const d of urban.districts){const a=preferred[d.id];district(d.id,d.name,d.role,...a as [number,number,number,number],d.id);}
  const stories=["Gates and courts frame the northern ceremonial axis.","The ridge joins watch posts across the mountain crest.","Clay formations emerge beneath the protective canopy.","The working quay falls away below the beacon deck.","A quiet hall marks the end of the mountain approach.","Carved chambers share a narrow cliff terrace.","A short causeway crosses the garden pond.","The western trees frame a sheltered upper outlook."];
  for(const [i,s] of landmarks.sites.entries()) {
    const discovery=s.id==="harbor-front"||s.id==="western-viewpoint"||s.id==="cliff-grotto"?s.viewpoints[0]:s.id==="archaeology"?s.publicSpaces[1]:s.publicSpaces[0]??s.entry;
    result.push({id:`landmark:${s.id}`,title:s.name,description:stories[i],discoveryId:`discovery:${s.id}`,category:"landmark",arrival:feet(s.entry),focus:feet(s.publicSpaces[0]??s.viewpoints[0]??s.entry),discoveryPosition:feet(discovery),discoveryRadius:3,fallback:feet(discovery)});
  }
  for(const s of world.regionalPlan?.sites??[]) {
    // Approach endpoints can sit in a retaining cut before the village opens.
    // Arrive on its authored public circuit, where the destination and its
    // inhabitants are visible; keep the outer endpoint for route planning.
    const circuit=s.id==="amber-village"?[...s.loop].sort((a,b)=>(a.x-s.focus.x)**2+(a.z-s.focus.z)**2-((b.x-s.focus.x)**2+(b.z-s.focus.z)**2)||a.x-b.x||a.z-b.z):s.loop;
    const arrival=circuit[0];if(!arrival)throw Error(`Missing regional public arrival: ${s.id}`);
    const secondary=s.loop.find(p=>Math.hypot(p.x-arrival.x,p.z-arrival.z)>=12&&Math.hypot(p.x-arrival.x,p.z-arrival.z)<=24)??s.loop[Math.floor(s.loop.length/2)];
    result.push({id:`region:${s.id}`,title:s.name,description:s.description,discoveryId:`discovery:region:${s.id}`,category:"region",arrival:feet(arrival),focus:feet(s.focus),fallback:feet(secondary)});
  }
  // Preserve released discovery positions/radii. Only area owners retain a travel anchor below.
  const walk=(id:string,title:string,description:string,p:Vec3,radius=3,secondary?:Vec3)=>result.push({id:`walk:${id}`,title,description,discoveryId:`discovery:${id}`,category:"walk",arrival:p,focus:secondary??{...p,z:p.z-8},discoveryPosition:p,discoveryRadius:radius,fallback:secondary});
  const wall=landmarks.wallWalk,wi=Math.min(192,wall.length-1);
  walk("ridge-watch","Middle Ridge Watch","A second guardroom rewards the longer wall walk.",feet(wall[wi]),3,feet(wall[Math.max(0,wi-8)]));
  const temple=landmarks.sites.find(s=>s.id==="mountain-temple")!,dig=landmarks.sites.find(s=>s.id==="archaeology")!;
  walk("sanctuary-overlook","Sanctuary Side Terrace","The trail opens briefly beside the sanctuary.",feet(temple.viewpoints[0]),1.5,feet(temple.publicSpaces[0]??temple.entry));
  walk("excavation-rim","Excavation Viewing Rim","The protected rim reveals the formation of two pits.",feet(dig.viewpoints[0]),2,feet(dig.publicSpaces[1]));
  const quay=urban.roads.find(r=>r.id==="harbor-north-quay")!,q=quay.points[Math.floor(quay.points.length/2)];
  walk("quay-walk","The Working Quay","A low promenade ties the beacon to the warehouses.",feet(q));
  for(const [id,title,description] of [
    ["hutong","Hutong Side Lane","A quiet residential lane passes between enclosed courts."],
    ["market","Behind the Market","Narrow back lanes connect the shopfront streets."],
    ["water-town","Canal Bridge","The crossing joins two rows of water-facing houses."],
    ["scholar","Scholar Garden Path","The commercial streets give way to garden walks."],
  ]) {
    const road=urban.roads.find(r=>r.district===id&&(id!=="water-town"||r.id.startsWith("water-bridge-"))&&!r.owner);if(!road)continue;
    walk(`${id}-route`,title,description,feet(road.points[Math.floor(road.points.length/2)]),2.5);
  }
  for(const d of result)if(!d.fallback) {
    const road=urban.roads.filter(r=>!r.owner).sort((a,b)=>nearestRoadPoint(a,d.arrival.x,d.arrival.z).distance-nearestRoadPoint(b,d.arrival.x,d.arrival.z).distance||(a.id<b.id?-1:1))[0];
    if(road&&nearestRoadPoint(road,d.arrival.x,d.arrival.z).distance<8)d.fallback=roadFallback(road,d.arrival);
  }
  if(new Set(result.map(d=>d.id)).size!==result.length)throw Error("Duplicate travel destination");
  // The semantic parent is attached to the actual discovery record. Hubs and
  // progress are projections of these records, never a parallel destination list.
  const parent=(d:PlannedPlace):string=>{
    if(d.id.startsWith("region:"))return d.id;
    if(d.category==="district")return ["district:panda-plaza","district:avenue"].includes(d.id)?"district:heritage":d.id;
    const id=d.id.split(":")[1];
    switch(id){
      case "imperial-complex":return "district:imperial";
      case "ridge-fortification":case "ridge-watch":return "district:highland";
      case "harbor-front":case "quay-walk":return "district:harbor";
      case "archaeology":case "excavation-rim":return "landmark:archaeology";
      case "cliff-grotto":return "landmark:cliff-grotto";
      case "mountain-temple":case "sanctuary-overlook":case "scenic-landscape":case "western-viewpoint":return "area:western-highlands";
      case "hutong-route":return "district:hutong";
      case "market-route":return "district:market";
      case "water-town-route":return "district:water-town";
      case "scholar-route":return "district:scholar";
      default:throw Error(`Unassigned journal place: ${d.id}`);
    }
  };
  const places=result.map(d=>{
    const parentHubId=parent(d),owns=d.id===parentHubId||d.id==="landmark:mountain-temple";
    return{id:d.id,title:d.title,description:d.description,discoveryId:d.discoveryId,category:d.category,
      discoveryPosition:d.discoveryPosition??d.arrival,discoveryRadius:d.discoveryRadius??(d.category==="district"?10:6),parentHubId,
      ...(owns?{travelHub:{arrival:d.arrival,focus:d.focus,fallback:d.fallback,...(d.id==="landmark:mountain-temple"?{title:"Western Scenic Highlands",description:"Sanctuary courts, Reed Moon Garden and the western lookout share the highland paths."}:{})}}:{})};
  });
  const hubs=new Set(places.filter(p=>p.travelHub).map(p=>p.parentHubId));
  if(places.some(p=>!hubs.has(p.parentHubId))||hubs.size!==places.filter(p=>p.travelHub).length)throw Error("Invalid journal hub ownership");
  journals.set(world,Object.freeze(places));return places;
}
export function travelDestinations(world:World):TravelDestination[] {
  const places=journalPlaces(world);
  return places.filter(p=>p.travelHub).map(p=>({id:p.parentHubId,title:p.travelHub!.title??p.title,description:p.travelHub!.description??p.description,category:p.category,
    discoveryId:p.discoveryId,discoveryIds:places.filter(q=>q.parentHubId===p.parentHubId).map(q=>q.discoveryId),arrival:p.travelHub!.arrival,focus:p.travelHub!.focus,fallback:p.travelHub!.fallback})).sort((a,b)=>{const rank=(c:PlaceKind)=>c==="district"?0:c==="region"?1:2;return rank(a.category)-rank(b.category);});
}
export const travelUnlocked=(d:TravelDestination,mode:Mode,recorded:ReadonlySet<string>)=>mode==="creative"||mode==="spectator"||d.discoveryIds.some(id=>recorded.has(id));

/** Authored arrivals are hints, not permission to overwrite edits. A bounded
 * nearby search requires collision clearance, dry support and two usable exits.
 * No terrain modification or fallback to an unrelated world spawn. */
export function safeTravelArrival(world:World,d:Pick<TravelAnchor,"arrival">):Vec3|undefined {
  const offsets:number[][]=[[0,0]];for(let radius=1;radius<=6;radius++)for(let z=-radius;z<=radius;z++)for(let x=-radius;x<=radius;x++)if(Math.max(Math.abs(x),Math.abs(z))===radius)offsets.push([x,z]);
  for(const[dx,dz]of offsets) {
    const x=d.arrival.x+dx,z=d.arrival.z+dz,p=standAt(world,x,z,d.arrival.y,false);if(!p)continue;
    const exits=[[1,0],[-1,0],[0,1],[0,-1]].filter(([a,b])=>{const q=standAt(world,x+a,z+b,p.y,false);return q&&Math.abs(q.y-p.y)<=.501;});
    if(exits.length>=2)return p;
  }
}
export function travelColumns(d:Pick<TravelAnchor,"arrival">) {
  const columns:{cx:number;cz:number;key:string}[]=[];
  // Six-block search + one-block exits + collision radius. At most four
  // columns for authored half-cell anchors, independent of view distance.
  for(let z=Math.floor((d.arrival.z-7.4)/16);z<=Math.floor((d.arrival.z+7.4)/16);z++)for(let x=Math.floor((d.arrival.x-7.4)/16);x<=Math.floor((d.arrival.x+7.4)/16);x++)columns.push({cx:x,cz:z,key:`${x},${z}`});
  columns.sort((a,b)=>(a.cx*16+8-d.arrival.x)**2+(a.cz*16+8-d.arrival.z)**2-((b.cx*16+8-d.arrival.x)**2+(b.cz*16+8-d.arrival.z)**2));
  return columns;
}
