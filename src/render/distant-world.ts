import * as THREE from "three";
import type { World } from "../world/world";
import { SEA, MIN_SECTION, MAX_SECTION, type Vec3 } from "../core/coords";
import { sampleTerrain } from "../world/geography/terrain";
import { planRichBuilding, type RichDesign } from "../world/metropolis/richness";
import { footprintBounds, footprintDistance } from "../world/geography/geometry";
import { block, B } from "../world/blocks";
import type { Palette, RoofKind } from "../world/landmarks/types";
import type { Rect } from "../world/city/plan";
import type { Atmosphere } from "./atmosphere";
import { GRAPHICS_PROFILES, graphicsQualityLevel, type GraphicsProfile } from "./graphics";
import { DISTANT_VERTEX_SHADER, distantFragmentShader } from "./shader-quality";
import { distantWaterMaterial } from "./material";
import { classifyDistantWaterCell } from "./distant-water";
import { MeshCoverageIndex, type MeshCoverageChange } from "./mesh-coverage";
import type { RenderWorkloadAudit } from "./render-audit";

const SIZE=128,LAYERS=MAX_SECTION-MIN_SECTION+1,STEP=16;
// Skyline content is invariant across graphics presets; only its terrain/shader representation may vary.
const CROWN_BUILDINGS_PER_DISTRICT=4;
export const DISTANT_RADIUS=720;
export type ProxyBox={id:string;x:number;y:number;z:number;w:number;h:number;d:number;color:string;yaw:number};
export type DistantPlan={originX:number;originZ:number;width:number;depth:number;step:number;boxes:ProxyBox[]};
/** Coarse surface samples share landmark pad ownership with the terrain mesh. */
export function distantSurface(world:World,x:number,z:number,elevation?:number):number {
  const macro=world.macroPlan;if(!macro)return SEA+1;
  const ground=elevation??sampleTerrain(macro,x,z).elevation,pad=world.landmarkPlan?.byChunk.get(`${Math.floor(x/16)},${Math.floor(z/16)}`)?.find(c=>c.kind==="plinth"&&c.clear>0&&footprintDistance(c.footprint,x,z)<=0);
  return Math.max(SEA+1,pad&&pad.kind==="plinth"?pad.level+1:ground+1)-.12;
}
/** Read-only plan projection. No generator/World/chunk writes, voxel bake or actor state. */
export function distantPlan(world:World,profile:GraphicsProfile=GRAPHICS_PROFILES.high):DistantPlan|undefined {
  const macro=world.macroPlan;if(!macro)return;
  const bounds=footprintBounds(macro.envelope),originX=Math.floor((bounds.x1-128)/STEP)*STEP,originZ=Math.floor((bounds.z1-128)/STEP)*STEP;
  const step=profile.distantTerrainStep,width=Math.min(Math.ceil(SIZE*STEP/step),Math.ceil((bounds.x2+128-originX)/step)),depth=Math.min(Math.ceil(SIZE*STEP/step),Math.ceil((bounds.z2+128-originZ)/step)),boxes:ProxyBox[]=[];
  const box=(id:string,x:number,y:number,z:number,w:number,h:number,d:number,color:number,yaw=0)=>{if(w>0&&h>0&&d>0)boxes.push({id,x,y,z,w,h,d,color:block(color).color,yaw});};
  const rectBox=(id:string,r:Rect,low:number,high:number,color:number)=>box(id,(r.x1+r.x2+1)/2,(low+high)/2,(r.z1+r.z2+1)/2,r.x2-r.x1+1,high-low,r.z2-r.z1+1,color);
  const roof=(id:string,r:Rect,y:number,p:Palette,kind:RoofKind)=>{
    if(kind==="double") {rectBox(id+":eave",{x1:r.x1-1,x2:r.x2+1,z1:r.z1-1,z2:r.z2+1},y,y+1,p.roof);rectBox(id+":clerestory",{x1:r.x1+1,x2:r.x2-1,z1:r.z1+1,z2:r.z2-1},y+1,y+3,p.wall);roof(id+":upper",{x1:r.x1+1,x2:r.x2-1,z1:r.z1+1,z2:r.z2-1},y+3,p,"hip");return;}
    const levels=Math.max(2,Math.min(6,Math.ceil((r.z2-r.z1+1)/2)));
    for(let k=0;k<levels;k++){const dz=Math.floor(k*(r.z2-r.z1+3)/(2*levels)),dx=kind==="hip"?Math.min(k,Math.floor((r.x2-r.x1)/2)):0;rectBox(`${id}:${k}`,{x1:r.x1-1+dx,x2:r.x2+1-dx,z1:r.z1-1+dz,z2:r.z2+1-dz},y+k,y+k+1,p.roof);}
  };
  // A linear terrain triangle never falls below its lowest grid vertex.
  // Foundations reach that minimum, including graded pads and water decks.
  const footing=(r:Rect)=>{
    let y=Infinity;for(let z=originZ+Math.floor((r.z1-originZ)/step)*step;z<=originZ+Math.ceil((r.z2+1-originZ)/step)*step;z+=step)for(let x=originX+Math.floor((r.x1-originX)/step)*step;x<=originX+Math.ceil((r.x2+1-originX)/step)*step;x+=step)y=Math.min(y,distantSurface(world,x,z));return y-1;
  };
  const foundation=(id:string,r:Rect,level:number)=>rectBox(id+":foundation",r,Math.min(footing(r),level-1),level+1,B.SculptureStone);
  // Major existing anchors only; ordinary houses remain full-detail geometry.
  for(const c of world.landmarkPlan?.components??[]) {
    if(c.kind==="plinth") {
      const r=c.bounds,low=Math.min(...[[r.x1,r.z1],[r.x1,r.z2],[r.x2,r.z1],[r.x2,r.z2]].map(([x,z])=>sampleTerrain(macro,x,z).height))-2;
      if(c.footprint.kind==="area"){
        rectBox(c.id+":foundation",r,Math.min(low,footing(r),c.level-1),c.level,B.SculptureStone);
        rectBox(c.id+":surface",r,c.level,c.level+1,c.surface);
      }
    } else if(c.kind==="hall") {
      foundation(c.id,c.rect,c.level);
      if(c.open)for(const x of[c.rect.x1,c.rect.x2])for(const z of[c.rect.z1,c.rect.z2])box(c.id+`:post:${x}:${z}`,x+.5,c.level+c.height/2,z+.5,1,c.height,1,c.palette.timber);
      else rectBox(c.id,c.rect,c.level+1,c.level+c.height,c.palette.wall);
      roof(c.id+":roof",c.rect,c.level+c.height,c.palette,c.roof);
    } else if(c.kind==="tower") {
      const y=Math.ceil(c.level),r=Math.floor(c.width/2);
      foundation(c.id,{x1:c.center.x-r,x2:c.center.x+r,z1:c.center.z-r,z2:c.center.z+r},y);
      for(let level=0;level<(c.stairs?c.levels:1);level++){
        const rr=r-(c.taper?level:0),floor=y+level*c.story,top=c.stairs?floor+c.story:y+6;
        const rect={x1:c.center.x-rr,x2:c.center.x+rr,z1:c.center.z-rr,z2:c.center.z+rr};rectBox(c.id+`:body:${level}`,rect,floor+1,top,c.palette.wall);
        if(c.stairs&&level<c.levels-1)rectBox(c.id+`:eave:${level}`,{x1:rect.x1-1,x2:rect.x2+1,z1:rect.z1-1,z2:rect.z2+1},top-1,top,c.palette.roof);
        else roof(c.id+`:roof:${level}`,rect,top,c.palette,c.stairs?"hip":"double");
      }
    } else if(c.kind==="gate") {
      for(const x of[c.rect.x1,c.rect.x2])box(c.id+`:post:${x}`,x+.5,c.level+c.height/2,(c.rect.z1+c.rect.z2+1)/2,2,c.height,c.rect.z2-c.rect.z1+1,c.palette.wall);
      roof(c.id+":roof",c.rect,c.level+c.height,c.palette,"double");
    }
  }
  const wall=world.landmarkPlan?.wallWalk??[];
  for(let i=0;i<wall.length-1;i+=8){const a=wall[i],b=wall[Math.min(i+8,wall.length-1)],dx=b.x-a.x,dz=b.z-a.z,n=Math.hypot(dx,dz);if(!n)continue;const base=Math.min(sampleTerrain(macro,a.x,a.z).height,sampleTerrain(macro,b.x,b.z).height)-2,top=Math.max(a.y,b.y)+2;box(`ridge:${i}`,(a.x+b.x+1)/2,(base+top)/2,(a.z+b.z+1)/2,9,top-base,n+1,B.SculptureStone,Math.atan2(dx,dz));}
  // Four existing crown buildings per district preserve a readable urban
  // skyline when the camera looks beyond its full-detail radius. This is a
  // selected silhouette set, never a second rendering of every city house.
  const density=world.densityPlan,urban=world.metropolisPlan;
  const designs=density&&"designs" in density&&density.designs instanceof Map?density.designs as ReadonlyMap<string,RichDesign>:undefined;
  if(designs&&urban)for(const district of urban.districts){
    const lots=urban.lots.filter(l=>l.districtId===district.id),cx=(district.bounds.x1+district.bounds.x2)/2,cz=(district.bounds.z1+district.bounds.z2)/2;
    for(let choice=0;choice<CROWN_BUILDINGS_PER_DISTRICT;choice++){
      const quadrant=Math.round(choice*3/(CROWN_BUILDINGS_PER_DISTRICT-1));
      const lot=lots.filter(l=>quadrant<0||Number((l.x1+l.x2)/2>=cx)+2*Number((l.z1+l.z2)/2>=cz)===quadrant).sort((a,b)=>{const da=designs.get(a.id)!,db=designs.get(b.id)!;return db.floors-da.floors||(b.x2-b.x1)*(b.z2-b.z1)-(a.x2-a.x1)*(a.z2-a.z1)||a.id.localeCompare(b.id);})[0];if(!lot)continue;
      const design=designs.get(lot.id)! as RichDesign,assembly=planRichBuilding(lot,design);
      foundation(`crown:${lot.id}`,lot,lot.baseY);
      const point=(u:number,v:number)=>lot.facing===0?[lot.x1+u,lot.z1+v]:lot.facing===1?[lot.x2-v,lot.z1+u]:lot.facing===2?[lot.x2-u,lot.z2-v]:[lot.x1+v,lot.z2-u];
      const local=(id:string,u:number,v:number,w:number,d:number,low:number,high:number,color:number)=>{const a=point(u,v),b=point(u+w-1,v+d-1);rectBox(id,{x1:Math.min(a[0],b[0]),x2:Math.max(a[0],b[0]),z1:Math.min(a[1],b[1]),z2:Math.max(a[1],b[1])},low,high,color);};
      for(const [i,v]of assembly.volumes.entries())local(`crown:${lot.id}:body:${i}`,v.u,v.v,v.w,v.d,lot.baseY+1,lot.baseY+v.floors*assembly.story,design.wall);
      for(const[i,r]of assembly.roofs.entries())for(let k=0;k<3;k++){const taper=k/3*.45,du=r.axis===0?0:Math.floor(r.w*taper),dv=r.axis===0?Math.floor(r.d*taper):0;local(`crown:${lot.id}:roof:${i}:${k}`,r.u+du,r.v+dv,r.w-du*2,r.d-dv*2,r.level+k*design.rise/3,r.level+(k+1)*design.rise/3,design.tile);}
    }
  }
  if(boxes.length>1500)throw Error("Distant anchor budget exceeded");
  return{originX,originZ,width,depth,step,boxes};
}

/** Typed output is written in bounded batches. Normals use the same flat
 * triangle cross-product as computeVertexNormals on non-indexed geometry. */
class DistantBuffer {
  readonly position:Float32Array;readonly color:Float32Array;readonly normal:Float32Array;readonly kind:Float32Array;
  private low=[Infinity,Infinity,Infinity];private high=[-Infinity,-Infinity,-Infinity];
  constructor(readonly count:number){this.position=new Float32Array(count*3);this.color=new Float32Array(count*3);this.normal=new Float32Array(count*3);this.kind=new Float32Array(count);}
  vertex(i:number,x:number,y:number,z:number,color:THREE.Color,kind:number){
    const n=i*3,p=this.position;p[n]=x;p[n+1]=y;p[n+2]=z;this.color[n]=color.r;this.color[n+1]=color.g;this.color[n+2]=color.b;this.kind[i]=kind;
    for(let a=0;a<3;a++){this.low[a]=Math.min(this.low[a],p[n+a]);this.high[a]=Math.max(this.high[a],p[n+a]);}
  }
  triangle(first:number){const p=this.position,n=first*3,ax=p[n]-p[n+3],ay=p[n+1]-p[n+4],az=p[n+2]-p[n+5],cx=p[n+6]-p[n+3],cy=p[n+7]-p[n+4],cz=p[n+8]-p[n+5];
    let x=cy*az-cz*ay,y=cz*ax-cx*az,z=cx*ay-cy*ax;const length=Math.sqrt(x*x+y*y+z*z)||1;x/=length;y/=length;z/=length;
    for(let v=0;v<3;v++){this.normal[n+v*3]=x;this.normal[n+v*3+1]=y;this.normal[n+v*3+2]=z;}
  }
  geometry(){const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(this.position,3));g.setAttribute("color",new THREE.BufferAttribute(this.color,3));g.setAttribute("normal",new THREE.BufferAttribute(this.normal,3));g.setAttribute("kind",new THREE.BufferAttribute(this.kind,1));
    const min=this.count?new THREE.Vector3(...this.low as [number,number,number]):new THREE.Vector3(),max=this.count?new THREE.Vector3(...this.high as [number,number,number]):new THREE.Vector3();
    g.boundingBox=new THREE.Box3(min,max);const center=min.clone().add(max).multiplyScalar(.5);g.boundingSphere=new THREE.Sphere(center,min.distanceTo(max)*.5);return g;
  }
}
const cube=(()=>{const indexed=new THREE.BoxGeometry(1,1,1),g=indexed.toNonIndexed(),p=(g.getAttribute("position").array as Float32Array).slice();indexed.dispose();g.dispose();return p;})();
/** One bounded terrain mesh + one merged anchor mesh and a section coverage texture.
 * Real rendered sections always win. Context restore can recreate all resources
 * from CPU plans; dispose drops both the graph and every owned GPU allocation. */
export class DistantWorld {
  readonly group=new THREE.Group(); plan:DistantPlan|undefined;
  readonly coverage=new Uint8Array(SIZE*SIZE*LAYERS);
  readonly texture=new THREE.DataTexture(this.coverage,SIZE,SIZE*LAYERS,THREE.RedFormat);
  readonly material:THREE.ShaderMaterial;
  readonly stats={terrainTriangles:0,waterTriangles:0,anchorTriangles:0,anchorBoxes:0,buildMs:0,updates:0,maxBuildSliceMs:0,terrainReady:false,anchorsReady:false,ready:false,quality:"high",pendingQuality:"",planMs:0};
  private terrain?:THREE.Mesh; private distantWater?:THREE.Mesh; private anchors?:THREE.Mesh; private work?:Generator<void,void,unknown>;
  readonly waterMaterial:THREE.ShaderMaterial;
  private pending:THREE.BufferGeometry[]=[];private profile:GraphicsProfile;
  private coverageIndex?:MeshCoverageIndex;private disposed=false;
  constructor(private world:World,atmosphere:Atmosphere,profile:GraphicsProfile=GRAPHICS_PROFILES.high,private readonly renderAudit?:RenderWorkloadAudit) {
    this.profile=profile;const began=performance.now();this.plan=distantPlan(world,profile);if(this.plan)this.coverageIndex=new MeshCoverageIndex(world,this.coverage,this.plan.originX,this.plan.originZ);this.stats.planMs=performance.now()-began;this.stats.quality=profile.quality;this.texture.minFilter=this.texture.magFilter=THREE.NearestFilter;this.texture.generateMipmaps=false;this.texture.needsUpdate=true;
    this.material=new THREE.ShaderMaterial({vertexColors:true,side:THREE.DoubleSide,
      uniforms:{coverage:{value:this.texture},origin:{value:new THREE.Vector2(this.plan?.originX??0,this.plan?.originZ??0)},fogColor:{value:atmosphere.fog},lightTint:{value:atmosphere.light},daylight:{value:1},fogNear:{value:50},fogFar:{value:400},fogDetail:{value:100},cameraXZ:{value:new THREE.Vector2()},sunDirection:{value:atmosphere.sunDirection},qualityLevel:{value:graphicsQualityLevel(profile)}},
      vertexShader:DISTANT_VERTEX_SHADER,
      fragmentShader:distantFragmentShader(DISTANT_RADIUS)});
    this.waterMaterial=distantWaterMaterial(this.texture,profile.quality);
    this.waterMaterial.uniforms.origin.value.set(this.plan?.originX??0,this.plan?.originZ??0);
    this.group.name="render-only-distant-world";
    if(this.plan){this.work=this.build(this.plan);this.stats.anchorBoxes=this.plan.boxes.length;}
  }
  setProfile(profile:GraphicsProfile){
    if(this.disposed||profile===this.profile)return;
    this.work?.return(undefined);this.work=undefined;for(const g of this.pending)g.dispose();this.pending.length=0;
    this.profile=profile;this.material.uniforms.qualityLevel.value=graphicsQualityLevel(profile);this.waterMaterial.uniforms.qualityLevel.value=graphicsQualityLevel(profile);const began=performance.now();const old=this.plan;this.plan=distantPlan(this.world,profile);if(old)old.boxes.length=0;
    this.stats.planMs=performance.now()-began;this.stats.buildMs=0;this.stats.maxBuildSliceMs=0;this.stats.ready=false;this.stats.terrainReady=!!this.terrain;this.stats.anchorsReady=!!this.anchors;this.stats.pendingQuality=profile.quality;
    if(this.plan){this.material.uniforms.origin.value.set(this.plan.originX,this.plan.originZ);this.waterMaterial.uniforms.origin.value.set(this.plan.originX,this.plan.originZ);if(this.coverageIndex){if(this.coverageIndex.setOrigin(this.plan.originX,this.plan.originZ))this.texture.needsUpdate=true;}else this.coverageIndex=new MeshCoverageIndex(this.world,this.coverage,this.plan.originX,this.plan.originZ);this.work=this.build(this.plan);this.stats.anchorBoxes=this.plan.boxes.length;}
    else {this.coverageIndex?.clear();this.coverageIndex=undefined;}
  }
  private *build(plan:DistantPlan):Generator<void,void,unknown> {
    const macro=this.world.macroPlan!,step=plan.step,stride=plan.width+1,heights=new Float64Array(stride*(plan.depth+1)),types=new Uint8Array(heights.length);
    const palette=[new THREE.Color("#7b916c"),new THREE.Color("#858e82"),new THREE.Color("#a0987e"),new THREE.Color("#638c91")];
    for(let z=0;z<=plan.depth;z++){
      for(let x=0;x<=plan.width;x++){const wx=plan.originX+x*step,wz=plan.originZ+z*step,t=sampleTerrain(macro,wx,wz),i=x+z*stride;heights[i]=distantSurface(this.world,wx,wz,t.elevation);types[i]=t.water?3:t.urban?2:t.scenic||t.height>85?1:0;}yield;
    }
    const cellWater=new Uint8Array(plan.width*plan.depth);let waterCellCount=0;
    for(let z=0;z<plan.depth;z++){
      for(let x=0;x<plan.width;x++){
        const a=x+z*stride,b=x+(z+1)*stride,c=x+1+z*stride,d=x+1+(z+1)*stride;
        const wa=types[a]===3,wb=types[b]===3,wc=types[c]===3,wd=types[d]===3;
        const mixed=(wa||wb||wc||wd)&&!(wa&&wb&&wc&&wd);
        // Only shoreline cells need a center probe. Fully dry cells stay dry;
        // this avoids doubling terrain sampling over the large land majority.
        const centerWater=mixed?sampleTerrain(macro,plan.originX+(x+.5)*step,plan.originZ+(z+.5)*step).water:false;
        if(classifyDistantWaterCell(wa,wb,wc,wd,centerWater)){cellWater[x+z*plan.width]=1;waterCellCount++;}
      }
      yield;
    }
    const terrain=new DistantBuffer((plan.width*plan.depth-waterCellCount)*6);
    const water=waterCellCount?new DistantBuffer(waterCellCount*6):undefined;
    let at=0,waterAt=0;
    const waterVertexColor=new THREE.Color("#ffffff");
    const vertex=(target:DistantBuffer,index:number,x:number,z:number,waterFace:boolean)=>{const i=x+z*stride;const color=waterFace?waterVertexColor:palette[types[i]===3?0:types[i]];target.vertex(index,plan.originX+x*step,heights[i],plan.originZ+z*step,color,0);};
    for(let z=0;z<plan.depth;z++){
      for(let x=0;x<plan.width;x++){
        const isWater=cellWater[x+z*plan.width]===1,target=isWater?water!:terrain,start=isWater?waterAt:at;
        vertex(target,start,x,z,isWater);vertex(target,start+1,x,z+1,isWater);vertex(target,start+2,x+1,z,isWater);target.triangle(start);
        vertex(target,start+3,x+1,z,isWater);vertex(target,start+4,x,z+1,isWater);vertex(target,start+5,x+1,z+1,isWater);target.triangle(start+3);
        if(isWater)waterAt+=6;else at+=6;
      }yield;
    }
    // Publish the large terrain/water surface as soon as it is ready. Anchor
    // silhouettes are a separate, lower-priority pass; waiting for every crown
    // box before publishing terrain left the whole distant world blank during
    // initial load and profile changes.
    const ground=terrain.geometry(),waterGeometry=water?.geometry();
    this.publishTerrainWater(ground,waterGeometry,terrain.count/3,water?water.count/3:0);
    yield;
    const anchors=new DistantBuffer(plan.boxes.length*36),colors=new Map<string,THREE.Color>();
    for(let first=0;first<plan.boxes.length;first+=32){
      for(let j=first;j<Math.min(first+32,plan.boxes.length);j++){
        const b=plan.boxes[j],cos=Math.cos(b.yaw),sin=Math.sin(b.yaw);let color=colors.get(b.color);if(!color){color=new THREE.Color(b.color);colors.set(b.color,color);}
        for(let v=0;v<36;v++){const x=Math.fround(cube[v*3]*b.w),y=Math.fround(cube[v*3+1]*b.h),z=Math.fround(cube[v*3+2]*b.d);anchors.vertex(j*36+v,Math.fround(cos*x+sin*z)+b.x,y+b.y,Math.fround(-sin*x+cos*z)+b.z,color,1);}
        for(let v=0;v<36;v+=3)anchors.triangle(j*36+v);
      }yield;
    }
    const crown=anchors.geometry();this.pending.push(crown);yield;
    if(this.anchors){this.renderAudit?.untag(this.anchors);this.group.remove(this.anchors);this.anchors.geometry.dispose();}
    this.anchors=new THREE.Mesh(crown,this.material);this.anchors.name="distant-anchors";this.renderAudit?.tag(this.anchors,"distant-structures");
    this.group.add(this.anchors);this.pending.length=0;
    this.stats.anchorTriangles=anchors.count/3;this.stats.anchorsReady=true;this.stats.quality=this.profile.quality;this.stats.pendingQuality="";this.stats.ready=true;
  }
  /** Publish the terrain/water foundation independently of optional skyline anchors. */
  private publishTerrainWater(ground:THREE.BufferGeometry,waterGeometry:THREE.BufferGeometry|undefined,terrainTriangles:number,waterTriangles:number){
    if(this.terrain){this.renderAudit?.untag(this.terrain);this.group.remove(this.terrain);this.terrain.geometry.dispose();}
    if(this.distantWater){this.renderAudit?.untag(this.distantWater);this.group.remove(this.distantWater);this.distantWater.geometry.dispose();}
    this.terrain=new THREE.Mesh(ground,this.material);this.terrain.name="distant-terrain";this.renderAudit?.tag(this.terrain,"distant-terrain");
    this.distantWater=waterGeometry?new THREE.Mesh(waterGeometry,this.waterMaterial):undefined;
    if(this.distantWater){this.distantWater.name="distant-water";this.distantWater.renderOrder=-1;this.renderAudit?.tag(this.distantWater,"water");}
    this.group.add(this.terrain);if(this.distantWater)this.group.add(this.distantWater);
    this.stats.terrainTriangles=terrainTriangles;this.stats.waterTriangles=waterTriangles;this.stats.terrainReady=true;
  }
  /** Reuses the bitmap and applies only renderer mesh-membership deltas. */
  update(camera:Vec3,meshed:ReadonlySet<string>,atmosphere:Atmosphere,revision:number,
    changes:readonly MeshCoverageChange[]=[],changeBase=0) {
    // Distant geometry and coverage are render-only. Do not spend main-thread
    // time building or reconciling them while the complete group is hidden
    // (for example, when the camera is underground). The bounded generator and
    // revision journal resume safely when the group becomes visible again.
    if(this.disposed||!this.plan||!this.group.visible)return;
    if(this.work){const begin=performance.now();let slices=0;
      while(this.work&&slices++<8&&performance.now()-begin<2){if(this.work.next().done)this.work=undefined;}
      const elapsed=performance.now()-begin;this.stats.buildMs+=elapsed;this.stats.maxBuildSliceMs=Math.max(this.stats.maxBuildSliceMs,elapsed);
    }
    if(this.coverageIndex?.update(meshed,changes,revision,changeBase,this.world.navRevision))this.texture.needsUpdate=true;
    const u=this.material.uniforms;u.cameraXZ.value.set(camera.x,camera.z);u.daylight.value=atmosphere.daylight;u.fogNear.value=atmosphere.fogNear;u.fogFar.value=atmosphere.fogFar;u.fogDetail.value=atmosphere.fogDetail;
    const wu=this.waterMaterial.uniforms;wu.cameraXZ.value.set(camera.x,camera.z);wu.waterTint.value.copy(atmosphere.water);wu.fogColor.value.copy(atmosphere.fog);wu.lightTint.value.copy(atmosphere.light);wu.daylight.value=atmosphere.daylight;wu.fogNear.value=atmosphere.fogNear;wu.fogFar.value=atmosphere.fogFar;wu.fogDetail.value=atmosphere.fogDetail;this.stats.updates++;
  }
  dispose() {if(this.disposed)return;this.disposed=true;this.work?.return(undefined);this.work=undefined;for(const g of this.pending)g.dispose();this.pending.length=0;if(this.terrain)this.renderAudit?.untag(this.terrain);if(this.distantWater)this.renderAudit?.untag(this.distantWater);if(this.anchors)this.renderAudit?.untag(this.anchors);this.terrain?.geometry.dispose();this.distantWater?.geometry.dispose();this.anchors?.geometry.dispose();this.material.dispose();this.waterMaterial.dispose();this.texture.dispose();this.group.clear();this.group.removeFromParent();this.coverageIndex?.clear();this.coverageIndex=undefined;this.coverage.fill(0);this.stats.terrainReady=false;this.stats.anchorsReady=false;this.stats.ready=false;if(this.plan)this.plan.boxes.length=0;}
}
