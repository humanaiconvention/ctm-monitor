# Tile Specification (v1.0.0)

This document describes the initial tile model powering remixable knowledge & resource‑economics exploration.

## Design Principles
| Principle | Description |
|-----------|-------------|
| Portability | Must serialize cleanly to JSON / YAML and remain language-agnostic. |
| Deterministic | Canonical ordering and field constraints minimize diff noise. |
| Extensible | Namespaced `extensions` surface prevents collisions. |
| Versioned | Bundles declare `specVersion` to enable compatible evolution. |
| Composable | Tiles refer to each other by ID (no deep embedding duplication). |
| Auditable | Integrity-relevant fields (hash, source, provenance) optional but standardized. |
| Localizable | `i18n` map supports per-locale overrides for text fields. |
| Minimal Core | Only common cross-kind fields live in base; specifics in per-kind payload objects. |

## Core Object: TileBundle
```jsonc
{
  "specVersion": "1.0.0",
  "generatedAt": "2025-09-30T12:00:00Z",
  "tiles": [ /* Tile[] */ ],
  "extensions": { "ext:example": {} }
}
```

## Base Tile Fields
| Field | Required | Type | Notes |
|-------|----------|------|-------|
| id | yes | string | Kebab-case slug (<= 63 chars) |
| kind | yes | enum | Discriminator |
| title | no | string | Display label |
| description | no | string | Longer blurb / synopsis |
| updatedAt | no | ISO datetime | Content revision marker |
| contentVersion | no | semver string | For consumer cache invalidation |
| author | no | string or {name,url?,id?} | Attribution / provenance |
| tags | no | string[] | Taxonomy facets (lowercase, dash separated) |
| citations | no | string[] | Links to external citation catalog entries |
| license | no | string | SPDX or custom expression |
| notes | no | string | Free-form caveats / assumptions |
| requires | no | string[] | Feature flags / capability gates |
| i18n | no | map | Per-locale partial overrides (title/description/notes) |
| extensions | no | object | Namespaced (`:` in key) vendor / custom data |

## Tile Kinds
### MetricTile
Represents a quantitative indicator (snapshot + optional time series).
```ts
metric: {
  key: string;       // machine-readable metric code
  unit?: string;     // UCUM or informal
  value?: number;    // current value
  series?: { t: ISO8601; v: number }[]; // chronological datapoints
  ci95?: [number, number]; // confidence interval
  source?: string;   // provenance ref
}
```

### CitationTile
Bridges to a canonical citation entry.
```ts
citationId: string; // external reference id
highlight?: string; // optional extracted insight
```

### VisualTile
Wraps a visualization configuration or asset pointer.
```ts
visual: {
  type: string;      // e.g. vega-lite, plotly, image/png
  spec?: unknown;    // inline spec (structured)
  src?: string;      // external asset (hashed ideally)
  aspectRatio?: number;
}
```

### ScenarioTile
Branching thought experiment / counterfactual explorer.
```ts
scenario: {
  premise: string;
  question?: string;
  branches?: { id: string; label: string; outcome?: string; next?: string[] }[];
}
```

### ForkTile
Captures remix lineage.
```ts
fork: {
  from: string | string[]; // parent tile(s)
  rationale?: string;
  changes?: string[];
}
```

### DatasetTile
Describes a structured data asset.
```ts
dataset: {
  format: string; // csv, parquet, arrow, json
  rows?: number;
  sizeBytes?: number;
  hash?: string; // integrity verification hash
  schema?: { name: string; type: string; description?: string }[];
  source?: string; // origin reference
}
```

### CompositeTile
Grouping construct for layout control.
```ts
children: string[]; // referenced tile IDs
layout?: 'sequence' | 'grid' | 'tabs';
```

### AnnotationTile
Contextual commentary attached to another tile.
```ts
target: string; // referenced tile id
body: string;   // markdown/plain/html per format
format?: 'markdown' | 'plaintext' | 'html';
```

## Extension Conventions
- Keys MUST include a colon to avoid clashing with core fields, e.g. `ext:ml-meta`, `vendor:chart`.
- Values may be any JSON-compatible shape; consumers MUST ignore unrecognized namespaces.
- Security-sensitive extensions should consider namespacing + signing externally (bundle does not embed signatures).

## Localization Strategy
`i18n` map keys are BCP 47 language tags (e.g. `en`, `en-US`, `fr`). Each value is a partial with any of `title`, `description`, `notes`.
Consumers merge locale override onto base fields at render time.

## Integrity & Provenance Ideas (Future)
- Optional `hash` on dataset & visual assets should be hex SHA-256.
- Potential `provenance` extension namespace containing build attestation IDs.
- External signing of bundles (e.g. DSSE envelope) left to higher-level packaging.

## Validation
Use the JSON Schema at `src/schema/tile.schema.json` for offline validation. For streaming ingestion, a lightweight structural validator can short‑circuit on first failure to preserve performance.

## Versioning Policy
- Minor spec increments MAY add optional fields / new kinds.
- Major spec increments MAY rename or remove fields; consumers determine compatibility via `specVersion`.

## Ethics & Usefulness Linkage
All tiles that originate from a module with a `ModuleEthicsProfile` SHOULD include an extension key `ethics:profileRef` referencing `<module-id>@<version>` to enable downstream auditing. Dataset and metric tiles SHOULD also surface retention or consent hints (`ethics:retention`, `ethics:consent`) when they materially differ from module defaults.
See `CONVENTION_PRINCIPLES.md` for governing definitions of *useful* and *ethical*; validation tooling MAY emit warnings for tiles lacking provenance linkage when associated modules declare user-contributed data categories.

---
**Tagline:** We will know — together
