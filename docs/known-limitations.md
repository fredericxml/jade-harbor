# Known technical limitations — v1.0.0

Feature availability and explicit release exclusions are tracked only in [`feature-matrix.md`](feature-matrix.md). This document is reserved for limitations of systems that **are** present in the release.

- World persistence depends on browser IndexedDB for the current origin/profile. Quota, private-mode policy, or clearing site data can make local state unavailable; export important worlds.
- Meshing is still primarily main-thread work. Very dense scenes, large view distances, or long streaming sessions can produce hardware-dependent frame-time and memory pressure.
- The lighting model is intentionally bounded and simpler than a physically complete voxel global-illumination solution.
- The fixed simulation tick uses bounded catch-up. Under sustained low render performance, simulation can slow instead of attempting unlimited catch-up work.
- Machines and other radius-bound simulation do not perform offline elapsed-time processing while their area is unloaded.
- DDA targeting identifies voxel cells rather than exact decorative sub-box surfaces, so very small non-cubic shapes can feel less precise to target.
- Dropped-item entities are capped to protect simulation cost. At the cap, some enemy loot can be omitted rather than allowing unbounded entity growth.
- Large accumulated edit overlays and persistent simulation queues can consume significant memory; the release is not presented as an unlimited-world storage architecture.
