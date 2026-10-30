# Landmark realization and compatibility

The original landmark realization was introduced in generator 6 on top of the earlier metropolis and eight protected reservations. These are original fictional interpretations of Chinese architectural and landscape composition, not historically accurate or one-to-one reconstructions. Later generator 9 and 10 layers retain these landmark cores while adding regional destinations and the final city presentation. No exact historical replicas are claimed.

## Destinations and geography

Coordinates below are the default `jade-harbor` seed. The reservation IDs, anchors and macro connections remain authoritative across seeds; contours and approach routing can vary.

| Reservation | Realized destination | Anchor X, Z | Public floor level | Composition |
|---|---|---|---:|---|
| imperial-complex-reserve | Jade Palace | 0, −430 | 35 | Outer gate, forecourt, inner gate, ceremonial court, raised principal hall, side halls and rear hall inside an enclosure |
| ridge-fortification-reserve | Northern Ridge Wall | 160, −633 | Terrain-following | More than 500 blocks of ridge alignment, crenellated wall walk, seven roofed guardrooms and a stepped entry |
| archaeology-reserve | Terrace Excavations | −530, 160 | Rim 27 / pits 21 | Two excavations, abstract terracotta formations, viewing rims, pit descent, partial protective canopy and research hall |
| harbor-front-reserve | Harbor Guild Beacon | 200, 349 | 20 | Supported stone plinth, tapered merchant tower, upper public decks, north approach and linked promenade |
| mountain-temple-reserve | Cloudstep Sanctuary | −660, −250 | 76 | Trail gate, lower court, stepped main hall, retaining terrace and an overlook |
| cliff-grotto-reserve | East Cliff Chambers | 620, −430 | 44 | Two shallow carved chambers, abstract niches, cliff-attached facade and a protected terrace |
| scenic-landscape-reserve | Reed Moon Garden | −735, −250 | 75 | Lined pond, stepped causeway, pavilion, rock composition and planted edge |
| western-viewpoint-reserve | Western Lookout Pagoda | −660, −325 | 75 | Compact three-tier lookout, interior half-step stairs and an upper public floor |

The palace uses its actual 128×56 reservation rather than expanding into the old Imperial Quarter. The wall uses the accepted ridge corridor rather than an arbitrary straight alignment. The harbor icon fits the small shoreline point reservation and leaves the working docks around it. Archaeology retains open heritage land. The three western destinations form a sanctuary/landscape/lookout group with different silhouettes and roles; they are not three interchangeable temples.

## Version and ownership boundary

Generator 6 composes `createV5Generator()` with a finite realization plan. V3, v4, v5 and the v5 metropolis modules remain frozen. The 78 pre-change v5 full-column fixtures were captured before incompatible generation was enabled; the older sixteen v3 and twenty-four v4 fixtures remain unchanged.

The shared generation protocol still owns one seed/version context per worker session and rejects stale version/epoch/ticket results. The World applies saved deltas after the complete generated column, so removing a palace wall or editing a grotto floor remains authoritative. Reset retains stored generator identity; ordinary writes cannot reinterpret a v5 save as v6. The database and save-format version remain 1.

The root context owns one macro/reservation/metropolis graph plus one new realization plan. There is no second reservation search or global mutable landmark registry. World disposal drops the context and all its landmark references. The existing convenience generator cache remains capped at four contexts.

## Modules and realization order

| Module | Responsibility |
|---|---|
| landmarks/types.ts | Stable landmark/reservation IDs, component variants, public positions and plan ownership |
| landmarks/registry.ts | Eight destination mappings, regional roles and project-native palettes |
| landmarks/routes.ts | Rasterization, half-step profiles, ridge adherence and bounded terrain-contour search |
| landmarks/plan.ts | Reservation-backed site composition, connection integration and per-chunk component references |
| landmarks/builders.ts | Chunk-clipped foundation, hall, gate, tower, excavation, grotto, garden and ribbon realization |
| generator-v6.ts | Frozen v5 base followed by the new layer, before World overlays |

Planning stores small component descriptions and route nodes, not all world voxels. Components are sorted by explicit phase and stable lexical ID. Pads precede regional paths; wall mass and excavations precede internal stairs; shells, roofed rooms and static figures follow. The ridge-entry stair explicitly cuts a walkable opening through the wall cap. This avoids a higher wall floor closing an otherwise valid arrival.

Each requested chunk uses only its indexed component references. Route and wall surfaces choose the nearest local centerline before writing a column, preventing overlapping segment caps from producing inconsistent steps. Roofs, railings and foundations are included in the index bounds. No builder generates neighboring chunks or scans the complete wall during chunk realization.

## Route integration

| Destination | Primary normal-player approach |
|---|---|
| Palace | Existing northern avenue → missing imperial-axis link → outer gate → courts → principal-hall stair |
| Ridge wall | Existing highland switchbacks → bounded contour trail → first guardroom → continuous wall walk |
| Archaeology | Existing outer archaeology road → heritage forecourt → viewing rims/research hall → optional pit descent |
| Harbor beacon | Existing split north quay → reserved harbor approach → beacon passage; east quay joins the promenade |
| Mountain sanctuary | Archaeology-road branch → foothill contour trail → western scenic plateau → gate and hall steps |
| Grotto | Existing eastern crossing anchor → supported pedestrian river crossing → cliff-approach connection → terrace and chambers |
| Scenic garden | Sanctuary-side trail → short landscape link → pond/causeway/pavilion |
| Western lookout | Sanctuary-side branch → quiet hillside path → lookout entry and interior stairs |

The eastern crossing is a pedestrian access structure needed to reach the cliff, not a vehicle or boat system. Trails clear only their narrow public headroom and support their floors. Decks over natural water retain water beneath and use regular support piers. No mountain range, river or harbor is globally re-sculpted.

Direct authored alignments are retained where their grade fits. When a direct route would require a deep trench, a temporary deterministic contour search uses bounded four-block grids, two search widths, at most 65,536 cells and 16,000 queue visits per attempt. It avoids unrelated reservations and ordinary lots. The search runs once during planning and is discarded; it is unrelated to NPC A* or per-frame navigation.

Four-neighbor rasterization and loop erasure remove grid-snap backtracks before grading. Half-block quantization and fixed endpoints produce usable risers. Existing highland street cuts remain part of the frozen base; connecting to one can have a larger natural-ground difference than the new trail itself. Default maximum raw route cut is 12 blocks and maximum raw fill is 21.5, including the supported elevated river crossing. These are local ribbons, not broad terrain flattening.

## Public geometry conventions

Public position `y` values denote the surface's block level, like a city lot's `baseY`; ordinary feet are at `y + 1.002`. Half levels use a slab above the integer foundation. Actual collision/support is authoritative, not the metadata alone. Tests sweep the complete approaches and wall walk using `standAt`/`traversable`, and use real player stepping for representative gates, stairs and both public tower interiors.

Watchtower guardrooms retain the graded wall floor instead of replacing it with a flat platform. Canopy posts reach the excavated floor. Pit floors and chamber floors/ceilings receive bounded support. The grotto preserves natural geology outside its shallow carved chambers and selected terrace; it does not globally suppress caves.

## Composition and later hooks

The dominant spatial forms are an axial palace, a continuous ridge line, excavated fields and a shoreline beacon. The smaller sanctuary, cliff chambers, pond landscape and lookout reinforce their regions. Ordinary city, forest, hills and water remain between major anchors. No extra optional landmark cluster or modern skyline was added.

Public entries, courts, lookout floors, wall paths and chamber spaces are static hooks for later roaming work. They do not implement collectibles, quests, guided tours, crowds, expanded professions or schedules. Most interiors remain selective and sparsely furnished.

The existing renderer still has finite distance, fog and vertical section deferral. A high camera can defer the low terrain directly below it while the intended ridge landmark remains rendered. Visual readiness therefore checks actual geometry at the selected target and drained generation/mesh/lighting work. It does not force a distant-LOD or atmosphere change. See [quality-assurance.md](quality-assurance.md) and [performance.md](performance.md) for executed evidence and limits.

## Release packaging

The public v2.0.0 repository archive intentionally excludes `docs/proof/` and temporary screenshots. This is a packaging choice only: the game, build and documented QA results do not depend on that directory. The historical implementation and validation summaries remain described in this document and `quality-assurance.md`; raw proof assets are not part of the release.


## Resident activity and landmark discovery

The v6 geometry above is unchanged. The living-city layer derives one appropriate local role per destination, public activity candidates and walking discoveries from these same entries/public spaces/viewpoints. Researchers use excavation/cliff public areas, attendants use the palace court, a guard uses the first ridge section, and caretakers/scholars use the western destinations. Harbor/pagoda upper floors remain actual traversal destinations. No questline, added structure or dense landmark crowd is introduced. See `city-life.md` for schedule, navigation and persistence ownership.

## Complementary regional destinations

Generator 9 retains the eight released landmark cores and adds five coherent regional precincts within the same map envelope. Willow Valley Tulou, Amber Gate Village, Li River Stone Walk, Mist Terrace Tea Village and Lotus Causeway Gardens own separate reservations, local buildings/landscape, public loops and physical approaches. Existing city/lot/landmark reservations win conflicts; eastern connections originate on the existing east bank. These complement the palace/wall/excavation/grotto program rather than duplicating it. The same journal lists explicit safe arrivals for the original and new destinations. See `regional-destinations.md`; old worlds retain their original landmark geometry.

## Generator-10 integration

Generator 10 preserves the generator-9 map envelope, parcel coordinates/entrances, occupied ground-body union, original landmark reservations, five regional destinations and under-five-percent generic forest policy. Architectural changes stay inside existing support pads and roof envelopes; regional support buildings share the new grammar while landmark-defining forms and public circuits remain intact. Generators 3–9 are frozen. See [architectural richness](architectural-richness.md), [purposeful city life](purposeful-city-life.md) and [Travel Journal](travel-journal.md) for the current extension and [testing results](quality-assurance.md) for acceptance evidence.

## Final renderer and Journal

The geometry/identity contracts above remain unchanged in generator 10. The final Journal retains every discovery while grouping travel into 18 area hubs; nearby landmark/walk POIs share their district or meaningful outlying area. Atmosphere and approximate distant terrain/selected anchor silhouettes are separate render-only systems. They never alter this world's blocks, routes, resident registry, forest policy or saved edits. See [Travel Journal](travel-journal.md), [atmosphere](atmosphere.md) and [distant world rendering](distant-world.md).
