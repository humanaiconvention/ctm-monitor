export function registerStanfordEncyclopedia(context = {}) {
  return {
    id: 'stanfordencyclopedia',
    name: 'Stanford Encyclopedia of Philosophy',
    kind: 'philosophy-reference',
    description: 'Scholarly dynamic reference work in philosophy.',
    license: 'CC BY-NC-ND',
    supports: { search: true, fetchEntry: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for Stanford Encyclopedia of Philosophy' }),
    context
  };
}
