/**
 * Which URLs are links to a specific hub resource (one document, one threat,
 * one patent, …) rather than a bare page visit.
 *
 * The app shell uses this to keep the mobile first-run role picker from
 * standing in front of a shared link: the reader asked for that resource, not
 * for a role quiz. Kept dependency-free on purpose — MainLayout imports it, so
 * anything this module pulled in (a data CSV above all) would land in every
 * visitor's boot bundle.
 */
import { isThreatsDeepLink } from '@/components/Threats/threatsUrlParams'

/** Per-route params that name a specific resource. `spec` works on any route
 *  (the global SpecDrawerHost), so it is handled separately below.
 *
 *  resourceDeepLink.test.ts classifies EVERY key the Assistant grammar allows
 *  on these routes as either a resource param (listed here) or a view/filter
 *  param, so a page that gains a new item param fails that test until someone
 *  decides which it is — this list drifted once already (2026-10-02 audit). */
export const RESOURCE_PARAMS: Readonly<Record<string, readonly string[]>> = {
  '/library': ['ref'],
  '/patents': ['patent', 'patentIds', 'inventor'],
  '/algorithms': [
    'protocol',
    'highlight',
    'algo',
    'industry',
    'usecase',
    'attack',
    'engine',
    'case',
    'transition',
    'standard',
  ],
  '/timeline': ['event', 'country'],
  '/migrate': ['product', 'productIds', 'share', 'vendor', 'open', 'domain'],
  '/leaders': ['leader'],
  '/compliance': [
    'framework',
    'cert',
    'evref',
    'reqfw',
    'prod',
    'step',
    'dossier',
    'mtier',
    'cswpview',
  ],
}

// `spec` opens a Library document and `try` a Playground tool in place, on any
// page (SpecDrawerHost / TryToolModalHost) — both name one resource.
const ANY_ROUTE_PARAMS = ['spec', 'try'] as const

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/'
}

/** Is this a link into specific hub content? */
export function isResourceDeepLink(pathname: string, search: string): boolean {
  if (isThreatsDeepLink(pathname, search)) return true
  const params = new URLSearchParams(search)
  if (ANY_ROUTE_PARAMS.some((p) => params.get(p))) return true
  const keys = RESOURCE_PARAMS[normalizePath(pathname)]
  return !!keys && keys.some((p) => params.get(p))
}

/** The route a resource deep link arrived on, so the role-picker bypass can
 *  hold for that page after the resource is closed (closing drops its param). */
export function resourceDeepLinkRoute(pathname: string, search: string): string | null {
  return isResourceDeepLink(pathname, search) ? normalizePath(pathname) : null
}

export function isSameRoute(a: string, b: string): boolean {
  return normalizePath(a) === normalizePath(b)
}
