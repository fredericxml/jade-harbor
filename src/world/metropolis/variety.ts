import { B } from "../blocks";
import { hash } from "../noise";
import { VoxelWriter } from "../city/writer";
import { districtSpec, type DistrictId, type RoofFamily } from "./districts";
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
export const buildingFamilies = (id: DistrictId) => FAMILIES[id];
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

export function drawVariedLot(writer: VoxelWriter, lot: UrbanLot, design: BuildingDesign) {
  const {w,d,fill,put}=writer.local(lot),spec=districtSpec(lot.districtId),base=lot.baseY,door=Math.floor((w-1)/2),court=["court","paired-court","work-court"].includes(design.massing)&&w>=22&&d>=20;
  const tile=design.tile,timber=spec.timber,wall=design.wall,volumes=buildingVolumes(lot,design);
  fill(0,base,0,w-1,base,d-1,lot.districtId==="harbor"?B.Planks:spec.pavement);
  function roof(u:number,v:number,width:number,depth:number,y:number,profile:RoofProfile) {
    if(width<3||depth<3)return;
    if(profile==="terrace") {fill(u,y,v,u+width-1,y,v+depth-1,B.Paving);for(const z of[v,v+depth-1])fill(u,y+1,z,u+width-1,y+1,z,B.Fence);for(const x of[u,u+width-1])fill(x,y+1,v,x,y+1,v+depth-1,B.Fence);return;}
    if(profile==="double"&&width>=9&&depth>=9){fill(u-1,y,v-1,u+width,y,v+depth,tile);fill(u+1,y+1,v+1,u+width-2,y+2,v+depth-2,wall);roof(u+1,v+1,width-2,depth-2,y+3,"hip");return;}
    if(profile==="split"&&width>=13){const a=Math.floor(width*.47);roof(u,v,a,depth,y,"gable");roof(u+a+1,v,width-a-1,depth,y+1,"half-hip");return;}
    if(profile==="stepped"&&depth>=10){const front=Math.floor(depth*.5);roof(u,v,width,front,y,"gable");roof(u,v+front,width,depth-front,y+2,"hip");return;}
    const rise=Math.max(2,Math.min(5,Math.floor(depth/2))),hip=profile==="hip"||profile==="half-hip";
    for(let k=0;k<rise;k++){const dv=Math.min(Math.floor(depth/2)-1,k),du=hip?Math.min(Math.floor(width/2)-1,profile==="half-hip"?Math.max(0,k-1):k):0;fill(u-1+du,y+k,v-1+dv,u+width-du,y+k,v+depth-dv,tile);}
    const ridge=profile==="hip"?Math.min(rise-1,Math.floor(width/2)-1):0;
    fill(u+ridge,y+rise,v+Math.floor(depth/2),u+width-1-ridge,y+rise,v+Math.floor(depth/2),timber);
    if(design.seed%2===0)for(const x of[u-1,u+width])for(const z of[v-1,v+depth])put(x,y+1,z,tile);
  }
  for(let index=0;index<volumes.length;index++) {
    const a=volumes[index],height=lot.districtId==="harbor"&&design.family==="cargo-warehouse"?7:5;
    for(let f=0;f<a.floors;f++) {
      const y=base+f*height,upper=f>0&&design.massing==="stepped"?1:0,left=a.u+upper,right=a.u+a.w-1-upper,front=a.v,back=a.v+a.d-1;
      if(f)fill(left,y,front,right,y,back,B.Planks);
      if(!a.open){for(const z of[front,back])fill(left,y+1,z,right,y+height-1,z,wall);for(const x of[left,right])fill(x,y+1,front,x,y+height-1,back,wall);}
      else for(const x of[left,right])for(const z of[front,back])fill(x,y+1,z,x,y+height-1,z,timber);
      for(let x=left;x<=right;x+=design.bay){for(const z of[front,back])fill(x,y+1,z,x,y+height-1,z,timber);}
      for(const z of[front,back])fill(left,y+height-1,z,right,y+height-1,z,timber);
      for(let x=left+1;x<right-1;x+=design.bay)for(const z of[front,back])fill(x,y+2,z,Math.min(x+1,right-1),y+3,z,design.seed%3===0?B.Paper:B.Glass);
      for(let z=front+2;z<back-1;z+=design.bay+1)for(const x of[left,right])fill(x,y+2,z,x,y+3,Math.min(back-1,z+1),B.Glass);
      if(f===0) {
        const localDoor=Math.max(left+1,Math.min(right-1,door));fill(localDoor-1,y+1,front,localDoor+1,y+3,front,B.Air);
        if(design.family==="cargo-warehouse")fill(door-2,y+1,front,door+2,y+5,front,B.Air);
        if(design.family.includes("arcade")&&front===0){fill(left+1,y+1,0,right-1,y+3,1,B.Air);for(let x=left;x<=right;x+=design.bay)fill(x,y+1,0,x,y+4,0,timber);fill(left,y+4,0,right,y+4,1,timber);}
        if(index>0||court)fill(localDoor-1,y+1,back,localDoor+1,y+3,back,B.Air);
        if(!court&&front===0&&lot.districtId!=="hutong") {
          fill(left+1,y+1,front,Math.max(left+1,door-3),y+2,front,B.Air);
          fill(left+1,y+1,front+1,Math.max(left+1,door-3),y+1,front+1,B.Planks);
          put(left+1,y+2,front+1,lot.districtId==="artisan"?B.Pottery:lot.districtId==="harbor"?B.Crate:B.Porcelain);
        }
      }
      if(f>0&&design.balcony&&front===0){fill(left,y,-1,right,y,-1,B.Planks);fill(left,y+1,-1,right,y+1,-1,B.Fence);fill(door-1,y+1,front,door+1,y+3,front,B.Air);}
    }
    roof(a.u,a.v,a.w,a.d,base+a.floors*height,design.roof);
  }
  if(court){
    // Preserve the door-to-court axis and seed-specific compact landscaping.
    fill(door-2,base+1,0,door+2,base+3,6,B.Air);fill(door-3,base+4,0,door+3,base+4,1,tile);
    fill(door-1,base,0,door+1,base,d-2,B.Paving);
    if(lot.districtId==="scholar"){const u=Math.min(w-7,door+4);fill(u,base,8,u+3,base,12,B.Water);put(u+1,base+1,10,B.Lotus);}
    if(lot.districtId==="artisan"){put(w-7,base+1,8,B.Furnace);put(w-7,base+1,11,B.Anvil);fill(w-5,base+1,d-6,w-4,base+11,d-5,B.Brick);}
  }
  // A clear center aisle keeps all released home/work points usable even when
  // a split facade or taller rear volume changes the silhouette.
  fill(door-1,base+1,0,door+1,base+3,d-2,B.Air);
  if(!court&&w>=9&&d>=9&&design.floors>1)for(let f=0;f<design.floors-1;f++){
    const y=base+f*5;fill(1,y+5,3,4,y+5,7,B.Air);
    for(let n=1;n<=10;n++){const u=n<=5?1:3,v=n<=5?n+2:13-n,h=Math.ceil(n/2);fill(u,y+1,v,u+1,y+h-1,v,B.Planks);fill(u,y+h,v,u+1,y+h,v,n%2?B.Slab:B.Planks);fill(u,y+h+1,v,u+1,y+h+2,v,B.Air);}
  }
  const sign=[B.MarketSign,B.TeaSign,B.NoodleSign,B.Banner][design.sign];
  if(spec.signs){put(design.seed%2?1:w-2,base+3,-1,sign);if(w>11&&design.seed%3===0)put(w-2,base+3,-1,[B.TeaSign,B.MarketSign,B.Banner][design.seed%3]);}
  for(const u of design.seed%2?[1]:[1,w-2])put(u,base+4,-1,B.Lantern);
  if(!court&&design.seed%3===0){fill(0,base+4,-1,Math.max(1,door-2),base+4,-1,tile);put(Math.max(1,door-3),base+1,-1,B.Pottery);}
  put(w-3,base+1,d-3,lot.districtId==="harbor"?B.Crate:lot.districtId==="artisan"?B.Workbench:B.Bed);put(w-3,base+1,d-5,B.Chest);
}
