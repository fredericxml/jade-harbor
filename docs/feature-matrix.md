# Jade Harbor v1.0.0 feature matrix

This matrix describes the public portfolio release. `VERIFIED` means executed automated or browser evidence exists for the named scope; it does not mean every possible state has been tested.

| Area | Status | Release scope |
|---|---|---|
| Chinatown world identity | VERIFIED | Procedural dense Chinatown, multiple districts, lantern/roof language, editable Panda Plaza and city structures |
| World generation | VERIFIED | Deterministic terrain/city generation, signed coordinates, sparse vertical sections, caves/deep mine, chunk streaming |
| Building and mining | VERIFIED | Placement/mining, tool tiers, durability, collision-aware block interaction, chunk-boundary edits |
| Creative mode | VERIFIED | Catalog, flight, instant building/mining rules, mode transitions |
| Survival core | VERIFIED | Health/hunger/breath, food, farming, tools, armor, death/respawn, hostile encounters |
| Inventory and containers | VERIFIED | 36-slot inventory, hotbar, stack limits, drag/split/transfer behavior, chest/container persistence |
| Crafting and processing | VERIFIED | Manual grid + recipe book, kiln/furnace processing, repair, inscription/enchant-like modifiers |
| Brewing/effects | VERIFIED | Seven infusion recipes, timed effects, resource validation and persistence |
| NPCs and trading | IMPLEMENTED | Bounded navigation, professions/home-work identity, guards, merchants and real item transfer; economy depth is intentionally limited |
| Automation | VERIFIED subset | Switches, wire, lamps, doors, timers, pressure plates, hoppers and kiln pipelines |
| Fluids | VERIFIED subset | Source water/lava placement/collection, scheduled bounded simulation and mixing behavior; not full reference-game fluid fidelity |
| Persistence | VERIFIED | IndexedDB worlds, validated import/export, player/world/container/entity/machine/simulation state, save ordering/integrity checks |
| First-person viewmodel | VERIFIED | Separate foreground render pass, block/tool held models and stable approved tool orientation |
| UI/UX | VERIFIED subset | World browser, creation, settings, controls, inventory, crafting/stations, pause/death flows, keyboard focus styling |
| Hardware GPU performance | NOT UNIVERSALLY VERIFIED | CPU work is instrumented and regression-tested; target-machine GPU/FPS must be measured separately |
| Multiplayer | NOT INCLUDED | Single-player only |
| Boats / minecarts | NOT INCLUDED | No vehicle release claim |
| Advanced piston/repeater automation | NOT INCLUDED | Current automation intentionally stops at the verified subset above |
| Alternate dimensions / bosses | NOT INCLUDED | No portal, alternate-realm or endgame-boss release claim |
