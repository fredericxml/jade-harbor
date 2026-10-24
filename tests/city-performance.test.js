import { it, expect } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { World } from "../src/world/world";
import { meshChunk } from "../src/render/mesher";
import { Lighting } from "../src/world/lighting";
it("profiles a dense 97-chunk city neighborhood without a hardware-dependent FPS gate", () => {
  const world = new World("jade-harbor", {}, false),
    times = [];
  const start = performance.now();
  for (let z = -5; z <= 5; z++)
    for (let x = -5; x <= 5; x++)
      if (x * x + z * z <= 5.5 ** 2) {
        const t = performance.now();
        world.ensure(x, z, true);
        times.push(performance.now() - t);
      }
  const generation = performance.now() - start,
    lighting = new Lighting(world),
    lt = performance.now();
  lighting.rebuild();
  const lightMs = performance.now() - lt;
  let triangles = 0;
  const mt = performance.now();
  for (const c of world.chunks.values())
    for (const m of meshChunk(world, c, lighting))
      triangles += m.indices.length / 3;
  const result = {
    chunks: world.chunks.size,
    generationMs: Math.round(generation),
    generationMedianMs: +times
      .sort((a, b) => a - b)
      [Math.floor(times.length / 2)].toFixed(2),
    lightingMs: Math.round(lightMs),
    meshingMs: Math.round(performance.now() - mt),
    triangles,
  };
  mkdirSync("test-results", { recursive: true });
  writeFileSync(
    "test-results/city-performance.json",
    JSON.stringify(result, null, 2),
  );
  console.log("CITY_PERFORMANCE", result);
  expect(triangles).toBeGreaterThan(10000);
  expect(world.chunks.size).toBe(97);
}, 30000);
