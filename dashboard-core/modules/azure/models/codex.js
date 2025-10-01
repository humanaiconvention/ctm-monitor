export const meta = {
  name: 'gpt-5-codex',
  displayName: 'GPT‑5 Codex',
  capabilities: ['agentic workflows', 'LangChain logic', 'repo automation'],
  status: 'active'
}

export async function invoke(codeTask, options = {}) {
  return { model: meta.name, input: codeTask, output: '// codex stub result', usage: { tokens: 0 }, options }
}

export async function *invokeStream(codeTask, options = {}) {
  const parts = ['//', ' streaming', ' codex', ' stub'];
  for (const p of parts) { await new Promise(r => setTimeout(r, 5)); yield { delta: p }; }
  return { model: meta.name, input: codeTask, output: parts.join(' '), usage: { tokens: 0 } };
}

export default { meta, invoke, invokeStream }