// Minimal Azure OpenAI REST client (text completion / chat-like) using fetch.
import { evaluateStreamingLimit } from '../agent/limits.js';
import { countTokens } from '../tokenizer/index.js';
// Environment variables (expected at runtime):
//  Core:
//   - AZURE_OPENAI_ENDPOINT (e.g., https://my-resource.openai.azure.com)
//   - AZURE_OPENAI_DEPLOYMENTS (JSON mapping: { "gpt-5": "myGpt5Deployment" })
//  Auth (choose one):
//   - API Key: AZURE_OPENAI_API_KEY
//   - Azure AD (client credentials fallback when no API key):
//       AZURE_TENANT_ID
//       AZURE_CLIENT_ID
//       AZURE_CLIENT_SECRET
//       (optional) AZURE_OAI_SCOPE  (default: https://cognitiveservices.azure.com/.default)

function env(name) { return typeof process !== 'undefined' ? (process.env?.[name]) : undefined; }

const RETRIABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

// Token bucket rate limiter (requests per interval)
const rlCapacity = parseInt(env('AZURE_RL_CAPACITY') || '30', 10); // max tokens
const rlRefillMs = parseInt(env('AZURE_RL_REFILL_MS') || '60000', 10); // refill window
let rlTokens = rlCapacity;
let rlLastRefill = Date.now();
function rateLimiterState() {
  return { capacity: rlCapacity, refillMs: rlRefillMs, tokens: rlTokens, lastRefill: rlLastRefill };
}
function takeToken() {
  const now = Date.now();
  if ((now - rlLastRefill) >= rlRefillMs) {
    rlTokens = rlCapacity;
    rlLastRefill = now;
  }
  if (rlTokens > 0) { rlTokens--; return true; }
  return false;
}

// Simple circuit breaker state (env configurable)
let cbState = {
  open: false,
  failures: 0,
  openedAt: 0,
  cooldownMs: parseInt(env('AZURE_CB_COOLDOWN_MS') || '15000', 10),
  threshold: parseInt(env('AZURE_CB_THRESHOLD') || '5', 10),
  halfOpenProbe: false
};

// Circuit breaker event tracking
const _cbListeners = new Set();
let _cbEvents = [];
const _cbEventsMax = 200;
let fsMod; try { fsMod = await import('fs'); } catch {}
const cbEventsJsonlPath = env('AZURE_CB_EVENTS_JSONL_PATH') || null;

function emitCircuit(event, extra = {}) {
  const payload = { ts: Date.now(), event, state: circuitState(), ...extra };
  _cbEvents.unshift(payload); if (_cbEvents.length > _cbEventsMax) _cbEvents.pop();
  for (const l of _cbListeners) { try { l(payload); } catch {} }
  if (cbEventsJsonlPath && fsMod?.promises) {
    fsMod.promises.appendFile(cbEventsJsonlPath, JSON.stringify(payload) + '\n').catch(()=>{});
  }
}

function circuitState() { return { ...cbState, now: Date.now() }; }

function circuitShouldBlock() {
  if (!cbState.open) return false;
  const now = Date.now();
  if ((now - cbState.openedAt) > cbState.cooldownMs) {
    // Enter half-open probe
    cbState.halfOpenProbe = true;
    emitCircuit('half-open');
    return false;
  }
  return true;
}

function circuitReport(success) {
  if (success) {
    if (cbState.halfOpenProbe || cbState.open) {
      // Reset on successful probe
      cbState.open = false;
      cbState.halfOpenProbe = false;
      cbState.failures = 0;
      emitCircuit('close');
    } else {
      cbState.failures = 0;
    }
    return;
  }
  cbState.failures++;
  if (cbState.failures >= cbState.threshold && !cbState.open) {
    cbState.open = true;
    cbState.openedAt = Date.now();
    emitCircuit('open');
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithRetry(url, options, { retries, baseDelay, maxDelay } = {}) {
  const envRetries = parseInt(env('AZURE_RETRY_RETRIES') || '', 10);
  const envBase = parseInt(env('AZURE_RETRY_BASE_DELAY_MS') || '', 10);
  const envMax = parseInt(env('AZURE_RETRY_MAX_DELAY_MS') || '', 10);
  if (!Number.isFinite(retries)) retries = Number.isFinite(envRetries) ? envRetries : 4;
  if (!Number.isFinite(baseDelay)) baseDelay = Number.isFinite(envBase) ? envBase : 200;
  if (!Number.isFinite(maxDelay)) maxDelay = Number.isFinite(envMax) ? envMax : 4000;
  if (circuitShouldBlock()) {
    const err = new Error('Circuit breaker open: blocking outbound Azure request');
    err.meta = { circuit: circuitState() };
    throw err;
  }
  if (!takeToken()) {
    const err = new Error('Rate limit exceeded (token bucket empty)');
    err.meta = { rateLimiter: rateLimiterState() };
    throw err;
  }
  let attempt = 0; let lastErr; let lastStatus; let response;
  while (attempt <= retries) {
    try {
      response = await fetch(url, options);
      lastStatus = response.status;
      if (!response.ok && RETRIABLE_STATUS.has(response.status)) {
        // 429 special: honor Retry-After
        let delay = computeDelay(attempt, baseDelay, maxDelay);
        if (response.status === 429) {
          const ra = response.headers.get('retry-after');
            if (ra) {
              const parsed = parseRetryAfter(ra);
              if (parsed) delay = Math.min(parsed, maxDelay);
            }
        }
        if (attempt === retries) break;
        await sleep(delay);
        attempt++;
        continue;
      }
      // Non-retriable error or success
      circuitReport(response.ok);
      return response;
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      await sleep(computeDelay(attempt, baseDelay, maxDelay));
      attempt++;
    }
  }
  const e = new Error(`Fetch failed after ${attempt+1} attempt(s)${lastStatus? ' status '+lastStatus: ''}: ${lastErr?.message || 'HTTP '+lastStatus}`);
  e.meta = { attempts: attempt+1, lastStatus };
  circuitReport(false);
  throw e;
}

function computeDelay(attempt, base, max) {
  const exp = Math.min(max, base * Math.pow(2, attempt));
  const mode = (env('AZURE_RETRY_JITTER') || 'full').toLowerCase();
  if (mode === 'none') return exp;
  // default: full jitter
  return Math.floor(Math.random() * exp);
}

function parseRetryAfter(value) {
  if (!value) return null;
  if (/^\d+$/.test(value)) return parseInt(value,10) * 1000;
  const date = Date.parse(value);
  if (!isNaN(date)) return Math.max(0, date - Date.now());
  return null;
}

// Track cached AAD token
let _aadTokenCache = null; // { token, expiresAt }

export function isAzureConfigured() {
  if (!env('AZURE_OPENAI_ENDPOINT')) return false;
  if (env('AZURE_OPENAI_API_KEY')) return true;
  // Accept Azure AD configuration as valid if all vars present
  return !!(env('AZURE_TENANT_ID') && env('AZURE_CLIENT_ID') && env('AZURE_CLIENT_SECRET'));
}

export function hasApiKey() { return !!env('AZURE_OPENAI_API_KEY'); }

export function hasAADCreds() {
  return !!(env('AZURE_TENANT_ID') && env('AZURE_CLIENT_ID') && env('AZURE_CLIENT_SECRET'));
}

export function authMode() {
  return hasApiKey() ? 'api-key' : (hasAADCreds() ? 'aad' : 'none');
}

async function fetchAADToken() {
  if (!hasAADCreds()) throw new Error('Azure AD credentials not fully specified');
  const now = Date.now();
  if (_aadTokenCache && (_aadTokenCache.expiresAt - 300000) > now) { // 5 min safety window
    return _aadTokenCache.token;
  }
  const tenant = env('AZURE_TENANT_ID');
  const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env('AZURE_CLIENT_ID'),
    client_secret: env('AZURE_CLIENT_SECRET'),
    scope: env('AZURE_OAI_SCOPE') || 'https://cognitiveservices.azure.com/.default'
  });
  let res;
  try {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  } catch (e) {
    const err = new Error(`Failed to reach Azure AD token endpoint: ${e.message}`);
    err.cause = e; throw err;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Azure AD token error ${res.status}: ${text}`);
  }
  const json = await res.json();
  if (!json.access_token) throw new Error('Azure AD token response missing access_token');
  const expiresIn = typeof json.expires_in === 'number' ? json.expires_in : 3600;
  _aadTokenCache = { token: json.access_token, expiresAt: now + (expiresIn * 1000) };
  return json.access_token;
}

async function resolveAuthHeaders() {
  if (hasApiKey()) return { 'api-key': env('AZURE_OPENAI_API_KEY') || '' };
  if (hasAADCreds()) {
    const token = await fetchAADToken();
    return { 'Authorization': `Bearer ${token}` };
  }
  throw new Error('No Azure OpenAI auth configured (need API key or AAD credentials)');
}

export function getDeploymentFor(model) {
  try {
    const raw = env('AZURE_OPENAI_DEPLOYMENTS');
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[model] || null;
  } catch { return null; }
}

export async function azureInvokeChat({ model, messages, temperature = 0.7 }) {
  if (!isAzureConfigured()) throw new Error('Azure OpenAI not configured');
  const endpoint = env('AZURE_OPENAI_ENDPOINT').replace(/\/$/, '');
  const deployment = getDeploymentFor(model);
  if (!deployment) throw new Error(`No deployment mapping for model '${model}'`);
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-06-01`; // example API version
  const authHeaders = await resolveAuthHeaders();
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
    body: JSON.stringify({ messages, temperature })
  });
  if (!res.ok) {
    const text = await res.text();
    const mode = authMode();
    throw new Error(`Azure OpenAI error ${res.status} (auth=${mode}): ${text}`);
  }
  const json = await res.json();
  const choice = json.choices?.[0];
  const content = choice?.message?.content || '';
  return {
    model,
    output: content,
    raw: json,
    usage: json.usage || null,
    auth: authMode()
  };
}

// Streaming SSE endpoint
export async function azureInvokeChatStream({ model, messages, temperature = 0.7 }) {
  if (!isAzureConfigured()) throw new Error('Azure OpenAI not configured');
  const endpoint = env('AZURE_OPENAI_ENDPOINT').replace(/\/$/, '');
  const deployment = getDeploymentFor(model);
  if (!deployment) throw new Error(`No deployment mapping for model '${model}'`);
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-06-01`; // same API version, with stream true
  const authHeaders = await resolveAuthHeaders();
  const controller = new AbortController();
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
    body: JSON.stringify({ messages, temperature, stream: true }),
    signal: controller.signal
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(()=> '');
    throw new Error(`Azure OpenAI stream error ${res.status}: ${text}`);
  }
  // Node / browser ReadableStream handling
  const reader = res.body.getReader ? res.body.getReader() : null;
  if (!reader) throw new Error('Streaming not supported: missing getReader');
  let buffer = '';
  const maxEventBytes = parseInt(env('AZURE_SSE_MAX_EVENT_BYTES') || '65536', 10); // 64KB default
  // Evaluate policy-based limit
  let userAggregate = '';
  try { userAggregate = (messages||[]).filter(m=>m?.role==='user').map(m=>m.content).join('\n').slice(0,4000); } catch {}
  let limitInfo = evaluateStreamingLimit(userAggregate, model);
  const legacyCap = parseInt(env('AZURE_STREAM_MAX_TOKENS') || '0', 10);
  if (legacyCap > 0 && legacyCap < limitInfo.limit) {
    limitInfo = { ...limitInfo, limit: legacyCap, rationale: limitInfo.rationale + ' (legacy cap override)' };
  }
  const enforcedLimit = limitInfo.limit;
  async function *iterate() {
    // Initial transparency event
    yield { event: 'limit_info', limit: enforcedLimit, rationale: limitInfo.rationale };
  let done, value; let finalJSON = null; let fullText = '';
    const usageAcc = {}; // cumulative usage if provided incrementally
  let tokenCount = 0;
    while (true) {
      ({ done, value } = await reader.read());
      if (done) break;
      const chunk = typeof value === 'string' ? value : new TextDecoder().decode(value);
      buffer += chunk;
      // SSE events separated by \n\n
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, idx); buffer = buffer.slice(idx + 2);
        if (maxEventBytes && Buffer.byteLength(rawEvent) > maxEventBytes) {
          // Skip oversized event to avoid memory pressure
            continue;
        }
        const lines = rawEvent.split(/\n/).map(l=>l.trim()).filter(Boolean);
        let dataLines = lines.filter(l=> l.startsWith('data:')).map(l=> l.slice(5).trim());
        for (const dl of dataLines) {
          if (dl === '[DONE]') {
            const finalObj = finalJSON ? { model, output: fullText, raw: finalJSON } : { model, output: fullText };
            if (Object.keys(usageAcc).length) finalObj.usage = { ...usageAcc };
            return finalObj;
          }
          try {
            const parsed = JSON.parse(dl);
            finalJSON = parsed; // last full object
            const delta = parsed.choices?.[0]?.delta?.content;
            // Merge any usage fields (if Azure eventually emits incremental usage)
            const evtUsage = parsed.usage || parsed.choices?.[0]?.usage;
            if (evtUsage && typeof evtUsage === 'object') {
              for (const [k,v] of Object.entries(evtUsage)) {
                if (typeof v === 'number') usageAcc[k] = (usageAcc[k] || 0) + v;
              }
            }
            if (delta) {
              fullText += delta;
              tokenCount = countTokens(fullText, { model });
              if (enforcedLimit && tokenCount >= enforcedLimit) {
                // Emit notice to user then truncate
                yield { event: 'limit_notice', limit: enforcedLimit, tokens: tokenCount, rationale: limitInfo.rationale };
                return { model, output: fullText, truncated: true, limit: enforcedLimit, rationale: limitInfo.rationale, usage: Object.keys(usageAcc).length? { ...usageAcc }: undefined };
              }
              yield Object.keys(usageAcc).length ? { delta, tokens: tokenCount, limit: enforcedLimit, usage: { ...usageAcc } } : { delta, tokens: tokenCount, limit: enforcedLimit };
            }
          } catch { /* ignore JSON parse errors for partials */ }
        }
      }
    }
    const out = finalJSON ? { model, output: fullText, raw: finalJSON } : { model, output: fullText };
    if (Object.keys(usageAcc).length) out.usage = { ...usageAcc };
    return out;
  }
  return { stream: iterate(), cancel: ()=> controller.abort() };
}

// Expose circuit state for diagnostics
function __circuitState() { return circuitState(); }
function onCircuitEvent(listener) { _cbListeners.add(listener); return () => _cbListeners.delete(listener); }
function listCircuitEvents(limit = 50) { return _cbEvents.slice(0, limit); }

function circuitHealth(limit = 20) {
  return {
    state: circuitState(),
    recent: listCircuitEvents(limit),
    config: {
      threshold: cbState.threshold,
      cooldownMs: cbState.cooldownMs,
      retry: {
        retries: parseInt(env('AZURE_RETRY_RETRIES') || '4',10),
        baseDelayMs: parseInt(env('AZURE_RETRY_BASE_DELAY_MS') || '200',10),
        maxDelayMs: parseInt(env('AZURE_RETRY_MAX_DELAY_MS') || '4000',10),
        jitter: env('AZURE_RETRY_JITTER') || 'full'
      }
    }
  };
}

export { onCircuitEvent, listCircuitEvents, circuitHealth, rateLimiterState };

export default { isAzureConfigured, azureInvokeChat, azureInvokeChatStream, getDeploymentFor, authMode, hasApiKey, hasAADCreds, __circuitState, onCircuitEvent, listCircuitEvents, circuitHealth, rateLimiterState };