import { hash } from "../noise";
import type { MacroPlan } from "./plan";
import { sampleTerrain, type TerrainSample } from "./terrain";

export const LAND_USE_POLICY={cell:40,superCells:10,forestCells:12,cellCount:100,forestCeiling:.15} as const;
export type LandUse="urban"|"water"|"wild-forest"|"terraced-fields"|"orchard"|"managed-meadow"|"scenic-rock";
const mod=(n:number,d:number)=>((n%d)+d)%d;
/** Each complete 400×400 world-space supertile owns exactly twelve forest
 * cells out of one hundred, for every seed, including negative coordinates.
 * Eligibility can only remove woodland. Wild trunks AND canopies must stay
 * inside that mask; managed orchards use visibly planted rows instead. */
export function forestMask(seed:number,x:number,z:number) {
  const cx=Math.floor(x/LAND_USE_POLICY.cell),cz=Math.floor(z/LAND_USE_POLICY.cell),sx=Math.floor(cx/10),sz=Math.floor(cz/10);
  const offset=Math.floor(hash(sx,sz,seed,861)*100),i=mod(cx,10)+mod(cz,10)*10;
  return (i*37+offset)%100<LAND_USE_POLICY.forestCells;
}
export function forestTreeAllowed(seed:number,x:number,z:number,radius=3) {
  return forestMask(seed,x,z)&&forestMask(seed,x-radius,z-radius)&&forestMask(seed,x+radius,z-radius)&&forestMask(seed,x-radius,z+radius)&&forestMask(seed,x+radius,z+radius);
}
export function landUseAt(m:MacroPlan,x:number,z:number,t:TerrainSample=sampleTerrain(m,x,z)):LandUse {
  if(t.urban)return "urban";if(t.water)return "water";
  if(t.region==="cliff"||t.region==="ridge")return "scenic-rock";
  if(forestMask(m.seed,x,z))return "wild-forest";
  if(t.height>70||t.scenic)return "scenic-rock";
  const parcel=Math.floor(hash(Math.floor(x/64),Math.floor(z/64),m.seed,862)*10);
  return t.height<55?(parcel<6?"terraced-fields":parcel<9?"orchard":"managed-meadow"):parcel<4?"terraced-fields":"managed-meadow";
}
/** Denominator includes every sampled overworld surface cell, with water and
 * existing urban/scenic land reported separately. Potential woodland is a
 * conservative upper bound, not a relabeling of arbitrary random trees. */
export function measureLandUse(m:MacroPlan,bounds={x1:-800,x2:800,z1:-880,z2:800},step=8) {
  const counts:Record<LandUse,number>={urban:0,water:0,"wild-forest":0,"terraced-fields":0,orchard:0,"managed-meadow":0,"scenic-rock":0};let total=0,potential=0;
  for(let z=bounds.z1;z<bounds.z2;z+=step)for(let x=bounds.x1;x<bounds.x2;x+=step){total++;if(forestMask(m.seed,x,z))potential++;counts[landUseAt(m,x,z)]++;}
  return{bounds,step,total,counts,potentialForest:potential/total,genericForest:counts["wild-forest"]/total,dryForest:counts["wild-forest"]/(total-counts.water),globalCompleteSupertileUpperBound:LAND_USE_POLICY.forestCells/LAND_USE_POLICY.cellCount};
}
