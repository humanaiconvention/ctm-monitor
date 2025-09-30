export function registerZenodo(context = {}) {
  return {
    id: 'zenodo',
    name: 'Zenodo',
    kind: 'research-repository',
    description: 'General-purpose open research repository.',
    license: 'Varies',
    supports: { search: true, fetchRecord: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for Zenodo' }),
    context
  };
}
