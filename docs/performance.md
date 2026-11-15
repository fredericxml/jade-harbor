# Performance and graphics

Jade Harbor retains the same world simulation and content at Low, Medium and High. Graphics quality controls presentation; **view distance** controls detail streaming, and **simulation distance** controls gameplay activity independently.

New installations default to High with Adaptive resolution off and frame limit Auto. Adaptive resolution is opt-in and may adjust internal 3D render resolution when the observed bottleneck warrants it. It cannot speed up CPU-bound meshing, world generation or NPC simulation by reducing pixel count.

Rendering uses bounded dirty-section discovery, nearest-first visible scheduling, resumable meshing, incremental geometry commit, and worker-backed terrain generation. Existing geometry remains displayed until a safe replacement is ready. Worker queue and memory diagnostics are accessible through F3. Scene richness, population, world seeds, physics and saves are never reduced by a quality preset.

**Performance is hardware-dependent.** WebGL2 running under SwiftShader is CPU software rendering; achieving a particular FPS is not guaranteed, even on Low. GPU timing is available only on devices/extensions supporting asynchronous queries. F3 frame time includes browser scheduling, and CPU submission time is not GPU execution time. Compare stable, settled scenes separately from active streaming.

F3 and the Settings performance report provide local metrics without uploading user world data. The report excludes world names, IDs, seeds and player positions. Physical-device FPS and thermal behavior require independent testing; the presence of optimized code does not certify those results.
