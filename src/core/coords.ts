export const CHUNK = 16;
export const MIN_Y = -64;
export const MAX_Y = 319;
export const HEIGHT = MAX_Y - MIN_Y + 1;
export const MIN_SECTION = -4;
export const MAX_SECTION = 19;
export const sectionKey = (cx:number, sy:number, cz:number) => `${cx},${sy},${cz}`;
export const SEA = 18;
export type Vec3 = { x: number; y: number; z: number };
export const chunkCoord = (n: number) => Math.floor(n / CHUNK);
export const localCoord = (n: number) => ((n % CHUNK) + CHUNK) % CHUNK;
export const chunkKey = (x: number, z: number) => `${x},${z}`;
export const blockKey = (x: number, y: number, z: number) => `${x},${y},${z}`;
export const index = (x: number, y: number, z: number) =>
  x + CHUNK * (z + CHUNK * y);
export const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));
export const distance = (a: Vec3, b: Vec3) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export const idOf = (v: number) => v & 255;
export const stateOf = (v: number) => v >>> 8;
export const packed = (id: number, state = 0) => id | (state << 8);
