// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  regulatorsFor,
  isDomesticRegulator,
  isFiveEyesAffinity,
  isEuLevelBody,
} from './regulatorMap'

describe('regulatorsFor', () => {
  it('returns hand-authored regulators for Australia/Government', () => {
    const r = regulatorsFor('Australia', 'Government & Defense')
    expect(r.has('ASD')).toBe(true)
    expect(r.has('Department of Defence')).toBe(true)
  })

  it('returns hand-authored regulators for Australia/Finance', () => {
    const r = regulatorsFor('Australia', 'Finance & Banking')
    expect(r.has('APRA')).toBe(true)
    expect(r.has('ASIC')).toBe(true)
    expect(r.has('RBA')).toBe(true)
  })

  it('honors wildcard *-industry entries (France/anything maps to ANSSI)', () => {
    const r = regulatorsFor('France', 'Government & Defense')
    expect(r.has('ANSSI')).toBe(true)
    const r2 = regulatorsFor('France', 'Healthcare')
    expect(r2.has('ANSSI')).toBe(true)
  })

  it('augments with CSV-derived single-country compliance frameworks', () => {
    // ASD-ISM is a single-country (Australia) compliance_framework with body=ASD,
    // so derivation registers ASD for Australia/Government & Defense too.
    // (Manual map already has ASD for that pair — derivation matches it.)
    const r = regulatorsFor('Australia', 'Government & Defense')
    expect(r.has('ASD')).toBe(true)
  })

  it('returns empty set for an unknown country/industry pair', () => {
    const r = regulatorsFor('Atlantis', 'Mythology')
    expect(r.size).toBe(0)
  })
})

describe('isDomesticRegulator', () => {
  it('matches ASD as domestic for Australian Government', () => {
    expect(isDomesticRegulator('Australia', 'Government & Defense', 'ASD')).toBe(true)
  })

  it('rejects NIST as domestic for Australia', () => {
    expect(isDomesticRegulator('Australia', 'Government & Defense', 'NIST')).toBe(false)
  })

  it('rejects APRA as domestic for AU/Government (it is for Finance)', () => {
    expect(isDomesticRegulator('Australia', 'Government & Defense', 'APRA')).toBe(false)
  })

  it('returns false for null inputs', () => {
    expect(isDomesticRegulator(null, 'Government & Defense', 'ASD')).toBe(false)
    expect(isDomesticRegulator('Australia', null, null)).toBe(false)
  })
})

describe('isFiveEyesAffinity', () => {
  it('returns true for AU + NIST', () => {
    expect(isFiveEyesAffinity('Australia', 'NIST')).toBe(true)
  })

  it('returns true for UK + CCCS', () => {
    expect(isFiveEyesAffinity('United Kingdom', 'CCCS')).toBe(true)
  })

  it('returns false for AU + ENISA (ENISA is not Five Eyes)', () => {
    expect(isFiveEyesAffinity('Australia', 'ENISA')).toBe(false)
  })

  it('returns false for non-Five-Eyes country (France + NIST)', () => {
    expect(isFiveEyesAffinity('France', 'NIST')).toBe(false)
  })
})

describe('isEuLevelBody', () => {
  it('recognizes ENISA, EU/EC, European Commission, ECCG/ENISA', () => {
    expect(isEuLevelBody('ENISA')).toBe(true)
    expect(isEuLevelBody('EU/EC')).toBe(true)
    expect(isEuLevelBody('European Commission')).toBe(true)
    expect(isEuLevelBody('ECCG/ENISA')).toBe(true)
  })

  it('does not recognize NIST or ASD as EU-level', () => {
    expect(isEuLevelBody('NIST')).toBe(false)
    expect(isEuLevelBody('ASD')).toBe(false)
  })
})
