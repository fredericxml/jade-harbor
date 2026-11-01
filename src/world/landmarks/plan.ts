import { B } from "../blocks";
import type { Rect } from "../city/plan";
import { footprintBounds, footprintDistance, type Footprint, type Point } from "../geography/geometry";
import type { LandmarkPlan } from "../geography/landmarks";
import type { MacroPlan } from "../geography/plan";
import { sampleTerrain } from "../geography/terrain";
import { nearestRoadPoint, roadElevation, type UrbanPlan } from "../metropolis/plan";
import { GARDEN, HARBOR, IMPERIAL, LANDMARK_REGISTRY, STONE } from "./registry";
import { gradeTrail, ridgeProfile, terrainWaypoints } from "./routes";
import type { Approach, Component, Hall, LandmarkId, LandmarkInstance, Palette, Position, RealizationPlan, RouteNode } from "./types";

const rect = (x1: number, z1: number, x2: number, z2: number): Rect => ({ x1, z1, x2, z2 });
const area = (bounds: Rect): Footprint => ({ kind: "area", bounds });
const circle = (x: number, z: number, radius: number): Footprint => ({ kind: "point", center: { x, z }, radius });
const expand = (r: Rect, pad: number): Rect => ({ x1: r.x1 - pad, x2: r.x2 + pad, z1: r.z1 - pad, z2: r.z2 + pad });
const position = (x: number, y: number, z: number): Position => ({ x, y, z });

/** Consumes the already-resolved geographic reservation plan. No candidate search, extra
 * reservation ownership or eager voxel construction is introduced here. */
export function createRealizationPlan(m: MacroPlan, reservations: LandmarkPlan, urban: UrbanPlan): RealizationPlan {
  const components: Component[] = [], sites: LandmarkInstance[] = [], approaches: Approach[] = [];
  let current: LandmarkId = "imperial-complex", sequence = 0;
  const base = (name: string, bounds: Rect, order = 20) => ({ id: `${current}:${name}`, site: current, bounds, order });
  const add = (component: Component) => { components.push(component); if (components.length > 10000) throw Error("Landmark component budget exceeded"); };
  const ground = (x: number, z: number) => sampleTerrain(m, x, z).height;
  const street = (x: number, z: number) => {
    const road = urban.roads.find(r => nearestRoadPoint(r, x, z).distance <= r.half + .1);
    return road ? roadElevation(m, road, x, z) : ground(x, z);
  };
  const plinth = (name: string, footprint: Footprint, level: number, surface: number = B.Paving, clear = 16) =>
    add({ ...base(name, footprintBounds(footprint), clear ? 0 : 22), kind: "plinth", footprint, level, surface, clear });
  const hall = (name: string, r: Rect, level: number, height: number, palette: Palette, options: Partial<Pick<Hall, "open" | "canopy" | "dais" | "roof">> = {}) =>
    add({ ...base(name, expand(r, 1), 30), kind: "hall", rect: r, level, height, palette, roof: "hip", open: false, canopy: false, dais: false, ...options });
  const gate = (name: string, r: Rect, level: number, palette: Palette, height = 7, opening = 3) =>
    add({ ...base(name, expand(r, 1), 30), kind: "gate", rect: r, level, palette, height, opening });
  const trail = (id: string, connection: string, points: readonly Point[], start: number, end: number, half = 1.5, surface: number = B.Gravel, bridge = false, order = 10) => {
    const excluded = reservations.reservations.filter(r => r.id !== `${current}-reserve` &&
      footprintDistance(r.footprint, points[0].x, points[0].z) > r.margin + 3 &&
      footprintDistance(r.footprint, points[points.length - 1].x, points[points.length - 1].z) > r.margin + 3);
    const blocked = (x: number, z: number) => excluded.some(r => footprintDistance(r.footprint, x, z) <= r.margin + half + 1) ||
      urban.districts.some(d => x >= d.bounds.x1 && x <= d.bounds.x2 && z >= d.bounds.z1 && z <= d.bounds.z2) &&
      urban.lots.some(l => x >= l.envelope.x1 - half - 1 && x <= l.envelope.x2 + half + 1 && z >= l.envelope.z1 - half - 1 && z <= l.envelope.z2 + half + 1);
    const alignment = (order === 10 || id === "ridge-entry") && !bridge ? terrainWaypoints(m, points, blocked) : points;
    const nodes = gradeTrail(m, alignment, start, end);
    approaches.push({ id, site: current, connection, nodes, half, surface });
    for (let i = 1; i < nodes.length; i++) {
      const a = nodes[i - 1], b = nodes[i], bounds = expand(rect(Math.min(a.x, b.x), Math.min(a.z, b.z), Math.max(a.x, b.x), Math.max(a.z, b.z)), half + 1);
      add({ ...base(`${id}:${i}`, bounds, order), kind: "route", a, b, half, surface, bridge, rail: bridge, clear: 6 });
    }
    return nodes;
  };
  const tower = (name: string, x: number, z: number, level: number, width: number, levels: number, story: number,
    palette: Palette, taper = false, stairs = true, finial = false) => {
    const radius = Math.floor(width / 2) + 1;
    add({ ...base(name, rect(x - radius, z - radius, x + radius, z + radius), 30), kind: "tower", center: { x, z },
      level, width, levels, story, palette, taper, stairs, finial });
  };
  const site = (id: LandmarkId, level: number, entry: Position, publicSpaces: Position[], viewpoints: Position[]) => {
    const spec = LANDMARK_REGISTRY.find(r => r.id === id)!;
    const reservation = reservations.reservations.find(r => r.id === spec.reservation);
    if (!reservation) throw Error(`Missing mandatory reservation: ${spec.reservation}`);
    current = id; sequence = components.length;
    const value: LandmarkInstance = { id, name: spec.name, reservation, level, entry, publicSpaces, viewpoints, componentIds: [] };
    sites.push(value); return value;
  };
  const finish = (value: LandmarkInstance) => { value.componentIds = components.slice(sequence).map(c => c.id); };

  // Palace: three public thresholds, two main courts and a distinct rear zone.
  let s = site("imperial-complex", 35, position(0, 35, -402), [position(0, 35, -423), position(0, 37, -438)], [position(0, 37, -434)]);
  plinth("palace-ground", area(rect(-62, -456, 62, -404)), 35);
  add({ ...base("enclosure", rect(-62, -456, 62, -404), 25), kind: "boundary", rect: rect(-62, -456, 62, -404), level: 35, height: 5, palette: IMPERIAL, entrance: 3 });
  gate("outer-gate", rect(-10, -407, 10, -403), 35, IMPERIAL, 8, 5);
  gate("court-gate", rect(-8, -417, 8, -414), 35, IMPERIAL, 6, 3);
  plinth("marble-axis", area(rect(-2, -433, 2, -405)), 35, B.Marble, 0);
  hall("principal-hall", rect(-23, -445, 23, -435), 37, 9, IMPERIAL, { roof: "double", dais: true });
  hall("western-hall", rect(-56, -444, -36, -422), 35, 6, IMPERIAL, { roof: "gable" });
  hall("eastern-hall", rect(36, -444, 56, -422), 35, 6, IMPERIAL, { roof: "gable" });
  hall("rear-hall", rect(-16, -455, 16, -451), 36, 5, IMPERIAL);
  trail("imperial-axis", "imperial-axis", [{ x: 0, z: -376 }, { x: 0, z: -402 }], street(0, -376), 35, 3, B.Marble);
  trail("hall-stairs", "imperial-axis", [{ x: 0, z: -430 }, { x: 0, z: -435 }], 35, 37, 4, B.Marble, false, 25);
  finish(s);

  // The wall follows the exact accepted corridor; its walk profile never dips
  // into the natural crest. Towers are bounded, indexed parts of that same line.
  const wallWalk = ridgeProfile(m, m.wallRidge), first = wallWalk[0];
  s = site("ridge-fortification", first.y, position(first.x, first.y, first.z), [position(first.x, first.y, first.z)], []);
  for (let i = 1; i < wallWalk.length; i++) {
    const a = wallWalk[i - 1], b = wallWalk[i];
    add({ ...base(`wall:${i}`, expand(rect(Math.min(a.x, b.x), Math.min(a.z, b.z), Math.max(a.x, b.x), Math.max(a.z, b.z)), 4), 15), kind: "wall", a, b, half: 4 });
  }
  const towerIndices = [...new Set([0, ...Array.from({ length: Math.floor((wallWalk.length - 1) / 96) }, (_, i) => (i + 1) * 96), wallWalk.length - 1])];
  const wallViews: Position[] = [];
  for (const i of towerIndices) { const n = wallWalk[i]; tower(`watchtower:${i}`, n.x, n.z, n.y, 9, 1, 6, STONE, false, false); wallViews.push(position(n.x, n.y, n.z)); }
  s.viewpoints = wallViews;
  trail("ridge-entry", "northern-ridge", [{ x: -310, z: -452 }, { x: -310, z: -508 }, { x: -224, z: -508 }, { x: -224, z: -540 }, { x: first.x, z: -540 }, first], street(-310, -452), first.y, 1.5, B.Gravel, false, 25);
  finish(s);

  // Excavation is a public landscape with two bounded pits, viewing rims, a
  // partial protective roof and a research hall, rather than another palace.
  s = site("archaeology", 27, position(-470, 27, 160), [position(-489, 27, 166), position(-505, 21, 167), position(-519, 27, 121)], [position(-534, 27, 136)]);
  plinth("heritage-ground", area(rect(-588, 102, -472, 218)), 27, B.Grass, 14);
  plinth("visitor-walk", area(rect(-490, 126, -476, 199)), 27, B.Paving, 0);
  plinth("cross-walk", area(rect(-584, 130, -478, 137)), 27, B.Paving, 0);
  for (const [name, r, stairsZ] of [["west-pit", rect(-583, 140, -540, 194), null], ["east-pit", rect(-528, 145, -494, 193), 167]] as const) {
    add({ ...base(name, expand(r, 1), 20), kind: "pit", rect: r, rim: 27, floor: 21, stairsZ });
    for (let z = r.z1 + 5; z < r.z2 - 2; z += 6) for (let x = r.x1 + 4; x < r.x2 - 2; x += 6) {
      if (stairsZ !== null && Math.abs(z - stairsZ) < 3 && x > -509) continue;
      add({ ...base(`figure:${x}:${z}`, rect(x - 1, z - 1, x + 1, z + 1), 40), kind: "figure", center: { x, z }, level: 21, variant: (x + z) % 3 });
    }
  }
  hall("protective-canopy", rect(-584, 139, -539, 164), 27, 13, STONE, { open: true, canopy: true, roof: "gable" });
  hall("research-hall", rect(-542, 108, -496, 125), 27, 6, GARDEN, { roof: "gable", dais: true });
  trail("archaeology-road", "archaeology-road", [{ x: -435, z: 160 }, { x: -470, z: 160 }], street(-435, 160), 27, 2, B.Paving);
  trail("pit-stairs", "archaeology-road", [{ x: -492, z: 167 }, { x: -505, z: 167 }], 27, 21, 1, B.Planks, false, 25);
  finish(s);

  s = site("harbor-front", 20, position(200, 20, 340), [position(200, 20, 348)], [position(200, 34, 349)]);
  plinth("quay-plinth", circle(200, 349, 10), 20, B.Marble, 34);
  tower("guild-beacon", 200, 349, 20, 13, 3, 7, HARBOR, true, true, true);
  trail("harbor-approach", "harbor-approach", [{ x: 176, z: 340 }, { x: 200, z: 340 }, { x: 200, z: 343 }], street(176, 340), 20, 2, B.Paving, true);
  trail("harbor-promenade", "harbor-promenade", [{ x: 224, z: 340 }, { x: 200, z: 340 }], street(224, 340), 20, 2, B.Paving, true);
  finish(s);

  const templeY = ground(-660, -250);
  s = site("mountain-temple", templeY, position(-660, templeY, -234), [position(-660, templeY, -244), position(-660, templeY + 2, -257)], [position(-648, templeY + 1, -250)]);
  plinth("sanctuary-terrace", circle(-660, -250, 15), templeY, B.Moss, 18);
  gate("trail-gate", rect(-663, -240, -657, -238), templeY, GARDEN, 5, 3);
  hall("sanctuary-hall", rect(-667, -261, -653, -252), templeY + 2, 6, GARDEN, { roof: "double", dais: true });
  plinth("overlook", area(rect(-650, -253, -647, -247)), templeY + 1, B.Paving, 0);
  trail("sanctuary-steps", "western-temple-trail", [{ x: -660, z: -246 }, { x: -660, z: -252 }], templeY, templeY + 2, 2, B.Paving, false, 25);
  trail("overlook-step", "western-temple-trail", [{ x: -652, z: -250 }, { x: -650, z: -250 }], templeY, templeY + 1, 1, B.Paving, false, 25);
  trail("western-temple-trail", "archaeology-road", [{ x: -435, z: 160 }, { x: -435, z: 80 }, { x: -620, z: 80 }, { x: -620, z: -110 }, { x: -660, z: -210 }, { x: -660, z: -234 }], street(-435, 160), templeY);
  finish(s);

  s = site("cliff-grotto", 44, position(620, 44, -426), [position(613, 44, -430), position(627, 44, -430)], [position(620, 44, -427)]);
  add({ ...base("cliff-chambers", rect(608, -434, 632, -426), 30), kind: "grotto", center: { x: 620, z: -430 }, level: 44 });
  const crossing = m.connections.find(c => c.id === "east-crossing")!;
  const east = crossing.points[crossing.points.length - 1];
  trail("east-crossing", "east-crossing", crossing.points, 20, ground(east.x, east.z), 2, B.Planks, true);
  trail("cliff-approach", "cliff-approach", [east, { x: 530, z: 208 }, { x: 530, z: -280 }, { x: 620, z: -400 }, { x: 620, z: -426 }], ground(east.x, east.z), 44);
  finish(s);

  const scenicY = ground(-735, -250);
  s = site("scenic-landscape", scenicY, position(-723, scenicY, -250), [position(-735, scenicY + 1, -248)], [position(-739, scenicY, -255)]);
  plinth("garden-ground", circle(-735, -250, 11), scenicY, B.Grass, 10);
  add({ ...base("pond-causeway", rect(-746, -261, -724, -239), 25), kind: "garden", center: { x: -735, z: -250 }, level: scenicY, radius: 11 });
  hall("waterside-pavilion", rect(-741, -257, -737, -253), scenicY, 5, GARDEN, { open: true });
  trail("scenic-link", "western-temple-trail", [{ x: -674, z: -250 }, { x: -723, z: -250 }], templeY, scenicY);
  finish(s);

  const viewY = ground(-660, -325) + 1;
  s = site("western-viewpoint", viewY, position(-660, viewY, -317), [position(-660, viewY, -325)], [position(-660, viewY + 12, -325)]);
  plinth("lookout-plinth", circle(-660, -325, 7), viewY, B.Paving, 28);
  tower("lookout-pagoda", -660, -325, viewY, 9, 3, 6, GARDEN);
  trail("western-viewpoint-trail", "western-temple-trail", [{ x: -674, z: -250 }, { x: -683, z: -250 }, { x: -683, z: -305 }, { x: -660, z: -305 }, { x: -660, z: -317 }], templeY, viewY);
  finish(s);

  components.sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const byChunk = new Map<string, Component[]>();
  for (const c of components) for (let z = Math.floor(c.bounds.z1 / 16); z <= Math.floor(c.bounds.z2 / 16); z++)
    for (let x = Math.floor(c.bounds.x1 / 16); x <= Math.floor(c.bounds.x2 / 16); x++) {
      const key = `${x},${z}`, list = byChunk.get(key) ?? []; list.push(c); byChunk.set(key, list);
    }
  let maxCut = 0, maxFill = 0;
  for (const a of approaches) for (const p of a.nodes) { const delta = p.y - ground(p.x, p.z); maxCut = Math.max(maxCut, -delta); maxFill = Math.max(maxFill, delta); }
  const diagnostics = { components: components.length, indexedChunks: byChunk.size, maxReferences: Math.max(...[...byChunk.values()].map(a => a.length)),
    routeNodes: approaches.reduce((n, a) => n + a.nodes.length, 0), maxCut, maxFill };
  if (byChunk.size > 5000 || diagnostics.maxReferences > 256 || diagnostics.routeNodes > 12000) throw Error("Landmark spatial budget exceeded");
  return { sites, components, byChunk, approaches, wallWalk, diagnostics };
}
