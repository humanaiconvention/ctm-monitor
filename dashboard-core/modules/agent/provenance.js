// Provenance logging for agent invocations.
// Keeps an in-memory ring buffer of recent records; can be extended to persistent storage.
let nodeCrypto; try { nodeCrypto = await import('crypto'); } catch {}
let fsMod; try { fsMod = await import('fs'); } catch {}

let ringSize = parseInt(process?.env?.PROVENANCE_RING_SIZE || '500', 10);
if (!Number.isFinite(ringSize) || ringSize <= 0) ringSize = 500;
let ring = new Array(ringSize);
let index = 0; let count = 0;
let jsonlPath = process?.env?.PROVENANCE_JSONL_PATH || null;
let jsonlWriteErrors = 0;

export function configureProvenance({ ringSize: newSize, jsonlPath: newPath } = {}) {
  if (newSize && Number.isFinite(newSize) && newSize > 0) {
    ringSize = newSize;
    ring = new Array(ringSize);
    index = 0; count = 0;
  }
  if (typeof newPath === 'string') jsonlPath = newPath;
  return { ringSize, jsonlPath };
}

export function hashPrompt(prompt) {
  const data = new TextEncoder().encode(String(prompt));
  if (nodeCrypto?.createHash) {
    return nodeCrypto.createHash('sha256').update(data).digest('hex').slice(0, 32);
  }
  if (globalThis.crypto?.subtle) {
    // Note: subtle.digest is async; we provide a sync-ish fallback by returning placeholder and upgrading later.
    // For simplicity here we block with Atomics if SharedArrayBuffer not available; instead we just return a truncated base64.
    // Lightweight approach: compute a quick non-cryptographic hash when subtle not directly awaited.
    let h = 0; for (let i = 0; i < data.length; i++) { h = (h * 31 + data[i]) >>> 0; }
    return h.toString(16).padStart(8, '0');
  }
  // Fallback simple hash
  let h = 0; const str = String(prompt);
  for (let i = 0; i < str.length; i++) { h = (h * 33 + str.charCodeAt(i)) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

export function recordProvenance({ model, prompt, result, latencyMs, error, limitMeta, continuationOf }) {
  const ts = Date.now();
  const entry = {
    id: `${ts}-${Math.random().toString(36).slice(2, 8)}`,
    ts,
    model,
    promptHash: hashPrompt(prompt),
    promptBytes: Buffer.byteLength(prompt || ''),
    latencyMs,
    ok: !error,
    error: error ? String(error.message || error) : null,
  usage: result?.usage || null,
  limit: limitMeta?.limit || null,
  limitRationale: limitMeta?.rationale || null,
  truncated: !!result?.truncated,
  continuationOf: continuationOf || null,
  };
  ring[index] = entry;
  index = (index + 1) % ringSize;
  count = Math.min(count + 1, ringSize);

  if (jsonlPath && fsMod?.promises) {
    const line = JSON.stringify(entry) + '\n';
    fsMod.promises.appendFile(jsonlPath, line).catch(() => { jsonlWriteErrors++; });
  }
  return entry;
}

export function listProvenance({ limit = 50 } = {}) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const pos = (index - 1 - i + ringSize) % ringSize;
    const entry = ring[pos];
    if (entry) out.push(entry);
    if (out.length >= limit) break;
  }
  return out;
}

export function clearProvenance() {
  ring.fill(undefined);
  index = 0; count = 0;
}

export function provenanceStats() { return { ringSize, count, jsonlPath, jsonlWriteErrors }; }

export default { recordProvenance, listProvenance, clearProvenance, hashPrompt, configureProvenance, provenanceStats };