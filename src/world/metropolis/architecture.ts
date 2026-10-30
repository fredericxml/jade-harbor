import { B } from "../blocks";
import { VoxelWriter } from "../city/writer";
import { districtSpec, type RoofFamily } from "./districts";
import type { UrbanLot, UrbanPlan } from "./plan";
import { nearestRoadPoint, roadElevation } from "./plan";
import type { MacroPlan } from "../geography/plan";

/** A finite grammar in lot-local coordinates. Every projection stays inside the
 * two-block envelope used by planning, indexing and overlap validation. */
export function drawUrbanLot(writer: VoxelWriter, lot: UrbanLot) {
  const {w,d,fill,put}=writer.local(lot),spec=districtSpec(lot.districtId),base=lot.baseY,door=Math.floor((w-1)/2);
  const roof=(u:number,v:number,width:number,depth:number,y:number,family:RoofFamily=lot.roofFamily,eave=1)=>{
    if(family==="terrace"){
      fill(u-eave,y,v-eave,u+width-1+eave,y,v+depth-1+eave,B.Paving);
      for(const z of [v-eave,v+depth-1+eave])fill(u,y+1,z,u+width-1,y+1,z,B.Fence);
      for(const x of [u-eave,u+width-1+eave])fill(x,y+1,v,x,y+1,v+depth-1,B.Fence);
      // An open rooftop pergola leaves the stair landing usable.
      if(width>=10&&depth>=10){for(const x of [u+width-5,u+width-2])for(const z of [v+depth-5,v+depth-2])fill(x,y+1,z,x,y+3,z,spec.timber);fill(u+width-6,y+4,v+depth-6,u+width-1,y+4,v+depth-1,spec.tile);}
      return;
    }
    if(family==="double-eave"&&width>=10&&depth>=10){
      fill(u-1,y,v-1,u+width,y,v+depth,spec.tile);
      fill(u+2,y+1,v+2,u+width-3,y+2,v+depth-3,spec.wall);
      roof(u+1,v+1,width-2,depth-2,y+3,"hip",1);return;
    }
    const levels=Math.max(2,Math.min(family==="warehouse"?7:5,Math.ceil(depth/2))),hip=family==="hip";
    for(let k=0;k<levels;k++){
      const dv=Math.floor(k*(depth/2+eave)/levels),du=hip?Math.min(Math.floor(width/2)-1,k):0;
      fill(u-eave+du,y+k,v-eave+dv,u+width-1+eave-du,y+k,v+depth-1+eave-dv,spec.tile);
    }
    fill(u+(hip?levels-1:0),y+levels,v+Math.floor(depth/2),u+width-1-(hip?levels-1:0),y+levels,v+Math.floor(depth/2),spec.timber);
    for(const x of [u-eave,u+width-1+eave])for(const z of [v-eave,v+depth-1+eave])put(x,y+1,z,spec.tile);
  };
  const hall=(u:number,v:number,width:number,depth:number,height=5,open=false)=>{
    fill(u,base,v,u+width-1,base,v+depth-1,B.Planks);
    if(!open){
      for(const z of [v,v+depth-1])fill(u,base+1,z,u+width-1,base+height-1,z,spec.wall);
      for(const x of [u,u+width-1])fill(x,base+1,v,x,base+height-1,v+depth-1,spec.wall);
      const middle=u+Math.floor(width/2);fill(middle-1,base+1,v,middle+1,base+3,v,B.Air);
      for(let x=u+3;x<u+width-2;x+=5)for(const z of [v,v+depth-1])fill(x,base+2,z,x+1,base+3,z,B.Glass);
    }
    for(const x of [u,u+width-1])for(const z of [v,v+depth-1])fill(x,base+1,z,x,base+height-1,z,spec.timber);
    roof(u,v,width,depth,base+height);
  };
  const gardenTree=(u:number,v:number,cherry=false)=>{
    fill(u,base+1,v,u,base+4,v,spec.timber);
    for(let y=0;y<3;y++)for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++)if(dx*dx+dz*dz+y*y<9)put(u+dx,base+4+y,v+dz,cherry?B.Blossom:B.Leaves);
  };
  const enclosure=()=>{
    for(const x of [0,w-1])fill(x,base+1,0,x,base+3,d-1,spec.wall);
    for(const z of [0,d-1]){fill(0,base+1,z,w-1,base+3,z,spec.wall);fill(0,base+4,z,w-1,base+4,z,spec.tile);}
    fill(door-2,base+1,0,door+2,base+3,0,B.Air);
    fill(door-3,base+4,-1,door+3,base+4,1,spec.tile);
  };
  fill(0,base,0,w-1,base,d-1,B.Paving);
  if((["courtyard","compound","garden","workyard"].includes(lot.archetype)||lot.archetype==="civic"&&w>40)&&w>=20&&d>=18){
    enclosure();
    const wing=lot.archetype==="compound"?8:6;
    hall(1,d-10,w-2,9,lot.archetype==="compound"?8:5);
    if(lot.archetype!=="garden"){
      hall(1,3,wing,Math.max(8,d-15),5,lot.archetype==="workyard");
      if(lot.archetype!=="workyard")hall(w-wing-1,3,wing,Math.max(8,d-15),5);
    }
    if(lot.archetype==="compound"){
      fill(door-2,base,1,door+2,base,d-11,B.Marble);
      for(const u of [wing+5,w-wing-6])for(const v of [8,d-15]){put(u,base+1,v,B.Porcelain);put(u,base+2,v,B.Bamboo);}
    }else if(lot.archetype==="garden"){
      // A deliberately asymmetric pond, bridge, rockery and open pavilion.
      const pw=Math.min(16,w-12),pd=Math.min(12,d-14);
      if(w>36&&d>32){
        fill(4,base,23,door-4,base,d-13,B.Grass);
        fill(door+4,base,19,w-5,base,d-13,B.Grass);
        gardenTree(door+7,Math.floor(d/2),true);
        gardenTree(7,Math.floor(d/2));
        put(door+5,base+1,d-17,B.SculptureStone);
      }
      fill(5,base,5,5+pw,base,5+pd,B.Water);
      fill(5,base-1,5,5+pw,base-1,5+pd,B.Moss);
      fill(9,base+1,4,11,base+1,6+pd,B.Planks);
      for(const v of [7,13])put(6,base+1,Math.min(v,5+pd),B.Lotus);
      if(w>36)hall(w-13,5,10,9,5,true);
      gardenTree(w-7,d-14,true);gardenTree(4,d-14);put(4,base+1,3,B.Moss);put(4,base+2,3,B.SculptureStone);
    }else if(lot.archetype==="workyard"){
      for(let i=0;i<spec.props;i++){const u=w-4-(i%2)*3,v=4+Math.floor(i/2)*4;put(u,base+1,v,i%3===0?B.Furnace:i%3===1?B.Workbench:B.Crate);}
      fill(w-4,base+1,d-5,w-3,base+12,d-4,B.Brick);
      fill(w-4,base+13,d-5,w-3,base+13,d-4,B.DarkTimber);
    }else{
      fill(wing+3,base,5,w-wing-4,base,d-13,B.Grass);
      fill(door-1,base,0,door+1,base,d-10,B.Paving);
      if(lot.greenery)gardenTree(wing+5,Math.floor(d/2),lot.style%2===0);
    }
    put(w-4,base+1,d-4,lot.archetype==="workyard"?B.Anvil:B.Bed);
    put(3,base+1,d-4,B.Chest);
    put(door-3,base+3,1,B.Lantern);
    return;
  }
  if(lot.archetype==="pavilion"){
    // Pavilion occupies only part of a garden-scale lot; the remaining court is green.
    fill(0,base,0,w-1,base,d-1,B.Grass);
    const width=Math.min(w,18),depth=Math.min(d,14),u=Math.floor((w-width)/2),v=Math.max(0,d-depth);
    hall(u,v,width,depth,6,true);fill(door-1,base,0,door+1,base,d-1,B.Paving);
    if(w>28){gardenTree(5,6,true);gardenTree(w-6,6);}
    put(u+3,base+1,v+depth-3,B.Porcelain);put(door,base+5,v+2,B.Lantern);return;
  }
  const warehouse=lot.archetype==="warehouse",floors=warehouse?1:lot.floors,story=warehouse?8:5;
  for(let f=0;f<floors;f++){
    const y=base+f*story,setback=lot.archetype==="mixed-use"&&f>=2?Math.min(2,f-1):0;
    const left=setback,right=w-1-setback,front=f===0&&(lot.arcade||lot.facade==="arcade")?2:0,back=d-1-setback;
    if(f)fill(0,y,0,w-1,y,d-1,B.Planks);
    for(const v of [front,back])fill(left,y+1,v,right,y+story-1,v,spec.wall);
    for(const u of [left,right])fill(u,y+1,front,u,y+story-1,back,spec.wall);
    for(let u=left;u<=right;u+=4){fill(u,y+1,front,u,y+story-1,front,spec.timber);fill(u,y+1,back,u,y+story-1,back,spec.timber);}
    for(const v of [front,back])fill(left,y+story-1,v,right,y+story-1,v,spec.timber);
    for(let u=left+1;u<right-1;u+=4)for(const v of [front,back])fill(u,y+2,v,Math.min(u+1,right-1),y+3,v,lot.facade==="lattice"?B.Paper:B.Glass);
    for(let v=3;v<back-1;v+=4)for(const u of [left,right])fill(u,y+2,v,u,y+3,v+1,B.Glass);
    if(f===0){
      const opening=warehouse?3:lot.facade==="loading-bay"?2:1;fill(door-opening,y+1,front,door+opening,y+(warehouse?5:3),front,B.Air);
      if(lot.facade==="formal"){
        for(const u of [0,w-1])fill(u,y+1,front,u,y+story-1,front,spec.accent);
        fill(door-2,y+4,front,door+2,y+4,front,B.GoldTrim);
      }
      if(front===2){for(const u of [0,w-1])fill(u,y+1,0,u,y+4,0,spec.timber);fill(0,y+4,0,w-1,y+4,1,spec.timber);}
      if(lot.corner&&w>11){fill(w-1,y+1,3,w-1,y+3,5,B.Air);fill(w-2,y+4,2,w,y+4,6,spec.tile);}
      // Open shops have counters on the sides, retaining a three-block center aisle.
      if(["shophouse","merchant","mixed-use","water-house"].includes(lot.archetype)){
        fill(1,y+1,front+1,Math.max(1,door-2),y+1,front+1,B.Planks);
        put(1,y+2,front+1,lot.districtId==="water-town"?B.Pottery:B.Porcelain);
      }
    }
    if(f>0&&lot.balcony){
      fill(0,y,-1,w-1,y,-1,B.Planks);
      fill(0,y+1,-2,w-1,y+1,-2,B.Fence);
      for(const u of [0,w-1])put(u,y+1,-1,B.Fence);
      fill(door-1,y+1,front,door+1,y+3,front,B.Air);
    }
  }
  roof(0,0,w,d,base+floors*story,warehouse?"warehouse":lot.roofFamily);
  // Two half-step flights per story. The landing is at v=2 and never covers
  // the doorway/NPC's v=1..2 standing points. Floor openings retain headroom.
  if(w>=9&&d>=9)for(let f=0;f<floors-(lot.roofFamily==="terrace"?0:1);f++){
    const y=base+f*5;
    fill(1,y+5,3,4,y+5,7,B.Air);
    for(let n=1;n<=10;n++){
      const u=n<=5?1:3,v=n<=5?n+2:13-n,h=Math.ceil(n/2);
      if(f===0)fill(u,y+1,v,u+1,y+h-1,v,B.Planks);
      fill(u,y+h,v,u+1,y+h,v,n%2?B.Slab:B.Planks);
      fill(u,y+h+1,v,u+1,y+h+2,v,B.Air);
    }
  }
  for(let i=0;i<spec.signs;i++){
    const u=i%2===0?1:w-2,y=base+3+Math.floor(i/2)*5;
    put(u,y,-1,[B.MarketSign,B.TeaSign,B.NoodleSign,B.Banner][(lot.style+i)%4]);
  }
  for(let i=0;i<spec.lanterns;i++){const u=i%2===0?1:w-2;put(u,base+4+Math.floor(i/2)*5,-1,B.Lantern);}
  put(w-3,base+1,d-3,warehouse?B.Crate:lot.archetype==="hillside"?B.Bed:B.Workbench);
  put(w-3,base+1,d-5,B.Chest);
  if(warehouse)for(let i=0;i<spec.props;i++)put(2+i%3*3,base+1+Math.floor(i/6),d-3-Math.floor(i/3)%2*3,B.Crate);
  if(lot.greenery&&w>=15)put(w-2,base+1,2,B.Pottery);
}

/** Small static street details, indexed by their parent route. No entities or
 * individual lights are added; the ordinary voxel lighting/mesh path owns them. */
export function drawUrbanStreets(w:VoxelWriter,m:MacroPlan,p:UrbanPlan,cx:number,cz:number){
  for(const road of p.roadsByChunk.get(`${cx},${cz}`)??[]){
    if(road.owner||!road.lanternSpacing)continue;
    let traveled=0,next=8;
    for(let i=1;i<road.points.length;i++){
      const a=road.points[i-1],b=road.points[i],length=Math.hypot(b.x-a.x,b.z-a.z),dx=(b.x-a.x)/length,dz=(b.z-a.z)/length;
      for(;next<traveled+length;next+=road.lanternSpacing){
        const run=next-traveled;
        const x=Math.round(a.x+dx*run-dz*(road.half+2)),z=Math.round(a.z+dz*run+dx*(road.half+2));
        if(x<w.ox-1||x>w.ox+16||z<w.oz-1||z>w.oz+16)continue;
        // Keep intersections, lot projections and entrance approaches unobstructed.
        const key=`${Math.floor(x/16)},${Math.floor(z/16)}`;
        if((p.roadsByChunk.get(key)??[]).some(r=>r!==road&&nearestRoadPoint(r,x,z).distance<=r.half+1)||
          (p.lotsByChunk.get(key)??[]).some(l=>x>=l.envelope.x1&&x<=l.envelope.x2&&z>=l.envelope.z1&&z<=l.envelope.z2))continue;
        const y=Math.floor(roadElevation(m,road,x,z));
        w.fill(x,y,z,x,y+3,z,road.kind==="quay"?B.DarkTimber:B.SculptureStone);w.put(x,y+4,z,B.Lantern);
      }
      traveled+=length;
    }
  }
}
