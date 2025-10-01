// Consent gating reads telemetry flags and user consent state.
import modelsManifest from '../../src/data/azure-models.json' assert { type: 'json' };

let userConsent = false; // ephemeral in-memory flag; real implementation could persist

export function telemetryConfig() {
  return modelsManifest.telemetry || { track_usage: false, user_opt_in: false };
}

export function setUserConsent(value) { userConsent = !!value; }
export function hasUserConsent() {
  const cfg = telemetryConfig();
  if (!cfg.user_opt_in) return true; // If opt-in not required, treat as consented
  return userConsent;
}

export function requireConsent() {
  if (!hasUserConsent()) {
    throw new Error('User consent required before invoking remote models. Call setUserConsent(true).');
  }
}

export default { telemetryConfig, setUserConsent, hasUserConsent, requireConsent };