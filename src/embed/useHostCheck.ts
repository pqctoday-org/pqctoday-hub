// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react'
import { useEmbed } from './EmbedProvider'
import { isIframeEmbed } from './platform'

const HOST_CHECK_TIMEOUT_MS = 2000

/**
 * Enforces that the embedding parent page is an authorised host.
 *
 * On mount the embed broadcasts `pqc:ready` to `window.parent`. The parent
 * must respond with `{ type: 'pqc:challenge' }` within 2 seconds. The embed
 * then validates `event.origin` against the `allowedOrigins` list baked into
 * the vendor certificate.
 *
 * - `null`  — check still in progress (waiting for challenge)
 * - `true`  — parent confirmed as an authorised origin
 * - `false` — timeout elapsed with no valid challenge → render error screen
 *
 * The check is skipped (returns `true` immediately) when:
 * - Not running inside an iframe (e.g. Capacitor / standalone)
 * - `allowedOrigins` contains `'*'` (dev / test mode)
 */
export function useHostCheck(): boolean | null {
  const { allowedOrigins } = useEmbed()
  const [hostAuthorized, setHostAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    // Not in an iframe — no parent to check
    if (!isIframeEmbed()) {
      setHostAuthorized(true)
      return
    }

    // Wildcard — origin checking disabled (dev/test only)
    if (allowedOrigins.includes('*')) {
      setHostAuthorized(true)
      return
    }

    // targetOrigin restricts delivery: only a parent at an allowed origin
    // will receive pqc:ready, and therefore be able to send pqc:challenge.
    const targetOrigin = allowedOrigins[0] ?? '*'

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'pqc:challenge') return
      if (allowedOrigins.includes(event.origin)) {
        setHostAuthorized(true)
      }
      // Wrong origin — ignore, keep waiting for the timer
    }

    window.addEventListener('message', handleMessage)
    window.parent.postMessage({ type: 'pqc:ready' }, targetOrigin)

    const timer = setTimeout(() => {
      // Only flip to false if still waiting (not already authorized)
      setHostAuthorized((prev) => (prev === null ? false : prev))
    }, HOST_CHECK_TIMEOUT_MS)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearTimeout(timer)
    }
    // allowedOrigins is derived from the verified cert — immutable for the session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return hostAuthorized
}
