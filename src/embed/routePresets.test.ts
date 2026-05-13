// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  ROUTE_PRESETS,
  ROUTE_PRESET_LABELS,
  resolveRoutes,
  matchesAllowedRoute,
  getFirstAllowedRoute,
  getActivePresets,
} from './routePresets'

describe('ROUTE_PRESETS', () => {
  it('declares one preset per top-level view (plus `all`)', () => {
    expect(Object.keys(ROUTE_PRESETS).sort()).toEqual(
      [
        'algorithms',
        'all',
        'assess',
        'business',
        'compliance',
        'faq',
        'leaders',
        'learn',
        'library',
        'migrate',
        'patents',
        'playground',
        'threats',
        'timeline',
      ].sort()
    )
  })

  it('renames the `leaders` preset to "Community" for display', () => {
    expect(ROUTE_PRESET_LABELS.leaders).toBe('Community')
  })

  it('maps `patents` preset to /patents (added in v2.4 / hub 533540de)', () => {
    expect(ROUTE_PRESETS.patents).toEqual(['/patents'])
  })

  it('does not contain the legacy `explore` or `openssl` presets', () => {
    expect(ROUTE_PRESETS.explore).toBeUndefined()
    expect(ROUTE_PRESETS.openssl).toBeUndefined()
  })
})

describe('resolveRoutes', () => {
  it('expands a single preset granted by the cert', () => {
    expect(resolveRoutes('learn', ['learn'])).toEqual(['/learn', '/learn/*'])
  })

  it('expands multiple presets and de-duplicates', () => {
    const result = resolveRoutes('learn,assess', ['learn', 'assess'])
    expect(result).toEqual(['/learn', '/learn/*', '/assess', '/report'])
  })

  it('allows any preset when the cert grants `all`', () => {
    expect(resolveRoutes('patents', ['all'])).toEqual(['/patents'])
  })

  it('rejects a preset the cert does not grant', () => {
    expect(() => resolveRoutes('patents', ['learn'])).toThrow(/not authorized/i)
  })

  it('rejects an unknown preset even when cert grants it (defence in depth)', () => {
    expect(() => resolveRoutes('explore', ['explore'])).toThrow(/Unknown route preset/i)
  })

  it('passes explicit paths through without preset-name validation', () => {
    expect(resolveRoutes('/custom/path', ['learn'])).toEqual(['/custom/path'])
  })

  it('supports mixed preset + explicit path mode', () => {
    const result = resolveRoutes('learn,/playground/vpn-sim', ['learn'])
    expect(result).toEqual(['/learn', '/learn/*', '/playground/vpn-sim'])
  })
})

describe('matchesAllowedRoute', () => {
  it('matches exact paths', () => {
    expect(matchesAllowedRoute('/patents', ['/patents'])).toBe(true)
  })

  it('matches wildcard suffix patterns', () => {
    expect(matchesAllowedRoute('/learn/pqc-101', ['/learn', '/learn/*'])).toBe(true)
  })

  it('matches the wildcard base path itself', () => {
    expect(matchesAllowedRoute('/learn', ['/learn/*'])).toBe(true)
  })

  it('does not match unrelated paths', () => {
    expect(matchesAllowedRoute('/patents', ['/learn', '/learn/*'])).toBe(false)
  })

  it('treats `/*` as match-everything', () => {
    expect(matchesAllowedRoute('/anything/at/all', ['/*'])).toBe(true)
  })
})

describe('getFirstAllowedRoute', () => {
  it('strips a wildcard suffix to return a navigable base path', () => {
    expect(getFirstAllowedRoute(['/learn/*', '/assess'])).toBe('/learn')
  })

  it('returns `/` for the catch-all wildcard', () => {
    expect(getFirstAllowedRoute(['/*'])).toBe('/')
  })

  it('returns the first concrete path when no wildcard leads', () => {
    expect(getFirstAllowedRoute(['/patents', '/learn'])).toBe('/patents')
  })
})

describe('getActivePresets', () => {
  it('identifies presets active in a resolved route set', () => {
    const routes = resolveRoutes('learn,patents', ['all'])
    expect(getActivePresets(routes).sort()).toEqual(['learn', 'patents'])
  })

  it('reports `all` only when /* is present', () => {
    expect(getActivePresets(['/*'])).toContain('all')
  })
})
