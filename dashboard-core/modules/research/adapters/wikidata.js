export function registerWikidata(context = {}) {
  return {
    id: 'wikidata',
    name: 'Wikidata',
    kind: 'structured-knowledge-base',
    description: 'Collaborative knowledge base of structured data.',
    license: 'CC0',
    supports: { search: true, fetchEntity: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for Wikidata' }),
    context
  };
}
