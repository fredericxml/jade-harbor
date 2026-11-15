import type { Vec3 } from "../core/coords";

function withinPlate(p: Vec3, x: number, y: number, z: number): boolean {
  return Math.abs(p.x-x-.5)<.8 && Math.abs(p.z-z-.5)<.8 && p.y>=y-.1 && p.y<=y+1.8;
}

/** Same strict bounds and short-circuit order as the previous spread + some() path,
 * without allocating a concatenated player/occupant array for each plate. */
export function pressureTriggered(x:number,y:number,z:number,player:Vec3|undefined,occupants:readonly Vec3[],isLoaded:(x:number,z:number)=>boolean):boolean {
  if(player&&isLoaded(player.x,player.z)&&withinPlate(player,x,y,z))return true;
  for(let i=0;i<occupants.length;i++){
    const p=occupants[i];
    if(isLoaded(p.x,p.z)&&withinPlate(p,x,y,z))return true;
  }
  return false;
}

/** True only when a higher-priority actor is moving into the same near-future
 * space. A stationary NPC must never become a permanent one-way roadblock. */
export function shouldYieldToMovingActor(actorId:string,position:Vec3,velocity:Vec3,otherId:string,otherPosition:Vec3,otherVelocity:Vec3,horizon=.4,threshold=.55):boolean {
  if(otherId>=actorId || Math.abs(otherPosition.y-position.y)>=1) return false;
  if(otherVelocity.x*otherVelocity.x+otherVelocity.z*otherVelocity.z<.04) return false;
  const currentX=otherPosition.x-position.x,currentZ=otherPosition.z-position.z;
  const ownX=position.x+velocity.x*horizon,ownZ=position.z+velocity.z*horizon;
  const otherX=otherPosition.x+otherVelocity.x*horizon,otherZ=otherPosition.z+otherVelocity.z*horizon;
  const futureX=otherX-ownX,futureZ=otherZ-ownZ;
  const currentSquared=currentX*currentX+currentZ*currentZ,futureSquared=futureX*futureX+futureZ*futureZ;
  return futureSquared<threshold*threshold && futureSquared<currentSquared-.02;
}
