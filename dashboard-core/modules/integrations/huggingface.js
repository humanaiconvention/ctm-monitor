/** Hugging Face integration adapter (placeholder)
 * Responsibilities (future):
 *  - Manage dataset synchronization / model card retrieval
 *  - Embed Spaces or Inference Widgets
 *  - Coordinate with privacy layer (conflict with private-only modes)
 */
export function registerHuggingFace(context) {
  return {
    name: 'Hugging Face',
    version: '0.0.0-dev',
    enabled: false,
    capabilities: ['model hosting', 'Spaces embedding', 'dataset sync'],
    activate: async () => { /* TODO: dynamic import of hf libs */ },
    status: () => ({ connected: false }),
  };
}
