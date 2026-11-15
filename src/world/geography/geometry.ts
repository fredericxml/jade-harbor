import { clamp } from "../../core/coords";

export type Point = Readonly<{ x: number; z: number }>;
export type Bounds = Readonly<{ x1: number; z1: number; x2: number; z2: number }>;
export type Footprint =
  | Readonly<{ kind: "point"; center: Point; radius: number }>
  | Readonly<{ kind: "area"; bounds: Bounds }>
  | Readonly<{ kind: "corridor"; points: readonly Point[]; halfWidth: number }>;

function segmentDistanceAt(x:number,z:number,a:Point,b:Point):number {
  const dx=b.x-a.x,dz=b.z-a.z;
  const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);
  return Math.hypot(x-a.x-t*dx,z-a.z-t*dz);
}
export function segmentDistance(p:Point,a:Point,b:Point):number {
  return segmentDistanceAt(p.x,p.z,a,b);
}
type PathSegmentMetrics=Readonly<{ax:number;az:number;dx:number;dz:number;denominator:number}>;
const pathMetricsCache=new WeakMap<readonly Point[],readonly PathSegmentMetrics[]|null>();
function immutablePathMetrics(points:readonly Point[]):readonly PathSegmentMetrics[]|undefined {
  const cached=pathMetricsCache.get(points);
  if(cached!==undefined)return cached??undefined;
  // Only cache deeply frozen paths; callers may otherwise mutate a route in place.
  if(!Object.isFrozen(points)||points.some(p=>!Object.isFrozen(p))){pathMetricsCache.set(points,null);return undefined;}
  const metrics:PathSegmentMetrics[]=[];
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z;
    metrics.push({ax:a.x,az:a.z,dx,dz,denominator:dx*dx+dz*dz||1});
  }
  pathMetricsCache.set(points,metrics);
  return metrics;
}
export function pathDistance(points:readonly Point[],x:number,z:number):number {
  const metrics=immutablePathMetrics(points);
  let distance=Infinity;
  if(metrics){
    for(const s of metrics){
      const t=clamp(((x-s.ax)*s.dx+(z-s.az)*s.dz)/s.denominator,0,1);
      const d=Math.hypot(x-s.ax-t*s.dx,z-s.az-t*s.dz);
      if(d<distance)distance=d;
    }
    return distance;
  }
  for(let i=1;i<points.length;i++){
    const d=segmentDistanceAt(x,z,points[i-1],points[i]);
    if(d<distance)distance=d;
  }
  return distance;
}
/** Signed distance to a footprint. Negative values are inside. No query cache. */
export function footprintDistance(f: Footprint, x: number, z: number): number {
  if (f.kind === "point") return Math.hypot(x - f.center.x, z - f.center.z) - f.radius;
  if (f.kind === "corridor") return pathDistance(f.points, x, z) - f.halfWidth;
  const b = f.bounds, dx = Math.max(b.x1 - x, x - b.x2), dz = Math.max(b.z1 - z, z - b.z2);
  return Math.hypot(Math.max(0, dx), Math.max(0, dz)) + Math.min(0, Math.max(dx, dz));
}
export function footprintBounds(f:Footprint):Bounds {
  if(f.kind==="area")return f.bounds;
  if(f.kind==="point")return{x1:f.center.x-f.radius,x2:f.center.x+f.radius,z1:f.center.z-f.radius,z2:f.center.z+f.radius};
  if(!f.points.length)return{x1:Infinity,x2:-Infinity,z1:Infinity,z2:-Infinity};
  let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
  for(const p of f.points){if(p.x<minX)minX=p.x;if(p.x>maxX)maxX=p.x;if(p.z<minZ)minZ=p.z;if(p.z>maxZ)maxZ=p.z;}
  return{x1:minX-f.halfWidth,x2:maxX+f.halfWidth,z1:minZ-f.halfWidth,z2:maxZ+f.halfWidth};
}
function segments(f:Footprint):readonly (readonly [Point,Point])[] {
  if(f.kind==="point")return[[f.center,f.center]];
  if(f.kind==="corridor"){
    const result:[Point,Point][]=[];
    for(let i=1;i<f.points.length;i++)result.push([f.points[i-1],f.points[i]]);
    return result;
  }
  const b=f.bounds,p:Point[]=[{x:b.x1,z:b.z1},{x:b.x2,z:b.z1},{x:b.x2,z:b.z2},{x:b.x1,z:b.z2}],result:[Point,Point][]=[];
  for(let i=0;i<4;i++)result.push([p[i],p[(i+1)%4]]);
  return result;
}
function cross(a: Point, b: Point, c: Point) { return (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x); }
function segmentGapWithin(a:Point,b:Point,c:Point,d:Point,limit:number):boolean {
  const aMinX=Math.min(a.x,b.x),aMaxX=Math.max(a.x,b.x),aMinZ=Math.min(a.z,b.z),aMaxZ=Math.max(a.z,b.z);
  const bMinX=Math.min(c.x,d.x),bMaxX=Math.max(c.x,d.x),bMinZ=Math.min(c.z,d.z),bMaxZ=Math.max(c.z,d.z);
  if(aMaxX>=bMinX&&bMaxX>=aMinX&&aMaxZ>=bMinZ&&bMaxZ>=aMinZ&&
    cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0)return 0<=limit;
  // Segment AABB separation is a lower bound on true segment distance. Reject
  // distant pairs before running four point-to-segment distance calculations.
  const gapX=Math.max(0,aMinX-bMaxX,bMinX-aMaxX),gapZ=Math.max(0,aMinZ-bMaxZ,bMinZ-aMaxZ);
  if(gapX>limit||gapZ>limit||Math.hypot(gapX,gapZ)>limit)return false;
  return segmentDistance(a,c,d)<=limit||segmentDistance(b,c,d)<=limit||
    segmentDistance(c,a,b)<=limit||segmentDistance(d,a,b)<=limit;
}
/** Exact circle/rectangle/capsule-union overlap, including exclusion margins. */
export function footprintsOverlap(a: Footprint, b: Footprint, margin = 0): boolean {
  const aa = footprintBounds(a), bb = footprintBounds(b);
  if (aa.x1 - margin > bb.x2 || aa.x2 + margin < bb.x1 || aa.z1 - margin > bb.z2 || aa.z2 + margin < bb.z1) return false;
  const sa=segments(a),sb=segments(b);
  if(!sa.length||!sb.length)return false;
  if(footprintDistance(a,sb[0][0].x,sb[0][0].z)<=margin||footprintDistance(b,sa[0][0].x,sa[0][0].z)<=margin)return true;
  const radiusA=a.kind==="point"?a.radius:a.kind==="corridor"?a.halfWidth:0;
  const radiusB=b.kind==="point"?b.radius:b.kind==="corridor"?b.halfWidth:0;
  const limit=radiusA+radiusB+margin;
  for(let i=0;i<sa.length;i++)for(let j=0;j<sb.length;j++){
    const [p,q]=sa[i],[r,s]=sb[j];
    if(segmentGapWithin(p,q,r,s,limit))return true;
  }
  return false;
}
export function validFootprint(f: Footprint): boolean {
  if (!f || !["point", "area", "corridor"].includes(f.kind)) return false;
  const valid = (p: Point) => !!p && Number.isFinite(p.x) && Number.isFinite(p.z) && Math.abs(p.x) <= 1e7 && Math.abs(p.z) <= 1e7;
  if (f.kind === "point") return valid(f.center) && Number.isFinite(f.radius) && f.radius >= 0 && f.radius <= 4096;
  if (f.kind === "corridor") return f.points.length >= 2 && f.points.length <= 32 && f.points.every(valid) && Number.isFinite(f.halfWidth) && f.halfWidth >= 0 && f.halfWidth <= 4096;
  const b = f.bounds;
  return !!b && valid({ x: b.x1, z: b.z1 }) && valid({ x: b.x2, z: b.z2 }) && b.x1 <= b.x2 && b.z1 <= b.z2;
}
export function freezePlan<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezePlan(child);
    Object.freeze(value);
  }
  return value;
}
