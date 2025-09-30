export function registerAllenBrainAtlas(context = {}) {
  return {
    id: 'allenbrainatlas',
    name: 'Allen Brain Atlas',
    kind: 'neuroscience-reference',
    description: 'Comprehensive brain gene expression and connectivity atlas.',
    license: 'Mixed / Open',
    supports: { search: true, fetchSection: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for Allen Brain Atlas' }),
    context
  };
}
