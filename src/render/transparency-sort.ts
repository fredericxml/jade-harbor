/**
 * Camera-depth ordering for the *centers of visible transparent voxel groups*.
 * Three.js sorts mesh objects by the origin of their parent section/column.
 * Water and windows in one section therefore get the same default z even if
 * one is physically nearer. The anchors are captured during meshing, without
 * scanning the typed vertex arrays on commit or per frame.
 *
 * This remains object-level alpha sorting, not per-fragment order-independent
 * transparency. Intersecting transparent surfaces still require visual QA.
 */
export type TransparentSortAnchor = readonly [number,number,number];
type SortCache = {frame:number;depth:number};
export type TransparentSortItem = {
  groupOrder:number; renderOrder:number; z:number; id:number;
  object:{userData:{transparentSortAnchor?:TransparentSortAnchor;transparentSortCache?:SortCache}};
};

function depthFor(item:TransparentSortItem,e:ArrayLike<number>,frame:number):number {
  const data=item.object.userData,anchor=data.transparentSortAnchor;
  if(!anchor)return item.z;
  const cached=data.transparentSortCache;
  if(cached?.frame===frame)return cached.depth;
  const x=anchor[0],y=anchor[1],z=anchor[2];
  const clipZ=e[2]*x+e[6]*y+e[10]*z+e[14];
  const clipW=e[3]*x+e[7]*y+e[11]*z+e[15];
  const depth=Number.isFinite(clipW)&&Math.abs(clipW)>1e-8?clipZ/clipW:item.z;
  if(cached){cached.frame=frame;cached.depth=depth;}
  else data.transparentSortCache={frame,depth};
  return depth;
}

/** Match Three.js default stable ordering outside the transparent-voxel case. */
export function sortTransparentRenderItems(
  a:TransparentSortItem,b:TransparentSortItem,projectionElements:ArrayLike<number>,frame:number,
):number {
  if(a.groupOrder!==b.groupOrder)return a.groupOrder-b.groupOrder;
  if(a.renderOrder!==b.renderOrder)return a.renderOrder-b.renderOrder;
  const az=depthFor(a,projectionElements,frame),bz=depthFor(b,projectionElements,frame);
  return bz-az||a.id-b.id;
}
