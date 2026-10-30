import { MIN_Y, MAX_Y, SEA, clamp, packed } from "../core/coords";
import { B } from "./blocks";
import { fbm, noise, noise3, hash, seedNumber } from "./noise";
import { cityNear, inCity, surfaceAt, districtAt, CityPlan } from "./city/plan";
import { VoxelWriter } from "./city/writer";
import { drawStructure, drawStreets, tree } from "./city/structures";
export const GENERATOR_VERSION = 3;
import { BlockColumn } from "./sections";
export function biomeAt(x: number, z: number, seed: number) {
  const p = cityNear(x, z, seed);
  if (p && inCity(x - p.ox, z - p.oz))
    return "Jade Harbor · " + districtAt(x - p.ox, z - p.oz);
  const n = noise(x / 190, z / 190, seed + 82);
  return n < 0.22
    ? "Cherry Blossom Valley"
    : n < 0.44
      ? "Bamboo Forest"
      : n < 0.66
        ? "Cedar Highlands"
        : n < 0.83
          ? "Jade Mountains"
          : "Snow Peaks";
}
export function naturalHeight(x: number, z: number, seed: number) {
  const n = fbm(x / 100, z / 100, seed),
    mount =
      Math.pow(Math.max(0, noise(x / 170, z / 170, seed + 8) - 0.45) * 2, 2) *
      185;
  let h = 15 + Math.floor(n * 16 + mount);
  const river = 380 + Math.round((noise(z / 130, 0, seed + 91) - 0.5) * 24);
  if (Math.abs(x - river) < 6) h = Math.min(h, 16);
  return clamp(h, 5, MAX_Y - 20);
}
// Three compact agricultural terraces beyond the eastern urban edge.
export function paddyAt(x: number, z: number) {
  return x >= 350 && x <= 374 && z >= 120 && z <= 166;
}
export function terrainHeight(x: number, z: number, seed: number) {
  if (paddyAt(x, z)) return 21 + Math.floor((z - 120) / 16);
  const p = cityNear(x, z, seed);
  if (p) {
    const lx = x - p.ox,
      lz = z - p.oz;
    if (inCity(lx, lz)) return 20;
    const blend = clamp(
      Math.max(
        (Math.max(Math.abs(lx), Math.abs(lz)) - 328) / 48,
        (Math.hypot(lx, lz) - 436) / 48,
      ),
      0,
      1,
    );
    return Math.round(20 * (1 - blend) + naturalHeight(x, z, seed) * blend);
  }
  return naturalHeight(x, z, seed);
}
export function generateChunk(cx: number, cz: number, seedText: string) {
  const seed = seedNumber(seedText),
    data = new BlockColumn(),
    ox = cx * 16,
    oz = cz * 16,
    w = new VoxelWriter(data, ox, oz),
    plans = new Map<string, CityPlan>();
  for (let z = 0; z < 16; z++)
    for (let x = 0; x < 16; x++) {
      const wx = ox + x,
        wz = oz + z,
        p = cityNear(wx, wz, seed),
        urban = p && inCity(wx - p.ox, wz - p.oz),
        h = terrainHeight(wx, wz, seed),
        biome = urban ? "" : biomeAt(wx, wz, seed);
      if (urban) plans.set(`${p.ox},${p.oz}`, p);
      const surface = urban ? surfaceAt(p, wx, wz) : null,
        paddy = paddyAt(wx, wz);
      for (let y = MIN_Y; y <= Math.max(SEA, h); y++) {
        let id: number =
          y > h
            ? B.Water
            : y === h
              ? urban
                ? surface === "garden"
                  ? B.Grass
                  : surface === "water"
                    ? B.Air
                    : surface === "court"
                      ? B.Gravel
                      : B.Paving
                : h < SEA + 1
                  ? B.Sand
                  : biome === "Snow Peaks" && h > 30
                    ? B.Snow
                    : B.Grass
              : y > h - 4
                ? B.Dirt
                : B.Stone;
        if (y > MIN_Y + 3 && y < h - 7) {
          if (
            (Math.abs(noise3(wx/27,y/19,wz/27,seed+381)-.5)<.065 && noise3(wx/43,y/31,wz/43,seed+13)>.51) ||
            (y < -8 && noise3(wx/36,y/15,wz/36,seed+811)>.72)
          )
            id = y < -54 ? B.Lava : y < -28 && noise3(wx/64,y/32,wz/64,seed+719)>.68 ? B.Water : B.Air;
        }
        if (id === B.Stone) {
          const r = hash(wx, wz, seed, y);
          if (r > 0.977) id = B.Coal;
          else if (r > 0.962 && y < 24) id = B.Iron;
          else if (r > 0.954 && y < -18) id = B.Jade;
          else if (r > 0.948 && y < -8) id = B.Gold;
        }
        if (surface === "water" && y >= 18) id = y === 20 ? B.Air : B.Water;
        if (paddy && y === h)
          id =
            wx === 350 || wx === 374 || (wz - 120) % 16 === 0
              ? B.Moss
              : (wx - 351) % 7 === 0
                ? B.Water
                : B.Farmland;
        if(id===B.Stone && y < -8) id = y < -36 ? B.Basalt : noise3(wx/22,y/7,wz/22,seed+300)>.63 ? B.Marble : B.Stone;
        data.set(x,y,z,y===MIN_Y?B.Obsidian:id);
      }
      if (paddy && data.get(x,h,z) === B.Farmland)
        data.set(x,h+1,z,packed(B.Rice,3));
    }
  // Nature is outside urban occupancy; roots are global so canopies cross chunk borders safely.
  for (let z = oz - 4; z < oz + 20; z++)
    for (let x = ox - 4; x < ox + 20; x++) {
      const p = cityNear(x, z, seed);
      if ((p && inCity(x - p.ox, z - p.oz)) || paddyAt(x, z)) continue;
      const shrineX = Math.round((x - 80) / 160) * 160 + 80,
        shrineZ = Math.round((z - 80) / 160) * 160 + 80;
      if (Math.abs(x - shrineX) < 8 && Math.abs(z - shrineZ) < 8) continue;
      if (hash(x, z, seed + 24) < 0.992) continue;
      const h = terrainHeight(x, z, seed);
      if (h <= SEA) continue;
      const biome = biomeAt(x, z, seed);
      if (biome === "Bamboo Forest") w.fill(x, h + 1, z, x, h + 7, z, B.Bamboo);
      else tree(w, x, h + 1, z, biome === "Cherry Blossom Valley", B.Log);
    }
  for (const p of plans.values()) {
    for (const s of p.byChunk.get(`${cx},${cz}`) ?? []) drawStructure(w, s);
    drawStreets(w, p);
  }
  // Retain the existing wilderness shrine/chest discovery loop outside urban occupancy.
  for (
    let sz = Math.floor((oz - 5 - 80) / 160) * 160 + 80;
    sz < oz + 21;
    sz += 160
  )
    for (
      let sx = Math.floor((ox - 5 - 80) / 160) * 160 + 80;
      sx < ox + 21;
      sx += 160
    ) {
      const p = cityNear(sx, sz, seed);
      if ((p && inCity(sx - p.ox, sz - p.oz)) || paddyAt(sx, sz)) continue;
      const y = terrainHeight(sx, sz, seed) + 1;
      for (let z = sz - 3; z <= sz + 3; z++)
        for (let x = sx - 3; x <= sx + 3; x++) {
          w.fill(
            x,
            Math.min(y - 1, terrainHeight(x, z, seed)),
            z,
            x,
            y - 1,
            z,
            B.Moss,
          );
          w.fill(x, y, z, x, y + 6, z, B.Air);
        }
      for (const x of [sx - 2, sx + 2])
        for (const z of [sz - 2, sz + 2]) w.fill(x, y, z, x, y + 3, z, B.Red);
      w.fill(sx - 3, y + 4, sz - 3, sx + 3, y + 4, sz + 3, B.JadeRoof);
      w.fill(sx - 2, y + 5, sz - 2, sx + 2, y + 5, sz + 2, B.JadeRoof);
      w.put(sx, y, sz, B.Chest);
      w.put(sx, y + 3, sz, B.Lantern);
    }
  // A reachable timber mine descends in half-block steps beyond the eastern city edge.
  // It is generated in global coordinates so neighboring chunks agree exactly.
  const mineTop=terrainHeight(360,0,seed);
  for(let z=Math.max(0,oz);z<=Math.min(144,oz+15);z++) {
    const y=mineTop-Math.floor(z/2);
    for(let x=358;x<=362;x++) {
      w.fill(x,y-2,z,x,y+3,z,B.Air);
      w.put(x,y-1,z,B.Stone);
      w.put(x,y,z,z%2?B.Slab:B.Planks);
      if(z>5 && z%8===0) {if(x===358 || x===362) w.fill(x,y+1,z,x,y+3,z,B.DarkTimber);w.put(x,y+4,z,B.DarkTimber);}
    }
    if(z>5 && z%8===0) w.put(360,y+3,z,B.Lantern);
  }
  data.compact();
  return data;
}
