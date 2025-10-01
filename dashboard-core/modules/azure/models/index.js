// Azure model registry aggregator
import gpt5 from './gpt5.js'
import codex from './codex.js'
import deepresearch from './deepresearch.js'
import image1 from './image1.js'
import o3 from './o3.js'
import o3pro from './o3pro.js'

const adapters = [gpt5, codex, deepresearch, image1, o3, o3pro]

export function listModels() { return adapters.map(a => a.meta) }
export function getModel(name) { return adapters.find(a => a.meta.name === name) || null }

export async function invokeModel(name, input, options) {
  const adapter = getModel(name)
  if (!adapter) throw new Error(`Unknown model: ${name}`)
  return adapter.invoke(input, options)
}

export function invokeModelStream(name, input, options) {
  const adapter = getModel(name)
  if (!adapter || !adapter.invokeStream) throw new Error(`Streaming not supported for model: ${name}`)
  return adapter.invokeStream(input, options)
}

export default { listModels, getModel, invokeModel, invokeModelStream }