export function registerPapersWithCode(context = {}) {
  return {
    id: 'paperswithcode',
    name: 'Papers with Code',
    kind: 'papers-benchmarks',
    description: 'Machine learning papers linked to code and benchmarks.',
    license: 'Mixed',
    supports: { search: true, fetchMetadata: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for Papers with Code' }),
    context
  };
}
