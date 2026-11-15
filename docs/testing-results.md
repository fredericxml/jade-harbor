# Testing and release verification

This document records public release verification separately from current-source regression tests. It does **not** claim that a source-only 2.1.0 archive has been certified as a production distribution.

## Published version history

- **1.0.0:** Functional voxel foundation, rendering, combat, inventory, saves, packaging and portable build checks were exercised before public release.
- **2.0.0:** The Chinatown expansion included cities, districts, landmarks, living residents and the Travel Journal. Published acceptance covered protected-world content, two-seed travel, user-facing presentation and release integrity.
- **2.0.1:** The performance foundation was verified with CPU/source profiling, live reference views, gameplay-equivalence checks and portable production checks. Hardware acceleration and software-rendering boundaries were documented separately.

Historical release notes are preserved in [development history](development-history.md). The published acceptance of an earlier version does not establish that the current source has passed those checks.

## Current 2.1.0 source checks

The project maintains unit, functionality, compatibility, world/simulation, rendering, UI, browser and release-integrity tests. Tests are organized by subsystem rather than engineering chronology. Run the documented groups from [release verification](release.md).

**Certification boundary:** Source-level tests, TypeScript syntax checks and ZIP CRC verification are distinct from a clean dependency installation, semantic TypeScript build, complete Vitest suite, real WebGL2 rendering, longer session soak, and physical-device frame-time/thermal acceptance. Blocked checks must not be reported as passed.
