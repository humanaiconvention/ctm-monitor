/*
  Tests for extended agent / azure client features:
   - Azure AD auth fallback (no API key, client credentials)
   - SSE streaming via mocked azureInvokeChatStream
   - Provenance JSONL persistence
   - Tool planner (planAndExecute) path
*/

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Agent } from '../../modules/agent/index.js';
import { configureProvenance, listProvenance, clearProvenance } from '../../modules/agent/provenance.js';
import { azureInvokeChat, azureInvokeChatStream, authMode } from '../../modules/azure/client.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

const ORIGINAL_ENV = { ...process.env };
const originalFetch = global.fetch;

function resetEnv() {
  Object.keys(process.env).forEach(k => { if (k.startsWith('AZURE_') || k.startsWith('PROVENANCE_')) delete process.env[k]; });
}

beforeEach(() => {
  resetEnv();
  clearProvenance();
});

afterEach(() => {
  global.fetch = originalFetch;
  resetEnv();
});

describe('Azure AD auth fallback', () => {
  it('uses Bearer token when API key absent', async () => {
    process.env.AZURE_OPENAI_ENDPOINT = 'https://example-endpoint.openai.azure.com';
    process.env.AZURE_TENANT_ID = 'tenant';
    process.env.AZURE_CLIENT_ID = 'client';
    process.env.AZURE_CLIENT_SECRET = 'secret';
    process.env.AZURE_OPENAI_DEPLOYMENTS = JSON.stringify({ 'gpt-5': 'gpt5Deployment' });

    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url, opts });
      if (url.includes('login.microsoftonline.com')) {
        return new Response(JSON.stringify({ access_token: 'AAD_TOKEN', expires_in: 3600 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.includes('/chat/completions')) {
        // Ensure Authorization header present
        expect(opts.headers.Authorization).toBe('Bearer AAD_TOKEN');
        return new Response(JSON.stringify({ choices: [{ message: { content: 'hello aad' } }], usage: { input_tokens: 1 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      throw new Error('Unexpected URL ' + url);
    });

    const result = await azureInvokeChat({ model: 'gpt-5', messages: [{ role: 'user', content: 'Hi' }] });
    expect(result.output).toContain('hello aad');
    expect(authMode()).toBe('aad');
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });
});

describe('SSE streaming mock', () => {
  it('yields deltas and completes', async () => {
    process.env.AZURE_OPENAI_ENDPOINT = 'https://example-endpoint.openai.azure.com';
    process.env.AZURE_OPENAI_API_KEY = 'key';
    process.env.AZURE_OPENAI_DEPLOYMENTS = JSON.stringify({ 'gpt-5': 'gpt5Deployment' });

    // Mock fetch returning an SSE-like stream
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: [DONE]\n\n'
    ];
    let readIndex = 0;
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      body: {
        getReader() {
          return {
            async read() {
              if (readIndex >= chunks.length) return { done: true };
              const value = new TextEncoder().encode(chunks[readIndex++]);
              return { done: false, value };
            }
          };
        }
      }
    }));

    const { stream } = await azureInvokeChatStream({ model: 'gpt-5', messages: [{ role: 'user', content: 'Hi' }] });
    const collected = [];
    for await (const c of stream) {
      if (c.delta) collected.push(c.delta);
    }
    expect(collected.join('')).toBe('Hello');
  });
});

describe('Provenance JSONL persistence', () => {
  it('writes a provenance line to JSONL file', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prov-')); 
    const jsonl = path.join(tmpDir, 'prov.jsonl');
    configureProvenance({ jsonlPath: jsonl, ringSize: 10 });
    const agent = new Agent({ defaultModel: 'gpt-5' });
    // Ensure stub path (no azure config) -> model outputs stub
    const result = await agent.invoke({ prompt: 'Test provenance persist' });
    expect(result.model).toBe('gpt-5');
    const lines = fs.readFileSync(jsonl, 'utf8').trim().split(/\n/);
    expect(lines.length).toBeGreaterThanOrEqual(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.ok).toBe(true);
    expect(parsed.model).toBe('gpt-5');
  });
});

describe('Tool planner', () => {
  it('detects tool directive, runs tool, then model', async () => {
    const agent = new Agent({ defaultModel: 'gpt-5' });
    // Override invoke to inspect prompt content
    agent.invoke = async ({ prompt }) => ({ model: 'gpt-5', output: prompt.includes('"sum":5') ? 'ack sum=5' : 'no ack' });
    agent.registerTool({
      name: 'addNumbers',
      description: 'Adds two numbers',
      run: ({ a, b }) => ({ sum: a + b })
    });
    const res = await agent.planAndExecute({ prompt: 'Calculate: tool:addNumbers {"a":2,"b":3}' });
    expect(res.steps[0].type).toBe('tool');
    expect(res.steps[1].type).toBe('toolResult');
    expect(res.steps.find(s=>s.type==='toolResult').output.sum).toBe(5);
    expect(res.final).toContain('ack');
  });
});
