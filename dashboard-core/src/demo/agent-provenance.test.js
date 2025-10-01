import { createAgent } from '../../modules/agent/index.js';
import { listProvenance, clearProvenance } from '../../modules/agent/provenance.js';
import { setUserConsent } from '../../modules/agent/consent.js';

describe('Agent provenance', () => {
  beforeEach(() => { clearProvenance(); setUserConsent(true); });
  it('records provenance for successful invoke', async () => {
    const agent = createAgent();
    const res = await agent.invoke({ prompt: 'test provenance', model: 'gpt-5' });
    expect(res).toHaveProperty('model', 'gpt-5');
    const entries = listProvenance({ limit: 5 });
    expect(entries.length).toBe(1);
    expect(entries[0].ok).toBe(true);
    expect(entries[0].promptHash).toMatch(/^[a-f0-9]{32}$/);
  });
});