# Save format and recovery

A Jade Harbor world uses `format: "jade-harbor-engine"` and `version: 1` for its **save format**. This is distinct from the application version, `2.1.0`. The world generator itself is not version-selected.

## Stored state

`freshWorld()` creates a world with ID, name, seed, play mode, timestamps, player state, simulation state, achievements and block edit overlay. `Game.snapshot()` records the same format. New saves do not include a generator number.

The IndexedDB database `jade-harbor-engine-v1` uses transactional world metadata, player, block entities, entities, simulation, per-section edit deltas and checkpoint manifests. A revision is committed only if its required parts pass validation. Save conflicts from another tab fail safely, and block edits survive generation, eviction and reload.

## Current-world handling

The only generator is [`src/world/generator.ts`](../src/world/generator.ts). The seed and edit overlay reconstruct a world. Historical saves containing a generator selector are not supported. The importer rejects those layouts rather than silently loading edits into different terrain geometry. There is no automatic conversion or alternate generator.

Export backups before clearing browser data. See [save schema](save-schema.md), [controls](controls.md), and [engine reliability](engine-reliability.md).
