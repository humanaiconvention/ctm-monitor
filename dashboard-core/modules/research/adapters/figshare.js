export function registerFigshare(context = {}) {
  return {
    id: 'figshare',
    name: 'Figshare',
    kind: 'research-repository',
    description: 'Repository for research outputs including figures and datasets.',
    license: 'Varies',
    supports: { search: true, fetchItem: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for Figshare' }),
    context
  };
}
