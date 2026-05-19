// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  base64urlDecode,
  base64urlEncode,
  decodeJWT,
  generateJwsKeyPair,
  signJWS,
  verifyJWS,
  type JwsAlg,
} from './jwtUtils'

const PAYLOAD = {
  sub: '1234567890',
  iat: 1735689600,
  iss: 'https://auth.example.com',
}

describe('base64url helpers', () => {
  it('roundtrips arbitrary bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255])
    expect(base64urlDecode(base64urlEncode(bytes))).toEqual(bytes)
  })
  it('produces no padding chars', () => {
    expect(base64urlEncode(new Uint8Array([1, 2, 3]))).not.toContain('=')
  })
})

describe('signJWS / verifyJWS — noble backend', () => {
  const algs: JwsAlg[] = ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87']

  for (const alg of algs) {
    it(`${alg}: sign+verify roundtrip succeeds`, async () => {
      const kp = await generateJwsKeyPair({ alg, backend: 'noble' })
      const signed = await signJWS({
        alg,
        payload: PAYLOAD,
        keyPair: kp,
        backend: 'noble',
      })

      // Compact JWS shape
      expect(signed.token.split('.').length).toBe(3)
      expect(signed.signature.length).toBeGreaterThan(0)

      // Verify succeeds
      const v = await verifyJWS({
        token: signed.token,
        publicKey: kp.publicKey,
        backend: 'noble',
      })
      expect(v.valid).toBe(true)
      expect(v.payload).toEqual(PAYLOAD)
    })

    it(`${alg}: tampered signature fails verification`, async () => {
      const kp = await generateJwsKeyPair({ alg, backend: 'noble' })
      const signed = await signJWS({ alg, payload: PAYLOAD, keyPair: kp, backend: 'noble' })
      const parts = signed.token.split('.')
      // Flip one byte of the signature
      const sigBytes = base64urlDecode(parts[2])
      sigBytes[0] ^= 0xff
      const tamperedToken = `${parts[0]}.${parts[1]}.${base64urlEncode(sigBytes)}`
      const v = await verifyJWS({
        token: tamperedToken,
        publicKey: kp.publicKey,
        backend: 'noble',
      })
      expect(v.valid).toBe(false)
    })

    it(`${alg}: wrong public key fails verification`, async () => {
      const kpA = await generateJwsKeyPair({ alg, backend: 'noble' })
      const kpB = await generateJwsKeyPair({ alg, backend: 'noble' })
      const signed = await signJWS({ alg, payload: PAYLOAD, keyPair: kpA, backend: 'noble' })
      const v = await verifyJWS({
        token: signed.token,
        publicKey: kpB.publicKey,
        backend: 'noble',
      })
      expect(v.valid).toBe(false)
    })
  }

  describe('composite (all 6 Table 2 algs) sign+verify roundtrip', () => {
    const algs = [
      'ML-DSA-44-ES256',
      'ML-DSA-65-ES256',
      'ML-DSA-87-ES384',
      'ML-DSA-44-Ed25519',
      'ML-DSA-65-Ed25519',
      'ML-DSA-87-Ed448',
    ] as const

    for (const alg of algs) {
      it(`${alg}: sign+verify roundtrip succeeds`, async () => {
        const kp = await generateJwsKeyPair({ alg, backend: 'noble' })
        const signed = await signJWS({
          alg,
          payload: PAYLOAD,
          keyPair: kp,
          backend: 'noble',
        })
        const v = await verifyJWS({
          token: signed.token,
          publicKey: kp.publicKey,
          backend: 'noble',
        })
        expect(v.valid).toBe(true)
        expect(v.header.alg).toBe(alg)
      }, 30_000)
    }
  })

  it('composite MLDSA65-Ed25519: signing the same payload twice is byte-equal (deterministic)', async () => {
    const kp = await generateJwsKeyPair({ alg: 'ML-DSA-65-Ed25519', backend: 'noble' })
    const a = await signJWS({
      alg: 'ML-DSA-65-Ed25519',
      payload: PAYLOAD,
      keyPair: kp,
      backend: 'noble',
    })
    const b = await signJWS({
      alg: 'ML-DSA-65-Ed25519',
      payload: PAYLOAD,
      keyPair: kp,
      backend: 'noble',
    })
    expect(a.token).toBe(b.token)
  })

  it('composite MLDSA65-Ed25519: sign+verify roundtrip succeeds', async () => {
    const kp = await generateJwsKeyPair({ alg: 'ML-DSA-65-Ed25519', backend: 'noble' })
    const signed = await signJWS({
      alg: 'ML-DSA-65-Ed25519',
      payload: PAYLOAD,
      keyPair: kp,
      backend: 'noble',
    })
    expect(signed.token.split('.').length).toBe(3)
    // draft-ietf-jose-pq-composite-sigs-01 §4.4: 3309 B ML-DSA-65 || 64 B Ed25519
    expect(signed.signature.length).toBe(3309 + 64)

    const v = await verifyJWS({
      token: signed.token,
      publicKey: kp.publicKey,
      backend: 'noble',
    })
    expect(v.valid).toBe(true)
  })

  it('composite: tampering the Ed25519 component fails the composite check', async () => {
    const kp = await generateJwsKeyPair({ alg: 'ML-DSA-65-Ed25519', backend: 'noble' })
    const signed = await signJWS({
      alg: 'ML-DSA-65-Ed25519',
      payload: PAYLOAD,
      keyPair: kp,
      backend: 'noble',
    })
    const parts = signed.token.split('.')
    const sig = base64urlDecode(parts[2])
    // Flip a byte inside the Ed25519 section (offset 3309 starts the Ed25519 sig per §4.4)
    sig[3310] ^= 0x42
    const tampered = `${parts[0]}.${parts[1]}.${base64urlEncode(sig)}`
    const v = await verifyJWS({
      token: tampered,
      publicKey: kp.publicKey,
      backend: 'noble',
    })
    expect(v.valid).toBe(false)
  })

  it('SLH-DSA-SHA2-128s: sign+verify roundtrip succeeds', async () => {
    const kp = await generateJwsKeyPair({ alg: 'SLH-DSA-SHA2-128s', backend: 'noble' })
    const signed = await signJWS({
      alg: 'SLH-DSA-SHA2-128s',
      payload: PAYLOAD,
      keyPair: kp,
      backend: 'noble',
    })
    expect(signed.token.split('.').length).toBe(3)
    expect(signed.signature.length).toBeGreaterThan(7000)

    const v = await verifyJWS({
      token: signed.token,
      publicKey: kp.publicKey,
      backend: 'noble',
    })
    expect(v.valid).toBe(true)
  }, 30_000) // SLH-DSA is slow

  it('JWS signing input matches RFC 7515 §5.1: b64u(header).b64u(payload)', async () => {
    const kp = await generateJwsKeyPair({ alg: 'ML-DSA-44', backend: 'noble' })
    const signed = await signJWS({
      alg: 'ML-DSA-44',
      payload: PAYLOAD,
      keyPair: kp,
      backend: 'noble',
    })
    const [h, p] = signed.token.split('.')
    expect(signed.signingInput).toBe(`${h}.${p}`)
    const decoded = decodeJWT(signed.token)
    expect(decoded?.header).toEqual({ alg: 'ML-DSA-44', typ: 'JWT' })
    expect(decoded?.payload).toEqual(PAYLOAD)
  })
})

describe('isSoftHsmSupported', () => {
  it('returns true for ML-DSA and SLH-DSA, false for composite', async () => {
    const { isSoftHsmSupported } = await import('./jwtUtils')
    expect(isSoftHsmSupported('ML-DSA-65')).toBe(true)
    expect(isSoftHsmSupported('SLH-DSA-SHA2-128s')).toBe(true)
    expect(isSoftHsmSupported('SLH-DSA-SHA2-192s')).toBe(true)
    expect(isSoftHsmSupported('SLH-DSA-SHA2-256s')).toBe(true)
    expect(isSoftHsmSupported('ML-DSA-65-Ed25519')).toBe(false)
  })
})

describe('standards compliance — JWS framing', () => {
  it('RFC 4648 §5: base64url output omits = padding and uses URL-safe alphabet', () => {
    const out = base64urlEncode(new Uint8Array([0xfb, 0xff, 0xbf]))
    expect(out).not.toContain('=')
    expect(/^[A-Za-z0-9_-]+$/.test(out)).toBe(true)
  })

  it('RFC 7515 Appendix A.1: decoder reproduces the HS256 example header', () => {
    const headerBytes = base64urlDecode('eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9')
    const headerJson = JSON.parse(new TextDecoder().decode(headerBytes)) as {
      typ: string
      alg: string
    }
    expect(headerJson.typ).toBe('JWT')
    expect(headerJson.alg).toBe('HS256')
  })

  it('RFC 7515 Appendix A.1: decoder reproduces the example payload (iss=joe)', () => {
    const payloadBytes = base64urlDecode(
      'eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ'
    )
    const parsed = JSON.parse(new TextDecoder().decode(payloadBytes)) as { iss: string }
    expect(parsed.iss).toBe('joe')
  })

  it('RFC 7515 §3.1: compact JWS has exactly three base64url segments', async () => {
    const kp = await generateJwsKeyPair({ alg: 'ML-DSA-65', backend: 'noble' })
    const signed = await signJWS({
      alg: 'ML-DSA-65',
      payload: PAYLOAD,
      keyPair: kp,
      backend: 'noble',
    })
    const parts = signed.token.split('.')
    expect(parts).toHaveLength(3)
    for (const p of parts) {
      expect(/^[A-Za-z0-9_-]+$/.test(p)).toBe(true)
    }
  })

  it('RFC 7515 §10.7: tampering the JOSE header invalidates the signature', async () => {
    const kp = await generateJwsKeyPair({ alg: 'ML-DSA-65', backend: 'noble' })
    const signed = await signJWS({
      alg: 'ML-DSA-65',
      payload: PAYLOAD,
      keyPair: kp,
      backend: 'noble',
    })
    const tamperedHeader = base64urlEncode(
      new TextEncoder().encode('{"alg":"ML-DSA-65","typ":"JWT","kid":"x"}')
    )
    const tamperedToken = `${tamperedHeader}.${signed.payloadB64}.${signed.signatureB64}`
    const v = await verifyJWS({
      token: tamperedToken,
      publicKey: kp.publicKey,
      backend: 'noble',
    })
    expect(v.valid).toBe(false)
  })

  it('FIPS 204 Table 1: ML-DSA-65 sizes — pk=1952, sig=3309', async () => {
    const kp = await generateJwsKeyPair({ alg: 'ML-DSA-65', backend: 'noble' })
    const signed = await signJWS({
      alg: 'ML-DSA-65',
      payload: PAYLOAD,
      keyPair: kp,
      backend: 'noble',
    })
    expect(kp.publicKey.length).toBe(1952)
    expect(signed.signature.length).toBe(3309)
  })

  it('draft-ietf-cose-dilithium-11 §2.1: alg code is one of ML-DSA-44/65/87', async () => {
    const kp = await generateJwsKeyPair({ alg: 'ML-DSA-87', backend: 'noble' })
    const signed = await signJWS({
      alg: 'ML-DSA-87',
      payload: PAYLOAD,
      keyPair: kp,
      backend: 'noble',
    })
    const decoded = decodeJWT(signed.token)
    expect(decoded?.header?.alg).toBe('ML-DSA-87')
  })

  it('draft-ietf-jose-pq-composite-sigs-01 §3: MLDSA65-Ed25519 alg + framed sig length', async () => {
    const kp = await generateJwsKeyPair({ alg: 'ML-DSA-65-Ed25519', backend: 'noble' })
    const signed = await signJWS({
      alg: 'ML-DSA-65-Ed25519',
      payload: PAYLOAD,
      keyPair: kp,
      backend: 'noble',
    })
    const decoded = decodeJWT(signed.token)
    expect(decoded?.header?.alg).toBe('ML-DSA-65-Ed25519')
    // draft-ietf-jose-pq-composite-sigs-01 §4.4: direct concat, ML-DSA first
    expect(signed.signature.length).toBe(3309 + 64)
  })
})
