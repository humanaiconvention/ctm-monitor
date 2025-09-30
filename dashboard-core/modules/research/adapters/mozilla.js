export function registerMozilla(context = {}) {
  return {
    id: 'mozilla',
    name: 'Mozilla Foundation',
    kind: 'internet-health-research',
    description: 'Mozilla Foundation reports and open internet health data.',
    license: 'Mixed',
    supports: { search: true, fetchReport: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for Mozilla Foundation' }),
    context
  };
}
