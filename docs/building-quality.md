# Building quality and structural variation

Generator 9 keeps generator 8's complete parcel plan, building design choices, family distribution and occupied-volume footprints. Irregular setbacks, height changes, corner wings, courts, split fronts, stepped forms and mixed roof grammars remain. Density is not reduced to simplify the renderer.

The released roof grammar allowed raised halves of split/stepped roofs to begin above the wall top without a deck or clerestory. The new assembly planner records every roof piece's body support elevation and eave elevation explicitly. Raised pieces receive a supported deck and perimeter walls. Adjacent roof sections share their join, and a short wing's roof is clipped against taller building bodies so tiles do not slice through a neighboring facade. Body shells use the union of occupied volumes to avoid duplicate interior facade fragments. Balconies receive timber corbels, courtyard lintels receive posts, and narrow windows remain bounded by real wall bays.

Planning validates integer body bounds, minimum roof dimensions, storeys and support levels once. The indexed per-chunk writer realizes those plans without a world-sized voxel bake or per-frame architectural scan. New regional buildings use complete perimeter beams, connected eaves, supported foundations and explicit entry paths. Roof variation remains physical geometry rather than color variation alone.

The regression suite checks the unchanged dense parcels/designs, supported raised roofs, safe entries and public activity targets. Automated checks supplement direct street, elevated and district review. They cannot certify every possible user edit or every arbitrary seed visually. Generators 3–8 retain their released world geometry.

## Generator-10 architectural and city-life integration

Generator 10 preserves the generator-9 map envelope, parcel coordinates/entrances, occupied ground-body union, original landmark reservations, five regional destinations and under-five-percent generic forest policy. Architectural changes stay inside existing support pads and roof envelopes; regional support buildings share the new grammar while landmark-defining forms and public circuits remain intact. Generators 3–9 are frozen. See [architectural richness](architectural-richness.md), [purposeful city life](purposeful-city-life.md) and [Travel Journal](travel-journal.md) for the current extension and [testing results](quality-assurance.md) for acceptance evidence.
