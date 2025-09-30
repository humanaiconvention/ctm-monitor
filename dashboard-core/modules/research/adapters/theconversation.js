export function registerTheConversation(context = {}) {
  return {
    id: 'theconversation',
    name: 'The Conversation',
    kind: 'expert-commentary',
    description: 'Independent, academic-sourced news commentary.',
    license: 'CC BY-ND',
    supports: { search: true, fetchArticle: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for The Conversation' }),
    context
  };
}
