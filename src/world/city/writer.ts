import { MIN_Y, MAX_Y } from "../../core/coords";
import { BlockColumn } from "../sections";
import type { Structure } from "./plan";
export class VoxelWriter {
  constructor(
    public data: BlockColumn,
    public ox: number,
    public oz: number,
  ) {}
  put(x: number, y: number, z: number, id: number) {
    if (
      x >= this.ox &&
      x < this.ox + 16 &&
      z >= this.oz &&
      z < this.oz + 16 &&
      y >= MIN_Y &&
      y <= MAX_Y
    )
      this.data.set(x-this.ox,y,z-this.oz,id);
  }
  fill(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    id: number,
  ) {
    for (let y = Math.max(MIN_Y, y1); y <= Math.min(MAX_Y, y2); y++)
      for (let z = Math.max(this.oz, z1); z <= Math.min(this.oz + 15, z2); z++)
        for (
          let x = Math.max(this.ox, x1);
          x <= Math.min(this.ox + 15, x2);
          x++
        )
          this.data.set(x-this.ox,y,z-this.oz,id);
  }
  local(s: Structure) {
    const facing = s.facing,
      w = facing % 2 ? s.z2 - s.z1 + 1 : s.x2 - s.x1 + 1,
      d = facing % 2 ? s.x2 - s.x1 + 1 : s.z2 - s.z1 + 1;
    const transform = (u: number, v: number): [number, number] =>
      facing === 0
        ? [s.x1 + u, s.z1 + v]
        : facing === 1
          ? [s.x2 - v, s.z1 + u]
          : facing === 2
            ? [s.x2 - u, s.z2 - v]
            : [s.x1 + v, s.z2 - u];
    const fill = (
      u1: number,
      y1: number,
      v1: number,
      u2: number,
      y2: number,
      v2: number,
      id: number,
    ) => {
      const [a, b] = transform(u1, v1),
        [c, e] = transform(u2, v2);
      this.fill(
        Math.min(a, c),
        y1,
        Math.min(b, e),
        Math.max(a, c),
        y2,
        Math.max(b, e),
        id,
      );
    };
    return {
      w,
      d,
      fill,
      put: (u: number, y: number, v: number, id: number) =>
        fill(u, y, v, u, y, v, id),
    };
  }
}
