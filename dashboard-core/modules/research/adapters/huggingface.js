export function registerHuggingFace(context = {}) {
  return {
    id: 'huggingface',
    name: 'Hugging Face',
    kind: 'ml-models-datasets',
    description: 'Models, datasets, and spaces for machine learning.',
    license: 'Varies',
    supports: { search: true, fetchDataset: true, fetchModel: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for Hugging Face (research module)' }),
    context
  };
}
