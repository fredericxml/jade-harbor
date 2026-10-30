# Performance and measurement

Jade Harbor `2.0.0` is designed around bounded world generation, chunk streaming, local simulation, and render-only distant scenery. Performance depends strongly on browser, GPU, resolution, driver, and the density of the current view. The measurements below are engineering observations, not universal frame-rate promises.

## Measurement environment

The recorded browser performance runs used Linux, Chromium 141, and ANGLE SwiftShader software rendering. This is a software renderer, not a physical desktop GPU. Frame intervals are not GPU execution times, and results must not be extrapolated directly to Intel, AMD, or NVIDIA hardware.

F3 exposes rolling frame interval p50/p95, simulation tick p95, loaded columns, pending generation, dirty section queues, triangles, draw calls, renderer geometry count, entity count, pinned unsaved columns, and approximate CPU block-buffer memory. The memory figure excludes JavaScript object overhead, light maps, and GPU/driver storage.

For a target-machine comparison, record the browser/version, GPU renderer, viewport, device pixel ratio, seed, view distance, simulation distance, and preset settings. Use the same seed, camera, time, weather, and viewport for each comparison. Allow streaming to settle, then observe each location for at least 60 seconds.

## Bounded rendering and simulation

| System | Current bound or behavior |
|---|---|
| Voxel section | 16×16×16 blocks; empty sections allocate no block buffer and uniform sections use one scalar |
| Detailed player view | Nine-section player window, with up to five additional surface sections for elevated views |
| Distant terrain | 16-block sample grid, up to 128×128 cells, approximately 25,724 terrain triangles in the default plan |
| Distant skyline anchors | Selected render-only building silhouettes; default plan uses up to 1,111 boxes / 13,332 triangles |
| Distant resource ownership | Two geometries, one material, one coverage texture, and two mesh draws; the graph is reused across ordinary travel |
| Distant range | 720-block distant radius; camera far plane 960; sky radius 800; 24-block near exclusion |
| Clouds and rain | 28 clouds in one instanced draw; rain is one capped 300-point batch |
| Resident detail | 4,080 persistent identities; at most 96 detailed active residents |
| Navigation | Bounded local search and a shared 96-expanded-node / nominal 2 ms tick budget |
| Travel | Collision-checked local arrival search; request deadline is three seconds including save preparation |

These are implementation bounds, not guarantees that every frame completes within a fixed time. A busy section mesh, lighting scan, or final distant-buffer construction can still be indivisible.

## Representative software-renderer observations

The final eight-scene presentation comparison used Chromium/SwiftShader at 960×600. Each view ran for twenty real seconds after the rolling metrics were reset. The table reports frame-interval p50/p95 in milliseconds for the current release; it is not a physical-GPU benchmark.

| View | Frame p50 / p95 (ms) |
|---|---:|
| Panda Plaza, day | 50.0 / 133.3 |
| Panda Plaza, night | 66.6 / 150.1 |
| Market, day | 116.6 / 233.4 |
| Harbor, rain | 83.4 / 216.6 |
| Water Town, night | 83.4 / 216.6 |
| Imperial Quarter, sunset | 83.3 / 183.3 |
| Ridge, elevated view | 33.4 / 149.9 |
| City, elevated view | 50.0 / 133.3 |

The current renderer submits more useful terrain and skyline geometry in high views than the earlier city-only renderer. That additional presentation has a measurable cost in the software-renderer environment. The result should not be described as a universal FPS improvement or regression on physical GPUs.

The 97-view prepared presentation matrix observed peaks of 423,930 submitted world triangles, 443 world draws, 787 renderer geometries, two textures, and 291 retained columns, with zero pending requests in prepared snapshots and no more than 96 detailed residents. These are observed matrix peaks, not steady-state memory ceilings.

## Distant-world construction and stutter

The distant representation is built incrementally, then reused across ordinary travel. Stable distant-update CPU cost during a rain/rapid-turn streaming observation was approximately 2.1 ms p50 / 3.6 ms p95.

Construction is a different cost from steady-state updating. Recorded observations include:

- one prepared presentation matrix: 155.4 ms accumulated build CPU, with a 48.1 ms largest slice;
- a separate maximum-distance rain traversal: 58.2 ms largest slice;
- an expanded rain/rapid-turn reconstruction observation: 333.1 ms accumulated build CPU, with a **141.2 ms largest slice**.

The largest slice comes from final buffer construction/normal calculation that remains indivisible. It can cause a noticeable one-time hitch during world reconstruction or first distant-scene creation. Ordinary travel reuses the completed distant graph and does not rebuild it on the travel critical path. This is a documented limitation, not a hard two-millisecond frame guarantee.

## Travel and resident activity

The primary Travel Journal matrix covered all 18 hubs on two seeds in Creative and Spectator modes: 72 successful actual UI trips. Preparation measured 281.7 ms median, 506.0 ms p95, and 529.7 ms maximum in that matrix. An expanded 54-trip integration repeat recorded a 1,466.3 ms maximum; the three-second request deadline remained unchanged.

A seven-view resident-activity observation ran for 450 real seconds. The minimum moving/acting sample ratio was 66.7%, and the actor-sample-weighted ratio was 85.0%. The registry remains 4,080 persistent residents, with detailed activity bounded to 96 active residents. These figures describe the selected views and schedules, not a guarantee that every camera angle always shows the same number of residents.

## Persistence microprofile

A seven-sample Node v22.16.0 Linux x86_64 engineering run measured approximately:

| Operation | Median observation |
|---|---:|
| Validate a save containing 50,000 edits | 90 ms |
| Encode 50,000 edits into canonical chunk deltas | 81 ms |
| Checksum the resulting chunk payloads | 7 ms |
| Capture one fully edited 16×16×16 section | 2.7 ms |

These are CPU point samples, not browser frame times. Ordinary incremental saves encode dirty sections rather than re-encoding the entire edit overlay.

## Historical baseline

The original `1.0.0` deterministic CPU benchmark generated 97 city columns in 1,221 ms, rebuilt full-column lighting in 1,500 ms, and generated exposed-face meshes in 3,287 ms, with 1,353,746 triangles. The benchmark includes full vertical columns, including geometry normally deferred by the browser renderer. It is a historical CPU reference, not a GPU or sustained-frame benchmark.

## Practical interpretation

- The engine bounds chunk, entity, navigation, and distant-resource ownership, but individual CPU operations can still exceed a frame budget.
- Software-renderer frame times are not representative of a hardware-accelerated desktop by default.
- Lower view distance reduces the amount of detailed world submitted; it does not change the stored world or resident registry.
- Travel preparation latency is separate from the time required for background meshes and local detail to settle.
- No universal 40 FPS or 60 FPS guarantee is made. Measure on the actual target PC.

See [known limitations](known-limitations.md) and [testing results](quality-assurance.md) for the related product and verification boundaries.
