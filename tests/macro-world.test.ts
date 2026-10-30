import { describe, expect, it } from "vitest";
import legacyHashes from "./fixtures/generator-v3.json";
import { createGenerator, generateChunk, generatorFor, generatorCacheSizes, terrainHeight } from "../src/world/generator";
import { createMacroPlan } from "../src/world/geography/plan";
import { sampleTerrain, terrainSuitability, cityElevation } from "../src/world/geography/terrain";
import { createV4Generator } from "../src/world/generator-v4";
import { districtTerrain } from "../src/world/geography/city";
import { caveRoofAt, landmarkRequests, protections, resolveReservations, MAX_CANDIDATES, type LandmarkRequest } from "../src/world/geography/landmarks";
import { footprintDistance, footprintsOverlap, type Footprint } from "../src/world/geography/geometry";
import { World } from "../src/world/world";
import { B } from "../src/world/blocks";
import { BlockColumn } from "../src/world/sections";
import { cityPlanCacheSize, cityNear, DISTRICTS, PANDA } from "../src/world/city/plan";
import { PANDA_VOXELS } from "../src/world/city/panda";
import { seedNumber } from "../src/world/noise";
import { moveBody, type Body } from "../src/player/physics";
import { PathSearch } from "../src/game/navigation/pathfinder";

const seed = "jade-harbor", plan = createMacroPlan(seedNumber(seed));
const seeds = [seed, "alternate", "different-city", "", "长江玉港", ...Array.from({ length: 20 }, (_, i) => `macro-${i}`)];
const circle = (x: number, z: number, radius: number): Footprint => ({ kind: "point", center: { x, z }, radius });
async function digest(c: BlockColumn) {
  const data = new Uint8Array(16 * 16 * 384 * 2), view = new DataView(data.buffer); let i = 0;
  for (let y = -64; y <= 319; y++) for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) { view.setUint16(i, c.get(x, y, z), true); i += 2; }
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", data)), b => b.toString(16).padStart(2, "0")).join("");
}
describe("immutable macro plan and geography", () => {
  it("keeps the exact pre-change v3 blocks across cities, mines, underground and signed coordinates", async () => {
    for (const f of legacyHashes) expect(await digest(generateChunk(f.cx, f.cz, f.seed, 3)), JSON.stringify(f)).toBe(f.sha256);
  });
  it("gives every seed a unique stable primary anchor and eight valid reservation sites", () => {
    for (const seed of seeds) {
      const a = createV4Generator(seed), b = createV4Generator(seed);
      expect(a.plan).toEqual(b.plan); expect(a.plan.primary).toEqual({ x: 0, z: 0 });
      expect(a.landmarks).toEqual(b.landmarks); expect(a.landmarks.reservations, seed + JSON.stringify(a.landmarks.diagnostics)).toHaveLength(8);
      expect(a.city.structures.length).toBeGreaterThan(400);
      expect(new Set(a.city.structures.map(s => s.district))).toEqual(new Set(DISTRICTS));
      const visit = (v: unknown) => { if (typeof v === "number") { expect(Number.isFinite(v)).toBe(true); expect(Math.abs(v)).toBeLessThanOrEqual(0xffffffff); } else if (v && typeof v === "object") Object.values(v).forEach(visit); };
      visit(a.plan); expect(Object.isFrozen(a.plan.river[0])).toBe(true);
    }
  });
  it("is independent of query order and cache history, with distinct alternate contours", () => {
    const points = [[-1, -1], [200, 530], [160, -630], [-420, -570], [620, -430], [1e7, -1e7]];
    const before = JSON.stringify(plan), expected = points.map(([x, z]) => terrainSuitability(plan, x, z));
    for (const seed of seeds) generatorFor(seed, 4);
    expect([...points].reverse().map(([x, z]) => terrainSuitability(plan, x, z)).reverse()).toEqual(expected);
    expect(JSON.stringify(plan)).toBe(before);
    expect(createMacroPlan(seedNumber("other")).ridge).not.toEqual(plan.ridge);
    expect(() => createMacroPlan(NaN)).toThrow(); expect(() => sampleTerrain(plan, Infinity, 0)).toThrow();
  });
  it("keeps a varied, bounded terrain domain and usable city elevations", () => {
    const regions = new Set<string>();
    for (let z = -1000; z <= 1000; z += 25) for (let x = -1000; x <= 1000; x += 25) {
      const t = sampleTerrain(plan, x, z); expect(Number.isInteger(t.height)).toBe(true); expect(t.height).toBeGreaterThanOrEqual(5); expect(t.height).toBeLessThan(300); regions.add(t.region);
      if (t.urban) expect([20, 20.5, 21, 21.5, 22, 22.5, 23, 23.5, 24]).toContain(t.elevation);
    }
    for (const region of ["metropolitan-core", "urban-terrace", "harbor-waterfront", "river-corridor", "canal-lowland", "ridge", "cliff", "valley", "imperial-plateau", "archaeology-outskirts", "scenic-protected"]) expect(regions, region).toContain(region);
    expect(terrainSuitability(plan, 0, 24).buildable).toBe(true); expect(terrainSuitability(plan, 350, 70).region).toBe("canal-lowland");
  });
  it("joins a wide harbor to the entire river centerline with no dry seam or urban collision", () => {
    let water = 0;
    for (let z = 400; z <= 650; z += 10) for (let x = 80; x <= 320; x += 10) if (sampleTerrain(plan, x, z).water) water++;
    expect(water).toBeGreaterThan(500);
    for (let i = 1; i < plan.river.length; i++) for (let t = 0; t <= 1; t += .05) {
      const a = plan.river[i - 1], b = plan.river[i], q = sampleTerrain(plan, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t);
      expect(q.water).toBe(true); expect(q.urban).toBe(false); expect(q.height).toBeLessThan(18);
    }
    expect(terrainSuitability(plan, 200, 340).waterfront).toBe(true);
    const w = new World(seed, {}, false, 4); w.ensure(12, 33, true); expect(w.get(200, 18, 530)).toBe(B.Water); w.dispose();
  });
  it("provides a continuous long ridge, a lower pass, a cliff face and protected plateaus", () => {
    let length = 0;
    for (let i = 1; i < plan.wallRidge.length; i++) {
      const a = plan.wallRidge[i - 1], b = plan.wallRidge[i]; length += Math.hypot(b.x - a.x, b.z - a.z);
      for (let t = 0; t <= 1; t += .025) { const q = sampleTerrain(plan, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t); expect(q.region).toBe("ridge"); expect(q.height).toBeGreaterThan(100); }
    }
    expect(length).toBeGreaterThan(500); expect(sampleTerrain(plan, -420, -570).height).toBeLessThan(50);
    expect(sampleTerrain(plan, -420, -570).region).toBe("valley");
    expect(sampleTerrain(plan, 620, -440).height - sampleTerrain(plan, 620, -420).height).toBeGreaterThan(45);
    expect(sampleTerrain(plan, 620, -430).region).toBe("cliff"); expect(sampleTerrain(plan, -660, -250).scenic).toBe(true);
    expect(sampleTerrain(plan, 0, -430).height).toBe(35); expect(sampleTerrain(plan, -530, 160).height).toBe(27);
  });
});
describe("landmark reservations", () => {
  const requests = landmarkRequests(plan);
  it("supports real point, area and linear footprints including margins and negative coordinates", () => {
    const line: Footprint = { kind: "corridor", points: [{ x: -100, z: -100 }, { x: 100, z: 100 }], halfWidth: 2 };
    expect(footprintsOverlap(line, circle(0, 40, 3))).toBe(false);
    expect(footprintsOverlap(line, circle(-4, -4, 3))).toBe(true);
    expect(footprintsOverlap(circle(0, 0, 2), circle(9, 0, 2), 5)).toBe(true);
    expect(footprintsOverlap(circle(0, 0, 2), circle(9, 0, 2), 4.9)).toBe(false);
    expect(footprintsOverlap({ kind: "area", bounds: { x1: -4, x2: 4, z1: -4, z2: 4 } }, circle(0, 0, 1))).toBe(true);
    expect(footprintDistance(line, -10, -10)).toBe(-2);
  });
  it("resolves priority and fallback deterministically without overlaps or caller mutation", () => {
    const base = requests.find(r => r.id === "archaeology-reserve")!;
    const conflict: LandmarkRequest = { ...base, id: "fallback", priority: 40, candidates: [
      { anchor: { x: 0, z: -48 }, footprint: circle(0, -48, 4) },
      { anchor: { x: -530, z: 160 }, footprint: circle(-530, 160, 4) },
    ] };
    const input = [conflict], before = JSON.stringify(input);
    const result = resolveReservations(plan, input); expect(result.diagnostics[0].status).toBe("repositioned"); expect(result.diagnostics[0].attempts).toBe(2);
    expect(result.diagnostics[0].reasons[0]).toContain("panda"); expect(JSON.stringify(input)).toBe(before); expect(Object.isFrozen(input)).toBe(false);
    const a = resolveReservations(plan, [...requests, conflict]), b = resolveReservations(plan, [...requests, conflict].reverse()); expect(a).toEqual(b);
    expect(a.diagnostics.find(d => d.id === "fallback")?.status).toBe("rejected");
    for (let i = 0; i < a.reservations.length; i++) for (let j = i + 1; j < a.reservations.length; j++)
      expect(footprintsOverlap(a.reservations[i].footprint, a.reservations[j].footprint, a.reservations[i].margin + a.reservations[j].margin)).toBe(false);
  });
  it("protects Panda, core, waterways, routes, districts, scenery and the mine explicitly", () => {
    const base = requests[0];
    const sites = [[0, -48, "panda-plaza"], [0, 0, "primary-city"], [plan.river[3].x, 0, "major-river"], [100, 530, "harbor"],
      [0, -350, "imperial-axis"], [40, -430, "imperial-expansion"], [-660, -250, "western-scenic"], [360, 72, "eastern-timber-mine"]] as const;
    for (const [x, z, expected] of sites) {
      const r = { ...base, district: undefined, connections: [], candidates: [{ anchor: { x, z }, footprint: circle(x, z, 2) }] };
      expect(resolveReservations(plan, [r]).diagnostics[0].reasons[0], expected).toContain(expected);
    }
    expect(protections(plan).some(p => p.kind === "district")).toBe(true);
  });
  it("bounds search and terrain sampling and rejects malformed or duplicate inputs", () => {
    expect(() => resolveReservations(plan, [requests[0], requests[0]])).toThrow();
    expect(() => resolveReservations(plan, [{ ...requests[0], margin: NaN }])).toThrow();
    expect(() => resolveReservations(plan, [{ ...requests[0], candidates: Array(MAX_CANDIDATES + 1).fill(requests[0].candidates[0]) }])).toThrow();
    expect(() => resolveReservations(plan, Array(65).fill(requests[0]))).toThrow();
    const giant = { ...requests[0], candidates: [{ anchor: { x: 10000, z: 10000 }, footprint: circle(10000, 10000, 3000) }] };
    expect(resolveReservations(plan, [giant]).diagnostics[0].reasons).toContain("0:terrain-sample-budget");
  });
  it("enforces terrain constraints instead of accepting a reservation on incompatible land", () => {
    const r = requests.find(r => r.type === "mountain")!;
    expect(resolveReservations(plan, [{ ...r, elevation: [200, 220] }]).diagnostics[0].status).toBe("rejected");
    expect(resolveReservations(plan, [{ ...r, ridge: true }]).diagnostics[0].reasons[0]).toContain("ridge");
    expect(resolveReservations(plan, [{ ...r, water: "adjacent" }]).diagnostics[0].reasons[0]).toContain("water-adjacency");
  });
  it("protects landmark foundations while leaving grotto geology natural", () => {
    const result = resolveReservations(plan, requests);
    expect(caveRoofAt(result, 0, -430, 7)).toBe(16); expect(caveRoofAt(result, 620, -430, 7)).toBe(7);
    const g = createV4Generator(seed), c = g.generate(0, -27), h = g.terrainHeight(0, -430);
    for (let y = h - 15; y < h - 4; y++) expect(c.get(0, y, 2)).not.toBe(B.Air);
  });
});
describe("city integration and lifecycle", () => {
  it("preserves Panda blocks and all protected structure families; district contracts feed parcel elevations", () => {
    const w = new World(seed, {}, false, 4), city = w.cityPlan!;
    for (const [x, y, z, id] of PANDA_VOXELS) { const wx = x + PANDA.x, wz = z + PANDA.z; w.ensure(Math.floor(wx / 16), Math.floor(wz / 16), true); expect(w.get(wx, y + PANDA.base, wz)).toBe(id); }
    for (const kind of ["panda-plaza", "pagoda", "civic", "market-hall", "garden", "courtyard", "workshop", "gate"]) expect(city.structures.some(s => s.kind === kind)).toBe(true);
    expect(new Set(city.structures.map(s => s.baseY))).toEqual(new Set([20, 24]));
    for (const d of plan.districts) { const result = districtTerrain(plan, d.id); expect(result.terrain.height).toBeGreaterThanOrEqual(d.elevation[0]); expect(result.terrain.height).toBeLessThanOrEqual(d.elevation[1]); }
    const raised = city.structures.find(s => s.baseY === 24 && s.kind === "home")!;
    w.ensure(Math.floor(raised.x1 / 16), Math.floor(raised.z1 / 16), true); expect(w.get(raised.x1, 24, raised.z1)).toBe(B.Paving); expect(w.get(raised.x1, 25, raised.z1)).not.toBe(B.Air);
    w.dispose();
  });
  it("lets players and NPCs walk the urban terrace approach", () => {
    const w = new World(seed, {}, false, 4);
    for (let x = -16; x <= -13; x++) for (let z = 2; z <= 3; z++) w.ensure(x, z, true);
    const body: Body = { position: { x: -210.5, y: 21.002, z: 48.5 }, velocity: { x: 0, y: 0, z: 0 }, grounded: true, flying: false, fallStart: 21 };
    for (let i = 0; i < 300; i++) { body.velocity = { x: -2, y: -2, z: 0 }; moveBody(w, body, .05); }
    expect(body.position.x).toBeLessThan(-237); expect(body.position.y).toBeGreaterThan(24.9);
    const path = new PathSearch(w, { x: -210.5, y: 21.002, z: 48.5 }, { x: -240.5, y: 25.002, z: 48.5 });
    while (path.status === "searching") path.step(64); expect(path.status).toBe("ready");
    w.dispose();
  });
  it("generates every macro boundary independently of chunk traversal order", async () => {
    const coords = [[-1, -1], [0, -3], [12, 21], [12, 33], [27, -1], [10, -40], [-27, -36], [38, -27], [-34, 10], [22, 7], [-15, 3]];
    const a = createGenerator(seed, 4), b = createGenerator(seed, 4), first = new Map(await Promise.all(coords.map(async ([x, z]) => [`${x},${z}`, await digest(a.generate(x, z))] as const)));
    for (const [x, z] of coords.reverse()) expect(await digest(b.generate(x, z))).toBe(first.get(`${x},${z}`));
    const secondary = [[-1024, 0], [1024, 0], [0, 1024], [0, -1024]].find(([x, z]) => cityNear(x, z, plan.seed))!;
    expect(secondary).toBeDefined(); const [x, z] = secondary;
    expect(sampleTerrain(plan, x, z).urban).toBe(false); expect(await digest(generateChunk(x / 16, z / 16, seed, 4))).not.toBe(await digest(generateChunk(x / 16, z / 16, seed, 3)));
  });
  it("bounds cache ownership and discards new planner references on repeated disposal", () => {
    for (let i = 0; i < 12; i++) { generatorFor(`travel-${i}`, 4); terrainHeight(1000, 0, seedNumber(`travel-${i}`)); const w = new World(`travel-${i}`, {}, false, 4); expect(w.planCount).toBe(1); w.dispose(); expect(w.planCount).toBe(0); expect(w.cityPlan).toBeUndefined(); w.ensure(0, 0, true); expect(w.chunks.size).toBe(0); }
    expect(generatorCacheSizes().contexts).toBeLessThanOrEqual(4); expect(generatorCacheSizes().terrainPlans).toBeLessThanOrEqual(4); expect(cityPlanCacheSize()).toBeLessThanOrEqual(6);
    for (const [x, z] of [[-1, -1], [-16, -16], [0, 0], [16, 16]]) expect(Number.isFinite(cityElevation(plan, x))).toBe(true);
  });
});
