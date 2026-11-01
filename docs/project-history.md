# How Jade Harbor evolved

Jade Harbor began as a playable browser voxel sandbox and grew into a city-first world with a distinct Chinatown identity. The product's development has been guided by one central idea: the city should be a place to explore and shape, not simply a backdrop around an empty wilderness.

## From sandbox to city

The original foundation established terrain generation, first-person movement, collision, mining, block placement, inventory, and local saves. The world was then reshaped around a dense Chinatown metropolis with connected streets, markets, courtyards, waterways, lanterns, and Panda Plaza.

## A larger world with recognizable places

The city developed into ten districts with distinct street and building identities. Eight original landmarks and five regional destinations added public spaces, heritage routes, scenic paths, and places worth reaching on foot.

The world-generation system uses explicit versions so that older saved worlds can retain their original terrain and player edits. Where supported, an updated city is created as a separate save rather than silently rewriting an existing world.

## A city with people and places to discover

The resident population grew into 4,080 persistent identities. Nearby residents follow place-aware work, commerce, patrol, visiting, and social routines, while the amount of detailed local activity remains bounded for performance.

The Travel Journal brings exploration together: 33 on-foot discoveries are grouped into 18 district and regional travel hubs. One travel destination represents each district or meaningful region, even when that area contains several discoveries.

## A more adaptable visual experience

The world gained a changing day/night atmosphere, rain, clouds, fog, and distant terrain and skyline silhouettes. The `2.0.1` release adds Low, Medium, and High graphics presets and reduces the cost of building distant scenery while preserving the established city, resident population, simulation, and save format.

High retains the established `2.0.0` presentation. Medium is the balanced default, while Low trades selected render-only detail for a lighter workload. The included software-renderer measurements show improvements to specific rendering workloads, but real frame rate remains dependent on the player's hardware and browser.

## The current product

Jade Harbor `2.0.1` is a single-player voxel sandbox focused on a dense editable Chinatown city, its residents, landmarks, regional destinations, and open-ended building and survival systems. Its boundaries are documented openly: distant scenery is approximate, resident simulation is bounded, and the release does not include multiplayer, vehicles, a quest campaign, or a full city economy.
