import type { Lighting } from "../../src/world/lighting";
import { BlockColumn } from "../../src/world/sections";
import { World, Chunk } from "../../src/world/world";
import { block, boxes, B, emits } from "../../src/world/blocks";
import { MIN_Y, MAX_Y, idOf, stateOf } from "../../src/core/coords";
import { tileUV } from "../../src/render/atlas";
export type MeshData = {
  positions: number[];
  normals: number[];
  uvs: number[];
  colors: number[];
  indices: number[];
  sky: number[];
  lights: number[];
};
const empty = (): MeshData => ({
  positions: [],
  normals: [],
  uvs: [],
  colors: [],
  indices: [],
  sky: [],
  lights: [],
});
const normals = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];
const faces = [
  [1, 5, 7, 3],
  [4, 0, 2, 6],
  [2, 3, 7, 6],
  [4, 5, 1, 0],
  [5, 4, 6, 7],
  [0, 1, 3, 2],
];
export function meshChunk(world: World, chunk: Chunk, lighting?: Lighting, sectionY?: number) {
  const out = [empty(), empty(), empty()];
  // Nine direct chunk references avoid string-key map lookups for every hidden face.
  const neighbors: (BlockColumn | undefined)[] = [];
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++)
      neighbors.push(
        world.chunks.get(`${chunk.cx + dx},${chunk.cz + dz}`)?.blocks,
      );
  const sampleBlock = (x: number, y: number, z: number) => {
    if (y < MIN_Y) return B.Obsidian;
    if (y > MAX_Y) return 0;
    const dx = x < 0 ? -1 : x > 15 ? 1 : 0,
      dz = z < 0 ? -1 : z > 15 ? 1 : 0;
    return (
      neighbors[(dz + 1) * 3 + dx + 1]?.get((x+16)%16,y,(z+16)%16) ?? 0
    );
  };
  for (const sy of sectionY === undefined ? [...chunk.blocks.sections.keys()] : [sectionY])
  for (let y = sy*16; y < sy*16+16; y++)
    for (let z = 0; z < 16; z++)
      for (let x = 0; x < 16; x++) {
        const v = chunk.blocks.get(x,y,z),
          id = idOf(v);
        if (!id) continue;
        const b = block(v),
          wx = chunk.cx * 16 + x,
          wz = chunk.cz * 16 + z;
        const transparent = id === B.Water || id === B.Glass || id === B.Ice;
        const m = out[emits(v) > 0 ? 2 : transparent ? 1 : 0];
        for (const box of boxes(v)) {
          const [a, c, e, d, f, g] = box;
          const verts = [
            [a, c, e],
            [d, c, e],
            [a, f, e],
            [d, f, e],
            [a, c, g],
            [d, c, g],
            [a, f, g],
            [d, f, g],
          ];
          for (let face = 0; face < 6; face++) {
            const n = normals[face],
              nv = sampleBlock(x + n[0], y + n[1], z + n[2]),
              nb = block(nv);
            const full = b.shape === "cube";
            if (full && (nb.opaque || (transparent && idOf(nv) === id)))
              continue;
            const [u0, v0, u1, v1] = tileUV(id, face),
              uvs = [
                [u0, v0],
                [u1, v0],
                [u1, v1],
                [u0, v1],
              ],
              start = m.positions.length / 3;
            let shade = [0.77, 0.7, 1, 0.52, 0.88, 0.67][face];
            if (id === B.Wire && stateOf(v) > 0) shade = 1.5;
            const light = lighting?.sample(wx + n[0], y + n[1], wz + n[2]) ?? [
              1, 0,
            ];
            for (let i = 0; i < 4; i++) {
              const vertex = verts[faces[face][i]];
              m.positions.push(x + vertex[0], y - (sectionY === undefined ? 0 : sectionY*16) + vertex[1], z + vertex[2]);
              m.normals.push(...n);
              m.uvs.push(...uvs[i]);
              let ao = 1;
              if (full && face === 2) {
                const sx = vertex[0] === 0 ? -1 : 1,
                  sz = vertex[2] === 0 ? -1 : 1;
                ao -=
                  0.1 *
                  (Number(block(sampleBlock(x + sx, y + 1, z)).opaque) +
                    Number(block(sampleBlock(x, y + 1, z + sz)).opaque));
              }
              m.colors.push(shade * ao, shade * ao, shade * ao);
              m.sky.push(light[0]);
              m.lights.push(light[1]);
            }
            m.indices.push(
              start,
              start + 2,
              start + 1,
              start,
              start + 3,
              start + 2,
            );
          }
        }
      }
  return out;
}
