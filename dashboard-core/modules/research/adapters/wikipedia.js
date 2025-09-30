export function registerWikipedia(context = {}) {
  return {
    id: 'wikipedia',
    name: 'Wikipedia',
    kind: 'encyclopedia',
    description: 'Open collaboratively edited encyclopedia.',
    license: 'CC-BY-SA',
    supports: { search: true, fetchPage: true, summarization: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for Wikipedia' }),
    context
  };
}
