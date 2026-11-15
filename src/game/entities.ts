import { createId } from "../core/ids";
import { activeSimulationCandidates } from "./city-life/active-actors";
import { cloneStack, sameStack } from "./stack";
import { item } from "./items";
import { World } from "../world/world";
import { Vec3, distance, idOf, stateOf, packed } from "../core/coords";
import { block, B } from "../world/blocks";
import { Body, moveBody } from "../player/physics";
import { Inventory, Stack } from "./inventory";
import { Navigation, standAt, traversable } from "./navigation/pathfinder";
import { Profession, PROFESSIONS, residents } from "./professions";
import { hash } from "../world/noise";
import { meleeSightBetween, rayBoxDistance } from "./combat";
import { CityLife } from "./city-life/runtime";
import { scheduleAt } from "./city-life/schedules";
import { circuitStart } from "./city-life/presence";
import { shouldYieldToMovingActor } from "./occupancy";

// Pack the 4-block local occupancy grid into a safe integer key. The world
// coordinate contract keeps each cell coordinate within the biased range.
const OCCUPANCY_CELL_BIAS = 4_194_304;
const OCCUPANCY_CELL_STRIDE = 8_388_608;
const occupancyCellKey = (gx:number,gz:number) =>
  (gx+OCCUPANCY_CELL_BIAS)*OCCUPANCY_CELL_STRIDE+(gz+OCCUPANCY_CELL_BIAS);
export type Entity = {
  id: string;
  kind: "villager" | "panda" | "spirit";
  name: string;
  body: Body;
  health: number;
  home: Vec3;
  goal: Vec3;
  timer: number;
  cooldown: number;
  yaw: number;
  state: string;
  trades: number;
  profession?: Profession;
  workplace?: Vec3;
  navStatus?: string;
  knockback?: Vec3;
};
export type EntityHitResult = { status: "invalid" | "blocked" | "hit" | "killed"; damage: number };
export type Drop = {
  id: string;
  stack: Stack;
  position: Vec3;
  velocity: Vec3;
  age: number;
};
export const TRADES = [
  {
    cost: [[108, 8]] as [number, number][],
    output: [111, 1] as [number, number],
    label: "Sell harvested rice",
  },
  {
    cost: [[103, 1]] as [number, number][],
    output: [111, 4] as [number, number],
    label: "Sell a jade shard",
  },
  {
    cost: [[111, 1]] as [number, number][],
    output: [105, 3] as [number, number],
    label: "Steamed dumplings",
  },
  {
    cost: [[111, 2]] as [number, number][],
    output: [14, 6] as [number, number],
    label: "Festival lanterns",
  },
  {
    cost: [[111, 4]] as [number, number][],
    output: [130, 1] as [number, number],
    label: "Iron pickaxe",
  },
];
TRADES.push(
 {cost:[[111,1]],output:[112,3],label:"Jasmine tea"},
 {cost:[[111,1]],output:[8,16],label:"Cedar planks"},
 {cost:[[111,1]],output:[23,1],label:"Crafting bench"},
 {cost:[[111,1]],output:[58,4],label:"Glazed pottery"},
);
export function offersFor(e:Entity) {
 const allowed=e.profession?PROFESSIONS[e.profession].offers:null;
 return TRADES.map((offer,id)=>({offer,id})).filter(({id})=>!allowed || (allowed as readonly number[]).includes(id));
}
export function spawnEntity(
  kind: Entity["kind"],
  position: Vec3,
  name: string = kind,
) {
  return {
    id: createId(),
    kind,
    name,
    body: {
      position: { ...position },
      velocity: { x: 0, y: 0, z: 0 },
      grounded: false,
      flying: false,
      fallStart: position.y,
    },
    health: kind === "spirit" ? 16 : kind === "panda" ? 20 : 20,
    home: { ...position },
    goal: { ...position },
    timer: 0,
    cooldown: 0,
    yaw: 0,
    state: "idle",
    trades: 0,
  } satisfies Entity;
}
/** Pick a safe nearby encounter location at the player's current elevation.
 * Unlike a global top-down scan, this works in caves and does not place mobs on
 * building roofs above Chinatown streets. Never generate unloaded chunks here.
 */
export function spiritSpawnSite(world: World, player: Vec3, elapsed: number): Vec3 | null {
  const forbidden = new Set<number>([B.Roof, B.JadeRoof, B.RubyRoof, B.BrownRoof, B.Farmland, B.Lava, B.Water, B.Lantern]);
  const count = 16;
  for (let attempt = 0; attempt < count; attempt++) {
    const angle = elapsed * 0.763 + attempt * Math.PI * (3 - Math.sqrt(5));
    const radius = 12 + (attempt % 4) * 2.5;
    const x = Math.floor(player.x + Math.cos(angle) * radius) + 0.5;
    const z = Math.floor(player.z + Math.sin(angle) * radius) + 0.5;
    if (!world.loaded(x, z)) continue;
    const site = standAt(world, x, z, player.y, false);
    if (!site || Math.abs(site.y - player.y) > 7) continue;
    const below = idOf(world.get(site.x, site.y - 0.08, site.z));
    if (forbidden.has(below)) continue;
    if (distance(site, player) < 10 || distance(site, player) > 25) continue;
    // Reject isolated one-block ledges and rooftop traps. A mob needs at least
    // one genuinely traversable neighboring foot position.
    if (![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz]) => {
      const neighbor = standAt(world, x + dx, z + dz, site.y, false);
      return neighbor && traversable(world, site, neighbor, false);
    })) continue;
    return site;
  }
  return null;
}

export class Entities {
  private entityList: Entity[] = [];
  private actorIndexReady=false;
  get list() { return this.entityList ?? []; }
  set list(value:Entity[]) {
    this.entityList=Array.isArray(value)?value:[];
    if(this.actorIndexReady)this.indexActors();
  }
  drops: Drop[] = [];
  radius = 64;
  elapsed = 0;
  spawnClock = 0;
  wasNight = false;
  navigation:Navigation;
  interactingId = "";
  life?: CityLife;
  private populationInitialized = false;
  private residentEntities: Entity[] = [];
  private otherActors: Entity[] = [];
  private renderActorsBuffer: Entity[] = [];
  private simulatedActorsBuffer: Entity[] = [];
  private entityById = new Map<string, Entity>();
  private pendingRemoval = new Set<Entity>();
  private occupantPositionsBuffer: Vec3[] = [];
  private occupantsDirty = true;
  private localGrid = new Map<number, Entity[]>();
  private localGridPool: Entity[][] = [];
  private threatBuffer: Entity[] = [];
  private simulatedIds = new Set<string>();
  weather = "clear";
  tickMs = 0;
  constructor(
    public world: World,
    data?: Record<string, unknown>,
    time = .24,
  ) {
    this.navigation=new Navigation(world);
    // An explicitly empty entity component has no resident work to plan.
    if (world.landmarkPlan && (!Array.isArray(data?.entities) || data.entities.length > 0)) this.life = new CityLife(world);
    this.populationInitialized = !!this.life || data?.cityLifeVersion === 5;
    const population = this.life?.plan?.residents;
    const create = (r: { id: string; name: string; profession: Profession; home: Vec3; workplace: Vec3 }) => {
      const planned = this.life?.plan?.byId.get(r.id);
      const schedule = planned ? scheduleAt(r.id,r.profession,planned.district,time) : undefined;
      const at = planned?.circuit && schedule?.destination !== "home" ? planned.circuit.points[circuitStart(r.id, time, planned.circuit.points.length)] : !planned || schedule?.destination === "home" ? r.home : schedule?.destination === "public" ? planned.public : r.workplace;
      return { ...spawnEntity("villager", at, r.name), id: r.id, name: r.name, profession: r.profession, home: { ...r.home }, workplace: { ...r.workplace } };
    };
    if (Array.isArray(data?.entities)) {
      this.list = [...data.entities as Entity[]];
    } else this.list = [
      ...(population ?? residents(world.seed, world.cityPlan)).map(create),
      spawnEntity("panda", { x:14,y:21.1,z:-35 }, "Bamboo panda"),
    ];
    if (Array.isArray(data?.drops)) this.drops = data!.drops as Drop[];
    this.indexActors();
  }
  private indexActors() {
    this.residentEntities??=[];this.otherActors??=[];this.entityById??=new Map();this.pendingRemoval??=new Set();
    this.renderActorsBuffer??=[];this.simulatedActorsBuffer??=[];this.occupantPositionsBuffer??=[];
    this.residentEntities.length=0;this.otherActors.length=0;this.entityById.clear();this.pendingRemoval.clear();
    for(const e of this.list){
      this.entityById.set(e.id,e);
      if(e.kind==="villager")this.residentEntities.push(e);else this.otherActors.push(e);
      if(e.health<=0)this.pendingRemoval.add(e);
    }
    if(this.life?.activeActors){
      this.life.activeActors.length=0;
      for(const e of this.residentEntities)if(this.life.active.has(e.id))this.life.activeActors.push(e);
    }
    this.occupantsDirty=true;this.actorIndexReady=true;
  }
  private ensureActorIndexes() {
    if(!this.actorIndexReady||!this.entityById||this.entityById.size!==this.list.length)this.indexActors();
  }
  get residentPopulation() { this.ensureActorIndexes();return this.residentEntities; }
  refreshOccupants() { this.ensureActorIndexes();this.occupantsDirty=true; return this.occupantPositions; }
  get occupantPositions() {
    this.ensureActorIndexes();
    if(this.occupantsDirty){
      this.occupantPositionsBuffer.length=0;
      // Pressure plates must observe the same resident population that is
      // actually represented in the world. Inactive city residents are
      // persistent schedule records, not physical actors for this tick.
      for(const e of this.renderActors())
        this.occupantPositionsBuffer.push(e.body.position);
      // Keep all drop position references; the circuit evaluator checks live
      // chunk residency so an unloaded drop can become physical on chunk load
      // without forcing an occupant-cache rebuild.
      for(const d of this.drops)this.occupantPositionsBuffer.push(d.position);
      this.occupantsDirty=false;
    }
    return this.occupantPositionsBuffer;
  }
  /** Current render set: <=96 detailed residents plus the small encounter set. */
  renderActors() {
    this.ensureActorIndexes();
    const out=this.renderActorsBuffer;out.length=0;
    const residents=this.life?this.life.activeActors:this.residentEntities;
    for(const e of residents)if(e.health>0)out.push(e);
    for(const e of this.otherActors)if(e.health>0)out.push(e);
    return out;
  }
  private simulationActors(player:Vec3) {
    this.ensureActorIndexes();
    return activeSimulationCandidates(this.life?this.life.activeActors:this.residentEntities,this.otherActors,
      this.world,player,this.radius,this.simulatedActorsBuffer);
  }
  private addActor(e:Entity) {
    this.list.push(e);this.otherActors.push(e);this.entityById.set(e.id,e);this.occupantsDirty=true;
  }
  private removeActor(e:Entity) {
    const listIndex=this.list.indexOf(e);if(listIndex>=0)this.list.splice(listIndex,1);
    const otherIndex=this.otherActors.indexOf(e);if(otherIndex>=0)this.otherActors.splice(otherIndex,1);
    if(e.kind==="villager"){
      const residentIndex=this.residentEntities.indexOf(e);if(residentIndex>=0)this.residentEntities.splice(residentIndex,1);
      this.life?.active.delete(e.id);this.life?.states.delete(e.id);
      const activeIndex=this.life?.activeActors.indexOf(e)??-1;if(activeIndex>=0)this.life!.activeActors.splice(activeIndex,1);
    }
    this.entityById.delete(e.id);this.pendingRemoval.delete(e);this.navigation.agents.delete(e.id);this.occupantsDirty=true;
  }
  private flushPendingRemovals() {
    if(!this.pendingRemoval.size)return;
    for(const e of this.pendingRemoval)this.removeActor(e);
    this.pendingRemoval.clear();
  }
  drop(stack: Stack, p: Vec3) { return this.dropMany([stack],p); }
  dropMany(stacks:(Stack|null)[],p:Vec3) {
    const next=this.drops.map(d=>({...d,stack:cloneStack(d.stack)!}));
    for(const stack of stacks) {
      if(!stack)continue;
      const max=item(stack.id)?.stack;
      if(!max||!Number.isInteger(stack.count)||stack.count<=0)return false;
      let count=stack.count;
      for(const d of next)if(sameStack(d.stack,stack)&&distance(d.position,p)<2) {
        const moved=Math.min(count,max-d.stack.count);d.stack.count+=moved;count-=moved;
        if(moved)d.age=0;
      }
      while(count>0) {
        if(next.length>=256)return false;
        const n=Math.min(max,count);count-=n;
        next.push({id:createId(),stack:{...cloneStack(stack)!,count:n},position:{...p},velocity:{x:0,y:2,z:0},age:0});
      }
    }
    this.drops=next;this.occupantsDirty=true;return true;
  }
  tick(
    dt: number,
    player: Vec3,
    inv: Inventory,
    time: number,
    hostile: boolean,
    damage: (n: number) => void,
    pickup: () => void,
    playerInteractive = true,
  ) {
    this.ensureActorIndexes();
    // Keep legacy/test-created Entities instances safe even when constructed
    // without the class constructor; normal instances initialize these eagerly.
    this.localGrid ??= new Map<number,Entity[]>();
    this.localGridPool ??= [];
    this.threatBuffer ??= [];
    this.simulatedIds ??= new Set<string>();
    const tickStarted = performance.now();
    this.elapsed += dt;
    this.spawnClock += dt;
    const pickupTarget = playerInteractive && this.drops.length ? { x: player.x, y: player.y + 0.7, z: player.z } : undefined;
    for (const d of this.drops) {
      d.age += dt;
      if (!this.world.loaded(d.position.x, d.position.z)) continue;
      d.velocity.y = Math.max(-10, d.velocity.y - 10 * dt);
      const ny = d.position.y + d.velocity.y * dt;
      if (block(this.world.get(d.position.x, ny - 0.15, d.position.z)).solid)
        d.velocity.y = 0;
      else d.position.y = ny;
      if (
        pickupTarget &&
        d.age > 0.5 &&
        distance(d.position, pickupTarget) < 2
      ) {
        const remainder = inv.addStack(d.stack);
        if (remainder !== d.stack.count) pickup();
        d.stack.count = remainder;
      }
    }
    const dropCount=this.drops.length;
    let keptDrops=0;
    for(const drop of this.drops)if(drop.stack.count>0&&drop.age<600)this.drops[keptDrops++]=drop;
    if(keptDrops!==dropCount){this.drops.length=keptDrops;this.occupantsDirty=true;}
    const night = time > 0.52;
    if (this.wasNight && !night) { for (const e of this.residentEntities) e.trades = 0; for (const e of this.otherActors) e.trades = 0; }
    this.wasNight = night;
    // Hostiles are temporary encounters, not permanently persistent town NPCs.
    // Inspect only the small non-resident actor set; the 4,080-resident registry
    // is no longer filtered on every 20 Hz simulation tick.
    for(let i=this.otherActors.length-1;i>=0;i--){
      const e=this.otherActors[i];
      if(e.kind==="spirit"&&(e.health<=0||distance(e.body.position,player)>this.radius+20||(!night&&distance(e.body.position,player)>30)))this.removeActor(e);
    }
    let localSpirits=0;
    for(const e of this.otherActors)if(e.kind==="spirit"&&e.health>0&&distance(e.body.position,player)<=this.radius)localSpirits++;
    if (hostile && night && this.spawnClock >= 8 && localSpirits < 5) {
      this.spawnClock = 0;
      const site = spiritSpawnSite(this.world, player, this.elapsed);
      if (site) this.addActor(spawnEntity("spirit", site, "Wandering spirit"));
    }
    const scheduleUpdates=this.life?.metrics.updates??0;
    this.life?.prepare(this.residentEntities, player, time, this.weather === "rain", this.elapsed, this.navigation);
    if(this.life&&this.life.metrics.updates!==scheduleUpdates)this.occupantsDirty=true;
    const simulated = this.simulationActors(player);
    for(const bin of this.localGrid.values()){
      bin.length=0;
      if(this.localGridPool.length<256)this.localGridPool.push(bin);
    }
    this.localGrid.clear();
    for(const e of simulated){
      const p=e.body.position,key=occupancyCellKey(Math.floor(p.x/4),Math.floor(p.z/4));
      let bin=this.localGrid.get(key);
      if(!bin){bin=this.localGridPool.pop()??[];this.localGrid.set(key,bin);}
      bin.push(e);
    }
    const threats=this.threatBuffer;threats.length=0;
    for(const e of simulated)if(e.kind==="spirit")threats.push(e);
    for (const e of simulated) {
      // Another entity (for example a guard) may have killed this entity
      // earlier in the same tick. Dead actors must not steer or attack once.
      if (e.health <= 0) continue;
      const p = e.body.position,
        v = e.body.velocity;
      // `simulationActors()` already applied health, radius and loaded-chunk
      // filters for this tick. No other actor changes this actor's position
      // before its turn, so repeating the same checks here is redundant.
      e.cooldown = Math.max(0, e.cooldown - dt);
      e.timer -= dt;
      if (e.kind === "spirit" && !night) {
        e.health -= dt * 3;
        if (e.health <= 0) { this.pendingRemoval.add(e); continue; }
      }
      let danger:Entity|undefined;
      if(e.profession==='guard')for(const q of threats)if(q.health>0&&distance(p,q.body.position)<12){danger=q;break;}
      const lifeGoal = e.kind === 'villager' ? this.life?.goal(e.id) : undefined;
      if(e.kind==='villager' && e.workplace) {
        e.goal={...(lifeGoal ?? (night ? e.home : e.workplace))};
        e.state=lifeGoal ? (["sleeping","returning home"].includes(this.life!.states.get(e.id)!.activity) ? "returning home" : "walking") : night?'returning home':'going to work';
        if(danger) {e.goal={...danger.body.position};e.state='patrolling';if(distance(p,danger.body.position)<1.8 && e.cooldown<=0 && meleeSightBetween(this.world,p,danger.body.position)){this.applyHit(danger,4,{x:danger.body.position.x-p.x,y:0,z:danger.body.position.z-p.z});e.cooldown=1.2;}}
      }
      const chasing =
          e.kind === "spirit" && hostile && distance(p, player) < 20,
        following =
          playerInteractive &&
          e.kind === "panda" &&
          inv.held?.id === B.Bamboo &&
          distance(p, player) < 10;
      if (chasing || following) {
        e.goal = { ...player };
        e.state = chasing ? "chase" : "follow";
      } else if (e.timer <= 0 && !(e.kind === "villager" && e.workplace)) {
        e.timer = 3 + hash(e.id.length, Math.floor(this.elapsed), 71) * 5;
        const r = e.kind === "villager" ? 6 : 5;
        e.goal = {
          x:
            e.home.x + (hash(Math.floor(this.elapsed), e.home.z, 21) - 0.5) * r,
          y: e.home.y,
          z:
            e.home.z + (hash(e.home.x, Math.floor(this.elapsed), 77) - 0.5) * r,
        };
        e.state = night && e.kind === "villager" ? "return" : "wander";
        if (e.state === "return") e.goal = { ...e.home };
      }
      let next=this.navigation.steer(e.id,p,e.goal,dt,e.kind==='villager',e.kind==='panda'?.9:1.75);
      // A moving player can cross voxel-cell boundaries faster than an A* route is
      // completed. If every target-cell change invalidates the route, a melee
      // hostile can appear to mirror left/right strafing instead of closing the
      // distance. On locally traversable ground, chase directly toward the player
      // every tick and keep A* as the obstacle/terrain fallback.
      if(chasing && distance(p,player)>=1.5) {
        const chaseX=player.x-p.x,chaseZ=player.z-p.z,chaseLen=Math.hypot(chaseX,chaseZ);
        if(chaseLen>1e-5) {
          const step=Math.min(.9,chaseLen);
          const direct=standAt(this.world,p.x+chaseX/chaseLen*step,p.z+chaseZ/chaseLen*step,p.y,false,1.75);
          if(direct && traversable(this.world,p,direct,false,1.75)) next=direct;
        }
      }
      // A stationary player occupies real street space. Dense-city pedestrians
      // take a short supported side step rather than passing through the camera.
      // Only two local probes are allowed; narrow blocked passages wait normally.
      if( e.kind==='villager' && playerInteractive && Math.abs(p.y-player.y)<1.5) {
        const agent=this.navigation.agents.get(e.id);
        for(let skip=0;agent && skip<4 && agent.index<agent.path.length-1;skip++) {
          const occupied=agent.path[agent.index],after=agent.path[agent.index+1];
          if(Math.hypot(occupied.x-player.x,occupied.z-player.z)>=1.1 || !traversable(this.world,p,after))break;
          agent.index++;next=after;
        }
        const ax=p.x-player.x,az=p.z-player.z,d=Math.hypot(ax,az),nx=(next?.x??p.x)-p.x,nz=(next?.z??p.z)-p.z,n=Math.hypot(nx,nz)||1;
        const ahead=-(ax*nx+az*nz)/n,sideDistance=Math.abs(ax*nz-az*nx)/n;
        if(d<.9 || d<1.8 && ahead>0 && sideDistance<.85) {
          const ux=d>.01?ax/d:1,uz=d>.01?az/d:0,preferred=e.id.charCodeAt(e.id.length-1)%2?1:-1;
          let detour:Vec3|null=null;
          for(const sign of [preferred,-preferred]) {
            const outward=d<.9?.75:.2;
            const q=standAt(this.world,p.x+ux*outward-uz*sign*.7,p.z+uz*outward+ux*sign*.7,p.y);
            if(q && Math.hypot(q.x-player.x,q.z-player.z)>Math.min(1.1,d+.1) && traversable(this.world,p,q)){detour=q;break;}
          }
          next=detour;
        }
      }
      e.navStatus=this.navigation.agents.get(e.id)?.status;
      const dx=(next?.x ?? p.x)-p.x,dz=(next?.z ?? p.z)-p.z,len=Math.hypot(dx,dz);
      const speed=chasing?2.4:following?1.9:e.kind==='panda'?.65:e.kind==='villager'?this.life?.plan?.byId.get(e.id)?.circuit?.pace??1.5:1.5;
      if(chasing && distance(p,player)<1.5) {
        v.x=v.z=0;e.state='attack';
        if(e.cooldown<=0 && meleeSightBetween(this.world,p,player,1.4,1.1)){damage(3);e.cooldown=1.2;}
      } else if(next && len>.05 && this.interactingId!==e.id) {
        v.x=dx/len*speed;v.z=dz/len*speed;e.yaw=Math.atan2(dx,dz);
        // Deterministic local yielding prevents two agents pushing indefinitely through one doorway.
        let crowded = false;
        const gx = Math.floor(p.x / 4), gz = Math.floor(p.z / 4);
        for (let dz = -1; dz <= 1 && !crowded; dz++) for (let dx = -1; dx <= 1 && !crowded; dx++) {
          const bin=this.localGrid.get(occupancyCellKey(gx+dx,gz+dz));
          if(!bin)continue;
          for(let i=0;i<bin.length;i++){
            const q=bin[i];
            if(q!==e&&shouldYieldToMovingActor(e.id,p,v,q.id,q.body.position,q.body.velocity)){crowded=true;break;}
          }
        }
        if(crowded) {v.x*=.35;v.z*=.35;}
        if(e.kind==='villager') this.openNearbyDoors(p,next);
      } else {
        v.x=v.z=0;
        if(e.navStatus==='arrived') e.state=lifeGoal ? this.life!.states.get(e.id)!.activity : night?'sleeping':e.profession==='guard'?'on watch':'working';
        if(e.navStatus==='blocked' || e.navStatus==='unloaded') e.state='waiting for route';
        const facing = this.life?.facing(e.id,p,this.elapsed);
        if(facing!==undefined && e.navStatus==='arrived') e.yaw += Math.atan2(Math.sin(facing-e.yaw),Math.cos(facing-e.yaw))*Math.min(1,dt*3);
      }
      // AI steering must not erase combat knockback on the next tick.
      if (e.knockback) {
        v.x += e.knockback.x;
        v.z += e.knockback.z;
        const decay = Math.exp(-10 * dt);
        e.knockback.x *= decay;
        e.knockback.z *= decay;
        if (Math.hypot(e.knockback.x, e.knockback.z) < 0.02) e.knockback = undefined;
      }
      v.y = Math.max(-20, v.y - 20 * dt);
      moveBody(this.world, e.body, dt, false, e.kind === "panda" ? 0.9 : 1.75);
    }
    this.flushPendingRemovals();
    this.simulatedIds.clear();
    for(const e of simulated)if(e.health>0)this.simulatedIds.add(e.id);
    this.navigation.removeMissing(this.simulatedIds);
    this.navigation.tick();
    this.tickMs = performance.now() - tickStarted;
  }
  openNearbyDoors(p:Vec3,next:Vec3) {
    for(let y=Math.floor(p.y);y<=Math.floor(p.y)+1;y++) for(let z=Math.floor(next.z)-1;z<=Math.floor(next.z)+1;z++) for(let x=Math.floor(next.x)-1;x<=Math.floor(next.x)+1;x++) {
      const v=this.world.get(x,y,z),s=stateOf(v);
      if(idOf(v)!==B.Door || s&4 || Math.hypot(p.x-x-.5,p.z-z-.5)>1.6)continue;
      this.world.set(x,y,z,packed(B.Door,s|4));
      const oy=y+(s&8?-1:1),ov=this.world.get(x,oy,z);
      if(idOf(ov)===B.Door)this.world.set(x,oy,z,packed(B.Door,stateOf(ov)|4));
    }
  }
  canInteractWith(e: Entity, origin: Vec3, reach = 5) {
    return e.health > 0 &&
      this.renderActors().includes(e) &&
      this.world.loaded(e.body.position.x,e.body.position.z) &&
      distance(e.body.position,origin) < reach;
  }
  target(origin: Vec3, dir: Vec3, reach = 4) {
    let best: Entity | null = null;
    let nearest = reach;
    // Conservative swept-ray bounds reject distant residents before a chunk
    // lookup or hitbox allocation. Exact hitboxes and tie order stay unchanged.
    const maxX = Math.abs(dir.x * reach) + .5, maxY = Math.abs(dir.y * reach) + 1.8, maxZ = Math.abs(dir.z * reach) + .5;
    // Target only actors eligible for the current render/simulation set.
    // The full resident registry also contains inactive, non-physical schedule
    // records that must not intercept interaction or combat rays.
    for (const e of this.renderActors()) {
      const p = e.body.position;
      if (e.health <= 0 || Math.abs(p.x-origin.x) > maxX || Math.abs(p.y-origin.y) > maxY || Math.abs(p.z-origin.z) > maxZ || !this.world.loaded(p.x, p.z)) continue;
      const halfWidth = e.kind === "panda" ? 0.47 : 0.36;
      const height = e.kind === "panda" ? 1.23 : 1.76;
      const hit = rayBoxDistance(origin, dir,
        { x: p.x-halfWidth, y:p.y, z:p.z-halfWidth },
        { x: p.x+halfWidth, y:p.y+height, z:p.z+halfWidth });
      if (hit !== null && hit <= nearest) { best = e; nearest = hit; }
    }
    return best;
  }
  /** Exactly-once death resolution, with capacity validation before changing HP.
   * If nearby drops are saturated, leave the mob alive for a later attempt.
   */
  applyHit(e: Entity, amount: number, dir: Vec3): EntityHitResult {
    if (!this.list.includes(e) || e.health <= 0 || !Number.isFinite(amount) || amount <= 0)
      return { status: "invalid", damage: 0 };
    const inflicted = Math.min(e.health, amount);
    const killed = amount >= e.health;
    if (killed && !this.drop({ id: e.kind === "spirit" ? 103 : 108,
      count: e.kind === "spirit" ? 1 : 2 },
      { ...e.body.position, y: e.body.position.y + 0.5 }))
      return { status: "blocked", damage: 0 };
    e.health = Math.max(0, e.health - amount);
    if(killed)this.pendingRemoval?.add(e);
    const len = Math.hypot(dir.x, dir.z);
    if (len > 1e-5) {
      const strength = 3.0;
      const x = (dir.x / len) * strength, z = (dir.z / len) * strength;
      e.knockback = { x, y: 0, z };
      e.body.velocity.x += x;
      e.body.velocity.z += z;
    }
    e.body.velocity.y = Math.max(e.body.velocity.y, 2.5);
    return { status: killed ? "killed" : "hit", damage: inflicted };
  }
  /** Backward-compatible boolean method for existing AI and test callers. */
  attack(e: Entity, damage: number, dir: Vec3) {
    return this.applyHit(e, damage, dir).status === "killed";
  }
  dispose() {
    this.life?.dispose(); this.life = undefined; this.navigation.agents.clear(); this.list = []; this.drops = [];
    this.residentEntities.length=0;this.otherActors.length=0;this.renderActorsBuffer.length=0;this.simulatedActorsBuffer.length=0;
    this.entityById.clear();this.pendingRemoval.clear();this.occupantPositionsBuffer.length=0;this.occupantsDirty=true;
    for(const bin of this.localGrid.values())bin.length=0;
    this.localGrid.clear();this.localGridPool.length=0;this.threatBuffer.length=0;this.simulatedIds.clear();
  }
  serialize() {
    return {
      ...(this.populationInitialized ? { cityLifeVersion: 5 } : {}),
      entities: structuredClone(this.list),
      drops: structuredClone(this.drops),
    };
  }
}
