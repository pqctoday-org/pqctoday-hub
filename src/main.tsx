// SPDX-License-Identifier: GPL-3.0-only
import { createRoot } from 'react-dom/client'
import { setEmbedState, getEmbedState } from './embed/embedContext'
import { detectPlatform, isNativeApp } from './embed/platform'
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
function applyEmbedTheme(theme: VendorTheme | undefined, isDarkMode?: boolean): void {
  if (!theme) return
  const root = document.documentElement

  // Surface colors (background, card, foreground, muted, border) depend on the
  // active color mode. In dark mode, prefer the dark-prefixed vendor overrides;
  // in light mode (or unspecified), use the standard fields. When neither is set,
  // the CSS .dark / :root variables take effect via the stylesheet cascade.
  const bg = isDarkMode ? theme.darkBackground : theme.background
  const card = isDarkMode ? theme.darkCard : theme.card
  const fg = isDarkMode ? theme.darkForeground : theme.foreground
  const muted = isDarkMode ? theme.darkMuted : theme.muted
  const mutedFg = isDarkMode ? theme.darkMutedForeground : theme.mutedForeground
  const border = isDarkMode ? theme.darkBorder : theme.border

  const map: Record<string, string | undefined> = {
    '--color-primary': theme.primary,
    '--color-primary-foreground': theme.primaryForeground,
    '--color-background': bg,
    '--color-card': card,
    '--color-popover': card, // popover matches card
    '--color-foreground': fg,
    '--color-muted': muted, // table headers, zebra rows
    '--color-muted-foreground': mutedFg,
    '--color-border': border,
    '--color-input': border, // input border matches border
    '--color-accent': theme.accent,
    '--color-secondary': theme.secondary ?? theme.accent, // secondary buttons/badges; explicit secondary wins
    '--color-secondary-foreground': theme.secondaryForeground,
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
  if (theme.navLayout) {
    document.documentElement.setAttribute('data-nav-layout', theme.navLayout)
  }
  if (theme.navWidth) {
    root.style.setProperty('--embed-sidebar-width', theme.navWidth)
    // Mark narrow sidebar (≤ 64px) for icon-only CSS mode
    const px = parseInt(theme.navWidth, 10)
    if (!isNaN(px) && px <= 64) {
      document.documentElement.setAttribute('data-nav-narrow', '1')
    }
  }
  if (theme.headerHeight) {
    root.style.setProperty('--embed-header-height', theme.headerHeight)
  }
}

// Initialize Google Analytics
initGA()

// Register service worker for offline support — skip in native context where
// Capgo handles OTA updates. The SW auto-reload could cause infinite loops
// inside a Capacitor WebView.
if (!isNativeApp()) {
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
}

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

// ---------------------------------------------------------------------------
// Embed boot paths
// ---------------------------------------------------------------------------

async function bootIframeEmbed(): Promise<void> {
  const { verifyEmbedUrl } = await import('./embed/verifySignature')
  const config = await verifyEmbedUrl(new URL(window.location.href))
  setEmbedState(config)

  // Apply color mode class synchronously BEFORE inline theme vars.
  // EmbedLayout.tsx re-applies via useEffect for runtime changes.
  const colorMode = config.theme ?? config.policy?.theme?.colorMode
  if (colorMode === 'dark') {
    document.documentElement.classList.remove('light')
    document.documentElement.classList.add('dark')
  } else if (colorMode === 'light') {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
  }

  applyEmbedTheme(config.policy?.theme, colorMode === 'dark')
  document.documentElement.setAttribute('data-embed', '1')
  const presets = config.policy?.routes?.presets ?? []
  logEmbedSession(config.vendorId, config.kid, presets, config.isTestMode ?? false)
}

function handleEmbedError(err: unknown): void {
  const error = err as { code?: string; kid?: string; message?: string; stack?: string }
  const code = error.code || 'invalid_embed'
  logEmbedError(code, error.kid)
  console.error('Embed verification failed:', err)
  if (import.meta.env.DEV) {
    // Safe DOM construction — no innerHTML with interpolation (OWASP XSS fix)
    const container = document.createElement('div')
    container.style.cssText =
      'font-family:monospace;padding:2rem;background:#1a0000;color:#ff6b6b;min-height:100vh'
    const h2 = document.createElement('h2')
    h2.style.color = '#ff4444'
    h2.textContent = 'Embed Verification Failed'
    const codeP = document.createElement('p')
    codeP.textContent = `Code: ${code}`
    const msgP = document.createElement('p')
    msgP.textContent = `Message: ${error.message || String(err)}`
    const pre = document.createElement('pre')
    pre.style.cssText = 'background:#0d0000;padding:1rem;overflow:auto;font-size:0.8rem'
    pre.textContent = error.stack || 'No stack trace'
    container.append(h2, codeP, msgP, pre)
    document.body.appendChild(container)
  } else {
    window.location.href = `https://pqctoday.com?error=${encodeURIComponent(code)}`
  }
}

// ---------------------------------------------------------------------------
// Boot router — selects boot path based on platform detection
// ---------------------------------------------------------------------------

const platform = detectPlatform()
document.documentElement.setAttribute('data-platform', platform)

if (platform === 'capacitor') {
  // Native app boot — no URL verification needed, app binary IS the trusted context.
  import('./embed/nativeConfig')
    .then(({ loadNativeEmbedConfig }) =>
      // TODO (Phase 2 �� monetization): read subscription state from RevenueCat/StoreKit
      // and pass isPro=true when active. On subscription change, call setEmbedState()
      // with updated policy to trigger route guard re-evaluation without app restart.
      loadNativeEmbedConfig(/* isPro: */ false)
    )
    .then((config) => {
      setEmbedState(config)

      const colorMode = config.policy?.theme?.colorMode
      if (colorMode === 'dark') {
        document.documentElement.classList.remove('light')
        document.documentElement.classList.add('dark')
      } else if (colorMode === 'light') {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
      }

      applyEmbedTheme(config.policy?.theme, colorMode === 'dark')
      document.documentElement.setAttribute('data-embed', '1')
      logEmbedSession(config.vendorId, config.kid, [], false)

      // Set up native bridge globals (pqcNavigate, pqcGetCurrentRoute, back button)
      import('./embed/nativeBridge').then(({ setupNativeBridge }) => setupNativeBridge())

      // Set up external link interceptor (routes target="_blank" to system browser)
      import('./embed/externalLinks').then(({ setupExternalLinkHandler }) =>
        setupExternalLinkHandler()
      )

      mountApp()

      // System appearance sync — update theme when user toggles dark/light mode
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', (e) => {
        const currentState = getEmbedState()
        if (currentState.isEmbedded && currentState.policy?.theme) {
          const updatedTheme = {
            ...currentState.policy.theme,
            colorMode: (e.matches ? 'dark' : 'light') as 'dark' | 'light',
          }
          applyEmbedTheme(updatedTheme, e.matches)
        }
      })
    })
    .catch((err) => {
      console.error('[PQC Mobile] Boot failed:', err)
      mountApp() // Fall back to standard app
    })
} else if (platform === 'iframe') {
  bootIframeEmbed().then(mountApp).catch(handleEmbedError)
} else {
  mountApp()
}
