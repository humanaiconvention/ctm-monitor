# Dashboard Core

Modular dashboard foundation for Human AI Convention. Provides a lean core with pluggable modules and a shared design system.

## Objectives
- Rapid composition of dashboard pages via modules
- Clear separation: core shell vs feature modules
- Consistent UI primitives & theming
- Extensible data layer (REST / Graph / Realtime)

## Directory Layout
```
modules/         # Independent feature modules (self-contained UI + logic)
public/          # Static assets
src/
  components/    # Shared presentational + primitive components
  pages/         # Top-level routed pages (compose modules)
  utils/         # Cross-cutting utilities (fetch, caching, telemetry)
.env             # Local environment variables (NOT committed) - use .env.example for templates
```

## Recommended VS Code Extensions
| Purpose | Extension |
|---------|-----------|
| AI Pairing | GitHub.copilot |
| Azure Auth/Resources | ms-vscode.azure-account |
| Azure App Service | ms-vscode.azure-appservice |
| Formatting | esbenp.prettier-vscode |
| Static Live Server (optional) | ritwickdey.LiveServer |
| API Request Scratchpad | humao.rest-client |

## Environment Variables (.env.example)
```
API_BASE_URL=http://localhost:4000
TELEMETRY_DISABLED=false
FEATURE_FLAGS=betaAnalytics,experimentalPanels
```
Copy `.env.example` to `.env` and adjust as needed.

## Initial Setup
```powershell
# From repo root (avoid nesting new git repo if already inside mono repo)
cd dashboard-core

# (Optional) Initialize standalone repo if this will live separately
# git init
# gh repo create HumanAIConvention/dashboard-core --public --source=. --remote=origin
# git add .
# git commit -m "Initial dashboard scaffold"
# git push -u origin main

# Install dependencies (to be defined after package.json is added)
# npm install
```

## Git / Monorepo Notes
If this sits inside a larger mono repo, skip `git init` here. Instead create a new remote or subdirectory strategy using workspaces.

## Next Steps
1. Add `package.json` with build tooling (e.g. Vite + React + TS)
2. Introduce a theming system and layout frame
3. Define module contract (registration API, route injection)
4. Add sample module (e.g., `analytics`) demonstrating lazy loading
5. Set up linting + formatting (ESLint + Prettier) and CI checks
6. Add telemetry stub + feature flag parser

## License
MIT (inherits root repository license unless overridden)

---

## Modular Integration Framework

HumanAI Convention integrates with leading open-source and research platforms including OpenMined, Hugging Face, LangChain, OpenAI MCP, and OSF. Each integration is modular and user-controlled. No platform is mandatory. Users may opt in to each adapter and fork tiles with different logic layers.

Conflicts between integrations are surfaced transparently, and users may prioritize privacy, transparency, or remixability based on their goals.

Tagline: **We will know — together**

---

## Agent Orchestrator (Preview)

The `modules/agent` package introduces a minimal orchestration layer over the unified model registry. It currently supports single-step invocations with lifecycle hooks.

### Key Files
| File | Role |
|------|------|
| `modules/models/registry.js` | Aggregates Azure + future adapters (`listAllModels`, `invokeAny`) |
| `modules/agent/index.js` | `Agent` class with hooks: `beforeInvoke`, `afterInvoke`, `onError` |
| `src/demo/agent-preview.html` | Browser demo: select model & invoke stub |
| `src/demo/agent-smoke.test.js` | Node smoke test for registry + single invocation |

### Agent Contract (Current)
```js
import { createAgent } from '.../modules/agent/index.js';
const agent = createAgent({ defaultModel: 'gpt-5' });
const result = await agent.invoke({ prompt: 'Hello', model: 'o3' });
```

Result shape (stub):
```json
{
  "model": "o3",
  "input": "Hello",
  "output": "[o3 fast inference stub]",
  "usage": { "tokens": 0 },
  "latencyMs": 5
}
```

### Roadmap
1. Multi-turn state + short-term memory buffer.
2. Tool / function calling with adapter capability introspection.
3. Streaming responses & partial yield events.
4. Provenance + cryptographic prompt hashing.
5. Policy guardrails (PII scrubbing, safe completion filters).
6. Cost + latency adaptive routing across model classes.

### Hooks Example
```js
const agent = createAgent({
  hooks: {
    beforeInvoke: async (ctx) => console.log('Invoking', ctx.model),
    afterInvoke: async (ctx) => console.log('Latency', ctx.latencyMs),
    onError: async (ctx) => console.error('Error', ctx.error)
  }
});
```

---

## Provenance & Consent

### Provenance
Invocations are recorded to an in-memory ring buffer (size 500) storing:
`{ id, ts, model, promptHash (sha256/32hex), promptBytes, latencyMs, ok, error, usage }`.

API:
```js
import { listProvenance } from '.../modules/agent/provenance.js';
const recent = listProvenance({ limit: 10 });
```

### Consent Gating
If `azure-models.json` telemetry specifies `user_opt_in: true` and Azure environment variables are configured (real network calls), invocation requires explicit consent. Stub mode (no Azure env) does not require consent.
```js
agent.consentGranted(); // false
agent.grantConsent();   // sets user consent
```
Attempting a real Azure network invocation without consent throws an error.

## Streaming
Models exposing `invokeStream` can be accessed via `agent.stream({ prompt, model })` returning an async iterator of chunks:
```js
for await (const chunk of agent.stream({ prompt: 'Hello', model: 'gpt-5' })) {
  console.log(chunk);
}
```

### Streaming (Azure Real Mode)
When Azure variables + deployment mapping are present, `gpt-5` streaming upgrades from stub chunks to real Server-Sent Event (SSE) deltas. Each yielded `chunk` currently has shape:
```js
{ delta: 'partial token(s)' }
```
Final aggregation occurs client-side; future versions will emit richer metadata (finish_reason, usage partials).

---

## Authentication (Azure)

Two mutually exclusive auth paths are supported; API Key is preferred if present:

| Mode | Required Vars | Notes |
|------|---------------|-------|
| API Key | `AZURE_OPENAI_API_KEY` | Simplest; avoid in long-term production |
| Azure AD (Client Credentials) | `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` (+ optional `AZURE_OAI_SCOPE`) | Used when no API key; token cached with 5‑minute safety window |

`authMode()` (exported via types) returns one of: `api-key`, `aad`, `none`.

Default scope: `https://cognitiveservices.azure.com/.default`.

---

## Retry & Backoff
Network calls use exponential backoff with full jitter for retriable statuses: `408, 429, 500, 502, 503, 504`.

Algorithm (simplified):
```
delay = random(0, base * 2^attempt) capped at maxDelay (default: base=200ms, max=4000ms)
```

Special handling for `429` honors `Retry-After` header (seconds or HTTP date) when present.

Failures include metadata: `error.meta = { attempts, lastStatus }`.

### Tuning (Environment)
| Variable | Default | Description |
|----------|---------|-------------|
| `AZURE_RETRY_RETRIES` | 4 | Max retry attempts (total tries = retries + 1) |
| `AZURE_RETRY_BASE_DELAY_MS` | 200 | Base delay for exponential backoff |
| `AZURE_RETRY_MAX_DELAY_MS` | 4000 | Cap on backoff delay |
| `AZURE_RETRY_JITTER` | full | `full` (0..delay) or `none` |

---

## Circuit Breaker

Protects Azure endpoint from hot-looping on persistent failures.

### States
| State | Meaning |
|-------|---------|
| closed | Normal operation (failures reset on success) |
| open | All outbound calls short-circuited until cooldown expires |
| half-open | Single probe attempt after cooldown; success closes breaker; failure re-opens |

### Events
Emitted via `onCircuitEvent` with payload `{ ts, event, state }` where `event` is one of: `open`, `half-open`, `close`.

### Configuration (Environment)
| Variable | Default | Description |
|----------|---------|-------------|
| `AZURE_CB_THRESHOLD` | 5 | Consecutive retriable failures to open breaker |
| `AZURE_CB_COOLDOWN_MS` | 15000 | Cooldown window before half-open probe |
| `AZURE_CB_EVENTS_JSONL_PATH` | (unset) | If set, append circuit events to JSONL |

### API
```js
import client, { onCircuitEvent, listCircuitEvents, circuitHealth } from '.../modules/azure/client.js';
const off = onCircuitEvent(e => console.log('circuit event', e.event));
console.log(circuitHealth());
```

`circuitHealth()` returns `{ state, recent, config }`.

---

## Health Collection

`collectHealth()` aggregates provenance + circuit diagnostics:
```js
import { collectHealth } from '.../modules/agent/health.js';
console.log(collectHealth());
```
Output (shape example):
```jsonc
{
  "timestamp": 1730000000000,
  "provenance": { "ringSize": 500, "count": 12, "jsonlPath": null, "jsonlWriteErrors": 0 },
  "circuit": {
    "state": { "open": false, "failures": 0, "threshold": 5, "cooldownMs": 15000, ... },
    "recent": [ { "event": "open", "ts": 1730000000123 }, ... ],
    "config": { "threshold": 5, "cooldownMs": 15000, "retry": { "retries": 4, "baseDelayMs": 200, "maxDelayMs": 4000, "jitter": "full" } }
  }
}
```

---

---

## Provenance Configuration & Persistence

Runtime tuning:
| Env / API | Effect |
|-----------|--------|
| `PROVENANCE_RING_SIZE` | Initial in-memory ring size (default 500) |
| `PROVENANCE_JSONL_PATH` | If set, each record appended as JSONL (non-blocking) |
| `configureProvenance({ ringSize, jsonlPath })` | Reconfigure at runtime |

Example:
```js
import { configureProvenance } from './modules/agent/provenance.js';
configureProvenance({ ringSize: 2000, jsonlPath: '/var/log/agent-provenance.jsonl' });
```

JSONL writes are fire-and-forget; internal counter `jsonlWriteErrors` (via `provenanceStats()`) surfaces silent failures.

---

## Tool System & Naive Planner (Preview)

You can register lightweight tools that the agent can invoke via pattern directives in prompts:

```js
agent.registerTool({
  name: 'addNumbers',
  description: 'Adds two numbers',
  run: ({ a, b }) => ({ sum: a + b })
});

const plan = await agent.planAndExecute({
  prompt: 'Compute total: tool:addNumbers {"a":2,"b":3}'
});
```

Flow:
1. Regex scans prompt for `tool:<name> {json}`.
2. Executes tool with parsed JSON (if parse fails, {} used).
3. Appends tool output summary to a follow-up model prompt.
4. Returns `{ steps: [...], final }`.

Future enhancements:
* Multi-step chained planning with model-assisted tool selection.
* JSON Schema validation of tool arguments.
* Tool capability introspection and permission gating.

---

## Environment Variables (Azure)
| Variable | Description |
|----------|-------------|
| `AZURE_OPENAI_ENDPOINT` | Base endpoint (e.g. https://my-resource.openai.azure.com) |
| `AZURE_OPENAI_API_KEY` | API key (replace with AAD in production) |
| `AZURE_OPENAI_DEPLOYMENTS` | JSON mapping of model name to deployment id, e.g. `{ "gpt-5": "gpt5prod" }` |
| `AZURE_RETRY_RETRIES` | Override retry attempts |
| `AZURE_RETRY_BASE_DELAY_MS` | Override base backoff delay |
| `AZURE_RETRY_MAX_DELAY_MS` | Override max backoff delay |
| `AZURE_RETRY_JITTER` | `full` or `none` |
| `AZURE_CB_THRESHOLD` | Circuit breaker failure threshold |
| `AZURE_CB_COOLDOWN_MS` | Circuit breaker cooldown window |
| `AZURE_CB_EVENTS_JSONL_PATH` | Path to append circuit events JSONL |
| `AZURE_SSE_MAX_EVENT_BYTES` | Max bytes per SSE event (default 65536) |

Example (PowerShell):
```powershell
$Env:AZURE_OPENAI_ENDPOINT = 'https://my-resource.openai.azure.com'
$Env:AZURE_OPENAI_API_KEY = '***'
$Env:AZURE_OPENAI_DEPLOYMENTS = '{"gpt-5":"gpt5prod"}'
```

---

## Azure OpenAI Integration

HumanAI Convention (dashboard core) now has an initial Azure model scaffold for future Azure OpenAI onboarding. This includes placeholder adapters for:

| Model | Capabilities (excerpt) |
|-------|------------------------|
| gpt-5 | theory synthesis, consciousness modeling, dashboard logic |
| gpt-5-codex | agentic workflows, LangChain logic, repo automation |
| deep-research | citation synthesis, multi-source benchmarking |
| image-1 | visual identity, glyph generation |
| o3 | fast inference, low-cost chaining |
| o3-pro | nuanced reasoning, participatory scaffolds |

### Files Added
| File | Purpose |
|------|---------|
| `modules/azure/models/*.js` | Individual model adapter stubs with `meta` + `invoke()` |
| `modules/azure/models/index.js` | Registry: `listModels`, `getModel`, `invokeModel` |
| `src/data/azure-models.json` | Declarative model + telemetry manifest |
| `src/components/AzureModelSelector.js` | Vanilla JS selector & invoke demo |

### Future Azure Wiring (Not Implemented Yet)
1. Azure OpenAI endpoint + deployment names per model (env: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`).
2. Token acquisition via Azure AD (Managed Identity or service principal) for production instead of static key.
3. Rate limiting + retry with exponential backoff + circuit breaker (reuse analytics breaker pattern).
4. Usage telemetry enrichment (tokens, latency, cache hits) respecting user opt-in from `azure-models.json`.
5. Provenance ledger entries for each invocation (model, version, prompt hash, timestamp, optional citations).
6. Server-side proxy for secure key handling + request normalization.

### Model Invocation Pattern (Planned Contract)
```js
const adapter = getModel('gpt-5')
const result = await adapter.invoke('Summarize new neural findings', { stream: false })
// Expected future shape:
// { model: 'gpt-5', output: '...', usage: { promptTokens, completionTokens, totalTokens }, latencyMs }
```

### Opt-In & Telemetry
`azure-models.json` sets `user_opt_in: true` meaning UI should collect explicit consent before enabling network calls. The selector currently invokes stubs immediately—replace with a consent gate when wiring real endpoints.

### Design Principles
* **Composable** – model adapters are thin; orchestration (chaining, routing) lives elsewhere.
* **Auditable** – every real invocation will log a provenance record.
* **Privacy-Respecting** – no prompt content stored unless user explicitly opts to save/share.
* **Replaceable** – swapping Azure model with OSS local model should only require adapter change.

Tagline: **We will know — together**

---

### Current Integration Scaffold
- `modules/integrations/*.js` – adapter placeholders (return metadata + future activate hooks)
- `src/data/integration-schema.json` – declarative list of supported integrations
- `src/components/IntegrationPanel.js` – minimal HTML generator for listing integrations & conflicts

### Planned Enhancements
1. JSON Schema validation & semantic versioning of integration schema
2. Adapter capability negotiation + conflict resolution strategies
3. Provenance logging (who enabled what + timestamp + rationale)
4. Privilege boundary: sandbox execution for untrusted adapters
5. UI component (React/Web Component) with live status polling
6. User opt-in persistence (localStorage + signed policy export)
7. Integrity attestation for adapter source (hash + supply chain metadata)


## Open Research Base for Participatory Modeling

HumanAI Convention aggregates a broad constellation of open research sources, scientific datasets, policy archives, and public knowledge platforms. These span:

- Neuroscience & Brain Data: OpenNeuro, NeuroVault, Allen Brain Atlas, Human Connectome Project, BrainLife.io
- Physics & Systems: CERN Open Data, NASA, Quantum Experiments Dataset (QED)
- Machine Learning Ecosystem: ArXiv, Papers with Code, OpenML, Hugging Face
- Open Science & Identity: OSF, ORCID, Zenodo, Figshare, Internet Archive
- Economics & Governance: OECD, OECD AI Policy Observatory, World Bank, SEC Filings, OpenCorporates
- Knowledge Graphs & Reference: Wikipedia, Wikidata, Stanford Encyclopedia of Philosophy
- Geospatial & Events: OpenStreetMap, GDELT
- Policy, Rights & Civil Society: AI Now Institute, EFF, Mozilla Foundation
- Investigative & News Streams: ProPublica, Reuters, BBC, The Conversation, Google News

Each source is:

- Modular – activate only what you explicitly opt into
- Remixable – designed for composable analytical tiles & cross-source synthesis
- Citation-tracked – provenance and reference formatting (APA baseline) maintained
- Transparent – capability surface & any constraints are enumerated before activation

### Current Research Scaffold
- `modules/research/adapters/*.js` – placeholder registration functions (metadata + future activate hooks)
- `src/data/research-schema.json` – declarative list of supported research sources + metadata flags
- `src/components/SourceSelector.js` – vanilla JS selector emitting user opt-in set

### Roadmap (Incremental)
1. Add JSON Schema for per-source capability descriptors (rate limits, modalities, license class)
2. Implement provenance ledger writing signed activation manifests (hash + timestamp)
3. Add ethics/impact scoring overlay combining source attributes with existing evaluator
4. Introduce adaptive batching + caching layer for federated search across opted-in sources
5. Provide reproducible query bundles (export/import) for scholarly auditing
6. Add conflict heuristics (e.g., license incompatibility, derivative use restrictions)
7. Integrate model-context protocol (MCP) negotiation for compliant tool invocation

Tagline: **We will know — together**

### Previewing the Research Selector

For a quick static preview (no build pipeline yet), open the HTML file directly in a browser that allows ES module file loading:

```
dashboard-core/src/demo/research-preview.html
```

If your browser blocks `file://` module imports, you can launch a tiny local server from the repo root:

```powershell
pwsh -c "cd dashboard-core/src; python -m http.server 8088"  # requires Python
# then open http://localhost:8088/demo/research-preview.html
```

Current limitations:
- Activation logic is not wired; only selection UI emits chosen sources.
- No persistence; refresh clears selection.
- No capability or license conflict surfacing yet.

