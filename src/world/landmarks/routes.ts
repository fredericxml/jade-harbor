import type { Point } from "../geography/geometry";
import type { MacroPlan } from "../geography/plan";
import { sampleTerrain } from "../geography/terrain";
import type { RouteNode } from "./types";

/** Four-neighbor rasterization gives every half-height riser a full block of run.
 * This is finite plan metadata, not generated terrain or a world-coordinate cache. */
export function rasterPath(points: readonly Point[]): Point[] {
  const result: Point[] = [], seen = new Map<string, number>();
  const append = (x: number, z: number) => {
    const key = `${x},${z}`, previous = seen.get(key);
    if (previous !== undefined) {
      while (result.length > previous + 1) { const removed = result.pop()!; seen.delete(`${removed.x},${removed.z}`); }
      return;
    }
    seen.set(key, result.length); result.push({ x, z });
  };
  for (let i = 1; i < points.length; i++) {
    let x = Math.round(points[i - 1].x), z = Math.round(points[i - 1].z);
    const tx = Math.round(points[i].x), tz = Math.round(points[i].z), dx = Math.abs(tx - x), dz = Math.abs(tz - z);
    const sx = Math.sign(tx - x), sz = Math.sign(tz - z); let error = dx - dz;
    if (!result.length) append(x, z);
    while (x !== tx || z !== tz) {
      const e = error * 2;
      if (e > -dz && x !== tx) { error -= dz; x += sx; append(x, z); }
      if (e < dx && z !== tz) { error += dx; z += sz; append(x, z); }
      if (result.length > 12000) throw Error("Landmark route budget exceeded");
    }
  }
  return result;
}

/** Project the natural profile onto a half-step grade with exact endpoint levels.
 * Public surfaces are quantized once, so all chunks share identical junctions. */
export function gradeTrail(m: MacroPlan, points: readonly Point[], start: number, end: number): RouteNode[] {
  const path = rasterPath(points), n = path.length - 1;
  if (n < 1 || Math.abs(end - start) > n * .5) throw Error("Insufficient landmark stair run");
  const y = path.map((p, i) => {
    const t = sampleTerrain(m, p.x, p.z), natural = t.water ? 20 : t.elevation;
    return Math.max(start - i * .5, end - (n - i) * .5, Math.min(natural, start + i * .5, end + (n - i) * .5));
  });
  y[0] = start; y[n] = end;
  for (let i = 1; i <= n; i++) y[i] = Math.max(y[i - 1] - .5, Math.min(y[i], y[i - 1] + .5));
  for (let i = n - 1; i >= 0; i--) y[i] = Math.max(y[i + 1] - .5, Math.min(y[i], y[i + 1] + .5));
  return path.map((p, i) => ({ ...p, y: Math.round(y[i] * 2) / 2, distance: i }));
}

export function ridgeProfile(m: MacroPlan, points: readonly Point[]): RouteNode[] {
  const path = rasterPath(points), y = path.map(p => sampleTerrain(m, p.x, p.z).height + 6);
  // A Lipschitz majorant keeps the entire wall above the actual ridge, rather
  // than leveling the crest to fit an arbitrary horizontal wall.
  for (let i = 1; i < y.length; i++) y[i] = Math.max(y[i], y[i - 1] - .5);
  for (let i = y.length - 2; i >= 0; i--) y[i] = Math.max(y[i], y[i + 1] - .5);
  return path.map((p, i) => ({ ...p, y: Math.ceil(y[i] * 2) / 2, distance: i }));
}

export function segmentSample(a: RouteNode, b: RouteNode, x: number, z: number) {
  const dx = b.x - a.x, dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
  return { distance: Math.hypot(x - a.x - dx * t, z - a.z - dz * t),
    y: Math.round((a.y + (b.y - a.y) * t) * 2) / 2, along: a.distance + (b.distance - a.distance) * t };
}

/** Bounded contour routing is only used when a direct authored approach would
 * require a deep trench or a tall embankment. The reservation/connection anchors
 * stay fixed. The temporary search grid is discarded after the plan is built. */
export function terrainWaypoints(m: MacroPlan, points: readonly Point[], blocked: (x: number, z: number) => boolean): Point[] {
  const result: Point[] = [points[0]];
  const height = (p: Point) => { const t = sampleTerrain(m, p.x, p.z); return t.water ? 20 : t.height; };
  for (let leg = 1; leg < points.length; leg++) {
    const a = points[leg - 1], b = points[leg], run = Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
    if (run < 40) { result.push(b); continue; }
    let direct = false;
    if (Math.abs(height(a) - height(b)) <= run * .5) {
      const trial = gradeTrail(m, [a, b], height(a), height(b));
      direct = trial.every(p => Math.abs(p.y - height(p)) <= 8);
    }
    if (direct) { result.push(b); continue; }
    let found: Point[] | undefined;
    for (const margin of [64, 128]) {
      const step = 4, x0 = Math.floor((Math.min(a.x, b.x) - margin) / step) * step,
        z0 = Math.floor((Math.min(a.z, b.z) - margin) / step) * step;
      const width = Math.ceil((Math.max(a.x, b.x) + margin - x0) / step) + 1,
        depth = Math.ceil((Math.max(a.z, b.z) + margin - z0) / step) + 1;
      if (width * depth > 65536) throw Error("Landmark contour grid budget exceeded");
      const key = (x: number, z: number) => x + z * width;
      const sx = Math.round((a.x - x0) / step), sz = Math.round((a.z - z0) / step),
        tx = Math.round((b.x - x0) / step), tz = Math.round((b.z - z0) / step), start = key(sx, sz), target = key(tx, tz);
      const costs = new Float64Array(width * depth).fill(Infinity), heights = new Float64Array(width * depth).fill(NaN), parents = new Int32Array(width * depth).fill(-1);
      const h = (id: number) => { if (Number.isNaN(heights[id])) heights[id] = height({ x: x0 + (id % width) * step, z: z0 + Math.floor(id / width) * step }); return heights[id]; };
      type Item = { id: number; cost: number; score: number };
      const heap: Item[] = [];
      const less = (a: Item, b: Item) => a.score < b.score || a.score === b.score && a.id < b.id;
      const push = (item: Item) => { let i = heap.length; heap.push(item); while (i) { const p = (i - 1) >> 1; if (!less(item, heap[p])) break; heap[i] = heap[p]; i = p; } heap[i] = item; };
      const pop = () => { const value = heap[0], last = heap.pop()!; if (heap.length) { let i = 0; while (i * 2 + 1 < heap.length) { let c = i * 2 + 1; if (c + 1 < heap.length && less(heap[c + 1], heap[c])) c++; if (!less(heap[c], last)) break; heap[i] = heap[c]; i = c; } heap[i] = last; } return value; };
      const moves = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
        [2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [-1, 2], [1, -2], [-1, -2]];
      costs[start] = 0; push({ id: start, cost: 0, score: 0 }); let expanded = 0;
      while (heap.length && expanded++ < 16000) {
        const item = pop(); if (item.cost !== costs[item.id]) continue;
        if (item.id === target) {
          const path: Point[] = []; let cursor = target;
          while (cursor !== -1) { path.push({ x: x0 + cursor % width * step, z: z0 + Math.floor(cursor / width) * step }); cursor = parents[cursor]; }
          found = [a, ...path.reverse(), b]; break;
        }
        const x = item.id % width, z = Math.floor(item.id / width), here = h(item.id);
        for (const [dx, dz] of moves) {
          const nx = x + dx, nz = z + dz;
          if (nx < 0 || nx >= width || nz < 0 || nz >= depth) continue;
          const next = key(nx, nz), wx = x0 + nx * step, wz = z0 + nz * step;
          if (next !== target && next !== start && blocked(wx, wz)) continue;
          const run = (Math.abs(dx) + Math.abs(dz)) * step, rise = Math.abs(h(next) - here);
          if (rise > run * .5 + 2) continue;
          const slope = rise / Math.max(1, run * .5), water = sampleTerrain(m, wx, wz).water;
          const cost = item.cost + run + run * Math.pow(slope, 4) * 8 + rise + (water ? run : 0);
          if (cost >= costs[next]) continue;
          costs[next] = cost; parents[next] = item.id;
          push({ id: next, cost, score: cost + (Math.abs(tx - nx) + Math.abs(tz - nz)) * step });
        }
      }
      if (found) break;
    }
    if (!found) throw Error("No bounded contour approach between connection anchors");
    result.push(...found.slice(1));
  }
  return result.filter((p, i) => !i || p.x !== result[i - 1].x || p.z !== result[i - 1].z);
}
