# Architecture

`Game` coordinates authoritative state, fixed simulation ticks, input, and UI. Three.js renders state but does not own blocks. World planning and Panda realization remain deterministic, editable voxel generation.

## World generation

`generator.ts` dispatches stored versions 3–10. V3 retains the original terrain. A v4 `World` owns one immutable geography/reservation plan and a copy of the existing city parcel plan with district elevations. The worker owns an equivalent independent context; responses require matching version, epoch and ticket. `World.dispose()` releases plan ownership. See `world-plan.md` for module boundaries, semantic queries and planning limits.

The central city and Panda keep their original level; western neighborhoods use Y24 parcels and half-step road approaches. New harbor, river, range, pass, cliff and outer staging terrain are realized before structure writes. Future reservations suppress ordinary occupancy and protect foundations. V3/v4/v5 remain frozen reconstruction implementations; v6 adds the realized landmark layer.

A v5 world retains that exact macro plan and reservations, then constructs ten district specifications, road junction/grade metadata, urban blocks, accepted lots and per-chunk indices. `metropolis/districts.ts` owns the functional/architectural contracts; `plan.ts` owns deterministic selection, envelopes, access and index construction; `grading.ts` joins and grades street segments; `architecture.ts` realizes bounded voxel assemblies. `generator-v5.ts` owns the new terrain/pad/road/canal composition. The original city renderer and v3/v4 generators remain available for reconstruction.

Lot IDs derive from district and world coordinates. Local hash streams select archetypes, floor counts, roofs, facades, balconies and arcades. Recent neighbor choices receive a weight penalty, without changing the district's dominant family. Every roof/decoration stays within the two-block envelope. Entrances connect to indexed access paths; a rejected access rejects the parcel. Grades use established city heights and bounded half-step approaches outside the core. The original residents consume a projected `CityPlan`; NPC AI and job counts are unchanged.

## Landmark composition

A v6 context owns the frozen v5 base plus one finite realization plan consuming the same eight reservations. `landmarks/registry.ts` maps stable IDs and regional roles; `types.ts` defines components and public floor positions; `routes.ts` plans half-step profiles and bounded contour detours; `plan.ts` composes sites/approaches and chunk references; `builders.ts` writes only a requested chunk. `generator-v6.ts` composes these writes before the existing World edit overlay.

There is no whole-world voxel bake, second reservation search, neighboring-chunk generation or global component scan during realization. The renderer, blocks, lighting model and NPC budgets remain unchanged. World disposal releases the root context and its landmark references; workers keep one matching version/seed context. See [landmarks.md](landmarks.md) for the component ordering, routes, geometry and bounds.

## World and streaming

World coordinates denote voxel minimum corners. Player position is the center of feet. Horizontal columns are 16×16, keyed `cx,cz`; signed Y ranges −64…319. Each column owns sparse 16³ `BlockSection` objects keyed by section Y. Air sections are absent, uniform sections use one scalar, and mixed sections use 4096 Uint16 values. A value stores the low 8-bit block ID and high 8-bit state. Local index is `x + z*16 + y*256`; all local coordinates use positive modulo, including negative world positions. Section deltas are keyed `cx,sy,cz`; no 384-high Uint16 index overflows.

The terrain worker returns sparse serialized sections with per-request tickets and a world epoch. Tickets are invalidated when a synchronous generation supersedes a pending request. Streaming prefers near/in-view columns and rejects obsolete outputs. Loading applies deterministic generation then the edit overlay. A dirty column is pinned until its captured edit sequence commits. At more than 64 pinned distant columns streaming holds new generation rather than discarding unsaved work. Overlay size and failed storage can still consume memory.

Rendering uses independently replaceable section groups beneath column groups. Exposed faces are culled across section/chunk borders, including transparent rules and existing collision shapes. Rebuilds have a section-count/time budget; one section is indivisible. Sections more than four section coordinates from camera Y are deferred/disposed, then restored on approach. Logical block columns remain resident at all heights. No greedy mesher or mesh worker exists yet. Material atlas is generated locally; all new workstations share the original palette and shader path.

Lighting stores a highest-opaque-Y sky column plus bounded flood-filled emission. It is cooperatively stepped; a stale signature or missing column discards the job. It does not calculate lateral skylight. Context-loss handling pauses and saves; recovery rebuilds geometry. Actual WebGL context loss/restoration is exercised in Chromium/SwiftShader, including distant resources; physical GPU/driver combinations still require target-machine validation.

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

There is only one dimension. A future dimension system would require dimension-qualified chunk/component ownership and transactional player transitions; decorative portal blocks alone would not be sufficient. Multiplayer is not included in this release.


## Living city runtime

`Entities` owns one finite city-life context for v6/v7/v8. Population and public anchors derive once from accepted lot/road/landmark metadata; coarse schedules select local goals while the existing shared Navigation and physics move active actors. Local spatial bins avoid all-resident pair scans. Render models are restricted to loaded active residents. V7 composes indexed infill after the frozen v6 geometry; the original landmark components and reserved courts remain protected. `Entities.dispose()` releases routes, events and actors before Game swaps Worlds. See `city-life.md` for the budgets and catch-up boundary.

Discoveries use a small spatial index and the existing achievements set; Game triggers them only from supported walking and owns their checkpoint/notification lifecycle. The pause journal presents that same set. Validated optional population markers prevent repeated extension/resurrection: marker 1 for v6, marker 2 for v7 and marker 3 for v8. No path or event state is persisted.

## Density correction ownership

`generator-v7.ts` owns a v6 context plus `metropolis/density.ts`. The additive plan reuses district architecture, indexes accepted lots and entry links by column, preserves protected open spaces and rejects road/canal/reservation/component conflicts. A column realizes only indexed infill after its exact v6 base, then World applies saved overlays. No old reconstruction source is rewritten.

`city-life/presence.ts` derives permanent neighborhood identities from real lot entries, street cells, principal corridors and meaningful public courts. It adds bounded work, circulation, patrol, social and landmark circuits without generating voxels. Original v6 identities still derive from the immutable base plan. Detailed simulation caps at 48; schedules remain coarse, and the shared navigation work limit stays 96 nodes per tick. One reusable instanced civilian mesh renders active actors with district professions, walking/work poses and compact role props. F3 captures main-world render counters before the separate equipment pass resets them.

Existing v6 worlds remain v6. The world-list copy action creates a new v7 ID and retains the source's edits/progress, with the player's arrival at Panda to avoid embedding the player in new infill. Format/database remain 1, ordinary writes still reject base identity changes, and paths/render instances remain disposable caches. See [urban-density.md](urban-density.md).

## Dense-fabric and land-use ownership

`generator-v8.ts` owns the released v8 world composition. It retains the exact geographic/geological/mine contracts and unchanged landmark realization, constructs the frozen v7 semantic plan, then consumes `metropolis/fabric.ts` and `metropolis/variety.ts` for the new layout. The terrain and voxel assemblies are written directly for the requested column; v8 does not render a v6 building and leave it underneath an incompatible replacement. Full virtual approach roads remain planning/routing metadata, with physical cuts/decks owned by the unchanged landmark builder. Saved edits remain the last overlay.

The fabric planner grows accepted parcels into safe gaps, compacts minor streets and merges redundant parallel lanes only where grade/orientation agree. Door access, graded ramps, actual one-block roof envelopes and protected geography remain hard constraints. Physical massing/roof/subfamily choices are selected with local anti-repetition penalties. Local indices bound realization; search and parcel counts have explicit ceilings. The old semantic plan remains available for released resident identity resolution.

`geography/land-use.ts` assigns exactly twelve potential woodland cells per one-hundred-cell world-space supertile. Actual generic woodland can only be a subset; trunks and canopies must fit the mask. Managed rice fields, planted orchard rows, paths/meadow and selected rocky/scenic terrain replace generic wooded filler. Water, original farms, route clearances and landmark landscapes keep their ownership. This is a surface composition layer, not a change to caves, ore, macro heights or a new farming simulation.

`city-life/street-life.ts` adds fixed frontage/landing/public/landmark addresses to every released v7 identity. Its finite 4,000-person plan activates at most 96, using the same shared navigation limits. Shop-to-shop browsing, meaningful stop indices, paired meetings, role pace and work/patrol/visitor loops improve legibility. Instancing continues to render civilians in one reusable batch. The explicit new-layout copy initializes old NPC bodies at the new authored anchors once; initialized saves retain normal persistent positions, and live catch-up still cannot move a loaded actor.

## Generator 9 and navigation ownership

`generator-v9.ts` consumes the unchanged dense-fabric plan and designs, then owns `metropolis/quality.ts` assemblies and the indexed `regions/` plan/builders/land-use policy. Generators 3–8 remain frozen. Roof support elevations, body unions and clerestories resolve architecture before per-column writing. Regional reservations reject existing city/lot/landmark conflicts; bounded contour approaches use existing road/trail anchors, with the eastern landscape connected from the east bank. Regional route segments have their own chunk index. Saved overlays still apply last in World.

`city-life/regional-life.ts` retains released identities and adds sixteen hosts/visitors per new region. Marker 4 belongs to generator 9 and permits one explicit layout-copy initialization. The unchanged 4,096 entity component ceiling, 96 detailed actors and 96-node navigation budget bound the extension. Intermediate route samples no longer receive the extra random idle of v8; meaningful work, social and watch stops retain their dwell.

`city-life/travel.ts` defines version-aware destination identity, discovery policy and supported arrival checks. Game owns one cancellable travel request tied to the current World, pauses simulation during save/loading, directs normal streaming to the destination, prepares collision/rendering and commits position/facing atomically. It refreshes the existing active set rather than spawning a crowd. All normal unlocks use the same achievements component. See `travel-journal.md` and `regional-destinations.md`.

## Generator-10 architecture and city-life ownership

Generator 10 adds `metropolis/richness.ts` and a version-specific regional support-building renderer. It preserves every v9 parcel/ground-body union and route, then independently selects supported upper composition, roof bays/axes, facade and frontage. The complete v3–v9 generation inputs remain frozen. See [architectural-richness.md](architectural-richness.md).

`city-life/purpose.ts` attaches deterministic short task chains and inexpensive appearance metadata to the same 4,080 identities. Runtime updates only the 96-active local chain set at five Hz; coarse schedules stay at one Hz and navigation remains shared/bounded. EntityView still uses one civilian instanced mesh. See [purposeful-city-life.md](purposeful-city-life.md).

The Travel Journal and discoveries project one typed place model with 33 discoveries and 18 area owners. Hub unlocks derive from any saved member discovery, with no schema migration. A serial-owned three-second preparation owns at most four collision columns per anchor, saves before eviction and commits player state atomically. Non-critical lighting, meshes, population and distant rendering remain ordinary post-arrival work. See [Travel Journal](travel-journal.md).

## Final presentation ownership

`render/atmosphere.ts` owns a reusable cyclic phase/weather state and gradient sky. `View` applies it to existing voxel lighting, water, emission, clouds, fog and the existing entity lights. Rain remains capped and camera skylight gates outdoor drops. Clouds use one shared instanced draw. Equipment retains its own unfogged render pass. See [atmosphere](atmosphere.md).

`render/distant-world.ts` owns one bounded terrain mesh, one merged silhouette mesh, one material and a section-coverage texture per world. It reads existing plans without generating or changing blocks. Actual meshed sections—including empty edited geometry—suppress proxies. Incremental build tasks, texture/geometry identities, old-world disposal and context recovery are explicit. The high-camera mesher retains the player window and adds at most five surface sections. See [distant world rendering](distant-world.md). Authoritative voxel world and distant representation are separate; no save or generator contract changes.
