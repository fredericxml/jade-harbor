# Jade Harbor 2.1.0 — Release notes

A focused update to the Chinatown voxel sandbox previously released as 2.0.1.

## Highlights

- Denser procedural districts, recognisable landmarks, local exploration, and a travel journal.
- More varied residents with professions, scheduled activities, and navigable public spaces.
- Faster incremental world streaming and section meshing, safer worker retries and stronger resource cleanup.
- Improved water transparency, distant scenery, graphics profiles and diagnostic tools.
- Desktop, controller and touch controls with optional PWA/offline support where the browser allows it.
- Stronger local-save validation, backup/export tools and multi-tab conflict handling.

## Compatibility

All supported worlds use the single built-in generator (`src/world/generator.ts`). Saves containing a retired generator selector are rejected instead of loading their edits into incompatible geography; there is no automatic layout conversion. Back up current-format worlds before changing browsers or clearing site data. The IndexedDB database identity is unchanged.

## Performance

Low, Medium and High are visual profiles; simulation distance and gameplay rules do not change with the graphics preset. Adaptive resolution is optional and independent. Software WebGL2 rendering can be significantly slower than hardware acceleration. Frame-rate targets are not guarantees.

## Verification status

This source package is prepared for a clean 2.1.0 release. A distribution is only verified after `npm ci`, production build, full automated regression/browser checks and target-device acceptance. A source-only archive is **not** a certified built release.
