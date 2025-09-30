/** LangChain integration adapter (placeholder)
 * Responsibilities (future):
 *  - Provide composable chain registry
 *  - Track chain provenance + performance metrics
 *  - Expose sandboxed evaluation harness
 */
export function registerLangChain(context) {
  return {
    name: 'LangChain',
    version: '0.0.0-dev',
    enabled: false,
    capabilities: ['agentic workflows', 'chaining logic'],
    activate: async () => { /* TODO: dynamic import langchain modules */ },
    status: () => ({ connected: false }),
  };
}
