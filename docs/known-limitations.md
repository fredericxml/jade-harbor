# Known limitations

- **Browser GPU:** A WebGL2 context is required. WebGL1-only systems do not have a separate renderer. SwiftShader/software WebGL2 can run substantially slower than supported hardware acceleration.
- **Performance:** Frame rate depends on world position, visible geometry, GPU/backend, CPU, screen resolution and streaming backlog. No minimum FPS is guaranteed on older or software-rendered devices.
- **World streaming:** New chunks and distant terrain coverage may settle over multiple frames while approaching unexplored areas. Generated terrain and edited saves remain authoritative.
- **Resident simulation:** Full population identities are retained, but only a bounded nearby set receives detailed per-frame simulation; remote schedules use reduced-cost state updates.
- **Storage:** Saves are local in browser IndexedDB. Private browsing, profile changes, site-data clearing and device changes can make saves unavailable. Export backups for important worlds.
- **Browser acceptance:** Source checks do not substitute for a successful production build, WebGL2 browser test, longer session soak, or physical-device testing.
- **Multiplayer/cloud:** This release is a single-player browser world, without cloud synchronization or multiplayer servers.

See [browser support](browser-support.md), [performance](performance.md), [saves](save-format.md) and [release verification](release.md).
