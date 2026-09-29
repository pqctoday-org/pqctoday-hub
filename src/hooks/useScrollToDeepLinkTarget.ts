import { useEffect } from 'react'

const HIGHLIGHT_CLASSES = ['ring-2', 'ring-primary', 'ring-offset-2']

/**
 * Scroll a deep-linked resource's row/card into view and ring it briefly.
 *
 * Lists render asynchronously (lazy data, virtualised tables, filter widening
 * in the same tick), so this polls for the element for up to `timeoutMs`
 * instead of assuming it exists on the first effect. Runs once per `targetKey`;
 * pass `null` to do nothing.
 *
 * `selector` is resolved with `document.querySelector`, so give target rows a
 * stable attribute (e.g. `data-deeplink-id="<id>"`) rather than relying on
 * `id=` values that may contain spaces or punctuation.
 */
export function useScrollToDeepLinkTarget(
  targetKey: string | null,
  selector: string | null,
  { timeoutMs = 4000, highlightMs = 3000 }: { timeoutMs?: number; highlightMs?: number } = {}
) {
  useEffect(() => {
    if (!targetKey || !selector) return
    let cancelled = false
    let clearHighlight: ReturnType<typeof setTimeout> | undefined
    const started = Date.now()

    const tick = () => {
      if (cancelled) return
      const el = document.querySelector<HTMLElement>(selector)
      // An element hidden via display:none (e.g. a mobile-only duplicate) has
      // no box; keep looking for the visible one until the timeout.
      if (el && el.getClientRects().length > 0) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        el.classList.add(...HIGHLIGHT_CLASSES)
        clearHighlight = setTimeout(() => el.classList.remove(...HIGHLIGHT_CLASSES), highlightMs)
        return
      }
      if (Date.now() - started < timeoutMs) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    return () => {
      cancelled = true
      if (clearHighlight) clearTimeout(clearHighlight)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per target
  }, [targetKey, selector])
}

/** CSS attribute selector for a `data-deeplink-id` value, safely escaped. */
export function deepLinkSelector(id: string): string {
  const escaped =
    typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id.replace(/["\\]/g, '\\$&')
  return `[data-deeplink-id="${escaped}"]`
}
