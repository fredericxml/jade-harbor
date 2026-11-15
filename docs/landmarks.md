# Authored landmark program

The sole world generator, [`generator.ts`](../src/world/generator.ts), plans eight fixed landmark destinations and their approach routes before constructing chunks. They share one macro landscape with the city and regional plans.

| Landmark | Location and purpose |
|---|---|
| Vermilion Court Palace | Northern ceremonial court and axial public route |
| Ridge Wall | Graded historic ridge approach and accessible wall walk |
| Terrace Excavations | Research hall, protected pits, viewing rims and descent |
| Harbor Guild Beacon | Shorefront landmark, plinth, tower decks and promenade |
| Cloudstep Sanctuary | Mountain approach, court, hall and overlook |
| East Cliff Chambers | Cliff-attached grotto and public terrace |
| Reed Moon Garden | Western pond, causeway, pavilion and walking paths |
| Western Lookout Pagoda | Upper-floor lookout and supported interior stair |

Landmark reservations protect the intended footprints against ordinary lots and landscape realization. Approaches use deterministic grading, supported decks and local clearance without rebuilding entire mountain or river formations. Builders operate on one requested column at a time; saved block edits remain authoritative over generated voxels.

Implementation: [`landmarks/plan.ts`](../src/world/landmarks/plan.ts), [`landmarks/builders.ts`](../src/world/landmarks/builders.ts), [`landmarks/routes.ts`](../src/world/landmarks/routes.ts). Related systems: [regional destinations](regional-destinations.md), [Travel Journal](travel-journal.md), [world plan](world-plan.md).
