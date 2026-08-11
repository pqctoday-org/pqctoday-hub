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

  it('recognizes the compound EU strings the CSV actually writes', () => {
    // Matching is exact, so a compound body reads as foreign until listed.
    expect(isEuLevelBody('European Commission/ENISA')).toBe(true)
    expect(isEuLevelBody('European Banking Authority (EBA); national competent authorities')).toBe(
      true
    )
  })

  it('does not treat the Europol QSFF forum as an enforcement body', () => {
    // Europol is an EU agency, but the Quantum Safe Financial Forum is a
    // voluntary call to action — "Your regulator: Europol" would overstate it.
    expect(isEuLevelBody('Europol/FS-ISAC')).toBe(false)
  })
})

describe('national regulators modelled as regulatory_body rows', () => {
  it('treats ACPR and AMF as domestic for a French finance profile', () => {
    // Both are French financial regulators carried as `regulatory_body`, not
    // `compliance_framework`. While derivation skipped that body type they
    // rendered as "Foreign authority … recognized in France".
    expect(isDomesticRegulator('France', 'Finance & Insurance', 'ACPR')).toBe(true)
    expect(isDomesticRegulator('France', 'Finance & Insurance', 'AMF')).toBe(true)
  })

  it('still rejects a foreign authority for the same profile', () => {
    expect(isDomesticRegulator('France', 'Finance & Insurance', 'NIST')).toBe(false)
  })

  it('does not admit standards or certification bodies as regulators', () => {
    // ISO and the CCRA author and validate; they do not enforce.
    const r = regulatorsFor('France', 'Finance & Insurance')
    expect(r.has('ISO/IEC')).toBe(false)
    expect(
      r.has(
        'Common Criteria Recognition Arrangement (CCRA) members including ASD, CSE, ANSSI, BSI, IPA, NCCSA, GCSB, NSRI, MAP/CCN, FMV, NCSC, NSA/NIST'
      )
    ).toBe(false)
  })
})

describe('country vocabulary', () => {
  it('resolves the same regulators from an ISO code as from a full name', () => {
    // The compliance CSV migrated to ISO 3166-1 alpha-2 while the assessment
    // store kept full names; derived entries were keyed on the raw token, so
    // they matched nothing for either caller depending on which side supplied it.
    const byName = regulatorsFor('France', 'Finance & Insurance')
    const byCode = regulatorsFor('FR', 'Finance & Insurance')
    expect(byCode.has('ACPR')).toBe(true)
    expect(Array.from(byCode).sort()).toEqual(Array.from(byName).sort())
  })
})
