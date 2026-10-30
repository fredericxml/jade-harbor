import type { Vec3 } from "../../core/coords";
import type { World } from "../../world/world";
import { nearestRoadPoint } from "../../world/metropolis/plan";
import { identityHash } from "./schedules";
import type { PopulationPlan } from "./population";

export type TaskAction="arrange"|"restock"|"browse"|"inspect"|"carry"|"unload"|"shape"|"hammer"|"sweep"|"greet"|"converse"|"read"|"study"|"serve"|"sip"|"observe"|"watch"|"check";
export type TaskNode={position:Vec3;focus:Vec3;action:TaskAction;seconds:number;place:"shopfront"|"workshop"|"quay"|"post"|"pavilion"|"meeting"|"viewpoint"|"doorway"};
export type Appearance={upper:string;lower:string;sash:string;hair:string;skin:string;hat:"cap"|"wrap"|"straw"|"topknot"|"none";hatColor:string;width:number;height:number;apron:boolean;fingerprint:string};
export type TaskChain={role:string;category:"work"|"commerce"|"patrol"|"social"|"visit"|"local circulation";nodes:TaskNode[];group?:string;prop:"basket"|"crate"|"book"|"tool"|"tea"|"broom"|"staff"|"none";look:Appearance};
const UPPER=["#a65c48","#5d7d82","#778356","#b59263","#7c718b","#4d6964","#9d7559","#667c9b","#b28175","#7d876f","#baa487","#8f5c59"];
const LOWER=["#3f5148","#555768","#6a6252","#355a5d","#7c6a58","#4e414b"];
const SASH=["#c9ad72","#823f36","#577574","#d4c5a3"];
export function residentAppearance(id:string,district:string,role:string):Appearance {
  const h=identityHash(id),k=identityHash(`${id}:garment`),q=identityHash(`${id}:headwear`);
  const upper=UPPER[(h+(district==="imperial"?3:district==="harbor"?5:0))%UPPER.length],lower=LOWER[k%LOWER.length],sash=SASH[(k>>>5)%SASH.length];
  const hat=(["cap","wrap","straw","topknot","none"] as const)[q%5],hair=["#303d34","#51483d","#6c6557","#343946"][(q>>>4)%4];
  const look={upper,lower,sash,hair,skin:["#c8aa7e","#d6b98d","#b69670"][(q>>>8)%3],hat,hatColor:role.includes("guard")?"#667475":(q>>>10)%2?hair:upper,width:.93+(k>>>8)%3*.07,height:.94+(k>>>12)%3*.045,apron:/worker|artisan|keeper|apprentice|porter/.test(role),fingerprint:""};
  look.fingerprint=[look.upper,look.lower,look.sash,look.hair,look.skin,look.hat,look.hatColor,look.width,look.height,look.apron].join(":");return look;
}
type Role=Pick<TaskChain,"role"|"category"|"prop">&{actions:readonly TaskAction[];place:TaskNode["place"]};
const ROLES:Record<string,readonly Role[]>={
  market:[{role:"shopper",category:"commerce",prop:"basket",actions:["browse","inspect","greet"],place:"shopfront"},{role:"stock porter",category:"work",prop:"crate",actions:["carry","unload","restock"],place:"shopfront"},{role:"stall merchant",category:"commerce",prop:"basket",actions:["arrange","serve","restock"],place:"shopfront"},{role:"tea visitor",category:"social",prop:"tea",actions:["greet","sip","converse"],place:"meeting"}],
  hutong:[{role:"neighbor",category:"social",prop:"none",actions:["greet","converse","observe"],place:"meeting"},{role:"lane keeper",category:"work",prop:"broom",actions:["sweep","check","sweep"],place:"doorway"},{role:"household shopper",category:"commerce",prop:"basket",actions:["browse","inspect","greet"],place:"shopfront"},{role:"local visitor",category:"local circulation",prop:"none",actions:["greet","check","observe"],place:"doorway"}],
  "water-town":[{role:"bridge visitor",category:"visit",prop:"basket",actions:["observe","inspect","greet"],place:"viewpoint"},{role:"tea keeper",category:"work",prop:"tea",actions:["serve","arrange","restock"],place:"shopfront"},{role:"canal shopper",category:"commerce",prop:"basket",actions:["browse","inspect","greet"],place:"shopfront"},{role:"quay neighbor",category:"social",prop:"none",actions:["greet","converse","observe"],place:"meeting"}],
  harbor:[{role:"quay porter",category:"work",prop:"crate",actions:["carry","unload","check"],place:"quay"},{role:"warehouse worker",category:"work",prop:"crate",actions:["restock","carry","unload"],place:"quay"},{role:"dock merchant",category:"commerce",prop:"basket",actions:["inspect","serve","check"],place:"quay"},{role:"quay guard",category:"patrol",prop:"staff",actions:["watch","check","observe"],place:"post"}],
  imperial:[{role:"watch guard",category:"patrol",prop:"staff",actions:["watch","check","observe"],place:"post"},{role:"civic attendant",category:"work",prop:"book",actions:["check","greet","study"],place:"doorway"},{role:"civic visitor",category:"visit",prop:"none",actions:["observe","inspect","greet"],place:"viewpoint"}],
  artisan:[{role:"workshop artisan",category:"work",prop:"tool",actions:["hammer","inspect","shape"],place:"workshop"},{role:"apprentice",category:"work",prop:"basket",actions:["carry","arrange","inspect"],place:"workshop"},{role:"pottery merchant",category:"commerce",prop:"basket",actions:["arrange","browse","serve"],place:"shopfront"},{role:"workshop keeper",category:"work",prop:"broom",actions:["sweep","check","restock"],place:"workshop"}],
  scholar:[{role:"garden scholar",category:"visit",prop:"book",actions:["read","observe","study"],place:"pavilion"},{role:"garden keeper",category:"work",prop:"broom",actions:["sweep","inspect","check"],place:"pavilion"},{role:"garden companions",category:"social",prop:"book",actions:["greet","converse","observe"],place:"meeting"}],
  nightlife:[{role:"tea keeper",category:"work",prop:"tea",actions:["serve","arrange","restock"],place:"shopfront"},{role:"venue visitor",category:"social",prop:"tea",actions:["greet","sip","converse"],place:"meeting"},{role:"evening shopper",category:"commerce",prop:"basket",actions:["browse","inspect","greet"],place:"shopfront"},{role:"lantern artisan",category:"work",prop:"tool",actions:["arrange","inspect","shape"],place:"workshop"}],
  highland:[{role:"ridge guard",category:"patrol",prop:"staff",actions:["watch","check","observe"],place:"post"},{role:"lookout visitor",category:"visit",prop:"book",actions:["observe","study","greet"],place:"viewpoint"},{role:"inn keeper",category:"work",prop:"tea",actions:["serve","arrange","check"],place:"doorway"},{role:"orchard villager",category:"work",prop:"basket",actions:["inspect","carry","arrange"],place:"workshop"}],
  heritage:[{role:"plaza visitor",category:"visit",prop:"none",actions:["observe","inspect","greet"],place:"viewpoint"},{role:"merchant",category:"commerce",prop:"basket",actions:["arrange","browse","serve"],place:"shopfront"},{role:"plaza companions",category:"social",prop:"none",actions:["greet","converse","observe"],place:"meeting"},{role:"civic guard",category:"patrol",prop:"staff",actions:["watch","check","observe"],place:"post"}],
};
const near=(a:Vec3,b:Vec3)=>Math.hypot(a.x-b.x,a.z-b.z);
/** Permanent chains are attached to retained identities and authored paths.
 * No observer-relative positions, new residents or unbounded place search. */
export function addPurposefulLife(world:World,old:PopulationPlan):PopulationPlan {
  const urban=world.metropolisPlan!;
  const residents=old.residents.map(r=>{
    const h=identityHash(r.id),site=r.landmark?world.landmarkPlan?.sites.find(s=>s.id===r.landmark):undefined;
    const feet=(p:Vec3)=>({x:p.x+.5,y:p.y+1.002,z:p.z+.5});
    const approach=site?world.landmarkPlan!.approaches.filter(a=>a.site===site.id).sort((a,b)=>near(a.nodes.at(-1)!,site.entry)-near(b.nodes.at(-1)!,site.entry)||a.id.localeCompare(b.id))[0]:undefined;
    // Some released landmark work loops repeat one address. Use their actual
    // public approach instead of silently omitting those retained residents.
    const authored=r.landmark==="ridge-fortification"?world.landmarkPlan!.wallWalk.slice(0,25).map(feet):site?[...r.workLoop,...(r.circuit?.points??[]),...(approach?.nodes.slice(-17).map(feet)??[])]:undefined;
    const unique=authored?.filter((p,i,a)=>a.findIndex(q=>near(p,q)<.75&&Math.abs(p.y-q.y)<.75)===i);
    const c=unique&&unique.length>=2?{...(r.circuit??{routine:"circulation" as const,dwell:1.5,focus:r.workplace}),points:unique}:r.circuit;
    if(!c||c.points.length<2)return r;
    const choices=ROLES[r.district];let role=r.profession==="guard"?choices.find(p=>p.category==="patrol")??{...ROLES.highland[0],role:"watch guard"}:choices[h%choices.length];
    if(r.landmark==="ridge-fortification"&&r.profession==="guard") {
      const posts:readonly Role[]=[
        {role:"ridge sentry",category:"patrol",prop:"staff",actions:["watch","observe","check"],place:"post"},
        {role:"wall inspector",category:"patrol",prop:"book",actions:["inspect","check","study"],place:"post"},
        {role:"gate patrol",category:"patrol",prop:"staff",actions:["watch","greet","check"],place:"post"},
      ];role=posts[h%posts.length];
    }
    const publicPoints=c.points.filter(p=>(urban.roadsByChunk.get(`${Math.floor(p.x/16)},${Math.floor(p.z/16)}`)??[]).some(road=>!road.owner&&nearestRoadPoint(road,p.x,p.z).distance<=road.half+1)||!!r.landmark||r.neighborhood?.startsWith("region9:")||r.neighborhood==="monument8:panda");
    const available=publicPoints.length>=2?publicPoints:c.points;
    // A micro-action leg must not cut through a pagoda between floors.
    // Keep its endpoints on one locally walkable elevation band.
    const levelPoints=r.landmark?available.filter(p=>available.some(q=>near(p,q)>=2&&near(p,q)<=12&&Math.abs(p.y-q.y)<=2)):available;
    const pool=levelPoints.length>=2?levelPoints:available;
    const at=role.category==="social"?pool.reduce((best,p,i)=>near(p,c.focus)<near(pool[best],c.focus)?i:best,0):h%pool.length;
    const start={...pool[at]},candidates=pool.map((p,i)=>({p,i,d:near(p,start)})).filter(q=>q.d>=2&&q.d<=12&&(!r.landmark||Math.abs(q.p.y-start.y)<=2)).sort((a,b)=>Math.abs(a.d-(role.category==="patrol"?7:4))-Math.abs(b.d-(role.category==="patrol"?7:4))||a.i-b.i);
    const distinct=pool.find(p=>near(p,start)>=2&&(!r.landmark||Math.abs(p.y-start.y)<=2));
    const end={...(candidates[0]?.p??distinct??pool[(at+1)%pool.length])},n=near(start,end);
    if(n<2)return r;
    // Three real, short path legs; interpolation stays on the chosen authored
    // segment and still passes loaded collision validation at runtime.
    const reach=Math.min(n,role.category==="patrol"?7:4.2),b={x:start.x+(end.x-start.x)/n*reach,y:start.y+(end.y-start.y)*Math.min(1,reach/n),z:start.z+(end.z-start.z)/n*reach};
    const mid={x:(start.x+b.x)/2,y:(start.y+b.y)/2,z:(start.z+b.z)/2};
    const positions=[start,b,mid];
    const nodes:TaskNode[]=positions.map((p,i)=>({position:p,focus:role.category==="social"?c.focus:c.routine==="work"?c.focus:i===1?start:b,action:role.actions[i%role.actions.length],seconds:role.category==="social"?2.6+(h%3)*.25:role.category==="patrol"?1.4:1.15+(h%4)*.2,place:role.place}));
    const task:TaskChain={role:role.role,category:role.category,prop:role.prop,nodes,look:residentAppearance(r.id,r.district,role.role),...(role.category==="social"?{group:`meeting:${r.neighborhood??r.district}:${Math.floor(h%6/3)}`}:{})};
    return {...r,task,circuit:{...c,points:nodes.map(n=>n.position),dwellPoints:[0,1,2],dwell:1.5,pace:role.category==="patrol"?1.55:role.category==="visit"?1.25:1.45+(h%3)*.1}};
  });
  return {...old,residents,byId:new Map(residents.map(r=>[r.id,r]))};
}
