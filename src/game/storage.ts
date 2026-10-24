import type { World } from "../world/world";
import type { Stack } from "./stack";
export type Containers = Record<string,(Stack|null)[]>;
export function chestInventory(world: World,key: string,containers: Containers) {
  if(!containers[key]) {
    const [x,,z]=key.split(",").map(Number);
    const slots:(Stack|null)[]=Array(27).fill(null);
    // Only unopened generated chests contain discovery loot. A placed chest is empty.
    if(Math.hypot(x,z)>65 && !world.edits.has(key)) {slots[0]={id:111,count:2};slots[1]={id:105,count:3};}
    containers[key]=slots;
  }
  return containers[key];
}
