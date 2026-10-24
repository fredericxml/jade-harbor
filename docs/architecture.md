# Architecture — v1.0.0

`Game` coordinates authoritative state, fixed simulation ticks, input and UI. Three.js renders state but does not own blocks. `Game` is still large; further interaction extraction is a maintenance priority. Existing city planning/panda realization remain deterministic editable voxel generation.

## World and streaming

World coordinates denote voxel minimum corners. Player position is the center of feet. Horizontal columns are 16×16, keyed `cx,cz`; signed Y ranges −64…319. Each column owns sparse 16³ `BlockSection` objects keyed by section Y. Air sections are absent, uniform sections use one scalar, and mixed sections use 4096 Uint16 values. A value stores the low 8-bit block ID and high 8-bit state. Local index is `x + z*16 + y*256`; all local coordinates use positive modulo, including negative world positions. Section deltas are keyed `cx,sy,cz`; no 384-high Uint16 index overflows.

The terrain worker returns sparse serialized sections with per-request tickets and a world epoch. Tickets are invalidated when a synchronous generation supersedes a pending request. Streaming prefers near/in-view columns and rejects obsolete outputs. Loading applies deterministic generation then the edit overlay. A dirty column is pinned until its captured edit sequence commits. At more than 64 pinned distant columns streaming holds new generation rather than discarding unsaved work. Overlay size and failed storage can still consume memory.

Rendering uses independently replaceable section groups beneath column groups. Exposed faces are culled across section/chunk borders, including transparent rules and existing collision shapes. Rebuilds have a section-count/time budget; one section is indivisible. Sections more than four section coordinates from camera Y are deferred/disposed, then restored on approach. Logical block columns remain resident at all heights. No greedy mesher or mesh worker exists yet. Material atlas is generated locally; all new workstations share the original palette and shader path.

Lighting stores a highest-opaque-Y sky column plus bounded flood-filled emission. It is cooperatively stepped; a stale signature or missing column discards the job. It does not calculate lateral skylight. Context-loss handling pauses and saves; recovery rebuilds geometry. Hardware context restoration remains to be exercised.

## Physics, navigation and simulation

Physics resolves AABB movement against actual block boxes, with gravity, stepping, crouching, swimming and flight. DDA targeting currently selects voxel cells, not exact sub-box surfaces. The fixed tick is 50 ms; render gaps are capped at 200 ms. This keeps work bounded but simulation slows under sustained low FPS. Interpolation renders between tick positions. Click-use requests persist until a tick can consume them.

NPC A* searches only loaded cells, verifies support/headroom/hazards and sampled step transitions, and shares a 96-node nominal 2 ms budget. Searches cap at 2400 nodes/cost 128. Revision checks, next-segment validation, stuck retries and local yielding handle edits/crowding. Paths are caches rebuilt after load; entity identity, goals, homes, workplaces, profession and state are saved. Ten roles use actual procedural building locations. Daily schedules currently choose home or workplace; trades differ by role. There is no full work-production economy.

Simulation radius is separate from render distance. Kilns/kettles/hoppers only advance while loaded and within simulation radius. Rice growth and fluids are bounded. Pending block work is persisted; unloaded targets are rotated in the queue instead of discarded. Generated natural fluid bodies are initially static until affected. Fluid work uses 64 operations per four ticks; circuit flood uses at most 4096 nodes. This is a finite sandbox approximation, not full hydrodynamics.

Timer and plate sources share the real power propagation map with switches/wires. A timer's cycle position derives from saved elapsed simulation time. Plates sample player/entity/drop positions. Lamps and both halves of connected doors respond to power. Hopper processing visits up to 64 machines per tick in stable round-robin order. Transfers copy the target slot first, then atomically decrement source. Output accepts exact metadata; full/unloaded/locked destinations retain input. Kilns accept ore from above, fuel horizontally, and expose only finished output for extraction.

## Items and progression

`stack.ts` defines durability, inscription map and deterministic wear counter. Central clone/equality operations prevent shared metadata and accidental merging. Transactions aggregate repeated ingredient IDs and reject nonpositive/noninteger counts before mutation. Crafting works against copies. `dropMany` commits all stacks together, merges nearby matching stacks, and enforces the 256 item-entity cap. Mining a storage block aborts intact if the entire contents/drop cannot fit. Death retains possessions when no full drop transaction fits. Enemy drops at the cap may still be omitted; this limit is documented.

`progression.ts` validates seven inscriptions and applies XP/resource costs, repair and status timing. Mining/combat/armor use these data. Status effects preserve remaining time and pulse clocks; healing is instantaneous. No orphan enchant buttons exist. XP is currently credited directly, with a derived level display rather than pickup orbs.

`brewing.ts` owns recipes, real-world water availability, fuel, progress, output capacity and ingredient consumption. `ui/stations.ts` renders the functional station panels. `buckets.ts` connects real raycast use to source removal / new source placement. New block IDs 66–71 and item IDs 160–170 retain all prior IDs.

## Persistence and boundaries

See `save-schema.md` for the atomic IndexedDB checkpoint contract and `engine-reliability.md` for the current persistence and lifecycle invariants. Simulation state, machine slot contents, effects and section changes are captured synchronously before asynchronous database work. Saves share a serial queue and expected revisions. Persistent imports/reconstruction are strict-schema validated; corruption never silently regenerates a world. Damaged component/checkpoint/chunk data can be reset through an atomic full-replacement recovery path as long as the independent world metadata is still valid. There is no cloud sync, migration or automatic stale-tab merge.

There is only one dimension. A proper dimension architecture must introduce dimension-qualified chunk/component ownership and transactional player transitions before exposing portals; adding decorative portal blocks is explicitly insufficient. Multiplayer is not part of the v1.0.0 release scope.
