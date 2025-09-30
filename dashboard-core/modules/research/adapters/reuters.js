export function registerReuters(context = {}) {
  return {
    id: 'reuters',
    name: 'Reuters',
    kind: 'newswire',
    description: 'International news wire service.',
    license: 'Proprietary (API Terms)',
    supports: { search: true, fetchArticle: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for Reuters' }),
    context
  };
}
