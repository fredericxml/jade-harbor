import { B } from "../blocks";
import type { Rect } from "../city/plan";
import { VoxelWriter } from "../city/writer";
import { footprintDistance } from "../geography/geometry";
import type { MacroPlan } from "../geography/plan";
import { sampleTerrain } from "../geography/terrain";
import { segmentSample } from "./routes";
import type { Component, Hall, Palette, RealizationPlan, RoofKind, RouteSegment, Tower, WallSegment } from "./types";

const AIR = B.Air;
function columns(w: VoxelWriter, r: Rect, fn: (x: number, z: number) => void) {
  for (let z = Math.max(w.oz, Math.ceil(r.z1)); z <= Math.min(w.oz + 15, Math.floor(r.z2)); z++)
    for (let x = Math.max(w.ox, Math.ceil(r.x1)); x <= Math.min(w.ox + 15, Math.floor(r.x2)); x++) fn(x, z);
}
function floorColumn(w: VoxelWriter, m: MacroPlan, x: number, z: number, level: number, surface: number, clear: number, bridge = false) {
  const t = sampleTerrain(m, x, z), h = Math.floor(level), half = level % 1 !== 0;
  if (!bridge || !t.water || x % 8 === 0 && z % 4 === 0) w.fill(x, Math.min(t.height, h) - 2, z, x, h, z, B.SculptureStone);
  w.put(x, h, z, surface);
  if (half) w.put(x, h + 1, z, B.Slab);
  if (clear) w.fill(x, h + 1 + Number(half), z, x, Math.max(h + clear, t.height + 12), z, AIR);
}
function roof(w: VoxelWriter, r: Rect, y: number, p: Palette, kind: RoofKind = "hip") {
  if (kind === "double") {
    w.fill(r.x1 - 1, y, r.z1 - 1, r.x2 + 1, y, r.z2 + 1, p.roof);
    w.fill(r.x1 + 1, y + 1, r.z1 + 1, r.x2 - 1, y + 2, r.z2 - 1, p.wall);
    roof(w, { x1: r.x1 + 1, x2: r.x2 - 1, z1: r.z1 + 1, z2: r.z2 - 1 }, y + 3, p, "hip"); return;
  }
  const levels = Math.max(2, Math.min(6, Math.ceil((r.z2 - r.z1 + 1) / 2)));
  for (let k = 0; k < levels; k++) {
    const dz = Math.floor(k * (r.z2 - r.z1 + 3) / (2 * levels));
    const dx = kind === "hip" ? Math.min(k, Math.floor((r.x2 - r.x1) / 2)) : 0;
    w.fill(r.x1 - 1 + dx, y + k, r.z1 - 1 + dz, r.x2 + 1 - dx, y + k, r.z2 + 1 - dz, p.roof);
  }
  w.fill(r.x1 + 1, y + levels, Math.floor((r.z1 + r.z2) / 2), r.x2 - 1, y + levels, Math.floor((r.z1 + r.z2) / 2), p.timber);
  for (const x of [r.x1 - 1, r.x2 + 1]) for (const z of [r.z1 - 1, r.z2 + 1]) w.put(x, y + 1, z, p.accent);
}
function hall(w: VoxelWriter, m: MacroPlan, f: Hall) {
  const r = f.rect, y = f.level, p = f.palette, center = Math.floor((r.x1 + r.x2) / 2);
  if (!f.canopy) columns(w, r, (x, z) => floorColumn(w, m, x, z, y, B.Planks, 0));
  if (!f.open) {
    for (const z of [r.z1, r.z2]) w.fill(r.x1, y + 1, z, r.x2, y + f.height - 1, z, p.wall);
    for (const x of [r.x1, r.x2]) w.fill(x, y + 1, r.z1, x, y + f.height - 1, r.z2, p.wall);
    w.fill(center - 2, y + 1, r.z2, center + 2, y + 4, r.z2, AIR);
    for (let x = r.x1 + 3; x < r.x2 - 2; x += 5) if (Math.abs(x - center) > 3)
      for (const z of [r.z1, r.z2]) w.fill(x, y + 2, z, x + 1, y + 4, z, B.Paper);
  }
  for (const x of [r.x1, r.x2]) for (const z of [r.z1, r.z2]) w.fill(x, y + 1, z, x, y + f.height - 1, z, p.timber);
  for (let x = r.x1; x <= r.x2; x += 8) for (const z of [r.z1, r.z2]) {
    if (z === r.z2 && Math.abs(x - center) <= 2) continue;
    w.fill(x, y + 1 - (f.canopy ? 6 : 0), z, x, y + f.height - 1, z, p.timber);
  }
  for (const z of [r.z1, r.z2]) w.fill(r.x1, y + f.height - 1, z, r.x2, y + f.height - 1, z, p.timber);
  roof(w, r, y + f.height, p, f.roof);
  if (f.dais) {
    w.fill(center - 3, y + 1, r.z1 + 2, center + 3, y + 1, r.z1 + 3, B.Marble);
    w.put(center - 3, y + 2, r.z1 + 2, B.Pottery); w.put(center + 3, y + 2, r.z1 + 2, B.Pottery);
  }
  if (!f.open) for (const x of [center - 3, center + 3]) w.put(x, y + f.height - 2, r.z2 + 1, B.Lantern);
}

/** Two flights with a shared landing. The center aisle stays clear; upper
 * flights leave air below, avoiding the stacked-stair defect fixed in Shot 2. */
function towerStairs(w: VoxelWriter, x: number, z: number, floor: number, rise: number, first: boolean) {
  const low = 3 - (rise - 1);
  w.fill(x - 3, floor + rise, z + low, x - 2, floor + rise, z + 3, AIR);
  w.fill(x + 2, floor + rise, z + low, x + 3, floor + rise, z + 3, AIR);
  w.fill(x - 2, floor + rise, z + 3, x + 2, floor + rise, z + 3, AIR);
  const step = (u: number, v: number, n: number) => {
    const h = Math.ceil(n / 2);
    if (first) w.fill(x + u, floor + 1, z + v, x + u + 1, floor + h - 1, z + v, B.Planks);
    w.fill(x + u, floor + h, z + v, x + u + 1, floor + h, z + v, n % 2 ? B.Slab : B.Planks);
    w.fill(x + u, floor + h + 1, z + v, x + u + 1, floor + h + 3, z + v, AIR);
  };
  for (let n = 1; n <= rise; n++) step(-3, low + n - 1, n);
  const landing = floor + Math.ceil(rise / 2);
  w.fill(x - 2, landing, z + 3, x + 1, landing, z + 3, rise % 2 ? B.Slab : B.Planks);
  w.fill(x - 2, landing + 1, z + 3, x + 1, landing + 3, z + 3, AIR);
  for (let n = 1; n <= rise; n++) step(2, 4 - n, rise + n);
}
function tower(w: VoxelWriter, m: MacroPlan, f: Tower) {
  const { x, z } = f.center, base = Math.ceil(f.level), p = f.palette;
  if (!f.stairs) {
    // A ridge guardroom retains the continuously graded wall floor beneath it.
    // Open axial passages keep entry safe even on sloping tower locations.
    const r = Math.floor(f.width / 2);
    for (const dx of [-r, r]) for (const dz of [-r, r]) {
      const ground = sampleTerrain(m, x + dx, z + dz).height;
      w.fill(x + dx, Math.min(ground, base) - 2, z + dz, x + dx, base + 5, z + dz, p.wall);
    }
    for (const dz of [-r, r]) for (let dx = -r; dx <= r; dx++) if (Math.abs(dx) > 2) w.fill(x + dx, base + 1, z + dz, x + dx, base + 2, z + dz, p.wall);
    for (const dx of [-r, r]) for (let dz = -r; dz <= r; dz++) if (Math.abs(dz) > 2) w.fill(x + dx, base + 1, z + dz, x + dx, base + 2, z + dz, p.wall);
    roof(w, { x1: x - r, x2: x + r, z1: z - r, z2: z + r }, base + 6, p, "double"); return;
  }
  for (let level = 0; level < f.levels; level++) {
    const y = base + level * f.story, r = Math.floor(f.width / 2) - (f.taper ? level : 0);
    const rr = { x1: x - r, x2: x + r, z1: z - r, z2: z + r };
    if (!level) columns(w, rr, (wx, wz) => floorColumn(w, m, wx, wz, y, B.Marble, 0));
    else w.fill(rr.x1, y, rr.z1, rr.x2, y, rr.z2, B.Planks);
    for (const dz of [-r, r]) w.fill(x - r, y + 1, z + dz, x + r, y + f.story - 1, z + dz, p.wall);
    for (const dx of [-r, r]) w.fill(x + dx, y + 1, z - r, x + dx, y + f.story - 1, z + r, p.wall);
    for (const dz of [-r, r]) w.fill(x - 1, y + 1, z + dz, x + 1, y + 4, z + dz, AIR);
    for (const dx of [-r, r]) w.fill(x + dx, y + 1, z - 1, x + dx, y + 4, z + 1, AIR);
    for (const dx of [-r, r]) for (const dz of [-r, r]) w.fill(x + dx, y + 1, z + dz, x + dx, y + f.story - 1, z + dz, p.timber);
    // Intermediate eaves project outside the core without filling its stairwell.
    if (level < f.levels - 1) {
      for (const dz of [-r - 1, r + 1]) w.fill(x - r - 1, y + f.story - 1, z + dz, x + r + 1, y + f.story - 1, z + dz, p.roof);
      for (const dx of [-r - 1, r + 1]) w.fill(x + dx, y + f.story - 1, z - r - 1, x + dx, y + f.story - 1, z + r + 1, p.roof);
    } else roof(w, rr, y + f.story, p, "hip");
  }
  for (let level = 0; level < f.levels - 1; level++) towerStairs(w, x, z, base + level * f.story, f.story, level === 0);
  const cap = base + f.levels * f.story + 5;
  if (f.finial) w.fill(x, cap, z, x, cap + 3, z, B.GoldTrim);
  for (const dx of [-2, 2]) w.put(x + dx, base + (f.levels - 1) * f.story + f.story - 2, z + 1, B.Lantern);
}

function drawComponent(w: VoxelWriter, m: MacroPlan, c: Component) {
  if (c.kind === "plinth") { columns(w, c.bounds, (x, z) => { if (footprintDistance(c.footprint, x, z) <= 0) floorColumn(w, m, x, z, c.level, c.surface, c.clear); }); return; }
  if (c.kind === "hall") return hall(w, m, c);
  if (c.kind === "tower") return tower(w, m, c);
  if (c.kind === "gate") {
    const r = c.rect, y = c.level, cx = Math.floor((r.x1 + r.x2) / 2), half = Math.floor(c.opening / 2);
    columns(w, r, (x, z) => floorColumn(w, m, x, z, y, B.Marble, 0));
    w.fill(r.x1, y + 1, r.z1, r.x2, y + c.height - 1, r.z2, c.palette.wall);
    w.fill(cx - half, y + 1, r.z1, cx + half, y + Math.min(5, c.height - 1), r.z2, AIR);
    for (const x of [r.x1, r.x2]) w.fill(x, y + 1, r.z1, x, y + c.height - 1, r.z2, c.palette.timber);
    roof(w, r, y + c.height, c.palette, "double"); return;
  }
  if (c.kind === "boundary") {
    const r = c.rect, y = c.level;
    for (const x of [r.x1, r.x2]) w.fill(x, y + 1, r.z1, x, y + c.height, r.z2, c.palette.wall);
    for (const z of [r.z1, r.z2]) { w.fill(r.x1, y + 1, z, r.x2, y + c.height, z, c.palette.wall); w.fill(r.x1, y + c.height + 1, z, r.x2, y + c.height + 1, z, c.palette.roof); }
    const cx = Math.floor((r.x1 + r.x2) / 2);
    w.fill(cx - c.entrance, y + 1, r.z2, cx + c.entrance, y + c.height + 1, r.z2, AIR); return;
  }
  if (c.kind === "pit") {
    const r = c.rect;
    w.fill(r.x1, c.floor - 2, r.z1, r.x2, c.floor, r.z2, B.Terracotta);
    w.fill(r.x1, c.floor + 1, r.z1, r.x2, c.rim + 3, r.z2, AIR);
    for (const x of [r.x1 - 1, r.x2 + 1]) { w.fill(x, c.floor, r.z1 - 1, x, c.rim, r.z2 + 1, B.SculptureStone); w.fill(x, c.rim + 1, r.z1, x, c.rim + 1, r.z2, B.Fence); }
    for (const z of [r.z1 - 1, r.z2 + 1]) { w.fill(r.x1 - 1, c.floor, z, r.x2 + 1, c.rim, z, B.SculptureStone); w.fill(r.x1, c.rim + 1, z, r.x2, c.rim + 1, z, B.Fence); }
    if (c.stairsZ !== null) w.fill(r.x2 + 1, c.rim + 1, c.stairsZ - 1, r.x2 + 1, c.rim + 2, c.stairsZ + 1, AIR); return;
  }
  if (c.kind === "figure") {
    const { x, z } = c.center, y = c.level;
    w.fill(x, y + 1, z, x, y + 3, z, B.Terracotta);
    w.fill(x - 1, y + 2, z, x + 1, y + 2, z, B.Terracotta);
    w.put(x, y + 4, z, c.variant === 0 ? B.DarkTimber : B.Terracotta); return;
  }
  if (c.kind === "grotto") {
    const x = c.center.x, z = c.center.z, y = c.level;
    columns(w, { x1: x - 12, x2: x + 12, z1: z + 2, z2: z + 4 }, (wx, wz) => floorColumn(w, m, wx, wz, y, B.Paving, 8));
    w.fill(x - 12, y + 1, z + 2, x + 12, y + 12, z + 2, B.SculptureStone);
    for (const dx of [-7, 7]) {
      w.fill(x + dx - 3, y - 2, z - 2, x + dx + 3, y, z + 2, B.Marble);
      w.fill(x + dx - 3, y + 1, z - 2, x + dx + 3, y + 8, z + 2, AIR);
      w.fill(x + dx - 2, y + 9, z - 1, x + dx + 2, y + 9, z + 2, AIR);
      w.fill(x + dx - 3, y + 10, z - 2, x + dx + 3, y + 11, z + 2, B.SculptureStone);
      w.fill(x + dx, y + 1, z - 2, x + dx, y + 4, z - 2, B.Marble);
      w.put(x + dx, y + 5, z - 2, B.Porcelain);
    }
    for (const dx of [-12, -3, 3, 12]) w.fill(x + dx, y + 1, z + 3, x + dx, y + 10, z + 3, B.Marble);
    for (let dx = -12; dx <= 12; dx++) if (Math.abs(dx) > 2) w.put(x + dx, y + 1, z + 4, B.Fence);
    w.put(x, y + 9, z + 3, B.Lantern); return;
  }
  if (c.kind === "garden") {
    const x = c.center.x, z = c.center.z, y = c.level;
    columns(w, { x1: x - 6, x2: x + 5, z1: z - 2, z2: z + 6 }, (wx, wz) => {
      if (((wx - x) / 6) ** 2 + ((wz - z - 2) / 5) ** 2 > 1) return;
      w.put(wx, y - 2, wz, B.Moss); w.fill(wx, y - 1, wz, wx, y, wz, B.Water);
    });
    for (let dx = -5; dx <= 6; dx++) for (let dz = 1; dz <= 3; dz++) {
      const level = y + (dx === -5 || dx === 6 ? .5 : 1), h = Math.floor(level);
      w.put(x + dx, h, z + dz, B.Planks); if (level % 1) w.put(x + dx, h + 1, z + dz, B.Slab);
    }
    w.put(x - 3, y + 1, z + 5, B.Lotus); w.put(x + 3, y + 1, z - 1, B.Lotus);
    w.fill(x + 2, y + 1, z - 8, x + 3, y + 3, z - 7, B.SculptureStone);
    w.fill(x + 8, y + 1, z - 4, x + 8, y + 4, z - 4, B.DarkTimber);
    for (let dy = 0; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++)
      if (dx * dx + dz * dz + dy * dy < 9) w.put(x + 8 + dx, y + 4 + dy, z - 4 + dz, B.Leaves);
  }
}

/** A per-column nearest-centerline decision avoids cap overlaps producing two
 * stair surfaces. Only references from the current chunk's bounded index enter. */
function ribbons(w: VoxelWriter, m: MacroPlan, items: readonly (RouteSegment | WallSegment)[]) {
  if (!items.length) return;
  for (let z = w.oz; z < w.oz + 16; z++) for (let x = w.ox; x < w.ox + 16; x++) {
    let best: { component: RouteSegment | WallSegment; sample: ReturnType<typeof segmentSample> } | undefined;
    for (const c of items) {
      const q = segmentSample(c.a, c.b, x, z);
      if (q.distance <= c.half && (!best || q.distance < best.sample.distance - 1e-8)) best = { component: c, sample: q };
    }
    if (!best) continue;
    const { component: c, sample: q } = best;
    if (c.kind === "wall") {
      floorColumn(w, m, x, z, q.y, B.SculptureStone, 5);
      const top = Math.ceil(q.y) + 1;
      if (q.distance > c.half - 1.2) {
        w.put(x, top, z, B.SculptureStone);
        if (Math.floor(q.along / 3) % 2 === 0) w.put(x, top + 1, z, B.SculptureStone);
      }
    } else {
      floorColumn(w, m, x, z, q.y, c.surface, c.clear, c.bridge);
      if (c.rail && q.distance > c.half - .2) w.put(x, Math.ceil(q.y) + 1, z, B.Fence);
    }
  }
}

export function drawLandmarks(w: VoxelWriter, m: MacroPlan, plan: RealizationPlan, cx: number, cz: number) {
  const items = plan.byChunk.get(`${cx},${cz}`) ?? [];
  for (const order of [...new Set(items.map(c => c.order))]) {
    const group = items.filter(c => c.order === order), roads = group.filter((c): c is RouteSegment | WallSegment => c.kind === "route" || c.kind === "wall");
    ribbons(w, m, roads);
    for (const c of group) if (c.kind !== "route" && c.kind !== "wall") drawComponent(w, m, c);
  }
}

export function landmarkAt(plan: RealizationPlan, x: number, z: number) {
  const component = plan.byChunk.get(`${Math.floor(x / 16)},${Math.floor(z / 16)}`)?.find(c =>
    x >= c.bounds.x1 && x <= c.bounds.x2 && z >= c.bounds.z1 && z <= c.bounds.z2);
  return component ? plan.sites.find(s => s.id === component.site) : undefined;
}
