// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  standardImplementsAlgoXref,
  paramSetsByStandard,
  standardByParamSet,
} from './standardImplementsAlgoXref'

describe('standardImplementsAlgoXref', () => {
  it('loads the seeded 18-row NIST PQC matrix', () => {
    expect(standardImplementsAlgoXref).toHaveLength(18)
  })

  it('all xref IDs are unique', () => {
    const ids = standardImplementsAlgoXref.map((r) => r.xrefId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every row has standardId + paramSet + family', () => {
    for (const row of standardImplementsAlgoXref) {
      expect(row.standardId).toBeTruthy()
      expect(row.paramSet).toBeTruthy()
      expect(['KEM', 'DSA', 'HBS']).toContain(row.family)
    }
  })

  it('FIPS 203 has exactly three ML-KEM parameter sets, ML-KEM-768 is the default', () => {
    const rows = paramSetsByStandard.get('FIPS 203') ?? []
    expect(rows).toHaveLength(3)
    const defaults = rows.filter((r) => r.isDefault)
    expect(defaults).toHaveLength(1)
    expect(defaults[0].paramSet).toBe('ML-KEM-768')
  })

  it('FIPS 204 has exactly three ML-DSA parameter sets, ML-DSA-65 is the default', () => {
    const rows = paramSetsByStandard.get('FIPS 204') ?? []
    expect(rows).toHaveLength(3)
    const defaults = rows.filter((r) => r.isDefault)
    expect(defaults).toHaveLength(1)
    expect(defaults[0].paramSet).toBe('ML-DSA-65')
  })

  it('FIPS 205 has twelve SLH-DSA parameter sets (SHA2 + SHAKE × 3 levels × s/f), SLH-DSA-SHA2-128f is the default', () => {
    const rows = paramSetsByStandard.get('FIPS 205') ?? []
    expect(rows).toHaveLength(12)
    const defaults = rows.filter((r) => r.isDefault)
    expect(defaults).toHaveLength(1)
    expect(defaults[0].paramSet).toBe('SLH-DSA-SHA2-128f')
    // Confirm both hash families present
    const hashFams = new Set(rows.map((r) => r.paramSet.split('-')[2]))
    expect(hashFams.has('SHA2')).toBe(true)
    expect(hashFams.has('SHAKE')).toBe(true)
  })

  it('reverse lookup: ML-KEM-768 resolves back to FIPS 203', () => {
    const row = standardByParamSet.get('ML-KEM-768')
    expect(row?.standardId).toBe('FIPS 203')
    expect(row?.isDefault).toBe(true)
  })

  it('no deprecated rows leak into the active dataset', () => {
    expect(standardImplementsAlgoXref.every((r) => r.status === 'active')).toBe(true)
  })

  it('all param_set strings match the expected PQC family pattern', () => {
    const valid = /^(ML-KEM|ML-DSA)-\d+$|^SLH-DSA-(SHA2|SHAKE)-\d+[sf]$/
    for (const row of standardImplementsAlgoXref) {
      expect(valid.test(row.paramSet), `bad param_set: ${row.paramSet}`).toBe(true)
    }
  })
})
