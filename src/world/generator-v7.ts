import { createV6Generator } from "./generator-v6";
import { VoxelWriter } from "./city/writer";
import { createDensityPlan, drawDensity } from "./metropolis/density";
import { urbanAt } from "./metropolis/plan";

/** Additive density version. V3–v6 remain byte-stable for existing saves. */
export function createV7Generator(seed: string) {
  const started = performance.now(), base = createV6Generator(seed);
  const density = createDensityPlan(base.plan, base.landmarks, base.realization, base.metropolis);
  const planMs = performance.now() - started;
  return { ...base, version: 7 as const, density, metropolis: density.urban, city: density.urban.residentCity, planMs,
    inspect(x: number, z: number) { const a = urbanAt(density.urban, x, z); return { ...base.inspect(x, z), generator: 7, planMs, district: a.district?.name, lot: a.lot?.id, infill: a.lot?.id.startsWith("v7:") ?? false }; },
    generate(cx: number, cz: number) { const data = base.generate(cx, cz); drawDensity(new VoxelWriter(data, cx * 16, cz * 16), base.plan, density, cx, cz); data.compact(); return data; },
  };
}
