/**
 * Tile Type System
 * Goals:
 *  - Portable across platforms (serialize to JSON / YAML cleanly)
 *  - Extensible via namespaced custom fields without colliding with core spec
 *  - Versioned for forward evolution (semver-like model specVersion)
 *  - Supports theming / display hints separate from semantic data
 *  - Encourages provenance & citation linking
 */

export type TileID = string; // recommended: kebab-case unique slug

export interface BaseTileMeta {
  id: TileID;
  kind: TileKind;
  title?: string;
  description?: string;
  /** ISO timestamp when this tile definition was authored or last materially updated */
  updatedAt?: string;
  /** Optional semantic version of the tile content (not runtime build) */
  contentVersion?: string;
  /** Agent or org attribution; can be DID / URI / handle */
  author?: string | { name: string; url?: string; id?: string };
  /** Array of taxonomy tags (lowercase, dash-separated) */
  tags?: string[];
  /** Source citation IDs this tile depends on */
  citations?: string[];
  /** Arbitrary license expression (SPDX or custom) */
  license?: string;
  /** Short free-form notes / caveats / assumptions */
  notes?: string;
  /** Feature flag style gating (client/server interpret) */
  requires?: string[];
  /** Internationalization (RFC 5646 language tags) */
  i18n?: Record<string, Partial<Pick<BaseTileMeta,'title'|'description'|'notes'>>>;
  /** Namespaced extension surface: keys MUST contain a colon (e.g. `ext:foo`) */
  extensions?: Record<string, unknown>;
}

export type TileKind =
  | 'citation'
  | 'metric'
  | 'visual'
  | 'scenario'
  | 'fork'
  | 'annotation'
  | 'dataset'
  | 'composite';

/** Metric Tile */
export interface MetricTile extends BaseTileMeta {
  kind: 'metric';
  metric: {
    /** Machine-readable metric key (e.g. training-energy-kwh) */
    key: string;
    /** Unit symbol or UCUM style descriptor */
    unit?: string;
    /** Primary numeric value (for snapshot metrics) */
    value?: number;
    /** Optional timeseries (ISO timestamp -> value) */
    series?: { t: string; v: number }[];
    /** Confidence interval or statistical spread */
    ci95?: [number, number];
    /** Data provenance reference (dataset id or URL) */
    source?: string;
  };
}

/** Citation Tile specialized mapping (links to citations catalog) */
export interface CitationTile extends BaseTileMeta {
  kind: 'citation';
  citationId: string; // references entry in citations.yaml
  /** Optional extracted insight highlight */
  highlight?: string;
}

/** Visual tile wraps a referenced visualization asset or spec (e.g. Vega, Plotly config) */
export interface VisualTile extends BaseTileMeta {
  kind: 'visual';
  visual: {
    /** MIME-like type (e.g. vega-lite, plotly, image/png, custom) */
    type: string;
    /** Inline spec or lightweight embed reference */
    spec?: unknown;
    /** External resource pointer (hashed where possible) */
    src?: string;
    /** Preferred aspect ratio (w/h) */
    aspectRatio?: number;
  };
}

/** Scenario / Thought experiment tile */
export interface ScenarioTile extends BaseTileMeta {
  kind: 'scenario';
  scenario: {
    premise: string;
    question?: string;
    branches?: Array<{ id: string; label: string; outcome?: string; next?: TileID[] }>;
  };
}

/** Fork tile advertises remix lineage */
export interface ForkTile extends BaseTileMeta {
  kind: 'fork';
  fork: {
    /** Original tile id(s) forked from */
    from: TileID | TileID[];
    rationale?: string;
    changes?: string[]; // bullet summary of modifications
  };
}

/** Dataset tile describes a structured data asset */
export interface DatasetTile extends BaseTileMeta {
  kind: 'dataset';
  dataset: {
    format: string; // e.g. parquet, csv, json, arrow
    rows?: number;
    sizeBytes?: number;
    hash?: string; // content hash for integrity
    schema?: Array<{ name: string; type: string; description?: string }>;
    source?: string;
  };
}

/** Composite tile can aggregate other tiles for grouped rendering */
export interface CompositeTile extends BaseTileMeta {
  kind: 'composite';
  children: TileID[]; // referential, avoids duplication
  layout?: 'sequence' | 'grid' | 'tabs';
}

/** Annotation tile for contextual commentary on another tile */
export interface AnnotationTile extends BaseTileMeta {
  kind: 'annotation';
  target: TileID; // tile being annotated
  body: string; // markdown or structured remark AST serialized
  format?: 'markdown' | 'plaintext' | 'html';
}

export type Tile =
  | MetricTile
  | CitationTile
  | VisualTile
  | ScenarioTile
  | ForkTile
  | DatasetTile
  | CompositeTile
  | AnnotationTile;

/** Root collection format for bundling */
export interface TileBundle {
  specVersion: '1.0.0';
  generatedAt?: string; // ISO timestamp
  tiles: Tile[];
  // Catalog-level extensions (namespaced)
  extensions?: Record<string, unknown>;
}

/** Type guard helper */
export function isMetricTile(t: Tile): t is MetricTile { return t.kind === 'metric'; }
export function isVisualTile(t: Tile): t is VisualTile { return t.kind === 'visual'; }
export function isScenarioTile(t: Tile): t is ScenarioTile { return t.kind === 'scenario'; }
export function isForkTile(t: Tile): t is ForkTile { return t.kind === 'fork'; }

