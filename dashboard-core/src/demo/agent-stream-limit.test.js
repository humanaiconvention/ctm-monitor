import { createAgent } from '../../modules/agent/index.js';
import { setUserConsent } from '../../modules/agent/consent.js';

// Force a very low limit via env + heuristic to test truncation transparency.
// We simulate by setting legacy cap env and short prompt to ensure limit_info event appears.

describe('Agent streaming limit transparency', () => {
  beforeEach(() => { setUserConsent(true); });
  it('emits limit_info then truncates with limit_notice', async () => {
    // Set a tiny legacy cap so it overrides heuristic
    process.env.AZURE_STREAM_MAX_TOKENS = '5';
    const agent = createAgent();
    const chunks = [];
    for await (const c of agent.stream({ prompt: 'tiny', model: 'gpt-5' })) {
      chunks.push(c);
      if (c.truncated || c.event === 'limit_notice') break; // stop once truncated
    }
    const info = chunks.find(c => c.event === 'limit_info');
    expect(info).toBeTruthy();
    const notice = chunks.find(c => c.event === 'limit_notice');
    expect(notice).toBeTruthy();
    expect(notice.limit).toBe(5);
    // Ensure surrogate token counter reached limit
    expect(notice.tokens).toBeGreaterThanOrEqual(5);
  });
});
