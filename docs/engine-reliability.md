# Engine reliability and persistence

Jade Harbor treats persistence and world lifecycle behavior as engine contracts rather than UI conventions. This work strengthens the initial `v1.0.0` baseline without introducing an incompatible save-format migration.

## Persistence contract

The IndexedDB architecture commits world metadata, player state, block entities, entities, simulation state, chunk deltas, and the checkpoint in one transaction. The release baseline keeps that architecture and tightens its boundaries instead of replacing a working design.

Current invariants:

- equivalent world-edit overlays serialize into deterministic section/key order and deterministic local-index order;
- imported and reconstructed save objects use explicit schema allowlists at the save, player, simulation, entity, body, vector, stack, effect, machine, checkpoint, component-record, and stored-chunk boundaries;
- unexpected state is rejected instead of being silently persisted through object spread operations;
- timestamps, revisions, counts, machine values, entity clocks, motion, drop ages, achievements, pending work, and edited-block coordinates remain bounded;
- checksum traversal rejects cyclic or excessively deep state rather than recursing indefinitely;
- checkpoint records and stored chunk metadata are validated before reconstruction, including section coordinates, revision range, schema/version, manifest checksum shape, and record ownership;
- validation returns a sanitized clone and never mutates the caller's save object while truncating supported world name/seed lengths.

The save format remains `jade-harbor-engine`, format version `1`, generator version `3`, database `jade-harbor-engine-v1`, IndexedDB version `1`. This strengthens the existing baseline without migrating to a new incompatible format.

## Atomic save and recovery

Normal writes use the serial game-level save queue and one IndexedDB transaction spanning every persistence store. Incremental writes require a valid existing checkpoint before reusing its unchanged chunk manifest.

Reset is also a real destructive recovery path. It reads independently stored world metadata, constructs a fresh deterministic world with the same name, seed, mode, and id, then atomically replaces all component, chunk, and checkpoint records in one transaction. If the metadata itself is damaged, recovery refuses to guess the seed or mode and requires a known-good backup or deletion.

No delete-then-create recovery sequence is used. If the replacement transaction aborts, IndexedDB preserves the prior records.

## World-edit durability and chunk lifecycle

Unsaved edit ownership is enforced by `World` itself:

- a column containing unacknowledged edits is pinned during streaming whether or not an autosave callback has been attached;
- the callback only requests an earlier save; it is no longer what makes the edit safe from eviction;
- acknowledging an older captured edit sequence cannot clear a newer mutation in the same section;
- captured dirty sections use canonical ordering before being passed to persistence;
- `dispose()` terminates generation ownership and clears pending tickets, chunks, dirty/edit buffers, and callbacks so an abandoned world does not retain stale lifecycle references.

At more than 64 pinned distant columns, the existing streaming backpressure still prefers retaining unsaved state over loading more terrain.

## Profiling

`scripts/profile-reliability.cjs` is an informational Node CPU microprofile for persistence primitives. It does not represent browser frame time, GPU work, or production hardware performance.

A seven-sample Node v22.16.0 Linux x86_64 engineering run measured approximately:

- validate a save containing 50,000 edits: median ~90 ms;
- encode 50,000 edits into canonical chunk deltas: median ~81 ms;
- checksum those chunk payloads: median ~7 ms;
- capture one fully edited 16×16×16 section: median ~2.7 ms.

These are point samples and can vary with machine load. Ordinary incremental saves operate on dirty sections rather than re-encoding the entire edit overlay.

Run the profile with:

```bash
npm run profile:reliability
```

## Regression gate

The dedicated dependency-light regression is:

```bash
npm run test:reliability
```

It covers canonical edit encoding, non-mutating validation, strict schema rejection, pathological entity/drop values, callback-independent dirty-column pinning, captured-sequence acknowledgement, lifecycle disposal, recovery wiring, and upgrade-safe IndexedDB store bootstrap.

The full local release gate is:

```bash
npm ci
npm run test:release
npm run verify:dist
```

Only a zero exit status from the release gate should be treated as approval to publish a newly built `dist/`.
