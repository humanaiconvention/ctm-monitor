export function registerOpenCorporates(context = {}) {
  return {
    id: 'opencorporates',
    name: 'OpenCorporates',
    kind: 'corporate-registry',
    description: 'Global open database of company information.',
    license: 'Open Database License',
    supports: { search: true, fetchCompany: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for OpenCorporates' }),
    context
  };
}
