// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Statements about the NIST CMVP that were corrected against NIST's published wording stay
 * corrected in every copy a reader or the site assistant meets: on-screen lesson text, the
 * module summaries and the data files the lessons render.
 *
 * Each pin is the corrected claim and, where the old claim was stronger than NIST's wording, the
 * old words that must not come back:
 *  - The FIPS 140-3 Implementation Guidance added PQC self-test requirements in August 2024 and
 *    revised the key-generation tests in September 2025; nothing in it says validated modules
 *    must retest or are "no longer implicitly compliant".
 *  - The Implementation Guidance is one document, last updated 19 August 2026.
 *  - The IUT and MIP lists are voluntary and do not include every module in testing or review.
 *  - Historical modules: NIST says Federal Agencies "should not include these in new systems but
 *    can be procured for legacy systems" and that the certificates are not revoked.
 *  - CSWP 37B is final (NIST CSRC: "09/30/26: CSWP 37B (Final)"), not a draft; the NCCoE
 *    project page still links the draft.
 *  - The Implementation Guidance cites draft-ietf-tls-ecdhe-mlkem-01 for the TLS 1.3 hybrid.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DISTINCT_TERMS } from '../modules/CryptoProductCertification/data/coreData'

/** File text with every run of whitespace collapsed, so JSX line wrapping cannot hide a phrase. */
const read = (rel: string) =>
  readFileSync(join(process.cwd(), 'src/components', rel), 'utf-8').replace(/\s+/g, ' ')

const MODULES = 'PKILearning/modules'

describe('FIPS 140-3 IG self-test history (CryptoMgmtModernization)', () => {
  const copies = [
    `${MODULES}/CryptoMgmtModernization/components/Introduction.tsx`,
    `${MODULES}/CryptoMgmtModernization/rag-summary.md`,
    `${MODULES}/CryptoMgmtModernization/workshop/NoRegretROIBuilder.tsx`,
  ]

  for (const file of copies) {
    it(`${file.split('/').slice(-1)[0]} gives NIST's dates and no retroactive claim`, () => {
      const text = read(file)
      expect(text).toMatch(
        /self-test requirements for (FIPS 203\/204\/205|ML-KEM\/ML-DSA\/SLH-DSA)/
      )
      expect(text).toMatch(/in August 2024/)
      expect(text).toMatch(/key-generation tests check against the private key only/)
      expect(text).not.toMatch(/retroactively (imposed|added)/)
      expect(text).not.toMatch(/implicitly compliant/)
    })
  }

  it('says the Management Manual marks, route by route, which guidance a revalidation meets', () => {
    expect(read(copies[0])).toMatch(
      /Management Manual \(section 7\.1\.14\) marks, route by route, whether the submission must meet all the latest guidance or only the requirements of the original validation/
    )
  })
})

describe('FIPS 140-3 IG edition (one document, last updated 19 August 2026)', () => {
  it('CryptoMgmtModernization cites 19 August 2026, not the section date of 16 April 2026', () => {
    const content = read(`${MODULES}/CryptoMgmtModernization/content.ts`)
    const rag = read(`${MODULES}/CryptoMgmtModernization/rag-summary.md`)
    expect(content).toContain('last updated 19 Aug 2026')
    expect(rag).toContain('last updated 19 Aug 2026')
    expect(content).not.toContain('last updated 16 Apr 2026')
    expect(rag).not.toContain('last updated 16 Apr 2026')
  })

  it('Standards Bodies lists one Implementation Guidance document, not a separate "IG for PQC"', () => {
    const data = read(`${MODULES}/StandardsBodies/data.ts`)
    expect(data).toContain(
      'FIPS 140-3 Implementation Guidance (one document, last updated 19 August 2026)'
    )
    expect(data).not.toContain('Implementation Guidance for PQC (Sep 2025)')
  })
})

describe('the IUT and MIP lists are voluntary and incomplete', () => {
  it('the FIPS lesson summary no longer says a module is in progress only when it is listed', () => {
    const rag = read(`${MODULES}/Fips1403Certification/rag-summary.md`)
    expect(rag).toContain('A module can be in progress without being listed')
    expect(rag).toContain('doesn’t necessarily include all modules being tested or reviewed')
    expect(rag).not.toMatch(/"in progress" only when NIST lists/)
  })

  it('the certification trend chart says the lists are voluntary', () => {
    const chart = read('Compliance/PqcCertificationTrendChart.tsx')
    expect(chart).toContain(
      'NIST says participation on those lists is voluntary and that they do not necessarily include every module being tested or reviewed'
    )
  })
})

describe('Historical modules: "should not include in new systems", not "no longer valid"', () => {
  it('the CMVP glossary entry says what NIST says', () => {
    const entry = DISTINCT_TERMS.find((t) => t.term === 'Historical (CMVP)')
    expect(entry?.meaning).toContain('Federal Agencies should not include Historical modules')
    expect(entry?.meaning).toContain('the certificates are not revoked')
    expect(entry?.meaning).not.toMatch(/No longer valid|only in existing systems/)
  })

  const copies: ReadonlyArray<[string, string]> = [
    [
      `${MODULES}/CryptoProductCertification/components/sections/SharedSections.tsx`,
      'needs a FIPS 140-3 record',
    ],
    [
      `${MODULES}/Fips1403Certification/components/sections/FipsSections.tsx`,
      'needs a FIPS 140-3 validation',
    ],
    [`${MODULES}/VendorRisk/components/Introduction.tsx`, 'not for new procurement'],
    [`${MODULES}/VendorRisk/rag-summary.md`, 'existing systems only'],
    [`${MODULES}/HsmPqc/data/hsmConstants.ts`, 'not for new procurement'],
    [`${MODULES}/CryptoProductCertification/data/coreData.ts`, 'is for existing systems only'],
  ]
  for (const [file, oldWords] of copies) {
    it(`${file.split('/').slice(-1)[0]} no longer says "${oldWords}"`, () => {
      const text = read(file)
      expect(text).not.toContain(oldWords)
      expect(text).toMatch(/should not include|should not be included/)
    })
  }
})

describe('CSWP 37B and the hybrid TLS citation', () => {
  it('CSWP 37B is shown as final (30 September 2026), as NIST CSRC records it, in both lessons', () => {
    for (const file of [
      `${MODULES}/CryptoProductCertification/components/sections/SharedSections.tsx`,
      `${MODULES}/Fips1403Certification/components/sections/FipsSections.tsx`,
    ]) {
      const text = read(file)
      expect(text.replace(/\s+/g, ' '), file).toContain('final, 30 September 2026')
      expect(text.replace(/\s+/g, ' '), file).not.toMatch(/CSWP 37B[^.]{0,200}Initial Public Draft/)
    }
  })

  it('the Hybrid lesson says what the IG cites and keeps RFC 10024 as the published successor', () => {
    const text = read(`${MODULES}/HybridCrypto/components/HybridCryptoIntroduction.tsx`)
    expect(text).toMatch(
      /it cites draft-ietf-tls-ecdhe-mlkem-01; RFC 10024, whose previous version is -05 of that draft, is the draft&apos;s published successor/
    )
    expect(text).not.toContain('key exchange (RFC 10024) may meet Scenario 2')
  })
})

describe('a certificate moves to Historical at its sunset date, not after an IG update', () => {
  it('the Crypto Management Modernization exercise and risk engine give the sunset reason', () => {
    for (const file of [
      `${MODULES}/CryptoMgmtModernization/CryptoMgmtModernizationExercises.tsx`,
      `${MODULES}/CryptoMgmtModernization/workshop/RiskAnalysisEngine.tsx`,
    ]) {
      const text = read(file).replace(/\s+/g, ' ')
      expect(text, file).toMatch(/sunset date/)
      expect(text, file).not.toMatch(/historical after (the )?Sep(tember)? 2025 IG update/i)
    }
    // #4943 (BC-FJA) is an Active certificate; it is never presented as Historical.
    expect(read(`${MODULES}/CryptoMgmtModernization/workshop/RiskAnalysisEngine.tsx`)).toContain(
      'The current BC-FJA certificate, #4943, is Active.'
    )
  })
})
