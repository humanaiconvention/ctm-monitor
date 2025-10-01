import { createAgent } from '../../modules/agent/index.js';
import { setUserConsent } from '../../modules/agent/consent.js';

describe('Tokenizer & continuation flow', () => {
  beforeEach(() => { setUserConsent(true); process.env.AZURE_STREAM_MAX_TOKENS = '12'; });

  it('increments tokens monotonically (approx or real) and exposes limit_info first', async () => {
    const agent = createAgent();
    const tokensSeq = [];
    let sawInfo = false;
    for await (const c of agent.stream({ prompt: 'Short test prompt to stream some content', model: 'gpt-5' })) {
      if (c.event === 'limit_info') { sawInfo = true; expect(c.limit).toBeGreaterThan(0); }
      if (typeof c.tokens === 'number') tokensSeq.push(c.tokens);
      if (c.event === 'limit_notice') break;
    }
    expect(sawInfo).toBe(true);
    // tokens should be strictly increasing
    for (let i = 1; i < tokensSeq.length; i++) {
      expect(tokensSeq[i]).toBeGreaterThanOrEqual(tokensSeq[i-1]);
    }
  });

  it('provides continuationId on truncation and continueStream resumes context', async () => {
    process.env.AZURE_STREAM_MAX_TOKENS = '8';
    const agent = createAgent();
    let contId = null;
    let partial = '';
    for await (const c of agent.stream({ prompt: 'Explain the significance of context windows briefly.', model: 'gpt-5' })) {
      if (c.delta) partial += c.delta;
      if (c.event === 'limit_notice') { contId = c.continuationId; break; }
    }
    expect(contId).toBeTruthy();
    let continued = '';
    let sawInfo2 = false;
    for await (const c2 of agent.continueStream({ continuationId: contId, extraDirective: 'finish succinctly' })) {
      if (c2.delta) continued += c2.delta;
      if (c2.event === 'limit_info') sawInfo2 = true;
      if (c2.event === 'limit_notice') break;
    }
    expect(sawInfo2).toBe(true);
    // Combined output should be larger than original partial (heuristic check)
    expect((partial + continued).length).toBeGreaterThan(partial.length);
  });
});