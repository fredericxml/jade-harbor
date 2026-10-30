# Dense urban fabric — retained generator 8 architecture

This document preserves the generator 8 dense-fabric implementation and its historical design/validation contract. It is not the current generator specification: new worlds in Jade Harbor v2.0.0 use generator 10, generators 3–9 remain frozen, and the current generic-forest policy is below 5% in the accepted macro envelope. The generator 9 and 10 continuations are summarized near the end of this document and in `world-plan.md`, `feature-matrix.md` and `quality-assurance.md`.

## Historical generator 8 ownership and compatibility

The following section records the generator 8 release behavior. It is retained for old-save reconstruction and compatibility; it does not describe the v2.0.0 new-world default. New worlds use generator 10. Generators 3–7 retain their released reconstruction implementations. **Create denser city copy** is offered for v6/v7 and creates a separate v8 ID with the same seed, edits, inventory, achievements, health/trade progress and simulation. The source stays available. The player's arrival/spawn resets to Panda; existing NPC identities receive their new layout's authored routine positions once, because a widened building may occupy an old sidewalk. An initialized v8 reload preserves positions normally. This explicit layout-copy step is distinct from live schedule catch-up.

Database and save format remain 1. Normal writes cannot change a world's seed or generator. The optional target-7 copy API preserves the previous v6-to-v7 behavior for compatibility tests; the current menu creates v8. Old worlds are never silently rebuilt beneath saved edits.

## Packing and street composition

`metropolis/fabric.ts` retains the old semantic plan separately, then builds one bounded v8 fabric plan. Existing parcels expand symmetrically across their frontage and into usable rear/front gaps. Real one-block architectural envelopes replace oversized v7 buffers. Front expansion is forbidden across a graded entrance ramp. The central ground-floor aisle remains clear, retaining old home/work positions inside the changed assemblies.

Minor lanes use compact widths. A minor corridor paralleling a major road within ten blocks can join it only when orientation and grade agree; this removes duplicate paved strips. Major boulevards, civic axes, canal bridges, quays and hill roads keep their functional clearances. Entry links are reconnected to actual doors. Adaptive narrow/wide frontage passes and remaining block-interior offers must connect to a clear existing route. Full landmark approaches can support service settlements beyond their reserved corridor, rather than proposing every building inside that reserve and rejecting it.

The search caps at 120,000 offers and 2,000 total parcels, with at most seven blocks of cut, ten of fill and a 38-block entry link. Local indices reject parcel, road, canal, geographic connection, landmark reservation/component and intentional-space conflicts. Terrain probes bound foundations; waterfront buildings may use supported decks/stilts. No neighboring chunk generation, map-sized voxel bake or render-time random selection occurs.

Protected space has a named function: Panda's monument/court and narrow arrival axis, the imperial procession and the working quay apron. A remaining accidental paved void is a defect, not a new plaza designation. The density audit compares accepted area, actual building-volume projection, nearest gaps and street frontage. These are engineering diagnostics; only actual views can establish the packed-city target.

## Physical architectural variation

`metropolis/variety.ts` selects a district subfamily together with massing, floors, roof, bay rhythm, wall/tile accents, recess, signs and balcony treatment. Neighbor penalties consider complete combinations, not color alone. Choices are deterministic and independent of chunk order.

| District | Physical subfamilies and composition |
|---|---|
| Heritage / avenue | Civic shophouses, lane merchants, arcades, courtyard inns and corner tea houses framing Panda |
| Market | Narrow stall houses, deep merchants, corner blocks, arcades, merchant courts and stepped inns |
| Hutong | Lane houses, small courts, paired residences, gate compounds and corner homes |
| Water Town | Canal shops, bridge tea houses, water courts, waterside inns and timber merchants |
| Imperial | Service courts, attendant homes, formal townhouses, gate lodges and ceremonial compounds |
| Harbor | Tall loading warehouses, guild houses, dock offices, merchant rows, waterfront inns and workshop sheds |
| Artisan | Pottery courts, kiln workshops, carpenter houses, metal workyards and artisan rows |
| Scholar | Garden residences, refined townhouses, open pavilion courts, inns and affluent compounds |
| Nightlife | Tea arcades, lantern inns, food shops, roof terraces, corner commercial buildings and merchant courts |
| Highland | Terrace residences, stair shops, cliff inns, overlook courts and guard lodges |

Assemblies combine street bars, rear/side wings, split fronts, stepped volumes and several courtyard/workyard layouts. One/two-storey low districts contrast with taller commercial streets and occasional four-storey nightlife buildings. Gabled, hipped, half-hipped, double, split, stepped and selected terrace roofs change actual voxel silhouettes. Warehouse loading openings, arcades, open pavilion wings, workshop chimneys/courts, windows, balconies and signs provide visible use. Large compounds scale their wing/rear depth with the parcel and may include a middle hall, retaining an open walking axis. An empty courtyard rectangle is not counted as a full building.

The new generator writes these assemblies directly over the retained geographic/geological contracts, then realizes the unchanged landmark components and finally applies saved overlays. Full virtual approach metadata does not flatten or cut the terrain independently of the actual landmark route builder.

The regression floor below measures the union of actual assembly-volume footprints, clipped to each district's bounds and excluding empty courts. It is conservative about roof overhangs, and the gross denominator includes streets, protected open spaces and water. Harbor's water-heavy footprint therefore has a different floor. Three seeds must meet these floors; they do not replace visual acceptance.

| District | Minimum gross building-volume projection |
|---|---:|
| Heritage | 35% |
| Market | 42% |
| Hutong | 40% |
| Water Town | 36% |
| Imperial | 32% |
| Harbor | 20% |
| Artisan | 42% |
| Scholar | 35% |
| Nightlife | 45% |
| Highland | 28% |

## Visible activity policy

The finite plan retains all released v7 identities and adds permanent frontage addresses, grade landing ends, junction/public meeting nodes and eight more visitors per site. It caps at **4,000 residents and 96 detailed actors**. Registry size alone is not success: major street views should normally show roughly 10–24 moving/occupied people, with stronger avenue/Panda framing and smaller meaningful groups at remote landmarks. Walls, camera direction, time, weather and interiors affect visibility; the fixed real-time matrix records those conditions explicitly.

Original addresses are resolved before v8 streets move. Disposable route points then fit the new widths/centerlines without renaming identities. Additional addresses are fixed to accepted buildings and actual public routes, never to the player's position. Shared-node reservations receive their roles before the remaining population is fairly distributed over ordinary streets. Two pairs at one node use separated meeting positions. Ordinary street addresses receive the four basic work/customer-or-through/local/social roles in the measured primary plans. Civic ceremonial frontage, hill streets and working quays reserve six local roles per address before optional lane extras; shared nodes retain their eight-role reservation. Stable hashed allocation spreads the remaining street roles across districts rather than filling the first alphabetical district. Twenty-four permanent Panda-court visitors/attendants/guards use the clear monument perimeter, outside planting, benches and the plinth; guild-beacon visitors also use its actual side walkways.

The 96-actor selection prioritizes candidates within twelve blocks, then prefers public road/entry/court occupants over farther hidden interiors. It uses indexed address geometry, never camera orientation or an on-screen visibility score. Ordinary movement, interaction and physics still determine every rendered position. A nearby Panda also completes its four body/plinth columns through the existing four-request/eight-pending stream budgets; leaving the area releases that small feature reservation. Other streaming radii and distant rendering are unchanged.

| Role / area | Visible routine |
|---|---|
| Merchants and customers | Actual shop entries/counters, short commercial repositioning and visits to two nearby shops with brief pauses |
| Harbor workers | Crate-carrying entry-to-quay work loops, loading pauses and circulation near warehouses |
| Artisans | Workshop/court stops, work poses/tools and short street-facing loops |
| Residents | Home/entry/lane circulation, neighbor pairs and time-shaped return home |
| Guards | Gate/street/wall patrol legs, purposeful pauses and resumed watch |
| Scholars / visitors | Book-carrying strolls, pavilion/public stops and supported landmark interior/viewpoint visits |
| Nightlife | Later-opening shops and stronger evening commercial/social use |

Workers complete their short public delivery loop before returning through the entry. A mixture of short local circulation and medium through routes supplies nearby continuity; retained home/work and landmark itineraries supply longer travel. Speeds and stop timing vary by role. New circuits pause at meaningful indexed stops, rather than idling at every intermediate road point. Existing fixed-tick physics, two-part doors, supported player avoidance and local yielding move actors. The shared navigation budget remains 96 expanded nodes / nominal 2 ms per tick, with the original 2,400-node search and 128-cost limits.

The shared clock retains six phases, early harbor/later commercial work, home return and night watch. Actual dock workers return home after their shift; general public circulation uses resident schedules, so unrelated pedestrians do not all disappear with the dock shift. Rain sends optional social pairs to real shelter while work/patrol/circulation continue. Named events remain one nearby pair/trio using existing identities. A single reusable civilian render batch covers active residents and retains the full old 256-actor component capacity; Panda and spirits retain their original models.

Far actors advance logically. Catch-up can reposition only an unloaded actor more than 96 blocks away at a validated loaded anchor 24–80 blocks away. Loaded visible actors do not teleport. There is no continuous off-screen physics, missed-tick replay or player-created crowd pool.

## Generic forest ceiling and cultivated surroundings

`geography/land-use.ts` partitions world space into 40×40 cells. Every complete 400×400 supertile contains exactly twelve potential woodland cells out of one hundred, selected by a stable seeded permutation. This gives a **12% potential generic-forest upper bound**, below the user's 15% ceiling, for every seed and negative coordinate. Water, city and protected scenic eligibility can only reduce actual wild coverage. Wild tree trunks and complete canopies must fit inside the allowed mask.

The documented measurement samples all overworld surface cells in the primary experience region, including water; it also reports potential woodland, actual eligible woodland, dry-land fraction and every land-use class. This is a declared deterministic land-use proxy, not a tree-trunk count or a claim to enumerate an infinite world. Complete supertile quota tests enforce the global policy independently of a favorable city-only sample.

Nonforest land becomes contour-following irrigated rice plots, regularly planted orchards with broad rows, managed meadow/path boundaries or appropriate rocky/ridge/scenic ground. Existing farms, routes, water, buildings and landmark landscapes retain their ownership. Courtyard trees, planted orchard rows and curated landmark greenery are intentional managed vegetation; arbitrary random woodland is not relabeled as a garden. This work changes the surface composition without removing the original caves, ores, ridge/cliff/river topology or mine.

## Persistence and validation

V6 uses marker 1 and the old 256-entity limit. V7 uses marker 2 and its 1,024 limit. V8 accepts initialized earlier components and writes marker 3, with a 4,096-entity validator ceiling covering its finite residents plus Panda/hostiles. A v7 copy adds only new `inhabitant:` identities; it does not recreate missing old residents. A v6 copy adds the new neighborhood/visitor extension once. Marker 3 prevents later removed new identities from returning. An explicit empty component remains empty. Drops and achievements retain their old caps.

`test:urban-fabric` covers three-seed packing/support/protection, physical design families, all loading orders, negative-tile forest quotas, every actual home/circuit goal, retained identities, actual movement, concentrated activation and explicit-copy persistence. `test:urban-life:browser` observes all ten districts/Panda, eight landmarks and saved rain/evening revisits for 60–90 **real** seconds. `test:urban-travel:browser` uses continuous real-input walking/flight. `test:urban-fabric:browser` supplies two-seed elevated district/settlement views and matched v7/v8 land-use views. `profile:urban-fabric` measures matched generation, simulation, repeated travel and disposal separately from browser rendering.

V7's additive density module and its 960/48 policy remain available unchanged for existing saves and independent regression tests. This release preserves the generator 8 reconstruction contract, but raw proof images/reports are not distributed. The public release archive excludes `docs/proof/`, temporary images/reports, logs, dependencies and caches. Current release verification and remaining software-rendering limits are summarized in `quality-assurance.md` and `performance.md`; this historical guide preserves the generator-8 design contract.

## Retained generator 9 continuation

The entire v8 parcel, design and occupied-volume plan is retained unchanged. V9 corrects physical roof/body support and shared seams through `metropolis/quality.ts`, preserving the protected density, organic alignment, district families and physical variation. All 4,000 identities remain and 80 regional hosts/visitors extend the same 96-active architecture. The woodland policy is now a strict 4%-potential mask with actual coverage below 5% in accepted samples, and broad field replacement is removed. New regional destinations and Travel Journal arrivals use the existing map footprint. See `building-quality.md`, `regional-destinations.md`, `travel-journal.md` and the historical generator-9 QA/performance record. Earlier v8 policy values remain the reconstruction contract for v8 saves.

## Generator-10 architectural and city-life extension

Generator 10 preserves the generator-9 map envelope, parcel coordinates/entrances, occupied ground-body union, original landmark reservations, five regional destinations and under-five-percent generic forest policy. Architectural changes stay inside existing support pads and roof envelopes; regional support buildings share the new grammar while landmark-defining forms and public circuits remain intact. Generators 3–9 are frozen. See [architectural richness](architectural-richness.md), [purposeful city life](purposeful-city-life.md) and [Travel Journal](travel-journal.md) for the current extension and [testing results](quality-assurance.md) for acceptance evidence.
