import { B } from "../blocks";
import { VoxelWriter } from "../city/writer";
import { sampleTerrain } from "../geography/terrain";
import { footprintBounds } from "../geography/geometry";
import type { MacroPlan } from "../geography/plan";
import { regionalRouteAt, type RegionalPlan, type RegionalSite } from "./plan";

import {richDesign,planRichBuilding,drawRichLot} from "../metropolis/richness";
import {districtSpec,type DistrictId} from "../metropolis/districts";
import type {UrbanLot} from "../metropolis/plan";
import type {BuildingDesign} from "../metropolis/variety";

const clipped=(w:VoxelWriter,r:{x1:number;x2:number;z1:number;z2:number},fn:(x:number,z:number)=>void)=>{
  for(let z=Math.max(w.oz,Math.ceil(r.z1));z<=Math.min(w.oz+15,Math.floor(r.z2));z++)for(let x=Math.max(w.ox,Math.ceil(r.x1));x<=Math.min(w.ox+15,Math.floor(r.x2));x++)fn(x,z);
};
function foundation(w:VoxelWriter,m:MacroPlan,x:number,z:number,y:number,surface:number,clear=0) {
  const h=sampleTerrain(m,x,z).height;
  w.fill(x,Math.min(h,y)-2,z,x,y,z,B.SculptureStone);w.put(x,y,z,surface);
  if(clear)w.fill(x,y+1,z,x,Math.max(h+5,y+clear),z,B.Air);
}
/** Regional support buildings use the same v10 grammar inside their original
 * pads. Landmark monuments, public ribbons and landscape planting stay v9. */
function buildings(w:VoxelWriter,m:MacroPlan,s:RegionalSite) {
  for(const b of s.buildings) {
    const district:DistrictId=s.id==="amber-village"?"market":s.id==="willow-tulou"?"hutong":s.id==="lotus-causeway"?"scholar":s.id==="li-stone-walk"?"water-town":"highland";
    const r=b.bounds,spec=districtSpec(district),lot:UrbanLot={...r,id:`region10:${s.id}:${r.x1}:${r.z1}`,district:spec.legacy,districtId:district,blockId:s.id,kind:"shophouse",archetype:"shophouse",roofFamily:"hip",facade:"timber",facing:2,floors:b.floors,roof:b.roof,style:0,seed:m.seed,baseY:b.level,entrance:{x:Math.floor((r.x1+r.x2)/2),z:r.z2+1},envelope:{x1:r.x1-1,x2:r.x2+1,z1:r.z1-1,z2:r.z2+1},balcony:false,arcade:false,corner:false,greenery:false};
    const base:BuildingDesign={family:`${district}-village`,massing:"street-bar",roof:"hip",floors:b.floors,upper:Math.max(1,b.floors-1),bay:4,wall:b.wall,tile:b.roof,accent:spec.accent,recess:0,sign:1,balcony:b.floors>1,seed:m.seed};
    const design=richDesign(lot,base,m.seed),assembly=planRichBuilding(lot,design);
    clipped(w,r,(x,z)=>foundation(w,m,x,z,b.level,B.Planks,design.floors*5+12));
    drawRichLot(w,lot,design,assembly);
  }
}
function tulou(w:VoxelWriter,m:MacroPlan,s:RegionalSite) {
  const {x:cx,z:cz}=s.reservation.anchor,y=sampleTerrain(m,cx,cz).height;
  clipped(w,{x1:cx-26,x2:cx+26,z1:cz-26,z2:cz+26},(x,z)=>{
    const dx=x-cx,dz=z-cz,r=Math.hypot(dx,dz);if(r>26)return;
    foundation(w,m,x,z,y,r<15?B.Paving:B.Planks,26);
    if(r>=16&&r<=24){
      for(let h=1;h<=20;h++){
        const edge=r<17||r>23;
        if(h%5===0)w.put(x,y+h,z,B.Planks);
        else if(edge)w.put(x,y+h,z,r>23?B.Terracotta:B.DarkTimber);
        if(edge&&h%5>=2&&h%5<=3&&((Math.abs(dx)%7<2&&Math.abs(dz)>10)||(Math.abs(dz)%7<2&&Math.abs(dx)>10)))w.put(x,y+h,z,B.Paper);
      }
    }
    if(r>=14&&r<=25) {
      const rise=Math.min(3,Math.floor(Math.min(r-14,25-r)));
      w.fill(x,y+21,z,x,y+21+rise,z,B.BrownRoof);
    }
    if(r>14&&r<16)for(const h of[5,10,15]){w.put(x,y+h,z,B.Planks);w.put(x,y+h+1,z,B.Fence);}
    if(Math.abs(dx)<=2&&dz>13)w.fill(x,y+1,z,x,y+6,z,B.Air);
    if(Math.abs(dx)===3&&dz>=22)w.fill(x,y+1,z,x,y+7,z,B.DarkTimber);
  });
  w.fill(cx-3,y+7,cz+23,cx+3,y+7,cz+24,B.DarkTimber);
  w.put(cx-4,y+5,cz+25,B.Lantern);w.put(cx+4,y+5,cz+25,B.Lantern);
}
function landscape(w:VoxelWriter,m:MacroPlan,s:RegionalSite) {
  const b=footprintBounds(s.reservation.footprint),{x:cx,z:cz}=s.reservation.anchor,level=sampleTerrain(m,cx,cz).height;
  if(s.id==="lotus-causeway")clipped(w,{x1:cx-28,x2:cx+28,z1:cz-18,z2:cz+18},(x,z)=>{
    if(((x-cx)/29)**2+((z-cz)/19)**2>1)return;
    foundation(w,m,x,z,level-2,B.Moss,7);w.fill(x,level-1,z,x,level,z,B.Water);
    const causeway=Math.abs(z-(cz+12))<=2||Math.abs(z-(cz-12))<=2||Math.abs(x-(cx+18))<=2;
    if(causeway){w.put(x,level,z,B.Marble);if((x+z)%13===0)w.put(x,level+1,z,B.Lantern);}
    else if((x*3+z)%31===0)w.put(x,level+1,z,B.Lotus);
  });
  if(s.id==="amber-village") {
    const y=level;
    for(const z of[cz-40,cz+38])for(let x=Math.max(w.ox,cx-49);x<=Math.min(w.ox+15,cx+49);x++) {
      if(z===cz+38&&Math.abs(x-cx)<=3)continue;
      foundation(w,m,x,z,y,B.Brick);w.fill(x,y+1,z,x,y+4,z,B.Brick);w.put(x,y+5,z,(x-cx)%3===0?B.SculptureStone:B.Roof);
    }
    for(const x of[cx-49,cx+49])for(let z=Math.max(w.oz,cz-40);z<=Math.min(w.oz+15,cz+38);z++){foundation(w,m,x,z,y,B.Brick);w.fill(x,y+1,z,x,y+4,z,B.Brick);w.put(x,y+5,z,B.Roof);}
    w.fill(cx-5,y+5,cz+37,cx+5,y+6,cz+39,B.DarkTimber);for(const x of[cx-5,cx+5])w.fill(x,y+1,cz+38,x,y+5,cz+38,B.SculptureStone);
  }
  for(const p of s.pillars) {
    const floor=sampleTerrain(m,p.x,p.z).height;
    clipped(w,{x1:p.x-p.radius,x2:p.x+p.radius,z1:p.z-p.radius,z2:p.z+p.radius},(x,z)=>{
      const radius=Math.hypot(x-p.x,z-p.z);if(radius>p.radius)return;
      for(let h=0;h<=p.height;h++){
        const r=p.radius*(.76+.14*Math.cos(h*.3)+.1*Math.cos(h*.9));
        if(radius<=r)w.put(x,floor+h,z,h>p.height-2?B.Moss:h%8<2?B.SculptureStone:B.Stone);
      }
    });
  }
  // Curated planting follows precinct edges. It cannot become broad woodland.
  for(let z=Math.ceil(b.z1/16)*16;z<=b.z2;z+=16)for(let x=Math.ceil(b.x1/16)*16;x<=b.x2;x+=16) {
    if(Math.abs(x-cx)<30&&Math.abs(z-cz)<31||s.buildings.some(a=>x>=a.bounds.x1-4&&x<=a.bounds.x2+4&&z>=a.bounds.z1-4&&z<=a.bounds.z2+4))continue;
    if(s.routes.some(r=>r.some(p=>Math.hypot(p.x-x,p.z-z)<5)))continue;
    const y=sampleTerrain(m,x,z).height;
    w.fill(x,y+1,z,x,y+4,z,B.DarkTimber);
    for(let h=0;h<=2;h++)w.fill(x-2+h%2,y+4+h,z-2+h%2,x+2-h%2,y+4+h,z+2-h%2,s.id==="lotus-causeway"?B.Blossom:B.Leaves);
  }
}
export function drawRegions(w:VoxelWriter,m:MacroPlan,plan:RegionalPlan,cx:number,cz:number) {
  const sites=plan.byChunk.get(`${cx},${cz}`)??[];if(!sites.length)return;
  for(const s of sites){landscape(w,m,s);if(s.id==="willow-tulou")tulou(w,m,s);buildings(w,m,s);}
  // Grade-aware narrow ribbons connect the preplanned approaches and public
  // loops. The same profile supplies both collision and population anchors.
  for(let z=w.oz;z<w.oz+16;z++)for(let x=w.ox;x<w.ox+16;x++){
    const q=regionalRouteAt(plan,x,z);if(!q)continue;
    const h=Math.floor(q.y);foundation(w,m,x,z,h,B.Gravel,5);
    if(q.y%1)w.put(x,h+1,z,B.Slab);
  }
}
