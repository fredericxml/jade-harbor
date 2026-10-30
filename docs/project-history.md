# Project history

Jade Harbor began as a playable browser voxel sandbox and evolved into a city-first world with a distinct Chinatown identity. This history records the major product and engineering decisions that shaped the `2.0.0` release. Current behavior and implementation details are documented separately in the architecture, feature, compatibility, and quality references.

## 1. Playable voxel foundation

The original foundation established deterministic terrain and chunk generation, first-person movement and collision, mining, block placement, inventory, local saves, and a TypeScript/Three.js rendering stack. This provided a working simulation that could be evaluated through actual play rather than isolated interface demonstrations.

The first public release established the project name, core controls, persistence model, and a stable browser-based sandbox.

## 2. Chinatown-first world identity

The generic world concept was reshaped around a dense procedural Chinatown metropolis. The city gained connected streets, markets, courtyards, waterfronts, lanterns, jade-and-terracotta architectural language, and Panda Plaza as its central landmark.

The design direction became city-first: the metropolis is the primary playable environment, while mountains, rivers, ridges, cliffs, and regional scenery provide a coherent setting around it.

## 3. Versioned geography and world compatibility

The world-generation system evolved through explicit generator versions rather than silently changing the terrain beneath existing player edits.

- **Generator 3** preserves the original terrain and city reconstruction path.
- **Generator 4** introduced a shared geographic plan for the primary city, harbor, river, ridges, passes, cliffs, and surrounding terrain.
- **Generator 5** added the ten-district metropolis plan, roads, accepted building lots, graded access, and district-specific architecture.
- **Generator 6** added eight reservation-backed landmark programs and their public approaches.
- **Generators 7 and 8** expanded district infill, dense urban fabric, building assemblies, street occupation, and cultivated surroundings.
- **Generator 9** added five regional destinations, the reduced generic-woodland policy, and the unified discovery/travel model.
- **Generator 10** expanded physical building variation and purposeful resident activity while preserving the established map envelope, parcel boundaries, landmarks, and saved-world compatibility.

Each incompatible world-layout change received a new stored generator identity. Older generator implementations remain available for reconstruction, and updated-city copies are explicit, separate saves.

## 4. Landmarks and regional destinations

Eight original landmark programs were realized within protected geographic reservations: Jade Palace, Northern Ridge Wall, Terrace Excavations, Harbor Guild Beacon, Cloudstep Sanctuary, East Cliff Chambers, Reed Moon Garden, and Western Lookout Pagoda.

Five regional destinations were then placed within the existing world envelope: Willow Valley Tulou, Amber Gate Village, Li River Stone Walk, Mist Terrace Tea Village, and Lotus Causeway Gardens. Each destination has a public circuit, supporting buildings, a safe approach, and a stable discovery identity.

These locations are original Chinese-inspired interpretations. They are not presented as exact historical replicas.

## 5. Dense urban fabric and architectural variety

The city was refined without enlarging the map or trading density for visual variety. Building plans retain their accepted parcel boundaries, entrances, roads, public spaces, and occupied ground footprints. Variation comes from different massings, roof grammars, ridge directions, facades, frontage relationships, and district-specific compositions.

Structural checks cover roof support, connected assemblies, facade attachments, foundation contact, parcel bounds, chunk-order determinism, and compatibility with older world versions. The current generic woodland policy uses a four-percent potential mask and keeps measured generic-forest coverage below five percent in the tested world envelope. Cultivated fields, orchards, gardens, and scenic terrain retain their own distinct roles.

## 6. A persistent, purposeful city population

The resident system grew from a small set of city inhabitants into a registry of 4,080 persistent identities. The runtime keeps detailed local movement bounded to at most 96 active residents, while the rest retain logical identity, profession, schedule, and saved state.

Residents use authored home, workplace, public-space, patrol, visiting, and social circuits. Their visible routines are tied to actual supported locations and ordinary movement/collision rather than camera-relative placement or temporary crowd spawning. Clothing, role props, and short action gestures help distinguish merchants, workers, guards, scholars, visitors, and other professions.

## 7. Exploration and the Travel Journal

The discovery system records 33 on-foot places and groups them into 18 meaningful area hubs. A hub represents one district or destination area rather than multiple separate trips to the same place. Creative and Spectator modes can use all hubs; normal modes unlock them through saved discoveries.

Travel uses collision-checked, dry, supported arrival points and a bounded preparation step. It preserves player edits and resident identities, supports cancellation, and allows non-critical visual detail to stream in after arrival.

## 8. Atmosphere, distant scenery, and engine reliability

The presentation layer gained a cyclic day/night atmosphere, rain, clouds, fog, water tint, and render-only distant terrain and selected skyline anchors. These systems improve orientation without modifying authoritative blocks, collisions, or saved world data.

Engine reliability work strengthened atomic IndexedDB transactions, strict save validation, deterministic edit serialization, checkpoint ownership, recovery behavior, worker request identity, chunk lifecycle cleanup, and production-build integrity. Regression coverage now exercises complete player flows across inventory, crafting, machines, combat, NPCs, world edits, travel, and persistence.

## 9. Release direction

The `2.0.0` release represents the completed city-first world: a dense Chinatown metropolis, its landmark and regional destinations, a bounded living population, a persistent discovery journal, and a reliable single-player voxel foundation.

The project deliberately documents its actual boundaries. Distant scenery is approximate, full-detail rendering is finite, the resident simulation is bounded, and hardware frame rate depends on the browser and GPU. See [known limitations](known-limitations.md), [performance](performance.md), and [testing results](quality-assurance.md) for those details.
