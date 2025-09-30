export function registerOECDAIPolicy(context = {}) {
  return {
    id: 'oecd_ai_policy',
    name: 'OECD AI Policy Observatory',
    kind: 'policy-dataset',
    description: 'Global AI policy initiatives and metrics.',
    license: 'Open (attribution)',
    supports: { search: true, fetchDataset: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for OECD AI Policy Observatory' }),
    context
  };
}
