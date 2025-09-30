export function registerOECD(context = {}) {
  return {
    id: 'oecd',
    name: 'OECD',
    kind: 'economic-data',
    description: 'OECD economic indicators and datasets.',
    license: 'Open (with attribution)',
    supports: { search: true, fetchDataset: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for OECD' }),
    context
  };
}
