import { BlockColumn } from "../src/world/sections";
import { describe, it, expect } from "vitest";
import {
  getCityPlan,
  CITY_SPAWN,
  PANDA,
  DISTRICTS,
  inCity,
  surfaceAt,
  intersects,
  contains,
} from "../src/world/city/plan";
import { PANDA_VOXELS } from "../src/world/city/panda";
import {
  generateChunk,
  GENERATOR_VERSION,
  terrainHeight,
  biomeAt,
} from "../src/world/generator";
import { seedNumber, hash } from "../src/world/noise";
import { World } from "../src/world/world";
import { B, block } from "../src/world/blocks";
import { Lighting } from "../src/world/lighting";
import { collides, moveBody, Body } from "../src/player/physics";
import { index } from "../src/core/coords";
const seed = "jade-harbor",
  n = seedNumber(seed),
  plan = getCityPlan(n);
function region(w: World, x1: number, z1: number, x2: number, z2: number) {
  for (let z = Math.floor(z1 / 16); z <= Math.floor(z2 / 16); z++)
    for (let x = Math.floor(x1 / 16); x <= Math.floor(x2 / 16); x++)
      w.ensure(x, z, true);
}
describe("city planning and real voxel realization", () => {
  it("guarantees eight districts, hundreds of parcels, 16 families and a 650-block urban core", () => {
    expect(new Set(plan.structures.map((s) => s.district)).size).toBe(8);
    expect(plan.structures.length).toBeGreaterThan(400);
    expect(
      new Set(plan.structures.map((s) => s.kind)).size,
    ).toBeGreaterThanOrEqual(16);
    expect(inCity(327, 0)).toBe(true);
    expect(inCity(329, 0)).toBe(false);
    for (const kind of [
      "panda-plaza",
      "pagoda",
      "civic",
      "market-hall",
      "garden",
    ])
      expect(plan.structures.some((s) => s.kind === kind)).toBe(true);
  });
  it("has mixed heights, roof colors and deterministic seed-dependent parcels", () => {
    expect(new Set(plan.structures.map((s) => s.floors))).toEqual(
      new Set([1, 2, 3, 5]),
    );
    expect(new Set(plan.structures.map((s) => s.roof)).size).toBe(4);
    expect(getCityPlan(n)).toEqual(plan);
    expect(getCityPlan(seedNumber("other")).structures).not.toEqual(
      plan.structures,
    );
  });
  it("keeps ordinary footprints clear of landmarks and each other", () => {
    for (let i = 0; i < plan.structures.length; i++) {
      const a = plan.structures[i];
      for (let j = i + 1; j < plan.structures.length; j++)
        expect(
          intersects(a, plan.structures[j]),
          a.id + " overlaps " + plan.structures[j].id,
        ).toBe(false);
    }
  });
  it("measures urban land coverage, with intentional green space", () => {
    const counts: Record<string, number> = {};
    let total = 0;
    for (let z = -300; z <= 300; z += 3)
      for (let x = -300; x <= 300; x += 3) {
        const s = surfaceAt(plan, x, z);
        counts[s] = (counts[s] ?? 0) + 1;
        total++;
      }
    const urban = 1 - (counts.garden ?? 0) / total;
    console.log(
      "CITY_METRICS",
      JSON.stringify({
        structures: plan.structures.length,
        families: new Set(plan.structures.map((s) => s.kind)).size,
        urbanFraction: urban,
        counts,
      }),
    );
    expect(urban).toBeGreaterThan(0.7);
    expect(urban).toBeLessThan(0.94);
  });
  it("has a collision-free spawn and a walkable main avenue to Panda Plaza", () => {
    const w = new World(seed, {}, false, 4);
    region(w, -1, -30, 1, 26);
    expect(collides(w, CITY_SPAWN)).toBe(false);
    for (let z = -29; z <= 25; z++)
      expect(
        collides(w, { x: 0.5, y: 21.01, z: z + 0.5 }),
        "blocked street z=" + z,
      ).toBe(false);
  });
  it("builds the complete 18-block sculpture across chunk edges and attaches every component", () => {
    const w = new World(seed, {}, false, 4);
    region(w, -10, -57, 10, -38);
    for (const [x, y, z, id] of PANDA_VOXELS)
      expect(w.get(x + PANDA.x, y + PANDA.base, z + PANDA.z)).toBe(id);
    const keys = new Set(PANDA_VOXELS.map(([x, y, z]) => `${x},${y},${z}`)),
      seen = new Set<string>(),
      queue = [keys.values().next().value!];
    while (queue.length) {
      const k = queue.pop()!;
      if (seen.has(k)) continue;
      seen.add(k);
      const [x, y, z] = k.split(",").map(Number);
      for (const [dx, dy, dz] of [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
        [0, 0, -1],
      ]) {
        const next = `${x + dx},${y + dy},${z + dz}`;
        if (keys.has(next) && !seen.has(next)) queue.push(next);
      }
    }
    expect(seen.size).toBe(keys.size);
    expect(
      Math.max(...PANDA_VOXELS.map((v) => v[1])) -
        Math.min(...PANDA_VOXELS.map((v) => v[1])) +
        1,
    ).toBe(18);
    expect(PANDA_VOXELS.filter((v) => v[3] === B.PandaEye)).toHaveLength(2);
    expect(PANDA_VOXELS.some((v) => v[3] === B.PandaMouth)).toBe(true);
  });
  it("generates cross-chunk structures identically in reverse loading order", () => {
    const a = new World(seed, {}, false, 4),
      b = new World(seed, {}, false, 4),
      coords = [
        [-1, -3],
        [0, -3],
        [-1, -4],
        [0, -4],
      ];
    for (const [x, z] of coords) a.ensure(x, z, true);
    for (const [x, z] of [...coords].reverse()) b.ensure(x, z, true);
    for (const [x, z] of coords)
      expect(a.chunks.get(`${x},${z}`)?.blocks).toEqual(
        b.chunks.get(`${x},${z}`)?.blocks,
      );
  });
  it("builds non-zero negative city origins with the same grounded panda and valid spatial index", () => {
    const p = getCityPlan(n, -1024, 1024),
      s = p.structures.find((s) => s.kind === "panda-plaza")!;
    expect(s.x1).toBe(-1045);
    expect(s.z1).toBe(953);
    expect(p.byChunk.get("-64,61")?.some((s) => s.kind === "panda-plaza")).toBe(
      true,
    );
    for (const st of p.structures)
      expect(
        p.byChunk.get(`${Math.floor(st.x1 / 16)},${Math.floor(st.z1 / 16)}`),
      ).toContain(st);
  });
  it("keeps the canal continuously wet between walkable stone bridges", () => {
    const w = new World(seed, {}, false, 4);
    region(w, 138, -180, 150, -100);
    for (let z = -180; z <= -100; z++) {
      const bridge = plan.roads.some(
        (r) => r.axis === "z" && Math.abs(z - r.at) <= r.half,
      );
      expect(w.get(144, 20, z)).toBe(bridge ? B.Marble : B.Air);
      if (!bridge) expect(w.get(144, 19, z)).toBe(B.Water);
    }
  });
  it("keeps ordinary frontage footprints clear of traversable cross alleys", () => {
    for (const s of plan.structures) {
      if (plan.reservations.some((r) => contains(r, s.x1, s.z1))) continue;
      expect(
        plan.alleys.some((a) => intersects(s, a)),
        s.id,
      ).toBe(false);
    }
  });
  it("rejects stale staged lighting when the world changes during a frame budget", () => {
    const w = new World("light", {}, false, 4);
    w.chunks.set("0,0", {
      cx: 0,
      cz: 0,
      revision: 0,
      blocks: new BlockColumn(),
    });
    w.set(2, 30, 2, B.Lantern);
    const l = new Lighting(w);
    l.update(0);
    expect(l.pending).toBe(true);
    w.set(2, 30, 2, 0);
    let n = 0;
    while (l.pending && n++ < 10000) l.update(0);
    expect(l.signature).toBe(-1);
    l.rebuild();
    expect(l.blockLight.size).toBe(0);
  });
  it("provides climbable interior stairs in all four building orientations", () => {
    for (let facing = 0; facing < 4; facing++) {
      const s = plan.structures.find(
        (s) => s.facing === facing && s.floors === 2 && s.kind === "shophouse",
      )!;
      expect(s).toBeDefined();
      const w = new World(seed, {}, false, 4);
      region(w, s.x1 - 2, s.z1 - 2, s.x2 + 2, s.z2 + 2);
      const width = facing % 2 ? s.z2 - s.z1 + 1 : s.x2 - s.x1 + 1,
        u = width - 2.5;
      const transform = (u: number, v: number) =>
        facing === 0
          ? { x: s.x1 + u, z: s.z1 + v }
          : facing === 1
            ? { x: s.x2 + 1 - v, z: s.z1 + u }
            : facing === 2
              ? { x: s.x2 + 1 - u, z: s.z2 + 1 - v }
              : { x: s.x1 + v, z: s.z2 + 1 - u };
      const start = transform(u, 2.1),
        dir = [
          { x: 0, z: 1 },
          { x: -1, z: 0 },
          { x: 0, z: -1 },
          { x: 1, z: 0 },
        ][facing];
      const body: Body = {
        position: { ...start, y: 21.01 },
        velocity: { x: 0, y: 0, z: 0 },
        grounded: true,
        flying: false,
        fallStart: 21.01,
      };
      for (let t = 0; t < 105; t++) {
        body.velocity = { x: dir.x * 2, y: -2, z: dir.z * 2 };
        moveBody(w, body, 0.05);
      }
      expect(body.position.y, "stairs facing " + facing).toBeGreaterThan(25.8);
    }
  });
  it("retains editable mature rice terraces and wilderness shrine rewards", () => {
    const w = new World(seed, {}, false, 4);
    region(w, 350, 120, 375, 166);
    expect(w.get(352, 21, 121)).toBe(B.Farmland);
    expect(w.get(352, 22, 121) & 255).toBe(B.Rice);
    expect(w.get(351, 21, 121)).toBe(B.Water);
    region(w, 397, 77, 403, 83);
    const y = terrainHeight(400, 80, n) + 1;
    expect(w.get(400, y, 80)).toBe(B.Chest);
  });
  it("walks from Panda Plaza up the monument steps without jumping", () => {
    const w = new World(seed, {}, false, 4);
    region(w, -2, -49, 2, -32);
    const body: Body = {
      position: { x: 0.5, y: 21.01, z: -34.5 },
      velocity: { x: 0, y: 0, z: 0 },
      grounded: true,
      flying: false,
      fallStart: 21.01,
    };
    for (let i = 0; i < 100; i++) {
      body.velocity = { x: 0, y: -2, z: -2 };
      moveBody(w, body, 0.05);
    }
    expect(body.position.y).toBeGreaterThan(22.8);
  });
  it("keeps harvestable natural logs for the existing survival crafting chain", () => {
    let found = false;
    const w = new World(seed, {}, false, 4);
    for (let z = 100; z < 160 && !found; z++)
      for (let x = 420; x < 500 && !found; x++) {
        if (hash(x, z, n + 24) < 0.992 || biomeAt(x, z, n) === "Bamboo Forest")
          continue;
        const y = terrainHeight(x, z, n);
        w.ensure(Math.floor(x / 16), Math.floor(z / 16), true);
        if (w.get(x, y + 1, z) === B.Log) found = true;
      }
    expect(found).toBe(true);
  });
  it("retains seeded hills and forests beyond the metropolis", () => {
    const hs = new Set<number>();
    for (let x = 410; x < 650; x += 13) hs.add(terrainHeight(x, 55, n));
    expect(hs.size).toBeGreaterThan(4);
    const c = generateChunk(30, 5, seed);
    expect(c.some((v) => v === B.Grass)).toBe(true);
    expect(GENERATOR_VERSION).toBe(10);
  });
});
