# What to expect: current limitations

Jade Harbor `2.0.1` is a substantial single-player voxel sandbox, but it is not an unlimited world simulator. The notes below explain the boundaries that are most relevant when playing, saving, exploring, and comparing performance.

## Worlds and saved progress

- Worlds are stored in IndexedDB in the current browser profile and site origin. Clearing browser data, using private browsing, or reaching browser storage limits can make local saves unavailable.
- Cloud synchronization and automatic cross-device save merging are not included. Export important worlds regularly and keep a backup outside the browser.
- New worlds use generator 10. Older supported worlds retain their original generation identity. An updated-city copy is a separate save where supported; the original is not silently converted.

## City activity

- The world has 4,080 persistent resident identities, but at most 96 nearby residents receive detailed local movement at once. Distant residents do not all run continuous physics and pathfinding.
- Resident actions are ambient routines—work, visits, patrols, shopping, and small social meetings—not a full economic simulation or long-form dialogue system.
- The game does not include a mission-driven quest campaign. Travel Journal discoveries are optional exploration records.

## Building, machines, and world simulation

- The city and regional structures are an authored/procedural hybrid. Interiors and upper-floor uses are selective rather than fully furnished everywhere.
- Machines, fluids, and crop growth advance while their area is loaded and within simulation range. They do not run as a complete offline elapsed-time simulation.
- Fluids are a bounded sandbox approximation, not a full hydrodynamics system. Automation covers the systems listed in the [feature overview](feature-matrix.md), not every possible logic-gate, piston, or machinery design.
- Targeting selects voxel cells rather than exact surfaces of every small decorative shape, so some non-cubic details can be less precise to target.

## Visual presentation

- Full-detail rendering distance and vertical coverage are finite. After fast travel, the safe arrival is completed before all nearby lighting, meshes, and decorative detail have finished settling.
- Distant terrain and selected skyline silhouettes are approximations. They do not show every distant house, tree, interior, or player edit until the full-detail world streams in.
- Lighting is stylized. It does not include full dynamic shadow maps or physically complete global illumination.

## Performance

- Performance depends on browser, operating system, graphics driver, resolution, and hardware. The included benchmark used Chromium with ANGLE SwiftShader software rendering; it cannot certify frame rate on a physical integrated or discrete GPU.
- Medium is the default. High preserves the established `2.0.0` presentation. Low reduces render resolution and selected distant/atmospheric detail; it does not remove buildings, residents, simulation, or gameplay systems.
- The distant-geometry construction cost is substantially lower than in the previous release, but voxel meshing, lighting, large edits, browser memory management, and GPU uploads can still cause frame-time spikes.
- A 40+ FPS result on suitable modern integrated graphics is a target for real-machine testing, not a universal guarantee.

## Features not included

Jade Harbor is single-player. This release does not include multiplayer, vehicles, a full city-wide economy, crime or wanted systems, factions, a quest campaign, alternate dimensions, endgame bosses, or a complete piston/repeater automation system.

For the current feature list, see [what you can do](feature-matrix.md). For graphics measurements and a desktop test procedure, see [graphics and performance](performance.md).
