import type { Entity } from "../entities";
import type { Vec3 } from "../../core/coords";
import { distance } from "../../core/coords";

/** Reference predicate retained for parity tests and legacy callers. */
export function simulationCandidates(list: Entity[], world: {loaded(x:number,z:number):boolean}, player: Vec3, radius: number, active?: ReadonlySet<string>) {
  return list.filter(e => e.health > 0 && (e.kind !== "villager" || !active || active.has(e.id)) &&
    world.loaded(e.body.position.x, e.body.position.z) && distance(e.body.position, player) <= radius);
}

/** Hot path for the current city-life architecture. `activeResidents` is
 * already bounded (normally <=96) and kept in population order by CityLife;
 * `otherActors` contains only the small panda/spirit encounter set. */
export function activeSimulationCandidates(activeResidents: readonly Entity[], otherActors: readonly Entity[],
  world: {loaded(x:number,z:number):boolean}, player: Vec3, radius: number, out: Entity[] = []) {
  out.length=0;
  const append=(e:Entity)=>{
    if(e.health>0&&distance(e.body.position,player)<=radius&&world.loaded(e.body.position.x,e.body.position.z))out.push(e);
  };
  for(const e of activeResidents)append(e);
  for(const e of otherActors)append(e);
  return out;
}

/** Return the exact best K entries without sorting the entire input.
 * The output array is reused as the bounded max-heap and sorted in place.
 * `items` and `out` must be different arrays. */
export function selectTopKInto<T>(items: readonly T[], limit: number, compare: (a: T, b: T) => number, out: T[]): T[] {
  out.length = 0;
  const count = Number.isFinite(limit) ? Math.max(0, Math.min(items.length, Math.floor(limit))) : 0;
  if (count === 0) return out;
  if (count === items.length) {
    for (const item of items) out.push(item);
    out.sort(compare);
    return out;
  }
  const siftDown = (start: number) => {
    let i = start;
    for (;;) {
      const left = i * 2 + 1;
      if (left >= out.length) break;
      const right = left + 1;
      let worst = left;
      if (right < out.length && compare(out[right], out[left]) > 0) worst = right;
      if (compare(out[worst], out[i]) <= 0) break;
      const value = out[i]; out[i] = out[worst]; out[worst] = value;
      i = worst;
    }
  };
  const siftUp = (start: number) => {
    let i = start;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (compare(out[i], out[parent]) <= 0) break;
      const value = out[i]; out[i] = out[parent]; out[parent] = value;
      i = parent;
    }
  };
  for (const item of items) {
    if (out.length < count) { out.push(item); siftUp(out.length - 1); }
    else if (compare(item, out[0]) < 0) { out[0] = item; siftDown(0); }
  }
  out.sort(compare);
  return out;
}

/** Allocation-friendly convenience wrapper retained for existing callers. */
export function selectTopK<T>(items: readonly T[], limit: number, compare: (a: T, b: T) => number): T[] {
  return selectTopKInto(items, limit, compare, []);
}
