import * as legacy from "./generator-v3";
import { createV4Generator } from "./generator-v4";
import { createV5Generator } from "./generator-v5";
import { createV6Generator } from "./generator-v6";
import { createV7Generator } from "./generator-v7";
import { createV9Generator } from "./generator-v9";
import { createV10Generator } from "./generator-v10";
import { createV8Generator } from "./generator-v8";
import { clearCityPlanCache } from "./city/plan";
import { seedNumber } from "./noise";
import { createMacroPlan } from "./geography/plan";
import { sampleTerrain, terrainName } from "./geography/terrain";
export const GENERATOR_VERSION = 10;
export type GeneratorVersion = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export const isGeneratorVersion = (v: unknown): v is GeneratorVersion => v === 3 || v === 4 || v === 5 || v === 6 || v === 7 || v === 8 || v === 9 || v === 10;
export function requireGeneratorVersion(v: unknown): GeneratorVersion {
  if (!isGeneratorVersion(v)) throw new Error("Unsupported world generator version.");
  return v;
}
export function createGenerator(seed: string, version: number = GENERATOR_VERSION) {
  requireGeneratorVersion(version);
  if (version === 10) return createV10Generator(seed);
  if (version === 9) return createV9Generator(seed);
  if (version === 8) return createV8Generator(seed);
  if (version === 7) return createV7Generator(seed);
  if (version === 6) return createV6Generator(seed);
  if (version === 5) return createV5Generator(seed);
  if (version === 4) return createV4Generator(seed);
  const n = seedNumber(seed);
  return { version: 3 as const, plan: undefined, landmarks: undefined, city: undefined, planMs: 0,
    generate: (cx: number, cz: number) => legacy.generateChunk(cx, cz, seed),
    terrainHeight: (x: number, z: number) => legacy.terrainHeight(x, z, n),
    biomeAt: (x: number, z: number) => legacy.biomeAt(x, z, n), inspect: undefined };
}
export type Generator = ReturnType<typeof createGenerator>;
// Convenience/offline calls share at most four immutable contexts. Live worlds own theirs.
const cache = new Map<string, Generator>();
export function generatorFor(seed: string, version: number = GENERATOR_VERSION): Generator {
  requireGeneratorVersion(version);
  const key = `${version}:${seed}`;
  let generator = cache.get(key);
  if (!generator) { generator = createGenerator(seed, version); cache.set(key, generator); if (cache.size > 4) cache.delete(cache.keys().next().value!); }
  return generator;
}
export function clearGeneratorCache(seed: string) {
  for (const key of cache.keys()) if ([3, 4, 5, 6, 7, 8, 9, 10].some(v => key === `${v}:${seed}`)) cache.delete(key);
  clearCityPlanCache(seedNumber(seed));
  numericPlans.delete(seedNumber(seed));
}
const numericPlans = new Map<number, ReturnType<typeof createMacroPlan>>();
function numericPlan(seed: number) {
  let plan = numericPlans.get(seed);
  if (!plan) { plan = createMacroPlan(seed); numericPlans.set(seed, plan); if (numericPlans.size > 4) numericPlans.delete(numericPlans.keys().next().value!); }
  return plan;
}
export function generatorCacheSizes() { return { contexts: cache.size, terrainPlans: numericPlans.size }; }
export function generateChunk(cx: number, cz: number, seed: string, version: number = GENERATOR_VERSION) {
  if (!Number.isSafeInteger(cx) || !Number.isSafeInteger(cz) || Math.abs(cx) > 625000 || Math.abs(cz) > 625000) throw new Error("Invalid chunk coordinate.");
  return generatorFor(seed, version).generate(cx, cz);
}
export function terrainHeight(x: number, z: number, seed: number, version: number = GENERATOR_VERSION) {
  requireGeneratorVersion(version);
  return version === 3 ? legacy.terrainHeight(x, z, seed) : sampleTerrain(numericPlan(seed), x, z).height;
}
export function biomeAt(x: number, z: number, seed: number, version: number = GENERATOR_VERSION) {
  requireGeneratorVersion(version);
  return version === 3 ? legacy.biomeAt(x, z, seed) : terrainName(numericPlan(seed), x, z);
}
export const naturalHeight = terrainHeight;
export const paddyAt = legacy.paddyAt;
