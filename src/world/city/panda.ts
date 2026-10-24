import { B } from "../blocks";
import { VoxelWriter } from "./writer";
const sculpture = new Map<string, number>();
function ellipsoid(
  cx: number,
  cy: number,
  cz: number,
  rx: number,
  ry: number,
  rz: number,
  id: number,
) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
        if (
          ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 <=
          1
        )
          sculpture.set(`${x},${y},${z}`, id);
}
// An original seated, volume-built sculpture. Every sample becomes an ordinary editable block.
ellipsoid(0, 5, -1, 4.4, 4.9, 3.3, B.Porcelain);
ellipsoid(0, 9, -1, 4.7, 1.8, 3.1, B.Ink);
for (const side of [-1, 1]) {
  ellipsoid(side * 3.25, 1.6, 3.1, 2.65, 1.7, 3.2, B.Ink);
  ellipsoid(side * 4.1, 6, 0.4, 1.7, 3.4, 2.3, B.Ink);
  ellipsoid(side * 3.9, 3.4, 2.1, 1.7, 1.8, 1.7, B.Ink);
}
ellipsoid(0, 5.2, 1, 3.25, 3.8, 2.6, B.Porcelain);
ellipsoid(0, 12, -0.6, 4.65, 4.05, 3.7, B.Porcelain);
for (const side of [-1, 1])
  ellipsoid(side * 3.5, 15.5, -0.6, 1.8, 1.8, 1.5, B.Ink);
function front(x: number, y: number) {
  for (let z = 6; z >= -5; z--) if (sculpture.has(`${x},${y},${z}`)) return z;
  return 0;
}
for (const side of [-1, 1])
  for (let y = 11; y <= 14; y++)
    for (let x = side * 2 - 1; x <= side * 2 + 1; x++)
      if (((x - side * 2) / 1.5) ** 2 + ((y - 12.6) / 1.7) ** 2 < 1.25) {
        const z = front(x, y);
        sculpture.set(`${x},${y},${z}`, B.Ink);
      }
for (const side of [-1, 1])
  sculpture.set(`${side * 2},13,${front(side * 2, 13)}`, B.PandaEye);
for (let x = -1; x <= 1; x++)
  sculpture.set(`${x},11,${front(x, 11) + 1}`, B.Ink);
sculpture.set(`0,10,${front(0, 10)}`, B.PandaMouth);
export const PANDA_VOXELS = [...sculpture].map(
  ([k, id]) =>
    [...k.split(",").map(Number), id] as [number, number, number, number],
);
export function drawPanda(
  w: VoxelWriter,
  x: number,
  y: number,
  z: number,
  small = false,
) {
  if (!small) {
    w.fill(x + 5, y + 2, z + 3, x + 5, y + 10, z + 3, B.Bamboo);
    w.put(x + 6, y + 9, z + 3, B.Leaves);
    w.put(x + 4, y + 10, z + 3, B.Leaves);
    for (const [dx, dy, dz, id] of PANDA_VOXELS)
      w.put(x + dx, y + dy, z + dz, id);
    return;
  }
  const smallBlocks = new Map<string, number>();
  for (const [dx, dy, dz, id] of PANDA_VOXELS)
    smallBlocks.set(
      `${Math.round(dx * 0.4)},${Math.round(dy * 0.4)},${Math.round(dz * 0.4)}`,
      id,
    );
  for (const [key, id] of smallBlocks) {
    const [dx, dy, dz] = key.split(",").map(Number);
    w.put(x + dx, y + dy, z + dz, id);
  }
}
