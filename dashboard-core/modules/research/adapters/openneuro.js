export function registerOpenNeuro(context = {}) {
  return {
    id: 'openneuro',
    name: 'OpenNeuro',
    kind: 'neuroimaging-datasets',
    description: 'Open sharing of MRI, EEG, iEEG, MEG data.',
    license: 'Varies (often CC0)',
    supports: { search: true, fetchDataset: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for OpenNeuro' }),
    context
  };
}
