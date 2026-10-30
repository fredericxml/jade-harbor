import type { MacroPlan } from "../geography/plan";
import { sampleTerrain, type TerrainSample } from "../geography/terrain";
import { hash } from "../noise";
import { footprintBounds } from "../geography/geometry";
import { regionAt, type RegionalPlan } from "./plan";

export type RegionalLandUse="urban"|"water"|"wild-forest"|"regional-destination"|"tea-terrace"|"managed-orchard"|"riverside"|"scenic-rock"|"meadow"|"regional-landscape";
export {REGIONAL_FOREST_POLICY,regionalForestMask,regionalForestTreeAllowed} from "./forest-policy";
import {regionalForestMask} from "./forest-policy";
import {landscapeAt} from "./landscapes";
export function regionalLandUseAt(m:MacroPlan,p:RegionalPlan,x:number,z:number,t:TerrainSample=sampleTerrain(m,x,z)):RegionalLandUse {
  if(t.urban)return"urban";if(t.water)return"water";
  if(regionAt(p,x,z))return"regional-destination";
  if(t.region==="cliff"||t.region==="ridge")return"scenic-rock";
  if(regionalForestMask(m.seed,x,z))return"wild-forest";
  if(landscapeAt(p.landscapes,x,z))return"regional-landscape";
  if(Math.abs(t.riverDistance)<65)return"riverside";
  const tea=p.sites.find(s=>s.id==="mist-tea-village")!;
  if(Math.hypot(x-tea.arrival.x,z-tea.arrival.z)<120&&t.height<150)return"tea-terrace";
  if(t.height>70||t.scenic)return"scenic-rock";
  const tulou=p.sites.find(s=>s.id==="willow-tulou")!;
  if(Math.hypot(x-tulou.arrival.x,z-tulou.arrival.z)<100&&hash(Math.floor(x/32),Math.floor(z/32),m.seed,962)>.5)return"managed-orchard";
  return"meadow";
}
export function measureRegionalLandUse(m:MacroPlan,p:RegionalPlan,step=8) {
  const bounds=footprintBounds(m.envelope),counts:Record<RegionalLandUse,number>={urban:0,water:0,"wild-forest":0,"regional-destination":0,"tea-terrace":0,"managed-orchard":0,riverside:0,"scenic-rock":0,meadow:0,"regional-landscape":0};let total=0,potential=0;
  for(let z=bounds.z1;z<bounds.z2;z+=step)for(let x=bounds.x1;x<bounds.x2;x+=step){total++;if(regionalForestMask(m.seed,x,z))potential++;counts[regionalLandUseAt(m,p,x,z)]++;}
  return{bounds,step,total,counts,genericForest:counts["wild-forest"]/total,potentialForest:potential/total,convertedRegion:counts["regional-destination"]/total,convertedFormerWoodland:counts["regional-landscape"]/total,completeSupertileUpperBound:.04};
}
