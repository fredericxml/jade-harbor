import * as THREE from "three";
export function terrainMaterial(map: THREE.Texture, transparent = false, emissive = false) {
  return new THREE.ShaderMaterial({transparent,depthWrite:!transparent,side:transparent?THREE.DoubleSide:THREE.FrontSide,vertexColors:true,
    uniforms:{map:{value:map},daylight:{value:1},lightTint:{value:new THREE.Color("#fff6de")},waterTint:{value:new THREE.Color("#b3d3d5")},night:{value:0},emissive:{value:emissive?1:0},fogColor:{value:new THREE.Color("#adc5c7")},fogNear:{value:50},fogFar:{value:640},fogDetail:{value:128},opacity:{value:transparent?.72:1}},
    vertexShader:`attribute float sky;attribute float blockLight;varying vec2 vUv;varying vec3 vColor;varying float vSky;varying float vLight;varying float vDepth;varying vec2 vWorld;
void main(){vUv=uv;vColor=color;vSky=sky;vLight=blockLight;vWorld=(modelMatrix*vec4(position,1.)).xz;vec4 mv=modelViewMatrix*vec4(position,1.);vDepth=-mv.z;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform sampler2D map;uniform float daylight;uniform vec3 lightTint;uniform vec3 waterTint;uniform float night;uniform float emissive;uniform vec3 fogColor;uniform float fogNear;uniform float fogFar;uniform float fogDetail;uniform float opacity;varying vec2 vUv;varying vec3 vColor;varying float vSky;varying float vLight;varying float vDepth;varying vec2 vWorld;
void main(){vec4 tex=texture2D(map,vUv);float tile=floor(vUv.x*16.)+floor((1.-vUv.y)*16.)*16.;if(tile>=15.&&tile<=17.)tex.rgb*=waterTint;
vec2 commercial=(vWorld-vec2(0.,210.))/100.;vec2 ceremony=(vWorld-vec2(0.,-48.))/85.;vec2 palace=(vWorld-vec2(0.,-430.))/90.;vec2 quay=(vWorld-vec2(200.,345.))/120.;float hierarchy=1.+night*(.10+.28*exp(-dot(commercial,commercial))+.18*exp(-dot(ceremony,ceremony))+.12*exp(-dot(palace,palace))-.06*exp(-dot(quay,quay)));
vec3 ambient=vec3(.065)+lightTint*vSky*(.18+.82*daylight);vec3 warm=vec3(1.,.59,.27)*vLight*1.2*hierarchy;vec3 c=tex.rgb*vColor*(emissive>.5?vec3(1.,.94,.82)*hierarchy:ambient+warm);float fog=.7*smoothstep(fogNear,fogDetail,vDepth)+.3*smoothstep(fogDetail,fogFar,vDepth);gl_FragColor=vec4(mix(c,fogColor,fog),opacity);
#include <colorspace_fragment>
}`});
}
