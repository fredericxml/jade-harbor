import type { Vec3 } from "../../core/coords";
import { distance } from "../../core/coords";
import type { World } from "../../world/world";
import type { LandmarkId } from "../../world/landmarks/types";

/** Small metadata itineraries supplement, rather than enlarge, voxel A*. */
export function activityRoute(world: World, from: Vec3, to: Vec3, landmark?: LandmarkId): Vec3[] {
  const urban = world.metropolisPlan;
  // A canal crossing can need a long detour despite a close Euclidean goal.
  // Guide it through an existing bridge instead of searching both banks blind.
  if (urban && (from.x - 144) * (to.x - 144) < 0 && Math.min(from.z, to.z) >= -204 && Math.max(from.z, to.z) <= 104 && Math.min(from.x, to.x) > 100) {
    const bridges = urban.roads.filter(r => r.id.startsWith("water-bridge-"));
    const bridge = [...bridges].sort((a,b)=>Math.abs(a.points[0].z-from.z)+Math.abs(a.points[0].z-to.z)-Math.abs(b.points[0].z-from.z)-Math.abs(b.points[0].z-to.z))[0];
    if (bridge) {
      const z=bridge.points[0].z+.5, y=21.002, east=from.x>144;
      return [{x:east?156.5:132.5,y,z},{x:east?132.5:156.5,y,z},to];
    }
  }
  const plan=world.landmarkPlan;
  if (!plan || !landmark || distance(from,to)<48) return [to];
  const approach=plan.approaches.find(a=>a.site===landmark&&a.nodes.length>24);
  if (!approach) return [to];
  const nodes=approach.nodes;
  const closest=(p:Vec3)=>{let best=0,d=Infinity;nodes.forEach((n,i)=>{const v=Math.hypot(n.x+.5-p.x,n.z+.5-p.z);if(v<d){d=v;best=i;}});return best;};
  const a=closest(from),b=closest(to),direction=a<=b?1:-1,route:Vec3[]=[];
  for(let i=a;direction>0?i<=b:i>=b;i+=16*direction)route.push({x:nodes[i].x+.5,y:nodes[i].y+1.002,z:nodes[i].z+.5});
  route.push(to);return route.slice(0,160);
}
