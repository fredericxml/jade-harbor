import type { World } from "../world/world";
import { B } from "../world/blocks";
import { Vec3,blockKey,idOf,stateOf } from "../core/coords";
import { Inventory } from "./inventory";
import type { Stack } from "./stack";
import type { Furnace } from "./simulation";
import { SMELTING,FUEL } from "./simulation";
import { Containers,chestInventory } from "./storage";
import type { Drop } from "./entities";
export type Hopper = { slots:(Stack|null)[]; cooldown:number };
export const newHopper = ():Hopper=>({slots:Array(5).fill(null),cooldown:0});
export const HOPPER_DIRECTIONS = ["Down","North","East","South","West"];
export const HOPPER_OFFSETS = [[0,-1,0],[0,0,-1],[1,0,0],[0,0,1],[-1,0,0]];
type Storage = { slots:(Stack|null)[]; accepts:(id:number,index:number)=>boolean; extracts:(index:number)=>boolean };
// Copy-before-commit makes one transfer exact, even when output is full or metadata differs.
export function transferOne(source:Storage,target:Storage) {
  if(source.slots===target.slots) return false;
  for(let i=0;i<source.slots.length;i++) {
    const s=source.slots[i];if(!s||!source.extracts(i))continue;
    for(let j=0;j<target.slots.length;j++) {
      if(!target.accepts(s.id,j))continue;
      const slot=new Inventory([target.slots[j]],1);
      if(slot.addStack({...s,count:1}))continue;
      target.slots[j]=slot.slots[0];
      if(--s.count===0)source.slots[i]=null;
      return true;
    }
  }
  return false;
}
export class Automation {
  hoppers:Record<string,Hopper>={};
  containers:Containers={};
  drops:Drop[]=[];
  cursor=0;
  constructor(public world:World,public furnaces:Record<string,Furnace>,saved?:Record<string,Hopper>) { this.hoppers=structuredClone(saved??{}); }
  hopper(key:string){return this.hoppers[key]??=newHopper();}
  storage(x:number,y:number,z:number,sourceY:number,create=true):Storage|null {
    if(!this.world.loaded(x,z))return null;
    const id=idOf(this.world.get(x,y,z)),key=blockKey(x,y,z);
    if(id===B.Hopper)return {slots:this.hopper(key).slots,accepts:()=>true,extracts:()=>true};
    if(id===B.Chest)return {slots:chestInventory(this.world,key,this.containers),accepts:()=>true,extracts:()=>true};
    if(id===B.Furnace) {
      const f=this.furnaces[key]??(create?(this.furnaces[key]={slots:[null,null,null],burn:0,progress:0,recipe:0}):undefined);
      if(!f)return null;
      return {slots:f.slots,accepts:(id,i)=>sourceY>y ? i===0&&!!SMELTING[id] : i===1&&!!FUEL[id],extracts:i=>i===2};
    }
    return null;
  }
  tick(dt:number,player:Vec3,radius:number,powered:(x:number,y:number,z:number)=>boolean) {
    const keys=Object.keys(this.hoppers).sort();
    // Bounded round-robin, no recursion and no chunk loading. Backpressure keeps items in their source.
    for(let n=0;n<Math.min(64,keys.length);n++) {
      const key=keys[(this.cursor+n)%keys.length],h=this.hoppers[key],[x,y,z]=key.split(",").map(Number);
      if(!this.world.loaded(x,z)||Math.hypot(x-player.x,z-player.z)>radius||idOf(this.world.get(x,y,z))!==B.Hopper)continue;
      h.cooldown=Math.max(0,h.cooldown-dt);
      if(h.cooldown>1e-8 || powered(x,y,z))continue;
      h.cooldown=.4;
      const self:Storage={slots:h.slots,accepts:()=>true,extracts:()=>true};
      const [dx,dy,dz]=HOPPER_OFFSETS[stateOf(this.world.get(x,y,z))%5];
      const target=this.storage(x+dx,y+dy,z+dz,y);
      if(target)transferOne(self,target);
      const source=this.storage(x,y+1,z,y);
      if(source)transferOne(source,self);
      else for(const drop of this.drops) {
        if(drop.stack.count<=0||Math.abs(drop.position.x-x-.5)>.7||Math.abs(drop.position.z-z-.5)>.7||drop.position.y<y+.7||drop.position.y>y+2)continue;
        const copy=new Inventory(h.slots,5),left=copy.addStack(drop.stack);
        if(left!==drop.stack.count){h.slots=copy.slots;drop.stack.count=left;}break;
      }
    }
    this.cursor=(this.cursor+64)%Math.max(1,keys.length);
  }
}
