export function registerNasa(context = {}) {
  return {
    id: 'nasa',
    name: 'NASA',
    kind: 'space-agency',
    description: 'Open NASA datasets, imagery, and mission data.',
    license: 'Open (varies by dataset)',
    supports: { search: true, fetchDataset: true, fetchImage: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for NASA' }),
    context
  };
}
