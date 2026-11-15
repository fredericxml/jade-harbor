import { B } from "../blocks";
import { hash } from "../noise";
import { districtSpec, type DistrictId } from "./districts";
import type { UrbanLot } from "./plan";

export type Massing = "street-bar" | "rear-wing" | "corner-wing" | "split-front" | "stepped" | "court" | "paired-court" | "work-court";
export type RoofProfile = "gable" | "hip" | "half-hip" | "double" | "split" | "stepped" | "terrace";
export type BuildingDesign = { family: string; massing: Massing; roof: RoofProfile; floors: number; upper: number; bay: number; wall: number; tile: number; accent: number; recess: number; sign: number; balcony: boolean; seed: number };
export type Volume = { u: number; v: number; w: number; d: number; floors: number; open?: boolean };
const cmp=(a:string,b:string)=>a<b?-1:a>b?1:0;
const FAMILIES: Record<DistrictId, readonly string[]> = {
  heritage: ["civic-shophouse", "lane-merchant", "arcade-house", "courtyard-inn", "corner-teahouse"],
  market: ["narrow-stall-house", "merchant-shophouse", "corner-market", "arcade-shop", "merchant-court", "stepped-inn"],
  hutong: ["lane-house", "small-court", "paired-residence", "gate-compound", "corner-residence"],
  "water-town": ["canal-shophouse", "bridge-teahouse", "water-court", "waterside-inn", "timber-merchant"],
  imperial: ["service-court", "attendant-house", "formal-townhouse", "gate-lodge", "ceremonial-compound"],
  harbor: ["cargo-warehouse", "guild-house", "dock-office", "merchant-row", "waterfront-inn", "workshop-shed"],
  artisan: ["pottery-court", "kiln-workshop", "carpenter-house", "metal-workyard", "artisan-row"],
  scholar: ["garden-residence", "refined-townhouse", "pavilion-court", "scholar-inn", "affluent-court"],
  nightlife: ["tea-arcade", "lantern-inn", "food-shophouse", "terrace-house", "corner-commercial", "merchant-court"],
  highland: ["terrace-residence", "stair-shop", "cliff-inn", "overlook-court", "guard-lodge"],
};
const PROFILES: readonly RoofProfile[] = ["gable", "hip", "half-hip", "split", "stepped", "double"];
export function designBuildings(lots: readonly UrbanLot[], seed: number) {
  const designs = new Map<string, BuildingDesign>(), bins = new Map<string, UrbanLot[]>();
  const sorted = [...lots].sort((a,b)=>cmp(a.districtId,b.districtId)||a.z1-b.z1||a.x1-b.x1||cmp(a.id,b.id));
  for (const lot of sorted) {
    const spec = districtSpec(lot.districtId), w = lot.facing % 2 ? lot.z2-lot.z1+1 : lot.x2-lot.x1+1, d = lot.facing % 2 ? lot.x2-lot.x1+1 : lot.z2-lot.z1+1;
    const n = Math.floor(hash(lot.x1,lot.z1,seed,8081)*0x7fffffff), familyList=FAMILIES[lot.districtId];
    const cx=(lot.x1+lot.x2)/2,cz=(lot.z1+lot.z2)/2,gx=Math.floor(cx/32),gz=Math.floor(cz/32),near:BuildingDesign[]=[];
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)for(const other of bins.get(`${gx+dx},${gz+dz}`)??[])if(Math.hypot((other.x1+other.x2)/2-cx,(other.z1+other.z2)/2-cz)<32)near.push(designs.get(other.id)!);
    let choice:BuildingDesign|undefined,best=Infinity;
    for(let attempt=0;attempt<8;attempt++) {
      const k=(n+attempt*17)>>>0,family=familyList[(n+attempt)%familyList.length],large=w>=22&&d>=20;
      const low=["hutong","harbor","highland","scholar","imperial"].includes(lot.districtId);
      const floors=family==="cargo-warehouse"?1:lot.districtId==="nightlife"?2+k%3:low?1+(k%3===0?1:0):1+k%3;
      let massing:Massing=large?(["court","paired-court","rear-wing","work-court","corner-wing"] as const)[k%5]:w>=12&&d>=12?(["street-bar","rear-wing","corner-wing","split-front","stepped"] as const)[k%5]:k%3===0?"stepped":"street-bar";
      if(family.includes("corner")&&w>=12&&d>=12)massing="corner-wing";
      else if((family.includes("court")||family.includes("compound"))&&large)massing=lot.districtId==="artisan"?"work-court":k%2?"court":"paired-court";
      else if(family.includes("warehouse"))massing="street-bar";
      else if((family.includes("row")||family.includes("shed"))&&w>=12&&d>=12)massing="split-front";
      if(lot.districtId==="harbor")massing=family==="cargo-warehouse"?"street-bar":family==="merchant-row"||family==="workshop-shed"?"split-front":family==="waterfront-inn"?"stepped":family==="dock-office"?"corner-wing":large?"court":"rear-wing";
      const roof:RoofProfile=lot.districtId==="nightlife"&&k%5===0?"terrace":PROFILES[(Math.floor(n/7)+attempt*5)%PROFILES.length];
      const roofTiles=lot.districtId==="market"?[spec.tile,B.Roof,B.BrownRoof]:lot.districtId==="water-town"?[spec.tile,B.BrownRoof,B.JadeRoof]:lot.districtId==="nightlife"?[spec.tile,B.RubyRoof,B.Roof]:[spec.tile,spec.tile,B.BrownRoof];
      const wall=lot.districtId==="harbor"?[B.Planks,B.Brick,B.CreamWall][Math.floor(k/5)%3]:lot.districtId==="imperial"?spec.wall:[spec.wall,spec.wall,B.CreamWall,B.Marble][Math.floor(k/5)%4];
      const candidate:BuildingDesign={family,massing,roof,floors,upper:Math.max(1,floors-1),bay:3+k%3,wall,tile:roofTiles[Math.floor(k/11)%roofTiles.length],accent:spec.accent,recess:k%3===0?1:0,sign:Math.floor(k/13)%4,balcony:floors>1&&k%3!==0,seed:k};
      const score=near.reduce((s,p)=>s+(p.family===family?5:0)+(p.massing===massing?2:0)+(p.roof===roof&&p.floors===floors?5:0)+(p.tile===candidate.tile?1:0),0)+attempt*.03;
      if(score<best){best=score;choice=candidate;}
    }
    designs.set(lot.id,choice!);const key=`${gx},${gz}`,list=bins.get(key)??[];list.push(lot);bins.set(key,list);
  }
  return designs;
}

/** Actual occupied volumes, shared by realization and area diagnostics. Courts
 * retain a clear center aisle and the original ground-floor home/work anchors. */
export function buildingVolumes(lot: UrbanLot, design: BuildingDesign): Volume[] {
  const w=lot.facing%2?lot.z2-lot.z1+1:lot.x2-lot.x1+1,d=lot.facing%2?lot.x2-lot.x1+1:lot.z2-lot.z1+1;
  const f=design.floors,wing=Math.max(4,Math.min(Math.floor((w-9)/2),20,Math.round(w*.24)+design.seed%3-1)),rear=Math.min(d-5,22,Math.max(7,Math.round(d*.26)+Math.floor(design.seed/3)%3-1));
  if(["court","paired-court","work-court"].includes(design.massing)&&w>=22&&d>=20) {
    const out:Volume[]=[{u:0,v:d-rear,w,d:rear,floors:f},{u:0,v:3,w:wing,d:d-rear-2,floors:Math.max(1,f-1),open:design.family.includes("pavilion")}];
    if(design.massing!=="work-court")out.push({u:w-wing,v:design.massing==="paired-court"?6:3,w:wing,d:d-rear-(design.massing==="paired-court"?5:2),floors:design.upper});
    // Front wings frame a five-block gate instead of leaving a whole empty lot.
    const side=Math.max(3,Math.floor((w-7)/2));out.push({u:0,v:0,w:side,d:5,floors:1},{u:w-side,v:0,w:side,d:5,floors:1});
    if(w>=48&&d>=44)out.push({u:wing+1,v:Math.floor(d/2)-3,w:w-wing*2-2,d:7,floors:1});
    return out;
  }
  if(design.massing==="rear-wing"&&w>=12&&d>=12)return [{u:0,v:0,w,d:Math.max(7,Math.floor(d*.62)),floors:f},{u:design.seed%2?0:Math.floor(w*.55),v:Math.floor(d*.62),w:Math.ceil(w*.45),d:d-Math.floor(d*.62),floors:design.upper}];
  if(design.massing==="corner-wing"&&w>=12&&d>=12)return [{u:0,v:0,w,d:Math.max(7,Math.floor(d*.6)),floors:f},{u:design.seed%2?0:w-5,v:Math.floor(d*.6),w:5,d:d-Math.floor(d*.6),floors:design.upper}];
  if(design.massing==="split-front"&&w>=12&&d>=12){const left=Math.floor(w*.48);return [{u:0,v:0,w:left,d,floors:f},{u:left,v:0,w:w-left,d:Math.max(7,d-2),floors:design.upper}];}
  if(design.massing==="stepped"&&w>=8&&d>=9)return [{u:0,v:0,w,d:Math.max(6,Math.floor(d*.55)),floors:f},{u:0,v:Math.floor(d*.55),w,d:d-Math.floor(d*.55),floors:design.upper}];
  return [{u:0,v:0,w,d,floors:f}];
}
