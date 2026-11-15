# Build, testing and release verification

Jade Harbor **2.1.0** is maintained as one product version. Test suites are organized by **subsystem**, not by the chronological order of development work. The release process below is the single authoritative path to a production distribution.

## Requirements

- Node.js 22+ and npm with registry access.
- Python 3 to package the verified distribution.
- A WebGL2 browser for browser acceptance. Physical-device testing is required to establish actual FPS and compatibility.

## One release process

```bash
npm ci
npm run test:release
npm run package:verified
```

`test:release` starts with a clean TypeScript/production build, runs the complete release verification chain, validates input/source integrity and fails if anything is missing. `package:verified` validates the build again and packages only the verified output. Never reuse an older `dist/` or edit generated bundles.

## Test suites

| Command | Scope |
|---|---|
| `npm run test:source` | Product identity, public history/docs, suite reachability, English UI copy, source syntax and branding |
| `npm test` | Full Vitest unit and TypeScript test suite |
| `npm run test:engine` | Inventory, save durability, physics, interactions, lifecycle and game modes |
| `npm run test:world` | Worker streaming, chunk coverage, queue limits, edits and eviction |
| `npm run test:simulation` | Residents, navigation, AI scheduling, timers and simulation hot paths |
| `npm run test:rendering` | Meshing, water, transparency, distant world, lighting, frame pacing and renderer correctness |
| `npm run test:ui` | Mobile layout, UI behavior, controls and copy |
| `npm run test:performance` | Deterministic source-level geometry/CPU regressions and streaming stability |
| `npm run test:browser:full` | Full available browser acceptance including native traversal and quality profiles |
| `npm run test:benchmarks:browser` | Optional extended profiling; not a substitute for product acceptance |
| `npm run test:regression` | Combined source, engine, world, simulation, rendering, UI, unit and browser checks |
| `npm run test:release-integrity` | Production manifest and tamper protection |
| `npm run verify:dist` | Fresh output/content verification |

`npm run test:soak` performs a longer browser session (`SOAK_MINUTES=20 npm run test:soak`), and `npm run test:engines` checks supported browser engines. Review the same city/water/NPC scenes in Low, Medium and High and record FPS percentiles, memory trends, context-loss behavior, and save/export/reload on target hardware. Browser checks without working dependencies are **not passed** merely because a source suite succeeds.

## Source-only packages

A source-only ZIP may be distributed for code review. It intentionally excludes `node_modules/` and `dist/` and **does not certify a production build**. Hardware FPS depends on the actual browser and renderer: software WebGL2 may be slow, and WebGL1-only systems are not supported by a separate renderer.

See [development history](development-history.md), [feature matrix](feature-matrix.md), [testing results](testing-results.md) and [known limitations](known-limitations.md) for durable product references.
