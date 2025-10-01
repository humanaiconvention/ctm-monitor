import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Early performance harness (captures paint & LCP before lazy loads)
import './perf/startupHarness'
import React from 'react'
import ChunkLoadBoundary from './components/ChunkLoadBoundary'
// Convert secondary pages to lazy-loaded chunks for future dashboard panel expansion
const LearnMore = React.lazy(() => import('./pages/LearnMore'))
const Explore = React.lazy(() => import('./pages/Explore'))
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { initAnalyticsSession, trackHeroPaint, trackHashNavigation, trackEvent, hasAnalyticsConsent, initSectionObserver, startHeartbeat, initVisibilityListeners, installErrorHooks, flushPreConsentQueue, registerUnloadFlush, configureAnalyticsTransport, initFirstInputDelayCapture, initLayoutShiftObserver } from './analytics'
// Application Insights is now lazy-loaded to reduce initial bundle size
type InitAppInsightsFn = (opts?: { instrumentationKey?: string; connectionString?: string; samplingPercentage?: number }) => void;
type RegisterVitalsStarterFn = (cb: () => void) => void;
let _initAppInsights: InitAppInsightsFn | null = null;
let _registerVitalsStarter: RegisterVitalsStarterFn | null = null;
async function ensureAppInsights() {
  if (_initAppInsights && _registerVitalsStarter) return;
  const mod = await import('./appInsights');
  _initAppInsights = mod.initAppInsights;
  _registerVitalsStarter = mod.registerVitalsStarter;
}
import { startVitals } from './vitals'
import SW_CONFIG from './sw-config'
import { APP_VERSION } from './generated/appVersion'

declare global {
  interface Window { __BUILD_REV?: string; __LOGO_HASH?: string }
}

// Expose build revision + logo hash early and optionally render overlay when ?rev=1
try {
  const buildRev = (APP_VERSION as Record<string, unknown>).buildRev as string | undefined;
  const logoHash = (APP_VERSION as Record<string, unknown>).logoHash as string | undefined;
  if (buildRev) window.__BUILD_REV = buildRev;
  if (logoHash) window.__LOGO_HASH = logoHash;
  const printed = sessionStorage.getItem('rev:printed');
  if (!printed) {
    // Single concise console banner
    // eslint-disable-next-line no-console
    console.log(`%cBuild ${buildRev || 'n/a'} (logo ${logoHash || 'n/a'})`, 'background:#0a2736;color:#8cf;padding:2px 6px;border-radius:4px');
    sessionStorage.setItem('rev:printed','1');
  }
  if (new URLSearchParams(location.search).get('rev') === '1') {
    const tag = document.createElement('div');
    tag.textContent = `${buildRev || 'n/a'} • logo ${logoHash || 'n/a'}`;
    tag.style.cssText = 'position:fixed;bottom:8px;right:8px;font:11px system-ui;padding:4px 8px;background:rgba(0,0,0,0.55);color:#9fe6ff;border:1px solid rgba(255,255,255,0.2);border-radius:6px;z-index:9999;pointer-events:none';
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(tag));
  }
} catch { /* ignore */ }

// Attempt to eagerly load generated version info (in dev it exists after version:gen; in prod built into dist)
async function attachGeneratedVersion() {
  if (window.__APP_VERSION__) return
  try {
    // Use Vite glob to avoid TS complaint when file absent before generation
  interface GenMod { APP_VERSION?: { version: string; commit: string; [k: string]: unknown } }
  const modules = import.meta.glob('./generated/appVersion.ts', { eager: true }) as Record<string, GenMod>
    const first = Object.values(modules)[0]
    if (first && first.APP_VERSION) {
      const fallback = { name: 'web', buildTime: new Date().toISOString(), fullCommit: first.APP_VERSION.commit }
      const composed = { ...fallback, ...first.APP_VERSION }
      const v = composed
      window.__APP_VERSION__ = composed as {
        name: string; version: string; commit: string; fullCommit?: string; buildTime: string
      }
      const meta = document.querySelector('meta[name="x-app-version"]')
      if (meta) meta.setAttribute('content', `${v.version}+${v.commit}`)
    }
  } catch {
    // ignore
  }
}
attachGeneratedVersion()

// Application Insights (if key provided) - initialize before custom analytics to allow route tracking
interface EnvMeta { VITE_APPINSIGHTS_KEY?: string }
const aiKey = (import.meta as unknown as { env: EnvMeta }).env.VITE_APPINSIGHTS_KEY;
// Lazy initialization strategy: idle or first interaction
function scheduleAppInsightsInit() {
  if (!aiKey) return;
  let initialized = false;
  const initNow = async () => {
    if (initialized) return; initialized = true;
    try {
      await ensureAppInsights();
      _initAppInsights?.({ instrumentationKey: aiKey, samplingPercentage: 50 });
      // Wrap fetch for dependency telemetry
      try {
        const originalFetch = window.fetch.bind(window);
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          const start = performance.now();
          const urlStr = typeof input === 'string' ? input : (input as Request).url;
          const method = init?.method || (typeof input !== 'string' && (input as Request).method) || 'GET';
          const traceId = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2,'0')).join('');
          const mergedInit: RequestInit = { ...(init || {}) };
          mergedInit.headers = new Headers((init && init.headers) || (typeof input !== 'string' && (input as Request).headers) || undefined);
          (mergedInit.headers as Headers).set('x-trace-id', traceId);
          try {
            const res = await originalFetch(input as RequestInfo, mergedInit);
            const duration = performance.now() - start;
            import('./appInsights').then(m => m.trackAiEvent('fetch_dependency', { url: urlStr, method, status: res.status, duration: Math.round(duration), traceId })).catch(()=>{});
            return res;
          } catch (err) {
            const duration = performance.now() - start;
            import('./appInsights').then(m => m.trackAiEvent('fetch_dependency', { url: urlStr, method, error: (err as Error).message, duration: Math.round(duration), traceId })).catch(()=>{});
            throw err;
          }
        };
      } catch { /* ignore */ }
      // Start vitals only after AI ready (if not disabled)
      if (import.meta.env.VITE_DISABLE_VITALS !== 'true') {
        _registerVitalsStarter?.(() => startVitals());
      }
    } catch { /* ignore */ }
  };
  if ('requestIdleCallback' in window) {
    (window as typeof window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback?.(initNow, { timeout: 3000 });
  } else {
    setTimeout(initNow, 1500);
  }
  // First user interaction triggers immediate init
  const early = () => { initNow(); removeListeners(); };
  function removeListeners() {
    window.removeEventListener('pointerdown', early);
    window.removeEventListener('keydown', early);
    window.removeEventListener('scroll', early);
  }
  window.addEventListener('pointerdown', early, { once: true });
  window.addEventListener('keydown', early, { once: true });
  window.addEventListener('scroll', early, { once: true });
}
scheduleAppInsightsInit();

// Analytics initialization
initAnalyticsSession()
installErrorHooks()
initVisibilityListeners()
initSectionObserver(['mission','vision','voices'])
startHeartbeat()
registerUnloadFlush()
// Optional transport activation via env variable
if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
  configureAnalyticsTransport({ enabled: true, endpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT as string, useBeacon: true });
}
// Initialize additional metrics capture
initFirstInputDelayCapture();
initLayoutShiftObserver();
// optional feature flag to disable vitals collection entirely (privacy mode / perf testing isolation)
// Vitals now start after lazy AI init so base bundle omits web-vitals until necessary.

// Track initial hash (if present)
if (location.hash) {
  trackHashNavigation(location.hash)
}

// Listen for hash changes (simple internal anchor nav)
window.addEventListener('hashchange', () => {
  trackHashNavigation(location.hash)
})

// Performance: hero paint marker after idle (if consent granted later, we can optionally fire when toggled)
const scheduleHeroPaint = () => {
  if (!hasAnalyticsConsent()) return
  if ('requestIdleCallback' in window) {
    // Narrow the type with an inline declaration
    const ric = (window as typeof window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback
    if (ric) ric(() => trackHeroPaint(), { timeout: 3000 })
  } else {
    setTimeout(() => trackHeroPaint(), 500)
  }
}
scheduleHeroPaint()

// Fire a page_view style event
trackEvent({ category: 'navigation', action: 'page_view', label: location.pathname + location.hash })

// If consent already granted before load (e.g. persisted), flush queued events
if (hasAnalyticsConsent()) {
  flushPreConsentQueue()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ChunkLoadBoundary label="Loading page">
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/learn-more" element={<LearnMore />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/convene" element={<Explore />} />
        </Routes>
      </ChunkLoadBoundary>
    </BrowserRouter>
  </StrictMode>,
)

// Mark hydration after next paint to approximate interactive readiness
try {
  requestAnimationFrame(() => {
    if (typeof window.__markHydration === 'function') {
      window.__markHydration();
    }
  });
} catch { /* ignore */ }

// Dev helper & observability meta tag (non-sensitive config only)
try {
  interface DebugWindow extends Window { __dumpSWConfig?: () => void }
  (window as DebugWindow).__dumpSWConfig = () => {
    // eslint-disable-next-line no-console
    console.log('[SW_CONFIG]', SW_CONFIG);
    return SW_CONFIG;
  };
  interface ViteEnv { VITE_SW_EXPOSE_META?: string; PROD?: boolean }
  const env = (import.meta as unknown as { env: ViteEnv }).env;
  const expose = !env.PROD || env.VITE_SW_EXPOSE_META === 'true';
  // Compute hash deterministically each load (for drift detection even if not exposed)
  const payloadObj = {
    manifestHardBustRatio: SW_CONFIG.manifestHardBustRatio,
    autoRefresh: SW_CONFIG.autoRefresh,
  };
  const payload = JSON.stringify(payloadObj);
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  const hashHex = hash.toString(16).padStart(8, '0');
  // Persist last hash & detect drift (between reloads) - even if meta not exposed
  const LS_KEY = 'sw:configHash';
  try {
    const last = localStorage.getItem(LS_KEY);
    if (last && last !== hashHex) {
      // Fire drift event (includes previous & current) – only if analytics available
      try { trackEvent({ category: 'interaction', action: 'sw_config_drift', label: 'hash_changed', metadata: { previous: last, current: hashHex } }); } catch {/* ignore */}
    }
    localStorage.setItem(LS_KEY, hashHex);
  } catch { /* ignore */ }
  if (expose) {
    const metaId = 'x-sw-config-json';
    if (!document.querySelector(`meta[name="${metaId}"]`)) {
      const m = document.createElement('meta');
      m.name = metaId;
      m.content = JSON.stringify({ ...payloadObj, configHash: hashHex });
      document.head.appendChild(m);
      const mh = document.createElement('meta');
      mh.name = 'x-sw-config-hash';
      mh.content = hashHex;
      document.head.appendChild(mh);
    }
  }
} catch { /* ignore */ }

// Register service worker (production builds only, and if supported)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(async reg => {
      // If an updated worker is already waiting, prompt reload (silent auto-refresh for now)
      if (reg.waiting) {
        // eslint-disable-next-line no-console
        console.info('[sw] update waiting – auto refreshing');
        reg.waiting.postMessage('force-reload');
        setTimeout(() => location.reload(), 400);
      } else {
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          installing?.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available, reload to apply
              // eslint-disable-next-line no-console
              console.info('[sw] new version installed – refreshing to apply');
              setTimeout(() => location.reload(), 300);
            }
          });
        });
      }
      // Helper for manual debug in console: window.__forceSWUpdate()
      interface DebugWindow extends Window { __forceSWUpdate?: () => void }
      (window as DebugWindow).__forceSWUpdate = () => reg.active?.postMessage('refresh-precache');
      // Design drift detection: compare stored logo hash with current and show toast if changed (first load after update)
      try {
        const LOGO_HASH_KEY = 'logo:hash';
        const prev = localStorage.getItem(LOGO_HASH_KEY);
        const currentLogoHash = window.__LOGO_HASH;
        if (currentLogoHash && prev && prev !== currentLogoHash) {
          // Inject toast
          const toast = document.createElement('div');
          toast.innerHTML = '<strong style="font-weight:600">New design available</strong><div style="margin-top:4px;font-weight:400">Logo updated – <button type="button" style="all:unset;cursor:pointer;color:#7bdcff;text-decoration:underline">reload</button></div>';
          toast.style.cssText = 'position:fixed;top:12px;right:12px;z-index:10000;background:#0b2230;color:#c8f3ff;font:12px system-ui;padding:10px 14px;border:1px solid #134d63;border-radius:8px;box-shadow:0 6px 22px -6px rgba(0,0,0,0.45);max-width:220px;line-height:1.35';
          document.body.appendChild(toast);
          const btn = toast.querySelector('button');
          const reload = () => location.reload();
          btn?.addEventListener('click', reload);
          // Auto-dismiss after 15s if user ignores
          setTimeout(() => toast.remove(), 15000);
        }
        if (currentLogoHash) localStorage.setItem(LOGO_HASH_KEY, currentLogoHash);
      } catch { /* ignore */ }
      // Periodic background sync registration (if supported & permission granted)
      try {
        type PeriodicPermissionState = 'granted' | 'denied' | 'prompt';
        interface PeriodicPermissionResult { state: PeriodicPermissionState }
        const permQuery = (navigator as unknown as { permissions?: { query: (opts: { name: string }) => Promise<PeriodicPermissionResult> } }).permissions;
        let allowed = true;
        if (permQuery?.query) {
          const status = await permQuery.query({ name: 'periodic-background-sync' });
            allowed = status.state === 'granted';
        }
        const periodicSync = (reg as unknown as { periodicSync?: { getTags(): Promise<string[]>; register(tag: string, opts: { minInterval: number }): Promise<void> } }).periodicSync;
        if (allowed && periodicSync) {
          const tags = await periodicSync.getTags();
          if (!tags.includes('refresh-precache')) {
            await periodicSync.register('refresh-precache', { minInterval: 24 * 60 * 60 * 1000 }); // daily
          }
        }
      } catch { /* ignore */ }
      // Fallback lightweight interval ping to request a trim/runtime refresh
      setInterval(() => {
        if (reg.active) reg.active.postMessage('trim-runtime');
      }, 6 * 60 * 60 * 1000); // every 6h
    }).catch(err => {
      console.warn('[sw] registration failed', err);
    });
  });
}
