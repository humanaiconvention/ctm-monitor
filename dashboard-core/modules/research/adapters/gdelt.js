export function registerGDELT(context = {}) {
  return {
    id: 'gdelt',
    name: 'GDELT',
    kind: 'global-events-database',
    description: 'Global Database of Events, Language, and Tone.',
    license: 'Open (with attribution)',
    supports: { search: true, fetchEvent: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for GDELT' }),
    context
  };
}
