export function registerGoogleNews(context = {}) {
  return {
    id: 'google_news',
    name: 'Google News',
    kind: 'aggregated-news',
    description: 'Aggregated news headlines and links.',
    license: 'Aggregated (source dependent)',
    supports: { search: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for Google News' }),
    context
  };
}
