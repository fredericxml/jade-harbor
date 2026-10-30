# Engine save baseline 1

Database `jade-harbor-engine-v1`, IndexedDB version 1, format `jade-harbor-engine`, supported generators 3–10. New worlds use generator 10; existing worlds retain their stored generator. No automatic historical migration. Earlier `jade-harbor-city-v1` data is left untouched. The menu explains the fresh-world boundary.

One transaction spans `worlds`, `chunks`, `players`, `blockEntities`, `entities`, `worldSimulation`, and `checkpoints`. Component revisions and a deterministic metadata checksum must match the last completed checkpoint. The checkpoint also records every saved section key and its checksum, so missing or altered section/component records are rejected without resetting the world.

Section keys are signed `cx,sy,cz`; local 16³ indices and packed 16-bit values alternate in a Uint16Array. Explicit zero values preserve mined blocks. Equivalent edit overlays are serialized in canonical section/index order so insertion order cannot change the saved representation. Only changed sections are rewritten. Expected revisions reject stale concurrent tabs. Transaction failures retain the live edit buffer. Serialization is copied before asynchronous work.

Dirty columns are pinned before eviction until their captured edit sequence commits, even if no autosave callback is attached. The callback requests an earlier save but is not the durability mechanism. Autosave, manual save, pause/menu and eviction use the same serial queue. Visibility/pagehide writes are best effort only. Last completed transactions are the recovery boundary; unsaved actions can still be lost in a process crash.

Checksums detect accidental corruption; they are not authentication or cryptographic tamper protection. Checksum traversal is cycle/depth guarded so malformed stored objects fail closed instead of causing unbounded recursion. Checkpoints, component records and stored chunk metadata are shape/ownership/revision validated before reconstruction. There is no cross-tab edit merging, cloud sync, or legacy import bridge. Rename preserves state; reset and deletion require confirmation. Reset is also the destructive recovery path for damaged component/checkpoint/chunk data: it trusts only validated world metadata and atomically replaces the full save.

## Current component ownership

- `players`: position/rotation, health/hunger/XP, selected slot, inventory/cursor/crafting grid/equipment with inscription metadata, spawn/death state, saturation/exhaustion/breath and effect durations/pulses.
- `blockEntities`: chests, kiln input/fuel/output and burn/progress, kettle slots/fuel/recipe/progress, hopper slots/cooldown.
- `entities`: stable NPC state/profession/home/workplace and dropped item metadata/age/velocity.
- `worldSimulation`: weather, time, achievements, ended Hardcore flag, elapsed/tick/crop clocks and pending fluid/gravity positions.
- `chunks`: deterministic base-generation deltas only; air overrides are explicit, records cover sparse signed vertical sections.

The checkpoint's component checksum includes all of these fields. Save reconstruction uses explicit key allowlists, so arbitrary top-level/player/simulation/entity/machine/vector/stack/effect payloads are not silently persisted. Stack validation rejects unknown/incompatible/excessive/conflicting inscriptions and invalid wear counters. Effect validation rejects unknown/duplicate effects and invalid durations/pulses. Machine slots and ranges are validated before any transaction begins. Pending simulation work is bounded on import at 200,000 positions; block-entity collections, achievements, entities/drops, coordinates, motion and clocks are also bounded. No offline machine/crop/effect elapsed time is simulated.

The database bootstrap checks whether stores/indexes already exist before creating them during an upgrade transaction. IndexedDB version remains `1`; this makes future version increments safer without changing the current persistence format.

## Generator identity and first checkpoint

The stored generator is dispatched through Game, World and the worker and is preserved by snapshots, exports/imports, duplication and reset/recovery. Only numeric generator versions `3` through `10` are accepted. Ordinary writes cannot change the seed or generator for an existing world ID. Macro, metropolis and landmark realization plans are reconstructed and never added to the persisted schema.

A revision-zero Game save writes a full snapshot, including preloaded/imported edits. Later saves pass only captured dirty sections and must extend a valid checkpoint. This fixes the reproduced new-world first-save failure while keeping missing/corrupt checkpoint rejection intact.

### Generator 6 boundary

Generator 6 introduced deterministic landmark terrain as a new world layout instead of changing generator 5 beneath saved edit deltas. The earlier metropolis implementation remains available for reconstruction, guarded by pre-change full-column hashes. New v6 landmarks use the same schema/checkpoint/overlay path; ordinary writes cannot change a saved world's seed or generator. Reset retains the stored generator, and unsupported versions and non-integer/string lookalikes are rejected. No IndexedDB or save-format version increment is needed.


## Living-city extension

The released v6 extension uses optional numeric `simulation.cityLifeVersion: 1`; absence identifies pre-living-city data. Database/format version remain 1. On an actual old v6 resident save the runtime adds the 26 new named identities once, preserving existing identity, positions and trade counts. Removed original residents stay removed; the marker prevents later resident deaths from respawning after reload. V3/v4/v5 populations remain unchanged. Paths, event participants, activation sets and schedule caches are transient.

Sixteen travel records are namespaced `discovery:<id>` strings inside the existing achievements array, stored and checksummed in `worldSimulation`. Missing old records mean undiscovered; duplicates remain invalid and the existing maximum of 256 entries is unchanged. No new item reward or separate mutable reward flag exists, so re-entry cannot duplicate inventory. Normal manual/autosave, export/import and restart use the same atomic snapshot/checkpoint path.

## Generator 7 density boundary

V7 adds incompatible urban infill to the exact v6 base. The source v6 slot is never rewritten. **Create denser city copy** validates the source, creates a new ID/revision-zero checkpoint, preserves seed, edit overlay, inventory, achievements and simulation, and places the player/spawn at Panda Plaza. Other old generators load normally; the previous v7 copy API accepts only v6; the released v8 menu creates v8 from v6/v7. Player edits remain the final overlay, including explicit air.

V7 accepts markers 1 and 2. Marker 1 imports the initialized v6 identities and adds only new `neighbor:`/`visitor:` identities once; missing released residents stay missing. Marker 2 records completed extension and prevents dead/removed new residents from returning after reload. An explicit empty entity component remains empty. Marker 2 is rejected on v3–v6. Paths, loops, active sets and events are rebuilt from the plan; identity/body/trades remain normal entity state.

The maximum entity component remains 256 for v3–v6 and is 1,024 for v7, covering at most 960 residents, the panda and five temporary spirits. Drop/achievement/queue bounds remain unchanged. Population does not grow with chunk visits or reloads. A v6 ID cannot become v7 through an ordinary or full-replacement write.

## Generator 8 urban-fabric boundary

V8 owns denser parcel/road geometry, varied building assemblies and the global woodland/cultivation surface policy. Existing v3–v7 reconstruction remains available. The menu offers a separate v8 copy for v6/v7. It preserves the source ID/world, seed, overlays, inventory, achievements and simulation progress, while assigning a new ID/revision-zero checkpoint and a safe Panda arrival. Existing NPC IDs/health/trades survive; their body/home/work routine anchors are fitted once to the explicitly changed layout. Ordinary v8 reloads keep saved positions. No live or old-world actor is teleported by this copy process.

V8 accepts earlier initialized markers 1/2 and writes marker 3. A marker-2 copy extends only with new `inhabitant:` identities, so absent released residents remain absent. Marker 3 prevents subsequent deaths/removals from being regenerated. Explicit empty components stay empty. Only v8 accepts marker 3 and up to 4,096 entity entries; v7 remains 1,024 and earlier versions 256. Existing drop, achievement and other component bounds remain unchanged. Paths, projected volumes, forest masks, street addresses and render instances are reconstructed/transient metadata, not new save stores.

## Generator 9 architectural/regional boundary

Generator 9 changes roof realization and regional terrain/content, so an existing v8 ID is never rewritten as v9. The current world-list copy action accepts source 6/7/8 and creates a separate v9 slot with the same seed, overlays, inventory, health, achievements and simulation. Player/spawn return to Panda. Existing original copy API targets 7/8 remain available explicitly. Format and database remain 1.

Marker 4 is valid only for v9. Copies accept earlier initialized population markers and add only the appropriate new identities; an initialized v8 component adds the eighty `region9:` identities while preserving removed old residents. Existing resident bodies initialize once at the copied layout's routine anchors, retaining health and trades. Marker 4 reloads preserve saved positions and do not repeat extension. The 4,096 total entity limit remains the v8/v9 component ceiling. Explicit empty components stay empty.

Travel unlocks derive from the same `discovery:` achievements. District discoveries supplement the original 16, with five more regional records in v9. No separate travel database or persisted path/active-set state exists. Travel changes position/facing through normal snapshots and preserves edit overlays; a blocked destination cannot authorize deletion of saved edits.

## Generator 10 city-life extension

Fresh worlds now store generator 10. Generators 3–9 remain accepted and immutable during ordinary writes. The actual world-list **Create updated city copy** action supports sources 6–9 and writes a separate generator 10 slot; explicit older target-7/8/9 APIs remain available. It preserves overlay, inventory, health, discoveries, resident identities and trade state, and resets copied player arrival/spawn to Panda Plaza.

Generator 10 serializes `cityLifeVersion: 5` under the existing simulation component. A copied marker-4 generator-9 component is accepted without extending/resurrecting residents. Reload preserves defeated/removed IDs. Short task states, appearance metadata, paths and render instances are deterministic or disposable runtime data, not new durable databases. The 4,096-entity save bound and 96-active detailed set are unchanged.
