# Testing and release verification

This document summarizes the quality checks recorded for Jade Harbor `2.0.0`. It distinguishes executable automated checks, browser observations, and release-archive validation. A passing result applies only to the stated scope and environment.

## Verification approach

The repository uses several complementary layers:

- **Unit and deterministic tests** for world generation, compatibility, geometry, simulation, navigation, persistence, inventory, crafting, combat, and state validation.
- **Regression tests** for previously reproduced failures, resource conservation, mode permissions, chunk/worker lifecycle, and cross-system interactions.
- **Browser tests** for actual UI actions, movement, Travel Journal journeys, visible resident activity, atmosphere, distant rendering, and production behavior.
- **Release checks** for TypeScript, copy/branding, source hygiene, production output, cryptographic integrity, and archive structure.

## Reproducible commands

Run from the repository root after `npm ci`:

```bash
npm test
npm run test:release
```

Focused checks include:

```bash
npm run test:world
npm run test:regional-world
npm run test:architectural-richness
npm run test:final-presentation
npm run test:travel-journal
npm run test:urban-life:browser
npm run test:urban-fabric:browser
npm run test:presentation-matrix
npm run test:world-integration
npm run test:production
```

Browser suites require Playwright and an installed Chromium browser. They write temporary output under `test-results/`, not into product documentation. After creating the curated archive, validate it with `npm run test:archive-structure -- /absolute/path/JadeHarbor_v2.0.0_Source_and_Dist.zip`.

## Recorded release validation

The final release record documents the following results:

| Area | Recorded result |
|---|---|
| Source verification | 328 source cases passed across the final source suite |
| Release integrity | All nine integrity checks passed |
| Production smoke checks | All six extracted-production checks passed |
| Distribution verification | 98 source/build inputs and six production outputs verified |
| Curated repository archive | 232 entries; CRC, safe paths, required inventory, and source/distribution parity passed |
| World compatibility | Generators 3–10 remain reconstructible; new worlds use generator 10 |
| City presentation | A 97-view matrix covered districts, landmarks, regions, weather, day/night, high views, and distant transitions; every captured view was reviewed |
| Travel Journal | 72 successful actual UI trips across 18 hubs and two seeds; median preparation 281.7 ms, p95 506.0 ms, maximum 529.7 ms in the primary matrix |
| Resident activity | Seven stationary observations totaling 450 real seconds; minimum purposeful moving/acting sample ratio 66.7%, actor-sample-weighted ratio 85.0% |
| Streaming and integration | A 54-trip integration repeat, cancellation/replacement checks, save/export/import, world switching, and resource disposal checks passed |

The expanded 54-trip repeat recorded a 1,466.3 ms maximum preparation observation. It remained below the three-second request deadline, but the longer tail is retained here rather than being presented as a universal sub-second guarantee.

## World and gameplay coverage

The recorded checks cover:

- all ten districts and Panda Plaza;
- eight landmark programs and five regional destinations;
- 33 discoveries and 18 area hubs in current worlds;
- resident identity preservation, the 4,080-entry registry, and the 96-active detailed simulation limit;
- safe travel arrival, cancellation, edited-world preservation, and normal-mode discovery unlocks;
- day/night, rain, caves, elevated builds, and distant skyline presentation;
- generator compatibility, world copies, save/load, reset/recovery, and import/export;
- inventory, crafting, processing, brewing, combat, automation, and cross-system resource conservation.

## Archive and production verification

The curated source-and-production archive includes the complete source, tests, scripts, documentation, public assets, and verified `dist/`. The recorded archive contains 231 entries and passed CRC, unique/safe path, required-file inventory, source/distribution parity, and extracted-production checks.

`docs/proof/` is excluded from the curated downloadable archive. This packaging rule does not remove the folder from a working directory or automatically ignore it in Git. Temporary screenshots, traces, raw profiles, logs, dependencies, and test output are not required to run the game.

## Evidence boundaries

The recorded browser environment used Chromium with ANGLE SwiftShader software rendering. These observations are useful for repeatable CPU/render-path comparisons but do not certify physical-GPU frame rate. A target machine should be tested with its actual browser, renderer, resolution, and graphics hardware.

Visual review covers the stated camera positions and conditions; it does not prove that every arbitrary seed, player edit, decorative attachment, or interior is visually perfect. Distant terrain is approximate and full-detail rendering remains finite. See [performance](performance.md) and [known limitations](known-limitations.md) for details.

The results above are the recorded release-verification results. Any source or build change after those checks should be followed by a fresh local release run before publishing.
