// SPDX-License-Identifier: GPL-3.0-only
//
// The workshop's REAL minting path, end to end: SoftHSM PKCS#11 keys →
// buildCompositeCertDraft19 → compositeVerifier.
//
// compositeProfiles.test.ts already round-trips every profile, but it signs
// with @noble directly. That leaves the path users actually exercise — key
// generation and signing inside the HSM — untested, and the two differ in ways
// that matter:
//
//   * PKCS#11 C_Sign returns ECDSA signatures as raw r||s, while draft §4.1
//     requires a DER Ecdsa-Sig-Value. Until 2026-08-18 the hub never converted,
//     so every composite certificate the workshop minted carried a raw
//     classical signature and was non-interoperable. Nothing caught it because
//     no verifier existed; when one arrived it rejected our own output. This
//     file is the regression guard for that.
//
//   * CKA_EC_POINT wraps the point in a DER OCTET STRING that must be stripped,
//     and the wrapper's first byte (0x04) is indistinguishable from an
//     uncompressed point's first byte — so the strip is length-driven and
//     silently wrong if a curve's expected length is not handled.
//
//   * RSA public keys arrive as separate CKA_MODULUS / CKA_PUBLIC_EXPONENT
//     attributes and must be reassembled into a DER RSAPublicKey.
//
// None of those are exercised by signing with @noble.
import { describe, it, expect, beforeAll } from 'vitest'
import * as SoftHSM from '@/wasm/softhsm'
import { hybridCryptoService } from './HybridCryptoService'
import { verifyCompositeCert } from './compositeVerifier'
import {
  ecdsaRawSignatureToDer,
  COMPOSITE_PROFILE_MLDSA44_ECDSA_P256_SHA256,
  COMPOSITE_PROFILE_MLDSA44_ED25519_SHA512,
  COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256,
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512,
  COMPOSITE_PROFILE_MLDSA65_ED25519_SHA512,
  COMPOSITE_PROFILE_MLDSA65_RSA3072_PSS_SHA512,
  COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512,
  type CompositeProfileDraft19,
} from './certBuilder'

/** Strip the PEM armour the service returns and decode back to DER. */
function pemToDer(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '')
  return Uint8Array.from(Buffer.from(b64, 'base64'))
}

const PROFILES: CompositeProfileDraft19[] = [
  COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256,
  COMPOSITE_PROFILE_MLDSA44_ED25519_SHA512,
  COMPOSITE_PROFILE_MLDSA44_ECDSA_P256_SHA256,
  COMPOSITE_PROFILE_MLDSA65_RSA3072_PSS_SHA512,
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512,
  COMPOSITE_PROFILE_MLDSA65_ED25519_SHA512,
  COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512,
]

describe('composite minting through SoftHSM PKCS#11', () => {
  let hsmd: SoftHSM.SoftHSMModule
  let session: number

  beforeAll(async () => {
    hsmd = (await SoftHSM.getSoftHSMRustModule()) as never
    SoftHSM.hsm_initialize(hsmd)
    const freeSlot = SoftHSM.hsm_getFirstFreeSlot(hsmd)
    const slotId = SoftHSM.hsm_initToken(hsmd, freeSlot, '1234', 'Composite Mint')
    session = SoftHSM.hsm_openUserSession(hsmd, slotId, '1234', '1234')
  }, 60_000)

  for (const profile of PROFILES) {
    it(`mints a verifiable ${profile.label} (${profile.compositeOid})`, async () => {
      const result = await hybridCryptoService.generateCompositeCert(
        '/CN=HSM Composite Test/O=pqctoday',
        hsmd,
        session,
        undefined,
        profile
      )
      expect(result.error, `${profile.label}: minting failed`).toBeUndefined()
      expect(result.pem, `${profile.label}: no PEM produced`).toContain('BEGIN CERTIFICATE')

      const der = pemToDer(result.pem)
      const r = await verifyCompositeCert(der)

      expect(r.recognized).toBe(true)
      expect(r.profileLabel).toBe(profile.label)
      expect(r.errors).toEqual([])
      expect(r.mldsa?.verified, `${profile.label}: ML-DSA half — ${r.mldsa?.detail ?? ''}`).toBe(
        true
      )
      // The assertion that would have caught the raw-r||s bug on day one.
      expect(
        r.classical?.verified,
        `${profile.label}: classical half (${r.classical?.algorithm}) — ${r.classical?.detail ?? ''}`
      ).toBe(true)
      expect(r.valid, `${profile.label}: overall verdict`).toBe(true)
    }, 60_000)
  }

  it('pins the raw-vs-DER mismatch the conversion exists to bridge', () => {
    // Without this, the round-trips above could pass vacuously — they would
    // still be green if C_Sign had started returning DER and the conversion
    // were dead code. This asserts the two encodings really do differ, so the
    // conversion is load-bearing.
    const { privHandle } = SoftHSM.hsm_generateECKeyPair(hsmd, session, 'P-256', false, 'sign')
    const raw = SoftHSM.hsm_signBytesECDSA(hsmd, session, privHandle, new Uint8Array(48).fill(3))

    // PKCS#11 C_Sign: fixed-width r||s, no ASN.1 whatsoever.
    expect(raw.length, 'P-256 raw signature is r||s = 32+32').toBe(64)

    // draft §4.1 wants an Ecdsa-Sig-Value: SEQUENCE of two INTEGERs.
    const der = ecdsaRawSignatureToDer(raw)
    expect(der[0], 'DER Ecdsa-Sig-Value starts with SEQUENCE (0x30)').toBe(0x30)
    expect(der[2], 'first element is an INTEGER (0x02)').toBe(0x02)
    expect(der.length, 'DER is longer than raw — header plus INTEGER framing').toBeGreaterThan(
      raw.length
    )
    // Round-trip the magnitudes: r and s must survive the re-encoding intact.
    const rLen = der[3]
    const rBody = der.subarray(4, 4 + rLen)
    const rExpected = raw.subarray(0, 32)
    const rStripped = rBody[0] === 0x00 ? rBody.subarray(1) : rBody
    expect(Buffer.from(rStripped).toString('hex')).toBe(
      Buffer.from(rExpected)
        .toString('hex')
        .replace(/^(00)+/, '')
    )
  }, 60_000)

  it('defaults to id-MLDSA65-ECDSA-P256-SHA512 when no profile is given', async () => {
    // Guards the back-compatible default: callers that predate the profile
    // parameter must keep getting .45, not silently switch profile.
    const result = await hybridCryptoService.generateCompositeCert(
      '/CN=Default Profile/O=pqctoday',
      hsmd,
      session
    )
    expect(result.error).toBeUndefined()
    const r = await verifyCompositeCert(pemToDer(result.pem))
    expect(r.oid).toBe('1.3.6.1.5.5.7.6.45')
    expect(r.valid).toBe(true)
  }, 60_000)
})
