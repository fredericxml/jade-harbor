import {createLandscapeProgram,type LandscapeProgram} from "./landscapes";
import { B } from "../blocks";
import { hash } from "../noise";
import { footprintBounds, footprintDistance, footprintsOverlap, type Point } from "../geography/geometry";
import { protections, resolveReservations, type LandmarkRequest, type Reservation, type Protection } from "../geography/landmarks";
import { sampleTerrain } from "../geography/terrain";
import type { MacroPlan, Region } from "../geography/plan";
import type { UrbanPlan } from "../metropolis/plan";
import type { Rect } from "../city/plan";
import { gradeTrail, segmentSample, terrainWaypoints } from "../landmarks/routes";
import type { RealizationPlan, RouteNode, Position } from "../landmarks/types";

export const REGIONAL_IDS=["willow-tulou","amber-village","li-stone-walk","mist-tea-village","lotus-causeway"] as const;
export type RegionalId=typeof REGIONAL_IDS[number];
export type RegionalBuilding={id:string;bounds:Rect;level:number;floors:number;roof:number;wall:number;open:boolean};
export type RegionalSite={id:RegionalId;name:string;description:string;reservation:Reservation;arrival:Position;focus:Position;buildings:RegionalBuilding[];loop:Position[];routes:RouteNode[][];pillars:{x:number;z:number;radius:number;height:number}[]};
export type RegionalPlan={landscapes:LandscapeProgram;sites:RegionalSite[];byChunk:Map<string,RegionalSite[]>;routesByChunk:Map<string,{a:RouteNode;b:RouteNode}[]>;diagnostics:ReturnType<typeof resolveReservations>["diagnostics"]};
const regions:Region[]=["harbor-waterfront","rural-transition","valley","highland","mountain","scenic-protected","archaeology-outskirts","cliff","ridge","river-corridor"];
const specs=[
  {id:"willow-tulou",name:"Willow Valley Tulou",description:"A communal earthen house, village workshops and a valley approach.",x:-520,z:450,rx:62,rz:59},
  {id:"amber-village",name:"Amber Gate Village",description:"Western merchant lanes and a walled heritage village beside the excavation road.",x:-495,z:-45,rx:57,rz:48},
  {id:"li-stone-walk",name:"Li River Stone Walk",description:"Limestone pillars frame an eastern river trail and small lookout tea houses.",x:650,z:390,rx:80,rz:92},
  {id:"mist-tea-village",name:"Mist Terrace Tea Village",description:"A northern hillside settlement with tea terraces and a linked lookout walk.",x:-570,z:-725,rx:63,rz:59},
  {id:"lotus-causeway",name:"Lotus Causeway Gardens",description:"A southern lake garden, planted banks, low pavilions and crossing causeways.",x:-105,z:560,rx:63,rz:51},
] as const;
const rect=(x:number,z:number,rx:number,rz:number):Rect=>({x1:x-rx,x2:x+rx,z1:z-rz,z2:z+rz});
const inside=(r:Rect,x:number,z:number,p=0)=>x>=r.x1-p&&x<=r.x2+p&&z>=r.z1-p&&z<=r.z2+p;

/** New regions reserve existing low-value space before realizing any voxel.
 * Existing city, river, mines, landmarks, approaches and lot envelopes win.
 * Search is bounded to eight geographically local candidates per region. */
export function createRegionalPlan(m:MacroPlan,urban:UrbanPlan,old:RealizationPlan):RegionalPlan {
  const oldFootprints:Protection[]=old.sites.map(s=>({id:s.id,kind:"district",footprint:s.reservation.footprint}));
  const obstacles=[...protections(m),...oldFootprints,
    ...old.approaches.map(a=>({id:a.id,kind:"route" as const,footprint:{kind:"corridor" as const,points:a.nodes,halfWidth:a.half+3}})),
    ...urban.lots.map(l=>({id:l.id,kind:"city" as const,footprint:{kind:"area" as const,bounds:l.envelope}}))];
  // Contour search is local. Scanning every city parcel at every search node
  // made new-world planning several times slower despite no nearby buildings.
  // Clip the semantic obstacle index to the existing envelope plus the bounded
  // contour margin; unbounded river endpoints must not create unbounded bins.
  const obstacleIndex=new Map<string,Protection[]>(),envelope=footprintBounds(m.envelope);
  for(const o of obstacles.filter(o=>o.kind!=="route")){
    const b=footprintBounds(o.footprint);
    for(let z=Math.floor(Math.max(b.z1-4,envelope.z1-128)/32);z<=Math.floor(Math.min(b.z2+4,envelope.z2+128)/32);z++)for(let x=Math.floor(Math.max(b.x1-4,envelope.x1-128)/32);x<=Math.floor(Math.min(b.x2+4,envelope.x2+128)/32);x++){
      const key=`${x},${z}`,list=obstacleIndex.get(key)??[];list.push(o);obstacleIndex.set(key,list);
    }
  }
  const requests:LandmarkRequest[]=specs.map(s=>({id:`${s.id}-reserve`,type:"area",priority:40,margin:5,
    candidates:Array.from({length:25},(_,i)=>[(i%5-2)*(s.id==="willow-tulou"?64:32),(Math.floor(i/5)-2)*(s.id==="willow-tulou"?64:32)]).map(([dx,dz])=>({anchor:{x:s.x+dx,z:s.z+dz},footprint:{kind:"area" as const,bounds:rect(s.x+dx,s.z+dz,s.rx,s.rz)}}))
      .filter(c=>{const r=footprintBounds(c.footprint),e=footprintBounds(m.envelope);return r.x1>=e.x1&&r.x2<=e.x2&&r.z1>=e.z1&&r.z2<=e.z2&&!obstacles.some(o=>footprintsOverlap(c.footprint,o.footprint,5));})
      .map(c=>{const h=[];for(const dx of[-26,0,26])for(const dz of[-26,0,26])h.push(sampleTerrain(m,c.anchor.x+dx,c.anchor.z+dz).height);return{c,score:Math.max(...h)-Math.min(...h)+Math.hypot(c.anchor.x-s.x,c.anchor.z-s.z)*.08};}).sort((a,b)=>a.score-b.score||a.c.anchor.x-b.c.anchor.x||a.c.anchor.z-b.c.anchor.z).slice(0,8).map(a=>a.c),
    regions,maxSlope:12,elevation:[1,230],water:s.id==="li-stone-walk"||s.id==="lotus-causeway"?"allowed":"forbidden",ridge:false,cliff:false,allowScenic:true,connections:[],caves:"foundation",viewToward:m.primary}));
  for(const r of requests)if(!r.candidates.length)throw Error(`No unoccupied regional candidate: ${r.id}`);
  const resolved=resolveReservations(m,requests,obstacles),sites:RegionalSite[]=[];
  for(const spec of specs) {
    const reservation=resolved.reservations.find(r=>r.id===`${spec.id}-reserve`);
    if(!reservation)throw Error(`Regional reservation rejected: ${spec.id}: ${JSON.stringify(resolved.diagnostics.find(d=>d.id===`${spec.id}-reserve`))}`);
    const {x,z}=reservation.anchor,ground=(x:number,z:number)=>Math.max(20,sampleTerrain(m,x,z).height),level=ground(x,z);
    const buildings:RegionalBuilding[]=[],routes:RouteNode[][]=[],pillars:RegionalSite["pillars"]=[];
    const building=(label:string,dx:number,dz:number,rx:number,rz:number,floors=1,open=false)=>{
      const px=x+dx,pz=z+dz,y=spec.id==="li-stone-walk"||spec.id==="mist-tea-village"?ground(px,pz):level;
      buildings.push({id:`${spec.id}:${label}`,bounds:rect(px,pz,rx,rz),level:y,floors,roof:spec.id==="amber-village"?B.Roof:spec.id==="willow-tulou"?B.BrownRoof:B.JadeRoof,wall:spec.id==="willow-tulou"?B.Terracotta:B.CreamWall,open});return{x:px,y,z:pz+rz+2};
    };
    let arrival:Position,focus:Position,loop:Position[];
    if(spec.id==="willow-tulou") {
      arrival={x,y:level,z:z+30};focus={x,y:level+8,z};
      loop=[{x:x-9,y:level,z:z+13},{x:x+9,y:level,z:z+13},{x:x+10,y:level,z:z+3},{x:x-10,y:level,z:z+3}];
      building("pottery-house",-39,20,8,6,2);building("village-inn",38,13,9,8,2);building("ancestral-hall",0,-5,8,5);
    }else if(spec.id==="amber-village") {
      arrival={x,y:level,z:z+31};focus={x,y:level+4,z:z-8};
      for(const[dx,dz,rx,rz,f]of[[-24,14,10,8,2],[23,15,9,9,2],[-23,-13,9,10,1],[24,-14,10,8,2],[0,-31,13,6,1]])building(`merchant-${dx}:${dz}`,dx,dz,rx,rz,f);
      loop=[{x:x-6,y:level,z:z+18},{x:x+6,y:level,z:z+18},{x:x+6,y:level,z:z-17},{x:x-6,y:level,z:z-17}];
    }else if(spec.id==="li-stone-walk") {
      arrival={x:x-30,y:ground(x-30,z+45),z:z+45};focus={x:x+15,y:level+20,z:z-18};
      for(const[dx,dz,r,h]of[[-36,-52,6,27],[0,-45,8,38],[35,-54,6,32],[44,-8,8,43],[-10,-7,5,24],[28,47,7,31],[-41,13,5,23]])pillars.push({x:x+dx,z:z+dz,radius:r,height:h});
      building("riverside-tea-house",-39,64,10,7,1,true);building("trail-lodge",28,75,8,6,1);building("river-guard-post",-45,36,4,4,1);
      loop=[arrival,{x:x-22,y:ground(x-22,z+18),z:z+18},{x:x+4,y:ground(x+4,z+16),z:z+16},{x:x+7,y:ground(x+7,z+37),z:z+37}];
    }else if(spec.id==="mist-tea-village") {
      arrival={x,y:ground(x,z+37),z:z+37};focus={x,y:level+4,z:z-22};
      building("tea-guild",0,-25,13,7,2);building("stair-inn",-30,9,10,8,2);building("tea-house",30,-4,10,7,1);building("outlook",24,-34,5,5,1,true);
      loop=[arrival,{x:x-8,y:ground(x-8,z+12),z:z+12},{x:x+6,y:ground(x+6,z-8),z:z-8},{x:x+11,y:ground(x+11,z+17),z:z+17}];
    }else {
      arrival={x:x-40,y:level,z:z+12};focus={x:x+10,y:level+2,z};
      building("west-pavilion",-34,-24,7,6,1,true);building("east-tea-house",37,-24,10,6,1);building("garden-inn",30,31,9,6,2);
      loop=[arrival,{x:x-12,y:level,z:z+12},{x:x+18,y:level,z:z+12},{x:x+18,y:level,z:z-12},{x:x-12,y:level,z:z-12}];
    }
    let exempt=new Set<Protection>();
    const blocked=(px:number,pz:number)=>(obstacleIndex.get(`${Math.floor(px/32)},${Math.floor(pz/32)}`)??[]).some(o=>!exempt.has(o)&&footprintDistance(o.footprint,px,pz)<3);
    // Approach from the closest actual public road or realized heritage trail.
    const anchors=[...urban.roads.filter(r=>!r.owner).flatMap(r=>r.points),...old.approaches.flatMap(a=>a.nodes)].filter(p=>Math.hypot(p.x-arrival.x,p.z-arrival.z)>8).sort((a,b)=>Math.hypot(a.x-arrival.x,a.z-arrival.z)-Math.hypot(b.x-arrival.x,b.z-arrival.z));
    const eastApproach=spec.id==="li-stone-walk"?old.approaches.filter(a=>a.site==="cliff-grotto").flatMap(a=>a.nodes).filter(p=>p.x>=m.connections.find(c=>c.id==="east-crossing")!.points.at(-1)!.x+5).sort((a,b)=>Math.hypot(a.x-arrival.x,a.z-arrival.z)-Math.hypot(b.x-arrival.x,b.z-arrival.z)):[];
    let connection:Position=eastApproach[0]??anchors[0];
    const route=(points:Position[])=>{const first=points[0],last=points.at(-1)!;
      if(first.x===last.x&&first.z===last.z)return [];
      let alignment:readonly Point[];
      try {alignment=terrainWaypoints(m,points,blocked);}catch(error){throw Error(`${spec.id} approach ${JSON.stringify(points)}: ${String(error)}`);}
      const length=alignment.slice(1).reduce((n,b,i)=>n+Math.abs(b.x-alignment[i].x)+Math.abs(b.z-alignment[i].z),0);
      if(Math.abs(last.y-first.y)>length*.5){const run=Math.ceil(Math.abs(last.y-first.y))+4;alignment=[first,{x:first.x+run,z:first.z},{x:last.x+run,z:last.z},last];}
      const nodes=gradeTrail(m,alignment,first.y,last.y);routes.push(nodes);return nodes;};
    const offers:Position[]=[];
    for(const p of eastApproach.length?eastApproach:anchors)if(offers.every(a=>Math.hypot(a.x-p.x,a.z-p.z)>24)){offers.push(p);if(offers.length===8)break;}
    let linked=false,lastError:unknown;
    for(const offer of offers){connection=offer;exempt=new Set(obstacles.filter(o=>footprintDistance(o.footprint,connection.x,connection.z)<=4));try{route([connection,arrival]);linked=true;break;}catch(error){lastError=error;}}
    if(!linked)throw lastError??Error(`No regional approach: ${spec.id}`);
    for(let i=0;i<loop.length;i++)route([loop[i],loop[(i+1)%loop.length]]);
    route([arrival,loop[0]]);
    for(const b of buildings){const door={x:Math.round((b.bounds.x1+b.bounds.x2)/2),y:b.level,z:b.bounds.z2+1};const near=(spec.id==="willow-tulou"&&Math.abs(door.x-x)>15?[arrival]:[...loop,arrival]).sort((a,b)=>Math.hypot(a.x-door.x,a.z-door.z)-Math.hypot(b.x-door.x,b.z-door.z))[0];route([near,door]);}
    // Loops are sampled from the actual graded ribbons, including half steps.
    const walk=routes.slice(1,1+loop.length).flatMap(r=>r.filter((_,i)=>i%4===0).map(p=>({...p})));
    sites.push({id:spec.id,name:spec.name,description:spec.description,reservation,arrival,focus,buildings,loop:walk,routes,pillars});
  }
  const byChunk=new Map<string,RegionalSite[]>();
  for(const site of sites){const bounds=footprintBounds(site.reservation.footprint);const all=[bounds,...site.routes.map(r=>({x1:Math.min(...r.map(p=>p.x))-3,x2:Math.max(...r.map(p=>p.x))+3,z1:Math.min(...r.map(p=>p.z))-3,z2:Math.max(...r.map(p=>p.z))+3}))];
    const keys=new Set<string>();for(const b of all)for(let z=Math.floor(b.z1/16);z<=Math.floor(b.z2/16);z++)for(let x=Math.floor(b.x1/16);x<=Math.floor(b.x2/16);x++)keys.add(`${x},${z}`);
    for(const key of keys){const list=byChunk.get(key)??[];list.push(site);byChunk.set(key,list);}
  }
  const routesByChunk=new Map<string,{a:RouteNode;b:RouteNode}[]>();
  for(const s of sites)for(const route of s.routes)for(let i=1;i<route.length;i++){
    const a=route[i-1],b=route[i];
    for(let z=Math.floor((Math.min(a.z,b.z)-2)/16);z<=Math.floor((Math.max(a.z,b.z)+2)/16);z++)for(let x=Math.floor((Math.min(a.x,b.x)-2)/16);x<=Math.floor((Math.max(a.x,b.x)+2)/16);x++){
      const key=`${x},${z}`,list=routesByChunk.get(key)??[];list.push({a,b});routesByChunk.set(key,list);
    }
  }
  if(byChunk.size>3000||Math.max(...[...routesByChunk.values()].map(a=>a.length))>512)throw Error("Regional spatial budget exceeded");
  return {sites,byChunk,routesByChunk,landscapes:createLandscapeProgram(m,old,sites),diagnostics:resolved.diagnostics};
}

export function regionAt(plan:RegionalPlan,x:number,z:number) {
  return plan.byChunk.get(`${Math.floor(x/16)},${Math.floor(z/16)}`)?.find(s=>footprintDistance(s.reservation.footprint,x,z)<=0);
}
export function regionalRouteAt(plan:RegionalPlan,x:number,z:number) {
  let best:{y:number;distance:number}|undefined;
  for(const {a,b} of plan.routesByChunk.get(`${Math.floor(x/16)},${Math.floor(z/16)}`)??[]) {
    const q=segmentSample(a,b,x,z);if(q.distance<=2&&(!best||q.distance<best.distance))best=q;
  }
  return best;
}
