export function registerBrainLife(context = {}) {
  return {
    id: 'brainlife',
    name: 'BrainLife.io',
    kind: 'neuroscience-platform',
    description: 'Platform for reproducible neuroscience workflows and data.',
    license: 'Mixed',
    supports: { search: true, fetchDataset: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for BrainLife' }),
    context
  };
}
