import { hash } from "../noise";
export const REGIONAL_FOREST_POLICY={cell:40,forestCells:4,superCells:10,ceiling:.05} as const;
const mod=(n:number,d:number)=>(n%d+d)%d;
/** V8 owned ranks0–11; v9 retains0–3 and converts4–11 physically. */
export function forestCellRank(seed:number,x:number,z:number) {
  const cx=Math.floor(x/40),cz=Math.floor(z/40),sx=Math.floor(cx/10),sz=Math.floor(cz/10),offset=Math.floor(hash(sx,sz,seed,861)*100);
  return((mod(cx,10)+mod(cz,10)*10)*37+offset)%100;
}
export const regionalForestMask=(seed:number,x:number,z:number)=>forestCellRank(seed,x,z)<4;
export function regionalForestTreeAllowed(seed:number,x:number,z:number,radius=3) {
  return [[0,0],[-radius,-radius],[-radius,radius],[radius,-radius],[radius,radius]].every(([dx,dz])=>regionalForestMask(seed,x+dx,z+dz));
}
