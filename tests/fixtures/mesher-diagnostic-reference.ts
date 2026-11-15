import type { Lighting } from "../../src/world/lighting";
import { BlockColumn } from "../../src/world/sections";
import { World, Chunk } from "../../src/world/world";
import { block, boxes, B, emits } from "../../src/world/blocks";
import { MIN_Y, MAX_Y, idOf, stateOf } from "../../src/core/coords";
export type MeshData = {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  /** Atlas tile coordinates (column, top-origin row), constant per face. */
  tiles: Uint8Array;
  colors: Float32Array;
  indices: Uint16Array | Uint32Array;
  sky: Float32Array;
  lights: Float32Array;
  /** Number of water triangles packed into the shared transparent buffer. */
  waterTriangles: number;
};

// Mesh output is consumed directly by Three.js BufferAttributes. Growing typed
// buffers avoid the many boxed-number entries and the later Float32 conversion
// copies produced by ordinary JS arrays per material group.
class TileBuffer {
  private data = new Uint8Array(64);
  length = 0;
  push(x: number, y: number) {
    const required = this.length + 2;
    if (required > this.data.length) {
      const grown = new Uint8Array(Math.max(required, this.data.length * 2));
      grown.set(this.data);
      this.data = grown;
    }
    this.data[this.length++] = x;
    this.data[this.length++] = y;
  }
  finish() { return this.data.subarray(0, this.length); }
}
class NumericBuffer {
  private data: Float32Array | Uint32Array;
  length = 0;
  private maxValue = 0;
  constructor(private readonly integer = false, capacity = 0) {
    this.data = integer ? new Uint32Array(capacity) : new Float32Array(capacity);
  }
  push(a: number, b?: number, c?: number, d?: number, e?: number, f?: number) {
    const count = arguments.length;
    const required = this.length + count;
    if (required > this.data.length) {
      let capacity = Math.max(64, this.data.length * 2);
      while (capacity < required) capacity *= 2;
      const grown = this.integer ? new Uint32Array(capacity) : new Float32Array(capacity);
      grown.set(this.data);
      this.data = grown;
    }
    const data = this.data;
    data[this.length++] = a;
    if (this.integer && a > this.maxValue) this.maxValue = a;
    if (count > 1) { data[this.length++] = b!; if (this.integer && b! > this.maxValue) this.maxValue = b!; }
    if (count > 2) { data[this.length++] = c!; if (this.integer && c! > this.maxValue) this.maxValue = c!; }
    if (count > 3) { data[this.length++] = d!; if (this.integer && d! > this.maxValue) this.maxValue = d!; }
    if (count > 4) { data[this.length++] = e!; if (this.integer && e! > this.maxValue) this.maxValue = e!; }
    if (count > 5) { data[this.length++] = f!; if (this.integer && f! > this.maxValue) this.maxValue = f!; }
    return this.length;
  }
  finish() {
    // Keep the builder's compact typed backing store instead of copying every
    // attribute into a second typed array. Capacity is bounded below 2× length.
    return this.data.subarray(0, this.length) as Float32Array | Uint32Array;
  }
  finishIndices() {
    const values = this.data as Uint32Array;
    return this.maxValue <= 65535
      ? new Uint16Array(values.subarray(0, this.length))
      : values.slice(0, this.length);
  }
}
type MeshDataBuilder = {
  positions: NumericBuffer;
  normals: NumericBuffer;
  uvs: NumericBuffer;
  tiles: TileBuffer;
  colors: NumericBuffer;
  indices: NumericBuffer;
  sky: NumericBuffer;
  lights: NumericBuffer;
  waterTriangles: number;
};
const empty = (): MeshDataBuilder => ({
  positions: new NumericBuffer(),
  normals: new NumericBuffer(),
  uvs: new NumericBuffer(),
  tiles: new TileBuffer(),
  colors: new NumericBuffer(),
  indices: new NumericBuffer(true),
  sky: new NumericBuffer(),
  lights: new NumericBuffer(),
  waterTriangles: 0,
});
const finish = (m: MeshDataBuilder): MeshData => ({
  positions: m.positions.finish() as Float32Array,
  normals: m.normals.finish() as Float32Array,
  uvs: m.uvs.finish() as Float32Array,
  tiles: m.tiles.finish(),
  colors: m.colors.finish() as Float32Array,
  indices: m.indices.finishIndices(),
  sky: m.sky.finish() as Float32Array,
  lights: m.lights.finish() as Float32Array,
  waterTriangles: m.waterTriangles,
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
type FaceRecord = { tileX: number; tileY: number; color: number; sky: number; light: number };
const faceTileCache: Array<readonly [number, number] | undefined> = [];
function faceTile(id: number, face: number): readonly [number, number] {
  const tile = id * 3 + (face === 2 ? 0 : face === 3 ? 2 : 1);
  return faceTileCache[tile] ?? (faceTileCache[tile] = [tile % 16, Math.floor(tile / 16)] as const);
}
function emitBlockFace(
  m: MeshDataBuilder, id: number, face: number, x: number, y: number, z: number,
  box: readonly number[], color: readonly number[], light: readonly number[], sectionOffset: number,
) {
  const [a, c, e, d, f, g] = box;
  const n = normals[face], tile = faceTile(id, face), start = m.positions.length / 3;
  for (let i = 0; i < 4; i++) {
    const corner = faces[face][i], vx = corner & 1 ? d : a, vy = corner & 2 ? f : c, vz = corner & 4 ? g : e;
    m.positions.push(x + vx, y - sectionOffset + vy, z + vz);
    m.normals.push(n[0], n[1], n[2]);
    m.uvs.push(i === 0 || i === 3 ? 0 : 1, i < 2 ? 0 : 1);
    m.tiles.push(tile[0], tile[1]);
    m.colors.push(color[i], color[i], color[i]);
    m.sky.push(light[0]);
    m.lights.push(light[1]);
  }
  m.indices.push(start, start + 2, start + 1, start, start + 3, start + 2);
}
function mergedFacePoints(face: number, plane: number, u: number, v: number, width: number, height: number, yBase: number) {
  switch (face) {
    case 0: return [[plane, v + yBase, u], [plane, v + yBase, u + width], [plane, v + height + yBase, u + width], [plane, v + height + yBase, u]];
    case 1: return [[plane, v + yBase, 16 - u], [plane, v + yBase, 16 - u - width], [plane, v + height + yBase, 16 - u - width], [plane, v + height + yBase, 16 - u]];
    case 2: return [[u, plane + yBase, v], [u + width, plane + yBase, v], [u + width, plane + yBase, v + height], [u, plane + yBase, v + height]];
    case 3: return [[u, plane + yBase, 16 - v], [u + width, plane + yBase, 16 - v], [u + width, plane + yBase, 16 - v - height], [u, plane + yBase, 16 - v - height]];
    case 4: return [[16 - u, v + yBase, plane], [16 - u - width, v + yBase, plane], [16 - u - width, v + height + yBase, plane], [16 - u, v + height + yBase, plane]];
    default: return [[u, v + yBase, plane], [u + width, v + yBase, plane], [u + width, v + height + yBase, plane], [u, v + height + yBase, plane]];
  }
}
function emitMergedFace(m: MeshDataBuilder, face: number, points: number[][], width: number, height: number, record: FaceRecord) {
  const n = normals[face], start = m.positions.length / 3;
  const uvs = [[0, 0], [width, 0], [width, height], [0, height]];
  for (let i = 0; i < 4; i++) {
    const p = points[i], uv = uvs[i];
    m.positions.push(p[0], p[1], p[2]);
    m.normals.push(n[0], n[1], n[2]);
    m.uvs.push(uv[0], uv[1]);
    m.tiles.push(record.tileX, record.tileY);
    m.colors.push(record.color, record.color, record.color);
    m.sky.push(record.sky);
    m.lights.push(record.light);
  }
  m.indices.push(start, start + 2, start + 1, start, start + 3, start + 2);
}
function addGreedyFace(
  masks: Array<Array<Uint16Array | undefined>>, records: FaceRecord[], recordIds: Map<string, number>,
  face: number, plane: number, u: number, v: number, id: number,
  tileX: number, tileY: number, color: number, sky: number, light: number,
) {
  const signature = `${id}|${tileX}|${tileY}|${color}|${sky}|${light}`;
  let recordId = recordIds.get(signature);
  if (recordId === undefined) {
    recordId = records.length + 1;
    records.push({ tileX, tileY, color, sky, light });
    recordIds.set(signature, recordId);
  }
  let mask = masks[face][plane];
  if (!mask) masks[face][plane] = mask = new Uint16Array(256);
  mask[u + v * 16] = recordId;
}
function flushGreedyFaces(
  out: MeshDataBuilder, masks: Array<Array<Uint16Array | undefined>>, records: FaceRecord[], yBase: number,
) {
  for (let face = 0; face < 6; face++) for (let plane = 0; plane <= 16; plane++) {
    const mask = masks[face][plane];
    if (!mask) continue;
    for (let v = 0; v < 16; v++) for (let u = 0; u < 16; u++) {
      const recordId = mask[u + v * 16];
      if (!recordId) continue;
      let width = 1;
      while (u + width < 16 && mask[u + width + v * 16] === recordId) width++;
      let height = 1;
      outer: while (v + height < 16) {
        const row = (v + height) * 16;
        for (let dx = 0; dx < width; dx++) if (mask[u + dx + row] !== recordId) break outer;
        height++;
      }
      for (let dy = 0; dy < height; dy++) {
        const row = (v + dy) * 16;
        for (let dx = 0; dx < width; dx++) mask[u + dx + row] = 0;
      }
      const record = records[recordId - 1];
      emitMergedFace(out, face, mergedFacePoints(face, plane, u, v, width, height, yBase), width, height, record);
    }
  }
}

export function meshChunk(world: World, chunk: Chunk, lighting?: Lighting, sectionY?: number) {
  const out = [empty(), empty(), empty()];
  const lightSample: [number, number] = [1, 0];
  // Nine direct chunk references avoid string-key map lookups for every hidden face.
  const neighbors: (BlockColumn | undefined)[] = [];
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++)
      neighbors.push(world.chunks.get(`${chunk.cx + dx},${chunk.cz + dz}`)?.blocks);
  const sampleBlock = (x: number, y: number, z: number) => {
    if (y < MIN_Y) return B.Obsidian;
    if (y > MAX_Y) return 0;
    const dx = x < 0 ? -1 : x > 15 ? 1 : 0,
      dz = z < 0 ? -1 : z > 15 ? 1 : 0;
    return neighbors[(dz + 1) * 3 + dx + 1]?.get((x + 16) % 16, y, (z + 16) % 16) ?? 0;
  };
  for (const sy of sectionY === undefined ? [...chunk.blocks.sections.keys()] : [sectionY]) {
    const section = chunk.blocks.sections.get(sy);
    if (!section || section.nonAir === 0) continue;
    const masks: Array<Array<Uint16Array | undefined>> = Array.from({ length: 6 }, () => new Array(17));
    const records: FaceRecord[] = [];
    const recordIds = new Map<string, number>();
    const values = section.values;
    const sectionOffset = sectionY === undefined ? 0 : sectionY * 16;
    const yBase = sy * 16 - sectionOffset;
    for (let ly = 0; ly < 16; ly++)
      for (let z = 0; z < 16; z++)
        for (let x = 0; x < 16; x++) {
          const y = sy * 16 + ly;
          const i = x + 16 * (z + 16 * ly);
          const v = typeof values === "number" ? values : values[i];
          const id = idOf(v);
          if (!id) continue;
          const b = block(v);
          const blockBoxes = boxes(v);
          const transparent = id === B.Water || id === B.Glass || id === B.Ice;
          const emission = emits(v);
          const material = out[emission > 0 ? 2 : transparent ? 1 : 0];
          // Keep the existing buried-cube fast path. It reads the dense section
          // directly and leaves all section/chunk boundaries on normal culling.
          if (b.opaque && b.shape === "cube" && x > 0 && x < 15 && z > 0 && z < 15 && ly > 0 && ly < 15) {
            if (typeof values === "number" ||
              (block(values[i - 1]).opaque && block(values[i + 1]).opaque &&
                block(values[i - 16]).opaque && block(values[i + 16]).opaque &&
                block(values[i - 256]).opaque && block(values[i + 256]).opaque)) continue;
          }
          const wx = chunk.cx * 16 + x, wz = chunk.cz * 16 + z;
          for (const box of blockBoxes) {
            const [a, c, e, d, f, g] = box;
            const fullBox = a === 0 && c === 0 && e === 0 && d === 1 && f === 1 && g === 1;
            const mergeable = b.opaque && b.shape === "cube" && blockBoxes.length === 1 && fullBox && emission === 0 && material === out[0];
            for (let face = 0; face < 6; face++) {
              const n = normals[face], nv = sampleBlock(x + n[0], y + n[1], z + n[2]), nb = block(nv);
              const full = b.shape === "cube";
              if (full && (nb.opaque || (transparent && idOf(nv) === id))) continue;
              let shade = [0.77, 0.7, 1, 0.52, 0.88, 0.67][face];
              if (id === B.Wire && stateOf(v) > 0) shade = 1.5;
              const light = lighting?.sampleInto(wx + n[0], y + n[1], wz + n[2], lightSample) ?? [1, 0];
              const aoValues = [1, 1, 1, 1];
              if (full && face === 2) {
                for (let cornerIndex = 0; cornerIndex < 4; cornerIndex++) {
                  const corner = faces[face][cornerIndex], vx = corner & 1 ? d : a, vz = corner & 4 ? g : e;
                  const sx = vx === 0 ? -1 : 1, sz = vz === 0 ? -1 : 1;
                  aoValues[cornerIndex] -= 0.1 * (
                    Number(block(sampleBlock(x + sx, y + 1, z)).opaque) +
                    Number(block(sampleBlock(x, y + 1, z + sz)).opaque)
                  );
                }
              }
              if (mergeable && aoValues.every(value => value === aoValues[0])) {
                const tile = faceTile(id, face);
                const color = shade * aoValues[0];
                const plane = face === 0 ? x + 1 : face === 1 ? x : face === 2 ? ly + 1 : face === 3 ? ly : face === 4 ? z + 1 : z;
                const u = face === 0 ? z : face === 1 ? 15 - z : face === 2 || face === 3 ? x : face === 4 ? 15 - x : x;
                const vCell = face === 0 || face === 1 || face === 4 || face === 5 ? ly : face === 2 ? z : 15 - z;
                addGreedyFace(masks, records, recordIds, face, plane, u, vCell, id, tile[0], tile[1], color, light[0], light[1]);
                continue;
              }
              const colors = aoValues.map(value => shade * value);
              emitBlockFace(material, id, face, x, y, z, box, colors, light, sectionOffset);
              if (id === B.Water) material.waterTriangles += 2;
            }
          }
        }
    // Only compatible, uniformly shaded opaque cube faces are merged. All
    // partial, transparent, emissive and AO-discontinuous geometry keeps the
    // original per-face path and exact material/category assignment.
    flushGreedyFaces(out[0], masks, records, yBase);
  }
  return out.map(finish);
}
