# World generation and geographic planning

The current generator-10 world retains the accepted map envelope, dense districts, eight landmark programs, five regional precincts, road/access contracts and under-five-percent generic forest policy. Generators 3–9 remain frozen. The historical sections below document their original geometry contracts; the final renderer reads those plans without modifying them. Distant orientation and atmosphere are described in [distant-world](distant-world.md) and [atmosphere](atmosphere.md).

## Geographic planning principles

The geographic design builds on the original voxel coordinate system, sparse sections, deterministic generation, city planner, lighting, navigation, entity simulation, and persistent edit overlay. Those established systems remain the foundation for the versioned world plans described below.

| System | Design constraint | Current design |
|---|---|---|
| Signed 16×16 columns and sparse 16³ sections, Y −64…319 | Preserve stable coordinates, block IDs, and sparse storage | Keep the existing section and mesh architecture across generator versions |
| Atomic IndexedDB transactions, checksums, schema validation, revision ownership, and dirty-column pinning | Never discard uncommitted edits or silently reconstruct corrupt state | Retain transactional checkpoints, strict validation, and save-before-eviction ownership |
| Simulation work at world boundaries | Reject invalid bedrock and out-of-world neighbors before persistence | Filter unpersistable neighbors when work is queued; keep save validation strict |
| First save of a new world | Establish a complete checkpoint before incremental writes | Commit the full initial snapshot, then use validated dirty-section updates |
| Deterministic generator-3 terrain, caves, geology, ores, mine, and terraces | Keep old saves reproducible | Retain the original generator and reuse its established distributions where compatible |
| Existing city parcels, districts, Panda Plaza, and protected civic sites | Preserve the central identity while adding geographic structure | Build one primary metropolis around the existing parcel planner and protected landmarks |
| Repeated legacy cities | Avoid duplicating the main city identity in newer worlds | Preserve repeated-city behavior for generator 3; newer layouts use one primary metropolis |
| Harbor, regional geography, and landmark reservations | Make placement deterministic and independent of chunk order | Use immutable world-space plans, explicit reservations, and bounded candidate resolution |
| NPC jobs and navigation | Keep residents attached to real buildings and traversable terrain | Derive home/work elevations from accepted parcels and preserve bounded pathfinding |
| F3, generation queues, meshing budgets, and CPU profiling | Make expensive systems observable without adding unbounded runtime work | Extend the existing diagnostics and profiling interfaces |

### One primary metropolis

The primary anchor remains `(0,0)` for every seed. The spawn and Panda coordinates remain unchanged. This is deliberate art direction: alternate seeds vary road offsets, parcels, hills and the northern ridge, while the city/river/harbor topology remains valid. The same seed no longer relies on a lucky noise sample to put water next to the city.

The core terrain retains the rounded 328-block half-extent and 436-block radial clipping. V4 retains the original building-family system; v5 uses the district grammar below. The western neighborhoods sit four blocks above the central floor, with half-block approaches across the western avenue. The 1,480×1,610-block planning envelope additionally covers waterfront, imperial plateau, archaeological outskirts and ridge districts. The ten v5 districts occupy a finite subset of this envelope, including the northern terrace edge and harbor docks. Other outer sites remain open scenic terrain.

Repeated full-size cities were removed only from v4 after checking residents, resource availability, discoveries and saved-world reconstruction. Their cloned Panda/civic centers competed with one primary identity. Smaller settlements are deferred rather than introduced with a second architectural system in this scope. V3 worlds retain their repeated cities and edits exactly.

## Module ownership

| Module | Responsibility |
|---|---|
| `generator-v3.ts` | Frozen pre-change generator, retained for v3 saves |
| `generator.ts` | Supported-version dispatch, bounded convenience caches, public terrain helpers |
| `generator-v4.ts` | Frozen generator-4 terrain and architecture for v4 saves |
| `generator-v5.ts` | Frozen generator-5 macro terrain, local pads, graded streets, canals and modular architecture |
| `generator-v6.ts` | Frozen v5 base plus eight indexed landmark destinations and their pedestrian approaches |
| `metropolis/districts.ts` | Ten functional contracts, weighted archetypes, heights, roofs, facades and detail budgets |
| `metropolis/plan.ts` | Blocks, finite candidate lots, envelopes, access paths, reservations and chunk indices |
| `metropolis/grading.ts` | Shared junction nodes, fixed city grades and bounded approach relaxation |
| `metropolis/architecture.ts` | Local massing, roofs, facades, stairs, courts, shopfronts and static street details |
| `geography/geometry.ts` | Point circles, area rectangles and capsule-union corridors; distances and exact footprint conflicts |
| `geography/plan.ts` | Immutable seeded anchors, region vocabulary, 12 district contracts, 11 connection descriptors and mine descriptor |
| `geography/terrain.ts` | Pure world-space terrain samples, geographic classification, suitability and half-height urban terrace rules |
| `geography/landmarks.ts` | Bounded candidate resolution, explicit protections, diagnostics and cave/foundation policy |
| `geography/city.ts` | Original city parcels with validated district elevations and per-chunk indexing |
| `generation-protocol.ts` | Shared worker-generation session, one owned context, explicit version/epoch/ticket |

Regions describe physical geography, districts describe urban function, and landmark reservations describe protected footprints consumed by versioned realization. Region and landmark plans are not persisted as voxel payloads; edits over their generated blocks are persisted. All are reconstructed from the saved seed and generator version.

## Realized geography

The generator-v4 geographic diagnostic can be regenerated with `node scripts/world-plan-map.cjs`; its SVG output is written to `docs/proof/world-foundation/world-plan.svg` in the working tree. Curated release packaging omits `docs/proof/` without deleting it or adding it to `.gitignore`.

The map is generated from the actual terrain queries by `node scripts/world-plan-map.cjs`; it is not a gameplay screenshot.

| Feature | Default coordinates or extent | Current realization |
|---|---|---|
| Primary city / Panda Plaza | City `(0,0)`; Panda `(0,-48)` | V5 district architecture, original sculpture/plaza, central floor Y20 |
| Western urban terrace | West of the seeded avenue near X−224 | Y24 parcels; twelve-block approach uses half slabs, traversable by player and NPC |
| Harbor | Center `(200,530)`, radius 180 | Broad sheltered water basin with a shore shelf and city-facing waterfront |
| River | Seeded eastern center near X450, bends into harbor and continues south | Continuous polyline distance field; 52-block nominal channel, no chunk-local decisions |
| Canal-compatible lowland | X328…410, Z−200…280 | Controlled low ground beside the eastern river; v5 canals and banks connect Water Town through the reserved southeast corridor to the river |
| Northern mountain chain | Seven seeded control points from roughly `(−1100,−470)` to `(1050,−470)` | Broad connected foot, varied crest and intentional river gorge |
| Fortification-capable ridge | Roughly `(−160,−580)` → `(160,−630)` → `(350,−620)` | Continuous elevated corridor longer than 500 blocks, ending before the river gorge |
| Western pass | `(−380,−340)` → `(−420,−570)` → `(−490,−850)` | Lower valley through the range; route metadata, no finished road |
| Cliff highlands | Around `(620,−430)` | A deliberate south-facing ~56-block face and upper shelf |
| Imperial plateau | Around `(0,−430)` | Level Y35 staging terrain outside the retained city core |
| Archaeological outskirts | Around `(−530,160)` | Dry Y27 basin, separated from the commercial core |
| Scenic highlands | Around `(−660,−250)` | Protected elevated terrain, sanctuary, scenic garden and western lookout in v6 |
| Agricultural terraces / timber mine | X350…374, Z120…166; mine X360, Z0…144 | Retained working rice terraces and a half-step descent to negative Y |

Sea level remains Y18. V5 canals use Y18–19 water beneath Y20 decks, including the southeast `canal-link` corridor. Quays and short canal crossings are built. V6 adds a supported pedestrian crossing at the existing eastern connection for cliff access. Vessels, locks and vehicle transport remain deferred.

The river uses a shared bed/bank/shelf distance field. It continues to the supported northern and southern coordinate boundaries rather than ending at an arbitrary city chunk. This is stylized topology, not hydrological simulation. The northern range continues beyond the fortification reservation; its river gorge is deliberately excluded from that continuous ridge route.

## Query contracts

```ts
const generator = createGenerator(seedText, storedGeneratorVersion);
const blocks = generator.generate(cx, cz);
const detail = generator.inspect?.(worldX, worldZ); // v4, v5 and v6

const macro = createMacroPlan(seedNumber(seedText));
const terrain = sampleTerrain(macro, worldX, worldZ);
const suitability = terrainSuitability(macro, worldX, worldZ);
const district = districtTerrain(macro, "imperial-expansion");
```

`sampleTerrain` reports height, elevation, region, urban occupancy, water, waterfront, river/harbor/ridge/cliff distances, scenery protection, city elevation and normal cave roof depth. `terrainSuitability` adds sampled slope, local roughness, buildability, adjacency, ridge/cliff membership and matching district/landmark categories. Terrain height is the top full-block layer; a western city half slab can add 0.5 to the support surface.

Suitability uses four neighbor probes at ±4 blocks. It is a planning tolerance estimate, not proof of every voxel's collision geometry. Actual city approaches have player-physics and A* coverage. Future authors should validate their completed structure/foundation geometry too.

District contracts have stable IDs, semantic footprints, anchor, subseed, priority, desired regions/elevation range, slope tolerance, density intent, water preference, ridge/cliff/scenery rules and connection IDs. Existing district footprints are approximate areas; the legacy `districtAt` remains authoritative for v3/v4. V5 `urbanAt` resolves its own district/lot/road while preserving the separate terrain region. V5 consumes contract IDs/regions, fixed city elevation, macro connections and landmark exclusion envelopes. Highland edge housing deliberately occupies the lower approach to the ridge contract, not the protected fortification corridor.

## V5 metropolis and architecture

The actual metropolis diagnostic can be regenerated with `npm run map:metropolis`; its temporary SVG output is written to `test-results/metropolis/district-plan.svg` and is not a release asset.

This diagram is generated from accepted lots and street metadata; it is not a screenshot. Regions remain physical geography. Districts choose urban function and architecture. The diagram retains the v5 reservation outlines; v6 realizes the eight destinations through the mapping in [landmarks.md](landmarks.md).

| District | Urban structure | Dominant architecture and skyline |
|---|---|---|
| Panda Heritage Core | Broad axial streets and flanking civic frontages; protected central plaza | Formal low/mid-rise halls, paired eaves, sparse signs; Panda remains the focus |
| Old Market Maze | Small offset blocks, narrow alleys and short shop fronts | Weighted shophouses, mixed 1–3 floors, timber fronts, canopies, projecting signs and balconies |
| Hutong Courtyards | Larger enclosed parcels and quiet lanes above/below the western terrace | Single-storey rear/side wings, open private courts, low walls, dark gables and planted pockets |
| Jade Water Town | Canal-facing rows, continuous banks, branch canal and frequent short bridges | Low white/timber houses, overhangs, modest balconies and a low roofline |
| Imperial Quarter | Four broad formal parcels and deep forecourts beside the open north axis | Red compounds, long halls, gold details and double eaves; separate plateau reservation now contains the v6 palace |
| Merchant Docks | Shore-following quay fragments around the protected waterfront site | Broad loading bays, warehouses, cargo stacks and merchant fronts; no ship simulation |
| Artisan Workyards | Workshop blocks with open work courts | Side sheds, furnaces, benches, cargo and kiln chimneys; broken low skyline |
| Scholar Gardens | Large asymmetric lots, bent paths and preserved diagonal canal corridor | Garden ponds, small bridges, pavilions, rockery, planted courts and low halls |
| Lantern Commercial Core | Dense frontage on the central avenue | Weighted 3–5-storey mixed use, arcades, balconies, setbacks and accessible roof terraces |
| Northern Terrace Edge | Lower hillside parcels, retaining pads and switchback approaches | Stone/timber homes, small pavilions, reduced footprints on rugged seeds; upper ridge reserved |

The generator uses 12 archetypes, five roof families and five facade families. District weights control selection; a recent-neighbor penalty reduces repeated local combinations without erasing the dominant type. World-coordinate hashes select widths, heights and details. No random state depends on chunk order. Large courtyard/garden/imperial parcels contain several wings, so a parcel count is not a count of individual building masses.

Street classes include ceremonial axes, boulevards, commercial streets, lanes, market alleys, garden paths, quays, hill roads and approaches. Grading splits shared junctions before clamping non-city grades to 0.45. Half-block quantization provides walkable steps. The established western terrace remains authoritative. Nearest-centerline surface selection prevents a capped crossing from overriding the grade of a continuing route.

Lots reject every landmark footprint plus margin, Panda protection, water, major macro connection corridors, road widths and neighboring two-block projection envelopes. Supports are local to accepted lots/road ribbons. Rugged highland candidates may shrink, use lower fallback sites or be rejected. A lot with no conflict-free street entrance is removed. No broad regional flattening or floating foundations are used.

The canal network consumes the reserved southeast `canal-link`, reaching the eastern river. Other reserved connections remain clear: district roads may serve their approaches but ordinary buildings cannot occupy them. In v5 the imperial north axis stops before the complex margin and harbor quays split around the waterfront reservation. V6 joins those existing ends to the palace and beacon without moving ordinary lots. Archaeology and the mine have dry approach routes; the rural rice terraces retain their working field pattern.

The architecture writer composes foundations, floor plates, timber walls/windows, three-block public openings, optional arcades and balconies, courtyard wings, roof profiles, static props and furnishings. Upper floors use two half-step flights per storey with floor openings and headroom. Roof terraces have an additional stair flight. Lanterns remain ordinary emissive voxels; no per-lantern entity or dynamic light is added. No new block IDs, imported textures or external art licenses are required.

Per-world planning is finite: fewer than 800 accepted lots, fewer than 500 routes in the tested seed matrix, and bounded grid/candidate/grade loops. Lots and road bounds have chunk indices. Plans are built once per live world/worker, never per block or chunk. No travel-sized coordinate cache was introduced. Reconstructible navigation metadata includes lot/road IDs, entrances, elevations, archetypes and route ownership. The original NPCs consume the projected `CityPlan`. The city-life runtime adds finite population/activity metadata over it; the existing voxel search limits remain unchanged.

F3 adds district, road class, archetype, roof and facade to the retained terrain/region/reservation diagnostics. `World.inspectDistrict` and `metropolisPlan` expose read-only-by-convention planner context for debugging and profiling. The `npm run map:metropolis` diagnostic writes to temporary `test-results/`; structural tests, traversal, save/reload checks and measured mesh costs are summarized in `quality-assurance.md` and `performance.md`. Raw screenshots and profiles are not included in the public release.

## Reservations and conflicts

Eight accepted default reservations cover point, area, linear, waterfront, cliff, mountain and landscape types. Their original placement metadata remains unchanged. V3/v4/v5 retain their released terrain; v6 realizes all eight via the typed landmark registry. Red outlines on the older map show planning boundaries, not the detailed component geometry.

| Reservation | Geometry | Protected purpose / cave policy |
|---|---|---|
| `imperial-complex-reserve` | 128×56 area | Future large urban complex, 16-block foundation roof |
| `archaeology-reserve` | 120×120 area | Archaeological field, 16-block foundation roof |
| `ridge-fortification-reserve` | Long corridor, half-width 8 | Elevated linear landmark, 16-block roof |
| `harbor-front-reserve` | Radius-12 waterfront circle | Waterfront approach, adjacent water permitted |
| `cliff-grotto-reserve` | Cliff corridor | Cliff landmark, natural caves permitted |
| `mountain-temple-reserve` | Radius-16 circle | Protected scenic temple site, foundation roof |
| `scenic-landscape-reserve` | Radius-12 circle | Landscape site, natural caves permitted |
| `western-viewpoint-reserve` | Radius-8 circle | Point landmark / viewpoint, natural caves permitted |

Resolution sorts requests by descending priority then stable ID, tests candidates in declared order, and emits accepted/repositioned/rejected diagnostics with each failed candidate's reason. It never clips, mutates requests, changes a global RNG or searches according to chunk visitation. Stable coordinate-based subseeds and reservation IDs are reconstructible.

Panda Plaza, the original city, the river, harbor, major connection corridors, future district footprints, scenic terrain and the mine have explicit protection records. Crossings or shared approaches require the request's explicit compatible route/district/water/scenery policy; Panda, city and mine protections cannot be waived by those options. Reservations conflict using both exclusion margins. The city adapter checks complete parcel/eave bounds. Wilderness shrines and tree roots/canopies also respect reservations before they write voxels.

Circle/rectangle/capsule-union intersection is continuous geometric testing, not bounding-box-only acceptance. Terrain checks sample the full footprint on a maximum-16-block lattice, plus boundaries/anchor and corridor sides. This deliberately has a bounded resolution; it is not a terrain solver. At most 64 requests, 8 candidates per request and 1,024 terrain probes per candidate are allowed. Invalid numbers, duplicate IDs and excessive budgets fail closed; unsupported sites get explicit diagnostics.

Foundation policy suppresses natural cave carving within 16 blocks of a protected site's terrain surface. Harbor/river bed roof depth is 12. Ordinary terrain keeps the v3 seven-block roof. Deep cave fields, ore thresholds and basalt/marble depth behavior are preserved. Grotto/scenic requests can retain natural cave policy. The mine now has an explicit entrance/end/half-width/step-run descriptor and protected corridor; v5 realizes its city-to-entrance approach without changing the existing mine descent. This remains one mine, not a new mining progression system.

## Save and worker compatibility

At that point in the generator history, new worlds used generator 8. Existing v3–v7 worlds keep their stored base; v6/v7 can be copied explicitly into a separate denser v8 slot. Save format 1 and database `jade-harbor-engine-v1` remain unchanged. The exact numeric generator values 3, 4, 5, 6, 7 and 8 are accepted; all others are rejected. `Game.start`, `World`, the worker and `Game.snapshot` carry the stored version. Reset and damaged-component/checkpoint recovery retain it. Import/export and duplicate flows retain it too. A saved world's seed/generator cannot change through an ordinary write, including a full replacement; a different base requires a separate world ID.

Sixteen pre-change SHA-256 fixtures cover two seeds and origin/Panda, negative coordinates, secondary locations, mine and wilderness columns, including all Y layers. These frozen byte baselines protect the original generator from accidental changes. Shared writer changes retain zero-offset behavior; the fixtures guard that compatibility boundary.

The first Game save must write its full overlay, including imported edits that have no dirty revision. Only subsequent commits extend an existing checkpoint. This fixes the reproduced baseline first-save failure without allowing incremental writes to bypass checkpoint validation. Atomic transactions, expected revision checks, corruption rejection, pinning and capture/acknowledgement remain in force. Simulation neighbor enqueue excludes immutable bedrock and out-of-world coordinates, so immediate boundary-edit saves no longer depend on a later update tick to clean invalid work.

Worker requests/results include generator, epoch and ticket. Version mismatch, stale tickets, synchronous supersession, evicted requests and disposed-world results are rejected. The worker session and main generation share the same implementation. Serialization intentionally resets internal section revisions; parity compares voxel payloads, not transient in-memory counters.

## Cost and lifecycle

There is one macro/landmark plan per live v4/v5/v6/v7/v8 world and one per active worker session. A bounded convenience cache supports offline calls: at most four generator contexts and four numeric terrain plans. The legacy city cache still caps at six. No terrain-coordinate, chunk-result or query-history cache was added. `World.dispose()` drops its context, clears seed-associated convenience/legacy entries and terminates the worker. Cache presence never changes output.

Geometry is evaluated per column, not per voxel. Caves and ores still evaluate inside their existing Y loop. Generation streams normally; neither the city nor the whole world is generated at startup. The mine pass only runs for intersecting columns. Landmark realization never asks chunks to recursively generate neighboring chunks.

F3 now includes stored generator, region, reservation, slope/buildability, plan construction time and live plan count, alongside existing streaming, frame/tick, mesh, entity and memory metrics. Player location text uses readable geographic names. CPU and browser evidence are in `performance.md` and `quality-assurance.md`.

## Compatibility and extension boundaries

Keep v3–v7 reconstruction semantics stable. V5 was introduced because the new architecture changes the base beneath edit overlays. Seventy-eight pre-change v5 full-column SHA-256 fixtures supplement the twenty-four v4 and sixteen v3 fixtures. Future incompatible terrain/building changes require another explicit generator version or a justified migration.

Any future world extension should preserve the district, approach, cave, and landmark contracts. Preserve Panda, the ordinary districts and all eight realized destinations. The landmarks are fictional original interpretations; none claims historical reconstruction accuracy. Bounded NPC life and travel records are implemented in the runtime described by `city-life.md`. Quests, physical collectible progression, boat gameplay and a complete regional transport network remain outside the current release.

The renderer still has its original finite view radius, fog and vertical mesh deferral. A coherent macro plan does not provide distant-LOD mountains visible from every city street. Inspect the waterfront and ridge from their representative travel locations; the final render-only layer now supplies approximate distant terrain and selected skyline anchors.

### V5 compatibility details

The existing ten residents keep their jobs, schedules and navigation budget. V5 workplace assignment chooses a nearby entrance within 96 Manhattan blocks or a counter in the same building if the wider district gaps leave no suitable neighbor. V3/v4 assignment semantics are untouched. The original resident assignment semantics remain intact for older generator versions.

An ordinary south paifang at `(0, 304)` reuses the legacy gate geometry. Its open center joins the main avenue to the southern boulevard; its footprint is checked against all landmark margins and lots across 25 seeds. It is an ordinary city gate, not one of the eight landmark programs. Panda Plaza remains a separate exact legacy structure.

## Generator 6 landmark realization

[landmarks.md](landmarks.md) records the eight reservation-to-destination mappings, component order, public floor convention, new approaches, cave/water treatment, bounds and later roaming hooks. Macro connection `state` fields remain the frozen geographic planning metadata; the v6 realization plan records which reserved links now have physical structures. This preserves older worlds without maintaining a competing reservation search.

V6 is a composition over the exact v5 base, followed by saved overlays. Its geometry does not change existing metropolis planning, add unrelated settlements or tune final fog/LOD. The later living-city layer expands NPC behavior through a separate runtime, preserving generated columns. Downloadable release artifacts omit `docs/proof/`; this does not change the historical generator or saved-world contracts.

## Generator 7 street-density extension

[urban-density.md](urban-density.md) records the street-density extension. It composes the frozen v6 world with indexed district infill, real entry links, bounded support/stilt foundations and preserved intentional open spaces. Original v3–v6 builders and landmark reservations remain reconstruction contracts. New neighborhood/public-court circuits consume the combined metadata while the original 36 residents keep their exact v6 assignments. Existing saves do not silently change generators.

## Generator 8 dense fabric and cultivated landscapes

Generator 8 is the explicit new-layout boundary for packed blocks, physical building subfamilies, compact minor lanes and the generic-forest ceiling. It retains the macro terrain, original cave/ore/mine distributions, water/ridge/cliff topology and all eight landmark builders. Full approach metadata supplies service-settlement planning; it does not independently replace the landmark builder's physical grade/cut/deck realization.

The previous v7 semantic plan remains available for resident identity, but v8 fits disposable circuits to its actual widths/centerlines. Separate v6/v7 copies preserve source worlds and progress, with a safe arrival and one-time actor initialization for the changed layout. `urban-density.md` defines packing, anti-repetition, fixed street presence and the 12%-potential-woodland policy. Actual manual visual and real-time/travel acceptance lives in `quality-assurance.md`; the final renderer and Travel Journal extend presentation/navigation without changing these geometry contracts.

## Generator 9 regional conversion and safe exploration

The unchanged macro envelope and the complete v8 dense parcel/design plan remain the foundation. `regions/plan.ts` resolves bounded new reservation offers against the city, original landmarks and realized approaches, then builds grade-aware connections and chunk-indexed public ribbons. Semantic obstacles are indexed locally for contour search instead of scanning every city lot at each node. The new destinations occupy existing low-value space; no additional continent or larger map is introduced. `regions/land-use.ts` physically reduces generic trees through a strict 4%-potential mask and removes broad v8 crop-grid replacement. `metropolis/quality.ts` supplies supported roof/body realization. All new content is deterministic and saved overlays remain last.

The Travel Journal uses the actual world's destination registry, safe collision anchors and normal streaming readiness. Creative/Spectator have immediate access; normal modes derive unlocks from the existing discovery set. Generators 3–8 remain reconstructible and a separate copy is required for the new layout. The final atmosphere and distant representation are separate render-side consumers of this unchanged extension.

## Generator 10 architectural and city-life extension

Generator 10 preserves the generator-9 map envelope, parcel coordinates/entrances, occupied ground-body union, original landmark reservations, five regional destinations and under-five-percent generic forest policy. Architectural changes stay inside existing support pads and roof envelopes; regional support buildings share the new grammar while landmark-defining forms and public circuits remain intact. Generators 3–9 are frozen. See [architectural richness](architectural-richness.md), [purposeful city life](purposeful-city-life.md) and [Travel Journal](travel-journal.md) for the current extension and [testing results](quality-assurance.md) for acceptance evidence.
