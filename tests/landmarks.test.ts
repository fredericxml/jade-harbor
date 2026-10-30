import { expect, it } from "vitest";
import "fake-indexeddb/auto";
import hashes from "./fixtures/generator-v5.json";
import { createV5Generator } from "../src/world/generator-v5";
import { createV6Generator } from "../src/world/generator-v6";
import { World } from "../src/world/world";
import { B } from "../src/world/blocks";
import { BlockColumn } from "../src/world/sections";
import { LANDMARK_REGISTRY } from "../src/world/landmarks/registry";
import { footprintDistance } from "../src/world/geography/geometry";
import { collides, moveBody, type Body } from "../src/player/physics";
import { standAt, traversable, PathSearch } from "../src/game/navigation/pathfinder";
import { freshWorld, writeSave, loadSave, validateSave } from "../src/persistence/saves";
import { residents } from "../src/game/professions";
import type { Position } from "../src/world/landmarks/types";
import { createGenerationSession } from "../src/world/generation-protocol";
import { intersects } from "../src/world/city/plan";

const seed = "jade-harbor", g = createV6Generator(seed), p = g.realization;
function ensure(w: World, x: number, z: number, radius = 0) {
  for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) w.ensure(Math.floor(x / 16) + dx, Math.floor(z / 16) + dz, true);
}
async function digest(c: BlockColumn) {
  const data = new Uint8Array(16 * 16 * 384 * 2), view = new DataView(data.buffer); let i = 0;
  for (let y = -64; y <= 319; y++) for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) { view.setUint16(i, c.get(x, y, z), true); i += 2; }
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))].map(x => x.toString(16).padStart(2, "0")).join("");
}
it("preserves all 78 pre-implementation v5 full-column hashes", async () => {
  const contexts = new Map<string, ReturnType<typeof createV5Generator>>();
  for (const f of hashes) { let context = contexts.get(f.seed); if (!context) { context = createV5Generator(f.seed); contexts.set(f.seed, context); }
    expect(await digest(context.generate(f.cx, f.cz)), JSON.stringify(f)).toBe(f.sha256); }
}, 15000);
it("consumes the eight authoritative reservations without changing geography or ordinary district plans", () => {
  const old = createV5Generator(seed);
  expect(g.plan).toEqual(old.plan); expect(g.landmarks).toEqual(old.landmarks); expect(g.metropolis).toEqual(old.metropolis);
  expect(p.sites.map(s => s.id)).toEqual(LANDMARK_REGISTRY.map(s => s.id));
  expect(new Set(p.components.map(c => c.id)).size).toBe(p.components.length);
  for (const site of p.sites) { expect(site.componentIds.length, site.id).toBeGreaterThan(0); expect(site.reservation.id).toBe(`${site.id}-reserve`); }
  for (const [x, z] of [[0, -3], [-1, -4], [0, 0], [3, 11], [22, 7]]) expect(g.generate(x, z).serialize()).toEqual(old.generate(x, z).serialize());
  for (let z = -5; z <= -2; z++) for (let x = -2; x <= 1; x++) expect(g.generate(x, z).serialize()).toEqual(old.generate(x, z).serialize());
  const collisions: string[] = [];
  for (const c of p.components) for (const lot of g.metropolis.lots) if (intersects(c.bounds, lot.envelope)) collisions.push(`${c.id}/${lot.id}`);
  expect(collisions).toEqual([]);
});
it("keeps alternate-seed plans deterministic, indexed and finitely bounded", () => {
  for (const seed of ["jade-harbor", "different-city", "长江玉港", ...Array.from({ length: 8 }, (_, i) => `landmark-${i}`)]) {
    const a = createV6Generator(seed), b = createV6Generator(seed), q = a.realization;
    // Preserve every field and every indexed reference, including Map order,
    // while avoiding repeated deep-matcher walks over the shared plan graph.
    const encode = (value: typeof q) => JSON.stringify(value, (_key, part) => part instanceof Map ? { entries:[...part] } : typeof part === "number" && Object.is(part,-0) ? { negativeZero:true } : part);
    expect(encode(q)).toBe(encode(b.realization)); expect(q.sites).toHaveLength(8);
    expect(q.diagnostics.components).toBeLessThan(10000); expect(q.diagnostics.indexedChunks).toBeLessThan(5000); expect(q.diagnostics.maxReferences).toBeLessThan(256);
    expect(q.diagnostics.routeNodes).toBeLessThan(12000);
    for (const route of q.approaches) {
      expect(a.plan.connections.some(c => c.id === route.connection) || q.approaches.some(c => c.id === route.connection), route.id).toBe(true);
      for (let i = 1; i < route.nodes.length; i++) { const n = route.nodes[i], prev = route.nodes[i - 1];
        expect(Math.abs(n.x - prev.x) + Math.abs(n.z - prev.z)).toBe(1); expect(Math.abs(n.y - prev.y)).toBeLessThanOrEqual(.5); }
    }
    for (const c of q.components) for (const z of [Math.floor(c.bounds.z1 / 16), Math.floor(c.bounds.z2 / 16)])
      for (const x of [Math.floor(c.bounds.x1 / 16), Math.floor(c.bounds.x2 / 16)]) expect(q.byChunk.get(`${x},${z}`)?.includes(c)).toBe(true);
  }
}, 30000);
it("keeps the complete ridge walk inside its corridor with supported tower intervals", () => {
  const reserve = g.landmarks.reservations.find(r => r.id === "ridge-fortification-reserve")!;
  expect(p.wallWalk.length).toBeGreaterThan(500); expect(p.components.filter(c => c.kind === "tower" && c.site === "ridge-fortification").length).toBeGreaterThanOrEqual(6);
  for (let i = 0; i < p.wallWalk.length; i++) {
    const n = p.wallWalk[i]; expect(footprintDistance(reserve.footprint, n.x, n.z)).toBeLessThanOrEqual(0);
    expect(n.y - g.terrainHeight(n.x, n.z)).toBeGreaterThanOrEqual(6);
    if (i) expect(Math.abs(n.y - p.wallWalk[i - 1].y)).toBeLessThanOrEqual(.5);
  }
});
it("realizes the defining palace, excavation, shoreline and cliff structures in actual columns", () => {
  const w = new World(seed, {}, false, 6);
  const points = [[0, 36, -405], [0, 37, -439], [-579, 23, 145], [-576, 22, 164], [200, 20, 349], [613, 44, -430], [613, 54, -430]];
  for (const [x, y, z] of points) ensure(w, x, z);
  expect(w.get(0, 36, -405)).toBe(B.Air); // actual outer gate passage
  expect(w.get(0, 37, -439)).toBe(B.Planks); // raised principal hall floor
  expect(w.get(-579, 23, 145)).toBe(B.Terracotta);
  expect(w.get(-576, 22, 164)).toBe(B.DarkTimber); // canopy pier reaches excavated floor
  expect(w.get(200, 20, 349)).toBe(B.Marble);
  expect(w.get(613, 44, -430)).toBe(B.Marble); expect(w.get(613, 54, -430)).toBe(B.SculptureStone);
  const old = createV5Generator(seed);
  for (const [x, z] of [[620, -445], [-605, 160], [230, 365]]) {
    const cx = Math.floor(x / 16), cz = Math.floor(z / 16); ensure(w, x, z);
    const prior = old.generate(cx, cz);
    for (let y = -64; y <= 319; y++) expect(w.get(x, y, z)).toBe(prior.get((x % 16 + 16) % 16, y, (z % 16 + 16) % 16));
  }
  w.dispose();
}, 15000);
it("provides actual supported entry, public space and viewpoint geometry for every destination", () => {
  const w = new World(seed, {}, false, 6);
  for (const site of p.sites) for (const q of [site.entry, ...site.publicSpaces, ...site.viewpoints]) {
    ensure(w, q.x, q.z, 1); const position = { x: q.x + .5, y: q.y + 1.002, z: q.z + .5 };
    expect(collides(w, position), `${site.id}@${JSON.stringify(q)}`).toBe(false);
    expect(standAt(w, position.x, position.z, position.y), site.id).not.toBeNull();
  }
  ensure(w, 200, 365); expect(w.get(200, 18, 365)).toBe(B.Water); expect(w.get(200, 19, 365)).toBe(B.Air);
  w.dispose(); expect(w.landmarkPlan).toBeUndefined(); expect(w.planCount).toBe(0);
}, 25000);
it("physically traverses every new primary approach and the entire wall walk", () => {
  const w = new World(seed, {}, false, 6);
  for (const route of [...p.approaches, { id: "ridge-wall", nodes: p.wallWalk }]) {
    let previous: ReturnType<typeof standAt> = null;
    for (const n of route.nodes) {
      ensure(w, n.x, n.z);
      const q = standAt(w, n.x + .5, n.z + .5, n.y + 1.002);
      expect(q, `${route.id}@${JSON.stringify(n)}`).not.toBeNull();
      if (previous) expect(traversable(w, previous, q!), `${route.id}@${JSON.stringify(n)}`).toBe(true);
      previous = q;
    }
  }
  w.dispose();
}, 40000);
it("uses real player stepping on palace, pit, sanctuary and cliff stairs", () => {
  for (const id of ["hall-stairs", "pit-stairs", "sanctuary-steps", "cliff-approach", "harbor-approach", "ridge-entry"]) {
    const route = p.approaches.find(r => r.id === id)!, nodes = route.nodes.slice(-Math.min(18, route.nodes.length)), w = new World(seed, {}, false, 6);
    for (const n of nodes) ensure(w, n.x, n.z, 1);
    const first = nodes[0], body: Body = { position: { x: first.x + .5, y: first.y + 1.002, z: first.z + .5 }, velocity: { x: 0, y: 0, z: 0 }, grounded: true, flying: false, fallStart: first.y + 1 };
    for (const n of nodes.slice(1)) for (let t = 0; t < 40 && Math.hypot(n.x + .5 - body.position.x, n.z + .5 - body.position.z) > .1; t++) {
      const dx = n.x + .5 - body.position.x, dz = n.z + .5 - body.position.z, distance = Math.hypot(dx, dz);
      body.velocity = { x: dx / distance * 2, y: -2, z: dz / distance * 2 }; moveBody(w, body, .04);
    }
    const target = nodes.at(-1)!;
    expect(Math.hypot(body.position.x - target.x - .5, body.position.z - target.z - .5), id).toBeLessThan(.2);
    expect(Math.abs(body.position.y - target.y - 1.002), id).toBeLessThan(.6); w.dispose();
  }
}, 25000);
it.each(["different-city", "长江玉港"])("keeps all primary approaches physically supported on alternate seed %s", seed => {
  const w = new World(seed, {}, false, 6), plan = w.landmarkPlan!;
  for (const route of [...plan.approaches, { id: "ridge-wall", nodes: plan.wallWalk }]) {
    let previous: ReturnType<typeof standAt> = null;
    for (const n of route.nodes) {
      ensure(w, n.x, n.z); const q = standAt(w, n.x + .5, n.z + .5, n.y + 1.002);
      expect(q, `${route.id}@${JSON.stringify(n)}`).not.toBeNull();
      if (previous) expect(traversable(w, previous, q!), `${route.id}@${JSON.stringify(n)}`).toBe(true);
      previous = q;
    }
  }
  w.dispose();
}, 30000);
it("climbs the real harbor and western lookout interior stairs", () => {
  for (const siteId of ["harbor-front", "western-viewpoint"]) {
    const t = p.components.find(c => c.kind === "tower" && c.site === siteId)!;
    if (t.kind !== "tower") throw Error("tower fixture");
    const w = new World(seed, {}, false, 6), x = t.center.x, z = t.center.z, low = 3 - (t.story - 1);
    ensure(w, x, z, 1);
    const body: Body = { position: { x: x - 2.5, y: t.level + 1.002, z: z + low - .5 }, velocity: { x: 0, y: 0, z: 0 }, grounded: true, flying: false, fallStart: t.level + 1 };
    for (const [u, v] of [[-2.5, 3.5], [2.5, 3.5], [2.5, low + .5]]) {
      for (let i = 0; i < 240 && Math.hypot(body.position.x - x - u, body.position.z - z - v) > .1; i++) {
        const dx = x + u - body.position.x, dz = z + v - body.position.z, d = Math.hypot(dx, dz);
        body.velocity = { x: dx / d * 2, y: -2, z: dz / d * 2 }; moveBody(w, body, .04);
      }
    }
    expect(body.position.y, siteId).toBeGreaterThan(t.level + t.story + .8); w.dispose();
  }
}, 15000);
it("has voxel-identical center/edge/reverse loading across all eight landmarks", async () => {
  const a = createV6Generator(seed), b = createV6Generator(seed), coords = p.sites.flatMap(s => {
    const x = Math.floor(s.reservation.anchor.x / 16), z = Math.floor(s.reservation.anchor.z / 16); return [[x, z], [x + 1, z], [x - 1, z + 1]];
  });
  for (const n of [p.wallWalk[0], p.wallWalk[96], p.wallWalk.at(-1)!]) coords.push([Math.floor(n.x / 16), Math.floor(n.z / 16)]);
  const hashes = new Map<string, string>(); for (const [x, z] of coords) hashes.set(`${x},${z}`, await digest(a.generate(x, z)));
  for (const [x, z] of coords.reverse()) expect(await digest(b.generate(x, z))).toBe(hashes.get(`${x},${z}`));
}, 15000);
it("retains existing ten resident routes without increasing navigation budgets", () => {
  const w = new World(seed, {}, false, 6);
  for (const npc of residents(seed, g.city)) {
    ensure(w, npc.home.x, npc.home.z, 3); ensure(w, npc.workplace.x, npc.workplace.z, 3);
    const search = new PathSearch(w, npc.home, npc.workplace); while (search.status === "searching") search.step(64);
    expect(search.status, npc.name).toBe("ready");
  }
  w.dispose();
}, 20000);
it("uses the actual worker protocol for all eight destinations and owns only one context", () => {
  const session = createGenerationSession();
  for (const site of p.sites) {
    const cx = Math.floor(site.reservation.anchor.x / 16), cz = Math.floor(site.reservation.anchor.z / 16);
    const result = session.run({ cx, cz, seed, generator: 6, epoch: 14, ticket: 8 });
    expect(result.generator).toBe(6); expect(result.epoch).toBe(14); expect(result.ticket).toBe(8);
    expect(BlockColumn.from(result.sections).serialize()).toEqual(g.generate(cx, cz).serialize()); expect(session.size).toBe(1);
  }
  session.dispose(); expect(session.size).toBe(0);
}, 10000);
it.each([6,7,8])("persists v%i removals and additions at every landmark through eviction, DB, export/import and restart", async version => {
  const w = new World(seed, {}, false, version), wall = p.wallWalk[96], temple = p.sites.find(s => s.id === "mountain-temple")!, view = p.sites.find(s => s.id === "western-viewpoint")!, scenic = p.sites.find(s => s.id === "scenic-landscape")!;
  const points: Position[] = [{ x: -62, y: 37, z: -430 }, { x: wall.x, y: Math.floor(wall.y), z: wall.z }, { x: -579, y: 23, z: 145 },
    { x: 194, y: 23, z: 343 }, { x: -667, y: temple.level + 3, z: -261 }, { x: 613, y: 44, z: -430 },
    { x: -735, y: scenic.level + 1, z: -248 }, { x: -664, y: view.level + 3, z: -329 }];
  for (const q of points) { ensure(w, q.x, q.z); expect(w.get(q.x, q.y, q.z), JSON.stringify(q)).not.toBe(B.Air); w.set(q.x, q.y, q.z, B.Air); }
  const placed = { x: 0, y: 36, z: -423 }; ensure(w, placed.x, placed.z); w.set(placed.x, placed.y, placed.z, B.Jade);
  const meta = { ...freshWorld("Landmark durability", seed, "creative"), generator: version }, revision = await writeSave(meta), captured = w.captureChanges();
  await writeSave(meta, captured.chunks, revision); w.acknowledgeChanges(captured.revisions); w.stream(10000, 10000, 0);
  for (const q of points) { ensure(w, q.x, q.z); expect(w.get(q.x, q.y, q.z)).toBe(B.Air); } w.dispose();
  const saved = validateSave(JSON.parse(JSON.stringify(await loadSave(meta.id)))); expect(saved.generator).toBe(version);
  const loaded = new World(seed, saved.edits, false, saved.generator);
  for (const q of points) { ensure(loaded, q.x, q.z); expect(loaded.get(q.x, q.y, q.z)).toBe(B.Air); }
  ensure(loaded, placed.x, placed.z); expect(loaded.get(placed.x, placed.y, placed.z)).toBe(B.Jade); loaded.dispose();
}, 20000);
