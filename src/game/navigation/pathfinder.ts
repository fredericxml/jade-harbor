import { Vec3, idOf, MIN_Y, MAX_Y } from '../../core/coords';
import { B, block, boxes } from '../../world/blocks';
import { World } from '../../world/world';
import { collides } from '../../player/physics';
export type NavWorld = Pick<World,'get'|'loaded'> & { navRevision?: number };
export type PathStatus = 'searching'|'ready'|'arrived'|'blocked'|'unloaded';
type Node = Vec3 & {g:number; f:number; parent?:Node};
const NAV_DIRECTIONS = [[1,0],[-1,0],[0,1],[0,-1]] as const;
const TRAVERSE_FRACTIONS = [.25,.5,.75,1] as const;
const STAND_HAZARD_HEIGHTS = [-.1,.4,1] as const;
const STAND_HAZARD_OFFSETS = [[0,0],[.3,0],[-.3,0],[0,.3],[0,-.3]] as const;
const key=(p:Vec3)=>`${Math.floor(p.x)},${Math.round(p.y*2)},${Math.floor(p.z)}`;
/** Find supported feet height, considering real collision boxes and head clearance. */
function standAtUncached(world:NavWorld,x:number,z:number,y:number,doors=true,height=1.75):Vec3|null {
  if(!world.loaded(x,z)) return null;
  const wrapper={get:(a:number,b:number,c:number)=>{const v=world.get(a,b,c);return doors && idOf(v)===B.Door?0:v;}};
  const candidates:number[]=[];
  for(let by=Math.floor(y)-2;by<=Math.floor(y)+1;by++)
  for(let bx=Math.floor(x-.27);bx<=Math.floor(x+.27);bx++)
  for(let bz=Math.floor(z-.27);bz<=Math.floor(z+.27);bz++) {
    const v=world.get(bx,by,bz);if(!block(v).solid || idOf(v)===B.Door) continue;
    for(const [a,,c,d,e,f] of boxes(v)) if(x+.27>bx+a && x-.27<bx+d && z+.27>bz+c && z-.27<bz+f) {
      const top=by+e;
      if(top<=y+1.01 && top>=y-1.01 && top>MIN_Y && top<MAX_Y) candidates.push(top);
    }
  }
  // Stable insertion by distance avoids allocating a sort comparator on every
  // uncached support probe. Strict comparison preserves original tie order.
  for (let i=1;i<candidates.length;i++) {
    const value=candidates[i],distanceFromY=Math.abs(value-y);
    let j=i;
    while(j>0 && distanceFromY<Math.abs(candidates[j-1]-y)){candidates[j]=candidates[j-1];j--;}
    candidates[j]=value;
  }
  for(const top of candidates) {
    const p={x,y:top+.002,z};
    if(collides(wrapper,p,height,.27)) continue;
    let hazard=false;
    for(const dy of STAND_HAZARD_HEIGHTS) for(const [dx,dz] of STAND_HAZARD_OFFSETS) {
      const id=idOf(world.get(x+dx,p.y+dy,z+dz));
      if(id===B.Lava || id===B.Water) hazard=true;
    }
    if(!hazard) return p;
  }
  return null;
}

type StandCache = { revision: number; values: Map<string, Vec3 | null> };
const standCaches = new WeakMap<object, StandCache>();
const STAND_CACHE_LIMIT = 8192;

/** Cache repeated support/headroom probes within one world navigation revision.
 * Chunk acceptance/eviction and block edits advance navRevision, invalidating
 * positive and negative results. Returned points are copied to preserve value semantics. */
export function standAt(world:NavWorld,x:number,z:number,y:number,doors=true,height=1.75):Vec3|null {
  const revision = world.navRevision;
  if (typeof revision !== "number" || !Number.isFinite(revision))
    return standAtUncached(world,x,z,y,doors,height);
  let cache = standCaches.get(world as object);
  if (!cache || cache.revision !== revision) {
    cache = { revision, values: new Map<string, Vec3 | null>() };
    standCaches.set(world as object, cache);
  }
  const cacheKey = `${x},${z},${y},${doors ? 1 : 0},${height}`;
  const existing = cache.values.get(cacheKey);
  if (existing !== undefined || cache.values.has(cacheKey)) {
    cache.values.delete(cacheKey);
    cache.values.set(cacheKey, existing ?? null);
    return existing ? { x: existing.x, y: existing.y, z: existing.z } : null;
  }
  const result = standAtUncached(world,x,z,y,doors,height);
  if (cache.values.size >= STAND_CACHE_LIMIT) {
    const oldest = cache.values.keys().next().value;
    if (oldest !== undefined) cache.values.delete(oldest);
  }
  cache.values.set(cacheKey, result ? { x: result.x, y: result.y, z: result.z } : null);
  return result;
}

export function traversable(world:NavWorld,from:Vec3,to:Vec3,doors=true,height=1.75) {
  let p=from;
  // Swept supported samples prevent diagonal shortcuts, fences and one-block wall climbs.
  for(const fraction of TRAVERSE_FRACTIONS) {
    const q=standAt(world,from.x+(to.x-from.x)*fraction,from.z+(to.z-from.z)*fraction,p.y,doors,height);
    if(!q || q.y-p.y>.51 || p.y-q.y>1.01) return false;
    p=q;
  }
  return Math.abs(p.y-to.y)<.1;
}
class Heap {
  a:Node[]=[];
  push(n:Node){let i=this.a.length;this.a.push(n);while(i){const p=(i-1)>>1;if(this.a[p].f<=n.f)break;this.a[i]=this.a[p];i=p;}this.a[i]=n;}
  pop(){const first=this.a[0],last=this.a.pop();if(this.a.length && last){let i=0;while(i*2+1<this.a.length){let c=i*2+1;if(c+1<this.a.length && this.a[c+1].f<this.a[c].f)c++;if(this.a[c].f>=last.f)break;this.a[i]=this.a[c];i=c;}this.a[i]=last;}return first;}
}
export class PathSearch {
  status:PathStatus='searching'; path:Vec3[]=[]; expanded=0;
  private open=new Heap();private costs=new Map<string,number>();
  private goal:Vec3;
  constructor(private world:NavWorld,from:Vec3,to:Vec3,private doors=true,private height=1.75,private limit=2400) {
    this.goal=to;
    if(!world.loaded(to.x,to.z)){this.status='unloaded';return;}
    const start=standAt(world,Math.floor(from.x)+.5,Math.floor(from.z)+.5,from.y,doors,height);
    const goal=standAt(world,Math.floor(to.x)+.5,Math.floor(to.z)+.5,to.y,doors,height);
    if(!start || !goal){this.status='blocked';return;}this.goal=goal;
    const n={...start,g:0,f:this.h(start)};this.open.push(n);this.costs.set(key(n),0);
  }
  private h(p:Vec3){return Math.abs(p.x-this.goal.x)+Math.abs(p.z-this.goal.z)+Math.abs(p.y-this.goal.y)*.5;}
  step(budget=64){
    for(let i=0;i<budget && this.status==='searching';i++) {
      const n=this.open.pop();if(!n || ++this.expanded>this.limit){this.status='blocked';break;}
      if(n.g!==(this.costs.get(key(n)) ?? Infinity))continue;
      if(key(n)===key(this.goal)) {const path:Vec3[]=[];let v:Node|undefined=n;while(v){path.push({x:v.x,y:v.y,z:v.z});v=v.parent;}this.path=path.reverse();this.status='ready';break;}
      for(const [dx,dz] of NAV_DIRECTIONS) {
        const p=standAt(this.world,n.x+dx,n.z+dz,n.y,this.doors,this.height);
        if(!p || !traversable(this.world,n,p,this.doors,this.height))continue;
        const g=n.g+1+Math.abs(n.y-p.y)*.4,k=key(p);
        if(g>128 || g>=(this.costs.get(k) ?? Infinity))continue;
        this.costs.set(k,g);this.open.push({...p,g,f:g+this.h(p),parent:n});
      }
    }
    return this.status;
  }
}
export type NavAgent={search?:PathSearch;path:Vec3[];index:number;target:string;retry:number;status:PathStatus;revision:number;stuck:number;last?:Vec3};
/** One fair queue for all NPCs: no per-NPC unbounded A* in a frame. Paths are disposable caches. */
export class Navigation {
  agents=new Map<string,NavAgent>();
  expandedLastTick=0; searchesStarted=0; solveMs=0; private cursor=0; private jobs: NavAgent[] = [];
  constructor(public world:World){}
  removeMissing(ids:Set<string>){for(const id of this.agents.keys())if(!ids.has(id))this.agents.delete(id);}
  steer(id:string,p:Vec3,target:Vec3,dt:number,doors=true,height=1.75) {
    let a=this.agents.get(id);if(!a){a={path:[],index:0,target:'',retry:0,status:'searching',revision:0,stuck:0};this.agents.set(id,a);}
    a.retry-=dt;
    const tk=key(target);
    if(tk!==a.target){a.path=[];a.search=undefined;a.target=tk;a.retry=0;}
    if(a.path.length && a.revision!==this.world.navRevision) {
      const next=a.path[a.index];
      if(next && !traversable(this.world,p,next,doors,height)) {a.path=[];a.retry=0;}
      a.revision=this.world.navRevision;
    }
    while(a.index<a.path.length && Math.hypot(a.path[a.index].x-p.x,a.path[a.index].z-p.z)<.16 && Math.abs(a.path[a.index].y-p.y)<.3)a.index++;
    if(a.path.length && a.index>=a.path.length){a.status='arrived';return null;}
    // Most city-life circuits are short, authored street-to-street trips. Do
    // not make every unobstructed local trip wait behind the shared A* queue:
    // probe one supported, swept step and use it while the corridor is clear.
    // If a wall, elevation change or other obstruction blocks that step, retain
    // the existing fair A* scheduler as the fallback.
    if(!a.path.length){
      const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);
      if(d<=.55 && Math.abs(target.y-p.y)<=.51){a.search=undefined;a.path=[];a.index=0;a.status='arrived';a.retry=0;return null;}
      if(d>.08 && d<=8 && Math.abs(target.y-p.y)<=.51){
        const step=Math.min(.65,d),candidate=standAt(this.world,p.x+dx/d*step,p.z+dz/d*step,p.y,doors,height);
        if(candidate && Math.hypot(candidate.x-p.x,candidate.z-p.z)>.08 && traversable(this.world,p,candidate,doors,height)){
          a.search=undefined;a.path=[];a.index=0;a.status='ready';a.retry=0;
          if(a.last && Math.hypot(a.last.x-p.x,a.last.z-p.z)<.008)a.stuck+=dt;else a.stuck=0;
          if(a.last){a.last.x=p.x;a.last.y=p.y;a.last.z=p.z;}else a.last={...p};
          if(a.stuck>2){a.status='blocked';a.stuck=0;return null;}
          return candidate;
        }
      }
    }
    if(!a.path.length && !a.search && a.retry<=0){this.searchesStarted++;a.search=new PathSearch(this.world,p,target,doors,height);a.status=a.search.status;a.retry=3;}
    const next=a.path[a.index];
    if(next){
      if(a.last && Math.hypot(a.last.x-p.x,a.last.z-p.z)<.008)a.stuck+=dt;else a.stuck=0;
      if(a.last){a.last.x=p.x;a.last.y=p.y;a.last.z=p.z;}else a.last={...p};
      if(a.stuck>2){a.path=[];a.search=undefined;a.retry=1;a.status='blocked';a.stuck=0;return null;}
      return next;
    }
    return null;
  }
  tick(maxNodes=96,budgetMs=2){
    const started=performance.now();
    this.expandedLastTick=0;
    const jobs=this.jobs;jobs.length=0;
    for(const a of this.agents.values())if(a.search)jobs.push(a);
    const end=performance.now()+budgetMs;
    for(let i=0;i<jobs.length && this.expandedLastTick<maxNodes && performance.now()<end;i++) {
      const a=jobs[(i+this.cursor)%jobs.length],s=a.search!;const before=s.expanded;s.step(Math.min(24,maxNodes-this.expandedLastTick));this.expandedLastTick+=s.expanded-before;
      if(s.status!=='searching'){a.status=s.status;a.path=s.path;a.index=0;a.revision=this.world.navRevision;a.search=undefined;}
    }
    jobs.length=0;
    this.cursor++;this.solveMs=performance.now()-started;
  }
}
