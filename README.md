# Jade Harbor

**Build Beyond Boundaries.**

*Explore a living Chinatown city. Build, survive, and find your own way through lantern-lit streets, busy markets, waterways, mountain paths, and original landmarks.*

Jade Harbor is a single-player browser voxel sandbox built around a dense, editable Chinatown metropolis. Instead of an empty wilderness, the world gives you a connected city to explore and shape: ten distinct districts, eight major landmarks, five regional destinations, and a persistent population of 4,080 residents.

| Release | Experience | Platform | License |
|---|---|---|---|
| `2.0.1` | Single-player voxel sandbox | Modern desktop browsers with WebGL2 | MIT |

## A city made for exploration

Jade Harbor's identity comes from its city and the places connected to it.

- **Ten distinct districts** — move from heritage streets and crowded markets to hutong courtyards, canals, merchant docks, artisan workyards, scholar gardens, nightlife streets, and highland edges.
- **Panda Plaza** — a central public landmark connected to the surrounding street network.
- **Eight major landmarks** — visit the Jade Palace, Northern Ridge Wall, Terrace Excavations, Harbor Guild Beacon, Cloudstep Sanctuary, East Cliff Chambers, Reed Moon Garden, and Western Lookout Pagoda.
- **Five regional destinations** — explore Willow Valley Tulou, Amber Gate Village, Li River Stone Walk, Mist Terrace Tea Village, and Lotus Causeway Gardens.
- **33 discoveries in 18 travel hubs** — record individual places on foot, then use one travel destination for each district or meaningful region.

The city stays dense across its established footprint. Building variety comes from different silhouettes, roof forms, facades, heights, entrances, courtyards, and relationships to the street—not from making the map larger or leaving empty parcels.

## Meet the people who live there

The world contains **4,080 persistent resident identities**. Up to 96 nearby residents can receive detailed movement and activity at once; residents farther away retain their identity and schedule without all running full local simulation simultaneously.

Look for merchants, artisans, harbor workers, guards, scholars, visitors, and other residents. Their routines respond to profession, location, time of day, and weather. Nearby residents move between real places and pause for role-appropriate activities such as working, browsing, carrying goods, patrolling, reading, greeting, or meeting.

Interact with nearby residents to see their names, roles, and available trades.

## Build, survive, and experiment

Choose the style of play that suits you:

- **Survival** — gather resources, manage health and hunger, craft equipment, and explore with survival rules.
- **Adventure** — explore with more restricted world interaction.
- **Hardcore** — play with the release's stricter survival/death rules.
- **Creative** — build freely and use the creative catalog and flight.
- **Spectator** — move through the world to inspect places without normal player interaction.

The sandbox includes mining, block placement, tools and durability, inventory and containers, crafting, kiln processing, inscriptions, brewing, farming, combat, trading, buckets, and a bounded automation system with switches, wires, lamps, doors, timers, pressure plates, hoppers, and processing pipelines.

## Watch the city change

A cyclic day/night atmosphere changes the sky, fog, and exterior color. Rain, clouds, water tint, and night vision add variety to different parts of the city. Distant terrain and selected skyline silhouettes help frame the world beyond the nearby full-detail buildings.

## Choose your graphics quality

Settings include **Low, Medium, and High**:

- **Low** prioritizes performance by reducing render resolution and selected distant and atmospheric detail.
- **Medium** is the balanced default.
- **High** preserves the established `2.0.0` visual presentation.

Graphics presets affect presentation only. They do not remove buildings, residents, world data, or gameplay systems. Press `F3` to inspect the active preset, effective render resolution, WebGL version, and available renderer diagnostics.

Performance depends on the browser, operating system, graphics driver, resolution, and hardware. The included measurements use Chromium with software WebGL rendering and do not certify a universal frame rate. See [graphics and performance](docs/performance.md) for the methodology and desktop testing guide.

## Start exploring

- Use `W A S D` to move and the mouse to look.
- Open your inventory with `E`.
- Mine with the left mouse button; place or interact with the right mouse button or `F`.
- Press `Esc` to pause and open the settings or Travel Journal.
- Open **Pause → Travel Journal** to browse the 18 district and regional travel hubs.
- Walk through public spaces and landmark routes to record discoveries.

See the [player guide and controls](docs/gameplay-controls.md) for the full control reference and gameplay examples.

## Your worlds and saved progress

Worlds are stored locally in the browser using IndexedDB. Important saves should be exported regularly. Cloud synchronization and automatic cross-device save merging are not included.

New worlds use **generator 10**. Existing worlds created with generators 3–9 remain supported with their stored world-generation identity. Where supported, **Create updated city copy** makes a separate generator-10 save and leaves the original world and its edits available. An older world is never silently converted.

## Player guide

| Guide | What it covers |
|---|---|
| [Player guide and controls](docs/gameplay-controls.md) | Movement, interaction, game modes, crafting, machines, and useful examples |
| [Feature overview](docs/feature-matrix.md) | What is included in the current release and what is not |
| [Living city](docs/city-life.md) | Resident roles, daily rhythms, and how to interact with the city |
| [Resident routines](docs/purposeful-city-life.md) | Work, visits, social activity, and visible resident behavior |
| [Travel Journal](docs/travel-journal.md) | Discoveries, district hubs, unlocks, and safe travel |
| [Landmarks](docs/landmarks.md) | The eight major destinations and what to explore at each |
| [Regional destinations](docs/regional-destinations.md) | Five areas beyond the central metropolis |
| [World and districts](docs/world-plan.md) | The city's geography and the surrounding landscape |
| [Atmosphere](docs/atmosphere.md) | Day/night, weather, fog, and visual effects |
| [Graphics and performance](docs/performance.md) | Graphics presets, measurements, and hardware guidance |
| [Known limitations](docs/known-limitations.md) | Current boundaries and features not included |

## Technical reference

For developers, maintainers, and people building from source:

| Reference | Purpose |
|---|---|
| [Architecture](docs/architecture.md) | Runtime ownership, world generation, simulation, rendering, and persistence |
| [Save schema](docs/save-schema.md) | IndexedDB structure, validation, generator identity, and recovery |
| [Engine reliability](docs/engine-reliability.md) | Save durability, lifecycle behavior, and reliability checks |
| [Distant-world rendering](docs/distant-world.md) | The render-only terrain and skyline representation |
| [Urban density](docs/urban-density.md) | City layout, density, building variety, and landscape composition |
| [Architectural richness](docs/architectural-richness.md) | Building design families and variation |
| [Building quality](docs/building-quality.md) | Structural support and visual continuity |
| [Project history](docs/project-history.md) | How the product and its world evolved |
| [Quality assurance](docs/quality-assurance.md) | Test coverage, reproducible checks, and verification boundaries |

## Run from source

To run the project locally, use Node.js 22.12 or newer and npm:

```bash
npm ci
npm run dev
```

Open the local address printed by Vite, normally `http://localhost:4173`.

To build and preview the production version:

```bash
npm run build
npm run preview
```

For tests and release verification, see [quality assurance](docs/quality-assurance.md).

## License and independence

Project code is released under the MIT License; see [LICENSE](LICENSE). Third-party notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and `docs/licenses/`.

Jade Harbor is an independently implemented project inspired by the voxel sandbox genre. **NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.** Minecraft is a trademark of Microsoft. Jade Harbor does not use Minecraft source code or game assets.
