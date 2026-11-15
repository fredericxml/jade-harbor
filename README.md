# Jade Harbor

**Version 2.1.0** · Browser-based Chinatown voxel sandbox

Explore a dense procedural city, meet its residents, build or reshape blocks, discover landmarks and explore the surrounding terrain. Jade Harbor supports Creative, Survival, Adventure, Spectator and Hardcore worlds, with local saves and exports.

## Run locally

Requirements: Node.js 22+, npm and a browser with **WebGL2**.

```bash
npm ci
npm run dev
```

Open **http://localhost:4173**. For a complete verified release:

```bash
npm run test:release
npm run package:verified
```

Use `npm run preview` to inspect a successfully built production bundle.

**World storage:** Saves remain in your browser’s IndexedDB and use a single deterministic generator. Only saves using the current terrain layout are supported; backups are recommended before clearing browser data. There is no cloud synchronization.

**Performance:** Low, Medium and High change rendering fidelity, not the simulated world or residents. Adaptive resolution is optional. Hardware acceleration strongly affects performance; software WebGL2 rendering can be much slower. There is no WebGL1 renderer.

## Project structure

- `src/world/` — deterministic world generation, chunk streaming and lighting
- `src/render/` — voxel meshes, water, distant terrain, entities and graphics settings
- `src/game/` — NPC life, simulation, combat, items, crafting and automation
- `src/player/` — physics and keyboard/mouse/touch/controller input
- `src/persistence/` — local saves and world revisions
- `src/browser/`, `src/pwa/`, `src/ui/` — app lifecycle, offline support and UI
- `tests/` — functional, compatibility, performance and browser regressions
- `scripts/` — build, verification and packaging tooling

## Documentation

- [What's new](docs/release-notes.md)
- [Development history](docs/development-history.md)
- [Feature matrix](docs/feature-matrix.md)
- [Living city](docs/city-life.md)
- [Landmarks & destinations](docs/landmarks.md)
- [Travel Journal](docs/travel-journal.md)
- [Known limitations](docs/known-limitations.md)
- [Testing record](docs/testing-results.md)
- [Controls](docs/controls.md)
- [Architecture](docs/architecture.md)
- [Local saves and compatibility](docs/save-format.md)
- [Performance](docs/performance.md)
- [Browser support and offline mode](docs/browser-support.md)
- [Release verification](docs/release.md)

## Testing

`npm run test:source` verifies the source and documentation without a production build. `npm run test:regression` runs the functional, rendering, simulation, UI, unit and browser checks. Test commands are grouped by subsystem; the full release workflow is documented in [Release verification](docs/release.md).

## License

MIT. Jade Harbor is an independent project and is not affiliated with or endorsed by Mojang, Microsoft or other game publishers. See [third-party notices](THIRD_PARTY_NOTICES.md) and the license files under `docs/licenses/`.

**Release status:** This repository is a clean 2.1.0 source candidate. Production distribution requires a fresh verified build, automated/browser checks and target-device acceptance; a source-only ZIP does not include or certify `dist/`.
