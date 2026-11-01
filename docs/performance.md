# Graphics performance

Jade Harbor `2.0.1` adds three graphics presets and reduces several avoidable rendering costs while preserving the generator-10 world, resident population, gameplay simulation, and save format.

## Graphics presets

| Setting | Low | Medium (default) | High |
|---|---:|---:|---:|
| Render scale | 0.70 | 0.88 | 1.00 |
| Device-pixel-ratio cap | 1.00 | 1.25 | 1.60 |
| Terrain sample step | 48 blocks | 32 blocks | 16 blocks |
| Selected crown buildings per district | 1 | 2 | 4 |
| Full / mid resident render range | 16 / 32 m | 24 / 48 m | 960 / 960 m |
| Distant pose cadence | 8 Hz | 15 Hz | 60 Hz |
| Rain points | 90 | 180 | 300 |
| Instanced clouds | 16 | 22 | 28 |

High preserves the established `2.0.0` presentation. Medium is the default for new users and for older settings that do not contain a graphics-quality value. Low and Medium reduce render resolution, selected far-body detail, distant pose cadence, and secondary atmospheric density. All three presets retain the same buildings, landmarks, residents, world data, AI schedules, navigation limits, and gameplay simulation. CSS UI dimensions, camera field of view, pointer mapping, input sensitivity, and selection rays are independent of the render backbuffer scale.

F3 displays the selected preset, render scale, effective DPR, CSS-to-backbuffer dimensions, WebGL version, and available renderer/vendor diagnostics. Browser privacy restrictions may hide the unmasked renderer identity. A software-renderer hint is diagnostic only; it does not prove that hardware acceleration is disabled.

## What changed

- Distant terrain and skyline geometry use preallocated typed arrays and a shared cube template. Flat normals and bounds are accumulated as geometry is written, avoiding a large final array conversion and whole-mesh finalization pass.
- Distant construction yields between terrain rows and small proxy batches instead of processing the complete proxy set in one uninterrupted update.
- Resident rendering checks the existing active set, conservatively culls offscreen actors, reuses temporary containers, and uploads only used instance ranges. The simulation active set is unchanged.
- Particle compaction reuses its array; rain draw counts scale with the selected preset.
- The section mesh queue caches parsed signed-height keys, skips empty scans, and avoids unnecessary topology-revision changes.
- Drawing-buffer resizing is deferred until the next render and repeated settings changes are coalesced into one native resize.

The renderer keeps the existing mesh budgets, world-generation ownership, resident simulation, and navigation limits. The old distant graph remains visible until its replacement is complete; abandoned replacement work is disposed safely.

## Measured results

### Test environment and method

The matched browser measurements used Linux, Node 24.22.1, Chromium 141.0.7390.37, WebGL2, and ANGLE Vulkan SwiftShader software rendering. No physical integrated or discrete GPU was available for this measurement. The results must not be interpreted as desktop-GPU FPS.

Ten fixed views were measured at view distances 3, 5, and 8, with simulation distance 4, a 960 × 600 viewport, DPR 1, and the `jade-harbor` seed. The baseline used the `2.0.0` presentation; the current build was measured at High, Medium, and Low. Each window ran the ordinary simulation for 12 seconds after equivalent scene preparation and a 1.5-second settling period. The complete matrix contains 30 baseline and 90 current windows. These are prepared live-view samples, not a cold-start or uninterrupted travel benchmark.

The table shows the median of the ten per-view frame-interval summaries at each view distance. Values are milliseconds; lower is better. They are frame intervals, not average FPS.

| View distance | 2.0.0 p50 / p95 | 2.0.1 High p50 / p95 | Medium p50 / p95 | Low p50 / p95 |
|---|---:|---:|---:|---:|
| 3 | 91.7 / 208.4 | 91.7 / 200.0 | 66.7 / 166.6 | 50.0 / 133.3 |
| 5 | 133.3 / 233.4 | 141.4 / 250.0 | 100.0 / 225.0 | 83.2 / 191.7 |
| 8 | 200.0 / 358.4 | 200.0 / 333.3 | 191.6 / 308.3 | 166.6 / 316.6 |

At the default view distance of 5, High is broadly similar to the baseline rather than uniformly faster. Medium and Low reduce the median frame interval in this software-renderer test, but maximum view distance remains expensive. Individual p95 values vary by scene and are not monotonic across presets.

### Distant construction

| CPU construction statistic | 2.0.0 High | 2.0.1 High | 2.0.1 Medium | 2.0.1 Low |
|---|---:|---:|---:|---:|
| Median largest update | 23.8 ms | 2.4 ms | 1.2 ms | 0.7 ms |
| Worst update | 35.0 ms | 3.5 ms | 1.9 ms | 1.1 ms |
| Median build CPU sum | 79.8 ms | 33.3 ms | 9.0 ms | 4.7 ms |
| Worst constructor, including plan | 18.3 ms | 14.7 ms | 3.1 ms | 2.7 ms |

A separate matched browser comparison reduced the worst distant-build slice from 60.9 ms to 9.9 ms. Measured build slices above 50 ms fell from 4 of 30 baseline windows to 0 of 90 current windows. These results show a substantial improvement to the distant-geometry construction path. They do not guarantee that every frame remains below a fixed time budget; JIT, allocation, garbage collection, WebGL uploads, lighting, and voxel meshing can still create stalls.

### Native drawing-buffer resize

Repeated graphics changes are coalesced: eighteen same-turn changes produce one native drawing-buffer resize. The settings handler remains short, and the final requested profile is applied at the next draw. Native software-WebGL surface allocation can still stall: the full DPR2 stress test recorded a 525.1 ms native resize. This is a software-driver synchronization limitation, distinct from the reduced distant-geometry construction cost.

## Validate on a desktop PC

For a meaningful hardware comparison:

1. Use the same browser and window size for all presets.
2. Set View Distance to 5 and Simulation Distance to 4.
3. Open F3 and record the renderer identity, effective DPR, and backbuffer size.
4. At Panda Plaza and the Market, let streaming settle before sampling.
5. Observe High, Medium, and Low for at least 60 seconds from the same camera, time, and weather.
6. Compare FPS alongside frame p50/p95, tick/mesh/distant p95, largest build slice, draw calls, triangles, loaded columns, and pending/dirty queues.
7. Repeat in rain and from an elevated viewpoint if those scenes matter to the intended use.

Low is intended to improve playability on suitable modern integrated graphics. A 40+ FPS result is a target for real-machine validation, not a universal promise or a result certified by the included software-renderer measurements.

## Reproduce the measurements

After `npm ci` and `npx playwright install chromium`:

```bash
npm run build
npm run test:graphics-quality
npm run test:graphics-quality:browser
npm run profile:graphics-quality
npm run profile:distant-rendering
```

Run browser and CPU profilers serially. The live profile writes captures and raw measurements to `test-results/`, which is not part of the release archive. Optional environment variables can select subsets for diagnosis; a partial run must not be described as the complete matrix.

## Remaining costs

Voxel meshing is still primarily main-thread work, and one busy section remains indivisible. Lighting, large edits, cold world planning, browser allocation/GC, GPU uploads, and native WebGL surface synchronization can still cause frame-time spikes. The distant rendering layer is an approximate visual cache; it does not replace nearby full-detail voxel chunks. See [known limitations](known-limitations.md) and [distant world rendering](distant-world.md).
