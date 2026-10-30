import { clamp, MAX_Y, SEA } from "../../core/coords";
import { fbm, noise } from "../noise";
import { inCity, districtAt } from "../city/plan";
import { pathDistance } from "./geometry";
import type { MacroPlan, Region } from "./plan";

export const smooth = (t: number) => { const a = clamp(t, 0, 1); return a * a * (3 - 2 * a); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function cityElevation(plan: MacroPlan, x: number): number {
  // The twelve-block street corridor carries eight half-height transitions.
  return Math.round((20 + 4 * clamp((plan.cityRampX + 6 - x) / 12, 0, 1)) * 2) / 2;
}
export function agriculturalTerrace(x: number, z: number) { return x >= 350 && x <= 374 && z >= 120 && z <= 166; }
export type TerrainSample = Readonly<{ height: number; elevation: number; region: Region; urban: boolean;
  riverDistance: number; harborDistance: number; ridgeDistance: number; cliffDistance: number;
  water: boolean; waterfront: boolean; scenic: boolean; preferredCityElevation: number; caveRoof: number }>;

const REGION_NAMES: Record<Region, string> = {
  "metropolitan-core": "Jade Harbor", "urban-terrace": "Western Terraces", "urban-lowland": "City Lowlands",
  "harbor-waterfront": "Jade Harbor Estuary", "river-corridor": "Jade River", "canal-lowland": "Canal Lowlands",
  "imperial-plateau": "Northern Plateau", ridge: "Northern Ridge", highland: "Scenic Highlands", mountain: "Jade Mountains",
  valley: "Western Pass", cliff: "Cliff Highlands", "scenic-protected": "Western Scenic Highlands",
  "archaeology-outskirts": "Historical Outskirts", "rural-transition": "Rural Foothills",
};
export function terrainName(p: MacroPlan, x: number, z: number) {
  return inCity(x, z) ? "Jade Harbor · " + districtAt(x, z) : REGION_NAMES[sampleTerrain(p, x, z).region];
}

/** Pure world-space field; evaluated once per terrain column, never per voxel. */
export function sampleTerrain(p: MacroPlan, x: number, z: number): TerrainSample {
  if (!Number.isFinite(x) || !Number.isFinite(z)) throw new Error("Invalid terrain position.");
  const urban = inCity(x, z), riverDistance = pathDistance(p.river, x, z) - p.riverHalfWidth;
  const harborDistance = Math.hypot(x - p.harbor.center.x, z - p.harbor.center.z) - p.harbor.radius;
  const ridgeDistance = pathDistance(p.ridge, x, z), passDistance = pathDistance(p.pass, x, z);
  const cliffDistance = Math.hypot((x - p.cliff.x) * .6, z - p.cliff.z);
  let h = 15 + fbm(x / 100, z / 100, p.seed) * 16 + Math.pow(Math.max(0, noise(x / 170, z / 170, p.seed + 8) - .45) * 2, 2) * 185;
  let region: Region = h > 85 ? "mountain" : h > 45 ? "highland" : "rural-transition";
  // A connected northern range, with a broad foot and an irregular continuous crest.
  const crest = 115 + 30 * noise(x / 240, z / 240, p.seed + 711);
  const mountainWeight = smooth(1 - ridgeDistance / 210);
  h = mix(h, crest - Math.min(90, ridgeDistance * .43), mountainWeight);
  if (ridgeDistance < 190) region = ridgeDistance < 28 ? "ridge" : "mountain";
  const scenicDistance = Math.hypot(x - p.scenic.x, z - p.scenic.z);
  h = mix(h, 72 + noise(x / 80, z / 80, p.seed + 27) * 5, smooth((160 - scenicDistance) / 65));
  if (scenicDistance < 100) region = "scenic-protected";
  // Deliberate south-facing cliff with a narrow face and a broad upper shelf.
  const cliffX = smooth((145 - Math.abs(x - p.cliff.x)) / 35), cliffZ = smooth((110 - Math.abs(z - p.cliff.z)) / 40);
  const cliffHeight = 36 + 56 * smooth((p.cliff.z + 6 - z) / 12);
  h = mix(h, cliffHeight, cliffX * cliffZ);
  if (cliffX > .99 && Math.abs(z - p.cliff.z) <= 8) region = "cliff";
  else if (cliffX * cliffZ > .9) region = "highland";
  if (passDistance < 90) { h = mix(h, 38 + Math.max(0, -z - 340) * .018, smooth((90 - passDistance) / 55)); if (passDistance < 35) region = "valley"; }
  // A terrace for a future imperial complex and a dry outer archaeological basin.
  const imperial = Math.hypot((x - p.imperial.x) / 1.3, z - p.imperial.z);
  if (imperial < 100) { h = mix(h, 35, smooth((100 - imperial) / 30)); if (imperial < 70) region = "imperial-plateau"; }
  const archaeology = Math.max(Math.abs(x - p.archaeology.x), Math.abs(z - p.archaeology.z));
  if (archaeology < 125) { h = mix(h, 27, smooth((125 - archaeology) / 35)); if (archaeology < 90) region = "archaeology-outskirts"; }
  // Irregular transition from the retained city footprint; no larger flattened square.
  const edge = Math.max(Math.max(Math.abs(x), Math.abs(z)) - 328, Math.hypot(x, z) - 436);
  const cityY = cityElevation(p, x);
  if (edge < 80) { h = mix(cityY, h, smooth(edge / 80)); if (!urban && edge < 35) region = "urban-lowland"; }
  const lowland = x >= 328 && x <= 410 && z >= -200 && z <= 280;
  if (lowland) { h = mix(h, 21, smooth(Math.min(x - 328, 410 - x, z + 200, 280 - z) / 18)); region = "canal-lowland"; }
  // Shelf, bank and bed share one distance field. Both branches meet at sea level.
  const waterDistance = Math.min(riverDistance, harborDistance);
  if (!urban && waterDistance < 64) {
    const bed = 10 + 8 * smooth((waterDistance + 20) / 20);
    h = waterDistance <= 0 ? bed : waterDistance < 18 ? 18 + 3 * smooth(waterDistance / 18) : mix(21, h, smooth((waterDistance - 18) / 46));
    region = harborDistance < riverDistance ? "harbor-waterfront" : "river-corridor";
  }
  if (urban) { h = cityY; region = x < p.cityRampX + 6 ? "urban-terrace" : x > 100 ? (z > 116 ? "urban-lowland" : z > -218 ? "canal-lowland" : "metropolitan-core") : "metropolitan-core"; }
  if (agriculturalTerrace(x, z)) { h = 21 + Math.floor((z - 120) / 16); region = "rural-transition"; }
  h = clamp(h, 5, MAX_Y - 24);
  const height = Math.floor(h), water = !urban && height < SEA;
  return { height, elevation: urban ? cityY : height, region, urban, riverDistance, harborDistance, ridgeDistance, cliffDistance,
    water, waterfront: !water && waterDistance >= 0 && waterDistance <= 28,
    scenic: region === "ridge" || region === "cliff" || region === "scenic-protected", preferredCityElevation: cityY, caveRoof: water ? 12 : 7 };
}
export function terrainSuitability(p: MacroPlan, x: number, z: number) {
  const here = sampleTerrain(p, x, z), heights = [[-4, 0], [4, 0], [0, -4], [0, 4]].map(([dx, dz]) => sampleTerrain(p, x + dx, z + dz).elevation);
  const slope = Math.max(...heights.map(h => Math.abs(h - here.elevation))) / 4;
  const roughness = Math.max(...heights) - Math.min(...heights);
  return { ...here, slope, roughness, buildable: !here.water && !here.scenic && slope <= .5,
    waterAdjacent: here.waterfront || (here.urban && Math.abs(x - 144) <= 24 && z > -234 && z < 144),
    ridge: here.ridgeDistance <= 28, cliffAdjacent: here.cliffDistance <= 24,
    districtSuitability: p.districts.filter(d => d.regions.includes(here.region) && here.elevation >= d.elevation[0] && here.elevation <= d.elevation[1] && slope <= d.maxSlope).map(d => d.id),
    landmarkSuitability: here.water ? ["waterfront", "landscape"] : here.region === "cliff" ? ["cliff"] : here.region === "ridge" ? ["linear", "mountain"] : ["point", "area", "landscape"] };
}
