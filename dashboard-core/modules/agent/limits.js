// Streaming token limit policy
// Exposes evaluateStreamingLimit(prompt, model) -> { limit, rationale }
// Heuristics:
//  - Base limit from env STREAM_TOKEN_LIMIT (default 800)
//  - If prompt very short (<40 chars) reduce limit 25% (discourage fishing / low-effort spam)
//  - If prompt includes keywords suggesting research or accessibility justification, increase 25%
//  - Hard cap STREAM_TOKEN_LIMIT_MAX (default 2000)
//  - Minimum enforced 100
//  - Rationale string is user-displayable (no internal leakage)

function env(name) { return typeof process !== 'undefined' ? (process.env?.[name]) : undefined; }

const POSITIVE_KEYWORDS = ['research','citation','explain','accessibility','ethics','educational','educate'];

export function evaluateStreamingLimit(prompt = '', model = '') {
  const base = parseInt(env('STREAM_TOKEN_LIMIT') || '800', 10);
  const hardMax = parseInt(env('STREAM_TOKEN_LIMIT_MAX') || '2000', 10);
  let limit = base;
  let rationale = 'Base streaming safety limit';
  const trimmed = (prompt||'').trim();
  if (trimmed.length < 40) { limit = Math.floor(limit * 0.75); rationale = 'Short prompt heuristic reduction'; }
  const lower = trimmed.toLowerCase();
  if (POSITIVE_KEYWORDS.some(k => lower.includes(k))) { limit = Math.floor(limit * 1.25); rationale = 'Elevated for educational / research context'; }
  if (limit > hardMax) { limit = hardMax; rationale += ' (capped)'; }
  if (limit < 100) limit = 100;
  return { limit, rationale, model };
}

export default { evaluateStreamingLimit };
