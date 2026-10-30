import { B } from "../blocks";
import { hash } from "../noise";
import { contains, intersects, type Rect, type Structure } from "../city/plan";
import { VoxelWriter } from "../city/writer";
import type { MacroPlan } from "../geography/plan";
import type { LandmarkPlan } from "../geography/landmarks";
import type { RealizationPlan } from "../landmarks/types";
import { footprintsOverlap, type Footprint } from "../geography/geometry";
import { sampleTerrain } from "../geography/terrain";
import { drawUrbanLot } from "./architecture";
import { districtSpec, FAMILY, type Archetype, type DistrictId, type RoofFamily } from "./districts";
import { nearestRoadPoint, PANDA_PROTECTION, roadBounds, roadElevation, roadFootprint, type UrbanLot, type UrbanPlan, type UrbanRoad } from "./plan";

export const DENSITY_LIMITS = { infill: 800, candidates: 12000, maxFill: 10, maxCut: 7 } as const;
export const INTENTIONAL_OPEN_SPACES = [
  { id: "panda-monument-and-court", reason: "plaza", bounds: PANDA_PROTECTION },
  { id: "panda-south-arrival", reason: "plaza", bounds: { x1: -6, x2: 6, z1: -18, z2: 38 } },
  { id: "imperial-procession", reason: "processional-space", bounds: { x1: -9, x2: 9, z1: -440, z2: -224 } },
  { id: "working-quay", reason: "harbor-apron", bounds: { x1: 108, x2: 190, z1: 333, z2: 346 } },
] as const;
export type DensityPlan = {
  baseUrban: UrbanPlan; urban: UrbanPlan; infill: UrbanLot[]; links: UrbanRoad[];
  byChunk: Map<string, UrbanLot[]>; linksByChunk: Map<string, UrbanRoad[]>;
  openSpaces: typeof INTENTIONAL_OPEN_SPACES; diagnostics: Record<string, number>;
  districts: { id: DistrictId; before: number; added: number; beforeArea: number; addedArea: number; frontage: number }[];
};
const area = (r: Rect): Footprint => ({ kind: "area", bounds: r });
function keys(r: Rect) {
  const result: string[] = [];
  for (let z = Math.floor(r.z1 / 16); z <= Math.floor(r.z2 / 16); z++) for (let x = Math.floor(r.x1 / 16); x <= Math.floor(r.x2 / 16); x++) result.push(`${x},${z}`);
  return result;
}
function addIndex<T>(index: Map<string, T[]>, r: Rect, value: T) { for (const key of keys(r)) { const list = index.get(key) ?? []; list.push(value); index.set(key, list); } }
function nearby<T>(index: Map<string, T[]>, r: Rect) { const set = new Set<T>(); for (const key of keys(r)) for (const v of index.get(key) ?? []) set.add(v); return set; }
const areaSize = (r: Rect) => (r.x2 - r.x1 + 1) * (r.z2 - r.z1 + 1);
const TYPES: Record<DistrictId, readonly Archetype[]> = {
  heritage: ["merchant", "shophouse", "civic"], market: ["shophouse", "merchant", "mixed-use"],
  hutong: ["courtyard", "shophouse"], "water-town": ["water-house", "water-house", "merchant"],
  imperial: ["civic", "merchant"], harbor: ["warehouse", "merchant"], artisan: ["workyard", "shophouse", "merchant"],
  scholar: ["courtyard", "pavilion", "merchant"], nightlife: ["mixed-use", "shophouse"], highland: ["hillside", "courtyard"],
};

/** V7 adds street-facing parcels to a frozen v6 city. Every candidate has a
 * real street entrance. Rejection tests use local indices, not column generation. */
export function createDensityPlan(m: MacroPlan, reservations: LandmarkPlan, realized: RealizationPlan, base: UrbanPlan): DensityPlan {
  const infill: UrbanLot[] = [], links: UrbanRoad[] = [], byChunk = new Map<string, UrbanLot[]>(), linksByChunk = new Map<string, UrbanRoad[]>();
  const lotIndex = new Map([...base.lotsByChunk].map(([k, v]) => [k, [...v]])), roadIndex = new Map([...base.roadsByChunk].map(([k, v]) => [k, [...v]]));
  const diagnostics: Record<string, number> = { candidates: 0 };
  const reject = (why: string) => { diagnostics[why] = (diagnostics[why] ?? 0) + 1; };
  const virtual: UrbanRoad[] = [];
  for (const approach of realized.approaches) {
    const site = realized.sites.find(s => s.id === approach.site)!;
    const district: DistrictId = site.id === "imperial-complex" ? "imperial" : site.id === "harbor-front" ? "harbor" : site.id === "archaeology" ? "artisan" : site.id === "scenic-landscape" ? "scholar" : "highland";
    const nodes = approach.nodes.slice(-145).filter((_, i) => i % 8 === 0);
    if (nodes.length > 1) virtual.push({ id: `settlement:${site.id}:${approach.id}`, district, kind: "approach", points: nodes, half: approach.half, surface: approach.surface, lanternSpacing: 0 });
  }
  const roads = [...base.roads.filter(r => !r.owner), ...virtual];
  for (const road of virtual) addIndex(roadIndex, roadBounds(road), road);
  const protectedAt = (r: Rect) => {
    const f = area(r);
    if (INTENTIONAL_OPEN_SPACES.some(s => intersects(r, s.bounds, 1))) return true;
    if (reservations.reservations.some(s => footprintsOverlap(f, s.footprint, s.margin + 1))) return true;
    if (m.connections.some(c => footprintsOverlap(f, { kind: "corridor", points: c.points, halfWidth: c.halfWidth }, .5))) return true;
    if (base.canals.some(c => intersects(r, c, 2)) || footprintsOverlap(f, base.canalLink, 1)) return true;
    for (const c of nearby(realized.byChunk, r)) if (intersects(r, c.bounds, 1)) return true;
    return false;
  };
  function offer(r: Rect, district: DistrictId, facing: number, parent: UrbanRoad, serial: number) {
    if (++diagnostics.candidates > DENSITY_LIMITS.candidates || infill.length >= DENSITY_LIMITS.infill) return;
    const envelope = { x1: r.x1 - 2, x2: r.x2 + 2, z1: r.z1 - 2, z2: r.z2 + 2 }, f = area(envelope), spec = districtSpec(district);
    if (protectedAt(envelope)) { reject("intentional-open-or-protected"); return; }
    if ([...nearby(lotIndex, envelope)].some(l => intersects(envelope, l.envelope, .5))) { reject("existing-parcel"); return; }
    if ([...nearby(roadIndex, envelope)].some(road => footprintsOverlap(f, roadFootprint(road), .25))) { reject("street-clearance"); return; }
    const entrance = facing === 0 ? { x: Math.floor((r.x1 + r.x2) / 2), z: r.z1 - 1 } : facing === 1 ? { x: r.x2 + 1, z: Math.floor((r.z1 + r.z2) / 2) } : facing === 2 ? { x: Math.floor((r.x1 + r.x2) / 2), z: r.z2 + 1 } : { x: r.x1 - 1, z: Math.floor((r.z1 + r.z2) / 2) };
    const q = nearestRoadPoint(parent, entrance.x, entrance.z), baseY = Math.round(roadElevation(m, parent, q.x, q.z));
    const probes = [[r.x1, r.z1], [r.x2, r.z1], [r.x1, r.z2], [r.x2, r.z2], [(r.x1 + r.x2) / 2, (r.z1 + r.z2) / 2]].map(([x, z]) => sampleTerrain(m, x, z));
    const stilt = district === "harbor" && probes.some(t => t.water);
    if (baseY > 180 || probes.some(t => t.water && !stilt || baseY - t.height > DENSITY_LIMITS.maxFill || t.height - baseY > DENSITY_LIMITS.maxCut)) { reject("terrain-support"); return; }
    const link: UrbanRoad = { id: `entry:v7:${district}:${r.x1}:${r.z1}`, district, kind: "lane", owner: `v7:${district}:${r.x1}:${r.z1}`, half: 1, surface: stilt ? B.Planks : B.Paving, lanternSpacing: 0,
      points: [{ ...entrance, y: baseY }, { x: Math.round(q.x), z: Math.round(q.z), y: Math.round(q.y * 2) / 2 }] };
    if ([...nearby(lotIndex, roadBounds(link))].some(l => footprintsOverlap(roadFootprint(link), area(l.envelope)))) { reject("entry-obstructed"); return; }
    const n = Math.floor(hash(r.x1, r.z1, m.seed, 717) * 0x7fffffff), archetype = TYPES[district][n % TYPES[district].length];
    const floors = district === "nightlife" ? 3 + n % 2 : ["hutong", "scholar", "highland", "harbor"].includes(district) ? 1 + (n % 5 === 0 ? 1 : 0) : 2 + (district === "market" && n % 4 === 0 ? 1 : 0);
    const roofFamily: RoofFamily = district === "nightlife" && n % 3 === 0 ? "terrace" : archetype === "warehouse" ? "warehouse" : n % 3 === 0 ? "hip" : "gable";
    const lot: UrbanLot = { ...r, id: link.owner!, kind: FAMILY[archetype], district: spec.legacy, districtId: district, blockId: `infill:${parent.id}:${serial}`, envelope, archetype, roofFamily,
      facing, floors, roof: spec.tile, facade: district === "harbor" ? "loading-bay" : district === "imperial" ? "formal" : n % 3 === 0 ? "arcade" : "timber", style: n % 5, seed: n, baseY, entrance,
      balcony: floors > 1 && n % 3 === 0, arcade: ["market", "nightlife", "heritage"].includes(district) && n % 2 === 0, corner: false, greenery: district === "scholar" || n % 7 === 0 };
    infill.push(lot); links.push(link); addIndex(byChunk, envelope, lot); addIndex(lotIndex, envelope, lot); addIndex(linksByChunk, roadBounds(link), link); addIndex(roadIndex, roadBounds(link), link);
  }
  for (const narrow of [false, true]) for (const road of roads) {
    let traveled = 0, next = 7;
    for (let i = 1; i < road.points.length; i++) {
    const a = road.points[i - 1], b = road.points[i], length = Math.hypot(b.x - a.x, b.z - a.z), horizontal = Math.abs(b.x - a.x) >= Math.abs(b.z - a.z);
    const step = narrow ? 6 : road.district === "harbor" ? 24 : 18;
    for (; next <= traveled + length; next += step) for (const side of [-1, 1]) {
      const t = next - traveled;
      const x = a.x + (b.x - a.x) * t / length, z = a.z + (b.z - a.z) * t / length;
      const district = base.districts.find(d => contains(d.bounds, x, z))?.id ?? (road.id.startsWith("settlement:") ? road.district : undefined);
      if (!district) continue;
      const width = narrow ? district === "harbor" ? 13 : 9 : district === "harbor" ? 17 : district === "market" ? 10 + Math.floor(hash(Math.round(x), Math.round(z), m.seed) * 3) : 12;
      const depth = narrow ? 9 : ["imperial", "highland"].includes(district) ? 11 : 13;
      const half = district === "heritage" && Math.abs(x) < 2 && z > -18 && z < 38 ? 7 : road.half;
      let r: Rect, facing: number;
      if (horizontal) {
        const start = Math.round(x) - Math.floor(width / 2), front = Math.round(z + side * (half + 3));
        r = { x1: start, x2: start + width - 1, z1: side > 0 ? front : front - depth + 1, z2: side > 0 ? front + depth - 1 : front }; facing = side > 0 ? 0 : 2;
      } else {
        const start = Math.round(z) - Math.floor(width / 2), front = Math.round(x + side * (half + 3));
        r = { x1: side > 0 ? front : front - depth + 1, x2: side > 0 ? front + depth - 1 : front, z1: start, z2: start + width - 1 }; facing = side > 0 ? 3 : 1;
      }
      offer(r, district, facing, road, Math.round(next));
    }
    traveled += length;
    }
  }
  const allLots = [...base.lots, ...infill], allRoads = [...base.roads, ...virtual, ...links];
  const structures: Structure[] = [base.panda, base.gate, ...allLots], structuresByChunk = new Map<string, Structure[]>();
  for (const s of structures) addIndex(structuresByChunk, { x1: s.x1 - 3, x2: s.x2 + 3, z1: s.z1 - 3, z2: s.z2 + 3 }, s);
  const urban: UrbanPlan = { ...base, lots: allLots, roads: allRoads, lotsByChunk: lotIndex, roadsByChunk: roadIndex, residentCity: { ...base.residentCity, structures, byChunk: structuresByChunk } };
  diagnostics.added = infill.length; diagnostics.maxLocalLots = Math.max(0, ...[...byChunk.values()].map(a => a.length));
  const districts = base.districts.map(d => { const old = base.lots.filter(l => l.districtId === d.id), added = infill.filter(l => l.districtId === d.id); return { id: d.id, before: old.length, added: added.length, beforeArea: old.reduce((n, l) => n + areaSize(l), 0), addedArea: added.reduce((n, l) => n + areaSize(l), 0), frontage: added.reduce((n, l) => n + (l.facing % 2 ? l.z2 - l.z1 + 1 : l.x2 - l.x1 + 1), 0) }; });
  return { baseUrban: base, urban, infill, links, byChunk, linksByChunk, openSpaces: INTENTIONAL_OPEN_SPACES, diagnostics, districts };
}

/** Local additive realization after frozen v6. Supports, dry entrance links,
 * reusable district architecture; no neighboring generation or global scans. */
export function drawDensity(w: VoxelWriter, m: MacroPlan, p: DensityPlan, cx: number, cz: number) {
  for (const lot of p.byChunk.get(`${cx},${cz}`) ?? []) {
    const e = lot.envelope;
    w.fill(e.x1, lot.baseY + 1, e.z1, e.x2, lot.baseY + lot.floors * 5 + 12, e.z2, B.Air);
    for (let z = Math.max(w.oz, e.z1); z <= Math.min(w.oz + 15, e.z2); z++) for (let x = Math.max(w.ox, e.x1); x <= Math.min(w.ox + 15, e.x2); x++) {
      const t = sampleTerrain(m, x, z);
      if (t.water) { if ((x - lot.x1) % 6 === 0 && (z - lot.z1) % 6 === 0) w.fill(x, t.height, z, x, lot.baseY - 1, z, B.DarkTimber); w.put(x, lot.baseY, z, B.Planks); }
      else w.fill(x, Math.min(t.height, lot.baseY), z, x, lot.baseY, z, B.SculptureStone);
    }
    drawUrbanLot(w, lot);
  }
  for (const road of p.linksByChunk.get(`${cx},${cz}`) ?? []) {
    const bounds = roadBounds(road);
    for (let z = Math.max(w.oz, Math.floor(bounds.z1)); z <= Math.min(w.oz + 15, Math.ceil(bounds.z2)); z++) for (let x = Math.max(w.ox, Math.floor(bounds.x1)); x <= Math.min(w.ox + 15, Math.ceil(bounds.x2)); x++) {
      const q = nearestRoadPoint(road, x, z); if (q.distance > road.half) continue;
      const level = Math.round(q.y * 2) / 2, y = Math.floor(level), t = sampleTerrain(m, x, z);
      w.fill(x, y + 1, z, x, y + 3, z, B.Air);
      if (!t.water) w.fill(x, Math.min(t.height, y), z, x, y - 1, z, B.SculptureStone);
      w.put(x, y, z, road.surface); if (level % 1) w.put(x, y + 1, z, B.Slab);
    }
  }
}
