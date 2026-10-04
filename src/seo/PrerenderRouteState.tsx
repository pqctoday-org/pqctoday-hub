// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { getSearchRoute, minimumContentCharacters, normalizeSearchPath } from './searchRoutes'

const PLACEHOLDER = /^(loading|initializing)(?:\s|\.|…)/i

/**
 * Publishes a route-bound readiness contract into the static snapshot.
 *
 * Readiness covers stable explanatory content, not optional engines, analytics,
 * animation or sandbox connectivity. The prerenderer validates the same region
 * after this component reports ready.
 */
export function PrerenderRouteState() {
  const { pathname } = useLocation()

  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return

    const normalized = normalizeSearchPath(pathname)
    const route = getSearchRoute(normalized)
    root.dataset.prerenderRoute = normalized
    root.dataset.prerenderState = route ? 'pending' : 'error'
    if (!route) return

    let frame = 0
    let settled = false

    const inspect = () => {
      if (settled) return
      const region = document.querySelector(route.contentRegion)
      const headings = region?.querySelectorAll('h1') ?? []
      const text = region?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
      const disclaimer = document.querySelector('#disclaimer-title')
      if (
        region &&
        headings.length === 1 &&
        text.length >= minimumContentCharacters(route) &&
        !PLACEHOLDER.test(text) &&
        !disclaimer
      ) {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
          if (root.dataset.prerenderRoute === normalized) {
            root.dataset.prerenderState = 'ready'
            settled = true
            observer.disconnect()
          }
        })
      }
    }

    const observer = new MutationObserver(inspect)
    observer.observe(root, { childList: true, subtree: true, characterData: true })
    inspect()

    return () => {
      settled = true
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [pathname])

  return null
}
