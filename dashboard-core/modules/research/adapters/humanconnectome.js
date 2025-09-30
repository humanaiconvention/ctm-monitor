export function registerHumanConnectome(context = {}) {
  return {
    id: 'humanconnectome',
    name: 'Human Connectome Project',
    kind: 'neuroscience-datasets',
    description: 'High-quality human brain connectivity datasets.',
    license: 'Open (registration may be required)',
    supports: { search: true, fetchDataset: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for Human Connectome Project' }),
    context
  };
}
