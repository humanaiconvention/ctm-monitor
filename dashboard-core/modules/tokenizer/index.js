// Tokenizer utility with optional dynamic import of a real tokenizer.
// Exposes countTokens(text, { model }) returning an integer.
// Strategy:
// 1. If environment variable TOKENIZER_DISABLED === '1' => always naive.
// 2. Attempt dynamic import of '@dqbd/tiktoken' (if installed) else fallback.
// 3. Naive fallback splits on /\s+/ and punctuation boundaries, filters empties.

let realTokenizer = null;
let tried = false;

async function loadReal() {
  if (tried) return realTokenizer;
  tried = true;
  if (process?.env?.TOKENIZER_DISABLED === '1') return null;
  try {
    // Lazy import - only if dependency present; no hard requirement.
    const mod = await import('@dqbd/tiktoken');
    if (mod?.encoding_for_model) {
      realTokenizer = mod;
    }
  } catch {
    realTokenizer = null;
  }
  return realTokenizer;
}

function naiveCount(text) {
  if (!text) return 0;
  // Split on whitespace & punctuation clusters; approximate tokens.
  const parts = String(text).split(/[\s]+/).flatMap(p => p.split(/([,.;:!?()"'`])/).filter(Boolean));
  return parts.filter(Boolean).length;
}

// Cache encoders per model to avoid re-init cost.
const encoderCache = new Map();

export async function countTokensAsync(text, { model = 'gpt-5' } = {}) {
  await loadReal();
  if (!realTokenizer || !realTokenizer.encoding_for_model) return naiveCount(text);
  try {
    let enc = encoderCache.get(model);
    if (!enc) {
      enc = realTokenizer.encoding_for_model(model);
      encoderCache.set(model, enc);
    }
    return enc.encode(text).length;
  } catch {
    return naiveCount(text);
  }
}

// Synchronous lightweight approximation (used in hot streaming path). If real tokenizer loaded and cached encoder exists, use it.
export function countTokens(text, { model = 'gpt-5' } = {}) {
  if (!text) return 0;
  if (realTokenizer && realTokenizer.encoding_for_model) {
    try {
      let enc = encoderCache.get(model);
      if (!enc) {
        // Avoid blocking sync path on first call; fall back to naive and schedule async load.
        loadReal();
        return naiveCount(text);
      }
      return enc.encode(text).length;
    } catch { return naiveCount(text); }
  }
  // Kick off async load once.
  if (!tried) loadReal();
  return naiveCount(text);
}

export default { countTokens, countTokensAsync };