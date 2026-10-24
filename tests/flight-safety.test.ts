import { describe, expect, it } from 'vitest';
import { flightControls, shouldVoidRespawn } from '../src/player/flight';
import { findSafeStand, collides } from '../src/player/physics';
import { B } from '../src/world/blocks';

describe('spectator and creative flight safety', () => {
  it('descends only while the actual crouch key is pressed, even inside a solid block', () => {
    expect(flightControls(true, false, true, false, true)).toEqual({crouching:false,verticalIntent:-1});
    expect(flightControls(false, false, true, true, true)).toEqual({crouching:false,verticalIntent:0});
    expect(flightControls(false, true, true, true, true)).toEqual({crouching:false,verticalIntent:1});
  });
  it('preserves constrained crouch for grounded players, not flying ones', () => {
    expect(flightControls(false, false, false, true, true).crouching).toBe(true);
    expect(flightControls(false, false, false, true, false).crouching).toBe(false);
  });
  it('does not apply survival void reset to noclip spectator', () => {
    expect(shouldVoidRespawn('spectator', -90, -64)).toBe(false);
    expect(shouldVoidRespawn('survival', -90, -64)).toBe(true);
    expect(shouldVoidRespawn('creative', -90, -64)).toBe(true);
  });
  it('finds a supported safe exit position rather than leaving a former spectator inside the ground', () => {
    const world={loaded:()=>true,get:(_x:number,y:number,_z:number)=>Math.floor(y)<=0?B.Stone:B.Air};
    const safe=findSafeStand(world,{x:.5,y:0,z:.5});
    expect(safe).not.toBeNull();
    expect(safe!.y).toBeGreaterThan(0);
    expect(collides(world,safe!)).toBe(false);
    expect(findSafeStand({loaded:()=>true,get:()=>B.Stone},{x:.5,y:0,z:.5})).toBeNull();
  });
});
