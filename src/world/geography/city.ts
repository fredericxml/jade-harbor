import { getCityPlan, type CityPlan, type Structure } from "../city/plan";
import type { MacroPlan } from "./plan";
import { cityElevation, terrainSuitability } from "./terrain";
import { footprintsOverlap, freezePlan } from "./geometry";
import type { LandmarkPlan } from "./landmarks";

/** Reuse the complete v3 parcel planner and architectural families at one primary anchor. */
export function planPrimaryCity(p: MacroPlan, landmarks: LandmarkPlan): CityPlan {
  const original = getCityPlan(p.seed), structures: Structure[] = [];
  for (const s of original.structures) {
    const footprint = { kind: "area" as const, bounds: { x1: s.x1 - 3, x2: s.x2 + 3, z1: s.z1 - 3, z2: s.z2 + 3 } };
    if (landmarks.reservations.some(r => footprintsOverlap(footprint, r.footprint, r.margin))) throw new Error(`Landmark conflicts with protected city parcel ${s.id}`);
    const baseY = cityElevation(p, (s.x1 + s.x2) / 2);
    if (!Number.isInteger(baseY)) throw new Error(`Parcel intersects urban transition ${s.id}`);
    const contract = p.districts.find(d => d.name === s.district);
    if (!contract || baseY < contract.elevation[0] || baseY > contract.elevation[1]) throw new Error(`Parcel violates district terrain contract ${s.id}`);
    structures.push(freezePlan({ ...s, baseY }));
  }
  const byChunk = new Map<string, Structure[]>();
  for (const s of structures) for (let cz = Math.floor((s.z1 - 3) / 16); cz <= Math.floor((s.z2 + 3) / 16); cz++)
    for (let cx = Math.floor((s.x1 - 3) / 16); cx <= Math.floor((s.x2 + 3) / 16); cx++) {
      const key = `${cx},${cz}`, list = byChunk.get(key) ?? []; list.push(s); byChunk.set(key, list);
    }
  return { ...original, structures, byChunk };
}
/** Contracts are geography-only: the metropolis plan supplies the architectural palettes and parcel rules. */
export function districtTerrain(p: MacroPlan, id: string) {
  const contract = p.districts.find(d => d.id === id);
  if (!contract) throw new Error(`Unknown district ${id}`);
  return { contract, terrain: terrainSuitability(p, contract.anchor.x, contract.anchor.z) };
}
