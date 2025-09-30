export function registerNeuroVault(context = {}) {
  return {
    id: 'neurovault',
    name: 'NeuroVault',
    kind: 'neuroimaging-maps',
    description: 'Repository for brain statistical maps.',
    license: 'CC0 preferred',
    supports: { search: true, fetchImage: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for NeuroVault' }),
    context
  };
}
