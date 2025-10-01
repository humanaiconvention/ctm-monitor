// Unified model registry: aggregates Azure models and (future) local/third-party adapters.
import * as azure from '../azure/models/index.js';
import { requireConsent, hasUserConsent } from '../agent/consent.js';
import { isAzureConfigured } from '../azure/client.js';

// Placeholder for future non-Azure adapters (e.g., local inference, OSS models)
const thirdPartyAdapters = [];

function enrich(meta, source) {
  return { ...meta, source };
}

export function listAllModels() {
  const azureModels = azure.listModels().map(m => enrich(m, 'azure'));
  const thirdParty = thirdPartyAdapters.map(a => enrich(a.meta, a.source || 'third-party'));
  return [...azureModels, ...thirdParty];
}

export async function invokeAny(name, input, options) {
  // First try Azure
  const azureHit = azure.getModel(name);
  if (azureHit) {
    // Only enforce consent if real Azure config is present and would trigger network use.
    if (isAzureConfigured()) requireConsent();
    return azureHit.invoke(input, options);
  }
  const alt = thirdPartyAdapters.find(a => a.meta.name === name);
  if (alt) return alt.invoke(input, options);
  throw new Error(`Model not found in any registry: ${name}`);
}

export function invokeAnyStream(name, input, options) {
  const azureHit = azure.getModel(name);
  if (azureHit && azureHit.invokeStream) {
    if (isAzureConfigured()) requireConsent();
    return azureHit.invokeStream(input, options);
  }
  const alt = thirdPartyAdapters.find(a => a.meta.name === name);
  if (alt && alt.invokeStream) return alt.invokeStream(input, options);
  throw new Error(`Streaming not supported or model not found: ${name}`);
}

export default { listAllModels, invokeAny, invokeAnyStream };