// Health / metrics aggregation for agent + Azure client.
import { provenanceStats, listProvenance } from './provenance.js';
import azureClient, { circuitHealth, rateLimiterState } from '../azure/client.js';

export function collectHealth() {
  const prov = provenanceStats();
  const circuit = circuitHealth ? circuitHealth(20) : null;
  // Derive recent limit metadata snapshot
  const recent = listProvenance({ limit: 30 });
  const limited = recent.filter(r => typeof r.limit === 'number' && r.limit !== null);
  const truncated = limited.filter(r => r.truncated);
  const avgLimit = limited.length ? Math.round(limited.reduce((a,b)=>a + (b.limit||0),0)/limited.length) : null;
  const truncRate = limited.length ? truncated.length / limited.length : 0;
  return {
    timestamp: Date.now(),
    provenance: prov,
    circuit,
    rateLimiter: rateLimiterState ? rateLimiterState() : null,
    streamingLimits: {
      recentWithLimits: limited.length,
      truncated: truncated.length,
      truncationRate: truncRate,
      averageLimit: avgLimit
    }
  };
}

export default { collectHealth };
