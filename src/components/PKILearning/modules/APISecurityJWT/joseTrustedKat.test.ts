// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * Trusted-source known-answer tests for the workshop paths that are not
 * already covered by joseKat.test.ts (RFC 9964 ML-DSA) or compositeKat.test.ts
 * (draft-ietf-jose-pq-composite-sigs-04). Every vector here was published by a
 * standards body or the draft's authors — none is our own output:
 *
 *  - SLH-DSA (PQC JWT Signing tab): draft-ietf-cose-sphincs-plus-10 Appendix B —
 *    the JOSE AKP keys (B.1) and a COSE_Sign1 signature under the same keys
 *    (B.2). The draft prints no JWS, so this checks the key encoding and the
 *    SLH-DSA primitive; the JWS framing is the same code path RFC 9964 checks.
 *  - ES256 (inner layer of the Nested JWT tab): RFC 7515 Appendix A.3, verified
 *    with the same WebCrypto call HybridJWT.tsx uses.
 *  - The HPKE JWE tab has its own file, hpkeJwe.test.ts, against the
 *    published examples of draft-ietf-jose-hpke-pq-pqt-01.
 */
import { describe, expect, it } from 'vitest'
import { slh_dsa_sha2_128s, slh_dsa_shake_128s } from '@noble/post-quantum/slh-dsa.js'
import { base64urlDecode, bytesToHex, generateJwsKeyPair, signJWS, verifyJWS } from './jwtUtils'
import slhExamples from '@/data/acvp/cose-sphincs-plus-10-examples.json'
import rfc7515A3 from '@/data/acvp/rfc7515-a3-es256-jws.json'

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

const SLH = {
  'SLH-DSA-SHA2-128s': slh_dsa_sha2_128s,
  'SLH-DSA-SHAKE-128s': slh_dsa_shake_128s,
} as const

/** COSE Sig_structure for COSE_Sign1 (RFC 9052 §4.4), external_aad empty. */
function coseSign1ToBeSigned(protectedHex: string, payloadHex: string): Uint8Array {
  const prot = hexToBytes(protectedHex)
  const payload = hexToBytes(payloadHex)
  const context = new TextEncoder().encode('Signature1')
  // Short-form CBOR lengths suffice: every field here is < 24 bytes.
  return new Uint8Array([
    0x84,
    0x60 + context.length,
    ...context,
    0x40 + prot.length,
    ...prot,
    0x40,
    0x40 + payload.length,
    ...payload,
  ])
}

describe('SLH-DSA — draft-ietf-cose-sphincs-plus-10 Appendix B', () => {
  for (const v of slhExamples.vectors) {
    const alg = v.alg as keyof typeof SLH
    const priv = base64urlDecode(v.jwk.priv)
    const pub = base64urlDecode(v.jwk.pub)

    describe(alg, () => {
      it('AKP priv re-derives the published pub (FIPS 205 keygen from SK.seed||SK.prf||PK.seed)', () => {
        const kp = SLH[alg].keygen(priv.subarray(0, 48))
        expect(bytesToHex(kp.publicKey)).toBe(bytesToHex(pub))
        expect(bytesToHex(kp.secretKey)).toBe(bytesToHex(priv))
      })

      it('the published COSE_Sign1 signature verifies under the published key', () => {
        const toBeSigned = coseSign1ToBeSigned(v.cose_protected_hex, v.payload_hex)
        expect(SLH[alg].verify(hexToBytes(v.signature_hex), toBeSigned, pub)).toBe(true)
        const tampered = toBeSigned.slice()
        tampered[tampered.length - 1] ^= 0x01
        expect(SLH[alg].verify(hexToBytes(v.signature_hex), tampered, pub)).toBe(false)
      })

      it('signJWS/verifyJWS with the published key produce a JWS that verifies', async () => {
        const keyPair = { alg, publicKey: pub, secretKey: priv }
        const signed = await signJWS({ alg, payload: { sub: 'kat' }, keyPair, backend: 'noble' })
        const r = await verifyJWS({ token: signed.token, publicKey: pub, backend: 'noble' })
        expect(r.valid).toBe(true)
        expect(r.header.alg).toBe(alg)
        expect(signed.signature.length).toBe(7856)
      })
    })
  }

  it('the workshop generates keys for both registered JOSE parameter sets', async () => {
    for (const alg of ['SLH-DSA-SHA2-128s', 'SLH-DSA-SHAKE-128s'] as const) {
      const kp = await generateJwsKeyPair({ alg, backend: 'noble' })
      expect(kp.publicKey.length).toBe(32)
    }
  })
})

describe('ES256 — RFC 7515 Appendix A.3 (inner layer of the nested JWT)', () => {
  const v = rfc7515A3.vectors[0]
  const [h, p, s] = v.jws.split('.')

  async function importPublic(): Promise<CryptoKey> {
    const { kty, crv, x, y } = v.jwk
    return crypto.subtle.importKey(
      'jwk',
      { kty, crv, x, y },
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    )
  }

  it('verifies with the same WebCrypto call HybridJWT.tsx uses', async () => {
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      await importPublic(),
      base64urlDecode(s) as Uint8Array<ArrayBuffer>,
      new TextEncoder().encode(`${h}.${p}`)
    )
    expect(ok).toBe(true)
    expect(JSON.parse(new TextDecoder().decode(base64urlDecode(h)))).toEqual({ alg: 'ES256' })
  })

  it('rejects the example with a modified payload', async () => {
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      await importPublic(),
      base64urlDecode(s) as Uint8Array<ArrayBuffer>,
      new TextEncoder().encode(`${h}.${p}x`)
    )
    expect(ok).toBe(false)
  })
})
