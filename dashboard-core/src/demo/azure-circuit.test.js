import { describe, it, expect, beforeEach, vi } from 'vitest';
import client, { onCircuitEvent, listCircuitEvents } from '../../modules/azure/client.js';

// We will simulate failures by mocking fetch to return retriable status codes.

const ORIGINAL_ENV = { ...process.env };
const originalFetch = global.fetch;

function resetEnv() {
  Object.keys(process.env).forEach(k => { if (k.startsWith('AZURE_')) delete process.env[k]; });
}

beforeEach(() => {
  resetEnv();
  global.fetch = originalFetch;
});

function setupAzureEnv() {
  process.env.AZURE_OPENAI_ENDPOINT = 'https://example-endpoint.openai.azure.com';
  process.env.AZURE_OPENAI_API_KEY = 'key';
  process.env.AZURE_OPENAI_DEPLOYMENTS = JSON.stringify({ 'gpt-5': 'gpt5Deployment' });
  process.env.AZURE_CB_THRESHOLD = '3';
  process.env.AZURE_CB_COOLDOWN_MS = '50';
}

describe('Circuit Breaker', () => {
  it('opens after threshold failures and then transitions half-open then close on success', async () => {
    setupAzureEnv();
    const events = [];
    const off = onCircuitEvent(e => events.push(e));

    let callCount = 0;
    global.fetch = vi.fn(async () => {
      callCount++;
      // First 3 calls fail with 500 to open circuit (threshold=3)
      if (callCount <= 3) return new Response('err', { status: 500 });
      // After open: simulate cooldown elapsed by advancing time (we cannot easily mock Date.now here, rely on real delay)
      if (callCount === 4) return new Response('err', { status: 500 });
      // After half-open probe success
      return new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    // Trigger failures
    for (let i=0;i<3;i++) {
      await expect(client.azureInvokeChat({ model: 'gpt-5', messages: [{ role:'user', content:'x'}] })).rejects.toThrow();
    }
    // Circuit should be open
    const openEvt = events.find(e=> e.event==='open');
    expect(openEvt).toBeTruthy();

    // Wait for cooldown
    await new Promise(r => setTimeout(r, 60));

    // This call should act as half-open probe (may fail or succeed). We forced a failure at callCount 4.
    await expect(client.azureInvokeChat({ model: 'gpt-5', messages: [{ role:'user', content:'x'}] })).rejects.toThrow();
    const halfEvt = events.find(e=> e.event==='half-open');
    expect(halfEvt).toBeTruthy();

    // Wait again for cooldown
    await new Promise(r => setTimeout(r, 60));

    // Successful probe closes breaker
    const success = await client.azureInvokeChat({ model: 'gpt-5', messages: [{ role:'user', content:'x'}] });
    expect(success.output).toBe('ok');
    const closeEvt = events.find(e=> e.event==='close');
    expect(closeEvt).toBeTruthy();

    off();

    // Ensure events list API returns recent events
    const recent = listCircuitEvents(5);
    expect(recent.length).toBeGreaterThanOrEqual(3);
  }, 10000);
});
