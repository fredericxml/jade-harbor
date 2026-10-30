import { hash } from "../noise";
import { footprintBounds, footprintDistance, footprintsOverlap, freezePlan, validFootprint, type Footprint, type Point } from "./geometry";
import type { MacroPlan, Region } from "./plan";
import { terrainSuitability } from "./terrain";

export type LandmarkType = "point" | "area" | "linear" | "waterfront" | "cliff" | "mountain" | "landscape";
export type Site = Readonly<{ anchor: Point; footprint: Footprint }>;
export type LandmarkRequest = Readonly<{ id: string; type: LandmarkType; priority: number; margin: number;
  candidates: readonly Site[]; regions: readonly Region[]; maxSlope: number; elevation: readonly [number, number];
  water: "forbidden" | "allowed" | "adjacent"; ridge: boolean; cliff: boolean; allowScenic: boolean;
  district?: string; connections: readonly string[]; caves: "foundation" | "natural"; viewToward: Point }>;
export type Reservation = Readonly<Omit<LandmarkRequest, "candidates"> & Site & { seed: number; candidate: number }>;
export type Diagnostic = Readonly<{ id: string; status: "accepted" | "repositioned" | "rejected"; attempts: number; reasons: readonly string[] }>;
export type LandmarkPlan = Readonly<{ reservations: readonly Reservation[]; diagnostics: readonly Diagnostic[] }>;
export type Protection = Readonly<{ id: string; kind: "panda" | "city" | "river" | "harbor" | "route" | "district" | "scenic" | "mine"; footprint: Footprint }>;
export const MAX_REQUESTS = 64, MAX_CANDIDATES = 8, MAX_SITE_SAMPLES = 1024;

export function protections(p: MacroPlan): readonly Protection[] {
  return [
    { id: "panda-plaza", kind: "panda", footprint: { kind: "area", bounds: { x1: -30, z1: -80, x2: 30, z2: -18 } } },
    { id: "primary-city", kind: "city", footprint: { kind: "area", bounds: { x1: -328, z1: -328, x2: 328, z2: 328 } } },
    { id: "major-river", kind: "river", footprint: { kind: "corridor", points: p.river, halfWidth: p.riverHalfWidth + 6 } },
    { id: "harbor", kind: "harbor", footprint: { kind: "point", center: p.harbor.center, radius: p.harbor.radius } },
    { id: "western-scenic", kind: "scenic", footprint: { kind: "point", center: p.scenic, radius: 100 } },
    { id: p.mine.id, kind: "mine", footprint: { kind: "corridor", points: [p.mine.entrance, p.mine.end], halfWidth: 6 } },
    ...p.connections.map(c => ({ id: c.id, kind: "route" as const, footprint: { kind: "corridor" as const, points: c.points, halfWidth: c.halfWidth } })),
    ...p.districts.filter(d => ["imperial-expansion", "archaeology", "ridge", "harbor-expansion"].includes(d.id)).map(d => ({ id: d.id, kind: "district" as const, footprint: d.footprint })),
  ];
}
function compatible(r: LandmarkRequest, p: Protection): boolean {
  if (p.kind === "route") return r.connections.includes(p.id);
  if (p.kind === "district") return r.district === p.id;
  if (p.kind === "scenic") return r.allowScenic;
  if (p.kind === "river" || p.kind === "harbor") return (r.type === "waterfront" || r.type === "landscape") && r.water !== "forbidden";
  return false;
}
/** Bounded terrain probes, plus exact continuous footprint/protection overlap tests. */
function siteSamples(site: Site): Point[] | undefined {
  const f = site.footprint, points: Point[] = [site.anchor];
  const add = (p: Point) => { if (points.length >= MAX_SITE_SAMPLES) return false; points.push(p); return true; };
  if (f.kind === "corridor") {
    for (let i = 1; i < f.points.length; i++) {
      const a = f.points[i - 1], b = f.points[i], length = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(length / 16));
      if (n * 3 + points.length > MAX_SITE_SAMPLES) return undefined;
      for (let j = 0; j <= n; j++) for (const side of [-1, 0, 1]) {
        if (!add({ x: a.x + (b.x - a.x) * j / n + (b.z - a.z) / (length || 1) * f.halfWidth * side,
          z: a.z + (b.z - a.z) * j / n - (b.x - a.x) / (length || 1) * f.halfWidth * side })) return undefined;
      }
    }
  } else {
    const b = footprintBounds(f), nx = Math.max(1, Math.ceil((b.x2 - b.x1) / 16)), nz = Math.max(1, Math.ceil((b.z2 - b.z1) / 16));
    if ((nx + 1) * (nz + 1) > MAX_SITE_SAMPLES - 1) return undefined;
    for (let iz = 0; iz <= nz; iz++) for (let ix = 0; ix <= nx; ix++) {
      const x = b.x1 + (b.x2 - b.x1) * ix / nx, z = b.z1 + (b.z2 - b.z1) * iz / nz;
      if (footprintDistance(f, x, z) <= 0 && !add({ x, z })) return undefined;
    }
    if (f.kind === "point") for (let i = 0; i < 16; i++)
      if (!add({ x: f.center.x + Math.cos(i * Math.PI / 8) * f.radius, z: f.center.z + Math.sin(i * Math.PI / 8) * f.radius })) return undefined;
  }
  return points;
}
export function resolveReservations(p: MacroPlan, requests: readonly LandmarkRequest[], obstacles = protections(p)): LandmarkPlan {
  if (requests.length > MAX_REQUESTS) throw new Error("Landmark request budget exceeded.");
  const ids = new Set<string>();
  for (const r of requests) {
    if (!r.id || ids.has(r.id) || !Number.isFinite(r.priority) || !Number.isFinite(r.margin) || r.margin < 0 || r.margin > 128 ||
      !Number.isFinite(r.maxSlope) || r.maxSlope < 0 || !r.elevation.every(Number.isFinite) || r.elevation[0] > r.elevation[1] ||
      !r.candidates.length || r.candidates.length > MAX_CANDIDATES || r.candidates.some(s => !validFootprint(s.footprint) ||
        !Number.isFinite(s.anchor.x) || !Number.isFinite(s.anchor.z) || Math.abs(s.anchor.x) > 1e7 || Math.abs(s.anchor.z) > 1e7 ||
        footprintDistance(s.footprint, s.anchor.x, s.anchor.z) > 0)) throw new Error("Invalid landmark request.");
    ids.add(r.id);
  }
  const reservations: Reservation[] = [], diagnostics: Diagnostic[] = [];
  for (const r of [...requests].sort((a, b) => b.priority - a.priority || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    const reasons: string[] = []; let accepted = false;
    for (let i = 0; i < r.candidates.length; i++) {
      const site = r.candidates[i];
      const obstacle = obstacles.find(o => !compatible(r, o) && footprintsOverlap(site.footprint, o.footprint, r.margin));
      const previous = reservations.find(o => footprintsOverlap(site.footprint, o.footprint, r.margin + o.margin));
      let reason = obstacle ? `protected:${obstacle.id}` : previous ? `landmark:${previous.id}` : "";
      if (!reason) {
        const points = siteSamples(site);
        if (!points) reason = "terrain-sample-budget";
        else {
          const anchor = terrainSuitability(p, site.anchor.x, site.anchor.z);
          if (r.water === "adjacent" && Math.min(Math.abs(anchor.riverDistance), Math.abs(anchor.harborDistance)) > 28) reason = "water-adjacency";
          for (const v of points) {
            if (reason) break;
            const t = terrainSuitability(p, v.x, v.z);
            if (!r.regions.includes(t.region)) reason = `region:${t.region}`;
            else if (t.slope > r.maxSlope || t.elevation < r.elevation[0] || t.elevation > r.elevation[1]) reason = "terrain-tolerance";
            else if (r.water === "forbidden" && t.water) reason = "water";
            else if (r.ridge && !t.ridge) reason = "ridge";
            else if (r.cliff && !t.cliffAdjacent) reason = "cliff";
            else if (t.scenic && !r.allowScenic) reason = "scenic-protection";
          }
        }
      }
      if (reason) { reasons.push(`${i}:${reason}`); continue; }
      const { candidates: _, ...metadata } = r;
      reservations.push({ ...metadata, ...site, candidate: i, seed: Math.floor(hash(site.anchor.x, site.anchor.z, p.seed) * 0xffffffff) });
      diagnostics.push({ id: r.id, status: i ? "repositioned" : "accepted", attempts: i + 1, reasons }); accepted = true; break;
    }
    if (!accepted) diagnostics.push({ id: r.id, status: "rejected", attempts: r.candidates.length, reasons });
  }
  // Clone before freezing so caller-owned request arrays/objects are never mutated.
  return freezePlan(structuredClone({ reservations, diagnostics }));
}
export function landmarkRequests(p: MacroPlan): readonly LandmarkRequest[] {
  const circle = (x: number, z: number, radius: number): Site => ({ anchor: { x, z }, footprint: { kind: "point", center: { x, z }, radius } });
  const area = (x: number, z: number, rx: number, rz: number): Site => ({ anchor: { x, z }, footprint: { kind: "area", bounds: { x1: x - rx, x2: x + rx, z1: z - rz, z2: z + rz } } });
  const request = (id: string, type: LandmarkType, site: Site, regions: Region[], extra: Partial<LandmarkRequest> = {}): LandmarkRequest => ({
    id, type, priority: 50, margin: 6, candidates: [site], regions, maxSlope: .5, elevation: [19, 180], water: "forbidden",
    ridge: false, cliff: false, allowScenic: false, connections: [], caves: "foundation", viewToward: p.primary, ...extra });
  return [
    request("imperial-complex-reserve", "area", area(0, -430, 64, 28), ["imperial-plateau"], { priority: 90, district: "imperial-expansion", connections: ["imperial-axis"] }),
    request("archaeology-reserve", "area", area(-530, 160, 60, 60), ["archaeology-outskirts"], { priority: 80, district: "archaeology", connections: ["archaeology-road"] }),
    request("ridge-fortification-reserve", "linear", { anchor: p.wallRidge[1], footprint: { kind: "corridor", points: p.wallRidge, halfWidth: 8 } }, ["ridge"], { priority: 85, ridge: true, maxSlope: 1, allowScenic: true, district: "ridge", connections: ["northern-ridge"] }),
    request("harbor-front-reserve", "waterfront", circle(200, 349, 12), ["harbor-waterfront"], { priority: 75, maxSlope: 1, elevation: [10, 23], water: "adjacent", district: "harbor-expansion", connections: ["harbor-approach", "harbor-promenade"] }),
    request("mountain-temple-reserve", "mountain", circle(-660, -250, 16), ["scenic-protected"], { allowScenic: true }),
    request("cliff-grotto-reserve", "cliff", { anchor: p.cliff, footprint: { kind: "corridor", points: [{ x: 607, z: -430 }, { x: 633, z: -430 }], halfWidth: 4 } }, ["cliff"], { maxSlope: 8, cliff: true, allowScenic: true, caves: "natural" }),
    request("scenic-landscape-reserve", "landscape", circle(-735, -250, 12), ["scenic-protected"], { allowScenic: true, caves: "natural", maxSlope: 1 }),
    request("western-viewpoint-reserve", "point", circle(-660, -325, 8), ["scenic-protected"], { allowScenic: true, caves: "natural", maxSlope: 1 }),
  ];
}
export function reservationAt(plan: LandmarkPlan, x: number, z: number, margin = true): Reservation | undefined {
  return plan.reservations.find(r => footprintDistance(r.footprint, x, z) <= (margin ? r.margin : 0));
}
export function caveRoofAt(plan: LandmarkPlan, x: number, z: number, defaultRoof: number): number {
  return reservationAt(plan, x, z)?.caves === "foundation" ? Math.max(defaultRoof, 16) : defaultRoof;
}
