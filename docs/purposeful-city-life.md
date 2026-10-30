# Purposeful city life — generator 10

Generator 10 improves visible work, commerce, visits and social activity while retaining all 4,080 existing resident IDs, the 96-active detail cap, 96-node navigation limit and 4,096-entity save cap. Appearance and activity plans are deterministic, lightweight metadata attached to existing residents. Travel reactivates that same population.

## Place-aware chains

`city-life/purpose.ts` selects short legs from the residents' authored public circuits. Collision validation remains mandatory at runtime. A resident alternates movement with a brief action at a shopfront, workshop, quay, post, pavilion, meeting point, viewpoint or doorway. Invalid/edited goals are skipped locally with bounded retries; no world scan, terrain edits, actor duplication or observer-relative placement occurs.

| District | Typical visible chains |
|---|---|
| Market | Browse → inspect → greet; stock → carry → unload; arrange → serve → restock |
| Hutong | Neighbor greeting/conversation; lane sweeping/checking; household shopping and doorway visits |
| Water Town | Bridge/viewpoint visits, canal shopping, tea service and quay conversation |
| Harbor | Warehouse/quay cargo work, stock inspection, dock commerce and guard posts |
| Imperial | Watch/check/observe patrols, attendant record checks and civic visitors |
| Artisan | Hammer/inspect/shape work, apprentice supply trips, pottery display and workshop maintenance |
| Scholar | Read/observe/study visits, pavilion maintenance and garden companions |
| Nightlife | Tea service, venue visits/conversation, shopping and lantern work; evening remains active |
| Highland / regions | Ridge watches, lookout visits, inn service, village/orchard work and local meetings |

Coarse schedule and active-set selection remain on the existing one-second cadence. Only the bounded active task set updates its local goals at five Hz, so a completed action moves naturally into its next short leg. Movement, door handling, local yielding and collision still use the existing fixed ticks and shared navigation queue. An action starts only after the actor physically reaches a validated supported goal; blocked-path labels do not count as completed work.

The original profession/time/weather schedules still govern work, home, evening and night availability. Guards remain present at night; commerce, harbor work, garden visits and nightlife do not all peak together. Social meeting keys permit pairs/trios; actors turn toward a nearby actual partner while meeting, then disperse along their chains. Not every resident belongs to a social group.

## Cheap visual distinction

Upper/lower garments, sash, hair/skin tones, headwear, slight proportions and work aprons vary through independent stable hashes. Five headwear forms and role props make guards, porters, shoppers, keepers, scholars and artisans legible. Reaching, arranging, hammering, sweeping, greeting, conversation, reading, sipping and watch gestures use the existing box vocabulary. Walking phases are staggered.

All detailed residents share one box geometry, one instanced mesh and per-instance colors. No per-resident material or mesh asset is created. The fixed instance capacity accommodates at most 24 pieces per legacy-cap civilian; generator 10 still renders at most 96 detailed residents. Passive and distant identities remain logical.

## Compatibility and evidence

The durable simulation marker is 5 for generator 10. Marker 4 remains accepted for a copied generator-9 component, without adding/resurrecting residents. Original professions, trades, IDs and saved actor state survive; short activity phases/routes are disposable caches. Older generators retain their released population/appearance path.

Visible activity is evaluated through completed role actions, moving/acting/idle ratios, role and appearance diversity, and 60–90-second fixed-camera browser observations. CPU comparisons use the same seed, destinations, times, actor/detail limits and actual physics. Browser classification includes only projected, opaque-voxel-visible actors; a majority must be physically moving or visibly performing a place-aware action. Exact results and limits are in [testing results](quality-assurance.md) and [performance](performance.md). This is ambient city life, not a quest or economic simulation.
