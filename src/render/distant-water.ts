/** Classify a coarse distant terrain cell without turning shoreline samples into
 * opaque water. Fully wet/dry cells are decisive; mixed cells use a center probe. */
export function classifyDistantWaterCell(a:boolean,b:boolean,c:boolean,d:boolean,centerWater:boolean):boolean {
  const wet=Number(a)+Number(b)+Number(c)+Number(d);
  if(wet===4)return true;
  if(wet===0)return centerWater;
  return centerWater;
}
