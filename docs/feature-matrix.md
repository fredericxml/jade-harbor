# Feature matrix

This document describes the capabilities and boundaries of the `2.0.0` release. **Verified** means that automated, browser, or production evidence exists for the stated scope; it does not imply that every possible seed, device, or user-created world state has been tested.

## Current release capabilities

| Area | Status | Release scope |
|---|---|---|
| Chinatown world identity | Verified | Dense procedural city, ten districts, lantern and roof language, editable Panda Plaza, streets, markets, courtyards, canals, and waterfronts |
| World generation | Verified | Deterministic terrain and city generation, signed coordinates, sparse vertical sections, caves, deep mine, and chunk streaming |
| Building and mining | Verified | Placement, mining, tool tiers, durability, collision-aware interaction, and chunk-boundary edits |
| Game modes | Verified | Survival, Adventure, Hardcore, Creative, Spectator, mode-specific permissions, and safe transitions |
| Inventory and containers | Verified | 36-slot inventory, hotbar, stack limits, drag/split/transfer behavior, and persistent containers |
| Crafting and processing | Verified | Manual grid, recipe book, kiln/furnace processing, repair, and inscription modifiers |
| Brewing and effects | Verified | Seven infusion recipes, timed effects, resource validation, and persistence |
| Survival systems | Verified | Health, hunger, breath, food, farming, tools, armor, death/respawn, and hostile encounters |
| NPCs and trading | Implemented | Persistent professions, home/work identity, bounded navigation, guards, merchants, and item exchange; no full production economy |
| Automation | Verified subset | Switches, wire, lamps, doors, timers, pressure plates, hoppers, and kiln pipelines |
| Fluids | Verified subset | Source water/lava placement and collection, bounded scheduled simulation, and mixing behavior; not full reference-game fluid fidelity |
| Persistence | Verified | IndexedDB worlds, validated import/export, player/world/container/entity/machine/simulation state, checkpoint integrity, and recovery validation |
| First-person presentation | Verified | Separate foreground render pass, block/tool held models, and stable tool orientation |
| Atmosphere | Verified | Cyclic day/night, rain, clouds, fog, water tint, and night vision presentation |
| Distant scenery | Verified within limits | Bounded render-only terrain and selected skyline anchors; not a seamless unlimited panorama |
| Travel Journal | Verified | 33 on-foot discoveries grouped into 18 area hubs for generator 9 and 10 worlds |
| Hardware GPU performance | Not universally verified | CPU work is instrumented; actual frame rate depends on browser, GPU, resolution, and hardware acceleration |

## World and city scope

| Area | Current implementation |
|---|---|
| World generator | New worlds use generator 10; generators 3–9 remain supported for existing saves |
| City districts | Ten named districts with distinct street patterns, building families, frontage, public spaces, and local activity |
| Landmark programs | Eight original reservation-backed destinations with supported public approaches |
| Regional destinations | Five destinations within the existing world envelope, each with a public circuit and supporting buildings |
| Architecture | Multiple massings, floor counts, roof grammars, facade systems, frontage relationships, and district-weighted selection |
| Persistent population | 4,080 resident identities; up to 96 detailed active residents at a time |
| City activity | Work, commerce, patrol, visits, short actions, and bounded social gatherings using existing residents |
| Generic woodland | Four-percent potential world-space mask; measured generic-forest coverage remains below five percent in the tested envelope |
| Discovery and travel | 33 discoveries, 18 area hubs, safe arrival validation, saved unlocks, and explicit old-world compatibility |

## Historical generator compatibility

| Generator | Retained world behavior |
|---|---|
| 3 | Original terrain and city reconstruction |
| 4 | Geographic plan and connected surrounding terrain |
| 5 | Ten-district metropolis, roads, lots, and district architecture |
| 6 | Eight landmark programs and public approaches |
| 7 | Additive street-density and resident-address extension |
| 8 | Dense urban fabric, building assemblies, and cultivated land-use policy |
| 9 | Regional destinations, reduced woodland policy, and unified travel/discovery |
| 10 | Current architecture variation, purposeful city activity, and final presentation integration |

Worlds retain their stored generator identity. The explicit updated-city copy action creates a separate generator-10 save for supported older worlds; it does not rewrite the original.

## Explicitly outside this release

- Multiplayer and networked persistence.
- Boats, minecarts, and other vehicle systems.
- Advanced piston/repeater automation and full reference-game circuitry.
- A full production economy, warehouse simulation, or large-scale NPC economic model.
- Alternate dimensions, portal progression, and endgame bosses.
- A seamless unlimited panorama or universal hardware frame-rate guarantee.
