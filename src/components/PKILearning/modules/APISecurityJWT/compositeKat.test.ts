// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * Composite JWS conformance — draft-ietf-jose-pq-composite-sigs-04 Appendix A.1.
 *
 * These are the draft authors' published JOSE examples for all six composite
 * algorithms (src/data/acvp/composite-sigs-04-jose-examples.json), not our own
 * output. For each one this checks that:
 *   - the composite public key re-derives from the published seeds
 *     (ML-DSA seed || X9.62 uncompressed ECDSA point / RFC 8032 EdDSA key);
 *   - M' is the raw Prefix || Label || 0x00 || PH(M) the draft prints;
 *   - verifyJWS accepts the published JWS, and rejects it when tampered;
 *   - compositeSign reproduces the published signature byte-for-byte where
 *     the draft's signature is deterministic (ML-DSA rnd=0 and EdDSA). The
 *     draft's ECDSA components use random nonces, so for those only the
 *     ML-DSA half is byte-compared and our ECDSA half must verify.
 *
 * Replaces the self-pinned -01 snapshot (composite-sigs-jose-kat.json), which
 * could only show the implementation agreed with itself.
 */
import { describe, expect, it } from 'vitest'
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js'
import { ed25519 } from '@noble/curves/ed25519.js'
import { ed448 } from '@noble/curves/ed448.js'
import { p256, p384 } from '@noble/curves/nist.js'
import {
  base64urlDecode,
  bytesToHex,
  compositeMessageRepresentative,
  compositeSign,
  compositeVerify,
  verifyJWS,
  type CompositeAlg,
} from './jwtUtils'
import examples from '@/data/acvp/composite-sigs-04-jose-examples.json'

interface Example {
  alg: CompositeAlg
  mldsa_seed: string
  ecdsa_d?: string
  eddsa_seed?: string
  jwk: { pub: string; priv: string }
  jws: string
  raw_message_representative: string
  raw_composite_signature: string
}

const ML = { 44: ml_dsa44, 65: ml_dsa65, 87: ml_dsa87 } as const
const ML_SIG_LEN = { 44: 2420, 65: 3309, 87: 4627 } as const

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

function variantOf(alg: CompositeAlg): 44 | 65 | 87 {
  return Number(alg.slice(7, 9)) as 44 | 65 | 87
}

function tradPublicKey(alg: CompositeAlg, v: Example): Uint8Array {
  if (alg.endsWith('ES256')) return p256.getPublicKey(hexToBytes(v.ecdsa_d!), false)
  if (alg.endsWith('ES384')) return p384.getPublicKey(hexToBytes(v.ecdsa_d!), false)
  if (alg.endsWith('Ed25519')) return ed25519.getPublicKey(hexToBytes(v.eddsa_seed!))
  return ed448.getPublicKey(hexToBytes(v.eddsa_seed!))
}

const vectors = (examples as { vectors: Example[] }).vectors

describe('Composite JWS — draft-ietf-jose-pq-composite-sigs-04 Appendix A.1', () => {
  it('carries all six JOSE composite algorithms', () => {
    expect(vectors.map((v) => v.alg).sort()).toEqual(
      [
        'ML-DSA-44-ES256',
        'ML-DSA-44-Ed25519',
        'ML-DSA-65-ES256',
        'ML-DSA-65-Ed25519',
        'ML-DSA-87-ES384',
        'ML-DSA-87-Ed448',
      ].sort()
    )
  })

  for (const v of vectors) {
    const [h, p, s] = v.jws.split('.')
    const signingInput = new TextEncoder().encode(`${h}.${p}`)
    const pub = base64urlDecode(v.jwk.pub)
    const priv = base64urlDecode(v.jwk.priv)
    const variant = variantOf(v.alg)

    describe(v.alg, () => {
      it('public key re-derives from the published seeds (uncompressed ECDSA point)', () => {
        const ml = ML[variant].keygen(hexToBytes(v.mldsa_seed))
        const trad = tradPublicKey(v.alg, v)
        if (v.alg.includes('-ES')) expect(trad[0]).toBe(0x04)
        expect(bytesToHex(pub)).toBe(bytesToHex(new Uint8Array([...ml.publicKey, ...trad])))
      })

      it("M' is the raw message representative the draft prints", () => {
        expect(bytesToHex(compositeMessageRepresentative(v.alg, signingInput))).toBe(
          v.raw_message_representative.toLowerCase()
        )
      })

      it('verifyJWS accepts the published JWS', async () => {
        const r = await verifyJWS({ token: v.jws, publicKey: pub, backend: 'noble' })
        expect(r.valid).toBe(true)
        expect(r.header.alg).toBe(v.alg)
      })

      it('rejects a tampered ML-DSA half, a tampered traditional half, and a wrong key', () => {
        const sig = base64urlDecode(s)
        const mlFlip = sig.slice()
        mlFlip[10] ^= 0x01
        const tradFlip = sig.slice()
        tradFlip[sig.length - 3] ^= 0x01
        const badPk = pub.slice()
        badPk[pub.length - 1] ^= 0x01
        expect(compositeVerify(v.alg, pub, signingInput, mlFlip)).toBe(false)
        expect(compositeVerify(v.alg, pub, signingInput, tradFlip)).toBe(false)
        expect(compositeVerify(v.alg, badPk, signingInput, sig)).toBe(false)
      })

      it('compositeSign from the published private key reproduces the deterministic parts', () => {
        const ours = compositeSign(v.alg, priv, signingInput)
        const theirs = hexToBytes(v.raw_composite_signature)
        const mlLen = ML_SIG_LEN[variant]
        expect(bytesToHex(ours.subarray(0, mlLen))).toBe(bytesToHex(theirs.subarray(0, mlLen)))
        if (v.alg.includes('-Ed')) {
          expect(bytesToHex(ours)).toBe(bytesToHex(theirs))
        } else {
          // ECDSA: DER Ecdsa-Sig-Value (SEQUENCE tag 0x30), randomized in the draft
          expect(ours[mlLen]).toBe(0x30)
        }
        expect(compositeVerify(v.alg, pub, signingInput, ours)).toBe(true)
      })
    })
  }
})
