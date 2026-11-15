# Performance controls

High remains the default on desktop, phone and tablet. No device-name or screen-width rule selects a lower graphics preset. Existing quality, view/simulation distance, input and sound preferences retain their values.

| Setting | New-install default | Effect |
|---|---|---|
| Graphics quality | High | Existing Low/Medium/High presentation profiles. |
| Adaptive resolution | Off | Optional gradual adjustment of internal 3D render resolution only. HUD, menus and touch controls retain CSS resolution; Adaptive is independent of the selected quality preset. |
| Frame limit | Auto | Samples native RAF cadence and caps high-refresh presentation at a stable even divisor no higher than 60 FPS. |
| View / simulation distance | 5 / 4 chunks | Existing independent scenery and gameplay activity ranges; adaptation never changes them. |

Auto examples: 30 Hz follows 30; 60 Hz follows 60; 72 Hz selects 36; 75 Hz selects 37.5; 90 Hz selects 45; 120 Hz selects 60; 144 Hz selects 48; 165 Hz selects 55. The target is estimated from short-lived RAF intervals, requires two consecutive estimates before changing, and is reset/re-estimated after a long callback gap or hidden-page transition. Active gameplay chunk/mesh queues do not bypass the presentation cap; only layout/resize redraws and inactive loading are urgent. A paused active world therefore settles at the intended 2 Hz background cadence while its queues drain. This is a presentation policy, not a promise that the device can sustain the selected rate. A device whose callbacks are already slow is not throttled a second time. Users can select Display rate to remove the cap, or choose 60/40/30 FPS manually. Old saved `0` values remain the explicit Display rate choice; only new installs and Reset to defaults use Auto.

Changing a graphics preset does not turn adaptation off, reset its current scale or change the Adaptive setting. High, Medium and Low control the visual-quality profile; Adaptive independently adjusts internal 3D render resolution. Reset to defaults restores High, Off and Auto. Existing performance recommendations still ask before changing a graphics preset. Input continues to poll on every foreground engine callback; fixed simulation remains 20 Hz when the device can keep up. A lower presentation cap reduces rendering work only when the browser can render faster than the selected cadence; it cannot guarantee FPS or prevent device heating.

## CPU/GPU workload classification

The adaptive controller separates three measurements:

- **Update CPU:** total measured main-thread frame work minus CPU time spent in renderer submission.
- **Render submission CPU:** JavaScript/driver time around renderer clear and render calls. This is not GPU execution time.
- **GPU render time:** optional asynchronous `EXT_disjoint_timer_query_webgl2` elapsed time around the render submission. Queries are sampled periodically, polled only when results are available, and discarded when the GPU-disjoint flag is set or a pending query remains unavailable for more than one second. A stalled query is deleted and sampling retries; it cannot permanently fill the bounded pending queue. No synchronous query wait is used.

The controller classifies sustained pressure as CPU update, CPU render-submission, GPU, mixed or render/presentation pressure. CPU update or render-submission pressure leaves resolution unchanged; reducing pixel count is not a reliable fix for those bottlenecks. Measured GPU or mixed pressure can reduce internal resolution gradually. If GPU timer queries are unavailable, low CPU work plus slow frame intervals is labeled render/presentation pressure and remains an inference, not a confirmed GPU measurement. GPU queries run only while Adaptive is enabled or the F3 debug view is active.

The 3-second age-bounded sample window, 12-second warmup, 2-second evaluation cadence, percentile thresholds, hysteresis, cooldowns and 0.70–1.00 scale bounds remain. The RAF hot path appends to the rolling buffer and only materializes/sorts a sample window when an evaluation is due; it does not copy the window on every rendered frame. The controller uses the effective frame target for its budget, including Auto's selected cadence. One hitch cannot trigger a reduction. Recovery is slower than degradation.

## NPC hot paths and population preservation

CityLife still owns the full persistent resident registry and periodic schedule refresh. At each schedule refresh it builds `activeActors` in the same population order as the saved registry. Per-frame rendering and per-tick detailed simulation iterate this bounded active array (normally at most 96 residents) plus the small panda/spirit encounter list. They no longer scan all 4,080 resident records just to reject inactive residents. The resident registry, IDs, schedules, jobs and population cap are unchanged.

The simulation's occupant-position list is cached by reference, including living residents, other actors and dropped items used by pressure plates. It is refreshed after schedule relocation and actor/drop add/remove events. Normal body movement mutates the referenced position objects, so the list does not need to be copied every tick. Target selection retains the existing full-list exact-hitbox and tie-breaking path to avoid changing interaction semantics.

## Diagnostics and limitations

F3 includes bounded frame timing, actual resolution, adaptive state/bottleneck/current decision, selected frame target and renderer/resource counters. Download performance report in Settings creates local JSON containing rolling summaries (up to 240 samples each), adaptive sample count and decision, counters, quality/scale/limit, GPU-timer availability/enabled state and optional numeric capability hints. It excludes world names/IDs, seeds, save revisions, inventories and player positions. It sends no telemetry.

Frame intervals include browser scheduling and CPU/GPU work. GPU timing is unavailable on some browsers/devices and may be restricted; CPU render submission must never be interpreted as GPU time. Short rolling windows do not represent a full-session benchmark. Optional `performance.memory` is not used by the controller. Hardware hints are not used to persist a device fingerprint or automatically lower graphics quality. Browsers do not expose a reliable universal temperature/throttling sensor. No watts, battery-life, temperature or heat reduction has been measured here. Physical-device sustained testing remains open.
