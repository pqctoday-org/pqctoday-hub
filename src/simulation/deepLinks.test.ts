// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { resolveDeepLink, canResolveDeepLink } from './deepLinks'

describe('resolveDeepLink (WS-06 drift guard)', () => {
  it('accepts known static routes', () => {
    for (const p of ['/', '/algorithms', '/compliance', '/assess', '/report', '/threats']) {
      expect(resolveDeepLink(p).ok, p).toBe(true)
    }
  })

  it('accepts known dynamic routes (learn/*, business tools, playground tool)', () => {
    expect(canResolveDeepLink('/learn/data-asset-sensitivity')).toBe(true)
    expect(canResolveDeepLink('/business/tools/risk-register')).toBe(true)
    expect(canResolveDeepLink('/playground/tpm-playground')).toBe(true)
  })

  it('rejects the wrong playground shape (the bug WS-06 caught)', () => {
    // /playground/:toolId is ONE segment — /playground/tools/<id> is two → no route
    expect(canResolveDeepLink('/playground/tools/tpm-playground')).toBe(false)
    expect(canResolveDeepLink('/business/extra/risk-register')).toBe(false)
    expect(canResolveDeepLink('/nope')).toBe(false)
    expect(canResolveDeepLink('algorithms')).toBe(false) // not absolute
  })

  it('validates query params per route', () => {
    expect(canResolveDeepLink('/algorithms?tab=transition')).toBe(true)
    expect(canResolveDeepLink('/algorithms?tab=support')).toBe(true)
    expect(resolveDeepLink('/algorithms?tab=bogus').ok).toBe(false) // unknown tab
    expect(resolveDeepLink('/algorithms?foo=1').ok).toBe(false) // unknown param
    expect(canResolveDeepLink('/compliance?cert=')).toBe(true)
    expect(resolveDeepLink('/threats?tab=x').ok).toBe(false) // route takes no params
  })

  it('reports a reason when it cannot resolve', () => {
    expect(resolveDeepLink('/playground/tools/x').reason).toMatch(/unknown route/)
    expect(resolveDeepLink('/algorithms?tab=bogus').reason).toMatch(/unknown tab/)
  })
})
