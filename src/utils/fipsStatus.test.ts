// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { classifyFips, pqcBoundary, FIPS_STATE_LABEL, type FipsState } from './fipsStatus'
import { softwareData } from '@/data/migrateData'

describe('classifyFips', () => {
  const cases: [string, FipsState][] = [
    ['', 'unknown'],
    ['No', 'none'],
    // The bugs this module replaces: a FIPS *standard* number is not validation…
    ['No (implements FIPS 203 algorithm; no NIST CMVP validation)', 'none'],
    ['No (FIPS mode via NSS/OpenSSL)', 'none'],
    // …and a real certificate written without a leading "Yes" is validation.
    ['FIPS 140-3, Status Active, Overall Level 1, Sunset Date 8/26/2029', 'module'],
    ['Yes (FIPS 140-3 CMVP #5313 Microsoft SymCrypt Cryptographic Library, Active)', 'module'],
    ['Yes, FIPS 140-3 Level 1, Certificate #5211, Status Active, Sunset Date 7/28/2029', 'module'],
    ['Yes (FIPS 140-3 via Bouncy Castle FIPS 2.0.1)', 'embedded'],
    [
      'Component modules only (RHEL 9 itself is not a CMVP-validated module): FIPS 140-3 Level 1',
      'embedded',
    ],
    ['No (CAVP algorithm validation, not a CMVP module validation)', 'cavp'],
    [
      'Yes, FIPS 140-3 (implied by CAVP listing and "First Validated" date), Certificate A7514',
      'cavp',
    ],
    ['Partial (NIST CAVP certified; FIPS 140-3 in progress)', 'cavp'],
    ['No formal CMVP/CAVP certification (academic reference implementation)', 'none'],
    ['Pending (FIPS 140-3 L3 submission)', 'in-process'],
    [
      'No (AWS-LC-FIPS 3.x has completed lab testing and been submitted to NIST for certification)',
      'in-process',
    ],
    ['No (CC EAL6+ — highest in industry; PQC certification details pending)', 'none'],
    ['Yes (FedRAMP High)', 'claim'],
    ['Yes (WebTrust)', 'claim'],
    ['Yes (FIPS mode)', 'claim'],
    ['Yes', 'claim'],
    ['Supports FIPS 204 standard; validation status not stated', 'unknown'],
  ]
  it.each(cases)('%s → %s', (raw, state) => {
    expect(classifyFips(raw)).toBe(state)
  })

  it('maps every live catalog value to a labelled state, never to the old "Partial"', () => {
    for (const item of softwareData) {
      const state = classifyFips(item.fipsValidated)
      expect(FIPS_STATE_LABEL[state]).toBeTruthy()
      expect(FIPS_STATE_LABEL[state]).not.toMatch(/partial/i)
    }
  })

  it('never calls a product validated when its text starts with "No"', () => {
    for (const item of softwareData) {
      if (/^no\b/i.test(item.fipsValidated.trim())) {
        expect(['module', 'embedded']).not.toContain(classifyFips(item.fipsValidated))
      }
    }
  })
})

describe('pqcBoundary', () => {
  it('defaults to not-stated, never yes', () => {
    expect(pqcBoundary('Yes (FIPS 140-3)')).toBe('not-stated')
    expect(pqcBoundary('')).toBe('not-stated')
  })
  it('reads negative prose before positive', () => {
    expect(
      pqcBoundary(
        "Yes — FIPS 140-3 Level 2, CMVP #4850 (Active); ML-KEM is not among the module's approved algorithms"
      )
    ).toBe('no')
    expect(pqcBoundary('Yes (Trusted) (classical algorithms only; PQC not in FIPS scope)')).toBe(
      'no'
    )
  })
  it('reads positive prose', () => {
    expect(
      pqcBoundary(
        'Yes — FIPS 140-3 Level 1, CMVP #5523 (Active); ML-KEM, ML-DSA and SLH-DSA approved in the module'
      )
    ).toBe('yes')
  })
  it('lets certificate rows win over prose', () => {
    expect(
      pqcBoundary('Yes (FIPS 140-3)', [{ certType: 'FIPS 140-3', classicalOnly: false }])
    ).toBe('yes')
    expect(pqcBoundary('Yes (FIPS 140-3)', [{ certType: 'FIPS 140-3', classicalOnly: true }])).toBe(
      'no'
    )
    // A CAVP row is not a module boundary.
    expect(pqcBoundary('Yes', [{ certType: 'ACVP', classicalOnly: false }])).toBe('not-stated')
  })
})
