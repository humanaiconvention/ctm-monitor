// Smoke test for agent + registry (runs in Node environment if test runner configured)
import { createAgent } from '../../modules/agent/index.js';

describe('Agent + Registry', () => {
  it('lists azure models and invokes a stub', async () => {
    const agent = createAgent();
    const models = agent.listModels();
    expect(Array.isArray(models)).toBe(true);
    expect(models.find(m => m.name === 'gpt-5')).toBeTruthy();
    const res = await agent.invoke({ prompt: 'hi', model: 'gpt-5' });
    expect(res).toHaveProperty('model', 'gpt-5');
    expect(res).toHaveProperty('output');
  });
});