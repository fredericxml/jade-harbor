# Testing and release verification

This document summarizes the verification recorded for Jade Harbor `2.0.1`. A passing result applies only to the stated scope and environment; it is not a claim that every possible state or hardware configuration has been tested.

## Verification approach

The repository uses complementary checks:

- **Unit and deterministic tests** for world generation, generator compatibility, geometry, simulation, navigation, persistence, inventory, crafting, combat, and state validation.
- **Regression tests** for reproduced failures, resource conservation, game-mode permissions, chunk/worker lifecycle, and cross-system interactions.
- **Browser tests** for actual UI actions, movement, Travel Journal journeys, visible resident activity, atmosphere, distant rendering, graphics settings, and production behavior.
- **Release checks** for TypeScript, documentation links, copy/branding, source hygiene, production output, cryptographic integrity, and archive structure.

## Reproducible commands

Run from the repository root after `npm ci`:

```bash
npm test
npm run test:release
npm run test:release-integrity
npm run verify:dist
npm run test:docs
```

Focused checks include:

```bash
npm run test:world
npm run test:regional-world
npm run test:generator-v10
npm run test:city-life
npm run test:urban-density
npm run test:urban-fabric
npm run test:world-presentation
npm run test:graphics-quality
npm run test:graphics-quality:browser
npm run test:city-presentation
npm run test:world-exploration:browser
npm run test:production
```

Browser suites require Playwright and an installed Chromium browser. They write temporary output under `test-results/`. The curated release archive excludes this generated output.

## Recorded verification

The final 2.0.1 source and browser verification recorded the following results:

| Area | Result |
|---|---|
| Source suite | **351 cases passed** across world, gameplay, persistence, rendering, and graphics-quality coverage |
| Release-integrity tests | **9 passed, 0 failed** |
| Production smoke checks | **7 passed**, including graphics preset/backbuffer behavior, WebGL2, world creation, catalog interaction, and saved-world reload |
| Graphics functional checks | **11 browser checks passed**; deterministic 120-tick gameplay state matched across Low, Medium, and High |
| Matched live performance matrix | **30 baseline and 90 current windows** across ten views, three view distances, and three quality presets |
| City presentation review | **97 scene views** reviewed across districts, landmarks, regions, weather, time of day, and elevated viewpoints |
| Travel Journal review | **72 paired captures** across two seeds and 18 area hubs, plus mobile layout review |
| Exploration integration | **54 actual UI trips** with cancellation, saved edits, import/export, older worlds, flight, caves, context restoration, and renderer diagnostics |
| Distribution integrity | **99 application inputs and 6 production outputs** verified by the release manifest |

The source suite, live performance matrix, browser checks, and visual review were completed against the final 2.0.1 application inputs. Measurements were run serially to avoid overlapping browser and profiler workloads. The later release curation changed documentation, test/tool names, packaging rules, and source comments only; gameplay and rendering logic were left unchanged.

## World and gameplay coverage

The recorded checks cover:

- all ten districts and Panda Plaza;
- eight landmark programs and five regional destinations;
- 33 discoveries grouped into 18 area hubs;
- the 4,080-resident registry and 96-active detailed simulation limit;
- safe travel arrival, cancellation, edited-world preservation, and normal-mode discovery unlocks;
- day/night, rain, caves, elevated views, and distant skyline presentation;
- generator compatibility, explicit updated-city copies, save/load, reset/recovery, and import/export;
- inventory, crafting, processing, brewing, combat, automation, and cross-system resource conservation;
- graphics preset changes, drawing-buffer sizing, renderer diagnostics, resource replacement, and context restoration.

## Release archive and production verification

The release archive contains the source, tests, scripts, documentation, public assets, license notices, and verified `dist/`. It is checked for CRC integrity, unique and safe paths, required files, distribution asset references, generation worker presence, and exclusion of dependencies, caches, temporary results, temporary logs, traces, and raw measurement files.

The extracted production build is served through an ordinary static HTTP server. Browser smoke checks verify the built application rather than relying on the development server or a development-only hook.

## Evidence boundaries

The recorded browser environment used Chromium with ANGLE SwiftShader software rendering. These observations support repeatable CPU/render-path comparisons but do not certify physical-GPU frame rate. Test the target machine with its actual browser, renderer, resolution, and graphics hardware before making a hardware-specific performance claim.

Visual review covers the stated camera positions and conditions; it does not prove that every arbitrary seed, player edit, decorative attachment, or interior is visually perfect. Distant terrain is approximate and full-detail rendering remains finite. See [performance](performance.md) and [known limitations](known-limitations.md) for details.

The results above are the recorded release-verification results. Any application source or production-build change after those checks should be followed by a fresh local release run before publishing.
