// Frozen actor selection and candidate predicate for exact parity comparison.
import type { Entity } from "../../src/game/entities";
import type { Vec3 } from "../../src/core/coords";
import { distance } from "../../src/core/coords";
import { rayBoxDistance } from "../../src/game/combat";
export const reference = {
  target(this: {list:Entity[];world:{loaded(x:number,z:number):boolean}}, origin: Vec3, dir: Vec3, reach = 4) {
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
};
export function candidates(list:Entity[],world:{loaded(x:number,z:number):boolean},player:Vec3,radius:number,active?:ReadonlySet<string>) {
  const life=active?{active}:undefined;
  return list.filter(e => e.health > 0 && world.loaded(e.body.position.x, e.body.position.z) &&
    distance(e.body.position, player) <= radius && (e.kind !== "villager" || !life || life.active.has(e.id)));
}
