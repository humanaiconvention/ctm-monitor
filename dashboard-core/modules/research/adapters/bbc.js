export function registerBBC(context = {}) {
  return {
    id: 'bbc',
    name: 'BBC',
    kind: 'news',
    description: 'BBC News content (subject to licensing constraints).',
    license: 'Proprietary (API Terms)',
    supports: { search: true, fetchArticle: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for BBC' }),
    context
  };
}
