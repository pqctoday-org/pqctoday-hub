// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { base64urlnopad } from '@scure/base'
import {
  ACME_SAMPLE_ACCOUNT_JWK,
  ACME_SAMPLE_ACCOUNT_CHALLENGE,
  ACME_SAMPLE_CHALLENGE_TOKEN,
  computeAcmeAccountChallenge,
} from './acmeAccountThumbprint'

const expected = 'Suiu29qbfuaBaR4Ats-c6XQBePB_OpAxAwcTR_0KXVM'
describe('RFC 9964 ML-DSA-65 account thumbprint / RFC 8555 key authorization', () => {
  it('matches the published Appendix A.1 kid and independent Node SHA-256', () => {
    expect(ACME_SAMPLE_ACCOUNT_CHALLENGE.thumbprint).toBe(expected)
    expect(
      createHash('sha256')
        .update(ACME_SAMPLE_ACCOUNT_CHALLENGE.canonicalJson, 'utf8')
        .digest('base64url')
    ).toBe(expected)
    expect(ACME_SAMPLE_ACCOUNT_CHALLENGE.keyAuthorization).toBe(
      `AAECAwQFBgcICQoLDA0ODw.${expected}`
    )
    expect(Object.keys(JSON.parse(ACME_SAMPLE_ACCOUNT_CHALLENGE.canonicalJson))).toEqual([
      'alg',
      'kty',
      'pub',
    ])
    expect(ACME_SAMPLE_ACCOUNT_CHALLENGE.canonicalJson).not.toMatch(/\s/)
  })
  it('excludes optional/private members and ignores input insertion order', () => {
    const key = {
      kid: 'not-a-thumbprint',
      priv: 'not-hashed',
      pub: ACME_SAMPLE_ACCOUNT_JWK.pub,
      kty: 'AKP',
      alg: 'ML-DSA-65',
    }
    expect(computeAcmeAccountChallenge(key, 'AQEBAQEBAQEBAQEBAQEBAQ').thumbprint).toBe(expected)
    expect(computeAcmeAccountChallenge(key, 'AQEBAQEBAQEBAQEBAQEBAQ').keyAuthorization).toBe(
      `AQEBAQEBAQEBAQEBAQEBAQ.${expected}`
    )
  })
  it.each([
    '',
    'pqcChallenge123',
    'A'.repeat(21),
    'A'.repeat(21) + '/',
    'A'.repeat(22) + '=',
    'A'.repeat(22) + ' ',
  ])('rejects an invalid or too-short challenge token shape: %s', (token) => {
    expect(() => computeAcmeAccountChallenge(ACME_SAMPLE_ACCOUNT_JWK, token)).toThrow()
  })
  it('uses a complete fixed 16-byte test token without claiming measured entropy', () => {
    expect(base64urlnopad.decode(ACME_SAMPLE_CHALLENGE_TOKEN)).toEqual(
      Uint8Array.from({ length: 16 }, (_, i) => i)
    )
    // A repeated value meets the necessary shape; the helper does not prove randomness.
    expect(computeAcmeAccountChallenge(ACME_SAMPLE_ACCOUNT_JWK, 'A'.repeat(22)).thumbprint).toBe(
      expected
    )
  })
  it('does not hash raw public-key bytes and changes when the public key changes', () => {
    const bytes = base64urlnopad.decode(ACME_SAMPLE_ACCOUNT_JWK.pub)
    expect(createHash('sha256').update(bytes).digest('base64url')).not.toBe(expected)
    bytes[0] ^= 1
    expect(
      computeAcmeAccountChallenge(
        { ...ACME_SAMPLE_ACCOUNT_JWK, pub: base64urlnopad.encode(bytes) },
        ACME_SAMPLE_CHALLENGE_TOKEN
      ).thumbprint
    ).not.toBe(expected)
  })
  it.each([
    { ...ACME_SAMPLE_ACCOUNT_JWK, alg: 'ML-DSA-44' },
    { ...ACME_SAMPLE_ACCOUNT_JWK, kty: 'OKP' },
    { ...ACME_SAMPLE_ACCOUNT_JWK, pub: 'short' },
    { ...ACME_SAMPLE_ACCOUNT_JWK, pub: ACME_SAMPLE_ACCOUNT_JWK.pub + '=' },
    { alg: 'ML-DSA-65', kty: 'AKP' },
  ])('rejects inputs outside the fixed sample key representation', (key) => {
    expect(() => computeAcmeAccountChallenge(key, ACME_SAMPLE_CHALLENGE_TOKEN)).toThrow()
  })
})
