import { describe, expect, it } from 'vitest'
import { complianceBlocsForRegion } from './jurisdictionsData'
import { regionForCountry } from './complianceData'

describe('complianceBlocsForRegion', () => {
  it('maps persona regions to the compliance blocs their jurisdictions sit in', () => {
    expect(complianceBlocsForRegion('eu')).toEqual(
      expect.arrayContaining(['European Union', 'United Kingdom'])
    )
    expect(complianceBlocsForRegion('americas')).toEqual(
      expect.arrayContaining(['North America', 'Latin America'])
    )
    expect(complianceBlocsForRegion('apac')).toContain('Asia-Pacific')
    expect(complianceBlocsForRegion('mena')).toContain('Middle East')
  })

  it('returns no scope for global or empty regions', () => {
    expect(complianceBlocsForRegion('global')).toEqual([])
    expect(complianceBlocsForRegion(null)).toEqual([])
    expect(complianceBlocsForRegion(undefined)).toEqual([])
  })

  it('passes an already-resolved bloc name through (embedded sim path)', () => {
    expect(complianceBlocsForRegion('European Union')).toEqual(['European Union'])
  })

  it('only yields blocs the landscape filter can actually match', () => {
    // Regression: the persona code 'eu' was cast straight to a bloc and never
    // equalled regionForCountry(), which returns bloc names.
    for (const region of ['eu', 'americas', 'apac', 'mena']) {
      for (const bloc of complianceBlocsForRegion(region)) {
        expect(bloc).not.toBe(region)
      }
    }
    expect(regionForCountry('France')).toBe('European Union')
  })
})
