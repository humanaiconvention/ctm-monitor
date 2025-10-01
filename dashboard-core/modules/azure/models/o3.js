export const meta = {
  name: 'o3',
  displayName: 'O3',
  capabilities: ['fast inference', 'tile previews', 'low-cost chaining'],
  status: 'active'
}

export async function invoke(prompt, options = {}) {
  return { model: meta.name, input: prompt, output: '[o3 fast inference stub]', usage: { tokens: 0 }, options }
}

export async function *invokeStream(prompt, options = {}) {
  const c = ['[o3]', ' fast', ' inference', ' stub'];
  for (const p of c) { await new Promise(r => setTimeout(r, 5)); yield { delta: p }; }
  return { model: meta.name, input: prompt, output: c.join(''), usage: { tokens: 0 } };
}

export default { meta, invoke, invokeStream }