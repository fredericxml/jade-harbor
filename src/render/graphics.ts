/** Presentation capabilities only. Never pass these profiles to simulation. */
export type GraphicsQuality = "low" | "medium" | "high";
export interface GraphicsProfile {
  readonly quality: GraphicsQuality;
  readonly label: string;
  readonly renderScale: number;
  readonly dprCap: number;
  readonly distantTerrainStep: number;
  readonly crownBuildingsPerDistrict: number;
  readonly residentFullDistance: number;
  readonly residentMidDistance: number;
  readonly farAnimationHz: number;
  readonly rainParticleCount: number;
  readonly cloudCount: number;
}
export const GRAPHICS_QUALITIES = ["low", "medium", "high"] as const;
export const GRAPHICS_PROFILES: Readonly<Record<GraphicsQuality, GraphicsProfile>> = Object.freeze({
  low: Object.freeze({quality:"low",label:"Low",renderScale:.7,dprCap:1,distantTerrainStep:48,crownBuildingsPerDistrict:1,residentFullDistance:16,residentMidDistance:32,farAnimationHz:8,rainParticleCount:90,cloudCount:16}),
  medium: Object.freeze({quality:"medium",label:"Medium",renderScale:.88,dprCap:1.25,distantTerrainStep:32,crownBuildingsPerDistrict:2,residentFullDistance:24,residentMidDistance:48,farAnimationHz:15,rainParticleCount:180,cloudCount:22}),
  high: Object.freeze({quality:"high",label:"High",renderScale:1,dprCap:1.6,distantTerrainStep:16,crownBuildingsPerDistrict:4,residentFullDistance:960,residentMidDistance:960,farAnimationHz:60,rainParticleCount:300,cloudCount:28}),
});
export function graphicsQuality(value: unknown): GraphicsQuality {
  return value === "low" || value === "high" || value === "medium" ? value : "medium";
}
export function graphicsProfile(value: unknown): GraphicsProfile { return GRAPHICS_PROFILES[graphicsQuality(value)]; }
export function effectivePixelRatio(profile: GraphicsProfile, deviceRatio: number): number {
  const ratio=Number.isFinite(deviceRatio)&&deviceRatio>0?deviceRatio:1;
  // Preserve very low device ratios without accidental supersampling. DOM/CSS
  // resolution is independent from this drawing-buffer policy.
  return Math.min(ratio,Math.max(.25,Math.min(ratio,profile.dprCap)*profile.renderScale));
}
export interface RendererDiagnostics {
  vendor: string; renderer: string; unmaskedVendor: string; unmaskedRenderer: string;
  version: string; software: boolean; restricted: boolean;
}
export function rendererDiagnostics(gl: WebGLRenderingContext | WebGL2RenderingContext): RendererDiagnostics {
  const read=(key:number)=>{try{return String(gl.getParameter(key)??"unavailable/restricted");}catch{return "unavailable/restricted";}};
  const result:RendererDiagnostics={vendor:read(gl.VENDOR),renderer:read(gl.RENDERER),version:read(gl.VERSION),unmaskedVendor:"unavailable/restricted",unmaskedRenderer:"unavailable/restricted",software:false,restricted:true};
  try {const extension=gl.getExtension("WEBGL_debug_renderer_info");if(extension){result.unmaskedVendor=read(extension.UNMASKED_VENDOR_WEBGL);result.unmaskedRenderer=read(extension.UNMASKED_RENDERER_WEBGL);result.restricted=result.unmaskedRenderer==="unavailable/restricted";}}catch{/* Privacy policy may hide the extension. */}
  result.software=/SwiftShader|llvmpipe|softpipe|software (?:rasterizer|renderer)|Microsoft Basic Render/i.test(`${result.renderer} ${result.unmaskedRenderer}`);
  return result;
}
