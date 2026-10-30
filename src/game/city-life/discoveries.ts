import type { Vec3 } from "../../core/coords";
import type { World } from "../../world/world";
import { journalPlaces } from "./travel";
import { standAt } from "../navigation/pathfinder";

export type Discovery = { id: string; title: string; description: string; position: Vec3; radius: number };
const cell = (p: Vec3) => `${Math.floor(p.x / 32)},${Math.floor(p.z / 32)}`;
export function discoveryRegistry(world: World): Discovery[] {
  if(world.generatorVersion<6)return [];
  return journalPlaces(world).map(d=>({id:d.discoveryId,title:d.title,description:d.description,
    position:d.discoveryPosition,radius:d.discoveryRadius}));
}
/** The existing achievements component is the sole durable set. No reward
 * entities or inventory mutations: discovery count and the journal are rewards. */
export class Discoveries {
  entries: Discovery[];
  private index = new Map<string, Discovery[]>();
  constructor(private world: World | undefined, private recorded: Set<string>) {
    this.entries = world ? discoveryRegistry(world) : [];
    for (const d of this.entries) { const list = this.index.get(cell(d.position)) ?? []; list.push(d); this.index.set(cell(d.position), list); }
  }
  visit(position: Vec3, walking: boolean): Discovery | undefined {
    const world = this.world;
    if (!world || !walking || this.recorded.size >= 256) return;
    for (let z = -1; z <= 1; z++) for (let x = -1; x <= 1; x++) for (const d of this.index.get(`${Math.floor(position.x / 32) + x},${Math.floor(position.z / 32) + z}`) ?? []) {
      if (this.recorded.has(d.id) || Math.abs(position.y - d.position.y) > 1.2 || Math.hypot(position.x - d.position.x, position.z - d.position.z) > d.radius) continue;
      const floor = standAt(world, position.x, position.z, position.y, false);
      if (!floor || Math.abs(floor.y - position.y) > .1) continue;
      this.recorded.add(d.id); return d;
    }
  }
  has(id: string) { return this.recorded.has(id); }
  get count() { return this.entries.filter(d => this.recorded.has(d.id)).length; }
  dispose() { this.world = undefined; this.index.clear(); this.entries = []; this.recorded = new Set(); }
}
