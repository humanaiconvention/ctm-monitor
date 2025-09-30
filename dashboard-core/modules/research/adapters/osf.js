export function registerOSF(context = {}) {
  return {
    id: 'osf',
    name: 'OSF',
    kind: 'open-science-framework',
    description: 'Open Science Framework for managing and sharing research.',
    license: 'Mixed',
    supports: { search: true, fetchProject: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for OSF (research module)' }),
    context
  };
}
