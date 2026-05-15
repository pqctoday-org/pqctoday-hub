// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { AsnConvert } from '@peculiar/asn1-schema'
import { Certificate, TBSCertificate } from '@peculiar/asn1-x509'
import {
  buildCompositeCertDraft19,
  buildCompositeMessageRepresentative,
  COMPOSITE_DRAFT19_PREFIX,
  COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256,
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512,
  COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512,
  type CompositeProfileDraft19,
} from './certBuilder'

/**
 * Capturing classical signer: stores the message it was called with so tests
 * can verify the bytes match M' per draft-19 §2.2.
 */
function capturingClassicalSigner(length: number, fill: number) {
  const captured: { msg: Uint8Array | null } = { msg: null }
  const sign = async (msg: Uint8Array): Promise<Uint8Array> => {
    captured.msg = new Uint8Array(msg) // copy
    const out = new Uint8Array(length)
    out.fill(fill)
    return out
  }
  return { sign, captured }
}

/**
 * Capturing ML-DSA signer: stores both the message and the mldsa_ctx
 * parameter so tests can verify the standard's `mldsa_ctx=Label` requirement.
 */
function capturingMLDSASigner(length: number, fill: number) {
  const captured: { msg: Uint8Array | null; mldsaCtx: Uint8Array | null } = {
    msg: null,
    mldsaCtx: null,
  }
  const sign = async (msg: Uint8Array, mldsaCtx: Uint8Array): Promise<Uint8Array> => {
    captured.msg = new Uint8Array(msg)
    captured.mldsaCtx = new Uint8Array(mldsaCtx)
    const out = new Uint8Array(length)
    out.fill(fill)
    return out
  }
  return { sign, captured }
}

interface ProfileCase {
  name: string
  profile: CompositeProfileDraft19
  classicalSigBytes: number
  mldsaPubKeyBytes: number
  classicalPubKeyBytes: number
  /** Expected PH output size for the profile's pre-hash function */
  phBytes: number
}

const CASES: ProfileCase[] = [
  {
    name: 'MLDSA44 + RSA2048-PSS-SHA256',
    profile: COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256,
    classicalSigBytes: 256, // RSA-2048 PSS signature
    mldsaPubKeyBytes: 1312,
    classicalPubKeyBytes: 270,
    phBytes: 32, // SHA-256
  },
  {
    name: 'MLDSA65 + ECDSA-P256-SHA512',
    profile: COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512,
    classicalSigBytes: 72,
    mldsaPubKeyBytes: 1952,
    classicalPubKeyBytes: 65,
    phBytes: 64, // SHA-512
  },
  {
    name: 'MLDSA87 + ECDSA-P384-SHA512',
    profile: COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512,
    classicalSigBytes: 104,
    mldsaPubKeyBytes: 2592,
    classicalPubKeyBytes: 97,
    phBytes: 64, // SHA-512
  },
]

describe('COMPOSITE_DRAFT19_PREFIX', () => {
  it('is exactly the 32-byte ASCII "CompositeAlgorithmSignatures2025"', () => {
    expect(Array.from(COMPOSITE_DRAFT19_PREFIX)).toEqual(
      Array.from(new TextEncoder().encode('CompositeAlgorithmSignatures2025'))
    )
    expect(COMPOSITE_DRAFT19_PREFIX.length).toBe(32)
    // Hex matches draft-19 §2.2:
    //   436F6D706F73697465416C676F726974686D5369676E61747572657332303235
    const hex = Array.from(COMPOSITE_DRAFT19_PREFIX)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    expect(hex).toBe('436f6d706f73697465416c676f726974686d5369676e61747572657332303235')
  })
})

describe('buildCompositeMessageRepresentative (draft-19 §2.2)', () => {
  it.each(CASES)(
    "produces M' = Prefix || Label || len(ctx) || ctx || PH(M) — $name (empty ctx)",
    async ({ profile, phBytes }) => {
      const message = new TextEncoder().encode('hello, composite')
      const mprime = await buildCompositeMessageRepresentative(profile, message, new Uint8Array(0))
      const labelLen = profile.signatureLabel.length
      // Layout: 32 (prefix) + labelLen + 1 (len(ctx)=0) + 0 (ctx) + phBytes
      expect(mprime.length).toBe(32 + labelLen + 1 + 0 + phBytes)
      // Prefix matches
      expect(Array.from(mprime.slice(0, 32))).toEqual(Array.from(COMPOSITE_DRAFT19_PREFIX))
      // Label matches
      expect(Array.from(mprime.slice(32, 32 + labelLen))).toEqual(
        Array.from(new TextEncoder().encode(profile.signatureLabel))
      )
      // len(ctx) byte = 0
      expect(mprime[32 + labelLen]).toBe(0)
    }
  )

  it('includes ctx bytes with a single-byte length prefix when ctx is non-empty', async () => {
    const profile = COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512
    const ctx = new TextEncoder().encode('app-ctx-123')
    const message = new TextEncoder().encode('msg')
    const mprime = await buildCompositeMessageRepresentative(profile, message, ctx)
    const labelLen = profile.signatureLabel.length
    expect(mprime[32 + labelLen]).toBe(ctx.length)
    expect(Array.from(mprime.slice(32 + labelLen + 1, 32 + labelLen + 1 + ctx.length))).toEqual(
      Array.from(ctx)
    )
  })

  it('rejects a ctx longer than 255 bytes', async () => {
    const profile = COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512
    const oversizedCtx = new Uint8Array(256)
    await expect(
      buildCompositeMessageRepresentative(profile, new Uint8Array(10), oversizedCtx)
    ).rejects.toThrow(/exceeds 255 bytes/)
  })
})

describe('buildCompositeCertDraft19', () => {
  it.each(CASES)(
    "passes M' (not raw TBS) to both signers — $name",
    async ({ profile, classicalSigBytes, mldsaPubKeyBytes, classicalPubKeyBytes, phBytes }) => {
      const mldsaPub = new Uint8Array(mldsaPubKeyBytes).fill(0xaa)
      const classicalPub = new Uint8Array(classicalPubKeyBytes).fill(0xbb)
      const ml = capturingMLDSASigner(profile.mldsaSigBytes, 0x11)
      const cl = capturingClassicalSigner(classicalSigBytes, 0x22)

      await buildCompositeCertDraft19(
        profile,
        mldsaPub,
        classicalPub,
        ml.sign,
        cl.sign,
        '/CN=test/O=pqctoday'
      )

      expect(ml.captured.msg).not.toBeNull()
      expect(cl.captured.msg).not.toBeNull()
      // Both signers received the SAME M' bytes
      expect(Array.from(ml.captured.msg!)).toEqual(Array.from(cl.captured.msg!))
      // M' shape: prefix + label + len(ctx)=0 + ctx + PH(TBS)
      const labelLen = profile.signatureLabel.length
      expect(ml.captured.msg!.length).toBe(32 + labelLen + 1 + 0 + phBytes)
      expect(Array.from(ml.captured.msg!.slice(0, 32))).toEqual(
        Array.from(COMPOSITE_DRAFT19_PREFIX)
      )
      expect(Array.from(ml.captured.msg!.slice(32, 32 + labelLen))).toEqual(
        Array.from(new TextEncoder().encode(profile.signatureLabel))
      )
      expect(ml.captured.msg![32 + labelLen]).toBe(0)
    }
  )

  it.each(CASES)(
    'passes signatureLabel as mldsa_ctx to the ML-DSA signer — $name',
    async ({ profile, classicalSigBytes, mldsaPubKeyBytes, classicalPubKeyBytes }) => {
      const ml = capturingMLDSASigner(profile.mldsaSigBytes, 0x11)
      const cl = capturingClassicalSigner(classicalSigBytes, 0x22)

      await buildCompositeCertDraft19(
        profile,
        new Uint8Array(mldsaPubKeyBytes).fill(0xaa),
        new Uint8Array(classicalPubKeyBytes).fill(0xbb),
        ml.sign,
        cl.sign,
        '/CN=test/O=pqctoday'
      )

      expect(ml.captured.mldsaCtx).not.toBeNull()
      expect(Array.from(ml.captured.mldsaCtx!)).toEqual(
        Array.from(new TextEncoder().encode(profile.signatureLabel))
      )
    }
  )

  it.each(CASES)(
    'produces a parseable X.509 cert with the right composite OID — $name',
    async ({ profile, classicalSigBytes, mldsaPubKeyBytes, classicalPubKeyBytes }) => {
      const ml = capturingMLDSASigner(profile.mldsaSigBytes, 0x11)
      const cl = capturingClassicalSigner(classicalSigBytes, 0x22)

      const certDer = await buildCompositeCertDraft19(
        profile,
        new Uint8Array(mldsaPubKeyBytes).fill(0xaa),
        new Uint8Array(classicalPubKeyBytes).fill(0xbb),
        ml.sign,
        cl.sign,
        '/CN=test-composite/O=pqctoday'
      )

      const cert = AsnConvert.parse(certDer.buffer as ArrayBuffer, Certificate)
      expect(cert.signatureAlgorithm.algorithm).toBe(profile.compositeOid)
      expect(cert.tbsCertificate.signature.algorithm).toBe(profile.compositeOid)
      expect(cert.tbsCertificate.subjectPublicKeyInfo.algorithm.algorithm).toBe(
        profile.compositeOid
      )
    }
  )

  it.each(CASES)(
    'encodes the signature value as `mldsaSig || classicalSig` per draft-19 §4.3 — $name',
    async ({ profile, classicalSigBytes, mldsaPubKeyBytes, classicalPubKeyBytes }) => {
      const ml = capturingMLDSASigner(profile.mldsaSigBytes, 0x11)
      const cl = capturingClassicalSigner(classicalSigBytes, 0x22)
      const certDer = await buildCompositeCertDraft19(
        profile,
        new Uint8Array(mldsaPubKeyBytes).fill(0xaa),
        new Uint8Array(classicalPubKeyBytes).fill(0xbb),
        ml.sign,
        cl.sign,
        '/CN=test/O=pqctoday'
      )
      const cert = AsnConvert.parse(certDer.buffer as ArrayBuffer, Certificate)
      const sigBytes = new Uint8Array(cert.signatureValue)
      expect(sigBytes.length).toBe(profile.mldsaSigBytes + classicalSigBytes)
      expect(sigBytes.slice(0, profile.mldsaSigBytes).every((b) => b === 0x11)).toBe(true)
      expect(sigBytes.slice(profile.mldsaSigBytes).every((b) => b === 0x22)).toBe(true)
    }
  )

  it.each(CASES)(
    'encodes the public key as `mldsaPK || classicalPK` per draft-19 §4.1 — $name',
    async ({ profile, classicalSigBytes, mldsaPubKeyBytes, classicalPubKeyBytes }) => {
      const ml = capturingMLDSASigner(profile.mldsaSigBytes, 0x11)
      const cl = capturingClassicalSigner(classicalSigBytes, 0x22)
      const certDer = await buildCompositeCertDraft19(
        profile,
        new Uint8Array(mldsaPubKeyBytes).fill(0xaa),
        new Uint8Array(classicalPubKeyBytes).fill(0xbb),
        ml.sign,
        cl.sign,
        '/CN=test/O=pqctoday'
      )
      const cert = AsnConvert.parse(certDer.buffer as ArrayBuffer, Certificate)
      const spkiBytes = new Uint8Array(cert.tbsCertificate.subjectPublicKeyInfo.subjectPublicKey)
      expect(spkiBytes.length).toBe(mldsaPubKeyBytes + classicalPubKeyBytes)
      expect(spkiBytes.slice(0, mldsaPubKeyBytes).every((b) => b === 0xaa)).toBe(true)
      expect(spkiBytes.slice(mldsaPubKeyBytes).every((b) => b === 0xbb)).toBe(true)
    }
  )

  it('rejects an ML-DSA signature whose length does not match the profile', async () => {
    const profile = COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512
    const ml = capturingMLDSASigner(profile.mldsaSigBytes - 1, 0x11)
    const cl = capturingClassicalSigner(72, 0x22)
    await expect(
      buildCompositeCertDraft19(
        profile,
        new Uint8Array(1952).fill(0xaa),
        new Uint8Array(65).fill(0xbb),
        ml.sign,
        cl.sign,
        '/CN=test/O=pqctoday'
      )
    ).rejects.toThrow(/ML-DSA signature of \d+ bytes/)
  })

  it('produces a TBSCertificate parseable as a standalone DER blob', async () => {
    const profile = COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512
    const ml = capturingMLDSASigner(profile.mldsaSigBytes, 0x11)
    const cl = capturingClassicalSigner(72, 0x22)
    const certDer = await buildCompositeCertDraft19(
      profile,
      new Uint8Array(1952).fill(0xaa),
      new Uint8Array(65).fill(0xbb),
      ml.sign,
      cl.sign,
      '/CN=foo/O=pqctoday'
    )
    const cert = AsnConvert.parse(certDer.buffer as ArrayBuffer, Certificate)
    const tbsDer = AsnConvert.serialize(cert.tbsCertificate)
    const reparsed = AsnConvert.parse(tbsDer, TBSCertificate)
    expect(reparsed.subjectPublicKeyInfo.algorithm.algorithm).toBe(profile.compositeOid)
  })

  it("M' contains PH(TBS) — verify hash matches a freshly-computed digest of the captured TBS", async () => {
    const profile = COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512
    const ml = capturingMLDSASigner(profile.mldsaSigBytes, 0x11)
    const cl = capturingClassicalSigner(72, 0x22)

    const certDer = await buildCompositeCertDraft19(
      profile,
      new Uint8Array(1952).fill(0xaa),
      new Uint8Array(65).fill(0xbb),
      ml.sign,
      cl.sign,
      '/CN=test/O=pqctoday'
    )

    // Extract TBS from the produced cert and recompute SHA-512(TBS)
    const cert = AsnConvert.parse(certDer.buffer as ArrayBuffer, Certificate)
    const tbsDer = new Uint8Array(AsnConvert.serialize(cert.tbsCertificate))
    const expectedPH = new Uint8Array(await crypto.subtle.digest(profile.preHash, tbsDer))

    // M' tail (after prefix + label + len(ctx) + ctx) must equal PH(TBS)
    const labelLen = profile.signatureLabel.length
    const phOffset = 32 + labelLen + 1 + 0
    const phInMprime = ml.captured.msg!.slice(phOffset, phOffset + expectedPH.length)
    expect(Array.from(phInMprime)).toEqual(Array.from(expectedPH))
  })
})
