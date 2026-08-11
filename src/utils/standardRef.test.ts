// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { resolveStandardRef, standardRefHref, normalizeStandardRef } from './standardRef'

describe('normalizeStandardRef', () => {
  it('collapses the separator and prefix variants the library actually contains', () => {
    // The library holds both "FIPS 140-3" style and "FIPS-140-3" style ids.
    expect(normalizeStandardRef('FIPS 140-3')).toBe(normalizeStandardRef('FIPS-140-3'))
    expect(normalizeStandardRef('NIST SP 800-88')).toBe(normalizeStandardRef('SP 800-88'))
    expect(normalizeStandardRef('NIST IR 8547')).toBe(normalizeStandardRef('IR 8547'))
  })
})

describe('resolveStandardRef', () => {
  it('resolves the PQC standards the tools cite most', () => {
    for (const c of ['FIPS 203', 'FIPS 204', 'FIPS 205']) {
      expect(resolveStandardRef(c), c).not.toBeNull()
    }
  })

  it('resolves citations written with or without the NIST prefix', () => {
    expect(resolveStandardRef('NIST SP 800-88')).not.toBeNull()
    expect(resolveStandardRef('SP 800-88')).not.toBeNull()
    expect(resolveStandardRef('NIST IR 8547')).not.toBeNull()
  })

  it('returns null rather than inventing a link for an unknown citation', () => {
    expect(resolveStandardRef('FIPS 9999')).toBeNull()
    expect(resolveStandardRef('')).toBeNull()
    expect(resolveStandardRef('Some Internal Policy')).toBeNull()
  })
})

describe('standardRefHref', () => {
  it('builds a /library deep link the Library route accepts', () => {
    const href = standardRefHref('FIPS 203')
    expect(href).toMatch(/^\/library\?ref=/)
    expect(href).toContain(encodeURIComponent('FIPS 203'))
  })

  it('is null for an unresolvable citation, so callers render plain text', () => {
    expect(standardRefHref('FIPS 9999')).toBeNull()
  })
})
