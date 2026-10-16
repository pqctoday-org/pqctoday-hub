// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect } from 'react'
import { useLocation } from 'react-router'

/**
 * Scroll to the element named by the URL hash (`/about#about-data-foundation`).
 *
 * The browser's own anchor jump does not work in this app: pages render after
 * the jump would happen (routes are lazy), and the page scrolls inside the
 * layout's content container, which resets to the top on every route change.
 * This waits for the element to render and has a box, then aligns its top
 * with the top of the scroll container (honouring its `scroll-margin-top`).
 * It runs again whenever the hash changes, so in-page `#` links work too.
 *
 * Use it on pages whose sections carry plain `id`s. Pages that render their own
 * hash targets asynchronously with extra state (Changelog, Threats) handle the
 * hash themselves.
 */
export function useScrollToHash({ timeoutMs = 4000 }: { timeoutMs?: number } = {}) {
  const { hash } = useLocation()

  useEffect(() => {
    const id = decodeHash(hash)
    if (!id) return
    let cancelled = false
    let frame = 0
    const started = Date.now()

    const tick = () => {
      if (cancelled) return
      const el = document.getElementById(id)
      if (el && el.getClientRects().length > 0) {
        el.scrollIntoView({ block: 'start' })
        return
      }
      if (Date.now() - started < timeoutMs) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [hash, timeoutMs])
}

function decodeHash(hash: string): string {
  const raw = hash.replace(/^#/, '')
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}
