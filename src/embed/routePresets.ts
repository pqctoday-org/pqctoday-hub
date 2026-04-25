// SPDX-License-Identifier: GPL-3.0-only

/**
 * Route presets for embed mode — maps preset names to allowed URL paths.
 *
 * See PRD §6.1–6.3 for the full specification.
 */

// ---------------------------------------------------------------------------
// Preset definitions
// ---------------------------------------------------------------------------

export const ROUTE_PRESETS: Record<string, string[]> = {
  learn: ['/learn', '/learn/*'],
  assess: ['/assess', '/report'],
  timeline: ['/timeline'],
  algorithms: ['/algorithms'],
  library: ['/library'],
  threats: ['/threats'],
  leaders: ['/leaders'],
  compliance: ['/compliance'],
  migrate: ['/migrate'],
  playground: ['/playground', '/playground/*'],
  business: ['/business', '/business/*'],
  faq: ['/faq'],
  patents: ['/patents'],
  all: ['/*'],
}

// ---------------------------------------------------------------------------
// Display labels for nav items
// ---------------------------------------------------------------------------

export const ROUTE_PRESET_LABELS: Record<string, string> = {
  learn: 'Learn',
  assess: 'Assess',
  timeline: 'Timeline',
  algorithms: 'Algorithms',
  library: 'Library',
  threats: 'Threats',
  leaders: 'Leaders',
  compliance: 'Compliance',
  migrate: 'Migrate',
  playground: 'Playground',
  business: 'Business',
  faq: 'FAQ',
  patents: 'Patents',
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a routes parameter string into a flat list of allowed paths.
 *
 * Supports mixed mode: preset names (e.g. "learn,assess") and explicit paths
 * (e.g. "/learn/pqc-101,/assess") can be combined.
 *
 * @param routeSpec   Comma-separated preset names or explicit paths from the URL
 * @param certPresets Comma-separated preset names allowed by the vendor certificate
 * @returns Deduplicated array of allowed path patterns
 * @throws If a requested preset is not authorized by the certificate
 */
export function resolveRoutes(routeSpec: string, certPresets: string[]): string[] {
  const requested = routeSpec
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const certSet = new Set(certPresets)
  const result = new Set<string>()

  for (const item of requested) {
    if (item.startsWith('/')) {
      // Explicit path — always allowed (the route guard will enforce at navigation time)
      result.add(item)
    } else {
      // Preset name — must be authorized by the certificate
      if (!certSet.has(item) && !certSet.has('all')) {
        throw new Error(`Route preset "${item}" not authorized by vendor certificate`)
      }
      // eslint-disable-next-line security/detect-object-injection
      const paths = ROUTE_PRESETS[item]
      if (!paths) {
        throw new Error(`Unknown route preset: "${item}"`)
      }
      for (const p of paths) result.add(p)
    }
  }

  return [...result]
}

// ---------------------------------------------------------------------------
// Path matching
// ---------------------------------------------------------------------------

/**
 * Check if a path matches any of the allowed route patterns.
 * Supports wildcard patterns like `/learn/*`.
 */
export function matchesAllowedRoute(path: string, allowedRoutes: string[]): boolean {
  for (const pattern of allowedRoutes) {
    if (pattern === '/*') return true
    if (pattern === path) return true
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2) // remove /*
      if (path === prefix || path.startsWith(prefix + '/')) return true
    }
  }
  return false
}

/**
 * Get the first allowed route that can be used as a landing/fallback path.
 * Strips wildcards — returns the base path (e.g. "/learn" from "/learn/*").
 */
export function getFirstAllowedRoute(allowedRoutes: string[]): string {
  for (const r of allowedRoutes) {
    if (r === '/*') return '/'
    if (r.endsWith('/*')) return r.slice(0, -2)
    return r
  }
  return '/'
}

/**
 * Identify which presets are active (for nav rendering).
 * Returns preset keys whose paths are all present in the allowed routes.
 */
export function getActivePresets(allowedRoutes: string[]): string[] {
  const routeSet = new Set(allowedRoutes)
  const active: string[] = []

  for (const [key, paths] of Object.entries(ROUTE_PRESETS)) {
    if (key === 'all') {
      if (routeSet.has('/*')) active.push(key)
      continue
    }
    // A preset is active if its base path (first entry) is in the allowed set
    const basePath = paths[0]
    if (routeSet.has(basePath) || routeSet.has(basePath + '/*') || routeSet.has('/*')) {
      active.push(key)
    }
  }

  return active
}
