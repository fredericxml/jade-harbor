import { B } from "../blocks";
import { packed } from "../../core/coords";
import { hash } from "../noise";
import {
  CityPlan,
  Structure,
  CITY_Y,
  roadAt,
  canalAt,
  contains,
  parkAt,
  districtAt,
  DISTRICTS,
} from "./plan";
import { VoxelWriter } from "./writer";
import { drawPanda } from "./panda";
function child(
  s: Structure,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  kind: Structure["kind"],
  facing = 0,
  floors = 1,
): Structure {
  return {
    ...s,
    x1,
    z1,
    x2,
    z2,
    kind,
    facing,
    floors,
    style: (s.style + x1 + z1 + 10000) % 5,
  };
}
export function tree(
  w: VoxelWriter,
  x: number,
  y: number,
  z: number,
  cherry = true,
  trunk: number = B.DarkTimber,
) {
  w.fill(x, y, z, x, y + 4, z, trunk);
  for (let dy = 0; dy < 3; dy++)
    for (let dz = -3; dz <= 3; dz++)
      for (let dx = -3; dx <= 3; dx++)
        if (dx * dx + dz * dz + (dy - 1) ** 2 * 3 < 12)
          w.put(x + dx, y + 4 + dy, z + dz, cherry ? B.Blossom : B.Leaves);
}
function roof(w: VoxelWriter, s: Structure, base: number, eave = 1) {
  const { w: width, d, fill, put } = w.local(s),
    r = Math.min(5, Math.floor(Math.min(width, d) / 2));
  for (let k = 0; k < r; k++) {
    const hipped = s.style % 3 !== 1,
      du = hipped ? k : Math.min(1, k);
    fill(
      -eave + du,
      base + k,
      -eave + k,
      width - 1 + eave - du,
      base + k,
      d - 1 + eave - k,
      s.roof,
    );
  }
  fill(
    s.style % 3 === 1 ? 0 : r - 1,
    base + r,
    -eave + r,
    width - 1 - (s.style % 3 === 1 ? 0 : r - 1),
    base + r,
    d - 1 + eave - r,
    B.DarkTimber,
  );
  for (const u of [-eave, width - 1 + eave])
    for (const v of [-eave, d - 1 + eave]) put(u, base + 1, v, s.roof);
  if (width >= 15)
    for (const u of [0, width - 1]) {
      put(u, base + 2, 0, B.GoldTrim);
      put(u, base + 2, d - 1, B.GoldTrim);
    }
}
function house(w: VoxelWriter, s: Structure, base = 20) {
  const { w: width, d, fill, put } = w.local(s),
    n = s.floors,
    shop = [
      "shop",
      "shophouse",
      "merchant",
      "corner-shop",
      "teahouse",
      "canal-house",
    ].includes(s.kind),
    timber = s.style % 2 ? B.DarkTimber : B.Red,
    wall = [B.CreamWall, B.Planks, B.Brick, B.CreamWall, B.Planks][s.style],
    entrance = Math.floor(width / 2);
  fill(0, base, 0, width - 1, base, d - 1, B.Paving);
  for (let floor = 0; floor < n; floor++) {
    const y = base + floor * 5;
    fill(0, y + 1, 0, width - 1, y + 4, d - 1, wall);
    fill(1, y + 1, 1, width - 2, y + 4, d - 2, B.Air);
    fill(0, y + 5, 0, width - 1, y + 5, d - 1, B.DarkTimber);
    for (const u of [0, width - 1])
      for (const v of [0, d - 1]) fill(u, y + 1, v, u, y + 5, v, timber);
    for (let u = 2; u < width - 2; u += 4) {
      fill(
        u,
        y + 2,
        0,
        Math.min(u + 1, width - 2),
        y + 3,
        0,
        floor % 2 ? B.Paper : B.Glass,
      );
      fill(u, y + 2, d - 1, Math.min(u + 1, width - 2), y + 3, d - 1, B.Glass);
    }
    for (let v = 3; v < d - 2; v += 5) {
      fill(0, y + 2, v, 0, y + 3, v + 1, B.Glass);
      fill(width - 1, y + 2, v, width - 1, y + 3, v + 1, B.Paper);
    }
    if (floor < n - 1) {
      fill(width - 4, y + 5, 2, width - 2, y + 7, 7, B.Air);
      for (let k = 0; k < 5; k++)
        put(
          width - 3,
          y + 1 + k,
          3 + k,
          packed(B.Stairs, (2 - s.facing + 4) % 4),
        );
    }
    if (floor > 0 && shop) {
      fill(1, y, -1, width - 2, y, -1, B.Planks);
      fill(1, y + 1, -1, width - 2, y + 1, -1, B.Fence);
      fill(entrance, y + 1, 0, entrance, y + 2, 0, B.Air);
    }
  }
  fill(entrance - 1, base + 1, 0, entrance + 1, base + 3, 0, B.Air);
  if (!shop) {
    put(entrance, base + 1, 0, packed(B.Door, s.facing));
    put(entrance, base + 2, 0, packed(B.Door, s.facing | 8));
  }
  if (shop) {
    fill(
      1,
      base + 4,
      -1,
      width - 2,
      base + 4,
      -1,
      s.style % 2 ? B.RubyRoof : B.JadeRoof,
    );
    const sign =
      s.kind === "teahouse"
        ? B.TeaSign
        : s.style % 3 === 0
          ? B.NoodleSign
          : B.MarketSign;
    put(entrance, base + 4, 0, sign);
    put(width - 2, base + 6, -1, sign);
    put(width - 2, base + 7, -1, B.Banner);
  }
  put(1, base + 3, -1, B.Lantern);
  put(width - 2, base + 3, -1, B.Lantern);
  for (const u of [1, width - 2]) put(u, base + 4, 0, B.DarkTimber);
  put(2, base + 1, d - 3, s.kind === "workshop" ? B.Furnace : B.Chest);
  put(3, base + 1, d - 3, B.Workbench);
  put(width - 3, base + 1, d - 3, s.kind === "home" ? B.Bed : B.Pottery);
  if (shop) {
    fill(1, base + 1, 3, 2, base + 1, 4, B.Planks);
    put(1, base + 2, 3, B.Pottery);
    if (s.kind === "teahouse") {
      put(2, base + 1, d - 5, B.Slab);
      put(4, base + 1, d - 5, B.Slab);
    }
  }
  if (s.kind === "workshop" || s.kind === "warehouse") {
    for (let u = 1; u < width - 2; u += 3) put(u, base + 1, d - 2, B.Crate);
    fill(
      width - 2,
      base + 1,
      d - 2,
      width - 2,
      base + n * 5 + 3,
      d - 2,
      B.Brick,
    );
  }
  roof(w, s, base + n * 5 + 1);
}
function pavilion(w: VoxelWriter, s: Structure, base = 20) {
  const { w: width, d, fill, put } = w.local(s);
  fill(0, base, 0, width - 1, base, d - 1, B.Paving);
  for (const u of [0, width - 1])
    for (const v of [0, d - 1]) {
      fill(u, base + 1, v, u, base + 5, v, B.Red);
      put(u, base + 4, v, B.GoldTrim);
    }
  fill(0, base + 5, 0, width - 1, base + 5, d - 1, B.DarkTimber);
  roof(w, s, base + 6);
  put(2, base + 4, 2, B.Lantern);
  if (width > 6) {
    fill(2, base + 1, d - 2, width - 3, base + 1, d - 2, B.Slab);
  }
}
function stall(w: VoxelWriter, s: Structure, base = 20) {
  const { w: width, d, fill, put } = w.local(s),
    depth = Math.min(6, d);
  fill(0, base, 0, width - 1, base, depth, B.Paving);
  for (const u of [0, width - 1])
    for (const v of [0, depth])
      fill(u, base + 1, v, u, base + 4, v, B.DarkTimber);
  for (let u = -1; u <= width; u++)
    fill(
      u,
      base + 5,
      -1,
      u,
      base + 5,
      depth + 1,
      (u + s.style) % 3 ? B.RubyRoof : B.CreamWall,
    );
  fill(1, base + 1, 1, width - 2, base + 1, 1, B.Planks);
  for (let u = 1; u < width - 1; u += 2)
    put(
      u,
      base + 2,
      1,
      [B.Pottery, B.Tea, B.Flower, B.Crate][(u + s.style) % 4],
    );
  put(Math.floor(width / 2), base + 4, 0, B.Lantern);
}
function gate(w: VoxelWriter, s: Structure) {
  const cx = Math.floor((s.x1 + s.x2) / 2),
    cz = Math.floor((s.z1 + s.z2) / 2);
  for (const x of [cx - 6, cx + 6]) {
    w.fill(x - 1, 20, cz - 1, x + 1, 21, cz + 1, B.Marble);
    w.fill(x, 22, cz, x, 30, cz, B.Red);
    w.put(x, 29, cz + 1, B.GoldTrim);
  }
  w.fill(cx - 7, 28, cz, cx + 7, 30, cz, B.Red);
  w.put(cx, 29, cz + 1, B.PandaSign);
  const r = child(s, cx - 8, cz - 2, cx + 8, cz + 2, "gate");
  r.roof = B.JadeRoof;
  r.style = 1;
  roof(w, r, 31);
  for (const x of [cx - 4, cx + 4]) w.put(x, 27, cz, B.Lantern);
}
function compound(w: VoxelWriter, s: Structure) {
  const cx = Math.floor((s.x1 + s.x2) / 2),
    cz = Math.floor((s.z1 + s.z2) / 2),
    wide = s.x2 - s.x1,
    deep = s.z2 - s.z1;
  w.fill(s.x1, 20, s.z1, s.x2, 20, s.z2, B.Paving);
  for (const x of [s.x1, s.x2]) w.fill(x, 21, s.z1, x, 23, s.z2, B.CreamWall);
  for (const z of [s.z1, s.z2]) w.fill(s.x1, 21, z, s.x2, 23, z, B.CreamWall);
  w.fill(cx - 2, 21, s.z1, cx + 2, 24, s.z1, B.Air);
  w.fill(cx - 2, 21, s.z2, cx + 2, 24, s.z2, B.Air);
  const depth = Math.min(12, Math.floor(deep / 3));
  house(
    w,
    child(s, s.x1 + 3, s.z1 + 3, s.x2 - 3, s.z1 + depth, "home", 2, s.floors),
  );
  if (wide > 28) {
    house(
      w,
      child(s, s.x1 + 3, s.z1 + depth + 4, s.x1 + 13, s.z2 - 4, "home", 1),
    );
    house(
      w,
      child(
        s,
        s.x2 - 13,
        s.z1 + depth + 4,
        s.x2 - 3,
        s.z2 - 4,
        s.kind === "workshop" ? "workshop" : "home",
        3,
      ),
    );
  }
  if (wide > 36) {
    for (const x of [cx - 7, cx + 7]) {
      w.fill(x - 1, 20, cz - 1, x + 1, 20, cz + 1, B.Dirt);
      w.fill(x, 21, cz, x, 25, cz, B.Bamboo);
    }
    w.put(cx, 21, cz, B.Pottery);
  }
  if (s.kind === "workshop") {
    w.fill(cx - 5, 21, cz + 7, cx - 3, 22, cz + 9, B.Crate);
    w.put(cx + 3, 21, cz + 7, B.Furnace);
    w.put(cx + 4, 21, cz + 7, B.Workbench);
  }
}
function pagoda(w: VoxelWriter, s: Structure) {
  const cx = Math.floor((s.x1 + s.x2) / 2),
    cz = Math.floor((s.z1 + s.z2) / 2) - 8;
  w.fill(s.x1, 20, s.z1, s.x2, 20, s.z2, B.Paving);
  w.fill(cx - 12, 21, cz - 12, cx + 12, 22, cz + 12, B.Marble);
  for (let t = 0; t < 5; t++) {
    const r = 8 - t,
      y = 23 + t * 6,
      p = child(s, cx - r, cz - r, cx + r, cz + r, "pavilion");
    p.roof = t % 2 ? B.Roof : B.JadeRoof;
    p.style = 0;
    pavilion(w, p, y - 1);
    if (t < 4) w.fill(cx + 2, y, cz + 1, cx + 2, y + 6, cz + 1, B.Ladder);
  }
  for (let k = 0; k < 4; k++) {
    const y = 21 + Math.floor(k / 2);
    w.fill(
      cx - 4,
      y,
      cz + 16 - k,
      cx + 4,
      y,
      cz + 16 - k,
      k % 2 ? B.Marble : B.Slab,
    );
  }
  for (const side of [-1, 1]) {
    const px = cx + side * 17;
    w.fill(px - 3, 20, s.z2 - 9, px + 3, 21, s.z2 - 3, B.Marble);
    drawPanda(w, px, 22, s.z2 - 6, true);
  }
  for (const x of [s.x1 + 1, s.x2 - 1])
    w.fill(x, 21, s.z1 + 1, x, 23, s.z2 - 1, B.CreamWall);
}
function civic(w: VoxelWriter, s: Structure) {
  const cx = Math.floor((s.x1 + s.x2) / 2);
  w.fill(s.x1, 20, s.z1, s.x2, 20, s.z2, B.Paving);
  w.fill(s.x1 + 5, 21, s.z1 + 6, s.x2 - 5, 23, s.z1 + 35, B.Marble);
  const hall = child(
    s,
    s.x1 + 9,
    s.z1 + 10,
    s.x2 - 9,
    s.z1 + 31,
    "temple",
    2,
    2,
  );
  hall.roof = B.RubyRoof;
  house(w, hall, 24);
  for (let k = 0; k < 8; k++) {
    const y = 21 + Math.floor(k / 2);
    w.fill(
      cx - 5,
      y,
      s.z1 + 44 - k,
      cx + 5,
      y,
      s.z1 + 44 - k,
      k % 2 ? B.Marble : B.Slab,
    );
  }
  w.fill(cx - 5, 21, s.z1 + 32, cx + 5, 24, s.z1 + 36, B.Marble);
  for (const x of [s.x1, s.x2]) w.fill(x, 21, s.z1, x, 25, s.z2, B.Red);
  w.fill(s.x1, 25, s.z1, s.x2, 25, s.z1, B.Roof);
  for (const x of [s.x1 + 6, s.x2 - 6])
    for (const z of [s.z2 - 8, s.z2 - 22]) {
      w.fill(x, 21, z, x, 25, z, B.SculptureStone);
      w.put(x, 26, z, B.Lantern);
    }
}
function market(w: VoxelWriter, s: Structure) {
  const width = s.x2 - s.x1,
    depth = s.z2 - s.z1;
  if (width < 26 || depth < 26) {
    house(w, { ...s, kind: "shop" });
    return;
  }
  const cx = Math.floor((s.x1 + s.x2) / 2);
  w.fill(s.x1, 20, s.z1, s.x2, 20, s.z2, B.Paving);
  const hall = child(s, cx - 11, s.z1 + 6, cx + 11, s.z1 + 22, "pavilion");
  hall.roof = B.RubyRoof;
  pavilion(w, hall);
  for (let z = s.z1 + 29; z < s.z2 - 7; z += 13)
    for (const x of [s.x1 + 4, s.x2 - 12])
      stall(w, child(s, x, z, x + 8, z + 7, "stall", x < cx ? 1 : 3));
  for (let x = s.x1 + 5; x < s.x2 - 4; x += 11)
    stall(
      w,
      child(s, x, s.z2 - 8, Math.min(x + 7, s.x2 - 3), s.z2 - 2, "stall"),
    );
}
function garden(w: VoxelWriter, s: Structure) {
  const cx = Math.floor((s.x1 + s.x2) / 2),
    cz = Math.floor((s.z1 + s.z2) / 2);
  w.fill(s.x1, 20, s.z1, s.x2, 20, s.z2, B.Grass);
  for (let dz = -13; dz <= 13; dz++)
    for (let dx = -19; dx <= 19; dx++) {
      const r = (dx * dx) / 324 + (dz * dz) / 144;
      if (r < 1) {
        w.fill(cx + dx, 18, cz + dz, cx + dx, 19, cz + dz, B.Water);
        w.put(cx + dx, 20, cz + dz, B.Air);
        if (hash(dx, dz, s.seed) > 0.95) w.put(cx + dx, 20, cz + dz, B.Lotus);
      } else if (r < 1.25) w.put(cx + dx, 20, cz + dz, B.Marble);
    }
  for (let dx = -21; dx <= 21; dx++) {
    const a = Math.abs(dx),
      top = a > 16 ? 20 : a > 5 ? 21 : 22,
      half = (a <= 16 && a > 10) || a <= 5;
    w.fill(cx + dx, 20, cz - 1, cx + dx, top - 1, cz + 1, B.Planks);
    w.fill(
      cx + dx,
      top,
      cz - 1,
      cx + dx,
      top,
      cz + 1,
      half ? B.Slab : B.Planks,
    );
    if (a < 19)
      for (const z of [cz - 2, cz + 2])
        w.put(cx + dx, top + (half ? 0 : 1), z, B.Fence);
  }
  for (const dx of [-10, 10])
    w.fill(cx + dx, 18, cz - 1, cx + dx, 20, cz + 1, B.SculptureStone);
  for (const side of [-1, 1]) {
    tree(w, cx + side * 24, 21, cz - 17);
    tree(w, cx + side * 24, 21, cz + 19);
  }
  pavilion(w, child(s, s.x1 + 5, s.z1 + 5, s.x1 + 13, s.z1 + 13, "pavilion"));
  for (let z = s.z1 + 2; z <= s.z2 - 2; z++) {
    w.put(s.x1 + 2, 20, z, B.Paving);
    w.put(s.x2 - 2, 20, z, B.Paving);
  }
  for (let x = s.x1 + 2; x <= s.x2 - 2; x++) {
    w.put(x, 20, s.z1 + 2, B.Paving);
    w.put(x, 20, s.z2 - 2, B.Paving);
  }
}
function plaza(w: VoxelWriter, s: Structure) {
  const cx = Math.floor((s.x1 + s.x2) / 2),
    cz = -48 + (s.z1 + 71);
  for (let z = s.z1; z <= s.z2; z++)
    for (let x = s.x1; x <= s.x2; x++) {
      const r = Math.round(Math.hypot(x - cx, z - cz)),
        id =
          r === 15 ||
          Math.abs(x - cx) === 19 ||
          z === s.z1 + 1 ||
          z === s.z2 - 1
            ? B.Marble
            : r === 13
              ? B.GoldTrim
              : B.Paving;
      w.put(x, 20, z, id);
    }
  w.fill(cx - 9, 21, cz - 6, cx + 9, 21, cz + 7, B.SculptureStone);
  w.fill(cx - 8, 22, cz - 5, cx + 8, 22, cz + 7, B.Marble);
  for (let k = 0; k < 4; k++) {
    const y = 21 + Math.floor(k / 2),
      z = cz + 11 - k;
    w.fill(cx - 4, y, z, cx + 4, y, z, k % 2 ? B.Marble : B.Slab);
  }
  drawPanda(w, cx, 23, cz);
  for (const x of [s.x1 + 1, s.x2 - 1])
    w.fill(x, 21, s.z1 + 2, x, 21, s.z1 + 12, B.Fence);
  for (const x of [s.x1 + 5, s.x2 - 5])
    for (const z of [s.z1 + 5, s.z2 - 5]) {
      w.fill(x - 2, 20, z - 2, x + 2, 20, z + 2, B.Marble);
      w.fill(x - 1, 21, z - 1, x + 1, 21, z + 1, B.Dirt);
      if (z < s.z1 + 10) tree(w, x, 22, z, true);
      else {
        w.fill(x, 22, z, x, 27, z, B.Bamboo);
        w.put(x - 1, 22, z + 1, B.Flower);
      }
    }
  for (const x of [cx - 13, cx + 13]) {
    w.fill(x, 21, cz + 7, x, 25, cz + 7, B.Red);
    w.fill(x - 1, 25, cz + 7, x + 1, 25, cz + 7, B.DarkTimber);
    w.put(x, 24, cz + 8, B.Lantern);
    w.fill(x - 2, 21, cz + 12, x + 2, 21, cz + 12, B.Slab);
  }
  w.fill(cx + 7, 21, s.z2 + 1, cx + 7, 23, s.z2 + 1, B.DarkTimber);
  w.put(cx + 7, 24, s.z2 + 1, B.PandaSign);
}
export function drawStructure(w: VoxelWriter, s: Structure) {
  if (s.kind === "panda-plaza") return plaza(w, s);
  if (s.kind === "gate") return gate(w, s);
  if (s.kind === "pagoda") return pagoda(w, s);
  if (s.kind === "civic") return civic(w, s);
  if (s.kind === "garden") return garden(w, s);
  if (s.kind === "market-hall") return market(w, s);
  if (
    (s.kind === "courtyard" || s.kind === "workshop") &&
    s.x2 - s.x1 > 27 &&
    s.z2 - s.z1 > 27
  )
    return compound(w, s);
  if (s.kind === "pavilion") return pavilion(w, s);
  if (s.kind === "stall") return stall(w, s);
  return house(w, s);
}
export function drawStreets(w: VoxelWriter, p: CityPlan) {
  // Canal embankments, approach-level bridges and continuous pedestrian banks.
  for (let z = w.oz; z < w.oz + 16; z++)
    if (z - p.oz > -234 && z - p.oz < 144) {
      const bridge = p.roads.find(
        (r) => r.axis === "z" && Math.abs(z - p.oz - r.at) <= r.half,
      );
      for (let x = w.ox; x < w.ox + 16; x++) {
        const dx = Math.abs(x - p.ox - 144);
        if (dx <= 4) {
          if (bridge) w.put(x, 20, z, B.Marble);
          else {
            w.fill(x, 18, z, x, 19, z, B.Water);
            w.put(x, 20, z, B.Air);
          }
        } else if (dx === 5) w.fill(x, 18, z, x, 20, z, B.SculptureStone);
        else if (dx <= 8) w.put(x, 20, z, B.Paving);
        if (bridge && Math.abs(z - p.oz - bridge.at) === bridge.half && dx <= 5)
          w.put(x, 21, z, B.Fence);
      }
    }
  // Street objects use reserved sidewalk bands, never the road center.
  for (const road of p.roads) {
    if (road.axis !== "x") continue;
    for (
      let z = Math.floor((w.oz - p.oz - 3) / 24) * 24;
      z < w.oz - p.oz + 19;
      z += 24
    ) {
      const gz = z + p.oz,
        at = road.at + p.ox;
      if (
        Math.abs(z) > 306 ||
        p.reservations.some((r) => contains(r, at, gz)) ||
        p.roads.some((r) => r.axis === "z" && Math.abs(r.at - z) < 10)
      )
        continue;
      for (const side of [-1, 1]) {
        const x = at + side * (road.half + 1);
        if (
          canalAt(p, x, gz) ||
          (Math.abs(road.at - 144) < 1 && z > -234 && z < 144)
        )
          continue;
        w.fill(x, 21, gz, x, 25, gz, B.DarkTimber);
        w.put(x, 26, gz, B.GoldTrim);
        w.put(x, 24, gz + 1, B.Lantern);
      }
      if (road.at === 0) {
        w.fill(at - 6, 26, gz, at + 6, 26, gz, B.Fence);
        for (const dx of [-3, 0, 3]) w.put(at + dx, 25, gz, B.Lantern);
      }
    }
  }
  // Only planned park interiors receive greenery. Candidate roots consider their full canopy margin.
  for (let z = Math.floor((w.oz - 5) / 9) * 9; z <= w.oz + 21; z += 9)
    for (let x = Math.floor((w.ox - 5) / 9) * 9; x <= w.ox + 21; x += 9) {
      if (
        !parkAt(p, x, z) ||
        roadAt(p, x, z, 6) ||
        p.structures.some(
          (s) =>
            x >= s.x1 - 4 && x <= s.x2 + 4 && z >= s.z1 - 4 && z <= s.z2 + 4,
        ) ||
        p.alleys.some(
          (a) =>
            x >= a.x1 - 4 && x <= a.x2 + 4 && z >= a.z1 - 4 && z <= a.z2 + 4,
        )
      )
        continue;
      if (hash(x, z, p.seed) < 0.5)
        tree(w, x, 21, z, hash(x, z, p.seed + 3) > 0.25);
      else w.fill(x, 21, z, x, 27, z, B.Bamboo);
    }
}
