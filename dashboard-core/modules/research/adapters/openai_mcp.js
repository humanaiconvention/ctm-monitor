export function registerOpenAIMCP(context = {}) {
  return {
    id: 'openai_mcp',
    name: 'OpenAI MCP',
    kind: 'model-context-protocol',
    description: 'Model Context Protocol integration for tool and data negotiation.',
    license: 'Proprietary / API Terms',
    supports: { toolInvocation: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for OpenAI MCP (research module)' }),
    context
  };
}
