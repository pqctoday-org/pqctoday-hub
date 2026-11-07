// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import {
  ARCHIVAL_WARNING,
  LTV_SCENARIO,
  TIMESTAMP_FACTS,
  longevityScenario,
} from './trustServicesData'

describe('signature longevity scenario', () => {
  it('compares the end of the required window with one stated policy cutoff', () => {
    expect(LTV_SCENARIO.policyCutoffYear).toBe(NIST_DEPRECATION.disallowClassical)
    expect(LTV_SCENARIO.policyCutoffBasis).toMatch(/NIST IR 8547/)
    const thirty = longevityScenario(30, 2026)
    expect(thirty).toMatchObject({ endYear: 2056, cutoffYear: 2035, endsAfterCutoff: true })
    expect(longevityScenario(7, 2026).endsAfterCutoff).toBe(false)
  })

  it('is conditional on the signing year: a retention period alone does not decide the outcome', () => {
    // the same 7-year retention ends after the cutoff when the signature is made later
    expect(longevityScenario(7, 2026).endsAfterCutoff).toBe(false)
    expect(longevityScenario(7, 2030).endsAfterCutoff).toBe(true)
    // the cutoff year itself is not past the cutoff
    expect(longevityScenario(9, 2026).endsAfterCutoff).toBe(false)
    expect(longevityScenario(10, 2026).endsAfterCutoff).toBe(true)
  })

  it('names renewal as preceding the earliest weakness, invalid certificate or policy cutoff', () => {
    expect(ARCHIVAL_WARNING).toMatch(/earliest of the dates/)
    expect(ARCHIVAL_WARNING).toMatch(
      /algorithm weakens, the signing certificate stops being valid or a policy cuts/
    )
    expect(ARCHIVAL_WARNING).not.toMatch(
      /is the date by which every signature you have already made must be re-timestamped/
    )
  })
})

describe('RFC 3161 time-stamp algorithm agility', () => {
  const text = TIMESTAMP_FACTS.agilityPoint

  it('locates the signature algorithm identifier in the CMS envelope, with a matching certified key', () => {
    expect(text).toMatch(/CMS SignedData structure/)
    expect(text).toMatch(
      /signature algorithm identifier is carried in the SignerInfo \(RFC 5652 Sec\. 5\.3\)/
    )
    expect(text).toMatch(/certificate supplies the public key that has to match it/)
    expect(text).not.toMatch(/comes from the TSA certificate/)
    expect(text).not.toMatch(
      /carries the algorithm in the TSA certificate rather than in the protocol/
    )
  })

  it('counts implementation and interoperability support alongside trust-list and policy changes', () => {
    expect(text).toMatch(/That is not the whole migration/)
    expect(text).toMatch(
      /TSA software, HSMs and every verifier must support it and be tested for interoperability/
    )
    expect(text).toMatch(/trust-list and validation-policy changes/)
    expect(text).not.toMatch(
      /The layer that has to move is the trust list and the validation policy, not the wire format/
    )
  })
})
