// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Two quiz explanations that carry numbers or algorithm facts, checked against the
 * document each cites:
 *  - LMS signature sizes: RFC 9858 section 7, Table 3, row "20 | 8 | 1776 | 1144"
 *    (256-bit hash against 192-bit hash, tree height 20, Winternitz 8), which is
 *    "a 35-40% reduction in the size of the signature".
 *  - ML-KEM noise sampling: FIPS 203 Algorithm 13 (K-PKE.KeyGen) samples the secret
 *    vector s (line 9) and the error vector e (line 13) with SamplePolyCBD from a
 *    seed expanded from d (line 1), so sampling is not free of leakage.
 */
import { describe, it, expect } from 'vitest'
import { quizQuestions } from './quizDataLoader'

const q = (id: string) => quizQuestions.find((x) => x.id === id)

describe('LMS signature-size question', () => {
  const question = q('ss-016')

  it('gives the signature sizes from RFC 9858 Table 3 for h=20, w=8', () => {
    expect(question?.explanation).toContain(
      '(from 1,776 bytes to 1,144 bytes for h=20, w=8, RFC 9858 Table 3)'
    )
    expect(question?.explanation).not.toMatch(/~8 KB|~5 KB/)
  })

  it('cites RFC 9858 as well as SP 800-208, with the RFC address', () => {
    expect(question?.source).toBe('RFC 9858 section 7 (Table 3); NIST SP 800-208 section 9.2')
    expect(question?.sourceUrl).toBe('https://www.rfc-editor.org/rfc/rfc9858')
  })
})

describe('ML-KEM leakage question', () => {
  const question = q('ptv-012')

  it('does not say noise sampling handles public values', () => {
    expect(question?.explanation).not.toMatch(/public values/i)
  })

  it('says sampling produces the secret vector and the error vector, citing Algorithm 13', () => {
    expect(question?.explanation).toContain(
      'in key generation it produces the secret vector s and the error vector e'
    )
    expect(question?.explanation).toContain('FIPS 203, Algorithm 13')
    expect(question?.source).toBe('FIPS 203 Algorithm 13')
    expect(question?.sourceUrl).toBe('https://csrc.nist.gov/pubs/fips/203/final')
  })
})
