# Save reliability and world lifecycle

Jade Harbor stores worlds locally in IndexedDB. The persistence system is designed to keep world edits, player state, residents, machines, and simulation state consistent across ordinary saves, reloads, exports, and recovery.

For the complete stored data layout and generator compatibility rules, see [save schema](save-schema.md).

## Save consistency

World metadata, player state, block entities, residents, simulation state, chunk edits, and the checkpoint are committed through a coordinated IndexedDB transaction. A completed checkpoint records the revisions and checksums needed to validate the saved components and edited sections.

The save path applies several safeguards:

- World edits are serialized in a deterministic order.
- Imported and reconstructed data is checked against explicit schemas and value bounds.
- Unexpected or malformed state is rejected rather than silently accepted.
- Checksums detect accidental corruption; they are not authentication or cryptographic tamper protection.
- Incremental writes require a valid prior checkpoint.
- Failed transactions retain the live edit buffer for a later save attempt.

## Protecting edits during streaming

A world column with uncommitted player edits remains pinned while streaming is active. The column can be released after the captured edit sequence has been committed. If a newer edit occurs while an earlier save is in progress, acknowledging the earlier save does not clear the newer change.

World disposal clears pending generation requests, tickets, chunk references, dirty/edit buffers, and callbacks so that an abandoned world does not retain stale lifecycle state.

## Recovery

Reset is also the recovery path for damaged component, checkpoint, or chunk data. It uses independently validated world metadata and atomically replaces the full saved world. If the metadata itself is damaged, the game refuses to guess the world seed or mode; use a known-good export or remove the damaged save only after considering whether a backup exists.

There is no delete-then-create recovery window. If the replacement transaction fails, IndexedDB preserves the previous records.

## Compatibility

The database remains `jade-harbor-engine-v1`, IndexedDB version `1`, and save format `jade-harbor-engine` version `1`. Generators 3–10 are supported. New worlds use generator 10, and existing worlds retain their stored generator identity during normal saves.

## Engineering checks

The reliability regression covers deterministic edit encoding, strict save validation, malformed values, edit pinning, save-sequence acknowledgement, world disposal, recovery behavior, and safe IndexedDB bootstrap.

Run the focused check with:

```bash
npm run test:reliability
```

For the full release checks, use the commands in [quality assurance](quality-assurance.md).
