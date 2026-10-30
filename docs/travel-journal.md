# Travel Journal

Pause → Travel journal shows **33 discoverable places under 18 area hubs** in generator 9/10 worlds. There is one Travel button per district or meaningful region. Expand a hub's discovery count to see its places and visited indicators. Creative and Spectator always enable all 18 buttons. Survival, Adventure and Hardcore unlock a hub from any existing member discovery; old progress needs no migration or second database.

| Hub | Discoveries represented |
|---|---|
| Panda Heritage Core | District, Panda Plaza, Grand Lantern Avenue |
| Old Market Maze | District, Behind the Market |
| Hutong Courtyards | District, Hutong Side Lane |
| Jade Water Town | District, Canal Bridge |
| Imperial Quarter | District, Jade Palace |
| Merchant Docks | District, Harbor Guild Beacon, The Working Quay |
| Artisan Workyards | District |
| Scholar Gardens | District, Scholar Garden Path |
| Lantern Commercial Core | District |
| Northern Terrace Edge | District, Northern Ridge Wall, Middle Ridge Watch |
| Willow Valley Tulou | Region |
| Amber Gate Village | Region |
| Li River Stone Walk | Region |
| Mist Terrace Tea Village | Region |
| Lotus Causeway Gardens | Region |
| Terrace Excavations | Excavations, Excavation Viewing Rim |
| East Cliff Chambers | Chambers |
| Western Scenic Highlands | Cloudstep Sanctuary, Sanctuary Side Terrace, Reed Moon Garden, Western Lookout Pagoda |

## Ownership and compatibility

`city-life/travel.ts` owns one typed, cached `journalPlaces` model. Every record has its released discovery ID, position, radius and parent hub. Only the 18 area owners have a travel anchor. `travelDestinations` derives hubs and their qualifying member achievements; `discoveryRegistry` projects the same place records. The UI has no competing display-only list. The original 33 discovery coordinates/radii remain frozen in `tests/fixtures/journal-v9.json`.

Generator 6–8 worlds have 28 discoveries and 13 hubs because their geometry predates the five regional destinations. Earlier worlds safely show no area travel. Travel does not change stored generator identity. The same durable achievements component remains authoritative.

Travel itself awards no discovery. A committed arrival, or loading a world, suppresses passive discovery until the player walks at least two horizontal blocks on supported ground with movement input. This transient guard is not saved. After that, normal supported on-foot visits record individual places. Flying and Spectator visits do not collect them. Returning to an unlocked district does not complete all its sub-POIs.

## Stage A: minimum safe arrival

The accepted two-stage pipeline is retained. A serial-owned request pauses simulation and saves once before eviction. It prepares only the columns covering a bounded six-block search, adjacent exits and collision radius: at most four columns per authored anchor, independent of render distance. A synchronous request supersedes an older worker ticket. Timer yields between columns permit Cancel and the overall three-second deadline, including a stalled save. The preparation panel retains the old frame without spending time on origin rendering or distant LOD.

Dry support, complete headroom and two usable exits are required. The resolver tries the primary and an authored local secondary, each with bounded search. It never repairs/deletes edits. Failure preserves the origin and releases the lock. Position, interpolation, velocity, fall state, facing and mode update atomically. A best-effort ground mesh uses the ordinary bounded mesher; arrival does not await lighting, the whole district or every resident.

Escape/Cancel invalidates the request serial. A stale completion cannot place the player or roll back a replacement. World switching cancels preparation. Concurrent clicks are rejected while a request is owned. Existing residents reactivate; none are created by travel.

## Stage B: background settling

After placement, ordinary streaming continues with four requests per frame and eight pending jobs. Lighting, section meshes and local actors settle normally. The distant scene is a reusable render cache and is never built on the travel handler's critical path. Preparation latency and the time to finish background detail remain separate measurements. `Game.travelMetrics` retains at most 120 actual handler observations. Executed timings, normal-mode/reload/mobile coverage and failure cases are recorded in [performance](performance.md) and [testing results](quality-assurance.md).
