import type { World } from "../../world/world";
import type { Vec3 } from "../../core/coords";
import type { PopulationPlan, ResidentPlan } from "./population";
import { identityHash } from "./schedules";
import { PROFESSIONS, type Profession } from "../professions";
import type { DistrictId } from "../../world/metropolis/districts";
import { regionalRouteAt } from "../../world/regions/plan";

export const REGIONAL_LIFE_BUDGET={perSite:16,residents:4080,active:96} as const;
/** Retain every v8 identity. Improve intent timing without changing addresses,
 * then add a small permanent host/visitor population to the new destinations.
 * Local circuits use the same grade-aware ribbons as terrain realization. */
export function addRegionalLife(world:World,old:PopulationPlan):PopulationPlan {
  const plan=world.regionalPlan;if(!plan)return old;
  const residents:ResidentPlan[]=old.residents.map(r=>{
    if(!r.circuit)return r;
    const c=r.circuit;
    // Distinguish a pause at a shop/work/viewpoint from the intermediate path
    // samples. The runtime never adds a second of idle at every waypoint.
    return{...r,circuit:{...c,dwell:c.routine==="social"?3.2:c.routine==="work"?1.5:c.routine==="patrol"?1.1:.8}};
  });
  for(const s of plan.sites) {
    const district:DistrictId=s.id==="amber-village"?"market":s.id==="willow-tulou"?"hutong":s.id==="lotus-causeway"?"scholar":"highland";
    const route=s.loop.map(p=>({x:p.x+.5,y:(regionalRouteAt(plan,p.x,p.z)?.y??p.y)+1.002,z:p.z+.5}));
    if(route.length<4)throw Error(`No regional public loop: ${s.id}`);
    for(let slot=0;slot<REGIONAL_LIFE_BUDGET.perSite;slot++) {
      const id=`inhabitant:${world.seed}:region9:${s.id}:${slot}`,h=identityHash(id),routine=slot<2?"patrol":slot<6?"work":slot>=10&&slot<14?"social":"circulation";
      const profession:Profession=routine==="patrol"?"guard":routine==="work"?s.id==="willow-tulou"?"potter":s.id==="amber-village"?"merchant":s.id==="mist-tea-village"?"farmer":"caretaker":slot>=14?"scholar":"resident";
      // A short out-and-back loop stays in one coherent public corridor.
      // Social pairs share a focus and split again after a brief meeting.
      const start=Math.floor((slot>=10&&slot<14?Math.floor(slot/2)*2:slot)*route.length/16)%route.length;
      const n=Math.min(route.length,slot<2?10:slot<6?4:6),leg:Vec3[]=[];
      for(let i=0;i<n;i++)leg.push({...route[(start+i)%route.length]});
      const points=[...leg,...leg.slice(1,-1).reverse()],workplace=points[h%points.length],home=route[start];
      const focus={...leg[Math.min(2,leg.length-1)]};
      residents.push({id,name:`${["Lin","An","Yu","Jing","Wen","Bai","Shan","Mei"][slot%8]} · ${PROFESSIONS[profession].label}`,profession,district,home,workplace,workLoop:[workplace],public:home,legacy:false,neighborhood:`region9:${s.id}`,circuit:{points,routine,focus,dwell:routine==="social"?3.2:routine==="work"?1.6:1,dwellPoints:routine==="social"?[2]:routine==="work"?[0,n-1]:routine==="patrol"?[0]:[],pace:routine==="patrol"?1.55:routine==="work"?1.3:1.45+(slot%3)*.12}});
    }
  }
  if(residents.length>REGIONAL_LIFE_BUDGET.residents||new Set(residents.map(r=>r.id)).size!==residents.length)throw Error("Regional population budget exceeded");
  return{...old,residents,byId:new Map(residents.map(r=>[r.id,r])),presence:old.presence?{...old.presence,active:96}:undefined};
}
