# Persisted world schema

Jade Harbor stores saves in IndexedDB database `jade-harbor-engine-v1`, schema version `1`, using the `jade-harbor-engine` world format. The schema version identifies the storage format, **not** a generator version.

- A world stores its **seed**, stable identity, player state, inventory, achievements, edit overlay and simulation state.
- Chunk deltas, player/component records and integrity checkpoints commit together in one transaction.
- Save revisions prevent stale-tab overwrites; edits and pending chunk changes are durable.
- Recovery can reset corrupt components while retaining valid world metadata and seed.
- The single generator is `src/world/generator.ts`. New saves contain **no generator version field**.

A limited import reader accepts older data only when it already has the exact current terrain layout and removes that historical metadata before writing. Older terrain layouts are rejected instead of silently reinterpreted.

See [save format](save-format.md), [engine reliability](engine-reliability.md), and [architecture](architecture.md).
