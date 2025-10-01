// Lightweight agent orchestrator that selects a model and performs a single-step invocation.
// Future roadmap: planning, tool use, multi-turn memory, provenance logging.
import { listAllModels, invokeAny, invokeAnyStream } from '../models/registry.js';
import { recordProvenance } from './provenance.js';
import { hasUserConsent, setUserConsent } from './consent.js';

export class Agent {
  constructor({ defaultModel = 'gpt-5', hooks = {} } = {}) {
    this.defaultModel = defaultModel;
    this.hooks = {
      beforeInvoke: hooks.beforeInvoke || (async () => {}),
      afterInvoke: hooks.afterInvoke || (async () => {}),
      onError: hooks.onError || (async () => {}),
    };
    this._tools = new Map();
    this._continuations = new Map(); // id -> { model, prompt, outputSoFar, limitMeta }
    this._continuationTTLms = parseInt(process?.env?.CONTINUATION_TTL_MS || '900000', 10); // 15 min default
    this._continuationMax = parseInt(process?.env?.CONTINUATION_MAX || '200', 10);
  }

  listModels() { return listAllModels(); }

  async invoke({ prompt, model, options = {} }) {
    const chosen = model || this.defaultModel;
    const ctx = { model: chosen, prompt, options, startedAt: Date.now() };
    try {
      await this.hooks.beforeInvoke(ctx);
      const result = await invokeAny(chosen, prompt, options);
      ctx.result = result;
      ctx.latencyMs = Date.now() - ctx.startedAt;
      await this.hooks.afterInvoke(ctx);
      recordProvenance({ model: chosen, prompt, result, latencyMs: ctx.latencyMs });
      return { ...result, latencyMs: ctx.latencyMs };
    } catch (err) {
      ctx.error = err;
      recordProvenance({ model: chosen, prompt, error: err, latencyMs: Date.now() - ctx.startedAt });
      await this.hooks.onError(ctx);
      throw err;
    }
  }

  stream({ prompt, model, options = {} }) {
    const chosen = model || this.defaultModel;
    const startedAt = Date.now();
    const iterator = invokeAnyStream(chosen, prompt, options);
    const self = this;
    async function *wrapped() {
      try {
        let accumulated = '';
        let limitMeta = null;
        for await (const chunk of iterator) {
          if (chunk.delta) accumulated += chunk.delta;
          if (chunk.event === 'limit_info') limitMeta = { limit: chunk.limit, rationale: chunk.rationale };
          if (chunk.event === 'limit_notice') {
            // Store continuation context
            const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
            // Cleanup expired before insert
            self._cleanupContinuations();
            self._continuations.set(id, { model: chosen, prompt, outputSoFar: accumulated, limitMeta, ts: Date.now() });
            // Enforce size cap (FIFO removal of oldest)
            if (self._continuations.size > self._continuationMax) {
              const oldest = [...self._continuations.entries()].sort((a,b)=>a[1].ts-b[1].ts)[0];
              if (oldest) self._continuations.delete(oldest[0]);
            }
            chunk.continuationId = id;
          }
          yield chunk;
        }
        recordProvenance({ model: chosen, prompt, result: { usage: null }, latencyMs: Date.now() - startedAt });
      } catch (error) {
        recordProvenance({ model: chosen, prompt, error, latencyMs: Date.now() - startedAt });
        throw error;
      }
    }
    return wrapped();
  }

  // Continue a previously truncated stream by providing optional new instructions.
  continueStream({ continuationId, extraDirective = '', options = {} }) {
    const ctx = this._continuations.get(continuationId);
    if (!ctx) throw new Error('Unknown continuation id');
    if (Date.now() - ctx.ts > this._continuationTTLms) {
      this._continuations.delete(continuationId);
      throw new Error('Continuation expired');
    }
    const { model, prompt, outputSoFar } = ctx;
    const continuationPrompt = `${prompt}\n\n[Prior partial output truncated]\n${outputSoFar.slice(-4000)}\n\nContinue${extraDirective ? (': ' + extraDirective) : ''}`;
    return this.stream({ prompt: continuationPrompt, model, options });
  }

  listContinuations() { this._cleanupContinuations(); return Array.from(this._continuations.entries()).map(([id, v]) => ({ id, model: v.model, created: v.ts, limit: v.limitMeta?.limit })); }

  _cleanupContinuations() {
    const now = Date.now();
    for (const [id, v] of this._continuations.entries()) {
      if (now - v.ts > this._continuationTTLms) this._continuations.delete(id);
    }
  }

  consentGranted() { return hasUserConsent(); }
  grantConsent() { setUserConsent(true); }

  // Tool registration: tool = { name, description, schema(optional), run: async (input, context)=>{} }
  registerTool(tool) {
    if (!tool || !tool.name || typeof tool.run !== 'function') throw new Error('Invalid tool spec');
    this._tools.set(tool.name, tool);
  }
  listTools() { return Array.from(this._tools.values()).map(t => ({ name: t.name, description: t.description || '' })); }
  async runTool(name, input, context = {}) {
    const t = this._tools.get(name);
    if (!t) throw new Error(`Tool not found: ${name}`);
    return await t.run(input, { agent: this, ...context });
  }

  // Naive planner: If the prompt contains pattern: tool:toolName {json} then execute that tool, else direct model invocation.
  // Returns { steps: [...], final }
  async planAndExecute({ prompt, model, options = {} }) {
    const toolPattern = /tool:([a-zA-Z0-9_-]+)\s+({[\s\S]*})/m;
    const m = prompt.match(toolPattern);
    const steps = [];
    if (m) {
      const toolName = m[1];
      let args = {};
      try { args = JSON.parse(m[2]); } catch { /* ignore parse errors */ }
      steps.push({ type: 'tool', tool: toolName, input: args });
      const toolResult = await this.runTool(toolName, args, { originalPrompt: prompt });
      steps.push({ type: 'toolResult', tool: toolName, output: toolResult });
      // Append tool result summary to model prompt
      const followPrompt = prompt + `\n\nTool ${toolName} output:\n${JSON.stringify(toolResult).slice(0,2000)}`;
      const modelResult = await this.invoke({ prompt: followPrompt, model, options });
      steps.push({ type: 'model', model: modelResult.model, output: modelResult.output });
      return { steps, final: modelResult.output };
    }
    const direct = await this.invoke({ prompt, model, options });
    steps.push({ type: 'model', model: direct.model, output: direct.output });
    return { steps, final: direct.output };
  }
}

export function createAgent(config) { return new Agent(config); }

export default { Agent, createAgent };