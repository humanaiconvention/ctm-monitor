import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { consciousnessQuotes } from '../config/quotes'
import { trackQuoteTransition } from '../analytics'

const MAX_AUTOPLAY_QUOTES = 30
const AUTOPLAY_PRESETS = [
  { label: 'Relaxed', value: 10000 },
  { label: 'Standard', value: 6000 },
  { label: 'Energetic', value: 4000 },
]

const QUOTE_ANIMATION_CONFIG = {
  subtle: { totalMs: 900, easingIn: 'cubic-bezier(.5,.08,.25,1)', easingOut: 'cubic-bezier(.6,.02,.4,1)', blurStart: 6, blurEnd: 0 },
  instant: { totalMs: 0, easingIn: 'linear', easingOut: 'linear', blurStart: 0, blurEnd: 0 },
  cinematic: { totalMs: 1800, easingIn: 'cubic-bezier(.4,0,.2,1)', easingOut: 'cubic-bezier(.65,.05,.36,1)', blurStart: 10, blurEnd: 0 },
  gentleLong: { totalMs: 2000, easingIn: 'cubic-bezier(.42,0,.1,1)', easingOut: 'cubic-bezier(.7,0,.3,1)', blurStart: 14, blurEnd: 1 },
} as const
type CrossfadeProfileKey = keyof typeof QUOTE_ANIMATION_CONFIG

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

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

export default function QuoteSpotlight() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true)
  const [autoAdvanceMs, setAutoAdvanceMs] = useState(AUTOPLAY_PRESETS[1]?.value ?? 6000)
  const MANUAL_PAUSE_AFTER_NAV_MS = 7000
  const [manualPauseUntil, setManualPauseUntil] = useState<number | null>(null)
  const [shuffledQuotes, setShuffledQuotes] = useState<typeof consciousnessQuotes>([])
  const [previousQuote, setPreviousQuote] = useState<null | typeof consciousnessQuotes[number]>(null)
  const [isCrossfading, setIsCrossfading] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<'quote' | 'meta' | 'context'>('quote')
  const [crossfadeProfile, setCrossfadeProfile] = useState<CrossfadeProfileKey>('subtle')
  const [forceTransitionCounter, setForceTransitionCounter] = useState(0)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [controlsHidden, setControlsHidden] = useState(false)
  const lastScrollYRef = useRef<number>(0)
  const speedDebounceRef = useRef<number | null>(null)
  const profileDebounceRef = useRef<number | null>(null)
  const lastTransitionStartRef = useRef<number | null>(null)

  useEffect(() => {
    const initialPool = consciousnessQuotes.slice(0, MAX_AUTOPLAY_QUOTES)
    setShuffledQuotes(shuffleArray(initialPool))
  }, [])

  useEffect(() => {
    try {
      const storedSpeed = localStorage.getItem('hq:autoAdvanceMs')
      if (storedSpeed) {
        const num = Number(storedSpeed)
        if (Number.isFinite(num) && num > 0) setAutoAdvanceMs(num)
      }
      const storedProfile = localStorage.getItem('hq:crossfadeProfile') as CrossfadeProfileKey | null
      if (storedProfile && storedProfile in QUOTE_ANIMATION_CONFIG) setCrossfadeProfile(storedProfile)
    } catch {
      /* ignore preference read errors */
    }
  }, [])

  useEffect(() => {
    if (speedDebounceRef.current) window.clearTimeout(speedDebounceRef.current)
    speedDebounceRef.current = window.setTimeout(() => {
      try { localStorage.setItem('hq:autoAdvanceMs', String(autoAdvanceMs)) } catch { /* ignore persistence failures */ }
    }, 400)
  }, [autoAdvanceMs])

  useEffect(() => {
    if (profileDebounceRef.current) window.clearTimeout(profileDebounceRef.current)
    profileDebounceRef.current = window.setTimeout(() => {
      try { localStorage.setItem('hq:crossfadeProfile', crossfadeProfile) } catch { /* ignore persistence failures */ }
    }, 400)
  }, [crossfadeProfile])

  const quoteCount = shuffledQuotes.length
  const boundedIndex = useMemo(() => (quoteCount === 0 ? 0 : ((quoteIndex % quoteCount) + quoteCount) % quoteCount), [quoteIndex, quoteCount])
  const activeQuote = useMemo(() => (quoteCount === 0 ? null : shuffledQuotes[boundedIndex]), [boundedIndex, quoteCount, shuffledQuotes])

  useEffect(() => { if (prefersReducedMotion) setAutoPlayEnabled(false) }, [prefersReducedMotion])

  useEffect(() => {
    const MIN_WIDTH = 800
    if (typeof window === 'undefined' || window.innerWidth < MIN_WIDTH) return
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY
          const lastY = lastScrollYRef.current
          const delta = currentY - lastY
            if (Math.abs(delta) > 6) {
              if (delta > 0) {
                setControlsHidden(true)
              } else {
                setControlsHidden(false)
              }
              lastScrollYRef.current = currentY
            }
            ticking = false
        })
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [prefersReducedMotion])

  const activeProfile = QUOTE_ANIMATION_CONFIG[crossfadeProfile]
  const halfDuration = Math.round(activeProfile.totalMs / 2)

  useEffect(() => {
    if (!autoPlayEnabled || quoteCount === 0) return
    if (manualPauseUntil && Date.now() < manualPauseUntil) {
      const resumeIn = manualPauseUntil - Date.now()
      const resumeTimer = setTimeout(() => setManualPauseUntil(null), resumeIn)
      return () => clearTimeout(resumeTimer)
    }
    let switchTimer: ReturnType<typeof setTimeout> | null = null
    const intervalId = window.setInterval(() => {
      if (prefersReducedMotion) {
        setQuoteIndex((c) => (c + 1) % quoteCount)
        return
      }
      setIsCrossfading(true)
      setPreviousQuote(activeQuote)
      lastTransitionStartRef.current = performance.now()
      switchTimer = setTimeout(() => {
        setQuoteIndex((current) => {
          const nextIndex = (current + 1) % quoteCount
          if (nextIndex === 0) setShuffledQuotes(prev => shuffleArray(prev))
          return nextIndex
        })
        setTimeout(() => {
          setIsCrossfading(false)
          setPreviousQuote(null)
          if (lastTransitionStartRef.current != null) {
            const duration = performance.now() - lastTransitionStartRef.current
            trackQuoteTransition(duration)
            lastTransitionStartRef.current = null
          }
        }, halfDuration)
      }, halfDuration)
    }, autoAdvanceMs)
    return () => { if (intervalId) window.clearInterval(intervalId); if (switchTimer) clearTimeout(switchTimer) }
  }, [autoPlayEnabled, quoteCount, activeQuote, autoAdvanceMs, halfDuration, prefersReducedMotion, manualPauseUntil, forceTransitionCounter])

  useEffect(() => {
    if (prefersReducedMotion) return
    setAnimationPhase('quote')
    const metaTimer = setTimeout(() => setAnimationPhase('meta'), 300)
    const contextTimer = setTimeout(() => setAnimationPhase('context'), 600)
    return () => { clearTimeout(metaTimer); clearTimeout(contextTimer) }
  }, [activeQuote, prefersReducedMotion])

  const markInteracted = () => { if (!hasInteracted) setHasInteracted(true) }
  const advanceQuote = (dir: 'forward' | 'backward') => {
    setManualPauseUntil(Date.now() + MANUAL_PAUSE_AFTER_NAV_MS)
    setIsCrossfading(true)
    setPreviousQuote(activeQuote)
    setTimeout(() => {
      setQuoteIndex(c => {
        const delta = dir === 'forward' ? 1 : -1
        let next = c + delta
        if (next < 0) next = quoteCount - 1
        if (next >= quoteCount) next = 0
        return next
      })
      setTimeout(() => { setIsCrossfading(false); setPreviousQuote(null) }, halfDuration)
    }, halfDuration / 2)
  }
  const triggerTestTransition = () => {
    if (!activeQuote || quoteCount === 0) return
    if (crossfadeProfile === 'instant' || prefersReducedMotion) { setQuoteIndex(c => (c + 1) % quoteCount); return }
    setIsCrossfading(true)
    setPreviousQuote(activeQuote)
    lastTransitionStartRef.current = performance.now()
    setTimeout(() => {
      setQuoteIndex(c => (c + 1) % quoteCount)
      setTimeout(() => {
        setIsCrossfading(false); setPreviousQuote(null)
        if (lastTransitionStartRef.current != null) {
          trackQuoteTransition(performance.now() - lastTransitionStartRef.current)
          lastTransitionStartRef.current = null
        }
      }, halfDuration)
    }, halfDuration)
    setForceTransitionCounter(c => c + 1)
  }
  const handleSpeedChange = (e: ChangeEvent<HTMLSelectElement>) => {
    markInteracted(); const nextValue = Number(e.target.value); setAutoAdvanceMs(Number.isFinite(nextValue) && nextValue > 0 ? nextValue : AUTOPLAY_PRESETS[1]?.value ?? 6000)
  }

  return (
    <section className="section section--quote-focus" id="voices" aria-label="Perspectives on consciousness">
      <div className="quote-spotlight">
        <div className={`quote-spotlight__stage ${isCrossfading ? 'is-crossfading' : ''}`}>
          {previousQuote && (
            <article className="quote-spotlight__card quote-layer previous">
              <p className="quote-spotlight__text is-outgoing">{previousQuote.text}</p>
              <footer className="quote-spotlight__meta is-outgoing">
                <div className="quote-spotlight__author">{previousQuote.author}</div>
                {(previousQuote.source || previousQuote.year) && (
                  <div className="quote-spotlight__source">{[previousQuote.source, previousQuote.year].filter(Boolean).join(' · ')}</div>
                )}
                {previousQuote.context && (
                  <p className="quote-spotlight__context is-outgoing">{previousQuote.context}</p>
                )}
              </footer>
            </article>
          )}
          {activeQuote && (
            <article className="quote-spotlight__card quote-layer active">
              <p className={`quote-spotlight__text ${isCrossfading ? 'is-incoming' : ''} ${animationPhase === 'quote' || !prefersReducedMotion ? 'animate-in' : ''}`}>{activeQuote.text}</p>
              <footer className={`quote-spotlight__meta ${isCrossfading ? 'is-incoming' : ''} ${animationPhase === 'meta' || animationPhase === 'context' || prefersReducedMotion ? 'animate-in' : ''}`}>
                <div className="quote-spotlight__author">{activeQuote.author}</div>
                {(activeQuote.source || activeQuote.year) && (
                  <div className="quote-spotlight__source">{[activeQuote.source, activeQuote.year].filter(Boolean).join(' · ')}</div>
                )}
                {activeQuote.context && (
                  <p className={`quote-spotlight__context ${isCrossfading ? 'is-incoming' : ''} ${animationPhase === 'context' || prefersReducedMotion ? 'animate-in' : ''}`}>{activeQuote.context}</p>
                )}
              </footer>
            </article>
          )}
        </div>
        <div
          className={`quote-spotlight__controls quote-spotlight__controls--after animate-on-interact ${hasInteracted ? 'is-visible' : ''} ${controlsHidden && !prefersReducedMotion ? 'is-hidden-by-scroll' : ''}`}
          onFocus={markInteracted}
          onMouseEnter={markInteracted}
          onTouchStart={markInteracted}
        >
          <div className="quote-spotlight__nav">
            <button type="button" className="quote-spotlight__control" onClick={() => advanceQuote('backward')} aria-label="Show previous quote" title="Previous quote" onFocus={markInteracted} onClickCapture={markInteracted}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M15.7 5.3a1 1 0 0 1 0 1.4L10.4 12l5.3 5.3a1 1 0 1 1-1.4 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0Z"/></svg>
            </button>
            <div className="quote-spotlight__progress" aria-live="polite">{quoteCount === 0 ? '0 / 0' : `${boundedIndex + 1} / ${quoteCount}`}</div>
            <button type="button" className="quote-spotlight__control" onClick={() => advanceQuote('forward')} aria-label="Show next quote" title="Next quote" onFocus={markInteracted} onClickCapture={markInteracted}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8.3 5.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 1 1-1.4-1.4L13.6 12 8.3 6.7a1 1 0 0 1 0-1.4Z"/></svg>
            </button>
          </div>
          <div className="quote-spotlight__config">
            <label className="quote-spotlight__config-item">
              <span className="visually-hidden">Autoplay speed</span>
              <select value={autoAdvanceMs} onChange={handleSpeedChange} aria-label="Autoplay speed">
                {AUTOPLAY_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </label>
            <label className="quote-spotlight__config-item">
              <span className="visually-hidden">Animation profile</span>
              <select value={crossfadeProfile} onChange={(e) => { setCrossfadeProfile(e.target.value as CrossfadeProfileKey) }} aria-label="Animation profile">
                {Object.keys(QUOTE_ANIMATION_CONFIG).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>
            <button type="button" className="quote-spotlight__control" onClick={triggerTestTransition} aria-label="Force transition" title="Force transition">⟳</button>
            <button type="button" className="quote-spotlight__control" onClick={() => setAutoPlayEnabled(a => !a)} aria-label="Toggle autoplay" title="Toggle autoplay">{autoPlayEnabled ? '❚❚' : '▶'}</button>
          </div>
        </div>
      </div>
    </section>
  )
}
