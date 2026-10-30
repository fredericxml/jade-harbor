# Known technical limitations

Feature scope and exclusions are in [feature-matrix](feature-matrix.md). These boundaries concern systems present in the product.

## Browser, storage and engine

- Persistence uses IndexedDB in the current browser origin/profile. Quota, private-mode policy and clearing site data can remove availability. Export important worlds; there is no cloud sync, automatic stale-tab merge or multiplayer persistence.
- Meshing remains main-thread work. Section-count/time budgets are bounded, but an individual section or final distant-buffer construction is indivisible. Dense scenes, maximum distance and large edits can produce hardware-dependent frame-time and memory pressure.
- The 20 Hz simulation uses bounded catch-up. Sustained low rendering performance slows simulation instead of attempting unlimited missed ticks. Software WebGL measurements do not guarantee a physical GPU frame rate.
- Voxel lighting is deliberately bounded: highest-opaque skylight plus limited emission propagation, without complete lateral skylight/global illumination or dynamic shadow maps.
- Machines, fluids and growth advance only while loaded/in simulation range. Water/hydrology are stylized rather than a full fluid model. Existing automation is a bounded subset, not advanced piston/rail circuitry.
- Targeting selects voxel cells rather than exact decorative sub-box surfaces. Small non-cubic shapes can feel less precise. Dropped items are capped; some enemy loot can be omitted at capacity.
- Large edit overlays and persistent simulation queues consume memory. This is not an unlimited-world storage architecture.

## World and distant presentation

- Full-detail radius and vertical rendering remain finite. Cold meshes/decorative fragments can settle after a safe arrival. The renderer retains the player section window and a bounded surface supplement for elevated views.
- Distant terrain and selected skyline anchors materially extend orientation but are approximate, render-only descriptions. They omit most houses, trees, interiors and distant edit overlays until real chunks are rendered. Coarse slopes, roofs, and near-to-far transitions can be noticeable; this is not a seamless unlimited panorama. Nearby actual blocks and edited empty sections take precedence. See [distant world rendering](distant-world.md).
- The city is an authored/procedural hybrid with intentional courts, roads, canals, quay work space and protected monuments. Interior furnishings and upper-floor uses are selective. Landmark/region forms are fictional Chinese-inspired interpretations, not historical scale reconstructions.
- Generators 3–9 retain their released geometry and population behavior. New geometry/activity belongs to generator 10. Explicit updated-city copies preserve the original slot and edit overlay; conflicting player edits are not deleted to clear a new feature.
- The generic forest policy describes world-space eligibility, not all green pixels. Complete supertiles have a 4% potential mask; reported actual under-5% coverage samples the existing macro envelope. Curated gardens, tea/orchard planting and scenic land have separate physical roles.
- Safe travel validates a bounded local primary/secondary search. Arbitrarily removed support, water or obstructed exits can make a hub fail safely. It does not repair the area. The three-second preparation deadline includes saving; background district settling is separate.

## Ambient population and gameplay depth

- The registry contains 4,080 persistent residents with at most 96 in detailed local movement. Far schedules use coarse logical catch-up without a full citywide production economy or missed-tick commute replay. Travel never creates or resurrects residents.
- Work props, short task chains, guard posts, visits and small social meetings are ambient activity. They do not produce warehouse goods, conversations or campaigns. Appearance and activity counts are not a claim of 4,080 simultaneous detailed actors.
- An isolated cosmetic NPC ground-clipping occurrence was reported before final integration. The sampled final tour and seven stationary windows did not identify a systematic regression; this does not rule out every isolated pose. There is no global model offset; a repeatable route/collision defect would require a local fix.
- Discovery progress is optional and individual. A hub can unlock from one previously discovered member without completing its area. Flying/Spectator visits do not collect discoveries, and travel/load requires subsequent walking before passive progress resumes.
- Existing survival, professions, item trading, and automation retain their current bounded scope. This release does not include a full economy, crime/wanted/chase systems, factions, campaigns, advanced automation, vehicles, alternate dimensions, bosses, or multiplayer.
