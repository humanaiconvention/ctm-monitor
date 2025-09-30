/** OpenMined integration adapter (placeholder)
 * Responsibilities (future):
 *  - Initiate privacy-preserving / federated tasks
 *  - Surface ethical impact signals (data locality, differential privacy params)
 *  - Provide conflict metadata when public hosting is requested simultaneously
 */
export function registerOpenMined(context) {
  return {
    name: 'OpenMined',
    version: '0.0.0-dev',
    enabled: false,
    capabilities: ['privacy-preserving compute', 'federated data ethics'],
    activate: async () => { /* TODO: lazy import client once implemented */ },
    status: () => ({ connected: false }),
  };
}
