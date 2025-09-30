export function registerWorldBank(context = {}) {
  return {
    id: 'worldbank',
    name: 'World Bank',
    kind: 'economic-development-data',
    description: 'Global development indicators and economic data.',
    license: 'Open (attribution)',
    supports: { search: true, fetchDataset: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for World Bank' }),
    context
  };
}
