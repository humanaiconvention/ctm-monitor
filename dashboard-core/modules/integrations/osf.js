/** OSF (Open Science Framework) integration adapter (placeholder)
 * Responsibilities (future):
 *  - Sync preregistration / dataset metadata
 *  - Link ORCID identity and contribution provenance
 *  - Provide reproducibility manifest export
 */
export function registerOSF(context) {
  return {
    name: 'OSF',
    version: '0.0.0-dev',
    enabled: false,
    capabilities: ['research sync', 'ORCID linkage', 'data contribution'],
    activate: async () => { /* TODO: implement OSF API client */ },
    status: () => ({ connected: false }),
  };
}
