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

const SIZE=128,LAYERS=MAX_SECTION-MIN_SECTION+1,STEP=16;
export const DISTANT_RADIUS=720;
export type ProxyBox={id:string;x:number;y:number;z:number;w:number;h:number;d:number;color:string;yaw:number};
export type DistantPlan={originX:number;originZ:number;width:number;depth:number;boxes:ProxyBox[]};
/** Coarse surface samples share landmark pad ownership with the terrain mesh. */
export function distantSurface(world:World,x:number,z:number,elevation?:number):number {
  const macro=world.macroPlan;if(!macro)return SEA+1;
  const ground=elevation??sampleTerrain(macro,x,z).elevation,pad=world.landmarkPlan?.byChunk.get(`${Math.floor(x/16)},${Math.floor(z/16)}`)?.find(c=>c.kind==="plinth"&&c.clear>0&&footprintDistance(c.footprint,x,z)<=0);
  return Math.max(SEA+1,pad&&pad.kind==="plinth"?pad.level+1:ground+1)-.12;
}
/** Read-only plan projection. No generator/World/chunk writes, voxel bake or actor state. */
export function distantPlan(world:World):DistantPlan|undefined {
  const macro=world.macroPlan;if(!macro)return;
  const bounds=footprintBounds(macro.envelope),originX=Math.floor((bounds.x1-128)/STEP)*STEP,originZ=Math.floor((bounds.z1-128)/STEP)*STEP;
  const width=Math.min(SIZE,Math.ceil((bounds.x2+128-originX)/STEP)),depth=Math.min(SIZE,Math.ceil((bounds.z2+128-originZ)/STEP)),boxes:ProxyBox[]=[];
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
    let y=Infinity;for(let z=Math.floor(r.z1/STEP)*STEP;z<=Math.ceil((r.z2+1)/STEP)*STEP;z+=STEP)for(let x=Math.floor(r.x1/STEP)*STEP;x<=Math.ceil((r.x2+1)/STEP)*STEP;x+=STEP)y=Math.min(y,distantSurface(world,x,z));return y-1;
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
  if(world.generatorVersion===10&&designs&&urban)for(const district of urban.districts){
    const lots=urban.lots.filter(l=>l.districtId===district.id),cx=(district.bounds.x1+district.bounds.x2)/2,cz=(district.bounds.z1+district.bounds.z2)/2;
    for(let quadrant=0;quadrant<4;quadrant++){
      const lot=lots.filter(l=>Number((l.x1+l.x2)/2>=cx)+2*Number((l.z1+l.z2)/2>=cz)===quadrant).sort((a,b)=>{const da=designs.get(a.id)!,db=designs.get(b.id)!;return db.floors-da.floors||(b.x2-b.x1)*(b.z2-b.z1)-(a.x2-a.x1)*(a.z2-a.z1)||a.id.localeCompare(b.id);})[0];if(!lot)continue;
      const design=designs.get(lot.id)! as RichDesign,assembly=planRichBuilding(lot,design);
      foundation(`crown:${lot.id}`,lot,lot.baseY);
      const point=(u:number,v:number)=>lot.facing===0?[lot.x1+u,lot.z1+v]:lot.facing===1?[lot.x2-v,lot.z1+u]:lot.facing===2?[lot.x2-u,lot.z2-v]:[lot.x1+v,lot.z2-u];
      const local=(id:string,u:number,v:number,w:number,d:number,low:number,high:number,color:number)=>{const a=point(u,v),b=point(u+w-1,v+d-1);rectBox(id,{x1:Math.min(a[0],b[0]),x2:Math.max(a[0],b[0]),z1:Math.min(a[1],b[1]),z2:Math.max(a[1],b[1])},low,high,color);};
      for(const [i,v]of assembly.volumes.entries())local(`crown:${lot.id}:body:${i}`,v.u,v.v,v.w,v.d,lot.baseY+1,lot.baseY+v.floors*assembly.story,design.wall);
      for(const[i,r]of assembly.roofs.entries())for(let k=0;k<3;k++){const taper=k/3*.45,du=r.axis===0?0:Math.floor(r.w*taper),dv=r.axis===0?Math.floor(r.d*taper):0;local(`crown:${lot.id}:roof:${i}:${k}`,r.u+du,r.v+dv,r.w-du*2,r.d-dv*2,r.level+k*design.rise/3,r.level+(k+1)*design.rise/3,design.tile);}
    }
  }
  if(boxes.length>1500)throw Error("Distant anchor budget exceeded");
  return{originX,originZ,width,depth,boxes};
}

function geometry(positions:number[],colors:number[],kinds:number[]) {
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));g.setAttribute("kind",new THREE.Float32BufferAttribute(kinds,1));g.computeVertexNormals();g.computeBoundingSphere();return g;
}
function proxyGeometry(boxes:readonly ProxyBox[]) {
  const positions:number[]=[],colors:number[]=[],kinds:number[]=[];
  for(const b of boxes){const base=new THREE.BoxGeometry(b.w,b.h,b.d),g=base.toNonIndexed();base.dispose();g.rotateY(b.yaw);g.translate(b.x,b.y,b.z);const p=g.getAttribute("position"),c=new THREE.Color(b.color);for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));colors.push(c.r,c.g,c.b);kinds.push(1);}g.dispose();}
  return geometry(positions,colors,kinds);
}
/** One bounded terrain mesh + one merged anchor mesh and a section coverage texture.
 * Real rendered sections always win. Context restore can recreate all resources
 * from CPU plans; dispose drops both the graph and every owned GPU allocation. */
export class DistantWorld {
  readonly group=new THREE.Group(); readonly plan:DistantPlan|undefined;
  readonly coverage=new Uint8Array(SIZE*SIZE*LAYERS);
  readonly texture=new THREE.DataTexture(this.coverage,SIZE,SIZE*LAYERS,THREE.RedFormat);
  readonly material:THREE.ShaderMaterial;
  readonly stats={terrainTriangles:0,anchorTriangles:0,anchorBoxes:0,buildMs:0,updates:0,maxBuildSliceMs:0,ready:false};
  private terrain?:THREE.Mesh; private anchors?:THREE.Mesh; private work?:Generator<void>;
  private marked=new Set<number>(); private disposed=false; private lastRevision=-1;
  constructor(private world:World,atmosphere:Atmosphere) {
    this.plan=distantPlan(world);this.texture.minFilter=this.texture.magFilter=THREE.NearestFilter;this.texture.generateMipmaps=false;this.texture.needsUpdate=true;
    this.material=new THREE.ShaderMaterial({vertexColors:true,side:THREE.DoubleSide,
      uniforms:{coverage:{value:this.texture},origin:{value:new THREE.Vector2(this.plan?.originX??0,this.plan?.originZ??0)},fogColor:{value:atmosphere.fog},lightTint:{value:atmosphere.light},daylight:{value:1},fogNear:{value:50},fogFar:{value:400},fogDetail:{value:100},cameraXZ:{value:new THREE.Vector2()},sunDirection:{value:atmosphere.sunDirection}},
      vertexShader:`attribute float kind;varying vec3 vWorld;varying vec3 vColor;varying vec3 vNormal;varying float vKind;varying float vDepth;
void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;vColor=color;vNormal=normal;vKind=kind;vec4 mv=modelViewMatrix*vec4(position,1.);vDepth=-mv.z;gl_Position=projectionMatrix*mv;}`,
      fragmentShader:`uniform sampler2D coverage;uniform vec2 origin;uniform vec2 cameraXZ;uniform vec3 fogColor;uniform vec3 lightTint;uniform vec3 sunDirection;uniform float daylight;uniform float fogNear;uniform float fogFar;uniform float fogDetail;varying vec3 vWorld;varying vec3 vColor;varying vec3 vNormal;varying float vKind;varying float vDepth;
float covered(float sy,vec2 cell){if(sy<0.||sy>=24.)return 0.;return texture2D(coverage,vec2((cell.x+.5)/128.,(cell.y+sy*128.+.5)/3072.)).r;}
void main(){float distance=length(vWorld.xz-cameraXZ);if(distance<24.||distance>${DISTANT_RADIUS.toFixed(1)})discard;vec2 cell=floor((vWorld.xz-origin)/16.);float sy=floor((vWorld.y-.02)/16.)+4.;float mask=covered(sy,cell);if(vKind<.5)mask=max(mask,max(covered(sy-1.,cell),covered(sy+1.,cell)));if(cell.x>=0.&&cell.y>=0.&&cell.x<128.&&cell.y<128.&&mask>.5)discard;
float shade=.72+.28*max(0.,dot(normalize(vNormal),sunDirection));vec3 c=vColor*lightTint*(.22+.78*daylight)*shade;float depth=max(vDepth,distance*.8);float haze=.7*smoothstep(fogNear,fogDetail,depth)+.3*smoothstep(fogDetail,fogFar,depth);c=mix(c,fogColor,haze);gl_FragColor=vec4(c,1.);
#include <colorspace_fragment>
}`});
    this.group.name="render-only-distant-world";
    if(this.plan){this.work=this.build();this.stats.anchorBoxes=this.plan.boxes.length;}
  }
  private *build():Generator<void> {
    const plan=this.plan!,macro=this.world.macroPlan!,positions:number[]=[],colors:number[]=[],kinds:number[]=[],samples:{y:number;c:THREE.Color}[][]=[];
    const stone=new THREE.Color("#858e82"),grass=new THREE.Color("#7b916c"),city=new THREE.Color("#a0987e"),water=new THREE.Color("#638c91");
    for(let z=0;z<=plan.depth;z++){
      const row:{y:number;c:THREE.Color}[]=[];
      for(let x=0;x<=plan.width;x++){
        const wx=plan.originX+x*STEP,wz=plan.originZ+z*STEP,t=sampleTerrain(macro,wx,wz);
        row.push({y:distantSurface(this.world,wx,wz,t.elevation)+.12,c:t.water?water:t.urban?city:t.scenic||t.height>85?stone:grass});
      }samples.push(row);yield;
    }
    const vertex=(x:number,z:number)=>{const s=samples[z][x];positions.push(plan.originX+x*STEP,s.y-.12,plan.originZ+z*STEP);colors.push(s.c.r,s.c.g,s.c.b);kinds.push(0);};
    for(let z=0;z<plan.depth;z++) {for(let x=0;x<plan.width;x++){vertex(x,z);vertex(x,z+1);vertex(x+1,z);vertex(x+1,z);vertex(x,z+1);vertex(x+1,z+1);}yield;}
    this.terrain=new THREE.Mesh(geometry(positions,colors,kinds),this.material);this.terrain.name="distant-terrain";this.group.add(this.terrain);this.stats.terrainTriangles=positions.length/9;yield;
    this.anchors=new THREE.Mesh(proxyGeometry(plan.boxes),this.material);this.anchors.name="distant-anchors";this.group.add(this.anchors);this.stats.anchorTriangles=this.anchors.geometry.getAttribute("position").count/3;this.stats.ready=true;
  }
  /** Reuses the bitmap, updating only entries changed by actual meshing/eviction. */
  update(camera:Vec3,meshed:ReadonlySet<string>,atmosphere:Atmosphere,revision:number) {
    if(this.disposed||!this.plan)return;
    if(this.work){const begin=performance.now();let slices=0;
      while(this.work&&slices++<8&&performance.now()-begin<2){if(this.work.next().done)this.work=undefined;}
      const elapsed=performance.now()-begin;this.stats.buildMs+=elapsed;this.stats.maxBuildSliceMs=Math.max(this.stats.maxBuildSliceMs,elapsed);
    }
    if(revision!==this.lastRevision){
      this.lastRevision=revision;const marked=new Set<number>(),columns=new Set<string>();let changed=false;
      const mark=(cx:number,sy:number,cz:number)=>{
        const x=cx-this.plan!.originX/STEP,z=cz-this.plan!.originZ/STEP;if(x<0||z<0||x>=SIZE||z>=SIZE||sy<MIN_SECTION||sy>MAX_SECTION)return;
        const i=x+(z+(sy-MIN_SECTION)*SIZE)*SIZE;marked.add(i);if(!this.coverage[i]){this.coverage[i]=255;changed=true;}
      };
      for(const key of meshed){const[cx,sy,cz]=key.split(",").map(Number);mark(cx,sy,cz);columns.add(`${cx},${cz}`);}
      // A fully known empty section needs no mesh. Once a column has rendered
      // detail, suppress proxies in its authoritative air too: coarse slopes
      // must not fill cliff cutouts or cleared space above shorter buildings.
      for(const key of columns){const c=this.world.chunks.get(key);if(c)for(let sy=MIN_SECTION;sy<=MAX_SECTION;sy++)if(!c.blocks.sections.has(sy))mark(c.cx,sy,c.cz);}
      for(const i of this.marked)if(!marked.has(i)){this.coverage[i]=0;changed=true;}
      this.marked=marked;if(changed)this.texture.needsUpdate=true;
    }
    const u=this.material.uniforms;u.cameraXZ.value.set(camera.x,camera.z);u.daylight.value=atmosphere.daylight;u.fogNear.value=atmosphere.fogNear;u.fogFar.value=atmosphere.fogFar;u.fogDetail.value=atmosphere.fogDetail;this.stats.updates++;
  }
  dispose() {if(this.disposed)return;this.disposed=true;this.work=undefined;this.terrain?.geometry.dispose();this.anchors?.geometry.dispose();this.material.dispose();this.texture.dispose();this.group.clear();this.group.removeFromParent();this.marked.clear();this.coverage.fill(0);this.stats.ready=false;if(this.plan)this.plan.boxes.length=0;}
}
