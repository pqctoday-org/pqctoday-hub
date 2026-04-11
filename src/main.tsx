// SPDX-License-Identifier: GPL-3.0-only
import { createRoot } from 'react-dom/client'
import { setEmbedState } from './embed/embedContext'
import './styles/index.css'
import AppRoot from './AppRoot'
import { initGA, logEmbedSession, logEmbedError } from './utils/analytics'
import { registerSW } from 'virtual:pwa-register'
import type { VendorTheme } from './embed/vendorPolicy'

/**
 * Apply vendor theme CSS custom properties to :root before React mounts.
 * Inline styles on documentElement override @theme declarations in the CSS cascade
 * (Tailwind v4 @theme tokens are CSS custom properties — highest-specificity override).
 */
function applyEmbedTheme(theme: VendorTheme | undefined): void {
  if (!theme) return
  const root = document.documentElement
  const map: Record<string, string | undefined> = {
    '--color-primary': theme.primary,
    '--color-primary-foreground': theme.primaryForeground,
    '--color-background': theme.background,
    '--color-card': theme.card,
    '--color-popover': theme.card, // popover matches card
    '--color-foreground': theme.foreground,
    '--color-muted': theme.muted, // table headers, zebra rows
    '--color-muted-foreground': theme.mutedForeground,
    '--color-border': theme.border,
    '--color-input': theme.border, // input border matches border
    '--color-accent': theme.accent,
    '--color-secondary': theme.accent, // secondary buttons/badges
    '--color-ring': theme.primary, // focus ring
    '--radius-lg': theme.radius,
    '--radius-md': theme.radius ? `calc(${theme.radius} - 2px)` : undefined,
    '--radius-sm': theme.radius ? `calc(${theme.radius} - 4px)` : undefined,
    '--font-family-sans': theme.fontFamily,
    // Table/filter row density — only set in embed mode, never in standard mode
    '--embed-table-py':
      theme.density === 'compact'
        ? '0.375rem' // ≈ py-1.5
        : theme.density === 'relaxed'
          ? '1rem' // ≈ py-4
          : theme.density
            ? '0.75rem' // normal / ≈ py-3
            : undefined,
    // Nav bar colors — only set when vendor provides a sidebar color
    '--embed-nav-bg': theme.sidebar,
    '--embed-nav-fg': theme.sidebarForeground ?? (theme.sidebar ? '#FFFFFF' : undefined),
    // Badge fill — set a flag var; CSS rule reads it to override opacity
    '--embed-badge-fill': theme.badgeFill === 'solid' ? '1' : undefined,
    // Link color override (consumed by --color-embed-link in :root)
    '--embed-link-color': theme.linkColor,
    // Status color overrides — scoped to [data-embed] in CSS; do not pollute global tokens
    '--embed-success': theme.successColor,
    '--embed-warning': theme.warningColor,
    '--embed-destructive': theme.destructiveColor,
  }
  for (const [prop, val] of Object.entries(map)) {
    if (val) root.style.setProperty(prop, val)
  }
}

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
      applyEmbedTheme(config.policy?.theme)
      document.documentElement.setAttribute('data-embed', '1')
      const presets = config.policy?.routes?.presets ?? []
      logEmbedSession(config.vendorId, config.kid, presets, config.isTestMode ?? false)
      mountApp()
    })
    .catch((err) => {
      console.error('Embed verification failed:', err)
      const code = err.code || 'invalid_embed'
      logEmbedError(code, err.kid)
      const message = err.message || String(err)
      // In dev, render the error visibly instead of redirecting so we can debug
      if (import.meta.env.DEV) {
        document.body.innerHTML = `
          <div style="font-family:monospace;padding:2rem;background:#1a0000;color:#ff6b6b;min-height:100vh">
            <h2 style="color:#ff4444">⚠ Embed Verification Failed</h2>
            <p><strong>Code:</strong> ${code}</p>
            <p><strong>Message:</strong> ${message}</p>
            <pre style="background:#0d0000;padding:1rem;overflow:auto;font-size:0.8rem">${err.stack || 'No stack trace'}</pre>
          </div>`
      } else {
        window.location.href = `https://pqctoday.com?error=${code}`
      }
    })
} else {
  mountApp()
}
