# Jade Harbor

**Build Beyond Boundaries.**

Jade Harbor is a single-player, Minecraft-inspired browser voxel sandbox built around a dense, procedural Chinatown metropolis. Its world combines ten distinct city districts, eight original landmark programs, five regional destinations, and a persistent population of 4,080 residents. Players can explore, build, mine, craft, trade, and shape the city while day, night, weather, and distant scenery give the world a changing atmosphere.

| Release | Platform | Technology | License |
|---|---|---|---|
| `2.0.0` | Modern desktop browsers with WebGL2 | TypeScript, Three.js, Vite, IndexedDB | MIT |

## World highlights

- **Ten city districts** with distinct street patterns, building families, roof forms, facades, courtyards, markets, workyards, gardens, and waterfronts.
- **Panda Plaza** at the heart of the city, surrounded by a connected urban street network.
- **Eight landmark programs** inspired by mainland Chinese architectural and landscape traditions. They are original interpretations, not historical-scale replicas.
- **Five regional destinations** connected to the existing city and geographic plan without expanding the world footprint.
- **4,080 persistent residents**, with up to 96 detailed local actors at a time. Residents follow profession-, place-, and time-aware work, commerce, patrol, visiting, and social routines.
- **33 on-foot discoveries** grouped into 18 area hubs in the Travel Journal.
- **Survival, Adventure, Hardcore, Creative, and Spectator modes**, with mode-specific permissions and travel access.
- Mining, building, crafting, processing, brewing, farming, combat, trading, containers, and a bounded automation system.
- A cyclic day/night atmosphere, rain, clouds, fog, and render-only distant terrain and skyline silhouettes.

Jade Harbor is a city-first voxel sandbox rather than a wilderness-first world. Its primary identity is the dense, editable Chinatown metropolis and the connected destinations around it.

**Minecraft notice:** Jade Harbor is an independent project. **NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.** Minecraft is a trademark of Microsoft. Jade Harbor does not use Minecraft source code or game assets.

## Compatibility

New worlds use **generator 10**. Existing worlds created with generators 3–9 remain supported and retain their stored generation identity. The world list offers an explicit **Create updated city copy** action for supported older worlds; it creates a separate generator-10 save and leaves the original world available. It is never a silent conversion.

Worlds and settings are stored in the browser using IndexedDB and local browser settings. Export important worlds regularly; cloud synchronization and cross-device save merging are not included.

## Run locally

Requirements: Node.js 22.12 or newer and npm.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:4173`.

To create and preview a production build:

```bash
npm run build
npm run preview
```

## Development and verification

The repository includes unit, integration, regression, browser, performance, and release-integrity checks.

```bash
npm test
npm run test:release
npm run test:release-integrity
npm run verify:dist
```

Additional focused checks include:

```bash
npm run test:world
npm run test:regional-world
npm run test:architectural-richness
npm run test:final-presentation
npm run test:travel-journal
npm run test:urban-life:browser
npm run test:presentation-matrix
npm run test:world-integration
npm run test:production
```

Browser checks require the Playwright browser runtime. See [testing and verification](docs/quality-assurance.md) for the recorded coverage and the exact limits of each measurement.

## Repository layout

```text
src/          application source
public/       static public assets
dist/         generated production output
tests/        unit, integration, regression, browser, and release checks
docs/         product, architecture, compatibility, and quality documentation
scripts/      build, profiling, integrity, verification, and packaging tools
```

The application is organized by responsibility under `src/core`, `src/game`, `src/persistence`, `src/player`, `src/render`, `src/ui`, and `src/world`.

## Documentation

| Document | Purpose |
|---|---|
| [Project history](docs/project-history.md) | A concise chronology of the product's evolution and major engineering decisions. |
| [Feature matrix](docs/feature-matrix.md) | Current release capabilities and explicit scope boundaries. |
| [World plan](docs/world-plan.md) | Geography, districts, landmarks, regional planning, and generator compatibility. |
| [Architecture](docs/architecture.md) | Runtime ownership, world generation, simulation, rendering, and persistence. |
| [Urban density](docs/urban-density.md) | City packing, building support, street activity, and landscape composition. |
| [Architectural richness](docs/architectural-richness.md) | Generator-10 building variation and emitted-design validation. |
| [Building quality](docs/building-quality.md) | Roof/body support, facade attachment, foundations, and structural continuity. |
| [City life](docs/city-life.md) | Population, schedules, navigation, local routines, and discoveries. |
| [Purposeful city life](docs/purposeful-city-life.md) | Visible resident actions, place-aware routines, and lightweight render distinction. |
| [Landmarks](docs/landmarks.md) | Landmark layouts, public access, routes, and geometry constraints. |
| [Regional destinations](docs/regional-destinations.md) | Five regional precincts and their connections to the existing world. |
| [Travel Journal](docs/travel-journal.md) | Discovery records, area hubs, unlock rules, and safe travel. |
| [Gameplay controls](docs/gameplay-controls.md) | Controls and examples for the released gameplay systems. |
| [Save schema](docs/save-schema.md) | IndexedDB structure, validation, generator identity, and recovery rules. |
| [Engine reliability](docs/engine-reliability.md) | Persistence guarantees, world lifecycle, and reliability checks. |
| [Performance](docs/performance.md) | Measurement methodology, recorded costs, and hardware limitations. |
| [Testing and verification](docs/quality-assurance.md) | Release QA scope, recorded results, and reproducible commands. |
| [Known limitations](docs/known-limitations.md) | Current technical and gameplay boundaries. |
| [Branding](docs/branding.md) | Canonical product identity and naming. |
| [Atmosphere](docs/atmosphere.md) | Day/night, weather, fog, lighting, and sky presentation. |
| [Distant world rendering](docs/distant-world.md) | Approximate distant terrain, skyline anchors, and rendering limits. |

## Release packaging

Create a verified source-and-production archive with:

```bash
npm run package:verified -- /absolute/path/JadeHarbor_v2.0.0_Source_and_Dist.zip
npm run test:archive-structure -- /absolute/path/JadeHarbor_v2.0.0_Source_and_Dist.zip
```

The packaging script verifies the current production build and includes the source, tests, scripts, documentation, public assets, and `dist/`. It excludes `docs/proof/`, dependencies, caches, temporary test output, traces, and logs from the curated archive. This is a packaging rule only: it does not delete, move, or add `docs/proof/` to `.gitignore`. GitHub-generated source archives follow the files tracked by the release tag.

## License and third-party software

Project code is released under the MIT License; see [LICENSE](LICENSE). Third-party notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and `docs/licenses/`.
