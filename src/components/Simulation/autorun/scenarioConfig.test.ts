// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { getScenario, resolveCountryCode } from './scenarioConfig'

describe('scenarioConfig', () => {
  it('resolves the US scenario from the US PQC executive order timeline tags (HNDL 2030, TNFL 2031)', () => {
    const s = getScenario('US')
    const track = (id: string) => s.tracks.find((t) => t.id === id)!
    expect(track('hndl-critical').year).toBe(2030) // EO key establishment
    expect(track('tnfl-critical').year).toBe(2031) // EO digital signatures
    expect(track('hndl-general').year).toBe(2033) // derived: critical + 3
    expect(track('tnfl-general').year).toBe(2035) // derived: program horizon
    expect(s.governanceYear).toBe(2027) // derived: critical HNDL − 3
    expect(s.programStartYear).toBe(2026)
    expect(s.programEndYear).toBe(2035)
  })

  it('orders the four tracks HNDL→TNFL, critical→general (HNDL most time-critical)', () => {
    const ids = getScenario('US').tracks.map((t) => t.id)
    expect(ids).toEqual(['hndl-critical', 'tnfl-critical', 'hndl-general', 'tnfl-general'])
    // Track years are non-decreasing in that order.
    const years = getScenario('US').tracks.map((t) => t.year)
    expect(years).toEqual([...years].sort((a, b) => a - b))
  })

  it('rolls up to three headline objectives anchored to the EO dates', () => {
    const o = getScenario('US').objectives
    expect(o.map((x) => x.id)).toEqual(['governance', 'critical', 'migration'])
    expect(o.find((x) => x.id === 'governance')!.byYear).toBe(2027)
    expect(o.find((x) => x.id === 'critical')!.byYear).toBe(2031) // both critical tracks done
    expect(o.find((x) => x.id === 'migration')!.byYear).toBe(2035) // all four done
  })

  it('names the US standards (FIPS 203 / 204)', () => {
    const s = getScenario('US')
    expect(s.standards.HNDL).toMatch(/FIPS 203/)
    expect(s.standards.TNFL).toMatch(/FIPS 204/)
  })

  it('accepts a display name and an untagged country (graceful fallback)', () => {
    expect(resolveCountryCode('United States')).toBe('US')
    expect(getScenario('United States').tracks[0].year).toBe(2030)
    // An untagged country still yields a coherent scenario (single deadline → derived tracks).
    const de = getScenario('DE')
    expect(de.tracks).toHaveLength(4)
    expect(de.programEndYear).toBe(2035)
  })
})
