# Atmosphere

`render/atmosphere.ts` owns deterministic presentation of the existing clock and clear/rain weather. It adds no simulation, generator, database or save fields. Pre-dawn, sunrise, morning, midday, late afternoon, sunset, blue hour and night interpolate through a cyclic color/intensity table with smooth easing. Reused linear-space Colors and a direction vector avoid frame-by-frame color allocation. Invalid inputs receive finite defaults and view distance stays clamped to 3–8.

The sky is one lightweight gradient sphere with an inexpensive directional sun cue. The horizon, fog and zenith share the same state. A bounded weather blend takes the edge off clear/rain transitions; sunlight is suppressed, colors desaturate, clouds darken and haze strengthens. Night keeps cool exterior fill and readable silhouettes, with warmer existing voxel emission around commercial, central/ceremonial and harbor areas. There are no new shadow maps, dynamic lantern lights, NPC lights or post-processing passes.

The terrain shader retains the authoritative skylight/block-light attributes. Underground faces keep the existing low ambient floor; outdoor color does not replace voxel skylight. The camera's actual skylight gates the 300-drop rain batch, and a below-grade camera hides sky/cloud/distant geometry. Night vision retains its existing status effect and bright presentation without increasing emission unboundedly. First-person equipment remains in its separate, unfogged depth-cleared pass.

All 28 clouds share one instanced draw, preserving the count with staggered placement/scale and cyclic motion. Rain remains one capped 300-point batch without per-drop world collision. Transparent water tiles receive a restrained time/weather tint; glass and ice are not classified as water.

Fog uses a near full-detail blend and a longer, softer distant blend rather than a solid cutoff wall. Supported distances, phase/weather combinations, cave behavior, HUD/equipment, night vision and context restoration have dedicated CPU/browser checks. See [testing results](quality-assurance.md) for executed scope and [performance](performance.md) for measured costs and limits.
