# Distant world rendering

**Authoritative voxel world and render-only distant representation have separate ownership.** `render/distant-world.ts` reads existing deterministic geography, landmark components and selected generator-10 building designs. It never generates/loads/edits chunks, participates in collision/targeting/navigation/discovery, creates residents, enters saves or changes generator hashes.

## Bounded representation

One coarse terrain mesh samples the retained macro field on a16/32/48-block grid for High/Medium/Low, including the existing landmark platform levels where applicable. It covers the existing geographic envelope plus a finite presentation margin, capped at 128×128 cells. It does not expand playable geography or load the world at full voxel detail.

One merged anchor mesh represents existing major halls, gates, towers, the ridge wall, supporting platforms and at most four/two/one selected crown buildings per district for High/Medium/Low. The city selection is a skyline aid, not a second rendering of every house. Bodies consume existing volume metadata; roofs are silhouette approximations. Raised bodies include stone support down to the lowest underlying coarse terrain vertex. Platform caps retain their surface material over stone foundations, matching the real builder's ownership. No nearby building, architectural grammar, district density or land-use policy is simplified. Unsupported old metadata degrades safely: v3 has no distant layer, v4/v5 use terrain only, v6–v9 consume their own landmark plans, and v10 also uses selected crown buildings.

Terrain and anchors reuse one material. A 128×3072 single-channel byte texture records 24 vertical sections per horizontal cell (393,216 bytes). Real **meshed** sections win, including deliberately empty edited sections. Known empty sections in columns with rendered detail are suppressed too, so a coarse slope cannot fill an actual cliff cutout or air above a shorter building. Terrain additionally suppresses neighboring section bands to accommodate coarse height interpolation. Coverage changes only when meshing/removal changes topology or an authoritative edit changes known air, not on every stable frame. Its16-block grid is independent of visual terrain sampling. Column eviction and vertical deferral release the corresponding coverage.

A 24-block near exclusion keeps proxies out of immediate interaction. The distant radius is 720; the camera far plane is 960 and the gradient sky radius is 800. Depth precision and the separate equipment pass remain bounded. Fog softens transition and distant simplification. No transparency fade or double full-detail scene is required.

## Scheduling and lifecycle

The distant graph belongs to one View/world. Terrain preparation yields between rows, with at most eight work steps and a nominal two-millisecond slice per frame. Typed arrays are preallocated; positions, colors, flat normals and conservative bounds are written incrementally. Proxy work yields every32 boxes and reuses one cube template. Final BufferAttribute attachment references the existing arrays without cloning or whole-mesh normal/bounds scans. Browser allocation/upload/GC can still exceed the nominal slice; measurements report it without claiming a hard real-time guarantee. Travel preparation skips this work and reuses the existing graph after arrival. Stable travel retains the same geometry, texture and group identities. Profile changes retain the old presentation until both replacement geometries are ready, then swap/dispose only the pair under the same group/material/coverage texture. Abandoned builds are closed and any pending geometry disposed.

World switching, returning home and context recovery dispose old geometries, material and texture and clear the graph/coverage/build task. A new world derives a new seed/version-specific plan. WebGL restoration reconstructs from CPU descriptions; no GPU-only authoritative state exists.

For elevated views the mesher retains its nine-section player window and can also include at most five surface sections. This preserves high player-made platforms while keeping city surfaces visible. It does not enable every vertical section at every distance. Existing section/time budgets, four-request/eight-pending streaming and resident/navigation caps remain unchanged.

## Approximation boundary

Distant terrain is a broad silhouette, not an editable block mesh. It omits most houses, trees, interiors, minor landscape details and distant edit overlays until real chunks are rendered. Coarse roofs/slopes and transitions can be noticeable. Full-detail streaming is finite and cold decorative fragments can still settle after arrival. The layer materially improves orientation and high views; it is not an unlimited seamless panorama. Actual geometry always takes precedence near the player and saved edits remain untouched.

The matrix includes close/medium/proxy views, min/default/max distance, day/night/rain, transition, rapid travel, high builds, different seeds, old generators and real context restoration. Executed results and resource/performance observations are in the QA documents.
