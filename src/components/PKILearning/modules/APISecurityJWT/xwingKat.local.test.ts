// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { ml_kem768_x25519 } from '@noble/post-quantum/hybrid.js'
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'
import { sha3_256 } from '@noble/hashes/sha3.js'
import { concatBytes, hexToBytes, bytesToHex } from '@noble/hashes/utils.js'
import author from '@/data/acvp/xwing-draft-test-vectors.json'
import cfrg from '@/data/acvp/cfrg-concrete-hybrid-kems-test-vectors.json'
import { runXwingKat } from './xwingKat'
import { x25519 } from '@noble/curves/ed25519.js'
import publishedJwe from '@/data/acvp/jose-hpke-pq-pqt-01-examples.json'
import { base64urlDecode, base64urlEncode } from './jwtUtils'
import { hpkeJweDecrypt, generateHpkeKeyPair } from './hpkeJwe'

describe('X-Wing external reference checks (noble)', () => {
  it('X25519 primitive rejects an all-zero shared secret (supplemental low-order input)', () => {
    expect(() => x25519.getSharedSecret(new Uint8Array(32).fill(1), new Uint8Array(32))).toThrow()
  })

  it.each([0, 1088])(
    'HPKE-9 rejects a mutated encapsulation component at byte %i',
    async (offset) => {
      const v = publishedJwe.vectors.find((v) => v.alg === 'HPKE-9')!
      const parts = v.compact.split('.')
      const enc = base64urlDecode(parts[1])
      enc[offset] ^= 1
      parts[1] = base64urlEncode(enc)
      await expect(
        hpkeJweDecrypt({
          token: parts.join('.'),
          alg: 'HPKE-9',
          privateKey: base64urlDecode(v.jwk.priv),
        })
      ).rejects.toThrow()
    }
  )

  it('HPKE-9 rejects the published token under a different recipient seed', async () => {
    const v = publishedJwe.vectors.find((v) => v.alg === 'HPKE-9')!
    const wrong = await generateHpkeKeyPair('HPKE-9')
    await expect(
      hpkeJweDecrypt({ token: v.compact, alg: 'HPKE-9', privateKey: wrong.privateKey })
    ).rejects.toThrow()
  })
  it('executes all 3 author KATs, 32 NIST ACVP component samples and the published X25519 case', async () => {
    const results = await runXwingKat()
    expect(results).toHaveLength(36)
    expect(results.filter((r) => r.status !== 'pass')).toEqual([])
    expect(new Set(results.map((r) => r.id)).size).toBe(36)
  })

  it('detects a changed external expected secret without relying on a round trip', async () => {
    const saved = author.vectors[0].ss
    author.vectors[0].ss = '00'.repeat(32)
    try {
      const results = await runXwingKat()
      expect(results.filter((r) => r.status === 'fail').map((r) => r.id)).toEqual([
        'X-Wing author[0]',
      ])
    } finally {
      author.vectors[0].ss = saved
    }
  })

  it.each(cfrg.vectors.filter((v) => v.kem === 'mlkem768_x25519'))(
    'matches CFRG seed $seed: public key, ciphertext and both shared secrets',
    (v) => {
      const kp = ml_kem768_x25519.keygen(hexToBytes(v.seed))
      const e = ml_kem768_x25519.encapsulate(kp.publicKey, hexToBytes(v.randomness))
      expect(bytesToHex(kp.publicKey)).toBe(v.encapsulation_key)
      expect(bytesToHex(e.cipherText)).toBe(v.ciphertext)
      expect(bytesToHex(e.sharedSecret)).toBe(v.shared_secret)
      expect(bytesToHex(ml_kem768_x25519.decapsulate(hexToBytes(v.ciphertext), kp.secretKey))).toBe(
        v.shared_secret
      )
    }
  )

  it('rejects malformed lengths and invalid ML-KEM public-key coefficients', () => {
    const kp = ml_kem768_x25519.keygen(hexToBytes(author.vectors[0].seed))
    expect(kp.publicKey).toHaveLength(1216)
    const ct = hexToBytes(author.vectors[0].ct)
    expect(ct).toHaveLength(1120)
    expect(() => ml_kem768_x25519.keygen(new Uint8Array(31))).toThrow()
    expect(() => ml_kem768_x25519.encapsulate(kp.publicKey.slice(1))).toThrow()
    expect(() => ml_kem768_x25519.decapsulate(ct.slice(1), kp.secretKey)).toThrow()
    const invalid = kp.publicKey.slice()
    invalid.fill(255, 0, 3)
    expect(() => ml_kem768_x25519.encapsulate(invalid)).toThrow()
  })

  it('supplemental mutations: altered components and wrong recipient do not return the published secret', () => {
    const v = author.vectors[0]
    const kp = ml_kem768_x25519.keygen(hexToBytes(v.seed))
    for (const offset of [0, 1088]) {
      const ct = hexToBytes(v.ct)
      ct[offset] ^= 1
      expect(bytesToHex(ml_kem768_x25519.decapsulate(ct, kp.secretKey))).not.toBe(v.ss)
    }
    const wrong = ml_kem768_x25519.keygen(hexToBytes(author.vectors[1].seed))
    expect(bytesToHex(ml_kem768_x25519.decapsulate(hexToBytes(v.ct), wrong.secretKey))).not.toBe(
      v.ss
    )
  })

  it('published component secrets require the exact SHA3 combiner, order and label', () => {
    const v = cfrg.vectors.find((v) => v.kem === 'mlkem768_x25519')!
    const ct = hexToBytes(v.ciphertext)
    const pk = hexToBytes(v.encapsulation_key)
    const ssM = ml_kem768.decapsulate(
      ct.slice(0, 1088),
      ml_kem768.keygen(hexToBytes(v.decapsulation_key_pq)).secretKey
    )
    // Noble exposes the raw X25519 component via the curve implementation.
    return import('@noble/curves/ed25519.js').then(({ x25519 }) => {
      const ssX = x25519.getSharedSecret(hexToBytes(v.decapsulation_key_t), ct.slice(1088))
      const label = hexToBytes('5c2e2f2f5e5c')
      expect(
        bytesToHex(sha3_256(concatBytes(ssM, ssX, ct.slice(1088), pk.slice(1184), label)))
      ).toBe(v.shared_secret)
      expect(
        bytesToHex(sha3_256(concatBytes(ssX, ssM, ct.slice(1088), pk.slice(1184), label)))
      ).not.toBe(v.shared_secret)
      expect(
        bytesToHex(
          sha3_256(concatBytes(ssM, ssX, ct.slice(1088), pk.slice(1184), new Uint8Array(6)))
        )
      ).not.toBe(v.shared_secret)
    })
  })
})
