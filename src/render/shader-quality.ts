/**
 * Shared renderer-only shader sources for the High / Medium / Low profiles.
 * Quality is supplied as a uniform so profile changes do not create shader
 * permutations or trigger runtime recompilation stalls.
 */
export const TERRAIN_VERTEX_SHADER = `attribute float sky;attribute float blockLight;attribute float emissive;attribute vec2 tile;varying vec2 vUv;varying vec2 vTile;varying vec3 vColor;varying float vSky;varying float vLight;varying float vEmissive;varying float vDepth;varying vec2 vWorld;varying float vSurfaceUp;
void main(){vSurfaceUp=normal.y;vUv=uv;vTile=tile;vColor=color;vSky=sky;vLight=blockLight;vEmissive=emissive;vWorld=(modelMatrix*vec4(position,1.)).xz;vec4 mv=modelViewMatrix*vec4(position,1.);vDepth=-mv.z;gl_Position=projectionMatrix*mv;}`;

export const TERRAIN_FRAGMENT_SHADER = `uniform sampler2D map;uniform float daylight;uniform vec3 lightTint;uniform vec3 waterTint;uniform float night;uniform vec3 fogColor;uniform float fogNear;uniform float fogFar;uniform float fogDetail;uniform float opacity;uniform float qualityLevel;varying vec2 vUv;varying vec2 vTile;varying vec3 vColor;varying float vSky;varying float vLight;varying float vEmissive;varying float vDepth;varying vec2 vWorld;
void main(){vec2 repeatedUV=fract(vUv);vec2 atlasUV=vec2((vTile.x+.00625+repeatedUV.x*.9875)/16.,1.-(vTile.y+1.-.00625-repeatedUV.y*.9875)/16.);vec2 atlasDx=dFdx(vUv)*(.9875/16.);vec2 atlasDy=dFdy(vUv)*(.9875/16.);vec4 tex=textureGrad(map,atlasUV,atlasDx,atlasDy);float tile=vTile.x+vTile.y*16.;if(tile>=15.&&tile<=17.)tex.rgb*=waterTint;
float hierarchy=1.;
if(qualityLevel>1.5){
vec2 commercial=(vWorld-vec2(0.,210.))/100.;vec2 ceremony=(vWorld-vec2(0.,-48.))/85.;vec2 palace=(vWorld-vec2(0.,-430.))/90.;vec2 quay=(vWorld-vec2(200.,345.))/120.;
hierarchy=1.+night*(.10+.28*exp(-dot(commercial,commercial))+.18*exp(-dot(ceremony,ceremony))+.12*exp(-dot(palace,palace))-.06*exp(-dot(quay,quay)));
}else{
vec2 commercial=(vWorld-vec2(0.,210.))/100.;vec2 ceremony=(vWorld-vec2(0.,-48.))/85.;vec2 palace=(vWorld-vec2(0.,-430.))/90.;vec2 quay=(vWorld-vec2(200.,345.))/120.;
float commercialGlow=max(0.,1.-dot(commercial,commercial));float ceremonyGlow=max(0.,1.-dot(ceremony,ceremony));float palaceGlow=max(0.,1.-dot(palace,palace));float quayShade=max(0.,1.-dot(quay,quay));
if(qualityLevel>.5){hierarchy=1.+night*(.10+.28*commercialGlow+.18*ceremonyGlow+.12*palaceGlow-.06*quayShade);}
else{float strongestGlow=max(max(.28*commercialGlow,.18*ceremonyGlow),.12*palaceGlow);hierarchy=1.+night*(.10+strongestGlow-.06*quayShade);}
}
vec3 ambient=vec3(.065)+lightTint*vSky*(.18+.82*daylight);vec3 warm=vec3(1.,.59,.27)*vLight*1.2*hierarchy;vec3 lighting=mix(ambient+warm,vec3(1.,.94,.82)*hierarchy,step(.5,vEmissive));vec3 c=tex.rgb*vColor*lighting;
float fog;if(qualityLevel>1.5){fog=.7*smoothstep(fogNear,fogDetail,vDepth)+.3*smoothstep(fogDetail,fogFar,vDepth);}else if(qualityLevel>.5){fog=smoothstep(fogNear,fogFar,vDepth);}else{fog=clamp((vDepth-fogNear)/max(1.,fogFar-fogNear),0.,1.);}
gl_FragColor=vec4(mix(c,fogColor,fog),opacity);
#include <colorspace_fragment>
}`;

/** Dedicated water shading: soft translucent surface, no repeating atlas noise.
 * The water faces are still the original block geometry; no generation/simulation
 * change and no extra texture or time-dependent animation cost is introduced.
 * Atmosphere still controls the color, fog, daylight and night tint.
 */
export const WATER_FRAGMENT_SHADER = `uniform float daylight;uniform vec3 lightTint;uniform vec3 waterTint;uniform vec3 fogColor;uniform float fogNear;uniform float fogFar;uniform float fogDetail;uniform float opacity;uniform float qualityLevel;
varying vec3 vColor;varying float vSky;varying float vLight;varying float vDepth;varying vec2 vWorld;varying float vSurfaceUp;
void main(){
// Wide, low-contrast ripples in world coordinates avoid repeating noisy atlas tiles.
float ripple=sin(vWorld.x*.25+sin(vWorld.y*.17)) * sin(vWorld.y*.22-vWorld.x*.13);
float surface=step(.5,vSurfaceUp);
float shimmer=surface*(.025*ripple+.017*sin(vWorld.x*.09+vWorld.y*.19));
// Atmosphere waterTint is intentionally light; lower its luminance to keep the
// canal transparent instead of rendering a solid, milky turquoise sheet.
vec3 lagoon=waterTint*vec3(.48,.69,.77);
vec3 lightFactor=vec3(.62+.26*clamp(daylight,0.,1.)) + lightTint*(.10*clamp(vSky,0.,1.));
vec3 c=lagoon*lightFactor*(.90+shimmer)*clamp(vColor,vec3(.60),vec3(1.));
float fog;if(qualityLevel>1.5){fog=.7*smoothstep(fogNear,fogDetail,vDepth)+.3*smoothstep(fogDetail,fogFar,vDepth);}else if(qualityLevel>.5){fog=smoothstep(fogNear,fogFar,vDepth);}else{fog=clamp((vDepth-fogNear)/max(1.,fogFar-fogNear),0.,1.);}
// Draw the upward water surface from both sides so swimming players can see it.
// Cull back-facing vertical/bottom faces in-shader, avoiding stacked water cubes.
// forceSinglePass in the material guarantees this is one transparent draw.
if(!gl_FrontFacing && surface<.5)discard;
float alpha=(gl_FrontFacing?mix(.28,.56,surface):.38)*opacity;
gl_FragColor=vec4(mix(c,fogColor,fog),alpha);
#include <colorspace_fragment>
}`;

export const SKY_VERTEX_SHADER = `varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;

export const SKY_FRAGMENT_SHADER = `uniform vec3 zenith;uniform vec3 horizon;uniform vec3 sunDirection;uniform float sunVisibility;uniform float qualityLevel;varying vec3 vDirection;
void main(){vec3 d=normalize(vDirection);float horizonMix;float disk;float sunDot=dot(d,sunDirection);
if(qualityLevel>1.5){horizonMix=smoothstep(-.08,.72,d.y);disk=smoothstep(.9988,.9995,sunDot);}
else if(qualityLevel>.5){horizonMix=smoothstep(-.08,.72,d.y);disk=smoothstep(.9990,.9996,sunDot);}
else{horizonMix=clamp((d.y+.08)/.8,0.,1.);disk=step(.9994,sunDot);}
vec3 c=mix(horizon,zenith,horizonMix);c+=vec3(.65,.48,.25)*disk*sunVisibility;gl_FragColor=vec4(c,1.);
#include <colorspace_fragment>
}`;

export const DISTANT_VERTEX_SHADER = `attribute float kind;varying vec3 vWorld;varying vec3 vColor;varying vec3 vNormal;varying float vKind;varying float vDepth;
void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;vColor=color;vNormal=normal;vKind=kind;vec4 mv=modelViewMatrix*vec4(position,1.);vDepth=-mv.z;gl_Position=projectionMatrix*mv;}`;

export const DISTANT_WATER_FRAGMENT_SHADER = `uniform sampler2D coverage;uniform vec2 origin;uniform vec2 cameraXZ;uniform vec3 waterTint;uniform vec3 fogColor;uniform vec3 lightTint;uniform float daylight;uniform float fogNear;uniform float fogFar;uniform float fogDetail;uniform float qualityLevel;varying vec3 vWorld;varying vec3 vColor;varying vec3 vNormal;varying float vKind;varying float vDepth;
float covered(float sy,vec2 cell){if(sy<0.||sy>=24.)return 0.;return texture2D(coverage,vec2((cell.x+.5)/128.,(cell.y+sy*128.+.5)/3072.)).r;}
void main(){
vec2 cameraDelta=vWorld.xz-cameraXZ;float distanceSquared=dot(cameraDelta,cameraDelta);
if(distanceSquared>518400.)discard;
vec2 cell=floor((vWorld.xz-origin)/16.);float sy=floor((vWorld.y-.02)/16.)+4.;float mask=covered(sy,cell);
if(vKind<.5)mask=max(mask,max(covered(sy-1.,cell),covered(sy+1.,cell)));
if(cell.x>=0.&&cell.y>=0.&&cell.x<128.&&cell.y<128.&&mask>.5)discard;
float shade=.88+.12*max(0.,vNormal.y);
float ambient=dot(lightTint,vec3(.2126,.7152,.0722));
vec3 base=waterTint*vec3(.48,.69,.77)*(.76+.18*clamp(daylight,0.,1.)+.06*ambient)*shade;
float fog;if(qualityLevel>1.5){fog=.7*smoothstep(fogNear,fogDetail,vDepth)+.3*smoothstep(fogDetail,fogFar,vDepth);}else if(qualityLevel>.5){fog=smoothstep(fogNear,fogFar,vDepth);}else{fog=clamp((vDepth-fogNear)/max(1.,fogFar-fogNear),0.,1.);}
float ripple=.025*sin(vWorld.x*.07+vWorld.z*.11)*sin(vWorld.z*.09-vWorld.x*.04);
vec3 color=mix(base*(1.+ripple),fogColor,fog);
gl_FragColor=vec4(color,.46);
#include <colorspace_fragment>
}`;

/** Radius is embedded as a constant so the outer culling bound is compile-time. */
export function distantFragmentShader(radius: number): string {
  const maxDistanceSquared = Number.isFinite(radius) && radius > 0 ? (radius * radius).toFixed(1) : "518400.0";
  return `uniform sampler2D coverage;uniform vec2 origin;uniform vec2 cameraXZ;uniform vec3 fogColor;uniform vec3 lightTint;uniform vec3 sunDirection;uniform float daylight;uniform float fogNear;uniform float fogFar;uniform float fogDetail;uniform float qualityLevel;varying vec3 vWorld;varying vec3 vColor;varying vec3 vNormal;varying float vKind;varying float vDepth;
float covered(float sy,vec2 cell){if(sy<0.||sy>=24.)return 0.;return texture2D(coverage,vec2((cell.x+.5)/128.,(cell.y+sy*128.+.5)/3072.)).r;}
void main(){vec2 cameraDelta=vWorld.xz-cameraXZ;float distanceSquared=dot(cameraDelta,cameraDelta);if(distanceSquared>${maxDistanceSquared})discard;vec2 cell=floor((vWorld.xz-origin)/16.);float sy=floor((vWorld.y-.02)/16.)+4.;float mask=covered(sy,cell);if(vKind<.5)mask=max(mask,max(covered(sy-1.,cell),covered(sy+1.,cell)));if(cell.x>=0.&&cell.y>=0.&&cell.x<128.&&cell.y<128.&&mask>.5)discard;
float shade;float depth;float haze;
if(qualityLevel>1.5){float distance=sqrt(distanceSquared);shade=.72+.28*max(0.,dot(vNormal,sunDirection));depth=max(vDepth,distance*.8);haze=.7*smoothstep(fogNear,fogDetail,depth)+.3*smoothstep(fogDetail,fogFar,depth);}
else if(qualityLevel>.5){float distance=sqrt(distanceSquared);shade=.76+.24*max(0.,dot(vNormal,sunDirection));depth=max(vDepth,distance*.8);haze=smoothstep(fogNear,fogFar,depth);}
else{shade=.82+.18*max(0.,dot(vNormal,sunDirection));float approximateDistance=max(abs(cameraDelta.x),abs(cameraDelta.y));depth=max(vDepth,approximateDistance*.8);haze=clamp((depth-fogNear)/max(1.,fogFar-fogNear),0.,1.);}
vec3 c=vColor*lightTint*(.22+.78*daylight)*shade;c=mix(c,fogColor,haze);gl_FragColor=vec4(c,1.);
#include <colorspace_fragment>
}`;
}
