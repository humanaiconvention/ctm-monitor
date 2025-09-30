export function registerArxiv(context = {}) {
  return {
    id: 'arxiv',
    name: 'ArXiv',
    kind: 'preprints',
    description: 'e-Print service for research papers in physics, math, CS, etc.',
    license: 'Mixed (varies by paper)',
    supports: { search: true, fetchMetadata: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for ArXiv' }),
    context
  };
}
