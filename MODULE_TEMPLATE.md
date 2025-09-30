# Module Template

Copy & adapt this template when introducing a new module under the HumanAI Convention.

## 1. Overview
- Name: <module-name>
- Version: 0.1.0
- Summary: Concise 1–2 sentence description.
- Primary Outputs: (tiles, datasets, metrics, annotations)

## 2. Declared Purposes
List explicit scientific / educational / civic purposes advanced by this module.

## 3. Ethics Profile (Machine-Readable)
Provide a `ModuleEthicsProfileInput` object (TypeScript) or JSON equivalent:
```ts
export const profile = {
  id: '<module-name>',
  version: '0.1.0',
  declaredPurposes: ['educational'],
  dataCategories: ['content'],
  retentionDays: 'session',
  consentRequired: true,
  sensitive: false,
  exportFormats: ['json'],
};
```
Run through `safeEvaluate(profile)` during initialization and surface reviewLevel in logs.

## 4. Data & Retention
| Data Category | Description | Retention | Rationale | Mitigations |
|---------------|-------------|-----------|-----------|-------------|

## 5. Resource Profile
| Aspect | Estimate | Method |
|--------|----------|--------|
| Energy (J/interaction) | | modeled/instrumented |
| Network (KB/interaction) | | measured/simulated |
| Storage (KB persistent) | | |

## 6. Reuse & Dependencies
List reused datasets / tiles to avoid duplication.

## 7. Tile Outputs
Enumerate produced tile IDs and their kinds. Indicate which contain user-derived or sensitive transformations.

## 8. Consent Flow
Describe UI or API prompts. Include example text shown to user.

## 9. Export & Portability
- Formats supported
- Command or UI path to export
- Round‑trip test coverage status

## 10. Risk Assessment
| Risk | Likelihood | Impact | Mitigation | Residual |
|------|------------|--------|------------|----------|

## 11. Automated Evaluator Result
Record the computed object:
```jsonc
{
  "reviewLevel": "auto",
  "totalScore": 0,
  "scoreBreakdown": {}
}
```

## 12. Change Log (Module Level)
| Version | Change | Ethics Impact |
|---------|--------|---------------|

## 13. Future Enhancements
Bullet list with rough priority.

---
**Checklist Before Merge**
- [ ] Profile passes `validateProfileInput`.
- [ ] `safeEvaluate` executed in a unit test.
- [ ] Tile outputs reference `ethics:profileRef` where applicable.
- [ ] Documentation includes retention & export paths.
- [ ] Resource estimates updated after first profiling run.
