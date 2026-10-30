import { clamp } from "../../core/coords";

export type Point = Readonly<{ x: number; z: number }>;
export type Bounds = Readonly<{ x1: number; z1: number; x2: number; z2: number }>;
export type Footprint =
  | Readonly<{ kind: "point"; center: Point; radius: number }>
  | Readonly<{ kind: "area"; bounds: Bounds }>
  | Readonly<{ kind: "corridor"; points: readonly Point[]; halfWidth: number }>;

export function segmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dz = b.z - a.z;
  const t = clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1), 0, 1);
  return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz);
}
export function pathDistance(points: readonly Point[], x: number, z: number): number {
  let distance = Infinity;
  for (let i = 1; i < points.length; i++)
    distance = Math.min(distance, segmentDistance({ x, z }, points[i - 1], points[i]));
  return distance;
}
/** Signed distance to a footprint. Negative values are inside. No query cache. */
export function footprintDistance(f: Footprint, x: number, z: number): number {
  if (f.kind === "point") return Math.hypot(x - f.center.x, z - f.center.z) - f.radius;
  if (f.kind === "corridor") return pathDistance(f.points, x, z) - f.halfWidth;
  const b = f.bounds, dx = Math.max(b.x1 - x, x - b.x2), dz = Math.max(b.z1 - z, z - b.z2);
  return Math.hypot(Math.max(0, dx), Math.max(0, dz)) + Math.min(0, Math.max(dx, dz));
}
export function footprintBounds(f: Footprint): Bounds {
  if (f.kind === "area") return f.bounds;
  const points = f.kind === "point" ? [f.center] : f.points;
  const r = f.kind === "point" ? f.radius : f.halfWidth;
  return { x1: Math.min(...points.map(p => p.x)) - r, x2: Math.max(...points.map(p => p.x)) + r,
    z1: Math.min(...points.map(p => p.z)) - r, z2: Math.max(...points.map(p => p.z)) + r };
}
function segments(f: Footprint): readonly (readonly [Point, Point])[] {
  if (f.kind === "point") return [[f.center, f.center]];
  if (f.kind === "corridor") return f.points.slice(1).map((p, i) => [f.points[i], p] as const);
  const b = f.bounds, p = [{ x: b.x1, z: b.z1 }, { x: b.x2, z: b.z1 }, { x: b.x2, z: b.z2 }, { x: b.x1, z: b.z2 }];
  return p.map((v, i) => [v, p[(i + 1) % 4]] as const);
}
function cross(a: Point, b: Point, c: Point) { return (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x); }
function segmentGap(a: Point, b: Point, c: Point, d: Point): number {
  if (Math.max(a.x, b.x) >= Math.min(c.x, d.x) && Math.max(c.x, d.x) >= Math.min(a.x, b.x) &&
      Math.max(a.z, b.z) >= Math.min(c.z, d.z) && Math.max(c.z, d.z) >= Math.min(a.z, b.z) &&
      cross(a, b, c) * cross(a, b, d) <= 0 && cross(c, d, a) * cross(c, d, b) <= 0) return 0;
  return Math.min(segmentDistance(a, c, d), segmentDistance(b, c, d), segmentDistance(c, a, b), segmentDistance(d, a, b));
}
/** Exact circle/rectangle/capsule-union overlap, including exclusion margins. */
export function footprintsOverlap(a: Footprint, b: Footprint, margin = 0): boolean {
  const aa = footprintBounds(a), bb = footprintBounds(b);
  if (aa.x1 - margin > bb.x2 || aa.x2 + margin < bb.x1 || aa.z1 - margin > bb.z2 || aa.z2 + margin < bb.z1) return false;
  const sa = segments(a), sb = segments(b);
  if (footprintDistance(a, sb[0][0].x, sb[0][0].z) <= margin || footprintDistance(b, sa[0][0].x, sa[0][0].z) <= margin) return true;
  const radius = (f: Footprint) => f.kind === "point" ? f.radius : f.kind === "corridor" ? f.halfWidth : 0;
  return sa.some(([p, q]) => sb.some(([r, s]) => segmentGap(p, q, r, s) <= radius(a) + radius(b) + margin));
}
export function validFootprint(f: Footprint): boolean {
  if (!f || !["point", "area", "corridor"].includes(f.kind)) return false;
  const valid = (p: Point) => !!p && Number.isFinite(p.x) && Number.isFinite(p.z) && Math.abs(p.x) <= 1e7 && Math.abs(p.z) <= 1e7;
  if (f.kind === "point") return valid(f.center) && Number.isFinite(f.radius) && f.radius >= 0 && f.radius <= 4096;
  if (f.kind === "corridor") return f.points.length >= 2 && f.points.length <= 32 && f.points.every(valid) && Number.isFinite(f.halfWidth) && f.halfWidth >= 0 && f.halfWidth <= 4096;
  const b = f.bounds;
  return !!b && valid({ x: b.x1, z: b.z1 }) && valid({ x: b.x2, z: b.z2 }) && b.x1 <= b.x2 && b.z1 <= b.z2;
}
export function freezePlan<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezePlan(child);
    Object.freeze(value);
  }
  return value;
}
