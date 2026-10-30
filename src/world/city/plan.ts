import { hash } from "../noise";
import { B } from "../blocks";
export const CITY_SPACING = 1024,
  CITY_RADIUS = 328,
  CITY_Y = 20;
export const CITY_SPAWN = { x: 0.5, y: 21.1, z: 24.5 };
export const PANDA = { x: 0, z: -48, base: 23 };
export const DISTRICTS = [
  "Grand Lantern Avenue",
  "Residential Old Town",
  "Grand Market",
  "Temple Quarter",
  "Canal Quarter",
  "Imperial Quarter",
  "Artisan Quarter",
  "Classical Gardens",
] as const;
export type District = (typeof DISTRICTS)[number];
export type Rect = { x1: number; z1: number; x2: number; z2: number };
export type Family =
  | "shop"
  | "shophouse"
  | "merchant"
  | "home"
  | "courtyard"
  | "teahouse"
  | "workshop"
  | "pavilion"
  | "canal-house"
  | "corner-shop"
  | "stall"
  | "warehouse"
  | "temple"
  | "pagoda"
  | "civic"
  | "gate"
  | "panda-plaza"
  | "market-hall"
  | "garden";
export type Structure = Rect & {
  baseY?: number;
  id: string;
  kind: Family;
  district: District;
  facing: number;
  floors: number;
  roof: number;
  style: number;
  seed: number;
};
export type Road = { axis: "x" | "z"; at: number; half: number; name: string };
export type CityPlan = {
  seed: number;
  ox: number;
  oz: number;
  roads: Road[];
  structures: Structure[];
  byChunk: Map<string, Structure[]>;
  reservations: Rect[];
  parks: Rect[];
  alleys: Rect[];
};
export const contains = (r: Rect, x: number, z: number) =>
  x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2;
export const intersects = (a: Rect, b: Rect, pad = 0) =>
  a.x1 - pad <= b.x2 &&
  a.x2 + pad >= b.x1 &&
  a.z1 - pad <= b.z2 &&
  a.z2 + pad >= b.z1;
export function districtAt(x: number, z: number): District {
  if (z < -218)
    return x < -80 ? DISTRICTS[2] : x > 80 ? DISTRICTS[5] : DISTRICTS[3];
  if (x > 100) return z > 116 ? DISTRICTS[7] : DISTRICTS[4];
  if (x < -80)
    return z < -64 ? DISTRICTS[2] : z > 116 ? DISTRICTS[6] : DISTRICTS[1];
  return z > 180 ? DISTRICTS[1] : DISTRICTS[0];
}
export const inCity = (x: number, z: number) =>
  Math.max(Math.abs(x), Math.abs(z)) <= CITY_RADIUS && Math.hypot(x, z) < 436;
const cache = new Map<string, CityPlan>();
export function clearCityPlanCache(seed: number) {
  for (const key of cache.keys()) if (key.startsWith(`${seed}:`)) cache.delete(key);
}
export function cityPlanCacheSize() { return cache.size; }
export function cityNear(x: number, z: number, seed: number): CityPlan | null {
  const ox = Math.round(x / CITY_SPACING) * CITY_SPACING,
    oz = Math.round(z / CITY_SPACING) * CITY_SPACING;
  if ((ox || oz) && hash(ox, oz, seed + 713) < 0.38) return null;
  if (Math.max(Math.abs(x - ox), Math.abs(z - oz)) > CITY_RADIUS + 60)
    return null;
  return getCityPlan(seed, ox, oz);
}
export function getCityPlan(seed: number, ox = 0, oz = 0): CityPlan {
  const key = `${seed}:${ox}:${oz}`,
    cached = cache.get(key);
  if (cached) return cached;
  const s = seed ^ (Math.imul(ox, 173) ^ Math.imul(oz, 271));
  const xs = [-304, -224, -144, -64, 0, 64, 144, 224, 304],
    zs = [-304, -224, -144, -80, -16, 48, 128, 208, 288];
  // The commercial spine is stable; outer avenues move with the seed.
  for (let i = 0; i < xs.length; i++)
    if (Math.abs(xs[i]) > 144) xs[i] += Math.floor(hash(i, 7, s) * 9) - 4;
  for (let i = 0; i < zs.length; i++)
    if (i < 3 || i > 5) zs[i] += Math.floor(hash(i, 13, s) * 9) - 4;
  const plan: CityPlan = {
    seed: s,
    ox,
    oz,
    roads: [],
    structures: [],
    byChunk: new Map(),
    reservations: [],
    parks: [],
    alleys: [],
  };
  for (const at of xs)
    plan.roads.push({
      axis: "x",
      at,
      half: at === 0 ? 5 : Math.abs(at) === 144 ? 4 : 3,
      name: at === 0 ? "Lantern Avenue" : "Neighborhood street",
    });
  for (const at of zs)
    plan.roads.push({
      axis: "z",
      at,
      half:
        Math.abs(at + 16) < 1 ||
        Math.abs(at + 144) < 5 ||
        Math.abs(at - 128) < 5
          ? 4
          : 3,
      name: "Cross avenue",
    });
  const roofs = [B.JadeRoof, B.Roof, B.RubyRoof, B.BrownRoof];
  const add = (
    r: Rect,
    kind: Family,
    facing = 0,
    floors = 1,
    reserved = false,
  ) => {
    if (!inCity(r.x1, r.z1) || !inCity(r.x2, r.z2)) return;
    const localSeed = Math.floor(hash(r.x1, r.z1, s) * 0x7fffffff);
    const structure: Structure = {
      ...r,
      id: `${ox + r.x1},${oz + r.z1}:${kind}`,
      kind,
      district: districtAt((r.x1 + r.x2) / 2, (r.z1 + r.z2) / 2),
      facing,
      floors,
      roof: roofs[localSeed % 4],
      style: localSeed % 5,
      seed: localSeed,
    };
    plan.structures.push(structure);
    if (reserved) plan.reservations.push(r);
  };
  add({ x1: -21, z1: -71, x2: 21, z2: -27 }, "panda-plaza", 2, 1, true);
  add({ x1: -58, z1: -296, x2: -7, z2: -234 }, "pagoda", 2, 5, true);
  add({ x1: 153, z1: -296, x2: 215, z2: -234 }, "civic", 2, 2, true);
  add({ x1: -216, z1: -216, x2: -153, z2: -153 }, "market-hall", 2, 1, true);
  add({ x1: -216, z1: -8, x2: -153, z2: 40 }, "courtyard", 0, 1, true);
  add({ x1: -216, z1: 138, x2: -153, z2: 199 }, "workshop", 0, 2, true);
  add({ x1: 153, z1: 138, x2: 215, z2: 199 }, "garden", 0, 1, true);
  add({ x1: -9, z1: 8, x2: 9, z2: 16 }, "gate", 2, 1, true);
  add({ x1: -9, z1: -212, x2: 9, z2: -204 }, "gate", 2, 1, true);
  const blocked = (r: Rect) =>
    plan.reservations.some((q) => intersects(r, q, 3)) ||
    (r.x1 <= 152 && r.x2 >= 136 && r.z1 < 144 && r.z2 > -234);
  for (let iz = 0; iz < zs.length - 1; iz++)
    for (let ix = 0; ix < xs.length - 1; ix++) {
      const l = xs[ix] + (xs[ix] === 0 ? 8 : 6),
        r = xs[ix + 1] - (xs[ix + 1] === 0 ? 8 : 6),
        t = zs[iz] + 7,
        b = zs[iz + 1] - 7;
      const district = districtAt((l + r) / 2, (t + b) / 2),
        rv = hash(ix, iz, s + 31),
        depth = 12 + Math.floor(rv * 5);
      // Side streets never become disconnected rolls inside individual chunks.
      const mx = Math.floor((l + r) / 2) + (rv > 0.5 ? 3 : -3),
        mz = Math.floor((t + b) / 2);
      plan.alleys.push(
        { x1: mx - 1, z1: t, x2: mx + 1, z2: b },
        { x1: l, z1: mz - 1, x2: r, z2: mz + 1 },
      );
      const choose = (f: number, pos: number): Family => {
        const h = hash(ix * 31 + f, pos, s + 132);
        if (district === DISTRICTS[0])
          return h < 0.3
            ? "merchant"
            : h < 0.65
              ? "shophouse"
              : h < 0.85
                ? "teahouse"
                : "corner-shop";
        if (district === DISTRICTS[1])
          return h < 0.55 ? "home" : h < 0.8 ? "courtyard" : "teahouse";
        if (district === DISTRICTS[2])
          return h < 0.35 ? "stall" : h < 0.8 ? "shop" : "market-hall";
        if (district === DISTRICTS[3])
          return h < 0.3 ? "temple" : h < 0.6 ? "home" : "pavilion";
        if (district === DISTRICTS[4])
          return h < 0.7 ? "canal-house" : "teahouse";
        if (district === DISTRICTS[5]) return h < 0.4 ? "temple" : "merchant";
        if (district === DISTRICTS[6])
          return h < 0.65 ? "workshop" : "warehouse";
        return h < 0.55 ? "pavilion" : "home";
      };
      const row = (
        from: number,
        to: number,
        facing: number,
        fixed: number,
        d: number,
      ) => {
        const cut = facing === 0 || facing === 2 ? mx : mz;
        let n = 0;
        for (const [start, end] of [
          [from, Math.min(to, cut - 3)],
          [Math.max(from, cut + 3), to],
        ]) {
          let p = start;
          while (p + 8 <= end) {
            const w = Math.min(
              end - p + 1,
              9 + Math.floor(hash(p, fixed, s + 49) * 8),
            );
            if (w < 9) break;
            const rect: Rect =
              facing === 0
                ? { x1: p, z1: fixed, x2: p + w - 1, z2: fixed + d - 1 }
                : facing === 2
                  ? { x1: p, z1: fixed - d + 1, x2: p + w - 1, z2: fixed }
                  : facing === 3
                    ? { x1: fixed, z1: p, x2: fixed + d - 1, z2: p + w - 1 }
                    : { x1: fixed - d + 1, z1: p, x2: fixed, z2: p + w - 1 };
            const kind = choose(facing, p),
              garden =
                district === DISTRICTS[7] && hash(p, fixed, s + 6) > 0.35;
            if (
              !blocked(rect) &&
              !garden &&
              !plan.alleys.some((a) => intersects(rect, a, 1))
            ) {
              let floors =
                kind === "merchant"
                  ? 3
                  : kind === "shophouse" ||
                      kind === "canal-house" ||
                      kind === "teahouse"
                    ? 2
                    : kind === "corner-shop"
                      ? n % 2
                        ? 3
                        : 2
                      : 1;
              if (kind === "home" && hash(p, fixed, s + 8) > 0.65) floors = 2;
              add(rect, kind, facing, floors);
            } else if (garden && !blocked(rect)) plan.parks.push(rect);
            p += w + 3 + (district === DISTRICTS[1] ? 1 : 0);
            n++;
          }
        }
      };
      row(l, r, 0, t, depth);
      row(l, r, 2, b, depth + (rv > 0.7 ? 2 : 0));
      if (b - t > depth * 2 + 13) {
        row(t + depth + 3, b - depth - 3, 3, l, depth);
        row(t + depth + 3, b - depth - 3, 1, r, depth);
      }
      const core = {
        x1: l + depth + 3,
        z1: t + depth + 3,
        x2: r - depth - 3,
        z2: b - depth - 3,
      };
      if (core.x2 - core.x1 > 8 && core.z2 - core.z1 > 8 && !blocked(core)) {
        plan.parks.push(core);
      }
    }
  // All bounds and the spatial index use global coordinates, including negative origins.
  for (const st of plan.structures) {
    st.x1 += ox;
    st.x2 += ox;
    st.z1 += oz;
    st.z2 += oz;
    for (
      let cz = Math.floor((st.z1 - 3) / 16);
      cz <= Math.floor((st.z2 + 3) / 16);
      cz++
    )
      for (
        let cx = Math.floor((st.x1 - 3) / 16);
        cx <= Math.floor((st.x2 + 3) / 16);
        cx++
      ) {
        const k = `${cx},${cz}`,
          list = plan.byChunk.get(k) ?? [];
        list.push(st);
        plan.byChunk.set(k, list);
      }
  }
  for (const r of [...plan.reservations, ...plan.parks, ...plan.alleys]) {
    r.x1 += ox;
    r.x2 += ox;
    r.z1 += oz;
    r.z2 += oz;
  }
  cache.set(key, plan);
  if (cache.size > 6) cache.delete(cache.keys().next().value!);
  return plan;
}
export function roadAt(plan: CityPlan, x: number, z: number, pad = 0) {
  return plan.roads.find(
    (r) =>
      Math.abs((r.axis === "x" ? x - plan.ox : z - plan.oz) - r.at) <=
      r.half + pad,
  );
}
export function canalAt(plan: CityPlan, x: number, z: number) {
  return (
    Math.abs(x - plan.ox - 144) <= 4 && z - plan.oz > -234 && z - plan.oz < 144
  );
}
export function crossingAt(plan: CityPlan, z: number) {
  return plan.roads.some(
    (r) => r.axis === "z" && Math.abs(z - plan.oz - r.at) <= r.half,
  );
}
export function parkAt(plan: CityPlan, x: number, z: number) {
  return plan.parks.some((r) => contains(r, x, z));
}
export function surfaceAt(
  plan: CityPlan,
  x: number,
  z: number,
): "water" | "road" | "plaza" | "building" | "garden" | "court" {
  const lx = x - plan.ox,
    lz = z - plan.oz;
  if (canalAt(plan, x, z)) return crossingAt(plan, z) ? "road" : "water";
  if (Math.abs(lx - 144) <= 8 && lz > -234 && lz < 144) return "road";
  if (roadAt(plan, x, z, 2)) return "road";
  for (const st of plan.byChunk.get(
    `${Math.floor(x / 16)},${Math.floor(z / 16)}`,
  ) ?? [])
    if (contains(st, x, z))
      return st.kind === "garden"
        ? "garden"
        : st.kind === "panda-plaza"
          ? "plaza"
          : "building";
  if (plan.alleys.some((r) => contains(r, x, z))) return "road";
  return parkAt(plan, x, z) ||
    districtAt(lx, lz) === DISTRICTS[7] ||
    hash(Math.floor(lx / 48), Math.floor(lz / 48), plan.seed + 901) < 0.12
    ? "garden"
    : "court";
}
