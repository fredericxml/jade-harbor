# Living city and roaming — v2.0.0

The released generator 10 experience retains all 4,080 persistent resident identities and the 96-active detail cap. Short place-aware work, commerce, patrol, social and visitor chains replace long generic circuits for the new generator, with inexpensive clothing/headwear/prop/gesture variation. [purposeful-city-life.md](purposeful-city-life.md) defines the current behavior and measurement; the sections below retain the underlying v6–v9 population/schedule contracts. V9 retains its 4,080/96 behavior, v8 4,000/96, v7 960/48 and v6 36/16. Worlds 6–9 can be copied explicitly to a separate v10 slot. There is no quest campaign, vehicle system or expanded economy. The final atmosphere and distant layer consume this same population without changing its identities or budgets.

## Ownership and modules

| Module | Responsibility |
|---|---|
| `city-life/presence.ts` | Frozen v7 addresses plus v8 fitting of disposable routes to current streets |
| `city-life/street-life.ts` | V8 fixed frontage/public/landing addresses, paired social stops, actual shop browsing and additional landmark circulation |
| `city-life/population.ts` | Once-per-world stable identity, real home/work assignments, district/public anchors and explicit budgets |
| `city-life/schedules.ts` | Pure clock/phase/offset and profession/district/weather policy |
| `city-life/routes.ts` | Short metadata itineraries using an existing canal bridge or landmark approach |
| `city-life/runtime.ts` | Coarse activity/activation, validated local goals, bounded failure handling and one transient gathering |
| `city-life/discoveries.ts` | Projection of the complete travel registry, local spatial lookup and the existing durable achievements set |
| `entities.ts` / `navigation/pathfinder.ts` | Existing fixed-tick physics, doors, shared bounded navigation, combat and serialization |

`Entities` owns one optional city-life context. The World remains the owner of immutable geography/architecture. No second resident simulation or landmark builder exists. Activity anchors are derived once from accepted lots, road metadata, Panda and the eight landmark instances. Per-tick proximity uses local four-block bins rather than an all-resident pair scan. Render models exist only for loaded, active residents. Inactive actors retain identity and coarse logical schedule; no distant voxel searches or offline tick replay occur.

## Population and spatial roles

The following roles describe the retained 36-person v6 foundation; v7/v8 add the neighborhoods and activity nodes specified in `urban-density.md`. The ten released `resident:<seed>:<index>` identities, professions, homes and workplaces remain intact. Eighteen additional city residents have IDs keyed by district and curated name. Eight additional landmark residents have IDs keyed by landmark ID. IDs do not depend on spawn order, frames or chunk arrival. The original 36 names are distinct; neighborhood names use a curated given/family pool and IDs remain unique. Assignments resolve during initialization, without generating chunks.

| District / destination | Added city roles or local landmark role |
|---|---|
| Panda Heritage Core | Guard, merchant, scholar and resident; four separated civic activity positions |
| Old Market Maze | Two merchants and a tea-house keeper; nearby shopfronts and midday browsing |
| Hutong Courtyards | Two residents with local homes, short work/daytime walks and evening return |
| Jade Water Town | Fisherman; existing bridge metadata guides canal crossings |
| Imperial Quarter | Guard; controlled daytime and night-watch activity |
| Merchant Docks | Dock worker and fisherman; early activity, short quay/work loops and reduced night presence |
| Artisan Workyards | Potter and carpenter in actual workyard structures |
| Scholar Gardens | Scholar; quieter daytime/public walking |
| Lantern Commercial Core | Merchant and tea-house keeper with later work/social hours |
| Jade Palace | Palace attendant in the public court and gate approach |
| Northern Ridge Wall | Sparse guard movement over the first supported wall section |
| Terrace Excavations | Researcher at the public excavation rim/arrival area |
| Harbor Guild Beacon | Dock worker, with the public tower deck available as a local activity destination |
| Cloudstep Sanctuary | Caretaker at the lower court and arrival gate |
| East Cliff Chambers | Researcher on the shared terrace |
| Reed Moon Garden | Caretaker near the pond/causeway and garden entrance |
| Western Lookout Pagoda | Scholar, with the public upper floor available through the existing stairs |

New homes use actual accepted structures, preferably separate nearby buildings. A local live/work fallback is allowed where no suitably close house is available. Remote workers have real town homes; they do not live in water, walls or abstract route points. New actors begin at the anchor appropriate to the saved/current clock. Existing initialized saves preserve positions, trades and identity. Only an explicit new-layout v8 copy initializes the copied bodies at safe authored routine anchors before play; the source remains unchanged.

## Shared time and behavior

The existing time value still maps zero to 06:00. There is no additional day counter or clock. Stable identity-derived departure offsets span approximately ±27 minutes.

| Broad phase | Clock interval before individual offset | Typical behavior |
|---|---|---|
| Dawn | 06:00–08:00 | Home/rest; harbor workers start earlier |
| Morning | 08:00–12:00 | Work and local work loops |
| Midday | 12:00–14:00 | Browsing, garden visits or a short public break |
| Afternoon | 14:00–17:00 | Work/local activity |
| Evening | 17:00–21:00 | Public gathering or return home; later commercial activity |
| Night | 21:00–06:00 | Home/sleep; guards retain watch and tea/commercial roles may work until 23:00 |

Harbor roles work approximately 05:00–17:00. Guards keep posts through the night. Tea-house/nightlife roles work later, approximately 11:00–23:00. Rain suppresses optional outdoor social activity and cancels gatherings; guards and core work remain. The released v6 work/public walking selects authored candidates on a 24-second clock cadence. V7/v8 neighborhood actors finish short actual circuit legs, pause approximately 0.7–5 seconds according to role and stable personal variation, then continue; worker routes include the actual entry/workplace, patrols use street lanes and social loops remain local. An unfinished local trip keeps its target until arrival, so longer tower climbs are not reversed midway; phase changes and events can still preempt it.

Street landings and principal junctions in v7/v8 also host short shared routines, social pairs and a guard, redistributed within the finite plan. Rain sends social pairs to supported home shelter; other street work and patrol remain. At most one nearby named event uses two or three existing residents: a market midday break, Panda evening gathering, evening tea group or harbor morning group. It never creates new entities or durable event records. Participants receive separated, collision-validated slots keyed by stable identity, so distance-order changes cannot continually swap their destinations. Rain, distance/unloading, phase expiry or disposal removes the event. There are no additional temporary visitor entities.

## Activation, navigation and edits

Schedules update at most once per second, with immediate invalidation for a substantial time jump. At most 96 nearby residents enter full movement in v8 (48 in v7 and sixteen in released v6); the existing simulation radius can reduce that further. Mid-distance actors receive coarse schedule state. Far actors do not pathfind. An actor whose source is both unloaded and more than 96 blocks away may resume at a validated loaded schedule anchor within 80 blocks, provided that anchor is more than 24 blocks from the player in v7/v8 (ten in v6). Loaded/visible actors are never moved by this catch-up rule. No missed-tick replay or hidden world generation is used.

The existing shared navigation scheduler retains its 96-node / two-millisecond tick budget, 2,400-node search cap and 128-cost route limit. Canal commuters can use three short legs through an existing bridge. Longer regional itineraries sample existing landmark approach metadata in sixteen-block legs. Local A* validates each leg against loaded voxels. Actors wait/abandon optional activity when a needed segment is unavailable; full continuous remote commutes are not simulated across unloaded terrain.

Real support, water hazards, headroom, collision boxes and half steps remain authoritative. A small nine-position local probe validates an authored candidate without carving or repairing the world. Three blocked attempts trigger a twenty-second local rest/retry period. Navigation retains its existing stuck detection and bounded replan. Door interaction keeps both halves consistent. Player edits may stop an optional trip; they cannot trigger unbounded searches, visible recovery teleports or automatic reconstruction of removed blocks.

The ordinary hostile limit remains five, drops remain capped at 256, population planning caps v8 residents at 4,000 and active resident routes at 96 plus the existing Panda/hostile allowance. V7 remains 960/48 and v6 remains 36/16. `Entities.dispose()` clears actors, navigation and city-life state before Game replaces its World. No timers, global population cache or cross-world event list is introduced.

## Discoveries and interaction

The eight main discoveries reward actual landmark traversal: the palace court, ridge arrival, excavation pit, beacon upper deck, sanctuary, cliff chambers, garden and pagoda upper floor. Eight more recognize the middle ridge watch, sanctuary side terrace, excavation viewing rim, working quay and hutong/market/canal/scholar side routes. The two tower discoveries require their actual upper elevation. The grotto record and researcher use the connected central terrace; peripheral fenced chamber recesses remain viewing spaces and are not used as NPC arrival points. Walking on supported floor is required; flight and spectator cameras do not collect them.

First arrival displays one nonmodal notification and schedules the existing save. Pause → **Travel journal** shows 33 discoverable places grouped under 18 area hubs; expand a hub to inspect its places and short descriptions. It returns to Pause and does not capture pointer lock. There is no required order, map beam, quest marker, item grind or physical reward spawn. The durable discovery count and travel record are the modest rewards. Right-click continues to show the resident's name, profession, context and existing compatible offers; nontrading landmark roles have no invented economy.

Discovery IDs use `discovery:<stable-id>` in the existing achievements set, owned by the `worldSimulation` checkpoint component. The existing 256-entry validation bound is respected. Re-entry/reload cannot grant an additional record or item. Missing old data means undiscovered. Optional `simulation.cityLifeVersion: 1` records that a v6 population has been extended; v7 uses marker 2 and adds only its new neighborhood/visitor IDs to a marker-1 component, once; v8 uses marker 3 and adds only its new inhabitant extension to a marker-2 copy; old ten-resident v6 saves receive the new identities once, while removed old residents and later deaths stay removed. Transient paths, schedules, events, activation sets and render models are never serialized.

## Verification and boundaries

The dedicated city-life suite covers deterministic planning, identity, phases, old saves, actual home/work support, default/alternate commutes, all eight landmark routes, real physical movement, doors, stuck recovery, blocked edits, activation/event budgets and durable discovery. Forty pre-change v6 full-column observations over 34 distinct seed/column pairs supplement the existing v3/v4/v5 fixtures. Browser behavior and CPU/long-roam evidence are recorded in `quality-assurance.md` and `performance.md`.

The intended 20–30-minute roaming value comes from the existing city/landmark distances, time-dependent activity, sixteen optional destinations and reachable upper viewpoints, rather than a timed content guarantee or mission chain. Crowds are bounded locally; remote v8 sites have the retained named role plus nine persistent visitors (three in v7), rather than unlimited crowd spawns. Selective interiors, no offline crowd simulation, finite full-detail radius and approximate distant rendering remain documented limits.

## V8 visible street occupation

The released v7 registry is resolved against its original addresses before routes fit changed streets. This prevents a merged lane from renaming a cell and losing identities. Additional permanent addresses sample actual developed frontage; real grade landing ends and public spaces reserve work, social and circulation roles before the remaining pool is distributed. Two social pairs at one node use separated meeting positions. No actor is spawned in response to a camera or player visit.

Customers visit actual shop entries and pause before another shop, workers link their entries to local work streets/quays, guards continue supported patrols and visitors use the existing public/interior landmark goals. New circuits pause at explicit meaningful stops and vary pace by role, rather than stopping at every routing waypoint. Rain shelters optional social actors while work/patrol/circulation continue. The actual 60–90-second browser matrix and real-input travel checks establish visible activity; database and active-count peaks alone do not.

## Retained generator 9 regional extension

All 4,000 released v8 identities are retained, and each of five regions adds 16 persistent hosts/visitors for 4,080. The detailed cap remains 96; navigation retains 96 expanded nodes/nominal 2 ms and the 2,400-node / 128-cost limits. New public work, patrol, social and visitor circuits follow the actual graded regional ribbons, while v9 intermediate route samples avoid the extra random pause of v8. Work/viewpoint/watch/social stops keep their intentional dwell. Discovery entries total 33. The current Journal exposes all 33 discovery entries through 18 area hubs, with any-member normal-mode unlocks. See `travel-journal.md` and `regional-destinations.md` for arrival, save and compatibility rules.
