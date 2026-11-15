export interface PerformanceCapabilities {
  readonly maxTextureSize: number | null;
  readonly maxRenderbufferSize: number | null;
  readonly maxVertexAttributes: number | null;
  readonly timerQuery: boolean;
  readonly logicalCores: number | null;
  readonly memoryGiBHint: number | null;
}
const hint=(value:unknown, min:number, max:number) => typeof value==="number"&&Number.isFinite(value)&&value>=min&&value<=max?value:null;
/** Ephemeral supported hints; not a benchmark, device identity or heat sensor. */
export function performanceCapabilities(gl: WebGLRenderingContext | WebGL2RenderingContext, nav: {hardwareConcurrency?:number;deviceMemory?:number} = {}) : Readonly<PerformanceCapabilities> {
  const read=(key:number)=>{try{return hint(gl.getParameter(key),1,1048576);}catch{return null;}};
  let timerQuery=false;try{timerQuery=!!gl.getExtension("EXT_disjoint_timer_query_webgl2");}catch{/* Optional and privacy-restricted. */}
  return Object.freeze({maxTextureSize:read(gl.MAX_TEXTURE_SIZE),maxRenderbufferSize:read(gl.MAX_RENDERBUFFER_SIZE),maxVertexAttributes:read(gl.MAX_VERTEX_ATTRIBS),timerQuery,logicalCores:hint(nav.hardwareConcurrency,1,1024),memoryGiBHint:hint(nav.deviceMemory,.25,1024)});
}
