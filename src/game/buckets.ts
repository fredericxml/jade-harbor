import type { World } from "../world/world";
import type { Inventory } from "./inventory";
import type { Hit } from "../player/raycast";
import { B } from "../world/blocks";
import { MIN_Y,MAX_Y,Vec3,idOf,stateOf } from "../core/coords";
import { overlapsBlock } from "../player/physics";
export function useBucket(world:World,inv:Inventory,hit:Hit,player:Vec3,creative=false) {
  const held=inv.held;if(!held || ![168,169,170].includes(held.id))return false;
  if(held.id===168) {
    const id=idOf(hit.value);
    if(![B.Water,B.Lava].includes(id as never)||stateOf(hit.value)!==0)return false;
    if(!world.set(hit.x,hit.y,hit.z,0))return false;
    inv.slots[inv.selected]={id:id===B.Water?169:170,count:1};return true;
  }
  const x=hit.x+hit.normal.x,y=hit.y+hit.normal.y,z=hit.z+hit.normal.z;
  if(y<=MIN_Y||y>MAX_Y||!world.loaded(x,z)||world.get(x,y,z)!==0||overlapsBlock(player,x,y,z))return false;
  if(!world.set(x,y,z,held.id===169?B.Water:B.Lava))return false;
  if(!creative)inv.slots[inv.selected]={id:168,count:1};
  return true;
}
