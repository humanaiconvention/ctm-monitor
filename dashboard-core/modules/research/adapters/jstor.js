export function registerJSTOROpen(context = {}) {
  return {
    id: 'jstor',
    name: 'JSTOR Open',
    kind: 'open-access-papers',
    description: 'Open access subset of JSTOR academic content.',
    license: 'Varies',
    supports: { search: true, fetchMetadata: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for JSTOR Open' }),
    context
  };
}
