import type { Lighting } from "../world/lighting";
import { BlockColumn } from "../world/sections";
import { World, Chunk } from "../world/world";
import { block, boxes, B, emits } from "../world/blocks";
import { MIN_Y, MAX_Y, idOf, stateOf } from "../core/coords";
export type MeshData = {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  /** Atlas tile coordinates (column, top-origin row), constant per face. */
  tiles: Uint8Array;
  colors: Float32Array;
  /** Per-vertex 0/1 flag; emissive faces share the opaque draw/material. */
  emissive: Uint8Array;
  indices: Uint16Array | Uint32Array;
  sky: Float32Array;
  lights: Float32Array;
  /** Triangle counts attributed inside the shared material draws. */
  emissiveTriangles: number;
  waterTriangles: number;
  /** Visible material-group midpoint in section-local coordinates, for
   * camera-depth sorting of interleaved glass/ice/water (not a geometry pass). */
  sortCenter?: readonly [number, number, number];
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
class ByteBuffer {
  private data = new Uint8Array(64);
  length = 0;
  push(value: number) {
    if (this.length >= this.data.length) {
      const grown = new Uint8Array(this.data.length * 2);
      grown.set(this.data);
      this.data = grown;
    }
    this.data[this.length++] = value;
  }
  finish() { return this.data.subarray(0, this.length); }
}
class NumericBuffer {
  private data: Float32Array | Uint16Array | Uint32Array;
  length = 0;
  constructor(private readonly integer = false, capacity = 0) {
    // Most section meshes fit in 16-bit indices. Start compact and promote
    // only if a real vertex index crosses the unsigned-16-bit limit.
    this.data = integer ? new Uint16Array(capacity) : new Float32Array(capacity);
  }
  push(a: number, b?: number, c?: number, d?: number, e?: number, f?: number) {
    const count = arguments.length;
    const required = this.length + count;
    if (this.integer && !(this.data instanceof Uint32Array) &&
      (a > 65535 || (count > 1 && b! > 65535) || (count > 2 && c! > 65535) ||
       (count > 3 && d! > 65535) || (count > 4 && e! > 65535) || (count > 5 && f! > 65535))) {
      const promoted = new Uint32Array(this.data.length);
      promoted.set(this.data);
      this.data = promoted;
    }
    if (required > this.data.length) {
      let capacity = Math.max(64, this.data.length * 2);
      while (capacity < required) capacity *= 2;
      const grown = this.integer
        ? this.data instanceof Uint32Array ? new Uint32Array(capacity) : new Uint16Array(capacity)
        : new Float32Array(capacity);
      grown.set(this.data);
      this.data = grown;
    }
    const data = this.data;
    data[this.length++] = a;
    if (count > 1) data[this.length++] = b!;
    if (count > 2) data[this.length++] = c!;
    if (count > 3) data[this.length++] = d!;
    if (count > 4) data[this.length++] = e!;
    if (count > 5) data[this.length++] = f!;
    return this.length;
  }
  finish() {
    // Keep the builder's compact typed backing store instead of copying every
    // attribute into a second typed array. Capacity is bounded below 2× length.
    return this.data.subarray(0, this.length) as Float32Array | Uint16Array | Uint32Array;
  }
  finishIndices() {
    // Keep the growable backing buffer only when its unused tail is small;
    // otherwise trim so a sparse section does not retain nearly 2× slack.
    // The common path is already 16-bit, so any required trim is half the
    // former Uint32-to-Uint16 conversion cost. Oversized sections promote
    // before writing and follow the same bounded-slack rule.
    const values=this.data as Uint16Array | Uint32Array;
    if(this.length===0)return values.subarray(0,0);
    return values.length<=this.length*1.25
      ? values.subarray(0,this.length)
      : values.slice(0,this.length);
  }
}
type TransparentBounds = {
  minX:number;minY:number;minZ:number;maxX:number;maxY:number;maxZ:number;
};
type MeshDataBuilder = {
  sortBounds?: TransparentBounds;
  positions: NumericBuffer;
  normals: NumericBuffer;
  uvs: NumericBuffer;
  tiles: TileBuffer;
  colors: NumericBuffer;
  emissive: ByteBuffer;
  indices: NumericBuffer;
  sky: NumericBuffer;
  lights: NumericBuffer;
  emissiveTriangles: number;
  waterTriangles: number;
};
const empty = (): MeshDataBuilder => ({
  positions: new NumericBuffer(),
  normals: new NumericBuffer(),
  uvs: new NumericBuffer(),
  tiles: new TileBuffer(),
  colors: new NumericBuffer(),
  emissive: new ByteBuffer(),
  indices: new NumericBuffer(true),
  sky: new NumericBuffer(),
  lights: new NumericBuffer(),
  emissiveTriangles: 0,
  waterTriangles: 0,
});
const finish = (m: MeshDataBuilder): MeshData => ({
  positions: m.positions.finish() as Float32Array,
  normals: m.normals.finish() as Float32Array,
  uvs: m.uvs.finish() as Float32Array,
  tiles: m.tiles.finish(),
  colors: m.colors.finish() as Float32Array,
  emissive: m.emissive.finish(),
  indices: m.indices.finishIndices(),
  sky: m.sky.finish() as Float32Array,
  lights: m.lights.finish() as Float32Array,
  emissiveTriangles: m.emissiveTriangles,
  waterTriangles: m.waterTriangles,
  sortCenter: m.sortBounds
    ? [(m.sortBounds.minX+m.sortBounds.maxX)*.5,
       (m.sortBounds.minY+m.sortBounds.maxY)*.5,
       (m.sortBounds.minZ+m.sortBounds.maxZ)*.5]
    : undefined,
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
  isEmissive = false,
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
    m.emissive.push(isEmissive ? 1 : 0);
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
    m.emissive.push(0);
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
function* flushGreedyFacesSteps(
  out: MeshDataBuilder, masks: Array<Array<Uint16Array | undefined>>, records: FaceRecord[], yBase: number,
): Generator<void, void, void> {
  for (let face = 0; face < 6; face++) for (let plane = 0; plane <= 16; plane++) {
    const mask = masks[face][plane];
    if (!mask) continue;
    for (let v = 0; v < 16; v++) {
      const row = v * 16;
      let rowHadFaces = false;
      for (let u = 0; u < 16; u++) {
        const recordId = mask[u + row];
        if (!recordId) continue;
        rowHadFaces = true;
        let width = 1;
        while (u + width < 16 && mask[u + width + row] === recordId) width++;
        let height = 1;
        outer: while (v + height < 16) {
          const nextRow = (v + height) * 16;
          for (let dx = 0; dx < width; dx++) if (mask[u + dx + nextRow] !== recordId) break outer;
          height++;
        }
        for (let dy = 0; dy < height; dy++) {
          const clearRow = (v + dy) * 16;
          for (let dx = 0; dx < width; dx++) mask[u + dx + clearRow] = 0;
        }
        const record = records[recordId - 1];
        emitMergedFace(out, face, mergedFacePoints(face, plane, u, v, width, height, yBase), width, height, record);
      }
      // Greedy mask finalization is resumable too; a large face plane cannot
      // become one final, non-preemptible section-sized flush.
      if (rowHadFaces) yield;
    }
  }
}

/** Maximum voxel/face work units performed before a resumable mesher yield.
 * Counting both cells and face tests keeps dense, shape-heavy sections from
 * hiding a long face-emission loop inside an otherwise small voxel slice.
 */
export const MESH_SLICE_WORK_BUDGET = 64;

export function* meshChunkSteps(world: World, chunk: Chunk, lighting?: Lighting, sectionY?: number): Generator<void, MeshData[], void> {
  // 0: opaque/emissive, 1: glass/ice, 2: water.
  // A separate water draw lets transparency and depth behavior be tuned
  // without changing glass/ice appearance or any world-facing block rules.
  const out = [empty(), empty(), empty()];
  const lightSample: [number, number] = [1, 0];
  const aoValues = [1, 1, 1, 1];
  const faceColors = [1, 1, 1, 1];
  const faceShades = [0.77, 0.7, 1, 0.52, 0.88, 0.67];
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
    const sectionLightSampler = lighting?.createSectionSampler?.(chunk.cx, sy, chunk.cz);
    const sectionOffset = sectionY === undefined ? 0 : sectionY * 16;
    const yBase = sy * 16 - sectionOffset;
    let sliceWork = 0;
    for (let ly = 0; ly < 16; ly++) {
      for (let z = 0; z < 16; z++)
        for (let x = 0; x < 16; x++) {
          // Count every voxel coordinate, including air and buried cubes.
          if (sliceWork >= MESH_SLICE_WORK_BUDGET) {
            sliceWork = 0;
            yield;
          }
          sliceWork++;
          const y = sy * 16 + ly;
          const i = x + 16 * (z + 16 * ly);
          const v = typeof values === "number" ? values : values[i];
          const id = idOf(v);
          if (id) {
            const b = block(v);
            const blockBoxes = boxes(v);
            const transparent = id === B.Water || id === B.Glass || id === B.Ice;
            const emission = emits(v);
            const material = emission > 0 ? out[0] : id === B.Water ? out[2] : transparent ? out[1] : out[0];
            // Keep the existing buried-cube fast path. It reads the dense section
            // directly and leaves all section/chunk boundaries on normal culling.
            let buried = false;
            if (b.opaque && b.shape === "cube" && x > 0 && x < 15 && z > 0 && z < 15 && ly > 0 && ly < 15) {
              buried = typeof values === "number" ||
                (block(values[i - 1]).opaque && block(values[i + 1]).opaque &&
                  block(values[i - 16]).opaque && block(values[i + 16]).opaque &&
                  block(values[i - 256]).opaque && block(values[i + 256]).opaque);
            }
            if (!buried) {
              const wx = chunk.cx * 16 + x, wz = chunk.cz * 16 + z;
              for (const box of blockBoxes) {
                const [a, c, e, d, f, g] = box;
                const fullBox = a === 0 && c === 0 && e === 0 && d === 1 && f === 1 && g === 1;
                const mergeable = b.opaque && b.shape === "cube" && blockBoxes.length === 1 && fullBox && emission === 0 && material === out[0];
                let boundsRecorded = false;
                for (let face = 0; face < 6; face++) {
                  // Yield before starting the next face once the shared work
                  // budget is exhausted. Hidden faces count too: dense blocks
                  // must not monopolize a frame just because they emit little.
                  if (sliceWork >= MESH_SLICE_WORK_BUDGET) {
                    sliceWork = 0;
                    yield;
                  }
                  sliceWork++;
                  const n = normals[face], nv = sampleBlock(x + n[0], y + n[1], z + n[2]), nb = block(nv);
                  const full = b.shape === "cube";
                  if (full && (nb.opaque || (transparent && idOf(nv) === id))) continue;
                  let shade = faceShades[face];
                  if (id === B.Wire && stateOf(v) > 0) shade = 1.5;
                  const light = sectionLightSampler
                    ? sectionLightSampler(x + n[0], ly + n[1], z + n[2], lightSample)
                    : lighting
                      ? lighting.sampleInto(wx + n[0], y + n[1], wz + n[2], lightSample)
                      : lightSample;
                  aoValues[0] = aoValues[1] = aoValues[2] = aoValues[3] = 1;
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
                  if (mergeable && aoValues[1] === aoValues[0] && aoValues[2] === aoValues[0] && aoValues[3] === aoValues[0]) {
                    const tile = faceTile(id, face);
                    const color = shade * aoValues[0];
                    const plane = face === 0 ? x + 1 : face === 1 ? x : face === 2 ? ly + 1 : face === 3 ? ly : face === 4 ? z + 1 : z;
                    const u = face === 0 ? z : face === 1 ? 15 - z : face === 2 || face === 3 ? x : face === 4 ? 15 - x : x;
                    const vCell = face === 0 || face === 1 || face === 4 || face === 5 ? ly : face === 2 ? z : 15 - z;
                    addGreedyFace(masks, records, recordIds, face, plane, u, vCell, id, tile[0], tile[1], color, light[0], light[1]);
                    continue;
                  }
                  faceColors[0] = shade * aoValues[0];
                  faceColors[1] = shade * aoValues[1];
                  faceColors[2] = shade * aoValues[2];
                  faceColors[3] = shade * aoValues[3];
                  emitBlockFace(material, id, face, x, y, z, box, faceColors, light, sectionOffset, emission > 0);
                  if (transparent && !boundsRecorded) {
                    // Only the visible transparent groups need sort centers.
                    // Capture block bounds while meshing; never scan the finished
                    // typed arrays during geometry commit or on every frame.
                    const bb=material.sortBounds??(material.sortBounds={
                      minX:Infinity,minY:Infinity,minZ:Infinity,maxX:-Infinity,maxY:-Infinity,maxZ:-Infinity,
                    });
                    bb.minX=Math.min(bb.minX,x+a);bb.maxX=Math.max(bb.maxX,x+d);
                    bb.minY=Math.min(bb.minY,y-sectionOffset+c);bb.maxY=Math.max(bb.maxY,y-sectionOffset+f);
                    bb.minZ=Math.min(bb.minZ,z+e);bb.maxZ=Math.max(bb.maxZ,z+g);
                    boundsRecorded=true;
                  }
                  if (emission > 0) material.emissiveTriangles += 2;
                  if (id === B.Water) material.waterTriangles += 2;
                }
              }
            }
          }
          // Face checks above share this budget, bounding both sparse scans
          // and dense/complex geometry work. The next voxel/face yields before
          // it starts, so no slice processes more than the configured count.
        }
    }
    // Only compatible, uniformly shaded opaque cube faces are merged. All
    // partial, transparent, emissive and AO-discontinuous geometry keeps the
    // original per-face path and exact material/category assignment.
    yield* flushGreedyFacesSteps(out[0], masks, records, yBase);
  }
  return out.map(finish);
}

/** Synchronous compatibility wrapper retained for tests and offline callers. */
export function meshChunk(world: World, chunk: Chunk, lighting?: Lighting, sectionY?: number) {
  const work = meshChunkSteps(world, chunk, lighting, sectionY);
  let result = work.next();
  while (!result.done) result = work.next();
  return result.value;
}
