import * as THREE from "three";
export function terrainMaterial(map: THREE.Texture, transparent = false) {
  return new THREE.ShaderMaterial({
    transparent,
    depthWrite: !transparent,
    side: transparent ? THREE.DoubleSide : THREE.FrontSide,
    vertexColors: true,
    uniforms: {
      map: { value: map },
      daylight: { value: 1 },
      fogColor: { value: new THREE.Color("#bad5ce") },
      fogNear: { value: 60 },
      fogFar: { value: 140 },
      opacity: { value: transparent ? 0.72 : 1 },
    },
    vertexShader: `attribute float sky; attribute float blockLight; varying vec2 vUv; varying vec3 vColor; varying float vSky; varying float vLight; varying float vDepth;
void main(){vUv=uv;vColor=color;vSky=sky;vLight=blockLight;vec4 mv=modelViewMatrix*vec4(position,1.0);vDepth=-mv.z;gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform sampler2D map; uniform float daylight; uniform vec3 fogColor; uniform float fogNear; uniform float fogFar; uniform float opacity; varying vec2 vUv; varying vec3 vColor; varying float vSky; varying float vLight; varying float vDepth;
void main(){vec4 tex=texture2D(map,vUv);vec3 ambient=vec3(0.065)+vec3(0.92,0.97,0.88)*vSky*(0.12+0.88*daylight);vec3 warm=vec3(1.0,0.57,0.22)*vLight*1.2;vec3 c=tex.rgb*vColor*(ambient+warm);float fog=smoothstep(fogNear,fogFar,vDepth);gl_FragColor=vec4(mix(c,fogColor,fog),opacity);
#include <colorspace_fragment>
}`,
  });
}
