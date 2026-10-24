import { B } from "../world/blocks";
import { idOf } from "../core/coords";
import type { World } from "../world/world";
import type { Stack } from "./stack";
export type Brewer = { slots: (Stack|null)[]; progress: number; fuel: number; recipe: number };
export const INFUSIONS: Record<number,number> = {105:161,109:162,103:163,[B.Basalt]:164,106:165,[B.Blossom]:166,101:167};
export const newBrewer = (): Brewer => ({slots:[null,null,null,null],progress:0,fuel:0,recipe:0});
export function brewingWater(world: World,x: number,y: number,z: number) {
  for(let dx=-4;dx<=4;dx++) for(let dz=-4;dz<=4;dz++) for(let dy=-1;dy<=1;dy++)
    if(world.loaded(x+dx,z+dz) && idOf(world.get(x+dx,y+dy,z+dz))===B.Water) return true;
  return false;
}
// One flask + botanical/mineral ingredient + heat. Work only advances while supplied with water.
export function tickBrewer(b: Brewer,dt: number,water: boolean) {
  const [flask,ingredient,fuel,output] = b.slots, result = ingredient && INFUSIONS[ingredient.id];
  if(!flask || flask.id!==160 || !result || (output && (output.id!==result || output.count>=16))) {
    b.progress=0; b.recipe=0; return false;
  }
  if(b.recipe!==ingredient!.id) {b.recipe=ingredient!.id;b.progress=0;}
  if(!water) return false;
  if(b.fuel<=0 && fuel?.id===B.Bamboo) { b.fuel=12; if(--fuel.count===0)b.slots[2]=null; }
  if(b.fuel<=0) return false;
  const active=Math.min(dt,b.fuel); b.fuel=Math.max(0,b.fuel-active); b.progress+=active;
  if(b.progress+1e-7<6) return false;
  b.progress=Math.max(0,b.progress-6);
  if(--flask.count===0)b.slots[0]=null;
  if(--ingredient!.count===0)b.slots[1]=null;
  if(output)output.count++;else b.slots[3]={id:result,count:1};
  return true;
}
