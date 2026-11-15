import * as THREE from "three";
import { graphicsQualityLevel, type GraphicsQuality } from "./graphics";
import { DISTANT_VERTEX_SHADER, DISTANT_WATER_FRAGMENT_SHADER, TERRAIN_FRAGMENT_SHADER, TERRAIN_VERTEX_SHADER, WATER_FRAGMENT_SHADER } from "./shader-quality";

export function terrainMaterial(
  map: THREE.Texture,
  transparent = false,
  quality: GraphicsQuality = "medium",
) {
  return new THREE.ShaderMaterial({
    transparent,
    depthWrite: !transparent,
    side: transparent ? THREE.DoubleSide : THREE.FrontSide,
    vertexColors: true,
    uniforms: {
      map: { value: map },
      daylight: { value: 1 },
      lightTint: { value: new THREE.Color("#fff6de") },
      waterTint: { value: new THREE.Color("#b3d3d5") },
      night: { value: 0 },
      fogColor: { value: new THREE.Color("#adc5c7") },
      fogNear: { value: 50 },
      fogFar: { value: 640 },
      fogDetail: { value: 128 },
      opacity: { value: transparent ? 0.72 : 1 },
      qualityLevel: { value: graphicsQualityLevel(quality) },
    },
    vertexShader: TERRAIN_VERTEX_SHADER,
    fragmentShader: TERRAIN_FRAGMENT_SHADER,
  });
}

/** Water remains a dedicated translucent material. The fragment shader permits
 * exactly the top-face underside when viewed from below; side/back faces are
 * discarded. A single transparent pass avoids the duplicate back/front draws
 * that Three.js normally uses for DoubleSide translucent meshes.
 * Glass and ice retain their original material and atlas presentation.
 */
export function waterMaterial(map: THREE.Texture, quality: GraphicsQuality = "medium") {
  const material = terrainMaterial(map, true, quality);
  material.name = "JadeHarborWater";
  material.side = THREE.DoubleSide;
  material.forceSinglePass = true;
  // Partial-alpha water must not occlude glass or farther water through depth
  // writes. Opaque scene depth is still respected by depthTest (default true).
  material.depthWrite = false;
  material.fragmentShader = WATER_FRAGMENT_SHADER;
  // The water shader sets a different alpha for top and side faces.
  material.uniforms.opacity.value = 1;
  return material;
}


/** Transparent far-water proxy. It shares the near-water tint/fog controls and
 * the detailed-section coverage mask, but remains a separate transparent draw
 * so distant buildings and terrain keep their opaque depth behavior. */
export function distantWaterMaterial(coverage: THREE.DataTexture, quality: GraphicsQuality = "medium") {
  return new THREE.ShaderMaterial({
    name: "JadeHarborDistantWater",
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    vertexColors: true,
    uniforms: {
      coverage: { value: coverage },
      origin: { value: new THREE.Vector2() },
      cameraXZ: { value: new THREE.Vector2() },
      waterTint: { value: new THREE.Color("#b3d3d5") },
      fogColor: { value: new THREE.Color("#adc5c7") },
      lightTint: { value: new THREE.Color("#fff6de") },
      daylight: { value: 1 },
      fogNear: { value: 50 },
      fogFar: { value: 640 },
      fogDetail: { value: 128 },
      qualityLevel: { value: graphicsQualityLevel(quality) },
    },
    vertexShader: DISTANT_VERTEX_SHADER,
    fragmentShader: DISTANT_WATER_FRAGMENT_SHADER,
  });
}
