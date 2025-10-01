import { isAzureConfigured, azureInvokeChat, azureInvokeChatStream } from '../client.js'

export const meta = {
  name: 'gpt-5',
  displayName: 'GPT‑5',
  capabilities: ['theory synthesis', 'consciousness modeling', 'dashboard logic'],
  status: 'active'
}

export async function invoke(prompt, options = {}) {
  if (isAzureConfigured()) {
    const result = await azureInvokeChat({ model: meta.name, messages: [{ role: 'user', content: prompt }] });
    return { model: meta.name, input: prompt, output: result.output, usage: result.usage, options };
  }
  return { model: meta.name, input: prompt, output: '[stubbed gpt-5 response]', usage: { tokens: 0 }, options }
}

export async function *invokeStream(prompt, options = {}) {
  if (isAzureConfigured()) {
    const { stream } = await azureInvokeChatStream({ model: meta.name, messages: [{ role: 'user', content: prompt }] });
    let acc = '';
    for await (const chunk of stream) {
      if (chunk.delta) acc += chunk.delta;
      yield chunk;
    }
    return { model: meta.name, input: prompt, output: acc };
  }
  const chunks = ['[gpt-5]', ' streaming', ' stub', ' response'];
  for (const c of chunks) {
    await new Promise(r => setTimeout(r, 5));
    yield { delta: c };
  }
  return { model: meta.name, input: prompt, output: chunks.join(''), usage: { tokens: 0 } };
}

export default { meta, invoke, invokeStream }