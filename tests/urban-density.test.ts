import { expect, it } from "vitest";
import "fake-indexeddb/auto";
import * as THREE from "three";
import { World } from "../src/world/world";
import { createV6Generator } from "../src/world/generator-v6";
import { createV7Generator } from "../src/world/generator-v7";
import { intersects } from "../src/world/city/plan";
import { footprintsOverlap } from "../src/world/geography/geometry";
import { roadFootprint } from "../src/world/metropolis/plan";
import { DENSITY_LIMITS, INTENTIONAL_OPEN_SPACES } from "../src/world/metropolis/density";
import { createPopulation } from "../src/game/city-life/population";
import { PRESENCE_BUDGET, DISTRICT_PRESENCE } from "../src/game/city-life/presence";
import { Entities, spawnEntity, type Entity } from "../src/game/entities";
import { safeActivityPoint } from "../src/game/city-life/runtime";
import { buildingPoint } from "../src/game/professions";
import { collides } from "../src/player/physics";
import { Inventory } from "../src/game/inventory";
import { EntityView } from "../src/render/entity-view";
import { denseCityCopy, freshWorld, validateSave, writeSave, loadSave, listSaves } from "../src/persistence/saves";
import { B } from "../src/world/blocks";
import type { Vec3 } from "../src/core/coords";

const seed = "jade-harbor";
function loadPoint(w: World, p: Vec3) {
  for (const x of new Set([Math.floor((p.x - .35) / 16), Math.floor((p.x + .35) / 16)])) for (const z of new Set([Math.floor((p.z - .35) / 16), Math.floor((p.z + .35) / 16)])) w.ensure(x, z, true);
  while (w.chunks.size > 96) w.chunks.delete(w.chunks.keys().next().value!);
}
function equalColumn(a: ReturnType<ReturnType<typeof createV6Generator>["generate"]>, b: typeof a) {
  const left = a.serialize(), right = b.serialize();
  return left.length === right.length && left.every((s, i) => s.sy === right[i].sy && s.uniform === right[i].uniform && s.data?.length === right[i].data?.length && (!s.data || s.data.every((v, j) => v === right[i].data![j])));
}

it("adds indexed, road-connected district infill while preserving intentional courts and the immutable base", () => {
  for (const text of [seed, "different-city", "长江玉港"]) {
    const g = createV7Generator(text), p = g.density;
    expect(p.infill.length).toBeGreaterThan(200); expect(p.infill.length).toBeLessThanOrEqual(DENSITY_LIMITS.infill);
    expect(p.districts.every(d => d.added > 0)).toBe(true);
    expect(p.districts.find(d => d.id === "heritage")!.added).toBeGreaterThan(35);
    expect(p.urban.lots.length).toBeGreaterThan(p.baseUrban.lots.length * 2);
    expect(p.urban.lots.slice(0, p.baseUrban.lots.length)).toEqual(p.baseUrban.lots);
    expect(new Set(p.infill.map(l => l.id)).size).toBe(p.infill.length);
    expect(new Set(p.urban.roads.map(r => r.id)).size).toBe(p.urban.roads.length);
    for (const lot of p.infill) {
      const f = { kind: "area" as const, bounds: lot.envelope };
      expect(INTENTIONAL_OPEN_SPACES.some(s => intersects(lot.envelope, s.bounds, 1)), lot.id).toBe(false);
      expect(g.landmarks.reservations.some(r => footprintsOverlap(f, r.footprint, r.margin + 1)), lot.id).toBe(false);
      const localLots = p.urban.lotsByChunk.get(`${Math.floor(lot.x1 / 16)},${Math.floor(lot.z1 / 16)}`)!;
      expect(localLots).toContain(lot);
      expect(p.urban.lots.some(other => other !== lot && intersects(lot.envelope, other.envelope, .5)), lot.id).toBe(false);
      expect(p.links.some(r => r.owner === lot.id)).toBe(true);
    }
    for (const road of p.links) for (const lot of p.urban.lots) if (lot.id !== road.owner) expect(footprintsOverlap(roadFootprint(road), { kind: "area", bounds: lot.envelope }), road.id).toBe(false);
  }
}, 30000);

it("keeps Panda and all eight landmark center columns identical to v6", () => {
  const a = createV6Generator(seed), b = createV7Generator(seed);
  const columns = new Set(["0,-3", ...a.realization.sites.map(s => {
    const component = a.realization.components.find(c => c.site === s.id && c.kind !== "route")!;
    return `${Math.floor((component.bounds.x1 + component.bounds.x2) / 32)},${Math.floor((component.bounds.z1 + component.bounds.z2) / 32)}`;
  })]);
  for (const key of columns) { const [x, z] = key.split(",").map(Number); expect(equalColumn(a.generate(x, z), b.generate(x, z)), key).toBe(true); }
});

it("realizes infill across chunk seams independently of generation order on three seeds", () => {
  for (const text of [seed, "different-city", "长江玉港"]) {
    const a = createV7Generator(text), b = createV7Generator(text), columns = new Set<string>();
    for (const district of ["heritage", "market", "water-town", "harbor", "highland"]) {
      const l = a.density.infill.find(l => l.districtId === district)!;
      for (const [x, z] of [[l.x1, l.z1], [l.x2, l.z2], [l.entrance.x, l.entrance.z]]) columns.add(`${Math.floor(x / 16)},${Math.floor(z / 16)}`);
    }
    const forward = new Map([...columns].map(key => { const [x, z] = key.split(",").map(Number); return [key, a.generate(x, z)] as const; }));
    for (const key of [...columns].reverse()) { const [x, z] = key.split(",").map(Number); expect(equalColumn(forward.get(key)!, b.generate(x, z)), `${text}:${key}`).toBe(true); }
  }
}, 15000);

it("plans reproducible neighborhood coverage, principal-corridor presence and appropriate landmark visitors on three seeds", () => {
  for (const text of [seed, "different-city", "长江玉港"]) {
    const w = new World(text, {}, false, 7), old = new World(text, {}, false, 6);
    const p = createPopulation(w)!, q = createPopulation(w)!;
    expect(JSON.stringify(p.residents)).toBe(JSON.stringify(q.residents));
    expect(w.chunks.size).toBe(0); expect(w.pending.size).toBe(0);
    expect(p.residents.length).toBeLessThanOrEqual(PRESENCE_BUDGET.residents);
    expect(p.residents.length).toBeGreaterThan(500);
    expect(new Set(p.residents.map(r => r.id)).size).toBe(p.residents.length);
    expect(p.residents.filter(r => !r.neighborhood)).toEqual(createPopulation(old)!.residents);
    for (const district of Object.keys(DISTRICT_PRESENCE)) expect(p.presence!.neighborhoods.some(n => n.district === district && n.residents >= 4), district).toBe(true);
    expect(p.presence!.neighborhoods.some(n => n.id.includes(":lantern-south"))).toBe(true);
    expect(p.presence!.neighborhoods.some(n => n.district === "market" && n.id.includes(":cross--216"))).toBe(true);
    expect(p.presence!.neighborhoods.filter(n=>n.kind!=="street").length).toBeLessThanOrEqual(32);
    expect(p.presence!.neighborhoods.some(n=>n.district==="market" && n.kind==="landing" && Math.hypot(n.position.x+224,n.position.z+216)<8 && n.residents===6)).toBe(true);
    expect(p.presence!.neighborhoods.some(n=>n.district==="scholar" && n.kind==="junction" && Math.hypot(n.position.x-200,n.position.z-204)<8 && n.residents===6)).toBe(true);
    expect(p.presence!.neighborhoods.every(n => n.residents >= 3)).toBe(true);
    for (const site of w.landmarkPlan!.sites) {
      const visitors = p.residents.filter(r => r.landmark === site.id && r.neighborhood);
      expect(visitors).toHaveLength(3);
      for(const r of visitors) for(const v of r.circuit!.points) expect(Math.hypot(v.x-site.entry.x,v.z-site.entry.z),r.id).toBeLessThan(64);
    }
    for (const r of p.residents) if (r.circuit) {
      expect(r.circuit.points.length).toBeGreaterThan(2); expect(r.circuit.points.length).toBeLessThan(64);
      expect(r.circuit.points.every(v => [v.x, v.y, v.z].every(Number.isFinite))).toBe(true);
    }
    w.dispose(); old.dispose();
  }
}, 30000);

it("gives every infill entrance and planned home actual dry supported collision space", () => {
  const w = new World(seed, {}, false, 7), p = createPopulation(w)!;
  const positions = new Map<string, Vec3>();
  for (const l of w.densityPlan!.infill) {
    positions.set(`${l.id}:outside`, { x:l.entrance.x+.5, y:l.baseY+1.002, z:l.entrance.z+.5 });
    for (const v of [1, 2]) { const point = buildingPoint(l, v); positions.set(`${l.id}:${v}`, point); }
  }
  for (const r of p.residents) positions.set(`home:${r.id}`, r.home);
  for (const [id, point] of positions) {
    loadPoint(w, point); const safe = safeActivityPoint(w, point);
    expect(safe, id).toBeDefined();
    expect(Math.hypot(safe!.x - point.x, safe!.z - point.z), id).toBeLessThanOrEqual(2.01);
    expect(collides(w, safe!), id).toBe(false);
  }
  w.dispose();
}, 30000);

it("supports every unique neighborhood and landmark circuit target in the actual generated world", () => {
  const w = new World(seed, {}, false, 7), population = createPopulation(w)!;
  const points = new Map<string, { p: Vec3; id: string }>();
  for (const r of population.residents) for (const p of r.circuit?.points ?? []) points.set(`${Math.floor(p.x)},${p.y},${Math.floor(p.z)}`, { p, id: r.id });
  const failures: string[] = [];
  const ordered = [...points.values()].sort((a, b) => Math.floor(a.p.z / 16) - Math.floor(b.p.z / 16) || Math.floor(a.p.x / 16) - Math.floor(b.p.x / 16));
  for (const { p, id } of ordered) {
    loadPoint(w, p); const safe = safeActivityPoint(w, p);
    if (!safe || Math.hypot(safe.x - p.x, safe.z - p.z) > 2.01 || collides(w, safe)) failures.push(`${id}: ${JSON.stringify(p)} -> ${JSON.stringify(safe)}`);
  }
  w.dispose();
  expect(failures).toEqual([]);
}, 30000);

it.each([["avenue", 0, 24, 10], ["market", -224, -216, 9], ["harbor", 120, 340, 8]] as const)("keeps natural %s residents moving through physics with bounded activity and navigation", (_, x, z, h) => {
  const time = ((h - 6) / 24 + 1) % 1, w = new World(seed, {}, false, 7), es = new Entities(w, undefined, time), inventory = new Inventory();
  for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) w.ensure(Math.floor(x / 16) + dx, Math.floor(z / 16) + dz, true);
  const anchor = es.life!.plan!.presence!.neighborhoods.reduce((a, b) => Math.hypot(a.position.x - x, a.position.z - z) < Math.hypot(b.position.x - x, b.position.z - z) ? a : b).position;
  const initial = new Map(es.list.map(e => [e.id, { ...e.body.position }])), walked = new Map<string, number>(), routines = new Set<string>();
  for (let n = 0; n < 1200; n++) {
    es.tick(.05, anchor, inventory, time + n * .05 / 1200, false, () => {}, () => {});
    expect(es.life!.active.size).toBeLessThanOrEqual(48); expect(es.navigation.agents.size).toBeLessThanOrEqual(54); expect(es.navigation.expandedLastTick).toBeLessThanOrEqual(96);
    for (const id of es.life!.active) {
      const e = es.list.find(e => e.id === id)!, before = initial.get(id)!;
      walked.set(id, (walked.get(id) ?? 0) + Math.hypot(e.body.position.x - before.x, e.body.position.z - before.z));
      initial.set(id, { ...e.body.position });
      const routine = es.life!.plan!.byId.get(id)?.circuit?.routine; if (routine) routines.add(routine);
    }
  }
  expect([...walked.values()].filter(d => d > 4).length).toBeGreaterThanOrEqual(4);
  expect(routines.has("work")).toBe(true); expect(routines.has("circulation")).toBe(true);
  const life = es.life!; es.dispose(); w.dispose();
  expect(life.plan).toBeUndefined(); expect(life.states.size).toBe(0); expect(life.active.size).toBe(0); expect(es.navigation.agents.size).toBe(0); expect(w.planCount).toBe(0);
}, 20000);

it("caps a CPU-only concentration fixture at 48 active residents without growing navigation or generating chunks", () => {
  const w = new World(seed, {}, false, 7), time = .5, es = new Entities(w, undefined, time), p = { x: .5, y: 21.002, z: 24.5 };
  for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) w.ensure(dx, dz, true);
  const safe = safeActivityPoint(w, p)!;
  // Deliberately concentrated for budgeting only; this is not visual evidence.
  es.list.filter(e => e.kind === "villager").slice(0, 80).forEach((e, i) => { e.body.position = { ...safe, x: safe.x + i % 8 - 4, z: safe.z + Math.floor(i / 8) - 5 }; });
  const chunks = w.chunks.size; let peak = 0;
  for (let n = 0; n < 400; n++) {
    es.tick(.05, safe, new Inventory(), time, false, () => {}, () => {}); peak = Math.max(peak, es.life!.active.size);
    expect(es.life!.active.size).toBeLessThanOrEqual(48); expect(es.navigation.agents.size).toBeLessThanOrEqual(54); expect(es.navigation.expandedLastTick).toBeLessThanOrEqual(96); expect(w.chunks.size).toBe(chunks);
  }
  expect(peak).toBe(48); es.dispose(); w.dispose();
});

it("lets pedestrians pass a stationary player through local supported side steps", () => {
  const w = { generatorVersion: 7, navRevision: 0, loaded: (x: number, z: number) => Math.abs(x)<16 && Math.abs(z)<16,
    get: (_x: number, y: number, _z: number) => Math.floor(y)===0 ? B.Stone : B.Air } as unknown as World;
  const player={x:.5,y:1.002,z:.5}, actors=[0,1].map(i=>({...spawnEntity("villager",{x:-5.5-i*2,y:1.002,z:.5}),id:`yield:${i}`,profession:"resident" as const,workplace:{x:5.5,y:1.002,z:.5}}));
  const es=new Entities(w,{entities:actors,drops:[]}),inv=new Inventory();let nearest=Infinity;
  for(let i=0;i<1000;i++) {
    es.tick(.05,player,inv,.24,false,()=>{},()=>{});
    for(const e of actors)nearest=Math.min(nearest,Math.hypot(e.body.position.x-player.x,e.body.position.z-player.z));
    expect(es.navigation.expandedLastTick).toBeLessThanOrEqual(96);
  }
  expect(nearest).toBeGreaterThan(.65);expect(actors.every(e=>e.body.position.x>3)).toBe(true);es.dispose();
});

it("shelters social pairs during rain while keeping the finite neighborhood identities", () => {
  const w=new World(seed,{},false,7),es=new Entities(w,undefined,.375),plan=es.life!.plan!,hub=plan.presence!.neighborhoods.find(n=>n.district==="scholar"&&n.kind==="junction"&&Math.hypot(n.position.x-200,n.position.z-204)<8)!;
  for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++)w.ensure(Math.floor(hub.position.x/16)+dx,Math.floor(hub.position.z/16)+dz,true);
  const pair=plan.residents.filter(r=>r.neighborhood===hub.id&&r.circuit?.routine==="social"),ids=es.list.map(e=>e.id),chunks=w.chunks.size;
  expect(pair).toHaveLength(2);es.life!.prepare(es.list,hub.position,.375,true,0,es.navigation);
  for(const r of pair){const state=es.life!.states.get(r.id)!;expect(state.activity).toBe("resting");expect(Math.hypot(state.target.x-r.home.x,state.target.z-r.home.z)).toBeLessThanOrEqual(2.01);}
  expect(es.life!.event).toBeUndefined();expect(es.list.map(e=>e.id)).toEqual(ids);expect(w.chunks.size).toBe(chunks);es.dispose();w.dispose();
});

it("extends a v6 city only in an explicit new slot and never resurrects missing released identities", async () => {
  const oldWorld = new World(seed, {}, false, 6), oldEntities = new Entities(oldWorld);
  const missing = [oldEntities.list.find(e => e.id.startsWith("resident:"))!.id, oldEntities.list.find(e => e.id.startsWith("citizen:"))!.id];
  oldEntities.list = oldEntities.list.filter(e => !missing.includes(e.id));
  const original = freshWorld("Preserved city", seed, "creative"); original.generator = 6;
  original.edits["20,22,24"] = B.GoldTrim; original.achievements = ["discovery:imperial-complex"];
  original.player.slots[0] = { id: 111, count: 4 }; original.simulation = oldEntities.serialize(); original.revision = await writeSave(original);
  const before = await loadSave(original.id), copy = denseCityCopy(before, 7);
  expect(copy.id).not.toBe(before.id); expect(copy.generator).toBe(7); expect(before.generator).toBe(6);
  expect(copy.edits).toEqual(before.edits); expect(copy.achievements).toEqual(before.achievements); expect(copy.player.slots).toEqual(before.player.slots);
  const w = new World(seed, copy.edits, false, 7), e = new Entities(w, copy.simulation, copy.time);
  expect(e.list.filter(e => e.kind === "villager")).toHaveLength(e.life!.plan!.residents.length - missing.length);
  expect(e.list.some(e => missing.includes(e.id))).toBe(false); expect(e.serialize().cityLifeVersion).toBe(2);
  const anotherMissing = e.list.find(q => q.id.startsWith("neighbor:"))!.id; e.list = e.list.filter(q => q.id !== anotherMissing);
  copy.simulation = e.serialize(); copy.revision = await writeSave(copy);
  const reopened = await loadSave(copy.id), again = new Entities(w, reopened.simulation, reopened.time);
  expect(again.list.some(q => q.id === anotherMissing || missing.includes(q.id))).toBe(false);
  expect(again.list.map(q => q.id)).toEqual(e.list.map(q => q.id));
  expect((await loadSave(original.id)).generator).toBe(6);
  expect((await listSaves()).find(s => s.id === copy.id)!.generator).toBe(7);
  await expect(writeSave({ ...before, generator: 7 }, [], original.revision)).rejects.toThrow("immutable");
  w.ensure(1, 1, true); expect(w.get(20, 22, 24)).toBe(B.GoldTrim);
  again.dispose(); e.dispose(); w.dispose(); oldEntities.dispose(); oldWorld.dispose();
});

it("retains the old entity limits and validates the larger v7 component and initialization marker strictly", () => {
  const d = { ...freshWorld("Bounded dense save", seed, "creative"), generator: 7 }, w = new World(seed, {}, false, 7), e = new Entities(w);
  d.simulation = e.serialize(); expect(validateSave(d).simulation!.cityLifeVersion).toBe(2);
  for (const marker of [0, 3, "2", null, false]) expect(() => validateSave({ ...d, simulation: { ...d.simulation, cityLifeVersion: marker } })).toThrow();
  expect(() => validateSave({ ...d, generator: 6 })).toThrow();
  const excessive = Array.from({ length: 1025 }, (_, i) => ({ ...e.list[0], id: `limit:${i}` }));
  expect(() => validateSave({ ...d, simulation: { entities: excessive, drops: [], cityLifeVersion: 2 } })).toThrow();
  expect(() => validateSave({ ...d, generator: 6, simulation: { entities: excessive.slice(0, 257), drops: [], cityLifeVersion: 1 } })).toThrow();
  for (const version of [3, 4, 5, 7]) expect(() => denseCityCopy({ ...d, generator: version, simulation: undefined }, 7)).toThrow();
  e.dispose(); w.dispose();
});

it("reuses one civilian batch across repeated population changes and clears every old instance", () => {
  const world = new World(seed, {}, false, 3); world.ensure(0, 1, true);
  const entities = new Entities(world, { entities: [], drops: [] }), scene = new THREE.Scene(), view = new EntityView(scene), matrix = view.civilians.instanceMatrix;
  for (let round = 0; round < 12; round++) {
    entities.list = Array.from({ length: 64 }, (_, i) => ({ ...spawnEntity("villager", { x: i % 8 * 2 + .5, y: 21, z: Math.floor(i / 8) + 24.5 }), id: `batch:${round}:${i}`, profession: (i % 2 ? "dock_worker" : "scholar") as Entity["profession"] }));
    view.update(entities, round); expect(view.civilians.count).toBe(64 * 12); expect(view.civilians.instanceMatrix).toBe(matrix);
    expect(view.models.size).toBe(0); expect(scene.children).toHaveLength(1);
  }
  entities.list=Array.from({length:256},(_,i)=>({...spawnEntity("villager",{x:i%16+.5,y:21,z:16+Math.floor(i/16)+.5}),id:`legacy-batch:${i}`,profession:"guard" as const}));
  view.update(entities,12);expect(view.civilians.count).toBe(256*12);expect(view.civilians.instanceMatrix).toBe(matrix);
  entities.list = []; view.update(entities, 13); expect(view.civilians.count).toBe(0);
  view.clear(); expect(view.civilians.visible).toBe(false); expect(view.civilians.instanceMatrix).toBe(matrix);
  entities.dispose(); world.dispose();
});
