import { createAgent } from '../../modules/agent/index.js';
import { setUserConsent } from '../../modules/agent/consent.js';

describe('Agent streaming', () => {
  beforeEach(() => { setUserConsent(true); });
  it('streams chunks for gpt-5', async () => {
    const agent = createAgent();
    const chunks = [];
    for await (const c of agent.stream({ prompt: 'hello stream', model: 'gpt-5' })) {
      chunks.push(c);
    }
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.some(c => c.delta)).toBe(true);
  });
});