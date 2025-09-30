export function registerEFF(context = {}) {
  return {
    id: 'eff',
    name: 'EFF',
    kind: 'digital-rights',
    description: 'Electronic Frontier Foundation policy and research documents.',
    license: 'Mixed',
    supports: { search: true, fetchDocument: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for EFF' }),
    context
  };
}
