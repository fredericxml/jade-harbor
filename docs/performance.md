# Performance measurement

Primary execution environment: Linux, Node 24.19, Chromium 141 with ANGLE SwiftShader software rendering. Desktop hardware GPU performance and a universal 60 FPS target are **NOT VERIFIED**.

F3 exposes measured rolling frame interval p50/p95, simulation tick p95, loaded columns, pending generation, section mesh queue, triangles/draw calls, renderer geometry count, entity count, pinned unsaved columns and approximate CPU block-buffer memory. The latter excludes JavaScript object overhead, light maps and GPU memory. Frame intervals are not GPU execution times.

Meshing is scoped to 16³ sections and budgeted per frame. Near sections are prioritized; geometry more than four sections vertically away is deferred until the player approaches. Logical columns and saved edits remain available. Render and simulation distance are separate settings. Empty sections allocate no block buffer; uniform sections use one value. Individual busy sections and lighting seed scans can still exceed their nominal frame budget.

Reproduce on real hardware: record browser/version/GPU, seed `jade-harbor`, view distance 5 and simulation distance 4. At Main Street (0,21,24), Panda Plaza (0,27,-20), market (-176,24,-144) and residential street (-144,25,28), wait for streaming then record F3 for 60 seconds. Fly to four cardinal points 300 blocks away and back three times; compare geometry count, frame percentiles and browser memory after each return. Repeat with view distance 3 and 8. Do not extrapolate SwiftShader FPS to desktop GPUs.

Current verification boundaries are recorded in `testing-results.md` and `known-limitations.md`. Historical point samples are retained here only as engineering evidence, not as hardware promises.

## Measured sample

The final deterministic CPU benchmark generated 97 city columns in 1,221 ms (median 11.28 ms/column), rebuilt full-column lighting in 1,500 ms and all exposed-face meshes in 3,287 ms, with 1,353,746 triangles. This synchronous test deliberately includes underground geometry outside the renderer’s usual vertical band; it is not a browser-frame measurement or a GPU benchmark. Individual runs vary with machine load.

The core browser regression reported one end-of-scenario software-renderer sample of 6 FPS, 17 columns, 3,542 rendered triangles and 55 draw calls. This is one fixture view, not a representative average or a hardware recommendation. Current visual-view observations are recorded separately.

At 1280×800 with render distance 3, the latest direct visual captures sampled 8 FPS at the Chinatown gate, 15 FPS at Panda Plaza and 5 FPS in the deep mine. These are point samples, not averages. An earlier distance-5 visual run timed out at its 90-second fully-idle readiness gate; the distance-3 measurement does not establish distance-5 sustained performance. These point samples were captured during development and should be re-measured on the deployment machine for any performance claim.


## Persistence reliability microprofile

`npm run profile:reliability` profiles save/edit primitives separately from rendering. One seven-sample Node v22.16.0 Linux x86_64 engineering run measured approximately 90 ms to validate a 50,000-edit save, 81 ms to encode those edits into canonical section deltas, 7 ms to checksum the resulting chunk payloads, and 2.7 ms to capture one fully edited 16×16×16 section. These are informational CPU point samples, not browser or hardware promises. Normal autosaves encode only dirty sections rather than the full 50,000-edit overlay.
