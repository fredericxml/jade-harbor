# Browser experience

Jade Harbor runs in a WebGL2 browser with responsive controls and progressive installation support. Desktop pointer lock, touch gameplay, keyboard/mouse, controllers, pause/resume, and input focus follow the same game-state model.

The app uses a relative manifest and offline cache resources where supported. Saves remain local to the browser; there are no accounts or cloud sync. Leaving, reloading or installing the application does not by itself export saves: make backups before clearing site data.

Graphics profiles, rendering scale and adaptive resolution change presentation cost only. Software WebGL2 may be substantially slower than hardware acceleration. See [browser support](browser-support.md), [controls](controls.md), and [save format](save-format.md).
