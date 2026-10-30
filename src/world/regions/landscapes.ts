import { B } from "../blocks";
import { hash, noise } from "../noise";
import { VoxelWriter } from "../city/writer";
import type { Rect } from "../city/plan";
import { footprintBounds } from "../geography/geometry";
import { sampleTerrain } from "../geography/terrain";
import type { MacroPlan } from "../geography/plan";
import type { RealizationPlan } from "../landmarks/types";
import type { RegionalSite } from "./plan";
import { forestCellRank } from "./forest-policy";

export type LandscapeTheme="karst"|"mountain-heritage"|"tea-hills"|"village-orchard"|"heritage-garden"|"lake-garden";
export type LandscapePatch={id:string;bounds:Rect;context:string;theme:LandscapeTheme;x:number;z:number;seed:number};
export type LandscapeProgram={patches:LandscapePatch[];byCell:Map<string,LandscapePatch>};
const cell=(x:number,z:number)=>`${Math.floor(x/40)},${Math.floor(z/40)}`;
/** Every removed woodland cell in the existing envelope receives contextual
 * landscape realization. It is not relabeled empty grass. No new monumental
 * replicas or random object field is introduced between the destinations. */
export function createLandscapeProgram(m:MacroPlan,old:RealizationPlan,sites:readonly RegionalSite[]):LandscapeProgram {
  const contexts=[...sites.map(s=>({id:s.id,x:s.reservation.anchor.x,z:s.reservation.anchor.z,theme:(s.id==="li-stone-walk"?"karst":s.id==="willow-tulou"?"village-orchard":s.id==="mist-tea-village"?"tea-hills":s.id==="lotus-causeway"?"lake-garden":"heritage-garden") as LandscapeTheme})),
    ...old.sites.map(s=>({id:s.id,x:s.entry.x,z:s.entry.z,theme:(s.id==="ridge-fortification"||s.id==="cliff-grotto"||s.id==="mountain-temple"||s.id==="western-viewpoint"?"mountain-heritage":s.id==="scenic-landscape"||s.id==="harbor-front"?"lake-garden":"heritage-garden") as LandscapeTheme}))];
  const bounds=footprintBounds(m.envelope),patches:LandscapePatch[]=[],byCell=new Map<string,LandscapePatch>();
  for(let cz=Math.floor(bounds.z1/40);cz<=Math.floor(bounds.z2/40);cz++)for(let cx=Math.floor(bounds.x1/40);cx<=Math.floor(bounds.x2/40);cx++){
    const x=cx*40+20,z=cz*40+20,rank=forestCellRank(m.seed,x,z);if(rank<4||rank>=12)continue;
    // Match the old forest eligibility at actual terrain probes. Per-column
    // realization still protects every city/road/reservation/water interface.
    // Catalogue the complete old quota delta. Eligibility is per column,
    // so a shoreline cell cannot lose its small dry woodland edge silently.
    const context=[...contexts].sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z)||(a.id<b.id?-1:1))[0];
    const patch:LandscapePatch={id:`landscape9:${cx}:${cz}`,bounds:{x1:Math.max(bounds.x1,cx*40),x2:Math.min(bounds.x2,cx*40+39),z1:Math.max(bounds.z1,cz*40),z2:Math.min(bounds.z2,cz*40+39)},context:context.id,theme:context.theme,x:x+Math.floor(hash(cx,cz,m.seed,971)*9)-4,z:z+Math.floor(hash(cx,cz,m.seed,972)*9)-4,seed:Math.floor(hash(cx,cz,m.seed,973)*0x7fffffff)};
    if(patch.bounds.x1>patch.bounds.x2||patch.bounds.z1>patch.bounds.z2)continue;patches.push(patch);byCell.set(`${cx},${cz}`,patch);
  }
  if(patches.length>256)throw Error("Regional landscape budget exceeded");
  return{patches,byCell};
}
export const landscapeAt=(p:LandscapeProgram,x:number,z:number)=>p.byCell.get(cell(x,z));

/** Curated regional landforms/planting use the existing terrain and chunk
 * writer. Core destinations own buildings and traffic; these are their wider
 * landscape, not another famous attraction placed every forty blocks. */
export function drawLandscapeProgram(w:VoxelWriter,m:MacroPlan,p:LandscapeProgram,allowed:(x:number,z:number)=>boolean) {
  const patches=new Map<string,LandscapePatch>();
  for(const x of[w.ox,w.ox+15])for(const z of[w.oz,w.oz+15]){const a=landscapeAt(p,x,z);if(a)patches.set(a.id,a);}
  const okay=new Map<string,boolean>(),can=(x:number,z:number)=>{if(x<w.ox||x>w.ox+15||z<w.oz||z>w.oz+15)return false;const key=`${x},${z}`;if(!okay.has(key))okay.set(key,allowed(x,z));return okay.get(key)!;};
  for(const a of patches.values()){
    for(let z=Math.max(w.oz,a.bounds.z1);z<=Math.min(w.oz+15,a.bounds.z2);z++)for(let x=Math.max(w.ox,a.bounds.x1);x<=Math.min(w.ox+15,a.bounds.x2);x++){
      if(!can(x,z))continue;
      const h=sampleTerrain(m,x,z).height,dx=x-a.x,dz=z-a.z,n=noise(x/13,z/13,m.seed+974),r=Math.hypot(dx,dz);
      if(a.theme==="karst"||a.theme==="mountain-heritage") {
        const ridge=Math.sin((dx+dz*.4)/5)+Math.cos(dz/6),rock=r<14&&ridge>.3;
        w.put(x,h,z,rock?B.SculptureStone:n>.57?B.Moss:B.Grass);
        if(rock){const rise=Math.max(1,Math.floor((14-r)/3+ridge*(a.theme==="karst"?2:1)));w.fill(x,h+1,z,x,h+rise,z,rise>4?B.Stone:B.Moss);}
      }else if(a.theme==="tea-hills"){
        const contour=((h+Math.floor(x/11))%6+6)%6;
        w.put(x,h,z,contour===0?B.Moss:n>.64?B.Gravel:B.Grass);
        if(contour===1&&r<16)w.put(x,h+1,z,B.Tea);
      }else{
        const path=Math.abs(dz-Math.sin(dx/9)*3)<1.3&&Math.abs(dx)<17;
        w.put(x,h,z,path?B.Gravel:n>.65?B.Moss:B.Grass);
        if(!path&&r<13&&((dx+dz+a.seed)%11+11)%11===0)w.put(x,h+1,z,a.theme==="village-orchard"?B.Flower:B.Moss);
        if(a.theme==="lake-garden"&&n>.6&&r<10) {w.put(x,h,z,B.Moss);if((dx+dz)%5===0)w.put(x,h+1,z,B.Flower);}
        // Scholar/heritage rockery is a connected low composition beside the
        // garden walk, rather than isolated tall blocks on bare ground.
        if(a.theme==="heritage-garden"&&Math.hypot(dx-6,dz+6)<4)w.fill(x,h+1,z,x,h+Math.max(1,Math.floor(4-Math.hypot(dx-6,dz+6)/1.4)),z,B.SculptureStone);
      }
    }
    if(a.theme==="village-orchard"||a.theme==="heritage-garden"||a.theme==="lake-garden")for(const[dx,dz]of[[-11,-9],[9,10],[12,-11]]){
      const x=a.x+dx,z=a.z+dz;if(!allowed(x,z))continue;const h=sampleTerrain(m,x,z).height;
      w.put(x,h,z,B.Moss);w.fill(x,h+1,z,x,h+4,z,B.DarkTimber);
      for(let y=0;y<3;y++)for(let vz=-2;vz<=2;vz++)for(let ux=-2;ux<=2;ux++)if(ux*ux+vz*vz<7&&can(x+ux,z+vz))w.put(x+ux,h+4+y,z+vz,a.theme==="lake-garden"?B.Blossom:B.Leaves);
    }
  }
}
