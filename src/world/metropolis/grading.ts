import { inCity } from "../city/plan";
import type { Point } from "../geography/geometry";
import type { MacroPlan } from "../geography/plan";
import { sampleTerrain } from "../geography/terrain";
import type { UrbanRoad } from "./plan";

/** Split streets at shared junctions before grading them. The graph relaxation
 * limits grade to 0.45; quantized half-block surfaces remain walkable. Urban
 * terrace levels are fixed by the protected city plan. Outside town only the road ribbon changes. */
type SegmentBounds = Readonly<{ minX:number; maxX:number; minZ:number; maxZ:number }>;
type SegmentInput = Readonly<{ a:Point; b:Point }>;

const overlapsBounds = (a:SegmentBounds,b:SegmentBounds) =>
  a.minX <= b.maxX && a.maxX >= b.minX && a.minZ <= b.maxZ && a.maxZ >= b.minZ;

/**
 * Return every pair whose segment AABBs overlap. The grid is only a broad
 * phase: exact line intersection remains in gradeRoads. Inclusive cell ranges
 * intentionally retain endpoint/tile-boundary contacts.
 */
export function candidateSegmentPairs(segments:readonly SegmentInput[],cellSize=64):[number,number][] {
  if(!Number.isFinite(cellSize)||cellSize<=0)throw new Error("Invalid segment index cell size");
  const count=segments.length,bounds:SegmentBounds[]=segments.map(({a,b})=>({
    minX:Math.min(a.x,b.x),maxX:Math.max(a.x,b.x),minZ:Math.min(a.z,b.z),maxZ:Math.max(a.z,b.z)
  }));
  const bins=new Map<string,number[]>(),longSegments:number[]=[],pairs:[number,number][]=[];
  const maxCellsPerSegment=4096;
  for(let i=0;i<count;i++){
    const box=bounds[i],x0=Math.floor(box.minX/cellSize),x1=Math.floor(box.maxX/cellSize),
      z0=Math.floor(box.minZ/cellSize),z1=Math.floor(box.maxZ/cellSize),cellCount=(x1-x0+1)*(z1-z0+1);
    if(cellCount>maxCellsPerSegment){
      // Avoid pathological memory growth for exceptionally long road segments.
      for(let j=0;j<i;j++)if(overlapsBounds(box,bounds[j]))pairs.push([j,i]);
      longSegments.push(i);
      continue;
    }
    // Long segments are deliberately kept out of the grid, so test them once
    // against each later short segment. This keeps indexing bounded.
    for(const j of longSegments)if(overlapsBounds(box,bounds[j]))pairs.push([j,i]);
    const seen=new Set<number>();
    for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){
      const bucket=bins.get(`${x},${z}`);
      if(bucket)for(const j of bucket){
        if(seen.has(j)||!overlapsBounds(box,bounds[j]))continue;
        seen.add(j);pairs.push([j,i]);
      }
      if(bucket)bucket.push(i);else bins.set(`${x},${z}`,[i]);
    }
  }
  return pairs;
}

export function gradeRoads(m:MacroPlan,roads:UrbanRoad[]):UrbanRoad[]{
  type Segment={road:number;a:Point;b:Point;cuts:number[]};
  const segments:Segment[]=[];
  roads.forEach((r,road)=>r.points.slice(1).forEach((b,i)=>segments.push({road,a:r.points[i],b,cuts:[0,1]})));
  const cross=(ax:number,az:number,bx:number,bz:number)=>ax*bz-az*bx;
  for(const [i,j] of candidateSegmentPairs(segments)){
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
