#!/usr/bin/env node
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const originalLoad = Module._load;
class FakeColor { constructor(value) { this.value = value; } }
class FakeShaderMaterial { constructor(options) { Object.assign(this, options); } }
Module._load = function(request, parent, isMain) {
  if (request === "three") return {
    ShaderMaterial: FakeShaderMaterial,
    Color: FakeColor,
    DoubleSide: 2,
    FrontSide: 0,
  };
  return originalLoad.call(this, request, parent, isMain);
};
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  module._compile(output, filename);
};

const { graphicsQualityLevel, GRAPHICS_PROFILES } = require("../src/render/graphics.ts");
const {
  TERRAIN_FRAGMENT_SHADER,
  TERRAIN_VERTEX_SHADER,
  SKY_FRAGMENT_SHADER,
  SKY_VERTEX_SHADER,
  DISTANT_VERTEX_SHADER,
  distantFragmentShader,
} = require("../src/render/shader-quality.ts");
const { terrainMaterial } = require("../src/render/material.ts");
Module._load = originalLoad;

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("shader quality selector maps the three presets to stable levels", () => {
  assert.equal(graphicsQualityLevel(GRAPHICS_PROFILES.low), 0);
  assert.equal(graphicsQualityLevel(GRAPHICS_PROFILES.medium), 1);
  assert.equal(graphicsQualityLevel(GRAPHICS_PROFILES.high), 2);
  assert.equal(graphicsQualityLevel("low"), 0);
  assert.equal(graphicsQualityLevel("medium"), 1);
  assert.equal(graphicsQualityLevel("high"), 2);
});

test("terrain shader keeps atlas, sky/block light, water tint, opacity and emissive paths", () => {
  for (const token of [
    "textureGrad(map,atlasUV,atlasDx,atlasDy)", "dFdx(vUv)", "dFdy(vUv)", "fract(vUv)", "vTile.x+vTile.y*16.", "waterTint", "tile>=15.", "vSky", "vLight",
    "step(.5,vEmissive)", "opacity", "fogColor",
  ]) assert.ok(TERRAIN_FRAGMENT_SHADER.includes(token), `missing ${token}`);
  assert.ok(TERRAIN_VERTEX_SHADER.includes("attribute float sky"));
  assert.ok(TERRAIN_VERTEX_SHADER.includes("attribute float blockLight"));
  assert.ok(TERRAIN_VERTEX_SHADER.includes("attribute float emissive"));
  assert.ok(TERRAIN_VERTEX_SHADER.includes("vEmissive=emissive"));
  assert.ok(TERRAIN_VERTEX_SHADER.includes("attribute vec2 tile"));
  assert.ok(TERRAIN_VERTEX_SHADER.includes("vTile=tile"));
});

test("High terrain path preserves the original full regional-light and two-stage fog calculations", () => {
  assert.match(TERRAIN_FRAGMENT_SHADER, /qualityLevel>1\.5/);
  assert.match(TERRAIN_FRAGMENT_SHADER, /\.28\*exp\(-dot\(commercial,commercial\)\)/);
  assert.match(TERRAIN_FRAGMENT_SHADER, /\.18\*exp\(-dot\(ceremony,ceremony\)\)/);
  assert.match(TERRAIN_FRAGMENT_SHADER, /\.12\*exp\(-dot\(palace,palace\)\)/);
  assert.match(TERRAIN_FRAGMENT_SHADER, /\.06\*exp\(-dot\(quay,quay\)\)/);
  assert.match(TERRAIN_FRAGMENT_SHADER, /\.7\*smoothstep\(fogNear,fogDetail,vDepth\)\+\.3\*smoothstep\(fogDetail,fogFar,vDepth\)/);
});

test("Medium terrain path retains all regional zones with cheaper linear falloff and one fog transition", () => {
  assert.match(TERRAIN_FRAGMENT_SHADER, /qualityLevel>\.5/);
  for (const name of ["commercialGlow", "ceremonyGlow", "palaceGlow", "quayShade"])
    assert.ok(TERRAIN_FRAGMENT_SHADER.includes(name), `missing ${name}`);
  assert.match(TERRAIN_FRAGMENT_SHADER, /fog=smoothstep\(fogNear,fogFar,vDepth\)/);
});

test("Low terrain path keeps every regional zone but uses strongest-zone blending and linear fog", () => {
  assert.match(TERRAIN_FRAGMENT_SHADER, /strongestGlow=max\(max\(\.28\*commercialGlow,\.18\*ceremonyGlow\),\.12\*palaceGlow\)/);
  assert.match(TERRAIN_FRAGMENT_SHADER, /fog=clamp\(\(vDepth-fogNear\)\/max\(1\.,fogFar-fogNear\),0\.,1\.\)/);
  assert.ok(TERRAIN_FRAGMENT_SHADER.includes("quayShade"));
});

test("terrain material initializes the profile uniform without shader permutations", () => {
  const low = terrainMaterial({}, false, "low");
  const medium = terrainMaterial({}, true, "medium");
  const high = terrainMaterial({}, false, "high");
  assert.equal(low.uniforms.qualityLevel.value, 0);
  assert.equal(medium.uniforms.qualityLevel.value, 1);
  assert.equal(high.uniforms.qualityLevel.value, 2);
  assert.equal(low.fragmentShader, medium.fragmentShader);
  assert.equal(medium.fragmentShader, high.fragmentShader);
  for (const material of [low, medium, high]) {
    for (const uniform of ["map", "daylight", "lightTint", "waterTint", "night", "fogColor", "fogNear", "fogFar", "fogDetail", "opacity"])
      assert.ok(material.uniforms[uniform], `missing uniform ${uniform}`);
    assert.equal(material.uniforms.emissive, undefined, "emissive selection is per vertex, not a third material uniform");
  }
});

test("sky shader retains sky gradient and sun at all quality levels", () => {
  assert.ok(SKY_VERTEX_SHADER.includes("vDirection=position"));
  assert.ok(SKY_FRAGMENT_SHADER.includes("mix(horizon,zenith,horizonMix)"));
  assert.ok(SKY_FRAGMENT_SHADER.includes("sunDirection"));
  assert.ok(SKY_FRAGMENT_SHADER.includes("sunVisibility"));
  assert.match(SKY_FRAGMENT_SHADER, /qualityLevel>1\.5/);
  assert.match(SKY_FRAGMENT_SHADER, /qualityLevel>\.5/);
  assert.match(SKY_FRAGMENT_SHADER, /horizonMix=clamp/);
  assert.match(SKY_FRAGMENT_SHADER, /disk=step\(/);
});

test("distant shader keeps coverage culling and the 720-block outer envelope without a fixed near-field hole", () => {
  const shader = distantFragmentShader(720);
  assert.ok(shader.includes("coverage"));
  assert.ok(shader.includes("covered(sy,cell)"));
  assert.ok(!shader.includes("distanceSquared<576."), "coverage mask, not a fixed 24-block exclusion, owns the near/far seam");
  assert.ok(shader.includes("distanceSquared>518400.0"));
  assert.ok(shader.includes("qualityLevel"));
  assert.ok(shader.includes("fogColor"));
  assert.ok(shader.includes("lightTint"));
  assert.ok(shader.includes("daylight"));
  assert.ok(shader.includes("vNormal"));
  assert.match(shader, /haze=\.7\*smoothstep\(fogNear,fogDetail,depth\)\+\.3\*smoothstep\(fogDetail,fogFar,depth\)/);
  assert.match(shader, /haze=smoothstep\(fogNear,fogFar,depth\)/);
  assert.match(shader, /haze=clamp\(/);
  assert.ok(DISTANT_VERTEX_SHADER.includes("vNormal=normal"));
});

test("distant terrain shader consumes the unit normals already written by the geometry builder", () => {
  const distantSource = read("src/render/distant-world.ts");
  assert.match(distantSource, /length=Math\.sqrt\(x\*x\+y\*y\+z\*z\)\|\|1;x\/=length;y\/=length;z\/=length/);
  assert.match(DISTANT_VERTEX_SHADER, /vNormal=normal/);
  assert.match(distantFragmentShader(720), /dot\(vNormal,sunDirection\)/);
  assert.doesNotMatch(distantFragmentShader(720), /normalize\(vNormal\)/,
    "avoid a redundant per-fragment normalization of unit triangle normals");
});

test("runtime profile switching updates terrain, sky and distant shader uniforms only", () => {
  const renderer = read("src/render/renderer.ts");
  const distant = read("src/render/distant-world.ts");
  assert.match(renderer, /material\.uniforms\.qualityLevel\.value=qualityLevel/);
  assert.match(renderer, /skyMaterial\.uniforms\.qualityLevel\.value=qualityLevel/);
  assert.match(renderer, /this\.distant\?\.setProfile\(profile\)/);
  assert.match(distant, /qualityLevel:\{value:graphicsQualityLevel\(profile\)\}/);
  assert.match(distant, /this\.material\.uniforms\.qualityLevel\.value=graphicsQualityLevel\(profile\)/);
  assert.ok(!renderer.includes("material.needsUpdate=true"), "profile switch must not force shader recompilation");
});
