import { MIN_Y, SEA, packed } from "../core/coords";
import { B } from "./blocks";
import { hash, noise, noise3, seedNumber } from "./noise";
import { BlockColumn } from "./sections";
import { inCity, surfaceAt } from "./city/plan";
import { VoxelWriter } from "./city/writer";
import { drawStructure, drawStreets, tree } from "./city/structures";
import { createMacroPlan } from "./geography/plan";
import { agriculturalTerrace, cityElevation, sampleTerrain, terrainSuitability, terrainName } from "./geography/terrain";
import { caveRoofAt, landmarkRequests, protections, reservationAt, resolveReservations } from "./geography/landmarks";
import { planPrimaryCity } from "./geography/city";
import { footprintDistance, footprintsOverlap } from "./geography/geometry";

function vegetationBiome(x: number, z: number, seed: number) {
  const n = noise(x / 190, z / 190, seed + 82);
  return n < .22 ? "Cherry Blossom Valley" : n < .44 ? "Bamboo Forest" : n < .66 ? "Cedar Highlands" : n < .83 ? "Jade Mountains" : "Snow Peaks";
}
/** One context per live world/worker; immutable plans, no coordinate/chunk-result cache. */
export function createV4Generator(seedText: string) {
  const started = performance.now(), seed = seedNumber(seedText), plan = createMacroPlan(seed);
  const landmarks = resolveReservations(plan, landmarkRequests(plan)), city = planPrimaryCity(plan, landmarks);
  const protectedSites = protections(plan);
  const planMs = performance.now() - started;
  const sample = (x: number, z: number) => sampleTerrain(plan, x, z);
  const terrainHeight = (x: number, z: number) => sample(x, z).height;
  const biomeAt = (x: number, z: number) => terrainName(plan, x, z);
  const inspect = (x: number, z: number) => ({ ...terrainSuitability(plan, x, z), generator: 4,
    reservation: reservationAt(landmarks, x, z)?.id, plans: 1, planMs, reservations: landmarks.reservations.length });
  function generate(cx: number, cz: number) {
    const data = new BlockColumn(), ox = cx * 16, oz = cz * 16, w = new VoxelWriter(data, ox, oz);
    let urbanChunk = false;
    for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) {
      const wx = ox + x, wz = oz + z, t = sample(wx, wz), h = t.height, urban = t.urban;
      const surface = urban ? surfaceAt(city, wx, wz) : null, paddy = agriculturalTerrace(wx, wz);
      const biome = vegetationBiome(wx, wz, seed), caveRoof = caveRoofAt(landmarks, wx, wz, t.caveRoof);
      urbanChunk ||= urban;
      for (let y = MIN_Y; y <= Math.max(SEA, h); y++) {
        let id: number = y > h ? B.Water : y === h ? urban ? surface === "garden" ? B.Grass : surface === "water" ? B.Air : surface === "court" ? B.Gravel : B.Paving
          : h < SEA + 1 ? B.Sand : t.region === "cliff" ? B.Stone : biome === "Snow Peaks" && h > 100 ? B.Snow : B.Grass : y > h - 4 ? B.Dirt : B.Stone;
        // Preserve v3 cave/geology distributions; only the surface protection roof varies.
        if (y > MIN_Y + 3 && y < h - caveRoof && ((Math.abs(noise3(wx / 27, y / 19, wz / 27, seed + 381) - .5) < .065 && noise3(wx / 43, y / 31, wz / 43, seed + 13) > .51) ||
          (y < -8 && noise3(wx / 36, y / 15, wz / 36, seed + 811) > .72)))
          id = y < -54 ? B.Lava : y < -28 && noise3(wx / 64, y / 32, wz / 64, seed + 719) > .68 ? B.Water : B.Air;
        if (id === B.Stone) {
          const r = hash(wx, wz, seed, y);
          if (r > .977) id = B.Coal; else if (r > .962 && y < 24) id = B.Iron; else if (r > .954 && y < -18) id = B.Jade; else if (r > .948 && y < -8) id = B.Gold;
        }
        if (surface === "water" && y >= 18) id = y === 20 ? B.Air : B.Water;
        if (paddy && y === h) id = wx === 350 || wx === 374 || (wz - 120) % 16 === 0 ? B.Moss : (wx - 351) % 7 === 0 ? B.Water : B.Farmland;
        if (id === B.Stone && y < -8) id = y < -36 ? B.Basalt : noise3(wx / 22, y / 7, wz / 22, seed + 300) > .63 ? B.Marble : B.Stone;
        data.set(x, y, z, y === MIN_Y ? B.Obsidian : id);
      }
      // Half-block terrace approaches preserve walking/NPC stepping without new architecture.
      if (urban && t.elevation % 1) data.set(x, h + 1, z, B.Slab);
      if (paddy && data.get(x, h, z) === B.Farmland) data.set(x, h + 1, z, packed(B.Rice, 3));
    }
    for (let z = oz - 4; z < oz + 20; z++) for (let x = ox - 4; x < ox + 20; x++) {
      if (inCity(x, z) || agriculturalTerrace(x, z) || hash(x, z, seed + 24) < .992) continue;
      if (landmarks.reservations.some(r => footprintDistance(r.footprint, x, z) <= r.margin + 4)) continue;
      if (plan.connections.some(c => footprintDistance({ kind: "corridor", points: c.points, halfWidth: c.halfWidth }, x, z) <= 4)) continue;
      const sx = Math.round((x - 80) / 160) * 160 + 80, sz = Math.round((z - 80) / 160) * 160 + 80;
      if (Math.abs(x - sx) < 8 && Math.abs(z - sz) < 8) continue;
      const t = sample(x, z); if (t.height <= SEA || t.region === "cliff" || t.region === "ridge") continue;
      const biome = vegetationBiome(x, z, seed);
      if (biome === "Bamboo Forest") w.fill(x, t.height + 1, z, x, t.height + 7, z, B.Bamboo);
      else tree(w, x, t.height + 1, z, biome === "Cherry Blossom Valley", B.Log);
    }
    if (urbanChunk) {
      for (const s of city.byChunk.get(`${cx},${cz}`) ?? []) drawStructure(new VoxelWriter(data, ox, oz, () => (s.baseY ?? 20) - 20), s);
      drawStreets(new VoxelWriter(data, ox, oz, x => Math.floor(cityElevation(plan, x)) - 20), city);
    }
    // Keep discovery content, but reject its entire footprint against protected sites.
    for (let sz = Math.floor((oz - 5 - 80) / 160) * 160 + 80; sz < oz + 21; sz += 160)
      for (let sx = Math.floor((ox - 5 - 80) / 160) * 160 + 80; sx < ox + 21; sx += 160) {
        const footprint = { kind: "area" as const, bounds: { x1: sx - 4, x2: sx + 4, z1: sz - 4, z2: sz + 4 } };
        if (agriculturalTerrace(sx, sz) || protectedSites.some(p => footprintsOverlap(footprint, p.footprint)) ||
          landmarks.reservations.some(r => footprintsOverlap(footprint, r.footprint, r.margin))) continue;
        const t = terrainSuitability(plan, sx, sz); if (!t.buildable) continue;
        const y = t.height + 1;
        for (let z = sz - 3; z <= sz + 3; z++) for (let x = sx - 3; x <= sx + 3; x++) {
          w.fill(x, Math.min(y - 1, terrainHeight(x, z)), z, x, y - 1, z, B.Moss);
          w.fill(x, y, z, x, y + 6, z, B.Air);
        }
        for (const x of [sx - 2, sx + 2]) for (const z of [sz - 2, sz + 2]) w.fill(x, y, z, x, y + 3, z, B.Red);
        w.fill(sx - 3, y + 4, sz - 3, sx + 3, y + 4, sz + 3, B.JadeRoof);
        w.fill(sx - 2, y + 5, sz - 2, sx + 2, y + 5, sz + 2, B.JadeRoof);
        w.put(sx, y, sz, B.Chest); w.put(sx, y + 3, sz, B.Lantern);
      }
    const mine = plan.mine;
    if (ox <= mine.entrance.x + mine.halfWidth && ox + 15 >= mine.entrance.x - mine.halfWidth && oz <= mine.end.z && oz + 15 >= mine.entrance.z) {
      const mineTop = terrainHeight(mine.entrance.x, mine.entrance.z);
      for (let z = Math.max(mine.entrance.z, oz); z <= Math.min(mine.end.z, oz + 15); z++) {
        const run = z - mine.entrance.z, y = mineTop - Math.floor(run / mine.stepRun);
        for (let x = mine.entrance.x - mine.halfWidth; x <= mine.entrance.x + mine.halfWidth; x++) {
          w.fill(x, y - 2, z, x, y + 3, z, B.Air); w.put(x, y - 1, z, B.Stone); w.put(x, y, z, run % 2 ? B.Slab : B.Planks);
          if (run > 5 && run % 8 === 0) { if (Math.abs(x - mine.entrance.x) === mine.halfWidth) w.fill(x, y + 1, z, x, y + 3, z, B.DarkTimber); w.put(x, y + 4, z, B.DarkTimber); }
        }
        if (run > 5 && run % 8 === 0) w.put(mine.entrance.x, y + 3, z, B.Lantern);
      }
    }
    data.compact(); return data;
  }
  return { version: 4 as const, plan, landmarks, city, planMs, generate, terrainHeight, biomeAt, inspect };
}
