// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Hardening of the one grounding path (cite by sentence, per-claim drop). Each case is
 * a way an unsupported or wrongly cited statement could otherwise reach the reader as
 * verified, or a model output that could stall the page.
 */
import { describe, expect, it } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import { assessClaimSupport, extractTerms } from './citationRelevance'
import { verifyCitations } from './citationVerification'
import { keepVerifiedStatements } from './groundingPolicy'
import { parseCitations } from './parseCitations'
import { finalizeGroundedResponse } from './responseFinalization'

const chunk = (id: string, title: string, lines: string[]): RAGChunk => ({
  id,
  source: 'library',
  title,
  content: lines.join('\n'),
  category: 'library',
  metadata: {},
})

describe('identifier check reads each sentence with its own title only', () => {
  const ssh = chunk('library-RFC 9941', 'RFC 9941', [
    'Specifies sntrup761x25519-sha512 hybrid key exchange for SSH.',
  ])
  const cnsa = chunk('compliance-CNSA-2', 'CNSA 2.0', [
    'NSA requirements for national security systems.',
  ])

  it('does not pool a second chunk title into the first sentence', () => {
    const violations = verifyCitations(
      [
        {
          claimExcerpt: 'CNSA 2.0 mandates RFC 9941 hybrid key exchange for SSH.',
          chunkId: 'library-RFC 9941',
          evidenceRefs: ['library-RFC 9941#1', 'compliance-CNSA-2#1'],
        },
      ],
      [ssh, cnsa]
    )
    expect(violations.map((v) => v.reason)).toContain('weak-evidence')
  })

  it('still lets a sentence borrow its own chunk title', () => {
    const violations = verifyCitations(
      [
        {
          claimExcerpt: 'RFC 9941 specifies hybrid key exchange for SSH.',
          chunkId: 'library-RFC 9941',
          evidenceRefs: ['library-RFC 9941#1'],
        },
      ],
      [ssh, cnsa]
    )
    expect(violations).toEqual([])
  })
})

describe('numbers and versions must match as written', () => {
  it('does not accept FIPS 140-2 from a sentence about FIPS 140-3 that mentions 2 years', () => {
    const r = assessClaimSupport(
      'FIPS 140-2 validation takes 2 years for this module.',
      ['FIPS 140-3 validation takes 2 years for this module.'],
      { titles: [] }
    )
    expect(r.supported).toBe(false)
    expect(r.reason).toBe('missing-identifier')
  })

  it('does not accept TLS 1.3 when the sentence ties TLS to 1.2', () => {
    const r = assessClaimSupport(
      'TLS 1.3 is supported by the library.',
      ['TLS 1.2 is supported alongside version 1.3 of the library.'],
      { titles: [] }
    )
    expect(r.supported).toBe(false)
  })

  it('still accepts the same version written the same way', () => {
    const r = assessClaimSupport(
      'FIPS 140-3 validation takes 2 years for this module.',
      ['FIPS 140-3 validation takes 2 years for this module.'],
      { titles: [] }
    )
    expect(r.supported).toBe(true)
  })
})

describe('a claim with nothing to check is not verified', () => {
  it('rejects a claim made only of stop words', () => {
    const r = assessClaimSupport(
      'It is not done and should not be.',
      ['Public keys are 1184 bytes.'],
      {
        titles: ['ML-KEM-768'],
      }
    )
    expect(r.supported).toBe(false)
  })
})

describe('a reference without a sentence number fails instead of vanishing', () => {
  it('keeps the citation so the id check rejects it', () => {
    const { citations } = parseCitations(
      'ML-KEM-768 does not provide NIST security level 3.\n\n```citations\n' +
        JSON.stringify([
          {
            claimExcerpt: 'ML-KEM-768 does not provide NIST security level 3.',
            evidenceRef: 'bogus-source',
          },
        ]) +
        '\n```'
    )
    expect(citations).toHaveLength(1)
    const kem = chunk('algo-ml-kem-768', 'ML-KEM-768', ['It provides NIST security level 3.'])
    const violations = verifyCitations(citations, [kem])
    expect(violations).toHaveLength(1)
    expect(violations[0].reason).not.toBe('weak-evidence')
  })
})

describe('per-claim drop keeps only whole verified sentences', () => {
  const fips = chunk('vendor-x', 'Vendor X', [
    'The vendor confirmed RSA-2048 is not FIPS 140-3 validated.',
  ])
  const claim = 'The vendor confirmed RSA-2048 is not FIPS 140-3 validated.'
  const cite = [{ claimExcerpt: claim, chunkId: 'vendor-x', evidenceRefs: ['vendor-x#1'] }]

  it('drops an uncited bullet that is only a fragment of a verified claim', () => {
    const r = keepVerifiedStatements(`- ${claim}\n- FIPS 140-3 validated.`, cite, [fips])
    expect(r).not.toBeNull()
    expect(r!.content).not.toContain('- FIPS 140-3 validated.')
    expect(r!.dropped).toBe(1)
  })

  it('drops and counts a one-word uncited sentence', () => {
    const r = keepVerifiedStatements(`${claim} Validated.`, cite, [fips])
    expect(r!.content).toBe(claim)
    expect(r!.dropped).toBe(1)
  })

  it('drops uncited text in a non-Latin script', () => {
    const r = keepVerifiedStatements(`${claim}\n本番環境での使用が承認されています。`, cite, [fips])
    expect(r!.content).not.toContain('本番')
    expect(r!.dropped).toBe(1)
  })

  it('drops an uncited link line whose text appears inside a verified claim', () => {
    const r = keepVerifiedStatements(`${claim}\n[RSA-2048](https://evil.example)`, cite, [fips])
    expect(r!.content).not.toContain('evil.example')
  })

  it('shows the reader note when a statement is removed', () => {
    const out = finalizeGroundedResponse(`${claim} Validated.`, cite, [fips])
    expect(out.mode).toBe('partially-verified')
    expect(out.droppedStatements).toBe(1)
  })
})

describe('adversarial model output stays fast', () => {
  const fast = (fn: () => unknown) => {
    const start = performance.now()
    fn()
    return performance.now() - start
  }

  it('extracts terms from a 50,000-letter run quickly', () => {
    expect(fast(() => extractTerms('a'.repeat(50_000)))).toBeLessThan(250)
  })

  it('parses a pathological evidenceRef quickly', () => {
    const draft = (ref: string) =>
      'x\n\n```citations\n' + JSON.stringify([{ claimExcerpt: 'x', evidenceRef: ref }]) + '\n```'
    expect(fast(() => parseCitations(draft('#1'.repeat(20_000) + 'x')))).toBeLessThan(250)
    expect(fast(() => parseCitations(draft('a' + ' '.repeat(50_000) + 'b')))).toBeLessThan(250)
  })
})

describe('second review: remaining gaps and false rejections', () => {
  it('does not let a bare name take a number attached to another word', () => {
    const r = assessClaimSupport(
      'TLS 1.3 is supported by the library.',
      ['TLS is supported alongside library version 1.3.'],
      { titles: [] }
    )
    expect(r.supported).toBe(false)
  })

  it('accepts a version listed next to another one for the same name', () => {
    const r = assessClaimSupport('TLS 1.3 is supported.', ['TLS 1.2 and 1.3 are supported.'], {
      titles: [],
    })
    expect(r.supported).toBe(true)
  })

  it('accepts a stop-word-only claim quoted word for word', () => {
    const r = assessClaimSupport('This should not be done.', ['This should not be done.'], {
      titles: [],
    })
    expect(r.supported).toBe(true)
  })

  it('drops and counts an uncited symbol such as a check mark', () => {
    const kem = chunk('k', 'K', ['Production deployment is not approved.'])
    const claim = 'Production deployment is not approved.'
    const r = keepVerifiedStatements(
      `${claim}\n✅`,
      [{ claimExcerpt: claim, chunkId: 'k', evidenceRefs: ['k#1'] }],
      [kem]
    )
    expect(r!.content).toBe(claim)
    expect(r!.dropped).toBe(1)
  })

  it('never supports a claim of punctuation only', () => {
    expect(
      assessClaimSupport('...!', ['Public keys are 1184 bytes.'], { titles: [] }).supported
    ).toBe(false)
  })
})
