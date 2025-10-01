// Deployment trigger: updating comment to publish full app over minimal placeholder
import { useEffect, useState, useRef } from 'react'
import React from 'react'
import PreLogoSequence from './components/PreLogoSequence'

import './App.css'
import { fetchIntegrityData, formatBytes } from './utils/integrity'
import { PRIMARY_TAGLINE } from './config/taglines'
import LogoHumanAI from './components/LogoHumanAI'
import StickyNav from './components/StickyNav'
import { trackEvent } from './analytics'
import VersionFooter from './components/VersionFooter'
import PasswordGate from './components/PasswordGate'
import AnalyticsConsentBanner from './components/AnalyticsConsentBanner'
import AnalyticsDebugOverlay from './components/AnalyticsDebugOverlay.tsx'
import { UpdateToast, BackgroundUpdateSnackbar } from './sw-updates'
import AuthBanner from './components/AuthBanner'
import LogoTaperPreview from './components/LogoTaperPreview'

// Quotes moved to lazy component

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)

    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  return prefersReducedMotion
}

// (Mission/Vision pillars relocated to /learn-more)



// Lazy heavy quote spotlight (defer hydration until user scrolls / interacts)
// (For now existing logic remains inline; future extraction could move quote block to its own component.)
function App() {
  // Pre-logo intro gating logic
  const INTRO_STORAGE_KEY = 'hq:introComplete'
  const disableIntro = Boolean(import.meta.env && import.meta.env.VITE_DISABLE_PREINTRO)
  const [introComplete, setIntroComplete] = useState(() => {
    if (disableIntro) return true
    try { return localStorage.getItem(INTRO_STORAGE_KEY) === 'true' } catch { return false }
  })
  const handleIntroComplete = () => {
    try { localStorage.setItem(INTRO_STORAGE_KEY, 'true') } catch { /* ignore */ }
    setIntroComplete(true)
  }
  const [integrity, setIntegrity] = useState<{ version?: string; commit?: string; attestedAt?: string; hashMatch?: boolean; sbomDrift?: number; assetBytes?: number; assetCount?: number }>(() => ({}))
  const integrityLoadedRef = useRef(false)
  const integrityHeadingRef = useRef<HTMLHeadingElement | null>(null)
  const [shouldLoadQuotes, setShouldLoadQuotes] = useState(false)

  const prefersReducedMotion = usePrefersReducedMotion()

  // Feature flag: show circle unification sample grid via query param ?circleSamples=1
  const [showCircleSamples, setShowCircleSamples] = useState(false);
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      setShowCircleSamples(sp.get('circleSamples') === '1');
    } catch { /* ignore */ }
  }, []);

  // Lazy load trigger for QuoteSpotlight
  useEffect(() => {
    if (shouldLoadQuotes) return
    const activate = () => setShouldLoadQuotes(true)
    const onScroll = () => { if (window.scrollY > 320) activate() }
    window.addEventListener('scroll', onScroll, { passive: true })
  type RIC = (callback: () => void, opts?: { timeout?: number }) => number
  const ric: RIC | undefined = (window as unknown as { requestIdleCallback?: RIC }).requestIdleCallback
  const idle = (cb: () => void) => (typeof ric === 'function' ? ric(cb, { timeout: 2500 }) : window.setTimeout(cb, 1800))
  idle(() => activate())
  }, [shouldLoadQuotes])

  // Fetch integrity with retry/backoff
  useEffect(() => {
    if (integrityLoadedRef.current) return
    let aborted = false
    const run = async () => {
      const data = await fetchIntegrityData(3)
      if (!aborted) {
        setIntegrity(data)
        integrityLoadedRef.current = true
      }
    }
    const t = setTimeout(run, 600)
    return () => { aborted = true; clearTimeout(t) }
  }, [])

  // Detect scroll to allow future lazy extraction of quote component
  // (Removed old scroll tracking state for quotes)

  // Update document meta tags (hero copy) once on mount
  useEffect(() => {
  const title = `HumanAI Convention – ${PRIMARY_TAGLINE.replace(/\.$/, '')}`
    document.title = title
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('name', name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }
    const setProperty = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', property)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }
  // Updated description: remove secondary tagline line now replaced visually by logo; keep mission phrase.
  const description = `A public, verifiable framework for human–AI knowledge collaboration. HumanAI Convention.`
    setMeta('description', description)
    setProperty('og:title', title)
    setProperty('og:description', description)
    setProperty('og:image', `${window.location.origin}/og-image.svg`)
    setProperty('og:image:type', 'image/svg+xml')
    setProperty('og:image:width', '1200')
    setProperty('og:image:height', '630')
    setProperty('twitter:card', 'summary_large_image')
    setProperty('twitter:title', title)
    setProperty('twitter:description', description)
    setProperty('twitter:image', `${window.location.origin}/og-image.svg`)
  }, [])

  return (
    <div className={`page ${prefersReducedMotion ? 'reduced-motion-active' : ''}`}>
      {showCircleSamples && (
        <div style={{ padding: '40px 24px', background:'#050505' }}>
          <h2 style={{ color:'#fff', marginTop:0, fontSize: '1.75rem', fontWeight:600 }}>Circle Unification Variants (A1–B3)</h2>
          <p style={{ color:'#bbb', maxWidth:680, lineHeight:1.4 }}>Quick visual comparison of six geometry strategies. Remove the <code>?circleSamples=1</code> query parameter to return to normal page content.</p>
        </div>
      )}
      {!introComplete && (
        <PreLogoSequence onComplete={handleIntroComplete} />
      )}
      <AnalyticsConsentBanner />
      {import.meta.env.DEV && <AnalyticsDebugOverlay />}
      <AuthBanner />
  <PasswordGate>
  <header className="hero" id="top">
        <div className="hero__inner">
          <h1>{PRIMARY_TAGLINE}</h1>
          <div className={`hero__logo-wrap hero__logo-wrap--left hero__logo-wrap--left-offset ${!introComplete ? 'hero__logo-wrap--pending' : 'hero__logo-wrap--enter'}`} aria-hidden={false} aria-label="HumanAI Convention logo">
            <LogoHumanAI className="hero__logo hero__logo--v3" variant="mono-light" stacked withWordmark showConvention />
            <p className="visually-hidden">HumanAI Convention – A public, verifiable framework for human–AI knowledge collaboration.</p>
          </div>
          <div className="cta-row" role="group" aria-label="Primary actions">
            <a
              className="cta btn-primary"
              href="/explore"
              data-event="cta_click"
              data-cta="explore"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/explore');
                window.dispatchEvent(new PopStateEvent('popstate'));
                trackEvent({ category: 'interaction', action: 'click', label: 'explore', metadata: { origin: 'hero' } })
              }}
            >
              Explore now
            </a>
            <a
              className="cta btn-secondary"
              href="/learn-more"
              data-event="cta_click"
              data-cta="learn_more"
              onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/learn-more'); window.dispatchEvent(new PopStateEvent('popstate')); trackEvent({ category: 'interaction', action: 'click', label: 'learn_more', metadata: { origin: 'hero' } }) }}
            >
              Learn more
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Variant legend removed */}
        {shouldLoadQuotes ? (
          <React.Suspense fallback={<section className="section section--quote-focus" id="voices"><div className="quote-spotlight skeleton">Loading perspectives…</div></section>}>
            {React.createElement(React.lazy(() => import('./components/QuoteSpotlight')))}
          </React.Suspense>
        ) : (
          <section className="section section--quote-focus" id="voices" aria-label="Perspectives on consciousness">
            <div className="quote-spotlight skeleton" aria-hidden="true">Preparing perspectives…</div>
          </section>
        )}
  <StickyNav />
  <div className="main-column" role="group" aria-label="Project transparency and roadmap">
          <section id="integrity" className="section integrity-preview integrity-preview--after-quotes" aria-labelledby="integrity-heading">
            <h2 id="integrity-heading" ref={integrityHeadingRef} tabIndex={-1}>Transparency &amp; Integrity (Preview)</h2>
            <p className="integrity-blurb integrity-blurb--center">We surface build attestations, software bill of materials changes, and verifiable hashes so anyone can independently confirm what is running. Soon you’ll explore deeper provenance, supply-chain drift insights, and reproducibility proofs here.</p>
            <ul className="integrity-kpis integrity-kpis--center" aria-label="Early integrity signals">
              <li><span className="kpi-label">Version</span><span className="kpi-value">{integrity.version || '—'}</span></li>
              <li><span className="kpi-label">Commit</span><span className="kpi-value">{integrity.commit ? integrity.commit.slice(0,7) : '—'}</span></li>
              <li><span className="kpi-label">Attested</span><span className="kpi-value">{integrity.attestedAt ? new Date(integrity.attestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</span></li>
              <li><span className="kpi-label">Hash</span><span className="kpi-value">{integrity.hashMatch === true ? 'match ✔' : integrity.hashMatch === false ? 'mismatch ⚠' : '…'}</span></li>
              <li><span className="kpi-label">SBOM Drift</span><span className="kpi-value">{typeof integrity.sbomDrift === 'number' ? integrity.sbomDrift : '—'}</span></li>
              <li><span className="kpi-label">Assets</span><span className="kpi-value">{typeof integrity.assetCount === 'number' ? integrity.assetCount : '—'}</span></li>
              <li><span className="kpi-label">Asset Bytes</span><span className="kpi-value">{formatBytes(integrity.assetBytes)}</span></li>
            </ul>
          </section>
          <section className="section">
            <LogoTaperPreview />
          </section>
          <section className="section section--coming-soon" id="coming-soon">
            <div className="section__header section__header--center">
              <h2>Coming soon</h2>
              <p>We’re preparing an open participation layer: collaborative verification tools, integrity attestations you can fork and reproduce, and pathways to steward high‑trust human–AI knowledge as a shared public good. If this resonates, you’re early — and welcome. More ways to engage are on the horizon.</p>
            </div>
          </section>
        </div>
  </main>
  </PasswordGate>

      <footer className="footer">
        <div className="footer__content">
          <p>© {new Date().getFullYear()} HumanAI Convention. Built for collective intelligence.</p>
          <a href="#top">Back to top</a>
        </div>
        <VersionFooter />
      </footer>
  <UpdateToast />
  <BackgroundUpdateSnackbar />
    </div>
  )
}

export default App
