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

