import { Vec3, idOf } from "../core/coords";
import { B } from "../world/blocks";
export type Hit = {
  x: number;
  y: number;
  z: number;
  normal: Vec3;
  distance: number;
  value: number;
};
export function raycast(
  get: (x: number, y: number, z: number) => number,
  origin: Vec3,
  dir: Vec3,
  reach = 6,
  includeWater = false,
): Hit | null {
  let x = Math.floor(origin.x),
    y = Math.floor(origin.y),
    z = Math.floor(origin.z),
    normal = { x: 0, y: 0, z: 0 },
    distance = 0;
  const sx = Math.sign(dir.x),
    sy = Math.sign(dir.y),
    sz = Math.sign(dir.z),
    dx = dir.x ? Math.abs(1 / dir.x) : Infinity,
    dy = dir.y ? Math.abs(1 / dir.y) : Infinity,
    dz = dir.z ? Math.abs(1 / dir.z) : Infinity;
  let tx = dir.x ? (sx > 0 ? x + 1 - origin.x : origin.x - x) * dx : Infinity,
    ty = dir.y ? (sy > 0 ? y + 1 - origin.y : origin.y - y) * dy : Infinity,
    tz = dir.z ? (sz > 0 ? z + 1 - origin.z : origin.z - z) * dz : Infinity;
  for (let i = 0; i < 256 && distance <= reach; i++) {
    const v = get(x, y, z);
    if (idOf(v) !== B.Air && (includeWater || idOf(v) !== B.Water))
      return { x, y, z, normal, distance, value: v };
    if (tx <= ty && tx <= tz) {
      distance = tx;
      tx += dx;
      x += sx;
      normal = { x: -sx, y: 0, z: 0 };
    } else if (ty <= tz) {
      distance = ty;
      ty += dy;
      y += sy;
      normal = { x: 0, y: -sy, z: 0 };
    } else {
      distance = tz;
      tz += dz;
      z += sz;
      normal = { x: 0, y: 0, z: -sz };
    }
  }
  return null;
}
