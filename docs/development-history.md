# Development History

This is the **single chronological engineering record** for Jade Harbor. It summarizes the major technical changes that shaped the released baseline.

This document records *how the baseline changed over time*. It does not repeat the current feature list, controls, architecture reference, test commands, or known limitations; those have dedicated documents linked from the repository README.

---

## 1. Playable voxel foundation

### Objective

Establish a browser voxel sandbox that was genuinely interactive before investing in visual identity or a larger progression layer.

### Work completed

- deterministic terrain and chunk generation;
- block placement and mining;
- first-person movement and collision;
- inventory and hotbar basics;
- local single-player state;
- Three.js rendering and a TypeScript/Vite project structure.

### Engineering outcome

The project had a real simulation to iterate on. Later work could therefore be evaluated through actual player actions rather than mock UI or isolated demos.

---

## 2. Chinatown identity overhaul

### Objective

Turn the generic voxel prototype into a recognizable product without discarding its working simulation.

### Work completed

- procedural Chinatown districts, streets, markets, lanterns, jade/terracotta roof language, and riverside areas;
- Panda Plaza and the large seated panda monument as a persistent city landmark;
- city-first world-generation rules that kept important streets and structures usable;
- branding consolidated around the name **Jade Harbor**.

### Decision that carried forward

The Chinatown city, Panda Plaza, and their visual language became protected baseline behavior. Future engineering work had to preserve them rather than treating world identity as disposable test content.

---

## 3. First-person interaction and presentation

### Problems found through play

The held-item viewmodel was technically functional but several tool and weapon orientations did not read correctly from the player camera. Experimental angle changes improved some items while making others worse.

### Changes

- standardized first-person held models across the active tool set;
- added orientation and shape regressions;
- stabilized pointer-lock/pause behavior around interaction state;
- rejected a later weapon-angle experiment and restored the previously accepted orientation.

### Engineering outcome

A visually accepted baseline was treated as a contract. “Newer” stopped meaning “automatically better,” and regression tests were used to protect presentation as well as mechanics.

---

## 4. Build integrity and reproducibility

### Problem

A playable `dist/` folder was not enough to prove that a release artifact matched the source that supposedly produced it.

### Changes

- introduced source-first release verification;
- added cryptographic input/output manifest checks;
- made packaging fail closed when a verified production build could not be proven;
- added release-integrity tests for tampering and stale output.

### Evidence boundary

When the execution environment could not reach the npm registry, the project recorded the build as blocked instead of manufacturing a “fresh build” claim.

---

## 5. Rendering and simulation performance

### Problems targeted

Dense city geometry made meshing and dirty-section work expensive, especially around visually complex Chinatown areas.

### Changes

- skipped fully buried opaque cube geometry;
- reduced avoidable dirty-section queue work;
- avoided empty GPU nodes;
- improved lighting invalidation behavior;
- reused stable sky-color state;
- added meshing and queue regressions.

### Engineering outcome

Measured CPU meshing work improved in the tested fixture. The result was kept as CPU evidence rather than being converted into an unsupported universal FPS claim.

---

## 6. Gameplay and game-mode reliability

### Problems found

- Creative flight could survive state transitions where it should not;
- safe-spawn logic could accept fluid-occupied space;
- switching modes could leave stale velocity, visibility, flight, or interaction state behind.

### Fixes

- validated and restored flight only for modes that permit it;
- tightened safe-spawn checks;
- added explicit mode-transition state resets;
- expanded regression coverage around inventory, combat, save, physics, UI, and pointer lock.

### Engineering outcome

Game modes became explicit permission/state machines instead of loosely related UI labels.

---

## 7. Item catalog and executable gameplay verification

### Objective

Verify that catalog entries represented usable gameplay rather than decorative names and icons.

### Work performed

- checked item IDs, categories, stack caps, icons, and recipes;
- executed manual-grid and recipe-book crafting;
- exercised furnace/brewing paths, armor, buckets, food, farming, tools, block placement, and mining;
- checked tool tier, durability, drops, and Creative-vs-Survival consumption rules.

### Representative fixes

- invalid armor-slot indices were rejected instead of passing through numeric edge cases;
- failed recipe transactions were made atomic;
- item/category presentation was corrected where it did not match gameplay behavior.

### Engineering outcome

Catalog truth became tied to executable state changes rather than registry presence alone.

---

## 8. Cross-system integration

### Objective

Test complete player flows that cross several subsystems instead of validating each system in isolation.

### Flows exercised

- raw resources through crafting into upgraded tools;
- mining through smelting into equipment, repair, and persistence;
- brewing through inventory into effect application;
- chest-to-hopper-to-furnace transfer with conservation checks;
- NPC trade through combat and entity death/drop handling;
- combined save snapshots spanning player, equipment, crafting, edits, machines, containers, NPCs, and drops.

### Bugs found

- a live-set iteration allowed falling sand to cascade multiple cells in one simulation update;
- several full/invalid transaction paths needed stronger all-or-nothing behavior;
- some mode transitions still retained state from the previous mode.

### Fixes

Simulation work was bounded, transaction failure paths were made atomic, and the reproduced failures were converted into permanent regressions.

---

## 9. Release-test infrastructure

### Objective

Make the QA pipeline itself trustworthy enough to distinguish a project defect from an execution-environment problem.

### Changes

- removed dependence on one fixed archive name and one fixed local port;
- added archive-structure verification that does not require browser automation;
- improved local-server readiness and cleanup behavior;
- made Python launcher handling more portable;
- kept browser/dependency blockers explicit rather than silently skipping them.

### Engineering outcome

A blocked external dependency was no longer easy to misreport as either gameplay success or gameplay failure.

---

## 10. Deep functional coverage

### Objective

Look for failures that ordinary unit tests often miss: authority leaks between modes, resource conservation under pressure, malformed persistence, and UI-to-simulation wiring.

### Additional methods

- randomized inventory operations with conservation invariants;
- transaction checks across crafting, smelting, brewing, trading, equipment, repair, and containers;
- permission matrices across game modes;
- malformed-save fuzzing;
- deterministic generation checks across multiple seeds;
- UI action-to-handler checks;
- production-build integrity checks.

### Bugs found and fixed

- Survival could mine water/lava directly instead of using bucket semantics;
- Spectator could still affect pickups, drops, pressure plates, and other player-triggered simulation;
- stored weather could fail to reconstruct correctly on load;
- malformed persisted state shapes could pass validation and reach runtime code.

### Engineering outcome

“Can this action be reached?” and “who is allowed to mutate this state?” became first-class verification questions.

---

## 11. Residual stability

### Objective

Attack lifecycle ordering, full-capacity behavior, and hostile/corrupted numeric state after the broader functional regression suite was already green.

### Bugs found and fixed

- dropped-item records with `stack: null` could survive validation and fail later during entity processing;
- fallback safe spawn did not always clear velocity;
- a spirit killed by a guard could still attack once later in the same tick;
- consuming an infusion could lose its returned empty flask when both inventory and drop capacity were full;
- malformed numeric settings could propagate `NaN`/`Infinity` into camera, fog, input, or audio calculations;
- malformed edit containers, invalid machine recipe IDs, and out-of-range pending simulation ticks needed stricter rejection.

### Engineering outcome

Persistence validation and resource-conservation rules were tightened around cases that were valid JavaScript values but invalid game states.

---

## 12. Adversarial verification

### Objective

Use a different failure model again: lazy state materialization, pathological persisted physics, canonical block encoding, and collision/occlusion semantics.

### Bugs found and fixed

- generated chest loot could disappear if a discovery chest was destroyed before its first UI open;
- extreme persisted velocity/knockback could create pathological physics subdivision and stall the main thread;
- malformed `simulation` root values could pass validation;
- packed/stateful Air could become an invisible occupied cell in code paths that expected canonical Air `0`;
- non-solid decorations could incorrectly block melee line of sight.

### Additional verification

Registry references were cross-checked across blocks, items, recipes, trades, smelting, and infusions. Deterministic generation was exercised across many seeds and chunk positions, then the broader regression chain was rerun after the fixes.

### Engineering outcome

The remaining high-value uncertainties were larger architecture or real-browser/hardware verification work rather than small correctness fixes. That was the stopping signal for feature expansion before release.

---

## 13. v1.0.0 public release preparation

### Objective

Convert the hardened engineering workspace into a clean public portfolio repository without changing gameplay behavior.

### Changes

- standardized player-facing product/version copy around `v1.0.0`;
- applied small accessibility and layout polish;
- refined the final world browser and pause/settings flows: local-save guidance is sticky and prominent, world actions are grouped into two compact bars, duplicate/delete operations expose an in-place processing state, settings can be reset to defaults, and pause actions use one clear full-width order;
- named regression files and scripts around their actual function;
- consolidated all engineering chronology into this document;
- separated current facts into dedicated feature, architecture, controls, persistence, testing, performance, and limitation references.

### Release constraint

Release preparation intentionally avoided broad gameplay refactors. The accepted Chinatown world, Panda Plaza, controls, first-person presentation, persistence semantics, and tested mechanics were treated as frozen behavior while the repository was prepared for public release.

---

## 14. v1.0.0 source hygiene and build validation

### Objective

Audit the already accepted `v1.0.0` codebase for maintainability problems that did not necessarily appear as gameplay defects, then make source and shipped presentation consistent without changing the release version or intended gameplay behavior.

### Problems found

- source and production CSS had diverged, leaving stale duplicate rules in the shipped bundle;
- same-scope CSS selectors and dead/redundant presentation rules had accumulated during iterative UI work;
- some UI construction and station rendering paths were harder to maintain than necessary;
- strict TypeScript compilation exposed narrow literal inference in reusable helpers and a dropped HUD payload field;
- test-only TypeScript/import assumptions could interfere with a clean production typecheck.

### Changes

- consolidated duplicate CSS blocks, removed dead/redundant rules, and synchronized canonical source styling with the shipped stylesheet;
- refactored UI and station construction into clearer named state/rendering paths while preserving DOM actions and gameplay semantics;
- reduced brittle global DOM lookup/string-replacement patterns and removed unused imports;
- restored and tightened affected TypeScript types rather than suppressing compiler diagnostics;
- corrected test fixture/module boundaries so production builds and test infrastructure do not depend on accidental path or Node-type behavior;
- added frontend/source-output hygiene regression checks to prevent the stale-style problem from returning;
- kept the package and lockfile at `1.0.0` because the work preserved the intended release scope and gameplay baseline.

### Engineering outcome

The public source became easier to inspect and rebuild while the accepted gameplay baseline remained unchanged. The work also reinforced an important release rule: passing runtime regressions is not sufficient by itself; a release candidate must also survive strict compilation and production-build integrity checks.

---

## 15. v1.0.0 combat stability

### Objective

Fix two player-visible combat issues found during final manual playtesting without expanding the release scope.

### Changes

- melee spirits now make immediate forward progress on locally traversable ground even when a strafing player repeatedly crosses voxel target cells; A* navigation remains the fallback around blocked terrain and city obstacles;
- added a regression that alternates the player across target cells and requires the hostile to continue closing distance instead of stalling in repeated replans;
- durability wear now reports when a held tool actually breaks, and successful combat shows an explicit break toast/sound rather than making the item appear to vanish without explanation;
- added regression coverage for the exact break transition and player feedback.

### Release constraint

These fixes are part of the initial `v1.0.0` baseline because they were completed before the public tag was created.



---

## 16. Engine reliability and persistence

### Objective

Treat persistence, recovery, edit durability, lifecycle cleanup and profiling as explicit engine contracts for the public `v1.0.0` baseline while preserving the accepted city and gameplay behavior.

### Findings

- the atomic multi-store transaction/checkpoint design was already sound and did not need replacement;
- dirty edited columns were only pinned during streaming when an eviction-save callback happened to be installed, coupling data durability to UI/game wiring;
- equivalent edit overlays could serialize in insertion order rather than one canonical order;
- save validation still allowed arbitrary extra object fields at several nested boundaries, which could persist unsupported state and make checksum traversal vulnerable to pathological/cyclic objects;
- checkpoint/chunk metadata validation was less strict than imported gameplay-state validation;
- the documented damaged-world reset path was contradictory: `resetSave()` first required a successful full `loadSave()`, so missing components/checkpoints could make reset impossible;
- disposed worlds left some pending/edit/callback structures populated until garbage collection.

### Changes

- made dirty-column eviction pinning unconditional at the `World` layer while retaining eviction-triggered save requests as an optimization;
- canonicalized dirty section keys and local voxel indices for deterministic delta/checksum representation;
- introduced strict schema allowlists and bounds across save/player/simulation/entity/body/vector/stack/effect/machine/checkpoint/component/chunk records;
- made validation operate on a clone so supported name/seed normalization cannot mutate the caller;
- guarded checksum traversal against cyclic/deep malformed state;
- validated checkpoint ownership, schema, revision, manifest and stored chunk metadata before reconstruction;
- made incremental writes require a valid prior checkpoint manifest;
- converted reset into an atomic full-replacement recovery transaction based on independently validated world metadata, allowing recovery from damaged components/checkpoints/chunks without a delete-first window;
- made IndexedDB upgrade bootstrap idempotent for existing stores/indexes;
- expanded `World.dispose()` to terminate/clear pending generation, tickets, edit buffers and callbacks;
- added a dependency-light engine-reliability regression gate and an informational persistence microprofile.

### Engineering outcome

This work did not replace working systems simply to increase architectural novelty. It tightened the failure boundaries around the existing atomic save model and made previously implicit assumptions executable invariants. These guarantees are part of the initial `v1.0.0` release baseline.
