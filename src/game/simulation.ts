import { Automation, Hopper } from "./automation";
import { World } from "../world/world";
import { B, block } from "../world/blocks";
import {
  blockKey,
  idOf,
  stateOf,
  packed,
  Vec3,
  MIN_Y, MAX_Y,
  chunkCoord,
} from "../core/coords";
import { Stack } from "./inventory";
import { hash } from "../world/noise";
import { Brewer, newBrewer, brewingWater, tickBrewer } from "./brewing";
export type Furnace = {
  slots: (Stack | null)[];
  burn: number;
  progress: number;
  recipe: number;
};
export const SMELTING: Record<number, number> = {
  [B.Iron]: 102,
  [B.Gold]: 106,
  [108]: 110,
  [B.Sand]: B.Glass,
  [B.Dirt]: B.Terracotta,
};
export const FUEL: Record<number, number> = {
  101: 32,
  [B.Log]: 8,
  [B.Planks]: 8,
  [B.Bamboo]: 2,
  104: 3,
};
export function tickFurnace(f: Furnace, dt: number) {
  const input = f.slots[0],
    fuel = f.slots[1],
    output = f.slots[2],
    result = input ? SMELTING[input.id] : undefined;
  const can =
    !!result && (!output || (output.id === result && output.count < 64));
  if (f.burn <= 0 && can && fuel && FUEL[fuel.id]) {
    f.burn = FUEL[fuel.id];
    if (--fuel.count <= 0) f.slots[1] = null;
  }
  if (f.burn > 0) {
    f.burn = Math.max(0, f.burn - dt);
    if (can && input) {
      if (f.recipe !== input.id) {
        f.progress = 0;
        f.recipe = input.id;
      }
      f.progress += dt;
      if (f.progress >= 4) {
        f.progress -= 4;
        if (output) output.count++;
        else f.slots[2] = { id: result!, count: 1 };
        if (--input.count === 0) f.slots[0] = null;
        return true;
      }
    } else f.progress = 0;
  } else f.progress = 0;
  return false;
}
const neighbors = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];
const specialIds = new Set<number>([
  B.Rice,
  B.Tea,
  B.Switch,
  B.Wire,
  B.Lamp,
  B.Door,
  B.Lantern,
  B.Furnace,
  B.Hopper,
  B.Timer,
  B.Plate,
]);
export class Simulation {
  automation: Automation;
  power = new Map<string,number>();
  occupants: Vec3[] = [];
  furnaces: Record<string, Furnace> = {};
  brewers: Record<string, Brewer> = {};
  specials = new Map<string, number>();
  indexed = new Map<string, number>();
  queue = new Set<string>();
  radius = 64;
  elapsed = 0;
  weather = "clear";
  weatherTimer = 180;
  cropTimer = 0;
  tickNo = 0;
  constructor(
    public world: World,
    data?: Record<string, unknown>,
  ) {
    if (data) {
      this.furnaces = (data.furnaces as Record<string, Furnace>) ?? {};
      this.brewers = structuredClone((data.brewers as Record<string,Brewer>) ?? {});
      this.weather = String(data.weather ?? "clear");
      this.weatherTimer = Number(data.weatherTimer ?? 180);
    }
    this.elapsed=Number(data?.elapsed??0);
    this.tickNo=Number(data?.tickNo??0);
    this.cropTimer=Number(data?.cropTimer??0);
    this.automation = new Automation(world,this.furnaces,data?.hoppers as Record<string,Hopper>|undefined);
    for(const key of (data?.pendingTicks as string[]|undefined)??[])this.queue.add(key);
    for (const [key, v] of world.edits)
      if ([B.Water, B.Lava, B.Sand, B.Gravel].includes(idOf(v) as never)) {
        const [x, y, z] = key.split(",").map(Number);
        this.changed(x, y, z);
      }
  }
  indexChunks() {
    for (const [key, c] of this.world.chunks) {
      if (this.indexed.get(key) === c.revision) continue;
      this.indexed.set(key, c.revision);
      for (const k of this.specials.keys()) {
        const [x, , z] = k.split(",").map(Number);
        if (chunkCoord(x) === c.cx && chunkCoord(z) === c.cz)
          this.specials.delete(k);
      }
      for (const [sy, section] of c.blocks.sections) for (let i=0;i<4096;i++) {
        if(typeof section.values === "number" && !specialIds.has(idOf(section.values))) break;
        const v=section.get(i);
        if(!specialIds.has(idOf(v))) continue;
        const y=sy*16+Math.floor(i/256), z=Math.floor(i%256/16), x=i%16;
        const specialKey=blockKey(c.cx*16+x,y,c.cz*16+z);
        this.specials.set(specialKey,v);
        if(idOf(v)===B.Hopper)this.automation.hopper(specialKey);
      }
    }
    for (const key of this.indexed.keys())
      if (!this.world.chunks.has(key)) {
        this.indexed.delete(key);
        const [cx, cz] = key.split(",").map(Number);
        for (const k of this.specials.keys()) {
          const [x, , z] = k.split(",").map(Number);
          if (chunkCoord(x) === cx && chunkCoord(z) === cz)
            this.specials.delete(k);
        }
      }
  }
  changed(x: number, y: number, z: number) {
    if (![x, y, z].every(Number.isInteger)) return;
    for (const [dx, dy, dz] of [[0, 0, 0], ...neighbors]) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      // Persistable work only: a save can run before updates() discards a
      // bedrock/out-of-world neighbor of an edit at the build limits.
      if (ny > MIN_Y && ny <= MAX_Y && Math.abs(nx) <= 1e7 && Math.abs(nz) <= 1e7)
        this.queue.add(blockKey(nx, ny, nz));
    }
  }
  furnace(key: string) {
    return (this.furnaces[key] ??= {
      slots: [null, null, null],
      burn: 0,
      progress: 0,
      recipe: 0,
    });
  }
  brewer(key: string) { return this.brewers[key] ??= newBrewer(); }
  tick(dt: number, player: Vec3, playerTriggers = true) {
    this.elapsed += dt;
    this.tickNo++;
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      this.weather = this.weather === "clear" ? "rain" : "clear";
      this.weatherTimer = this.weather === "rain" ? 90 : 180;
    }
    if (this.tickNo % 10 === 0) this.indexChunks();
    for(const [key,b] of Object.entries(this.brewers)) {
      const [x,y,z]=key.split(",").map(Number);
      if(this.world.loaded(x,z) && Math.hypot(x-player.x,z-player.z)<=this.radius && idOf(this.world.get(x,y,z))===B.Apothecary)
        tickBrewer(b,dt,brewingWater(this.world,x,y,z));
    }
    for (const [key, f] of Object.entries(this.furnaces)) {
      const [x, y, z] = key.split(",").map(Number);
      if (
        this.world.loaded(x, z) && Math.hypot(x-player.x,z-player.z)<=this.radius &&
        idOf(this.world.get(x, y, z)) === B.Furnace
      ) {
        tickFurnace(f, dt);
        const v = packed(B.Furnace, f.burn > 0 ? 1 : 0);
        if (this.world.get(x, y, z) !== v) this.world.set(x, y, z, v);
      }
    }
    if (this.tickNo % 4 === 0) {
      this.circuits(playerTriggers ? player : undefined);
      this.updates(64);
    }
    this.automation.tick(dt,player,this.radius,(x,y,z)=>this.powered(x,y,z));
    this.cropTimer += dt;
    if (this.cropTimer >= 12) {
      this.cropTimer = 0;
      for (const [key, v] of this.specials) {
        if (idOf(v) !== B.Rice || stateOf(v) >= 3) continue;
        const [x, y, z] = key.split(",").map(Number);
        if (Math.hypot(x - player.x, z - player.z) > this.radius) continue;
        let wet = this.weather === "rain";
        for (let dx = -4; dx <= 4; dx++)
          for (let dz = -4; dz <= 4; dz++)
            if (idOf(this.world.get(x + dx, y - 1, z + dz)) === B.Water)
              wet = true;
        if (
          wet &&
          this.world.get(x, y + 1, z) === 0 &&
          hash(x, z, Math.floor(this.elapsed)) > 0.3
        )
          this.world.set(x, y, z, packed(B.Rice, stateOf(v) + 1));
      }
    }
  }
  powered(x:number,y:number,z:number) {
    return neighbors.some(([dx,dy,dz])=>{
      const v=this.world.get(x+dx,y+dy,z+dz),id=idOf(v);
      return id===B.Wire ? stateOf(v)>0 : [B.Switch,B.Timer,B.Plate].includes(id as never) && !!(stateOf(v)&1);
    });
  }
  circuits(player?:Vec3) {
    for(const [key,old] of this.specials) {
      const [x,y,z]=key.split(",").map(Number),v=this.world.get(x,y,z),id=idOf(v);
      if(id!==B.Timer && id!==B.Plate)continue;
      let on=false;
      if(id===B.Timer)on=!!(stateOf(v)&2) && Math.floor(this.elapsed/[.5,1,2,4][(stateOf(v)>>2)&3])%2===0;
      else on=[...(player?[player]:[]),...this.occupants].some(p=>Math.abs(p.x-x-.5)<.8 && Math.abs(p.z-z-.5)<.8 && p.y>=y-.1 && p.y<=y+1.8);
      const next=packed(id,(stateOf(v)&~1)|(on?1:0));
      if(next!==v)this.world.set(x,y,z,next);
      this.specials.set(key,next);
    }
    const power = new Map<string, number>(),
      queue: [string, number][] = [];
    for (const [key] of this.specials) {
      const v=this.world.get(...key.split(",").map(Number) as [number,number,number]);
      if ([B.Switch,B.Timer,B.Plate].includes(idOf(v) as never) && stateOf(v) & 1) {
        power.set(key, 15);
        queue.push([key, 15]);
      }
    }
    for (let i = 0; i < queue.length && i < 4096; i++) {
      const [key, p] = queue[i];
      if (p <= 1) continue;
      const [x, y, z] = key.split(",").map(Number);
      for (const [dx, dy, dz] of neighbors) {
        const k = blockKey(x + dx, y + dy, z + dz),
          v = this.world.get(x + dx, y + dy, z + dz);
        if (idOf(v) !== B.Wire || p - 1 <= (power.get(k) ?? 0)) continue;
        power.set(k, p - 1);
        queue.push([k, p - 1]);
      }
    }
    this.power=power;
    for (const [key, indexed] of this.specials) {
      const [bx, by, bz] = key.split(",").map(Number);
      const v = this.world.get(bx, by, bz),
        id = idOf(v);
      if (![B.Wire, B.Door, B.Lamp].includes(id as never)) continue;
      const [x, y, z] = key.split(",").map(Number);
      let p = power.get(key) ?? 0,
        connected = false;
      for (const [dx, dy, dz] of neighbors) {
        const k = blockKey(x + dx, y + dy, z + dz),
          neighborId = idOf(this.world.get(x + dx, y + dy, z + dz));
        if ([B.Wire,B.Switch,B.Timer,B.Plate].includes(neighborId as never)) connected = true;
        p = Math.max(p, power.get(k) ?? 0);
      }
      let next = v;
      if (id === B.Wire) next = packed(id, power.get(key) ?? 0);
      if (id === B.Lamp) next = packed(id, p > 0 ? 1 : 0);
      if (id === B.Door) {
        const otherY = y + (stateOf(v) & 8 ? -1 : 1),
          other = this.world.get(x, otherY, z);
        if (idOf(other) === B.Door)
          for (const [dx, dy, dz] of neighbors) {
            const k = blockKey(x + dx, otherY + dy, z + dz),
              nid = idOf(this.world.get(x + dx, otherY + dy, z + dz));
            if ([B.Wire,B.Switch,B.Timer,B.Plate].includes(nid as never)) connected = true;
            p = Math.max(p, power.get(k) ?? 0);
          }
        if (connected)
          next = packed(id, p > 0 ? stateOf(v) | 4 : stateOf(v) & ~4);
      }
      if (next !== v) {
        this.world.set(x, y, z, next);
        this.specials.set(key, next);
      }
    }
  }
  updates(budget: number) {
    if (!Number.isFinite(budget) || budget <= 0) return;
    // Snapshot only the bounded work budget. A newly enqueued sand/fluid
    // neighbor must wait for the next simulation tick rather than cascading
    // repeatedly in this same pass. Avoid cloning the entire update queue.
    const pending: string[] = [];
    for (const key of this.queue) {
      pending.push(key);
      if (pending.length >= budget) break;
    }
    const movedInto = new Set<string>();
    for (const key of pending) {
      this.queue.delete(key);
      if (movedInto.has(key)) { this.queue.add(key); continue; }
      const [x, y, z] = key.split(",").map(Number);
      if (y <= MIN_Y || y > MAX_Y) continue;
      if(!this.world.loaded(x,z)) {this.queue.add(key);continue;}
      const v = this.world.get(x, y, z),
        id = idOf(v),
        below = this.world.get(x, y - 1, z);
      if (
        (id === B.Sand || id === B.Gravel) &&
        y > MIN_Y+1 &&
        (below === 0 || idOf(below) === B.Water)
      ) {
        this.world.set(x, y, z, 0);
        this.world.set(x, y - 1, z, v);
        movedInto.add(blockKey(x, y - 1, z));
        this.changed(x, y - 1, z);
        this.changed(x, y, z);
        continue;
      }
      if (id === B.Water || id === B.Lava) {
        let transform = false;
        for (const [dx, dy, dz] of neighbors)
          if (
            idOf(this.world.get(x + dx, y + dy, z + dz)) ===
            (id === B.Water ? B.Lava : B.Water)
          ) {
            if (id === B.Lava) {
              this.world.set(x, y, z, B.Obsidian);
              transform = true;
            } else {
              this.world.set(x + dx, y + dy, z + dz, B.Stone);
            }
          }
        if (transform) continue;
        const level = stateOf(v);
        if (level > 0) {
          let required = 8;
          if (idOf(this.world.get(x, y + 1, z)) === id) required = 1;
          for (const [dx, , dz] of [
            [1, 0, 0],
            [-1, 0, 0],
            [0, 0, 1],
            [0, 0, -1],
          ]) {
            const n = this.world.get(x + dx, y, z + dz);
            if (idOf(n) === id) required = Math.min(required, stateOf(n) + 1);
          }
          if (required > 7) {
            this.world.set(x, y, z, 0);
            this.changed(x, y, z);
            continue;
          }
          if (required !== level) {
            this.world.set(x, y, z, packed(id, required));
            this.changed(x, y, z);
            continue;
          }
        }
        if (y > MIN_Y+1 && below === 0) {
          this.world.set(x, y - 1, z, packed(id, 1));
          this.changed(x, y - 1, z);
        } else if (block(below).solid && level < 7) {
          for (const [dx, dz] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ])
            if (
              this.world.get(x + dx, y, z + dz) === 0 &&
              this.world.loaded(x + dx, z + dz)
            ) {
              this.world.set(x + dx, y, z + dz, packed(id, level + 1));
              this.changed(x + dx, y, z + dz);
            }
        }
      }
    }
  }
  serialize() {
    return {
      furnaces: structuredClone(this.furnaces),
      brewers: structuredClone(this.brewers),
      hoppers: structuredClone(this.automation.hoppers),
      elapsed:this.elapsed,
      tickNo:this.tickNo,
      cropTimer:this.cropTimer,
      pendingTicks:[...this.queue],
      weather: this.weather,
      weatherTimer: this.weatherTimer,
    };
  }
}
