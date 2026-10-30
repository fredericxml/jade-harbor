import { B } from "../blocks";
import { hash } from "../noise";
import { VoxelWriter } from "../city/writer";
import { districtSpec, type DistrictId } from "./districts";
import type { UrbanLot } from "./plan";
import type { FabricPlan } from "./fabric";
import { buildingVolumes, type BuildingDesign, type Volume } from "./variety";

export const ROOF_GRAMMARS = ["gable", "hip", "clipped", "layered", "offset", "cross", "pavilion", "split-ridge", "terrace", "quay-eave"] as const;
export const FACADE_GRAMMARS = ["paired-lattice", "ribbon", "shutters", "timber-grid", "stone-base", "arcade", "screen", "recessed-bays"] as const;
export const COMPOSITIONS = ["hall", "rear-rise", "corner-tower", "split-height", "terraced", "side-wing", "gate-house", "pavilion-wing"] as const;
export const FRONTAGES = ["flush", "shop-canopy", "arcade", "recessed-porch", "gate", "double-shop"] as const;
export type RichDesign = BuildingDesign & {
  subfamily: string; composition: typeof COMPOSITIONS[number]; roofGrammar: typeof ROOF_GRAMMARS[number];
  facadeGrammar: typeof FACADE_GRAMMARS[number]; frontage: typeof FRONTAGES[number]; axis: 0 | 1;
  rise: number; eave: number; rhythm: number; cornerStyle: number; trim: number;
  footprint: readonly Volume[];
};
export type RichRoof = { u:number;v:number;w:number;d:number;level:number;axis:0|1;grammar:RichDesign["roofGrammar"] };
export type RichAssembly = { volumes:Volume[];roofs:RichRoof[];width:number;depth:number;story:number };
const SUBFAMILIES:Record<DistrictId,readonly string[]> = {
  heritage:["civic arcade","merchant hall","tea residence","gate lodge","gallery house","corner inn"],
  market:["stall house","deep merchant","corner arcade","double shop","stock courtyard","balcony inn"],
  hutong:["lane residence","courtyard gate","paired household","corner compound","timber home","community court"],
  "water-town":["canal merchant","bridge tea house","quay residence","water courtyard","gable house","pavilion inn"],
  harbor:["cargo hall","guild warehouse","dock office","quay shop","workers lodge","customs house"],
  imperial:["service hall","official residence","guard lodge","administrative court","gate compound","formal gallery"],
  artisan:["kiln court","carpenter shop","metal workshop","apprentice house","pottery gallery","stock hall"],
  scholar:["garden residence","library house","pavilion court","academy lodge","screened villa","garden gallery"],
  nightlife:["tea arcade","lantern inn","food shop","upper terrace","corner venue","merchant lodging"],
  highland:["terraced home","stair shop","ridge inn","lookout house","gate lodge","split level home"],
};
const compare=(a:string,b:string)=>a<b?-1:a>b?1:0;
/** Only dimensions that actually change emitted voxels enter this fingerprint.
 * Family names are descriptive, never a way to inflate the richness metric. */
export function visualFingerprint(d:RichDesign) {
  return [d.composition,d.floors,d.roofGrammar,d.axis,d.rise,d.eave,d.facadeGrammar,d.bay,d.rhythm,d.frontage,d.balcony,d.cornerStyle,d.wall,d.tile,d.trim].join(":");
}
export function richDesign(lot:UrbanLot,base:BuildingDesign,seed:number,attempt=0):RichDesign {
  const n=(salt:number,count:number)=>Math.floor(hash(lot.x1,lot.z1,seed+salt,10007+attempt*7919)*count);
  const district=lot.districtId,spec=districtSpec(district),sub=n(1,6);
  const roofs:RichDesign["roofGrammar"][]=district==="imperial"?["hip","pavilion","layered","clipped","cross"]:
    district==="harbor"?["gable","clipped","split-ridge","quay-eave","offset"]:
    district==="hutong"?["gable","clipped","offset","hip","split-ridge"]:
    district==="nightlife"?["gable","hip","layered","cross","terrace","split-ridge"]:[...ROOF_GRAMMARS].filter(r=>r!=="terrace"&&r!=="quay-eave");
  const low=["hutong","scholar","imperial","highland","harbor"].includes(district),max=low?2:district==="nightlife"?4:3;
  const floors=Math.max(1,Math.min(max,base.floors+(n(2,4)===0?-1:n(3,3)===0?1:0)));
  const walls=district==="imperial"?[B.Red,B.Red,B.CreamWall]:district==="harbor"?[B.Planks,B.Brick,B.CreamWall]:[spec.wall,spec.wall,B.CreamWall,B.Marble];
  const tiles=district==="imperial"?[spec.tile,B.Roof]:district==="hutong"?[B.Roof,B.BrownRoof]:district==="harbor"?[B.BrownRoof,B.Roof]:[spec.tile,B.Roof,B.BrownRoof];
  // Subfamilies select built street relationships, not just labels. Independent
  // salts then vary silhouette, roof axis, facade rhythm and material balance.
  const frontage=FRONTAGES[(sub+(district==="hutong"||district==="imperial"?4:0))%FRONTAGES.length];
  return {...base,subfamily:SUBFAMILIES[district][sub],composition:COMPOSITIONS[n(4,COMPOSITIONS.length)],
    roofGrammar:roofs[n(5,roofs.length)],facadeGrammar:FACADE_GRAMMARS[n(6,FACADE_GRAMMARS.length)],frontage,
    axis:n(7,2) as 0|1,rise:2+n(8,4),eave:n(9,2),rhythm:n(10,3),cornerStyle:n(11,3),
    floors,upper:Math.max(1,floors-1),bay:3+n(12,4),balcony:floors>1&&n(13,3)!==0,
    wall:walls[n(14,walls.length)],tile:tiles[n(15,tiles.length)],trim:district==="imperial"?B.GoldTrim:n(16,3)===0?B.Red:spec.timber,
    footprint:buildingVolumes(lot,base),seed:Math.floor(hash(lot.x1,lot.z1,seed,10123)*0x7fffffff)};
}

/** Keep the complete v9 ground-body union. Subdivision changes upper heights
 * inside it, never lot occupancy, entrances, roads, reserves or map bounds. */
export function planRichBuilding(lot:UrbanLot,d:RichDesign):RichAssembly {
  const width=lot.facing%2?lot.z2-lot.z1+1:lot.x2-lot.x1+1,depth=lot.facing%2?lot.x2-lot.x1+1:lot.z2-lot.z1+1;
  const volumes:Volume[]=[],story=5;
  const major=d.footprint.reduce((best,a,i,all)=>a.w*a.d>all[best].w*all[best].d?i:best,0);
  for(const [i,a] of d.footprint.entries()) {
    const f=i===major?d.floors:Math.max(1,d.floors-(i%2)),low=Math.max(1,f-1);
    const push=(u:number,v:number,w:number,depth:number,floors:number)=>volumes.push({...a,u,v,w,d:depth,floors});
    const widthSplit=()=>{const cut=Math.max(3,Math.min(a.w-3,Math.round(a.w*(.36+d.rhythm*.1))));push(a.u,a.v,cut,a.d,d.composition==="side-wing"?low:f);push(a.u+cut,a.v,a.w-cut,a.d,d.composition==="side-wing"?f:low);};
    if(i===major&&["split-height","side-wing"].includes(d.composition)&&a.w>=8)widthSplit();
    else if(i===major&&d.composition==="corner-tower"&&a.w>=9&&a.d>=8){const x=Math.max(3,Math.floor(a.w*.4)),z=Math.max(3,Math.floor(a.d*.45));push(a.u,a.v,x,z,f);push(a.u+x,a.v,a.w-x,z,low);push(a.u,a.v+z,a.w,a.d-z,low);}
    else if(i===major&&d.composition==="terraced"&&a.d>=9){const z=Math.floor(a.d/3);push(a.u,a.v,a.w,z,Math.max(1,f-2));push(a.u,a.v+z,a.w,z,low);push(a.u,a.v+z*2,a.w,a.d-z*2,f);}
    else if(i===major&&["rear-rise","pavilion-wing","gate-house"].includes(d.composition)&&a.d>=7){const z=Math.max(3,Math.floor(a.d*.58));push(a.u,a.v,a.w,z,d.composition==="gate-house"?f:low);push(a.u,a.v+z,a.w,a.d-z,d.composition==="gate-house"?low:f);}
    else volumes.push({...a,floors:f});
  }
  for(const a of volumes)if(a.w<3||a.d<2||a.u<0||a.v<0||a.u+a.w>width||a.v+a.d>depth||!Number.isInteger(a.floors))throw Error(`Invalid v10 body: ${lot.id}`);
  const roofs:RichRoof[]=[];
  for(const a of volumes) {
    // A broad compound gets supported roof bays rather than one enormous
    // flat cap. Changing the ridge axis still respects a human-scale span.
    const span=d.axis?a.w:a.d,count=d.roofGrammar==="terrace"?1:Math.ceil(span/18);
    for(let i=0;i<count;i++) {
      const start=Math.floor(span*i/count),length=Math.floor(span*(i+1)/count)-start;
      roofs.push({u:a.u+(d.axis?start:0),v:a.v+(d.axis?0:start),w:d.axis?length:a.w,d:d.axis?a.d:length,level:lot.baseY+a.floors*story,axis:d.axis,grammar:d.roofGrammar});
    }
  }
  return {volumes,roofs,width,depth,story};
}

export function createRichFabric(previous:FabricPlan,seed:number) {
  const designs=new Map<string,RichDesign>(),bins=new Map<string,UrbanLot[]>();
  for(const lot of [...previous.urban.lots].sort((a,b)=>compare(a.districtId,b.districtId)||a.z1-b.z1||a.x1-b.x1||compare(a.id,b.id))) {
    const gx=Math.floor(lot.x1/40),gz=Math.floor(lot.z1/40),near:RichDesign[]=[];
    for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++)for(const other of bins.get(`${gx+x},${gz+z}`)??[])if(Math.hypot(other.x1-lot.x1,other.z1-lot.z1)<48)near.push(designs.get(other.id)!);
    let chosen:RichDesign|undefined,best=Infinity;
    for(let attempt=0;attempt<20;attempt++) {
      const d=richDesign(lot,previous.designs.get(lot.id)!,seed,attempt),signature=visualFingerprint(d);
      const score=near.reduce((n,p)=>n+(visualFingerprint(p)===signature?1000:0)+(p.roofGrammar===d.roofGrammar&&p.axis===d.axis&&p.floors===d.floors?25:0)+(p.composition===d.composition?4:0)+(p.facadeGrammar===d.facadeGrammar?5:0)+(p.frontage===d.frontage?2:0),0)+attempt*.01;
      if(score<best){best=score;chosen=d;}
    }
    designs.set(lot.id,chosen!);const key=`${gx},${gz}`,list=bins.get(key)??[];list.push(lot);bins.set(key,list);
  }
  const lots=previous.urban.lots.map(l=>({...l,floors:designs.get(l.id)!.floors,roof:designs.get(l.id)!.tile})),byId=new Map(lots.map(l=>[l.id,l]));
  const urban={...previous.urban,lots,lotsByChunk:new Map([...previous.urban.lotsByChunk].map(([k,a])=>[k,a.map(l=>byId.get(l.id)!)]))};
  urban.residentCity={...urban.residentCity,structures:urban.residentCity.structures.map(s=>byId.get(s.id)??s),byChunk:new Map([...urban.residentCity.byChunk].map(([k,a])=>[k,a.map(s=>byId.get(s.id)??s)]))};
  return {...previous,urban,designs};
}

export function drawRichLot(writer:VoxelWriter,lot:UrbanLot,d:RichDesign,a:RichAssembly) {
  const {fill,put}=writer.local(lot),base=lot.baseY,{width:w,depth:depth,story,volumes}=a,spec=districtSpec(lot.districtId),timber=spec.timber,door=Math.floor((w-1)/2);
  const covers=(b:Volume,u:number,v:number,y:number)=>u>=b.u&&u<b.u+b.w&&v>=b.v&&v<b.v+b.d&&y<=base+b.floors*story;
  const body=(u:number,v:number,y:number)=>volumes.some(b=>covers(b,u,v,y));
  const closed=(u:number,v:number,y:number)=>volumes.some(b=>!b.open&&covers(b,u,v,y));
  const inChunk=(u:number,v:number)=>{const [x,z]=lot.facing===0?[lot.x1+u,lot.z1+v]:lot.facing===1?[lot.x2-v,lot.z1+u]:lot.facing===2?[lot.x2-u,lot.z2-v]:[lot.x1+v,lot.z2-u];return x>=writer.ox&&x<writer.ox+16&&z>=writer.oz&&z<writer.oz+16;};
  const roofPut=(u:number,y:number,v:number,id:number)=>{if(inChunk(u,v)&&!volumes.some(b=>covers(b,u,v,y)&&base+b.floors*story>y))put(u,y,v,id);};
  fill(0,base,0,w-1,base,depth-1,lot.districtId==="harbor"?B.Planks:spec.pavement);
  for(const b of volumes)for(let f=0;f<b.floors;f++) {
    const y=base+f*story,left=b.u,right=b.u+b.w-1,front=b.v,back=b.v+b.d-1;
    if(f)fill(left,y,front,right,y,back,B.Planks);
    for(let z=front;z<=back;z++)for(let x=left;x<=right;x++) {
      if(!inChunk(x,z)||x!==left&&x!==right&&z!==front&&z!==back)continue;
      for(let h=1;h<story;h++) {
        const level=y+h;if(closed(x-1,z,level)&&closed(x+1,z,level)&&closed(x,z-1,level)&&closed(x,z+1,level))continue;
        const horizontal=z===front||z===back,t=horizontal?x-left:z-front,length=horizontal?right-left:back-front;
        const corner=(x===left||x===right)&&(z===front||z===back),phase=(t+d.rhythm*f)%d.bay;
        const post=corner||phase===0,beam=h===4;
        if(b.open&&!post&&!beam)continue;
        let id=post||beam?timber:d.wall;
        let window=h>=2&&h<=3&&!post&&t>0&&t<length;
        if(d.facadeGrammar==="paired-lattice")window&&=phase<=2;
        if(d.facadeGrammar==="shutters")window&&=phase===2;
        if(d.facadeGrammar==="timber-grid")window&&=phase<d.bay-1;
        if(d.facadeGrammar==="stone-base"&&f===0){window&&=h===3;id=h===1?B.SculptureStone:id;}
        if(d.facadeGrammar==="screen")window&&=t%2!==0;
        if(d.facadeGrammar==="recessed-bays")window&&=phase>=2&&phase<d.bay-1;
        if(window&&!b.open)id=["paired-lattice","screen","timber-grid"].includes(d.facadeGrammar)?B.Paper:B.Glass;
        if(d.facadeGrammar==="shutters"&&!post&&phase===1&&h>=2&&h<=3)id=B.Planks;
        if(d.facadeGrammar==="timber-grid"&&h===2&&f>0)id=timber;
        if(corner&&d.cornerStyle===1)id=B.SculptureStone;
        if(beam&&d.cornerStyle===2)id=d.trim;
        if(d.facadeGrammar==="arcade"&&f===0&&horizontal&&!post&&h<4)id=B.Air;
        put(x,level,z,id);
      }
    }
    if(f===0) {
      const entry=Math.max(left+1,Math.min(right-1,door));fill(entry,y+1,front,entry,y+3,front,B.Air);
      if(front>0)fill(entry,y+1,back,entry,y+3,back,B.Air);
    }
    if(f>0&&front===0&&d.balcony) {
      const start=left+(d.rhythm===1?1:0),end=right-(d.rhythm===2?1:0);
      fill(start,y,-1,end,y,-1,B.Planks);
      for(let x=start;x<=end;x++){if((x-start)%(d.rhythm+2)===0)put(x,y+1,-1,B.Fence);put(x,y+2,-1,timber);}
      for(const x of[start,end]){put(x,y-1,-1,timber);put(x,y-1,0,timber);}
      if(door>left&&door<right)fill(door,y+1,0,door,y+3,0,B.Air);
    }
  }
  const pitched=(r:RichRoof,grammar:RichDesign["roofGrammar"]=r.grammar)=>{
    const axis=r.axis,U=axis?r.d:r.w,V=axis?r.w:r.d;
    const emit=(u:number,y:number,v:number,id:number)=>axis?roofPut(r.u+v,y,r.v+u,id):roofPut(r.u+u,y,r.v+v,id);
    const rise=Math.max(1,Math.min(d.rise+(grammar==="pavilion"?1:0),Math.floor(V/2))),hip=["hip","pavilion","clipped"].includes(grammar),e=d.eave;
    const slope=Math.floor((V+e*2-1)/2),end=Math.floor((U+e*2-1)/2);let lastDu=0;
    for(let k=0;k<rise;k++) {
      const t=rise===1?0:k/(rise-1),dv=Math.round(slope*t);
      const du=hip?Math.round((grammar==="pavilion"?end:Math.min(end,slope))*(grammar==="clipped"?Math.max(0,(t-.45)/.55):t)):0;lastDu=du;
      for(let v=-e+dv;v<V+e-dv;v++)for(let u=-e+du;u<U+e-du;u++)emit(u,r.level+k,v,d.tile);
    }
    const ridge=Math.floor(V/2),short=hip?Math.max(0,lastDu-e):0;
    for(let u=short;u<U-short;u++)emit(u,r.level+rise,ridge,timber);
  };
  for(const r of a.roofs) {
    if(r.grammar==="terrace") {
      for(let z=r.v;z<r.v+r.d;z++)for(let x=r.u;x<r.u+r.w;x++){roofPut(x,r.level,z,B.Paving);if(x===r.u||x===r.u+r.w-1||z===r.v||z===r.v+r.d-1)roofPut(x,r.level+1,z,B.Fence);}
    } else if(r.grammar==="layered"&&r.w>=7&&r.d>=7) {
      for(let z=r.v-1;z<=r.v+r.d;z++)for(let x=r.u-1;x<=r.u+r.w;x++)roofPut(x,r.level,z,d.tile);
      for(let z=r.v+1;z<r.v+r.d-1;z++)for(let x=r.u+1;x<r.u+r.w-1;x++)for(let h=1;h<=2;h++)roofPut(x,r.level+h,z,x===r.u+1||x===r.u+r.w-2||z===r.v+1||z===r.v+r.d-2?d.wall:B.Planks);
      pitched({...r,u:r.u+1,v:r.v+1,w:r.w-2,d:r.d-2,level:r.level+3},"hip");
    } else if(["split-ridge","offset"].includes(r.grammar)&&r.w>=8) {
      const cut=Math.max(3,Math.min(r.w-3,Math.floor(r.w*(r.grammar==="offset"?.4:.5))));
      pitched({...r,w:cut},"gable");
      for(let z=r.v;z<r.v+r.d;z++)for(let x=r.u+cut;x<r.u+r.w;x++)roofPut(x,r.level,z,B.Planks);
      pitched({...r,u:r.u+cut,w:r.w-cut,level:r.level+1,axis:(1-r.axis) as 0|1},"clipped");
    } else {
      pitched(r,r.grammar==="cross"||r.grammar==="quay-eave"?"gable":r.grammar);
      if(r.grammar==="cross"&&r.w>=7&&r.d>=7)pitched({...r,u:r.u+2,w:r.w-4,axis:(1-r.axis) as 0|1},"gable");
      if(r.grammar==="quay-eave")for(let x=r.u;x<r.u+r.w;x++) {
        roofPut(x,r.level-1,r.v-1,d.tile);
        if(x===r.u||x===r.u+r.w-1)roofPut(x,r.level-2,r.v-1,timber);
      }
    }
  }
  // All attachments have a real wall/beam behind them. Court gaps receive a
  // supported gate, not floating signs or a free-standing decorative fragment.
  for(let x=0;x<w;x++)if(body(x,0,base+4)) {
    if(d.frontage==="shop-canopy"||d.frontage==="double-shop"){put(x,base+4,-1,d.tile);if(x%Math.max(3,d.bay)===0)put(x,base+3,-1,timber);}
    if((d.frontage==="arcade"||d.frontage==="recessed-porch")&&x>0&&x<w-1&&x%d.bay!==0) {
      fill(x,base+1,0,x,base+3,0,B.Air);
      if(d.frontage==="recessed-porch")fill(x,base+1,1,x,base+3,1,(x+d.rhythm)%2?B.Paper:d.wall);
    }
  }
  if(d.frontage==="gate"&&w>=5&&body(door,0,base+4)) {
    for(const x of[door-2,door+2])fill(x,base+1,0,x,base+4,0,d.trim);
    fill(door-2,base+4,0,door+2,base+4,0,d.tile);
  }
  if(d.frontage==="double-shop"&&w>=10)for(const x of[2,w-3])if(body(x,0,base+3))fill(x,base+1,0,x,base+3,0,B.Air);
  if(!body(door,0,base+4)&&w>=9){for(const x of[door-3,door+3])fill(x,base+1,0,x,base+4,0,timber);fill(door-3,base+4,0,door+3,base+4,0,d.tile);}
  for(const x of[1,w-2])if(body(x,0,base+3)) {
    if(spec.signs)put(x,base+3,-1,[B.MarketSign,B.TeaSign,B.NoodleSign,B.Banner][(d.sign+(x===1?0:d.rhythm))%4]);
    put(x,base+4,-1,B.Lantern);
  }
  // Retain the garden/workyard uses of the released courtyard footprints.
  // Small ponds remain contained at floor level; tools and stock stay on
  // supported clear floor, rather than becoming facade/roof decorations.
  const court=d.footprint.length>=3&&["court","paired-court","work-court"].includes(d.massing);
  if(court&&lot.districtId==="scholar") {
    const start=Math.min(w-7,door+4),clear=Array.from({length:4},(_,i)=>start+i).every(x=>Array.from({length:5},(_,i)=>8+i).every(z=>!body(x,z,base+1)));
    if(clear){fill(start,base,8,start+3,base,12,B.Water);put(start+1,base+1,10,B.Lotus);}
  }
  if(court&&lot.districtId==="artisan") {
    for(const [x,z,id] of[[w-7,8,B.Furnace],[w-7,11,B.Anvil],[w-4,depth-6,B.Crate]])if(!body(x,z,base+1))put(x,base+1,z,id);
    if(!body(w-5,depth-5,base+1))fill(w-5,base+1,depth-6,w-4,base+11,depth-5,B.Brick);
  }
  if((d.frontage==="shop-canopy"||d.frontage==="double-shop")&&w>=10&&body(2,0,base+3)) {
    fill(1,base+1,0,Math.max(1,door-3),base+2,0,B.Air);fill(1,base+1,1,Math.max(1,door-3),base+1,1,B.Planks);
    put(1,base+2,1,lot.districtId==="artisan"?B.Pottery:lot.districtId==="harbor"?B.Crate:B.Porcelain);
  }
  // The released home/entry aisle is always usable, including court gates.
  fill(door-1,base+1,0,door+1,base+3,depth-2,B.Air);
  if(volumes.some(b=>b.u===0&&b.v===0&&b.w>=8&&b.d>=9&&b.floors>1)) {
    const stories=volumes.find(b=>b.u===0&&b.v===0&&b.w>=8&&b.d>=9&&b.floors>1)!.floors;
    for(let f=0;f<stories-1;f++) {
      const y=base+f*story;fill(1,y+5,3,4,y+5,7,B.Air);
      for(let n=1;n<=10;n++){const u=n<=5?1:3,v=n<=5?n+2:13-n,h=Math.ceil(n/2);fill(u,y+1,v,u+1,y+h-1,v,B.Planks);fill(u,y+h,v,u+1,y+h,v,n%2?B.Slab:B.Planks);fill(u,y+h+1,v,u+1,y+h+2,v,B.Air);}
    }
  }
  put(w-3,base+1,depth-3,lot.districtId==="harbor"?B.Crate:lot.districtId==="artisan"?B.Workbench:B.Bed);
  put(w-3,base+1,depth-5,B.Chest);
}
