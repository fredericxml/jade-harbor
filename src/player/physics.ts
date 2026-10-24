import { Vec3, idOf, MIN_Y, MAX_Y } from "../core/coords";
import { block, boxes, B } from "../world/blocks";
export type CollisionWorld = {
  get: (x: number, y: number, z: number) => number;
  loaded?: (x: number, z: number) => boolean;
};
export type Body = {
  position: Vec3;
  velocity: Vec3;
  grounded: boolean;
  flying: boolean;
  fallStart: number;
};
export function collides(
  world: CollisionWorld,
  p: Vec3,
  height = 1.75,
  radius = 0.29,
) {
  for (
    let y = Math.floor(p.y + 0.001);
    y <= Math.floor(p.y + height - 0.001);
    y++
  )
    for (let z = Math.floor(p.z - radius); z <= Math.floor(p.z + radius); z++)
      for (
        let x = Math.floor(p.x - radius);
        x <= Math.floor(p.x + radius);
        x++
      ) {
        const v = world.get(x, y, z);
        if (!block(v).solid) continue;
        for (const [a, b, c, d, e, f] of boxes(v))
          if (
            p.x + radius > x + a + 0.001 &&
            p.x - radius < x + d - 0.001 &&
            p.y + height > y + b + 0.001 &&
            p.y < y + e - 0.001 &&
            p.z + radius > z + c + 0.001 &&
            p.z - radius < z + f - 0.001
          )
            return true;
      }
  return false;
}
export function moveBody(
  world: CollisionWorld,
  body: Body,
  dt: number,
  noclip = false,
  height = 1.75,
) {
  const p = body.position,
    v = body.velocity;
  if (world.loaded && !world.loaded(p.x, p.z)) return 0;
  let fall = 0;
  const canStep = body.grounded && !body.flying && !noclip;
  // A single simulated movement may have many substeps. Limit the total
  // automatic step height across *all* of them, including both X and Z.
  let stepped = false;
  body.grounded = false;
  const steps = Math.max(
    1,
    Math.ceil(
      (Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)) * dt) / 0.18,
    ),
  );
  for (let i = 0; i < steps; i++)
    for (const axis of ["x", "z", "y"] as const) {
      const d = (v[axis] * dt) / steps,
        old = p[axis];
      p[axis] += d;
      if (axis !== "y" && world.loaded && !world.loaded(p.x, p.z)) {
        p[axis] = old;
        v[axis] = 0;
        continue;
      }
      if (!noclip && collides(world, p, height)) {
        if (axis !== "y" && canStep && !stepped && d !== 0) {
          const oldY = p.y;
          p.y += 0.501;
          // Step only onto a real supporting surface; never climb twice
          // within one frame, climb a full wall, or rise into a ceiling.
          const clear = !collides(world, p, height);
          const supported = collides(world, { ...p, y: p.y - 0.04 }, height);
          if (clear && supported) {
            stepped = true;
            body.fallStart = p.y;
            continue;
          }
          p.y = oldY;
        }
        p[axis] = old;
        if (axis === "y" && d < 0) {
          body.grounded = true;
          fall = Math.max(fall, body.fallStart - p.y);
          body.fallStart = p.y;
        }
        v[axis] = 0;
      }
    }
  if (v.y >= 0 || body.grounded) body.fallStart = p.y;
  return fall;
}
/** Collision-aware placement: non-solid decorations do not block placement,
 * and slabs/doors/fences use their actual collision boxes instead of cubes.
 * `value` defaults to a full block to preserve legacy callers such as buckets.
 */
export function overlapsBlock(p: Vec3, x: number, y: number, z: number, value: number = B.Stone) {
  if (!block(value).solid) return false;
  for (const [a, b, c, d, e, f] of boxes(value)) {
    if (
      p.x + 0.29 > x + a + 0.001 &&
      p.x - 0.29 < x + d - 0.001 &&
      p.y + 1.75 > y + b + 0.001 &&
      p.y < y + e - 0.001 &&
      p.z + 0.29 > z + c + 0.001 &&
      p.z - 0.29 < z + f - 0.001
    ) return true;
  }
  return false;
}
export function inWater(world: CollisionWorld, p: Vec3) {
  return idOf(world.get(p.x, p.y + 0.6, p.z)) === B.Water;
}

/** Find a supported, unoccupied position near a spectator's last coordinates.
 * Returning null lets the game fall back to its established safe spawn routine.
 * Use the player's full standing hitbox, including stairs/slabs and narrow passages.
 */
export function findSafeStand(world: CollisionWorld, origin: Vec3): Vec3 | null {
  for (let radius = 0; radius <= 3; radius++) {
    for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
      if (radius > 0 && Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;
      const x = Math.floor(origin.x) + dx + 0.5;
      const z = Math.floor(origin.z) + dz + 0.5;
      if (world.loaded && !world.loaded(x, z)) continue;
      for (let delta = 0; delta <= 12; delta++) for (const sign of delta === 0 ? [1] : [1, -1]) {
        const y = Math.floor(origin.y) + delta * sign + 0.01;
        if (y <= MIN_Y + 1 || y + 1.75 >= MAX_Y) continue;
        const candidate = { x, y, z };
        if (collides(world, candidate)) continue;
        if (!collides(world, { ...candidate, y: y - 0.18 })) continue;
        const feet = idOf(world.get(x, y, z));
        const head = idOf(world.get(x, y + 1, z));
        if (feet === B.Lava || feet === B.Water || head === B.Lava || head === B.Water) continue;
        return candidate;
      }
    }
  }
  return null;
}
