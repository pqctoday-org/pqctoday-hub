// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * Self-pinned composite KAT — guards the ML-DSA-65+Ed25519 wire format.
 *
 * draft-ietf-jose-pq-composite-sigs-01 has not yet published worked test
 * vectors, so this snapshot pins our own deterministic output. Any drift
 * in:
 *   - composite key concat order (ML-DSA first, then traditional)
 *   - signature concat order (same)
 *   - M' computation (Prefix || Label || 0x00 || SHA512(M))
 *   - JOSE-encoding of M' (base64url)
 *   - ML-DSA context = Label
 *   - Ed25519 / ML-DSA seeded keygen behavior
 *   - JSON canonicalization in createJWTHeader / createJWTPayload
 * will flip this test's byte equality and force a deliberate review.
 *
 * To regenerate after a deliberate spec or fixture change, run the snippet
 * documented in the JSON fixture's `generator` field.
 */
import { describe, expect, it } from 'vitest'
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'
import { ed25519 } from '@noble/curves/ed25519.js'
import { signJWS, verifyJWS, type JwsKeyPair } from './jwtUtils'
import kat from '@/data/acvp/composite-sigs-jose-kat.json'

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = ''
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0')
  return hex
}

describe('Composite ML-DSA-65+Ed25519 — self-pinned KAT (draft-ietf-jose-pq-composite-sigs-01)', () => {
  const v = (kat as { vector: typeof kat.vector }).vector

  it('seeded keygen + signJWS produces byte-equal expected JWS', async () => {
    // Build the composite keypair from the pinned seeds (ML-DSA first per §4.4)
    const ml = ml_dsa65.keygen(hexToBytes(v.ml_dsa_seed_hex))
    const ed = ed25519.keygen(hexToBytes(v.ed25519_seed_hex))
    const publicKey = new Uint8Array(ml.publicKey.length + ed.publicKey.length)
    publicKey.set(ml.publicKey, 0)
    publicKey.set(ed.publicKey, ml.publicKey.length)
    const secretKey = new Uint8Array(ml.secretKey.length + ed.secretKey.length)
    secretKey.set(ml.secretKey, 0)
    secretKey.set(ed.secretKey, ml.secretKey.length)
    const keyPair: JwsKeyPair = { alg: 'ML-DSA-65-Ed25519', publicKey, secretKey }

    // Sanity: derived public key matches the pinned bytes exactly
    expect(bytesToHex(publicKey)).toBe(v.public_key_hex)

    // Sign with the deterministic path (extraEntropy:false inside signJWS for ML-DSA;
    // Ed25519 is deterministic by RFC 8032). Output must equal the pinned JWS string.
    const result = await signJWS({
      alg: 'ML-DSA-65-Ed25519',
      payload: v.payload as Record<string, unknown>,
      keyPair,
      backend: 'noble',
    })
    expect(result.token).toBe(v.expected_jws)
  })

  it('verifyJWS accepts the pinned JWS under the pinned public key', async () => {
    const publicKey = hexToBytes(v.public_key_hex)
    const result = await verifyJWS({
      token: v.expected_jws,
      publicKey,
      backend: 'noble',
    })
    expect(result.valid).toBe(true)
    expect(result.header.alg).toBe('ML-DSA-65-Ed25519')
  })

  it('verifyJWS rejects the pinned JWS under a different public key', async () => {
    // Flip one byte of the ML-DSA half of the pinned public key
    const pk = hexToBytes(v.public_key_hex)
    pk[100] ^= 0xff
    const result = await verifyJWS({
      token: v.expected_jws,
      publicKey: pk,
      backend: 'noble',
    })
    expect(result.valid).toBe(false)
  })
})
