// SPDX-License-Identifier: GPL-3.0-only
import { isNativeApp } from './platform'

/**
 * Intercept external links and window.open calls in native context.
 * Routes them to the system browser (Safari/Chrome) instead of
 * opening inside the WebView.
 *
 * Call once at boot time from the Capacitor boot path in main.tsx.
 * No-op when not running in Capacitor.
 */
export function setupExternalLinkHandler(): void {
  if (!isNativeApp()) return

  // 1. Intercept <a target="_blank"> clicks
  document.addEventListener(
    'click',
    async (event) => {
      const anchor = (event.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href) return

      // Only intercept external links (http/https, not internal routes)
      const isExternal = href.startsWith('http://') || href.startsWith('https://')
      const isBlank = anchor.getAttribute('target') === '_blank'

      if (isExternal && isBlank) {
        event.preventDefault()
        event.stopPropagation()
        const { Browser } = await import(/* @vite-ignore */ '@capacitor/browser')
        await Browser.open({ url: href })
      }
    },
    true
  ) // Capture phase — fires before React handlers

  // 2. Override window.open for programmatic opens (ShareButton, FlagButton, etc.)
  const originalOpen = window.open.bind(window)
  window.open = function (
    url?: string | URL,
    target?: string,
    features?: string
  ): WindowProxy | null {
    if (url && target === '_blank') {
      const urlStr = typeof url === 'string' ? url : url.toString()
      if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
        import(/* @vite-ignore */ '@capacitor/browser').then(({ Browser }) => {
          Browser.open({ url: urlStr })
        })
        return null
      }
    }
    return originalOpen(url, target, features)
  } as typeof window.open
}
