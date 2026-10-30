import { inCity } from "../city/plan";
import type { Point } from "../geography/geometry";
import type { MacroPlan } from "../geography/plan";
import { sampleTerrain } from "../geography/terrain";
import type { UrbanRoad } from "./plan";

/** Split streets at shared junctions before grading them. The graph relaxation
 * limits grade to 0.45; quantized half-block surfaces remain walkable. Urban
 * terrace levels are fixed by Shot 1. Outside town only the road ribbon changes. */
export function gradeRoads(m:MacroPlan,roads:UrbanRoad[]):UrbanRoad[]{
  type Segment={road:number;a:Point;b:Point;cuts:number[]};
  const segments:Segment[]=[];
  roads.forEach((r,road)=>r.points.slice(1).forEach((b,i)=>segments.push({road,a:r.points[i],b,cuts:[0,1]})));
  const cross=(ax:number,az:number,bx:number,bz:number)=>ax*bz-az*bx;
  for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){
    const s=segments[i],t=segments[j],dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,ex=t.b.x-t.a.x,ez=t.b.z-t.a.z,den=cross(dx,dz,ex,ez);
    if(Math.abs(den)<1e-8)continue;
    const qx=t.a.x-s.a.x,qz=t.a.z-s.a.z,u=cross(qx,qz,ex,ez)/den,v=cross(qx,qz,dx,dz)/den;
    if(u>=0&&u<=1&&v>=0&&v<=1){s.cuts.push(u);t.cuts.push(v);}
  }
  type Node=Point&{y:number;fixed:boolean};
  const nodes=new Map<string,Node>(),edges:[Node,Node,number][]=[],paths:Node[][]=roads.map(()=>[]);
  const node=(x:number,z:number)=>{
    x=Math.round(x*1000)/1000;z=Math.round(z*1000)/1000;
    const key=`${x},${z}`;let q=nodes.get(key);
    if(!q){const t=sampleTerrain(m,x,z);q={x,z,y:t.water?20:t.elevation,fixed:inCity(x,z)};nodes.set(key,q);}return q;
  };
  for(const s of segments){
    const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,length=Math.hypot(dx,dz);
    for(let n=1;n<Math.ceil(length/8);n++)s.cuts.push(n/Math.ceil(length/8));
    const cut=[...new Set(s.cuts)].sort((a,b)=>a-b),path=paths[s.road];
    for(const t of cut){const q=node(s.a.x+dx*t,s.a.z+dz*t),last=path.at(-1);if(last===q)continue;if(last)edges.push([last,q,Math.hypot(q.x-last.x,q.z-last.z)*.45]);path.push(q);}
  }
  // Monotone lowering of unsupported peaks converges in at most graph diameter
  // passes. Fixed city grades can instead raise their immediate approach nodes.
  for(let pass=0;pass<128;pass++){
    let changed=false;
    for(const [a,b,limit] of edges){
      if(a.y>b.y+limit+.0001&&!a.fixed){a.y=b.y+limit;changed=true;}
      else if(a.y>b.y+limit+.0001&&!b.fixed){b.y=a.y-limit;changed=true;}
      if(b.y>a.y+limit+.0001&&!b.fixed){b.y=a.y+limit;changed=true;}
      else if(b.y>a.y+limit+.0001&&!a.fixed){a.y=b.y-limit;changed=true;}
    }
    if(!changed)break;
  }
  return roads.map((r,i)=>({...r,points:paths[i].map(({x,z,y})=>({x,z,y}))}));
}
