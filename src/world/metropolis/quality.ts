import { B } from "../blocks";
import { VoxelWriter } from "../city/writer";
import { districtSpec } from "./districts";
import type { UrbanLot } from "./plan";
import { buildingVolumes, type BuildingDesign, type RoofProfile, type Volume } from "./variety";

export type RoofPiece = { u: number; v: number; w: number; d: number; level: number; support: number; profile: RoofProfile };
export type BuildingAssembly = { volumes: readonly Volume[]; roofs: readonly RoofPiece[]; width: number; depth: number; story: number };

/** V9 owns its roof grammar. Released v8 designs and occupied footprints are
 * retained; raised roof sections acquire real clerestories and shared seams
 * are resolved against the union of building bodies, rather than draw order. */
export function planBuilding(lot: UrbanLot, design: BuildingDesign): BuildingAssembly {
  const width=lot.facing%2?lot.z2-lot.z1+1:lot.x2-lot.x1+1, depth=lot.facing%2?lot.x2-lot.x1+1:lot.z2-lot.z1+1;
  const volumes=buildingVolumes(lot,design),story=lot.districtId==="harbor"&&design.family==="cargo-warehouse"?7:5,roofs:RoofPiece[]=[];
  for(const a of volumes) {
    if(![a.u,a.v,a.w,a.d,a.floors].every(Number.isInteger)||a.w<3||a.d<2||a.u<0||a.v<0||a.u+a.w>width||a.v+a.d>depth||a.floors<1)throw Error(`Invalid building body: ${lot.id}`);
    const level=lot.baseY+a.floors*story;
    const add=(u:number,v:number,w:number,d:number,y:number,profile:RoofProfile)=>roofs.push({u,v,w,d,level:y,support:level,profile});
    if(design.roof==="split"&&a.w>=13){const left=Math.floor(a.w*.47);add(a.u,a.v,left,a.d,level,"gable");add(a.u+left,a.v,a.w-left,a.d,level+1,"half-hip");}
    else if(design.roof==="stepped"&&a.d>=10){const front=Math.floor(a.d/2);add(a.u,a.v,a.w,front,level,"gable");add(a.u,a.v+front,a.w,a.d-front,level+2,"hip");}
    else add(a.u,a.v,a.w,a.d,level,design.roof);
  }
  return {volumes,roofs,width,depth,story};
}

export function drawQualityLot(writer:VoxelWriter,lot:UrbanLot,design:BuildingDesign,assembly:BuildingAssembly) {
  const {fill,put}=writer.local(lot),{width:w,depth:d,story,volumes}=assembly,base=lot.baseY,spec=districtSpec(lot.districtId),door=Math.floor((w-1)/2);
  const court=["court","paired-court","work-court"].includes(design.massing)&&w>=22&&d>=20,timber=spec.timber;
  const covers=(a:Volume,u:number,v:number,y:number)=>{
    const inset=design.massing==="stepped"&&y>base+story?1:0;
    return u>=a.u+inset&&u<a.u+a.w-inset&&v>=a.v&&v<a.v+a.d&&y<=base+a.floors*story;
  };
  const body=(u:number,v:number,y:number)=>volumes.some(a=>covers(a,u,v,y));
  const closed=(u:number,v:number,y:number)=>volumes.some(a=>!a.open&&covers(a,u,v,y));
  const inChunk=(u:number,v:number)=>{const [x,z]=lot.facing===0?[lot.x1+u,lot.z1+v]:lot.facing===1?[lot.x2-v,lot.z1+u]:lot.facing===2?[lot.x2-u,lot.z2-v]:[lot.x1+v,lot.z2-u];return x>=writer.ox&&x<writer.ox+16&&z>=writer.oz&&z<writer.oz+16;};
  const writeRoof=(u:number,y:number,v:number,id:number)=>{
    if(!inChunk(u,v))return;
    // A shorter wing may meet a taller wing, but its tiles cannot slice into
    // the taller facade or appear as duplicate horizontal fragments inside it.
    if(!volumes.some(a=>covers(a,u,v,y)&&base+a.floors*story>y))put(u,y,v,id);
  };
  fill(0,base,0,w-1,base,d-1,lot.districtId==="harbor"?B.Planks:spec.pavement);
  for(const a of volumes)for(let f=0;f<a.floors;f++) {
    const y=base+f*story,inset=f>0&&design.massing==="stepped"?1:0,left=a.u+inset,right=a.u+a.w-1-inset,front=a.v,back=a.v+a.d-1;
    if(f)fill(left,y,front,right,y,back,B.Planks);
    for(let z=front;z<=back;z++)for(let x=left;x<=right;x++) {
      if(!inChunk(x,z)||x!==left&&x!==right&&z!==front&&z!==back)continue;
      for(let dy=1;dy<story;dy++) {
        const level=y+dy;
        if(closed(x-1,z,level)&&closed(x+1,z,level)&&closed(x,z-1,level)&&closed(x,z+1,level))continue;
        const corner=(x===left||x===right)&&(z===front||z===back),post=corner||((z===front||z===back)&&(x-left)%design.bay===0);
        if(a.open&&!post&&dy<story-1)continue;
        let id=post||dy===story-1?timber:design.wall;
        const window=!post&&(dy===2||dy===3)&&((z===front||z===back)?x>left&&x<right&&(x-left)%design.bay<=2:z>front+1&&z<back-1&&(z-front)%(design.bay+1)<2);
        if(window&&!a.open)id=design.seed%3===0?B.Paper:B.Glass;
        put(x,level,z,id);
      }
    }
    if(f===0) {
      const entrance=Math.max(left+1,Math.min(right-1,door)),half=right-left>=4?1:0;
      fill(entrance-half,y+1,front,entrance+half,y+3,front,B.Air);
      if(court||a.v>0)fill(entrance-half,y+1,back,entrance+half,y+3,back,B.Air);
      if(design.family==="cargo-warehouse")fill(Math.max(left+1,door-2),y+1,front,Math.min(right-1,door+2),y+5,front,B.Air);
      if(design.family.includes("arcade")&&front===0){fill(left+1,y+1,0,right-1,y+3,1,B.Air);for(let x=left;x<=right;x+=design.bay)fill(x,y+1,0,x,y+4,0,timber);fill(left,y+4,0,right,y+4,1,timber);}
      if(!court&&front===0&&lot.districtId!=="hutong"&&door-left>=5){fill(left+1,y+1,front,door-3,y+2,front,B.Air);fill(left+1,y+1,front+1,door-3,y+1,front+1,B.Planks);put(left+1,y+2,front+1,lot.districtId==="artisan"?B.Pottery:lot.districtId==="harbor"?B.Crate:B.Porcelain);}
    }
    if(f>0&&design.balcony&&front===0){
      fill(left,y,-1,right,y,-1,B.Planks);fill(left,y+1,-1,right,y+1,-1,B.Fence);
      // Small timber corbels tie the balcony to its floor beam.
      for(const x of[left,right]){put(x,y-1,-1,timber);put(x,y-1,0,timber);}
      fill(Math.max(left+1,door-1),y+1,0,Math.min(right-1,door+1),y+3,0,B.Air);
    }
  }
  function roof(a:RoofPiece) {
    const {u,v,w:width,d:depth,level:y,profile}=a;
    // Raised split/stepped sections have a supported deck and continuous
    // clerestory, including the seam between the two unequal roof sections.
    if(y>a.support)for(let z=v;z<v+depth;z++)for(let x=u;x<u+width;x++)for(let h=a.support;h<y;h++)
      if(inChunk(x,z)&&!volumes.some(b=>covers(b,x,z,h)&&base+b.floors*story>h))put(x,h,z,h===a.support?B.Planks:x===u||x===u+width-1||z===v||z===v+depth-1?design.wall:B.Air);
    if(profile==="terrace") {for(let z=v;z<v+depth;z++)for(let x=u;x<u+width;x++){writeRoof(x,y,z,B.Paving);if(x===u||x===u+width-1||z===v||z===v+depth-1)writeRoof(x,y+1,z,B.Fence);}return;}
    if(profile==="double"&&width>=9&&depth>=9){
      for(let z=v-1;z<=v+depth;z++)for(let x=u-1;x<=u+width;x++)writeRoof(x,y,z,design.tile);
      for(let z=v+1;z<v+depth-1;z++)for(let x=u+1;x<u+width-1;x++)for(let h=1;h<=2;h++)writeRoof(x,y+h,z,design.wall);
      roof({u:u+1,v:v+1,w:width-2,d:depth-2,level:y+3,support:y+3,profile:"hip"});return;
    }
    const rise=Math.max(1,Math.min(5,Math.floor(depth/2))),hip=profile==="hip"||profile==="half-hip";
    for(let k=0;k<rise;k++) {
      const dv=Math.min(Math.max(0,Math.floor(depth/2)-1),k),du=hip?Math.min(Math.floor(width/2)-1,profile==="half-hip"?Math.max(0,k-1):k):0;
      for(let z=v-1+dv;z<=v+depth-dv;z++)for(let x=u-1+du;x<=u+width-du;x++)writeRoof(x,y+k,z,design.tile);
    }
    const ridge=profile==="hip"?Math.min(rise-1,Math.floor(width/2)-1):0;
    for(let x=u+ridge;x<u+width-ridge;x++)writeRoof(x,y+rise,v+Math.floor(depth/2),timber);
    if(design.seed%2===0)for(const x of[u-1,u+width])for(const z of[v-1,v+depth])writeRoof(x,y+1,z,design.tile);
  }
  for(const a of assembly.roofs)roof(a);
  if(court){
    fill(door-2,base+1,0,door+2,base+3,6,B.Air);
    for(const x of[door-3,door+3])fill(x,base+1,0,x,base+4,0,timber);
    fill(door-3,base+4,0,door+3,base+4,1,design.tile);
    fill(door-1,base,0,door+1,base,d-2,B.Paving);
    if(lot.districtId==="scholar"){const u=Math.min(w-7,door+4);fill(u,base,8,u+3,base,12,B.Water);put(u+1,base+1,10,B.Lotus);}
    if(lot.districtId==="artisan"){put(w-7,base+1,8,B.Furnace);put(w-7,base+1,11,B.Anvil);fill(w-5,base+1,d-6,w-4,base+11,d-5,B.Brick);}
  }
  fill(door-1,base+1,0,door+1,base+3,d-2,B.Air);
  if(!court&&w>=9&&d>=9&&design.floors>1)for(let f=0;f<design.floors-1;f++){
    const y=base+f*5;fill(1,y+5,3,4,y+5,7,B.Air);
    for(let n=1;n<=10;n++){const u=n<=5?1:3,v=n<=5?n+2:13-n,h=Math.ceil(n/2);fill(u,y+1,v,u+1,y+h-1,v,B.Planks);fill(u,y+h,v,u+1,y+h,v,n%2?B.Slab:B.Planks);fill(u,y+h+1,v,u+1,y+h+2,v,B.Air);}
  }
  if(spec.signs)put(design.seed%2?1:w-2,base+3,-1,[B.MarketSign,B.TeaSign,B.NoodleSign,B.Banner][design.sign]);
  for(const u of design.seed%2?[1]:[1,w-2])put(u,base+4,-1,B.Lantern);
  if(!court&&design.seed%3===0){fill(0,base+4,-1,Math.max(1,door-2),base+4,-1,design.tile);for(const u of[0,Math.max(1,door-2)])put(u,base+3,-1,timber);}
  put(w-3,base+1,d-3,lot.districtId==="harbor"?B.Crate:lot.districtId==="artisan"?B.Workbench:B.Bed);put(w-3,base+1,d-5,B.Chest);
}
