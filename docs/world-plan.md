# World planning and generation

Jade Harbor uses one deterministic world generator: [`src/world/generator.ts`](../src/world/generator.ts). A world seed produces one macro plan, urban plan, protected landmark reservations, regional plan, building assemblies, terrain, and voxel columns. The same source powers the main game and generation worker.

## World layout

- **Ten urban districts** with streets, lanes, plots, roofs, canals, supports, and densely populated neighborhoods.
- **Panda Plaza** and eight authored destination landmarks, with accessible public approaches.
- **Five regional destinations**, including villages, landscapes, tea terraces, and gardens.
- **Geography:** signed terrain, water, cliffs, ridges, caves, ore, mines, and protected corridors.
- **Land use:** a constrained generic forest mask, managed cultivation/landscape programs, and authored precincts. The current design bounds potential generic woodland coverage below five percent.

## Generation ownership

The world owns one plan per seed. `World.stream()` schedules nearby columns, worker sessions generate independent columns, and `World.accept()` applies saved edits to the resulting voxels. Every column is independent of generation order; the renderer may use lower-detail geometry but never modifies authoritative world data. Chunk requests are capped and invalidated by epoch/ticket so stale worker output cannot overwrite current columns.

The generator factory is not version-selected. The application does not maintain multiple terrain algorithms. Saved worlds store a seed and edits, not a generator selector; legacy terrain layouts are not automatically reinterpreted. The persisted **save schema version** is separate from generation and remains documented in [save-format.md](save-format.md).

See [architecture](architecture.md), [landmarks](landmarks.md), [regional destinations](regional-destinations.md), [distant-world rendering](distant-world.md), and [Travel Journal](travel-journal.md).
