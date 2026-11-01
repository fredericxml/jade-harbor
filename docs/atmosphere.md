# Day, night, and weather

Jade Harbor's atmosphere changes as the world clock moves through the day. The sky, horizon, fog, and exterior colors transition through pre-dawn, sunrise, morning, midday, late afternoon, sunset, blue hour, and night.

## Day and night

- **Morning and midday** bring brighter, clearer exterior colors.
- **Late afternoon and sunset** warm the horizon and building silhouettes.
- **Blue hour and night** shift the city toward cooler exterior tones while existing lantern and block-emission areas provide warmer accents.
- **Night vision** remains available through its existing gameplay effect.

The lighting is stylized for readability and atmosphere. It does not use a full dynamic shadow-map or physically complete global-illumination system.

## Rain and clouds

Rain darkens and desaturates the sky, strengthens haze, and changes the appearance of water and distant scenery. Clouds move slowly across the sky. Rain is a visual effect rather than a simulation of wet surfaces, drainage, or weather-driven flooding.

Weather can also affect resident routines: optional outdoor social activity may move indoors or pause, while essential work and guard patrols continue.

## Fog and distant scenery

Fog softens the transition between nearby full-detail buildings and the distant landscape. Distant terrain and selected skyline silhouettes help frame the city from elevated viewpoints, while caves and below-ground views keep the sky presentation out of sight.

Distant scenery is approximate and render-only. Nearby voxel geometry and player edits remain authoritative. See [distant-world rendering](distant-world.md) for technical details and [graphics and performance](performance.md) for preset behavior.
