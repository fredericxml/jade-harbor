import { describe, expect, it } from 'vitest';
import { B } from '../src/world/blocks';
import { Inventory } from '../src/game/inventory';
import { Entities, spawnEntity, spiritSpawnSite } from '../src/game/entities';
import type { World } from '../src/world/world';

function mockWorld(floor: number = B.Stone):World {
  return {
    navRevision:0,
    loaded:()=>true,
    get:(_x:number,y:number,_z:number)=>Math.floor(y)<=0?floor:B.Air,
  } as unknown as World;
}
describe('hostile lifecycle and spawn selection',()=>{
  it('chooses supported open terrain close to player elevation',()=>{
    const site=spiritSpawnSite(mockWorld(),{x:.5,y:1,z:.5},5);
    expect(site).not.toBeNull();
    expect(site!.y).toBeGreaterThan(1);
    expect(site!.y).toBeLessThan(2);
  });
  it('rejects rooftop-only spawn sites',()=>{
    expect(spiritSpawnSite(mockWorld(B.Roof),{x:.5,y:1,z:.5},5)).toBeNull();
  });
  it('removes abandoned spirits so they do not permanently block local encounters',()=>{
    const far=spawnEntity('spirit',{x:500.5,y:1.01,z:.5});
    const mobs=new Entities(mockWorld(),{entities:[far],drops:[]});
    const inv=new Inventory();
    mobs.tick(8.1,{x:.5,y:1,z:.5},inv,.6,true,()=>{},()=>{});
    expect(mobs.list.find(e=>e.id===far.id)).toBeUndefined();
    expect(mobs.list.filter(e=>e.kind==='spirit')).toHaveLength(1);
    mobs.tick(.05,{x:.5,y:1,z:.5},inv,.6,true,()=>{},()=>{});
    expect(mobs.list.filter(e=>e.kind==='spirit')).toHaveLength(1);
    mobs.tick(.05,{x:200.5,y:1,z:.5},inv,.6,false,()=>{},()=>{});
    expect(mobs.list.filter(e=>e.kind==='spirit')).toHaveLength(0);
  });
});
