// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react'
import { useEmbed } from './EmbedProvider'
import { isIframeEmbed } from './platform'

const HOST_CHECK_TIMEOUT_MS = 8000

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

    // localhost and 127.0.0.1 are the same host; normalise so certs that list
    // http://localhost:N also accept challenges from http://127.0.0.1:N and vice versa.
    const normalize = (o: string) => o.replace('127.0.0.1', 'localhost')
    const isAllowed = (origin: string) =>
      allowedOrigins.includes(origin) || allowedOrigins.includes(normalize(origin))

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'pqc:challenge') return
      if (isAllowed(event.origin)) {
        setHostAuthorized(true)
      }
      // Wrong origin — ignore, keep waiting for the timer
    }

    window.addEventListener('message', handleMessage)

    // Broadcast pqc:ready to every allowed origin (and its 127.0.0.1 variant) so
    // certs with http://localhost:N also deliver when the parent is at 127.0.0.1:N.
    // pqc:ready carries no sensitive data; security is enforced by isAllowed() above.
    const targets = new Set<string>()
    for (const origin of allowedOrigins) {
      targets.add(origin)
      targets.add(origin.replace('localhost', '127.0.0.1'))
    }
    for (const target of targets) {
      window.parent.postMessage({ type: 'pqc:ready' }, target)
    }

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
