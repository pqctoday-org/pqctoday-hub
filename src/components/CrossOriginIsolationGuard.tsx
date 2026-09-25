// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { isNativeApp } from '@/embed/platform'
import { COI_RELOAD_KEY, isolationNavigationAction } from '@/utils/crossOriginIsolation'

function readTried(): boolean {
  try {
    return !!sessionStorage.getItem(COI_RELOAD_KEY)
  } catch {
    return true // storage blocked: never risk a navigation loop
  }
}

/**
 * The in-app half of the cross-origin-isolation rule (see
 * src/utils/crossOriginIsolation.ts). index.html only reloads a page that was
 * LOADED on a route needing SharedArrayBuffer; a reader who starts on, say,
 * /threats and then clicks through to /playground arrives by client-side
 * navigation in a document that is not isolated. This turns that one
 * navigation into a full page load of the same URL — which the service worker
 * serves with COOP/COEP — at most once per session.
 */
const fullPageNavigate = (url: string) => window.location.assign(url)

export function CrossOriginIsolationGuard({
  navigateTo = fullPageNavigate,
}: {
  /** Full-page navigation (injectable for tests; jsdom has no real one). */
  navigateTo?: (url: string) => void
}) {
  const location = useLocation()
  useEffect(() => {
    // The native (Capacitor) shell registers no service worker to isolate it.
    if (isNativeApp()) return
    const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined
    const action = isolationNavigationAction({
      pathname: location.pathname,
      crossOriginIsolated:
        typeof window.crossOriginIsolated === 'boolean' ? window.crossOriginIsolated : undefined,
      hasServiceWorker: !!sw,
      hasController: !!sw?.controller,
      alreadyTried: readTried(),
    })
    if (action === 'none') return
    if (action === 'navigate-and-mark') {
      try {
        sessionStorage.setItem(COI_RELOAD_KEY, '1')
      } catch {
        return // can't record the attempt → don't risk looping
      }
    }
    navigateTo(`${location.pathname}${location.search}${location.hash}`)
  }, [location.pathname, location.search, location.hash, navigateTo])
  return null
}
