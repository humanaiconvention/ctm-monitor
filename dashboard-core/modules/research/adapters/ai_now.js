export function registerAINow(context = {}) {
  return {
    id: 'ai_now',
    name: 'AI Now Institute',
    kind: 'policy-research',
    description: 'AI Now Institute research on social implications of AI.',
    license: 'Mixed',
    supports: { search: true, fetchReport: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for AI Now Institute' }),
    context
  };
}
