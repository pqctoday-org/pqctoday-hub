// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * JOSE Known Answer Tests — draft-ietf-cose-dilithium-11 Appendix A.1.
 *
 * Verifies our JWS adapter accepts byte-exact JWS compact serializations
 * produced by the IETF draft authors (Prorock & Steele, Tradeverifyd, Nov 2025).
 *
 * Each test:
 *   1. Derives the public key from the 32-byte all-zeros seed via FIPS 204 KeyGen
 *      (same AKP seed the draft uses for all three vectors).
 *   2. Splits the draft's compact JWS into (header, payload, signature).
 *   3. Decodes the JOSE header and asserts the `alg` field matches the variant.
 *   4. Calls verifyJWS({backend:'noble'}) on the unmodified token + derived pk.
 *   5. Asserts valid === true and the payload roundtrips to the expected text.
 *
 * A FAIL means our implementation cannot interoperate with the official IETF
 * JOSE PQC vectors — i.e. a real standards-compliance regression.
 *
 * Source: https://www.ietf.org/archive/id/draft-ietf-cose-dilithium-11.txt
 */
import { describe, expect, it } from 'vitest'
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js'
import { base64urlDecode, verifyJWS } from './jwtUtils'
import katVectors from '@/data/acvp/cose-dilithium-11-jose-kat.json'

const SUITES = {
  'ML-DSA-44': ml_dsa44,
  'ML-DSA-65': ml_dsa65,
  'ML-DSA-87': ml_dsa87,
} as const

interface JoseKat {
  alg: 'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87'
  kid: string
  priv_seed_hex: string
  expected_payload_text: string
  jws: string
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

describe('RFC 9964 Appendix A.1 — official IETF JOSE KAT vectors', () => {
  for (const v of (katVectors as { vectors: JoseKat[] }).vectors) {
    it(`${v.alg}: verifyJWS accepts the draft's compact JWS under the AKP-derived public key`, async () => {
      const seed = hexToBytes(v.priv_seed_hex)
      const suite = SUITES[v.alg]
      const { publicKey } = suite.keygen(seed)

      // Sanity: header carries the right alg
      const parts = v.jws.split('.')
      expect(parts).toHaveLength(3)
      const header = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[0]))) as {
        alg: string
        kid: string
      }
      expect(header.alg).toBe(v.alg)
      expect(header.kid).toBe(v.kid)

      // Sanity: payload roundtrips to the draft's plaintext
      const payloadText = new TextDecoder().decode(base64urlDecode(parts[1]))
      expect(payloadText).toBe(v.expected_payload_text)

      // Direct primitive check (proves inputs are right)
      const signingBytes = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
      const sig = base64urlDecode(parts[2])
      const directVerify = suite.verify(sig, signingBytes, publicKey)
      expect(directVerify).toBe(true)

      // Adapter path — should produce the same result
      const result = await verifyJWS({
        token: v.jws,
        publicKey,
        backend: 'noble',
      })
      expect(result.valid).toBe(true)
      expect(result.header.alg).toBe(v.alg)
    })

    it(`${v.alg}: tampering invalidates the draft's signature`, async () => {
      const seed = hexToBytes(v.priv_seed_hex)
      const { publicKey } = SUITES[v.alg].keygen(seed)

      // Flip one byte of the payload — verify must reject
      const parts = v.jws.split('.')
      const payloadBytes = base64urlDecode(parts[1])
      payloadBytes[0] ^= 0xff
      const tampered = `${parts[0]}.${Buffer.from(payloadBytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.${parts[2]}`

      const result = await verifyJWS({
        token: tampered,
        publicKey,
        backend: 'noble',
      })
      expect(result.valid).toBe(false)
    })
  }
})
