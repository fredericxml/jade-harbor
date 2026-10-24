export function seedNumber(text: string) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function hash(x: number, z: number, seed: number, y = 0) {
  let n =
    Math.imul(x | 0, 374761393) ^
    Math.imul(z | 0, 668265263) ^
    Math.imul(y | 0, 1274126177) ^
    seed;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
const smooth = (n: number) => n * n * (3 - 2 * n);
export function noise(x: number, z: number, seed: number) {
  const ix = Math.floor(x),
    iz = Math.floor(z),
    a = smooth(x - ix),
    b = smooth(z - iz);
  return (
    (hash(ix, iz, seed) * (1 - a) + hash(ix + 1, iz, seed) * a) * (1 - b) +
    (hash(ix, iz + 1, seed) * (1 - a) + hash(ix + 1, iz + 1, seed) * a) * b
  );
}
export function fbm(x: number, z: number, s: number) {
  return (
    noise(x, z, s) * 0.57 +
    noise(x * 2, z * 2, s + 17) * 0.28 +
    noise(x * 4, z * 4, s + 29) * 0.15
  );
}

/** Seeded continuous trilinear value noise; shared coordinates make cave seams continuous. */
export function noise3(x:number,y:number,z:number,seed:number) {
  const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z), ax=smooth(x-ix),ay=smooth(y-iy),az=smooth(z-iz);
  let out=0;
  for(let dy=0;dy<2;dy++) for(let dz=0;dz<2;dz++) for(let dx=0;dx<2;dx++)
    out+=hash(ix+dx,iz+dz,seed,iy+dy)*(dx?ax:1-ax)*(dy?ay:1-ay)*(dz?az:1-az);
  return out;
}
