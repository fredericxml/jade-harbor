import type { Vec3 } from "../core/coords";
import { raycast } from "../player/raycast";
import { B, block } from "../world/blocks";

/** Intersect the aim ray with a *visible* entity's axis-aligned gameplay hitbox.
 * The result is the first contact distance, not the entity-center distance.
 */
export function rayBoxDistance(origin: Vec3, direction: Vec3, min: Vec3, max: Vec3): number | null {
  let enter = 0;
  let exit = Number.POSITIVE_INFINITY;
  for (const axis of ["x", "y", "z"] as const) {
    const o = origin[axis], d = direction[axis];
    if (Math.abs(d) < 1e-9) {
      if (o < min[axis] || o > max[axis]) return null;
      continue;
    }
    const near = (min[axis] - o) / d;
    const far = (max[axis] - o) / d;
    enter = Math.max(enter, Math.min(near, far));
    exit = Math.min(exit, Math.max(near, far));
    if (enter > exit) return null;
  }
  return exit >= 0 ? enter : null;
}

/** Voxel obstruction check: opaque/solid surfaces stop melee hits, including
 * guard strikes and spirit attacks. Air and water do not obstruct visibility.
 */
export function clearMeleeSight(
  world: { get(x: number, y: number, z: number): number },
  from: Vec3,
  to: Vec3,
): boolean {
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const length = Math.hypot(dx, dy, dz);
  if (length < 1e-6) return true;
  const direction = { x: dx / length, y: dy / length, z: dz / length };
  // The target surface itself is allowed. Only blocks with a real collision
  // surface obstruct melee; decorative wires, lanterns and plants do not.
  const solidOnly = (x: number, y: number, z: number) => {
    const value = world.get(x,y,z);
    return block(value).solid ? value : B.Air;
  };
  return raycast(solidOnly, from, direction, Math.max(0, length - 0.06)) === null;
}

/** Approximate eye/chest visibility for biped and animal entities. */
export function meleeSightBetween(
  world: { get(x: number, y: number, z: number): number },
  a: Vec3, b: Vec3, aEye = 1.4, bChest = 1.0,
): boolean {
  return clearMeleeSight(world,
    { x: a.x, y: a.y + aEye, z: a.z },
    { x: b.x, y: b.y + bChest, z: b.z },
  );
}
