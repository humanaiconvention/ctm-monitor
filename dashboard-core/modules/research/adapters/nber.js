export function registerNber(context = {}) {
  return {
    id: 'nber',
    name: 'NBER',
    kind: 'economics-papers',
    description: 'National Bureau of Economic Research working papers.',
    license: 'Mixed',
    supports: { search: true, fetchMetadata: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for NBER' }),
    context
  };
}
