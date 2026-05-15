// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { AsnConvert } from '@peculiar/asn1-schema'
import { Certificate, TBSCertificate } from '@peculiar/asn1-x509'
import {
  buildCompositeCertDraft19,
  COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256,
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512,
  COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512,
  type CompositeProfileDraft19,
} from './certBuilder'

/**
 * Fake signer factory: returns a SignerFn that ignores the TBS and emits a
 * fixed-length buffer filled with `fill`. Used to make sig sizes predictable
 * so we can assert the concat split in the composite signature value.
 */
function fakeSigner(length: number, fill: number) {
  return async (tbs: Uint8Array): Promise<Uint8Array> => {
    void tbs
    const out = new Uint8Array(length)
    out.fill(fill)
    return out
  }
}

interface ProfileCase {
  name: string
  profile: CompositeProfileDraft19
  classicalSigBytes: number
  mldsaPubKeyBytes: number
  classicalPubKeyBytes: number
}

const CASES: ProfileCase[] = [
  {
    name: 'MLDSA44 + RSA2048-PSS-SHA256',
    profile: COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256,
    classicalSigBytes: 256, // RSA-2048 PSS signature
    mldsaPubKeyBytes: 1312, // ML-DSA-44 pubkey
    classicalPubKeyBytes: 270, // approx DER-encoded RSA-2048 pubkey
  },
  {
    name: 'MLDSA65 + ECDSA-P256-SHA512',
    profile: COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512,
    classicalSigBytes: 72, // worst-case DER ECDSA-P256 signature
    mldsaPubKeyBytes: 1952, // ML-DSA-65 pubkey
    classicalPubKeyBytes: 65, // uncompressed P-256 pubkey (0x04 + X + Y)
  },
  {
    name: 'MLDSA87 + ECDSA-P384-SHA512',
    profile: COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512,
    classicalSigBytes: 104, // worst-case DER ECDSA-P384 signature
    mldsaPubKeyBytes: 2592, // ML-DSA-87 pubkey
    classicalPubKeyBytes: 97, // uncompressed P-384 pubkey
  },
]

describe('buildCompositeCertDraft19', () => {
  it.each(CASES)(
    'produces a parseable X.509 cert with the right composite OID — $name',
    async ({ profile, classicalSigBytes, mldsaPubKeyBytes, classicalPubKeyBytes }) => {
      const mldsaPub = new Uint8Array(mldsaPubKeyBytes).fill(0xaa)
      const classicalPub = new Uint8Array(classicalPubKeyBytes).fill(0xbb)
      const mldsaSigner = fakeSigner(profile.mldsaSigBytes, 0x11)
      const classicalSigner = fakeSigner(classicalSigBytes, 0x22)

      const certDer = await buildCompositeCertDraft19(
        profile,
        mldsaPub,
        classicalPub,
        mldsaSigner,
        classicalSigner,
        '/CN=test-composite/O=pqctoday'
      )

      const cert = AsnConvert.parse(certDer.buffer as ArrayBuffer, Certificate)

      // Composite OID must appear in both signatureAlgorithm and TBS.signature
      expect(cert.signatureAlgorithm.algorithm).toBe(profile.compositeOid)
      const tbs = cert.tbsCertificate
      expect(tbs.signature.algorithm).toBe(profile.compositeOid)
      expect(tbs.subjectPublicKeyInfo.algorithm.algorithm).toBe(profile.compositeOid)
    }
  )

  it.each(CASES)(
    'encodes the composite signature as `mldsaSig || classicalSig` per draft-19 §4.3 — $name',
    async ({ profile, classicalSigBytes, mldsaPubKeyBytes, classicalPubKeyBytes }) => {
      const mldsaPub = new Uint8Array(mldsaPubKeyBytes).fill(0xaa)
      const classicalPub = new Uint8Array(classicalPubKeyBytes).fill(0xbb)
      const mldsaSigner = fakeSigner(profile.mldsaSigBytes, 0x11)
      const classicalSigner = fakeSigner(classicalSigBytes, 0x22)

      const certDer = await buildCompositeCertDraft19(
        profile,
        mldsaPub,
        classicalPub,
        mldsaSigner,
        classicalSigner,
        '/CN=test/O=pqctoday'
      )

      const cert = AsnConvert.parse(certDer.buffer as ArrayBuffer, Certificate)
      const sigBytes = new Uint8Array(cert.signatureValue)

      expect(sigBytes.length).toBe(profile.mldsaSigBytes + classicalSigBytes)
      // First mldsaSigBytes bytes must be the ML-DSA signature (filled 0x11)
      const mldsaPart = sigBytes.slice(0, profile.mldsaSigBytes)
      expect(mldsaPart.every((b) => b === 0x11)).toBe(true)
      // Remaining bytes must be the classical signature (filled 0x22)
      const classicalPart = sigBytes.slice(profile.mldsaSigBytes)
      expect(classicalPart.length).toBe(classicalSigBytes)
      expect(classicalPart.every((b) => b === 0x22)).toBe(true)
    }
  )

  it.each(CASES)(
    'encodes the composite public key as `mldsaPK || classicalPK` per draft-19 §4.1 — $name',
    async ({ profile, classicalSigBytes, mldsaPubKeyBytes, classicalPubKeyBytes }) => {
      const mldsaPub = new Uint8Array(mldsaPubKeyBytes).fill(0xaa)
      const classicalPub = new Uint8Array(classicalPubKeyBytes).fill(0xbb)
      const mldsaSigner = fakeSigner(profile.mldsaSigBytes, 0x11)
      const classicalSigner = fakeSigner(classicalSigBytes, 0x22)

      const certDer = await buildCompositeCertDraft19(
        profile,
        mldsaPub,
        classicalPub,
        mldsaSigner,
        classicalSigner,
        '/CN=test/O=pqctoday'
      )

      const cert = AsnConvert.parse(certDer.buffer as ArrayBuffer, Certificate)
      const spkiBytes = new Uint8Array(cert.tbsCertificate.subjectPublicKeyInfo.subjectPublicKey)
      expect(spkiBytes.length).toBe(mldsaPubKeyBytes + classicalPubKeyBytes)
      const mldsaPart = spkiBytes.slice(0, mldsaPubKeyBytes)
      expect(mldsaPart.every((b) => b === 0xaa)).toBe(true)
      const classicalPart = spkiBytes.slice(mldsaPubKeyBytes)
      expect(classicalPart.every((b) => b === 0xbb)).toBe(true)
    }
  )

  it('rejects an ML-DSA signature whose length does not match the profile', async () => {
    const profile = COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512
    const wrongMldsaSigner = fakeSigner(profile.mldsaSigBytes - 1, 0x11)
    const classicalSigner = fakeSigner(72, 0x22)

    await expect(
      buildCompositeCertDraft19(
        profile,
        new Uint8Array(1952).fill(0xaa),
        new Uint8Array(65).fill(0xbb),
        wrongMldsaSigner,
        classicalSigner,
        '/CN=test/O=pqctoday'
      )
    ).rejects.toThrow(/ML-DSA signature of \d+ bytes/)
  })

  it('produces a TBSCertificate parseable as a standalone DER blob', async () => {
    const profile = COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512
    const certDer = await buildCompositeCertDraft19(
      profile,
      new Uint8Array(1952).fill(0xaa),
      new Uint8Array(65).fill(0xbb),
      fakeSigner(profile.mldsaSigBytes, 0x11),
      fakeSigner(72, 0x22),
      '/CN=foo/O=pqctoday'
    )
    const cert = AsnConvert.parse(certDer.buffer as ArrayBuffer, Certificate)
    const tbsDer = AsnConvert.serialize(cert.tbsCertificate)
    // Round-trip TBS to confirm it's a self-contained DER structure
    const reparsed = AsnConvert.parse(tbsDer, TBSCertificate)
    expect(reparsed.subjectPublicKeyInfo.algorithm.algorithm).toBe(profile.compositeOid)
  })
})
