# Jade Harbor v1.0.0 testing and verification

This document separates **executed evidence** from assumptions. Passing tests verify their named scope only.

## Release test layers

### TypeScript/unit tests

The Vitest suite covers core coordinates/world behavior, generation, inventory, persistence, navigation, progression, automation, mining integration, flight safety, hostile encounters, and city generation.

### Dependency-light regression tests

Additional Node-based tests exercise historical failure modes that deserve permanent coverage even when a browser is unavailable. These include:

- inventory conservation, overflow and transaction atomicity;
- combat targeting, line-of-sight, entity death/loot ordering and knockback;
- save ordering, malformed state rejection and chunk persistence;
- collision, chunk-border invalidation and physics edge cases;
- pointer-lock/pause state ordering and first-person viewmodel consistency;
- game-mode transitions and Spectator authority restrictions;
- catalog/recipe/item functionality and machine integration;
- deep persistence fuzzing and deterministic generation checks;
- generated chest loot, extreme persisted motion, canonical Air encoding and non-solid combat occlusion;
- persistence/lifecycle reliability invariants: canonical deltas, strict save-state allowlists, callback-independent dirty-column pinning, recovery wiring, lifecycle disposal and upgrade-safe IndexedDB bootstrap.

### Browser tests

The Playwright suites are designed to exercise real UI/input paths for core gameplay, city/persistence, progression stations, automation, flight and production output. Development-only fixtures can prepare deterministic states; production does not expose the development hook.

### Release integrity

A fresh production build writes a cryptographic manifest of source/build inputs and `dist/` outputs. `npm run verify:dist` fails closed if the bundle was not produced by the release build or if source/output changed afterward.

## Commands

```bash
npm ci
npm run test:release
npm test
npm run test:release-integrity
npm run test:reliability
npm run profile:reliability
npm run verify:dist
```

`npm run test:release` starts by creating a fresh production build, so these release checks also work from a fresh clone where the ignored `dist/` directory does not exist yet.

Browser QA:

```bash
npx playwright install chromium
npm run test:browser
npm run test:city
npm run test:progression
npm run test:automation
npm run test:flight
npm run test:production
```

## What prior gameplay verification exercised

Existing browser/regression evidence covers keyboard movement, mouse mining/placement, Creative catalog selection, item pickup, crafting, kiln processing, NPC trade, food, armor/equipment, death/respawn, saved reloads, Chinatown generation, Panda Plaza, chunk-edge edits, repeated streaming, negative-coordinate edits, save failure/retry paths, station interactions, potion effects, hopper/kiln automation, timer/plate behavior and source buckets.

## Evidence boundaries

- Test fixtures do not prove a completely unassisted long-form Survival campaign from a blank world.
- Software-rendered browser measurements must not be advertised as universal hardware FPS.
- Browser/GPU/context-loss behavior should be rechecked on the actual deployment target.
- No test suite proves the absence of all bugs.

## v1.0.0 release verification

Release verification exercises the dependency-light regression suites covering inventory, combat, save validation, physics/chunks, pointer lock, viewmodel behavior, gameplay modes, catalog behavior, cross-system flows, world simulation, meshing/queue behavior, and deep functional/integrity cases. Additional checks cover branding/copy, TypeScript syntax, asset linkage, and release-integrity metadata.

The dedicated engine-reliability regression contains **9 checks** for deterministic persistence, strict validation, dirty-edit pinning, recovery wiring, lifecycle disposal, and upgrade-safe IndexedDB bootstrap. The informational persistence CPU sample is recorded in `performance.md`.

Production `dist/` is generated output and is not committed to the `main` branch. Release tests validate build structure, asset linkage and integrity rather than depending on minifier-specific bundle text or implementation identifier names.

The final public-release gate is:

```bash
npm ci
npm run test:release
npm run verify:dist
```

Only a zero exit status from these commands should be treated as approval to publish the newly generated `dist/` to the deployment branch. Browser smoke testing on the actual GitHub Pages URL remains the final operational check before tagging `v1.0.0`.
