# Browser, installation and offline behavior

Jade Harbor requires a modern browser with a usable **WebGL2** context, workers and IndexedDB. Three.js does not provide a WebGL1 fallback renderer for this project. SwiftShader and other software WebGL2 paths may work with much lower performance; a missing or blocked WebGL2 context prevents rendering. Graphics startup diagnostics distinguish missing WebGL2 from other application failures.

The application may be installed as a PWA where browser and OS policies permit it. A complete first online load is needed to cache the app shell. Offline use depends on that cache and local storage remaining available. Installation mode can use a separate browser profile with different local saves.

Fullscreen, orientation lock, background saving, gamepad activation and installation prompts depend on user gestures, secure contexts and browser support. HTTPS or localhost is generally required for service workers and some device APIs. If a browser denies fullscreen/orientation, Jade Harbor should continue in its normal viewport.

Saved worlds have no cloud sync. Export a backup before changing browser profiles, reinstalling, or clearing site storage. If multiple tabs open one world, lease/revision checks prevent silent overwrites; resolve conflicts using the in-app recovery options.
