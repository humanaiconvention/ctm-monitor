# HumanAI Convention: Foundational Principles

> Tagline: *We will know — together.*

This document codifies the baseline principles every module, feature, data flow, and user interaction MUST satisfy. The goal: maximize authentic scientific & human benefit while enforcing clear ethical boundaries.

---
## 1. Core Definitions
**Useful** (for this Convention) means:
- Advances a legitimate scientific, civic, educational, or collaborative purpose.
- Produces information or transformation whose expected positive knowledge value outweighs resource and externality costs.
- Avoids gratuitous computation, bandwidth, storage, or attention capture.
- Minimizes duplication when equivalent, trustworthy artifacts already exist.

**Ethical** means ALL of:
- Bounded consent: Scope, retention, and purpose are explicit, minimal, and non-open-ended.
- Informed: Plain-language disclosure of what is collected, inferred, transformed, and shared.
- Transparent: Source code, provenance, decision criteria (or faithful interpretability surrogate) are inspectable.
- Revocable: Users (or data subjects where applicable) can withdraw future participation without coercive penalty.
- Proportional: Data / model sensitivity aligned with safeguards; no excessive privilege amplification.
- Accountable: Actions produce verifiable event trails (non-PII unless strictly needed & consented) for audit.

---
## 2. Non-Negotiable Constraints
| Axis | Constraint | Rationale |
|------|-----------|-----------|
| Consent Scope | Must enumerate data categories + purposes before collection | Prevents scope creep |
| Data Minimization | Collect only what is directly necessary for declared purpose | Reduces breach & misuse risk |
| Energy / Resource Budget | Each module MUST expose an estimated per‑interaction compute & network cost class (L/M/H) | Enables sustainability tracking |
| Exportability | User-contributed knowledge must be exportable in open formats | Avoid lock-in |
| Extension Isolation | Experimental features default opt-in & namespaced | Prevent silent capability escalation |
| Dark Pattern Prohibition | No UI design that nudges toward over-disclosure | Preserves autonomy |
| Fork Transparency | Derivative tiles / modules declare lineage (fork rationale) | Ensures provenance & credit |

---
## 3. Evaluation Surfaces
Every module MUST provide a machine-readable self‑description object (draft shape below) enabling automated gating:
```ts
interface ModuleEthicsProfile {
  id: string; // unique module slug
  version: string; // semver
  declaredPurposes: string[]; // controlled vocabulary entries
  dataCategories: string[]; // e.g. "behavioral", "content", "telemetry:performance"
  retentionDays: number | "session";
  consentRequired: boolean;
  sensitive: boolean; // if true triggers stricter review
  approximateEnergyJoules?: number; // optional modeled estimate per typical interaction
  networkKBPerInteraction?: number;
  reuseDependencies?: string[]; // existing datasets / tiles reused instead of re-collecting
  exportFormats: string[]; // e.g. ["json","csv"]
  riskMitigations: string[]; // textual summary tokens (e.g. "hashing", "aggregation")
  reviewLevel: "auto" | "light" | "full"; // computed by evaluator
}
```

The evaluator computes `reviewLevel` using heuristic / scoring rules (see Section 5).

---
## 4. Tile System Alignment
Tiles representing datasets, metrics, scenarios, or annotations MUST include—when data is user-contributed—an extension key `ethics:profileRef` linking back to the originating `ModuleEthicsProfile.id`.

Citation or dataset tiles SHOULD reference provenance and optional retention / consent hints via namespaced extensions:
```jsonc
{
  "id": "daily-energy-usage",
  "kind": "metric",
  "extensions": {
    "ethics:profileRef": "energy-observer@1.2.0",
    "ethics:retention": "session",
    "ethics:consent": true
  }
}
```

---
## 5. Automated Heuristic (Initial Draft)
A module triggers higher review level when ANY of:
- Collects or infers sensitive attributes (`sensitive = true`).
- Retention > 30 days AND includes behavioral identifiers.
- NetworkKBPerInteraction > 500 OR approximateEnergyJoules > threshold (implementation-tunable).
- Introduces new raw user text ingestion not previously reused.

Pseudo scoring:
```text
score = 0
+3 if sensitive
+2 if retentionDays != "session" and retentionDays > 30
+1 if networkKBPerInteraction > 500
+1 if approximateEnergyJoules > 120
+1 if dataCategories contains behavioral
reviewLevel = score >=5 ? "full" : score >=3 ? "light" : "auto"
```
Thresholds may evolve; they MUST be versioned in evaluator code with CHANGELOG entries.

---
## 6. Governance & Evolution
- Changes to these principles require semantic version bump of this document (header). Current: `1.0.0`.
- Each change proposal MUST include benefit vs. risk analysis & at least one alternative considered.
- Automated compliance tests MUST cover core evaluator rules.

---
## 7. Anti-Patterns (Explicitly Disallowed)
- Silent expansion of data scope post initial consent.
- Irreversible user linkage across modules without cryptographic unlinking option.
- Obfuscated minified-only release builds for core governance logic.
- Secret weighting of risk heuristics.

---
## 8. Roadmap (Indicative)
| Phase | Focus | Artifacts |
|-------|-------|-----------|
| 1 | Baseline evaluator + profiles | ethics.ts, tests |
| 2 | Energy / network estimation refinement | modeling notes |
| 3 | Bundle-level compliance summaries | JSON reports |
| 4 | Cryptographic attestation of evaluator integrity | build attestations |
| 5 | Differential privacy modules (optional) | DP extension namespace |

---
## 9. Contribution Checklist
Before merging a new module:
- [ ] Provides `ModuleEthicsProfile` with declaredPurposes & dataCategories.
- [ ] Adds tests confirming evaluator classification.
- [ ] Documents export capability & retention.
- [ ] References profile from any produced tiles.
- [ ] Passes automated resource budget thresholds OR justifies exceedance.

---
## 10. License & Stewardship
The principles file is published under the repository's main license. Stewardship group acknowledges ongoing refinement required as empirical data about usage & impacts accumulates.

---
**End of Principles v1.0.0**
