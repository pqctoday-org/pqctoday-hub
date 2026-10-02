// SPDX-License-Identifier: GPL-3.0-only
/**
 * PQ JWE (HPKE Integrated Encryption) against the published examples of
 * draft-ietf-jose-hpke-pq-pqt-01 Appendix A — HPKE-12 (ML-KEM-768) and HPKE-9
 * (MLKEM768-X25519) — plus the draft-ietf-jose-hpke-encrypt-22 §5 / §7.2 rules.
 *
 * The examples were produced by the draft authors with the `hpke` package on
 * Node's native ML-KEM; this code runs noble's ML-KEM, X-Wing and SHAKE256, so
 * the KEM, KDF and JOSE wiring are checked independently. The HPKE key schedule
 * itself is the same `hpke` code on both sides.
 */
import { describe, expect, it } from 'vitest'
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'
import { ml_kem768_x25519 } from '@noble/post-quantum/hybrid.js'
import examples from '@/data/acvp/jose-hpke-pq-pqt-01-examples.json'
import { base64urlDecode, base64urlEncode } from './jwtUtils'
import {
  HPKE_JWE_SUITES,
  type FlattenedJwe,
  type HpkeJweAlg,
  generateHpkeKeyPair,
  hpkeJweDecrypt,
  hpkeJweDecryptFlattened,
  hpkeJweEncrypt,
} from './hpkeJwe'

const enc = new TextEncoder()
const dec = new TextDecoder()

interface Example {
  alg: HpkeJweAlg
  jwk: { kty: string; alg: string; kid: string; pub: string; priv: string }
  flattened: FlattenedJwe
  compact: string
}
const vectors = examples.vectors as Example[]

const reHeader = (token: string, header: Record<string, unknown>) =>
  [base64urlEncode(enc.encode(JSON.stringify(header))), ...token.split('.').slice(1)].join('.')

describe('HPKE JWE — draft-ietf-jose-hpke-pq-pqt-01 published examples', () => {
  it('covers exactly the two in-scope Integrated Encryption algorithms', () => {
    expect(vectors.map((v) => v.alg).sort()).toEqual(['HPKE-12', 'HPKE-9'])
  })

  describe.each(vectors)('$alg', (v) => {
    const suite = HPKE_JWE_SUITES[v.alg]
    const priv = base64urlDecode(v.jwk.priv)

    it('JWK is AKP with the suite alg, and pub re-derives from the priv seed', () => {
      expect(v.jwk.kty).toBe('AKP')
      expect(v.jwk.alg).toBe(v.alg)
      expect(priv.length).toBe(suite.Nsk)
      const kem = v.alg === 'HPKE-12' ? ml_kem768 : ml_kem768_x25519
      expect(base64urlEncode(kem.keygen(priv).publicKey)).toBe(v.jwk.pub)
    })

    it('compact example: Integrated Encryption layout per -22 §5', () => {
      const [h, ek, iv, ct, tag] = v.compact.split('.')
      const header = JSON.parse(dec.decode(base64urlDecode(h)))
      expect(header.alg).toBe(v.alg)
      expect(header).not.toHaveProperty('enc')
      expect(header).not.toHaveProperty('ek')
      expect(base64urlDecode(ek).length).toBe(suite.Nenc)
      expect(iv).toBe('')
      expect(tag).toBe('')
      expect(ct.length).toBeGreaterThan(0)
    })

    it('compact example decrypts to the published plaintext', async () => {
      const { plaintext } = await hpkeJweDecrypt({ token: v.compact, alg: v.alg, privateKey: priv })
      expect(dec.decode(plaintext)).toBe(examples.plaintext)
    })

    it('flattened example with JWE AAD decrypts to the published plaintext', async () => {
      expect(dec.decode(base64urlDecode(v.flattened.aad!))).toBe(examples.aad_text)
      const { plaintext } = await hpkeJweDecryptFlattened({
        jwe: v.flattened,
        alg: v.alg,
        privateKey: priv,
      })
      expect(dec.decode(plaintext)).toBe(examples.plaintext)
    })

    it('flattened example fails when its JWE AAD is dropped', async () => {
      const noAad: FlattenedJwe = { ...v.flattened, aad: undefined }
      await expect(
        hpkeJweDecryptFlattened({ jwe: noAad, alg: v.alg, privateKey: priv })
      ).rejects.toThrow(/HPKE open failed/)
    })

    it('a modified protected header breaks the AAD binding', async () => {
      const tampered = reHeader(v.compact, { alg: v.alg })
      await expect(
        hpkeJweDecrypt({ token: tampered, alg: v.alg, privateKey: priv })
      ).rejects.toThrow(/HPKE open failed/)
    })

    it('a modified ciphertext is rejected', async () => {
      const parts = v.compact.split('.')
      const ct = base64urlDecode(parts[3])
      ct[0] ^= 0x01
      parts[3] = base64urlEncode(ct)
      await expect(
        hpkeJweDecrypt({ token: parts.join('.'), alg: v.alg, privateKey: priv })
      ).rejects.toThrow(/HPKE open failed/)
    })

    it('encrypt → decrypt round trip with a fresh key pair', async () => {
      const kp = await generateHpkeKeyPair(v.alg)
      expect(kp.publicKey.length).toBe(suite.Npk)
      const { token, encapsulatedKey } = await hpkeJweEncrypt({
        alg: v.alg,
        plaintext: enc.encode('{"sub":"alice"}'),
        publicKey: kp.publicKey,
        kid: 'k1',
      })
      expect(encapsulatedKey.length).toBe(suite.Nenc)
      const [, , iv, , tag] = token.split('.')
      expect([iv, tag]).toEqual(['', ''])
      const { plaintext, header } = await hpkeJweDecrypt({
        token,
        alg: v.alg,
        privateKey: kp.privateKey,
      })
      expect(dec.decode(plaintext)).toBe('{"sub":"alice"}')
      expect(header).toEqual({ alg: v.alg, kid: 'k1' })
    })
  })
})

describe('HPKE JWE — -22 rejection rules', () => {
  const v12 = vectors.find((v) => v.alg === 'HPKE-12')!
  const v9 = vectors.find((v) => v.alg === 'HPKE-9')!
  const priv12 = base64urlDecode(v12.jwk.priv)

  it('rejects a token whose alg differs from the key algorithm', async () => {
    await expect(
      hpkeJweDecrypt({ token: v9.compact, alg: 'HPKE-12', privateKey: priv12 })
    ).rejects.toThrow(/not an allowed HPKE algorithm/)
  })

  it('rejects the retired direct-KEM alg name "ML-KEM-768"', async () => {
    const token = reHeader(v12.compact, { alg: 'ML-KEM-768' })
    await expect(hpkeJweDecrypt({ token, alg: 'HPKE-12', privateKey: priv12 })).rejects.toThrow(
      /not an allowed HPKE algorithm/
    )
  })

  it('rejects "enc" and "ek" header parameters', async () => {
    for (const extra of [{ enc: 'A256GCM' }, { ek: 'AAAA' }]) {
      const token = reHeader(v12.compact, { alg: 'HPKE-12', ...extra })
      await expect(hpkeJweDecrypt({ token, alg: 'HPKE-12', privateKey: priv12 })).rejects.toThrow(
        /MUST NOT be present/
      )
    }
  })

  it('rejects a non-empty IV or Authentication Tag', async () => {
    const parts = v12.compact.split('.')
    for (const i of [2, 4]) {
      const p = [...parts]
      p[i] = 'AAAAAAAAAAAAAAAA'
      await expect(
        hpkeJweDecrypt({ token: p.join('.'), alg: 'HPKE-12', privateKey: priv12 })
      ).rejects.toThrow(/MUST be empty/)
    }
  })

  it('rejects an Encrypted Key of the wrong length', async () => {
    const parts = v12.compact.split('.')
    parts[1] = base64urlEncode(base64urlDecode(parts[1]).subarray(1))
    await expect(
      hpkeJweDecrypt({ token: parts.join('.'), alg: 'HPKE-12', privateKey: priv12 })
    ).rejects.toThrow(/1088-byte encapsulated secret/)
  })

  it('rejects the wrong private key', async () => {
    const other = await generateHpkeKeyPair('HPKE-12')
    await expect(
      hpkeJweDecrypt({ token: v12.compact, alg: 'HPKE-12', privateKey: other.privateKey })
    ).rejects.toThrow(/HPKE open failed/)
  })
})
