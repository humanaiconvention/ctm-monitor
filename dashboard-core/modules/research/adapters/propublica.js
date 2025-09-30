export function registerProPublica(context = {}) {
  return {
    id: 'propublica',
    name: 'ProPublica',
    kind: 'investigative-journalism',
    description: 'Investigative journalism data and stories.',
    license: 'CC BY-NC-ND',
    supports: { search: true, fetchArticle: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for ProPublica' }),
    context
  };
}
