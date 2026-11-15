# Architecture

Jade Harbor is a TypeScript + Three.js (WebGL2) single-player voxel sandbox. `src/core/game.ts` coordinates world ownership, input, fixed simulation updates, rendering and UI. The major owners and boundaries are:

| Subsystem | Ownership |
|---|---|
| `src/world/` | Deterministic world generation, 16×16 chunk columns, sparse signed-Y sections, streaming worker, lighting and world edits |
| `src/render/` | Mesh generation, section commit lifecycle, distant-world proxies, water/transparency, atmosphere, entities and adaptive rendering |
| `src/game/` | City-life schedules, resident navigation, combat, crafting, items, inventories and block automation |
| `src/player/` | Physics, interactions, keyboard, mouse, gamepad and touch input state |
| `src/persistence/` | IndexedDB saves, backups, revisions and tab ownership |
| `src/browser/`, `src/pwa/` | Viewport, device/browser capabilities, lifecycle, offline caching and installation support |
| `src/ui/` | World selection, settings, inventory, pause flow, HUD and responsive touch controls |

## World and save compatibility

Sections are 16×16×16 blocks and vertical section indices range from −4 to 19. Generation uses one deterministic implementation at `src/world/generator.ts`. Saves contain a seed and edit overlay, not a generator selection. See [save-format.md](save-format.md).

The terrain worker accepts a seed, request ticket and world epoch. Only matching responses may populate the active world. Obsolete requests can be pruned or preempted within bounded policy; unsaved edits pin their columns until durable acknowledgement.

## Rendering

The mesher emits opaque/emissive, glass/ice, and dedicated water groups; section geometry is built cooperatively and committed atomically only when all material groups are prepared. Old visible geometry stays available during remesh. Distant terrain/water covers detail gaps until loaded detailed section coverage takes over. Transparent sorting is approximate at material-group granularity, not order-independent transparency.

Graphics quality adjusts presentation. View and simulation distance are independent. Adaptive resolution changes internal render scale only when opted in, and never alters authoritative simulation or world data.

## Simulation and lifetime

Simulation uses a fixed 20 Hz tick when the device can sustain it, with bounded update work. Resident registries are persistent; rendering and detailed movement use bounded active sets, while background schedules remain deterministic. World, renderer, city-life, lighting and input owners expose disposal paths and reject stale asynchronous state after replacement. Do not weaken those invariants for performance.

## Release integrity

Run the checks in [release.md](release.md). `npm run build` removes stale output, requires local dependencies, type-checks and creates a file-hash integrity manifest of its inputs and built assets. Never package an old `dist/` with new source. Third-party copyright information is in `../THIRD_PARTY_NOTICES.md` and `docs/licenses/`.
