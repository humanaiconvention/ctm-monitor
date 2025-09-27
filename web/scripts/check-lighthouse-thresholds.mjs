#!/usr/bin/env node
/**
 * check-lighthouse-thresholds.mjs
 * Enforces category-specific Lighthouse minimum scores using MIN_LH_* env variables.
 * Exits non-zero if any configured threshold is not met.
 * On full pass, writes badges/lighthouse-last-success.json with scores + timestamp.
 *
 * Env Vars:
 *  MIN_LH_PERF, MIN_LH_A11Y, MIN_LH_SEO, MIN_LH_BEST, MIN_LH_PWA
 *  LIGHTHOUSE_LAST_SUCCESS_PATH (optional override for output path)
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

function findLatestLhr() {
  if (!existsSync('.lighthouseci')) return null;
  const files = readdirSync('.lighthouseci').filter(f => f.endsWith('.json'));
  for (const f of files.reverse()) {
    try {
      const data = JSON.parse(readFileSync(join('.lighthouseci', f), 'utf8'));
      if (data?.lhr?.categories) return data.lhr;
      if (data?.categories) return data; // already an LHR root
    } catch { /* ignore */ }
  }
  return null;
}

const lhr = findLatestLhr();
if (!lhr) {
  console.error('[lh-thresholds] No Lighthouse report found.');
  process.exit(1);
}

const categories = {
  performance: lhr.categories?.performance?.score,
  accessibility: lhr.categories?.accessibility?.score,
  seo: lhr.categories?.seo?.score,
  bestPractices: lhr.categories?.['best-practices']?.score,
  pwa: lhr.categories?.pwa?.score,
};

const thresholds = {
  performance: process.env.MIN_LH_PERF ? parseInt(process.env.MIN_LH_PERF, 10) : null,
  accessibility: process.env.MIN_LH_A11Y ? parseInt(process.env.MIN_LH_A11Y, 10) : null,
  seo: process.env.MIN_LH_SEO ? parseInt(process.env.MIN_LH_SEO, 10) : null,
  bestPractices: process.env.MIN_LH_BEST ? parseInt(process.env.MIN_LH_BEST, 10) : null,
  pwa: process.env.MIN_LH_PWA ? parseInt(process.env.MIN_LH_PWA, 10) : null,
};

let anyConfigured = false;
let allPass = true;
const results = {};
for (const key of Object.keys(categories)) {
  const raw = categories[key];
  const score = raw == null ? null : Math.round(raw * 100);
  const threshold = thresholds[key];
  if (threshold != null) anyConfigured = true;
  const passed = threshold == null ? true : (score != null && score >= threshold);
  if (threshold != null && !passed) allPass = false;
  results[key] = { score, threshold, passed };
}

if (!anyConfigured) {
  console.log('[lh-thresholds] No MIN_LH_* thresholds configured; skipping enforcement.');
  process.exit(0);
}

console.log('[lh-thresholds] Evaluating Lighthouse thresholds:');
for (const k of Object.keys(results)) {
  const r = results[k];
  if (r.threshold == null) continue;
  console.log(`  ${k}: ${r.score ?? 'n/a'} / ${r.threshold} -> ${r.passed ? 'PASS' : 'FAIL'}`);
}

if (!allPass) {
  console.error('[lh-thresholds] One or more Lighthouse thresholds FAILED');
  process.exit(2);
}

// All pass: write last-success artifact
const outPath = resolve(process.env.LIGHTHOUSE_LAST_SUCCESS_PATH || 'badges/lighthouse-last-success.json');
mkdirSync(resolve(outPath, '..'), { recursive: true });
writeFileSync(outPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  results,
}, null, 2));
console.log(`[lh-thresholds] Success artifact written: ${outPath}`);
process.exit(0);
