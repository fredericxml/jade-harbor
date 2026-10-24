# Engine save baseline 1

Database `jade-harbor-engine-v1`, IndexedDB version 1, format `jade-harbor-engine`, generator 3. No historical migration. Earlier `jade-harbor-city-v1` data is left untouched. The menu explains the fresh-world boundary.

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
