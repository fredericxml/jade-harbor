# Architectural richness — generator 10

Generator 10 expands street-silhouette and facade variety without enlarging the map or reducing density. `generator-v10.ts` consumes the retained fabric and geography contracts, then uses `metropolis/richness.ts` and the version-specific regional builder. Generators 3–9 and their generation dependencies remain frozen.

## Protected ground plan

Every generator-9 lot ID, boundary, entrance, base elevation, access road and roof envelope remains unchanged. The complete occupied ground-body union is retained, including courts and existing public/private aisles. New compositions subdivide that union into connected floor volumes; they never buy variety with an empty parcel or a larger setback. Existing Panda, gate, eight original landmarks, regional reservations, Tulou monument, route grades and contextual former-forest landscapes remain protected.

## Built variation

| Dimension | Realization |
|---|---|
| District subfamilies | Six named local uses per district select built frontage relationships |
| Composition | Hall, rear rise, corner tower, split height, terraced body, side wing, gate house and pavilion wing |
| Height | District-appropriate one/two floors; commerce up to three and nightlife up to four; partial heights follow supported subdivisions |
| Roof | Gable, hip, clipped, layered, offset, cross, pavilion, split ridge, terrace and quay eave, filtered by district |
| Ridge and span | Independent axis, controlled rise/eaves; broad slopes divide into bays of at most 18 blocks; profiles taper fully to their ridge |
| Facade | Paired lattice, ribbon, shutters, timber grid, stone base, arcade, screen and recessed bays; independent bay spacing/rhythm |
| Street relationship | Flush, shop canopy, arcade, recessed porch, framed gate and double shop, with wall-bound signs and supported projections |
| Palette and corners | Controlled plaster/timber/stone/roof choices, restrained trim, corner piers and beams; no per-voxel random noise |

Body-union wall tests suppress internal seams. Roof writes clip against taller body volumes. Layered roofs have a real supported deck/clerestory, and shifted ridges have a complete support plate. Balconies tie into their floor/wall beams. Entrances retain the original clear central aisle; facade attachments require an actual wall/beam behind them. The per-chunk writer clips all output to the requested column.

A sorted, spatially indexed selection tries at most 20 deterministic candidates per lot. Repeated roof/axis/height combinations receive a strong neighborhood penalty; composition, facade and frontage repeats also lose weight. Lot coordinates, seed and independent salts determine every choice. Worker order, frame timing and `Math.random` play no part.

## Measuring emitted design variety

Variety is measured through emitted voxel geometry, not file count, renamed templates, or color-only changes. A controlled witness fixes one generator-9 building's lot, massing, height, palette, and roof family, then renders 64 combinations of ridge axis, facade, and frontage. At least 25 complete voxel outputs must differ; unused settings do not count. Whole-map checks also measure district feature coverage, height distributions, nearest-neighbor coarse repetition and retained occupancy. The exact observed witness and before/after results are in [performance](performance.md).

Every building in the reference city is audited independently by a six-neighbor flood from its foundation, including roof/decorative attachments. Three-seed parcel/ground-union and compatibility checks, chunk-order/worker comparisons, and street/elevated visual review complement that audit. The numerical witness alone is not a claim that human perception has an exact 25× scale. Visual acceptance still requires a dense, coherent Chinese-inspired city with visibly richer streets.

Regional support buildings use the same grammar inside their original pads. The Tulou ring, other landmark-defining forms, public loops and landscape features retain the generator-9 realization. Existing generator 9 saves acquire new geometry only through an explicit separate generator 10 copy.


## Generator-10 emitted-design coverage

The matched CPU profile records realized design axes for every city lot. Each version uses the same parcel plan; v10 preserves occupied ground-body unions, entrances and reservations. Three-seed source assertions separately check coverage and full packed-column reconstruction.

| District | v9→v10 roof grammars | v9→v10 massings | v9→v10 facade grammars | v9→v10 frontages | v10 coarse shapes | v10 exact nearest-pair duplicates |
|---|---:|---:|---:|---:|---:|---:|
| heritage | 6→8 | 8→8 | 4→8 | 4→6 | 70 | 0/53 |
| market | 6→8 | 5→8 | 3→8 | 3→6 | 87 | 0/64 |
| hutong | 6→5 | 8→8 | 2→8 | 3→6 | 47 | 0/36 |
| water-town | 6→8 | 8→8 | 3→8 | 3→6 | 82 | 0/58 |
| imperial | 6→5 | 6→8 | 2→8 | 3→6 | 40 | 0/30 |
| harbor | 6→5 | 6→8 | 3→8 | 3→6 | 34 | 0/24 |
| artisan | 6→8 | 7→8 | 3→8 | 3→6 | 43 | 0/25 |
| scholar | 6→8 | 8→8 | 2→8 | 3→6 | 55 | 0/35 |
| nightlife | 7→6 | 7→8 | 4→8 | 4→6 | 47 | 0/30 |
| highland | 6→8 | 7→8 | 2→8 | 3→6 | 53 | 0/36 |

Coarse-shape fingerprints describe roof grammar/axis, floor count and facade grammar; they intentionally ignore raw random seeds. Exact physical-design fingerprints include body/roof pieces and design details. These counts are structural evidence, not a substitute for paired street-level review.
