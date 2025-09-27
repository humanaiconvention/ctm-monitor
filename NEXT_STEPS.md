## Next Steps & Enhancement Backlog

This document captures forward-looking improvements building on the current automation (bundle budgets, a11y, visual diff, perf marks, history + trend dashboard).

### 1. Expanded Historical Metrics
* Add Lighthouse scores (performance, accessibility, best-practices, SEO, PWA) into `aggregate-metrics.json` and thus history.
* Introduce percentile calculations (p50 / p95) for mount times if multiple perf samples are collected (run perf marks script N times, aggregate offline).
* Add rolling 7-day moving average & delta fields (pre-compute in history script for faster client rendering).

### 2. Alerting & Governance Extensions
* Governance gate: fail PR if 7-day moving average worsens > X% vs previous 7-day window.
* Visual diff: introduce severity tiers (warn vs fail) based on threshold overage magnitude.
* Accessibility: maintain whitelist file for accepted WCAG false positives with expiry metadata.

### 3. Data Quality & Integrity
* Sign history entries with lightweight HMAC (store signature field) to detect tampering in public forks.
* Add schema version field to `aggregate-history.json` for backwards compatibility when adding new metrics.

### 4. Scalability / Retention
* Rotate old entries to an `archive/aggregate-history-YYYY.json` file when > 1 year of data.
* Parameterize retention via `HISTORY_RETENTION_DAYS` as alternative to entry count.

### 5. Developer Experience
* Add `npm run metrics:serve` script to launch a local server with auto-regeneration.
* Provide a CLI report (`node scripts/metrics-report.mjs`) summarizing last 5 commits deltas.

### 6. Visualization Enhancements
* Replace simple sparkline with small Canvas chart supporting hover tooltips & anomaly markers.
* Add mini badges (SVG) auto-generated for README (e.g., `hero_ms`, `worst_section_ms`, `a11y_violations`).

### 7. Reliability & Testing
* Add unit tests around history update logic (mock file system) to prevent regression in pruning/deduplication.
* Add Playwright visual test for metrics-trend page itself (baseline screenshot).

### 8. Security / Integrity
* Content-Security-Policy tightening: serve `metrics-trend.html` with nonce or hashed inline script (if deployed behind static host you control headers for).
* Validate history JSON shape before rendering (defensive parsing / version check).

### 9. Performance Profiling
* Add RUM (real-user measurement) placeholder integration stub (e.g., capture `performance.getEntriesByType('navigation')`) storing anonymized metrics to complement lab data.

### 10. Documentation Additions
* Architecture diagram of CI data flow (mermaid) embedding: Raw metrics -> aggregate -> history -> trend UI.
* Add governance philosophy rationale linking thresholds to user-perceived performance (e.g., <2s hero for perceived speed).

---
Feel free to prioritize based on immediate value vs effort. Items are intentionally decoupled for incremental adoption.
