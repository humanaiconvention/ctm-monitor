## # HumanAI Convention

**A reproducible, trauma-informed framework for ethical AI governance, grounded in human data and public-benefit infrastructure.**


## 🌍 Vision
HumanAI Convention is building a universal, participatory framework for AI governance—anchored in transparency, reproducibility, and human-centered design. Our goal is to ensure that AI systems evolve in ways that respect human dignity, cultural diversity, and long-term resilience.


## 🚀 What’s Inside


## 📖 Roadmap


## 🤝 Contributing
We welcome collaborators across disciplines—law, ethics, technical design, and community governance.  
See [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines.


## 📜 License


## 📬 Contact


*HumanAI Convention is a public-benefit initiative. Together, we can build AI governance that belongs to everyone.*
---

## 🔢 Build Version & Reproducibility
Every build embeds a verifiable version object:

Sources of truth (all consistent):
1. `public/version.json` (served statically)  
2. `window.__APP_VERSION__` (attached early in runtime)  
3. `<meta name="x-app-version" content="<semver>+<shortSha>">`  
4. Generated module: `src/generated/appVersion.ts` for direct imports

Structure:
```jsonc
{
	"name": "web",
	"version": "0.0.0",        // from package.json
	"commit": "e598d45",       // short 12-char hash (build context)
	"fullCommit": "<40-char>",  // full git SHA
	"buildTime": "2025-09-28T22:27:51.995Z" // ISO 8601 UTC
}
```

Regeneration happens automatically inside `npm run build` via `scripts/generate-version.mjs`.
If you need to refresh locally (without full build):
```bash
npm run version:gen
```

Consumer example (React component):
```ts
import { APP_VERSION } from '@/generated/appVersion'
console.log(APP_VERSION.commit)
```

---

## 🔐 GitHub Actions Pinning Strategy
All workflows pin third‑party actions to immutable commit SHAs to eliminate supply‑chain drift.

Pattern:
```yaml
# Action Pin Table
# | Action | Version | Commit SHA |
# |-------|---------|------------|
# | actions/checkout | v5.0.0 | 08c6903c... |

steps:
	- uses: actions/checkout@08c6903c... # v5.0.0
```

Why:
- Reproducibility & audit trail
- Faster incident response (single table to diff)
- Prevents silent major updates

Refresh procedure:
1. List current pins (top of each workflow file).  
2. For each action, check upstream repo Releases / tags.  
3. Resolve the commit for the newest accepted major (we intentionally jump to latest stable major).  
4. Replace the SHA in `uses:` and update the table row (keep the old in git history—no separate changelog needed).  
5. Run a dry CI (push to a branch) and confirm no behavioral regressions.  
6. Merge with a commit message: `ci: refresh action pins`.

Never pin to moving tags (e.g. `@main`). Avoid unmaintained forks.

---

## 🧪 Local Development Quick Start
```bash
cd web
npm install
npm run dev
```

Optional validation before opening a PR:
```bash
npm run lint && npm run typecheck && npm test
npm run build
```


<!--
