// SPDX-License-Identifier: GPL-3.0-only
/**
 * Deep-link resolver (WS-06) — validates a sim resource target against the app's
 * real route table AND its known query params, not just "starts with /". The
 * drift guard (trees.test.ts) fails CI on any unresolvable path/param, and the
 * view uses it at runtime to degrade gracefully instead of dead-ending a player
 * on a moved/renamed resource.
 *
 * Keep this in sync with the routes in `src/App.tsx`. There are no `#anchor`
 * deep-links in the sim today; if any are added, extend `checkAnchor`.
 */

/** Static absolute routes that exist under MainLayout in App.tsx. */
const STATIC_ROUTES = new Set<string>([
  '/',
  '/timeline',
  '/algorithms',
  '/library',
  '/playground',
  '/playground/interactive',
  '/playground/hsm',
  '/playground/docker',
  '/openssl',
  '/threats',
  '/leaders',
  '/compliance',
  '/changelog',
  '/migrate',
  '/about',
  '/assess',
  '/report',
  '/business',
  '/business/tools',
  '/faq',
  '/terms',
  '/editorial-independence',
  '/sponsor',
  '/explore',
  '/patents',
  '/revisions',
  '/simulation',
])

/** Valid `?tab=` values on /algorithms (AlgorithmsView). */
const ALGORITHMS_TABS = new Set(['transition', 'detailed', 'support'])

export interface DeepLinkResolution {
  ok: boolean
  reason?: string
}

/** Does the path match a real route (static, or a known dynamic pattern)? */
function routeExists(path: string): boolean {
  if (STATIC_ROUTES.has(path)) return true
  const segs = path.split('/').filter(Boolean)
  // /learn/* — wildcard route
  if (segs[0] === 'learn') return segs.length >= 2
  // /business/tools/:toolId
  if (segs[0] === 'business' && segs[1] === 'tools') return segs.length === 3
  // /playground/:toolId (exactly one segment after /playground)
  if (segs[0] === 'playground') return segs.length === 2
  return false
}

/** Validate query params against the per-route allowlist. */
function checkParams(path: string, params: URLSearchParams): DeepLinkResolution {
  const keys = [...params.keys()]
  if (keys.length === 0) return { ok: true }
  if (path === '/algorithms') {
    const bad = keys.find((k) => k !== 'tab')
    if (bad) return { ok: false, reason: `/algorithms: unknown param "${bad}"` }
    const tab = params.get('tab')
    if (tab && !ALGORITHMS_TABS.has(tab))
      return { ok: false, reason: `/algorithms: unknown tab "${tab}"` }
    return { ok: true }
  }
  if (path === '/compliance') {
    const bad = keys.find((k) => k !== 'cert')
    if (bad) return { ok: false, reason: `/compliance: unknown param "${bad}"` }
    return { ok: true }
  }
  return { ok: false, reason: `${path}: unexpected params (${keys.join(', ')})` }
}

/**
 * Resolve a deep-link to a known route + valid params. Returns `{ ok }` with a
 * `reason` when it can't resolve.
 */
export function resolveDeepLink(to: string): DeepLinkResolution {
  if (!to || !to.startsWith('/')) return { ok: false, reason: `not an absolute path: "${to}"` }
  const noHash = to.includes('#') ? to.slice(0, to.indexOf('#')) : to
  const qIdx = noHash.indexOf('?')
  const path = qIdx >= 0 ? noHash.slice(0, qIdx) : noHash
  const query = qIdx >= 0 ? noHash.slice(qIdx + 1) : ''
  if (!routeExists(path)) return { ok: false, reason: `unknown route: "${path}"` }
  return checkParams(path, new URLSearchParams(query))
}

/** Convenience boolean form. */
export const canResolveDeepLink = (to: string): boolean => resolveDeepLink(to).ok
