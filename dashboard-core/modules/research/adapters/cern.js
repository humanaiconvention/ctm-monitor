export function registerCern(context = {}) {
  return {
    id: 'cern',
    name: 'CERN',
    kind: 'physics-data',
    description: 'Open data from high-energy physics experiments.',
    license: 'Open Data License',
    supports: { search: true, fetchDataset: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for CERN' }),
    context
  };
}
