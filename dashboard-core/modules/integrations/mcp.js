/** OpenAI MCP integration adapter (placeholder)
 * Responsibilities (future):
 *  - Discover available MCP tools and schema
 *  - Record provenance / tool invocation metadata for transparency
 *  - Map tool capabilities to Convention tile actions
 */
export function registerMCP(context) {
  return {
    name: 'OpenAI MCP',
    version: '0.0.0-dev',
    enabled: false,
    capabilities: ['model metadata', 'provenance tracking'],
    activate: async () => { /* TODO: implement MCP handshake */ },
    status: () => ({ connected: false }),
  };
}
