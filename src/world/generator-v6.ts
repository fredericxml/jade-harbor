import { VoxelWriter } from "./city/writer";
import { createV5Generator } from "./generator-v5";
import { createRealizationPlan } from "./landmarks/plan";
import { drawLandmarks, landmarkAt } from "./landmarks/builders";

/** V5 is an immutable base. New monuments and their local approaches are a v6
 * composition, applied before World overlays and through the same worker path. */
export function createV6Generator(seed: string) {
  const started = performance.now(), base = createV5Generator(seed);
  const realization = createRealizationPlan(base.plan, base.landmarks, base.metropolis);
  const planMs = performance.now() - started;
  return { ...base, version: 6 as const, realization, planMs,
    inspect(x: number, z: number) {
      const site = landmarkAt(realization, x, z);
      return { ...base.inspect(x, z), generator: 6, planMs, landmark: site?.name,
        realizedReservation: site?.reservation.id, landmarkPlans: 1 };
    },
    generate(cx: number, cz: number) {
      const data = base.generate(cx, cz);
      drawLandmarks(new VoxelWriter(data, cx * 16, cz * 16), base.plan, realization, cx, cz);
      data.compact(); return data;
    },
  };
}
