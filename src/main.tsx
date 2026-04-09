// SPDX-License-Identifier: GPL-3.0-only
import { createRoot } from 'react-dom/client'
import { setEmbedState } from './embed/embedContext'
import './styles/index.css'
import AppRoot from './AppRoot'
import { initGA } from './utils/analytics'
import { registerSW } from 'virtual:pwa-register'

// Initialize Google Analytics
initGA()

// Register service worker for offline support — autoUpdate mode reloads
// automatically when a new version is detected, no user prompt needed.
const updateSW = registerSW({
  // Force reload when new SW has activated — swaps in new JS bundles immediately
  onNeedRefresh() {
    updateSW(true)
  },
  onOfflineReady() {
    // App is cached and ready for offline use — no action needed
  },
  onRegisteredSW(swUrl, r) {
    if (!r) return

    const tryUpdate = async () => {
      if (r.installing) return
      if ('connection' in navigator && !navigator.onLine) return
      const resp = await fetch(swUrl, {
        cache: 'no-store',
        headers: { cache: 'no-store', 'cache-control': 'no-cache' },
      })
      if (resp?.status === 200) await r.update()
    }

    // Desktop: poll every 15 min (setInterval is reliable in foreground tabs)
    setInterval(tryUpdate, 15 * 60 * 1000)

    // iOS Safari + all mobile: check on every return to foreground
    // (setInterval is throttled when backgrounded on iOS)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') tryUpdate()
    })

    // Desktop tab focus: check when user switches back to the tab
    window.addEventListener('focus', tryUpdate)
  },
})

// Automatically disable Guided Tour during E2E testing
if (typeof window !== 'undefined' && window.navigator?.webdriver) {
  localStorage.setItem('pqc-tour-completed', 'true')
}

// Global error handler — dev only, uses safe DOM construction (no innerHTML) to prevent XSS
if (import.meta.env.DEV) {
  window.onerror = function (message, source, lineno, colno, error) {
    const errorDiv =
      document.getElementById('global-error-display') || document.createElement('div')
    errorDiv.id = 'global-error-display'
    errorDiv.style.position = 'fixed'
    errorDiv.style.top = '0'
    errorDiv.style.left = '0'
    errorDiv.style.width = '100%'
    errorDiv.style.backgroundColor = 'red'
    errorDiv.style.color = 'white'
    errorDiv.style.padding = '20px'
    errorDiv.style.zIndex = '9999'

    const entry = document.createElement('div')
    entry.style.borderBottom = '1px solid white'
    entry.style.marginBottom = '10px'
    entry.style.paddingBottom = '10px'

    const heading = document.createElement('h3')
    heading.textContent = 'Global Error Caught'

    const msgP = document.createElement('p')
    msgP.textContent = `Message: ${String(message)}`

    const srcP = document.createElement('p')
    srcP.textContent = `Source: ${String(source)}:${lineno}:${colno}`

    const stackPre = document.createElement('pre')
    stackPre.textContent = error?.stack ?? 'No stack trace'

    entry.appendChild(heading)
    entry.appendChild(msgP)
    entry.appendChild(srcP)
    entry.appendChild(stackPre)
    errorDiv.appendChild(entry)

    if (!document.body.contains(errorDiv)) document.body.appendChild(errorDiv)
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

const mountApp = () => createRoot(rootElement).render(<AppRoot />)

if (window.location.pathname.startsWith('/embed/')) {
  // Lazy-import the embed verification chain so @peculiar/x509 and friends
  // are never evaluated on normal (non-embed) page loads — Safari compat.
  import('./embed/verifySignature')
    .then(({ verifyEmbedUrl }) => verifyEmbedUrl(new URL(window.location.href)))
    .then((config) => {
      setEmbedState(config)
      mountApp()
    })
    .catch((err) => {
      console.error('Embed verification failed:', err)
      const code = err.code || 'invalid_embed'
      window.location.href = `https://pqctoday.com?error=${code}`
    })
} else {
  mountApp()
}
