import { describe, it, expect, beforeEach, vi } from 'vitest';
import client from '../../modules/azure/client.js';

const originalFetch = global.fetch;
function resetEnv() { Object.keys(process.env).forEach(k => { if (k.startsWith('AZURE_')) delete process.env[k]; }); }

beforeEach(() => { resetEnv(); global.fetch = originalFetch; });

function baseAzureEnv() {
  process.env.AZURE_OPENAI_ENDPOINT = 'https://example-endpoint.openai.azure.com';
  process.env.AZURE_OPENAI_API_KEY = 'key';
  process.env.AZURE_OPENAI_DEPLOYMENTS = JSON.stringify({ 'gpt-5': 'gpt5Deployment' });
}

describe('Retry tuning & jitter', () => {
  it('honors retry env & no jitter mode', async () => {
    baseAzureEnv();
    process.env.AZURE_RETRY_RETRIES = '2';
    process.env.AZURE_RETRY_BASE_DELAY_MS = '10';
    process.env.AZURE_RETRY_MAX_DELAY_MS = '20';
    process.env.AZURE_RETRY_JITTER = 'none';
    let calls = 0; const timestamps = [];
    global.fetch = vi.fn(async () => { calls++; timestamps.push(Date.now()); return new Response('fail', { status: 500 }); });
    const start = Date.now();
    await expect(client.azureInvokeChat({ model: 'gpt-5', messages: [{ role:'user', content:'x'}] })).rejects.toThrow();
    expect(calls).toBe(3); // initial + 2 retries
    // With no jitter we expect roughly deterministic cumulative backoff: 10 + 20
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(25); // allow small scheduling variance
  }, 5000);
});

describe('Rate limiter', () => {
  it('blocks when tokens exhausted', async () => {
    baseAzureEnv();
    process.env.AZURE_RL_CAPACITY = '2';
    process.env.AZURE_RL_REFILL_MS = '1000';
    let call = 0;
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ choices:[{ message:{ content: 'ok'+(++call) } }] }), { status:200, headers:{'Content-Type':'application/json'} }));
    const ok1 = await client.azureInvokeChat({ model:'gpt-5', messages:[{ role:'user', content:'a'}] });
    const ok2 = await client.azureInvokeChat({ model:'gpt-5', messages:[{ role:'user', content:'b'}] });
    expect(ok1.output).toContain('ok');
    expect(ok2.output).toContain('ok');
    await expect(client.azureInvokeChat({ model:'gpt-5', messages:[{ role:'user', content:'c'}] })).rejects.toThrow(/Rate limit/);
  });
});

describe('Streaming token cap', () => {
  it('aborts when max tokens exceeded', async () => {
    baseAzureEnv();
    process.env.AZURE_STREAM_MAX_TOKENS = '2';
    // Provide SSE responses: two normal deltas then third triggers abort
    const events = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"World"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"Overflow"}}]}\n\n'
    ];
    let idx=0;
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      body: { getReader(){ return { async read(){ if(idx>=events.length) return {done:true}; return {done:false, value:new TextEncoder().encode(events[idx++])}; } }; } }
    }));
    const { stream } = await client.azureInvokeChatStream({ model:'gpt-5', messages:[{ role:'user', content:'hi'}] });
    const chunks = [];
    for await (const c of stream) chunks.push(c);
    const abortChunk = chunks.find(c=>c.abort);
    expect(abortChunk).toBeTruthy();
    expect(abortChunk.reason).toBe('max_stream_tokens_exceeded');
  });
});
