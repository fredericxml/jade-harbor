import { cloneStack, sameStack } from "./stack";
import { item } from "./items";
import { World } from "../world/world";
import { Vec3, distance, idOf, stateOf, packed } from "../core/coords";
import { block, B } from "../world/blocks";
import { Body, moveBody, collides } from "../player/physics";
import { Inventory, Stack } from "./inventory";
import { Navigation, standAt, traversable } from "./navigation/pathfinder";
import { Profession, PROFESSIONS, residents } from "./professions";
import { hash } from "../world/noise";
import { meleeSightBetween, rayBoxDistance } from "./combat";
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
    id: crypto.randomUUID(),
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
  list: Entity[] = [];
  drops: Drop[] = [];
  radius = 64;
  elapsed = 0;
  spawnClock = 0;
  wasNight = false;
  navigation:Navigation;
  interactingId = "";
  constructor(
    public world: World,
    data?: Record<string, unknown>,
  ) {
    this.navigation=new Navigation(world);
    if (Array.isArray(data?.entities)) this.list = data!.entities as Entity[];
    else this.list=[
      ...residents(world.seed).map(r=>({...spawnEntity("villager",r.home,r.name),...r})),
      spawnEntity("panda",{x:14,y:21.1,z:-35},"Bamboo panda"),
    ];
    if (Array.isArray(data?.drops)) this.drops = data!.drops as Drop[];
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
        next.push({id:crypto.randomUUID(),stack:{...cloneStack(stack)!,count:n},position:{...p},velocity:{x:0,y:2,z:0},age:0});
      }
    }
    this.drops=next;return true;
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
    this.elapsed += dt;
    this.spawnClock += dt;
    for (const d of this.drops) {
      d.age += dt;
      if (!this.world.loaded(d.position.x, d.position.z)) continue;
      d.velocity.y = Math.max(-10, d.velocity.y - 10 * dt);
      const ny = d.position.y + d.velocity.y * dt;
      if (block(this.world.get(d.position.x, ny - 0.15, d.position.z)).solid)
        d.velocity.y = 0;
      else d.position.y = ny;
      if (
        playerInteractive &&
        d.age > 0.5 &&
        distance(d.position, { ...player, y: player.y + 0.7 }) < 2
      ) {
        const remainder = inv.addStack(d.stack);
        if (remainder !== d.stack.count) pickup();
        d.stack.count = remainder;
      }
    }
    this.drops = this.drops.filter((d) => d.stack.count > 0 && d.age < 600);
    const night = time > 0.52;
    if (this.wasNight && !night) for (const e of this.list) e.trades = 0;
    this.wasNight = night;
    // Hostiles are temporary encounters, not permanently persistent town NPCs.
    // Unloaded/distant spirits must never occupy the local population cap.
    this.list = this.list.filter((e) =>
      e.kind !== "spirit" ||
      (e.health > 0 && distance(e.body.position, player) <= this.radius + 20 &&
        (night || distance(e.body.position, player) <= 30)),
    );
    const localSpirits = this.list.filter((e) =>
      e.kind === "spirit" && e.health > 0 &&
      distance(e.body.position, player) <= this.radius,
    ).length;
    if (hostile && night && this.spawnClock >= 8 && localSpirits < 5) {
      this.spawnClock = 0;
      const site = spiritSpawnSite(this.world, player, this.elapsed);
      if (site) this.list.push(spawnEntity("spirit", site, "Wandering spirit"));
    }
    for (const e of this.list) {
      // Another entity (for example a guard) may have killed this entity
      // earlier in the same tick. Dead actors must not steer or attack once.
      if (e.health <= 0) continue;
      const p = e.body.position,
        v = e.body.velocity;
      if (!this.world.loaded(p.x, p.z) || distance(p, player) > this.radius) continue;
      e.cooldown = Math.max(0, e.cooldown - dt);
      e.timer -= dt;
      if (e.kind === "spirit" && !night) {
        e.health -= dt * 3;
        if (e.health <= 0) continue;
      }
      const danger=e.profession==='guard'?this.list.find(q=>q.kind==='spirit' && q.health>0 && distance(p,q.body.position)<12):undefined;
      if(e.kind==='villager' && e.workplace) {
        e.goal={...(night ? e.home : e.workplace)};
        e.state=night?'returning home':'going to work';
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
      e.navStatus=this.navigation.agents.get(e.id)?.status;
      const dx=(next?.x ?? p.x)-p.x,dz=(next?.z ?? p.z)-p.z,len=Math.hypot(dx,dz);
      const speed=chasing?2.4:following?1.9:e.kind==='panda'?.65:1.5;
      if(chasing && distance(p,player)<1.5) {
        v.x=v.z=0;e.state='attack';
        if(e.cooldown<=0 && meleeSightBetween(this.world,p,player,1.4,1.1)){damage(3);e.cooldown=1.2;}
      } else if(next && len>.05 && this.interactingId!==e.id) {
        v.x=dx/len*speed;v.z=dz/len*speed;e.yaw=Math.atan2(dx,dz);
        // Deterministic local yielding prevents two agents pushing indefinitely through one doorway.
        const crowded=this.list.some(q=>q!==e && q.id<e.id && Math.hypot(q.body.position.x-(p.x+v.x*.4),q.body.position.z-(p.z+v.z*.4))<.55 && Math.abs(q.body.position.y-p.y)<1);
        if(crowded) {v.x*=.1;v.z*=.1;}
        if(e.kind==='villager') this.openNearbyDoors(p,next);
      } else {
        v.x=v.z=0;
        if(e.navStatus==='arrived') e.state=night?'sleeping':e.profession==='guard'?'on watch':'working';
        if(e.navStatus==='blocked' || e.navStatus==='unloaded') e.state='waiting for route';
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
    this.list = this.list.filter((e) => e.health > 0);
    this.navigation.removeMissing(new Set(this.list.map(e=>e.id)));
    this.navigation.tick();
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
  target(origin: Vec3, dir: Vec3, reach = 4) {
    let best: Entity | null = null;
    let nearest = reach;
    for (const e of this.list) {
      if (e.health <= 0 || !this.world.loaded(e.body.position.x, e.body.position.z)) continue;
      const p = e.body.position;
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
  serialize() {
    return {
      entities: structuredClone(this.list),
      drops: structuredClone(this.drops),
    };
  }
}
