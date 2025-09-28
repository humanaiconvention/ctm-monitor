# GitHub Actions Pinning Guide

Deterministic CI is part of our reproducibility & supply‑chain integrity posture. All third‑party GitHub Actions are pinned to immutable commit SHAs.

## Rationale
- **Integrity**: Prevents a maintainer (or attacker) from mutating an existing release tag.
- **Reproducibility**: Historical runs can be reconstructed exactly.
- **Auditing**: A single "Action Pin Table" at the top of each workflow shows deltas clearly in diffs.
- **Incident Response**: If an upstream compromise is disclosed, locate affected SHAs quickly.

## Pin Format
Each workflow begins with a commented table:
```yaml
# Action Pin Table
# | Action | Version | Commit SHA |
# |--------|---------|------------|
# | actions/checkout | v5.0.0 | 08c6903c... |
```
Each `uses:` line appends an inline comment with the human version:
```yaml
- uses: actions/checkout@08c6903c... # v5.0.0
```

## Refresh Procedure
1. Open the workflow file; copy its current table into your scratch buffer.
2. For each action:
   - Visit the upstream repository (e.g. https://github.com/actions/checkout).
   - Determine the newest acceptable major version (we usually jump to the latest stable major immediately).
   - Click the release/tag to view the **commit SHA**.
3. Replace the old SHA in the workflow with the new one; update the row’s version column.
4. Keep ordering stable (reduces noisy diffs).
5. Run CI on a feature branch; verify green end‑to‑end.
6. Commit with message pattern: `ci: refresh action pins`.

## Decision Log Highlights
- We prefer explicit duplication (no YAML anchors) to maximize clarity and copy‑paste friendliness.
- We avoid unpinned marketplace composites unless internally audited.
- We accept the operational cost of periodic pin refreshes in exchange for deterministic builds.

## When NOT to Pin
- Local actions located in this repository (path-based). They are versioned by git history already.
- Extremely ephemeral experimentation branches (may skip, but must pin before merging to `main`).

## Verification Tips
- Use `grep -R "uses:" .github/workflows` to spot any accidental unpinned actions.
- A valid pin matches regex: `@([0-9a-f]{40})` (full SHA) or shortened if intentionally compressed in comments only.
- Prefer the **full 40-char SHA** in actual `uses:` for zero ambiguity.

## Supply Chain Hardening Extensions (Future)
- Artifact and dependency SBOM generation.
- Sigstore `cosign verify` for container-based actions.
- Automated weekly pin drift detector bot (proposed).

---
Maintainer checklist before approving a workflow PR:
- [ ] All third‑party actions pinned to full SHA
- [ ] Action Pin Table updated & matches steps
- [ ] No stray `@v1` / `@v2` tags remain
- [ ] Security-related actions (CodeQL, upload-artifact, checkout) at latest major

Questions? Open a Discussion or tag maintainers in PR review.
