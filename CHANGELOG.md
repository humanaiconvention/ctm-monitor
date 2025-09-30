## Changelog

All notable changes to this project will be documented in this file. The format loosely follows Keep a Changelog (semantic summaries) and versions follow SemVer where practical.

### [0.2.0] - 2025-09-29
#### Added
- Health (`healthz.json`) and readiness (`readyz.json`) artifacts emitted post-build with build timestamp, commit, version, index HTML integrity hash (`indexHash`), per-asset SHA-256 hashes, aggregate `totalAssetBytes`.
- Prometheus-style metrics emission (`metrics.txt`) including build info and per-asset size gauges.
- Preview automation scripts: `preview:auto`, `preview:static`, and `build:preview` with health polling / retry logic and environment overrides.
- Integrity & provenance tooling: comparison script (`compare-readyz.mjs`), index hash guard (`check-index-hash-changed.mjs`), and CI wiring (initial optional check) to detect unintended content drift.

#### Changed
- Intro pre-logo sequence simplified (removed ticker, skip control, and CTA subtext) with pacing adjustments and telemetry streamlined to only meaningful events (impression, stage views, completion).
- Telemetry schema cleaned (removed unused `intro_skipped` action).

#### Observability / Security
- Strengthened asset integrity surface (SHA-256 for JS/CSS) enabling future SRI & tamper detection expansion.
- Foundation laid for deterministic rebuild verification to correlate `indexHash` across deploy and verify jobs.

#### Notes
- Version bump to 0.2.0 reflects the introduction of deployment readiness, integrity, and metrics systems considered a feature tier above 0.1.x preview.

### [0.1.0] - 2025-09-28
Initial public preview tag (baseline telemetry, build/version stamping, unified deploy workflow, integrity hash for index.html, SBOM generation, provenance scaffolding).
