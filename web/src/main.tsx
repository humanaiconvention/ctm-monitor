import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
