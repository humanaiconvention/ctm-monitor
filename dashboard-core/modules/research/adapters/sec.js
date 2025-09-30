export function registerSEC(context = {}) {
  return {
    id: 'sec',
    name: 'SEC Filings',
    kind: 'financial-filings',
    description: 'Public company filings (EDGAR).',
    license: 'Public domain (USA)',
    supports: { search: true, fetchFiling: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for SEC Filings' }),
    context
  };
}
