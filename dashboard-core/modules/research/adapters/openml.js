export function registerOpenML(context = {}) {
  return {
    id: 'openml',
    name: 'OpenML',
    kind: 'machine-learning-datasets',
    description: 'Open machine learning datasets, tasks, and benchmarks.',
    license: 'Varies (often CC BY)',
    supports: { search: true, fetchDataset: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for OpenML' }),
    context
  };
}
