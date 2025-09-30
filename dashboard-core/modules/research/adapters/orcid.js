export function registerOrcid(context = {}) {
  return {
    id: 'orcid',
    name: 'ORCID',
    kind: 'researcher-identifier',
    description: 'Persistent digital identifiers for researchers.',
    license: 'Open',
    supports: { lookup: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for ORCID' }),
    context
  };
}
