// SPDX-License-Identifier: GPL-3.0-only
// Composite certificate VERIFIER — the counterpart to buildCompositeCertDraft19.
//
// Why this exists: the workshop mints composite certificates, but nothing in
// the module could check one. derParser walks X.509 structure and maps OIDs to
// labels; it performs no cryptography. HybridSignatureService verifies the
// signature-spectrum teaching models (concatenation / nesting / Silithium),
// which are NOT the X.509 composite format. So a learner could download a
// composite cert and had no way to confirm it was actually valid.
//
// This implements the verifier side of draft-ietf-lamps-pq-composite-sigs:
//
//   §4.1  composite public key := mldsaPK || tradPK   (ML-DSA FIRST)
//   §4.3  composite signature  := mldsaSig || tradSig (ML-DSA FIRST)
//   §5.1  both are carried RAW in the BIT STRING — no ASN.1 wrapper, and so
//         no internal length framing. A verifier therefore splits at the
//         ML-DSA component's FIXED length (FIPS 204) and nothing else.
//   §2.2  M' = Prefix || Label || len(ctx) || ctx || PH(M)
//         with ML-DSA taking the signature label as its FIPS 204 ctx.
//
// Both components MUST verify. If either fails the certificate is rejected —
// composite is an AND construction, never a fallback (this is exactly the
// property that makes composite NOT backward compatible).
import { AsnConvert } from '@peculiar/asn1-schema'
import { Certificate } from '@peculiar/asn1-x509'
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js'
import { p256, p384 } from '@noble/curves/nist.js'
import { sha256, sha384, sha512 } from '@noble/hashes/sha2.js'
import {
  buildCompositeMessageRepresentative,
  COMPOSITE_PROFILE_MLDSA44_ECDSA_P256_SHA256,
  COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256,
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512,
  COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512,
  ML_DSA_44_OID_STR,
  ML_DSA_65_OID_STR,
  ML_DSA_87_OID_STR,
  type CompositeProfileDraft19,
} from './certBuilder'

/** Outcome for one half of the composite. */
export interface ComponentVerification {
  /** Human label, e.g. 'ML-DSA-65' or 'ECDSA P-256 (SHA-512)' */
  algorithm: string
  /** Byte length of this component within the concatenation */
  bytes: number
  /** Byte range within the composite BIT STRING, for display */
  range: string
  /** true = cryptographically verified; false = failed; null = not checkable here */
  verified: boolean | null
  /** Why it failed, or why it could not be checked */
  detail?: string
}

export interface CompositeVerifyResult {
  /** Did the signatureAlgorithm OID map to a known composite profile? */
  recognized: boolean
  /** Composite OID found on the certificate */
  oid: string
  /** Profile label, e.g. 'id-MLDSA65-ECDSA-P256-SHA512' */
  profileLabel?: string
  /** AND of both components. false if either fails or cannot be checked. */
  valid: boolean
  mldsa?: ComponentVerification
  classical?: ComponentVerification
  /** Total composite public key / signature sizes actually observed */
  publicKeyBytes?: number
  signatureBytes?: number
  /** Structural or parsing problems */
  errors: string[]
}

const PROFILES: CompositeProfileDraft19[] = [
  COMPOSITE_PROFILE_MLDSA44_ECDSA_P256_SHA256,
  COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256,
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512,
  COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512,
]

/** Look up the draft profile for a composite signatureAlgorithm OID. */
export function findCompositeProfile(oid: string): CompositeProfileDraft19 | undefined {
  return PROFILES.find((p) => p.compositeOid === oid)
}

function mldsaImplFor(profile: CompositeProfileDraft19) {
  switch (profile.mldsaOid) {
    case ML_DSA_44_OID_STR:
      return { impl: ml_dsa44, name: 'ML-DSA-44' }
    case ML_DSA_65_OID_STR:
      return { impl: ml_dsa65, name: 'ML-DSA-65' }
    case ML_DSA_87_OID_STR:
      return { impl: ml_dsa87, name: 'ML-DSA-87' }
    default:
      return null
  }
}

/** Hash the message representative with the profile's TRADITIONAL hash. */
function tradDigest(profile: CompositeProfileDraft19, mprime: Uint8Array): Uint8Array {
  switch (profile.tradHash) {
    case 'SHA-256':
      return sha256(mprime)
    case 'SHA-384':
      return sha384(mprime)
    case 'SHA-512':
      return sha512(mprime)
  }
}

/**
 * Verify the classical half.
 *
 * The hash here is the profile's `tradHash` (draft §6 "Traditional Signature
 * Algorithm"), NOT the pre-hash PH in the profile's name. For
 * id-MLDSA65-ECDSA-P256-SHA512 the traditional algorithm is ecdsa-with-SHA256
 * — the ECDSA hash tracks the curve. Using PH here instead produces a verifier
 * that accepts only its own output and rejects every conformant implementation.
 *
 * The signature is a DER Ecdsa-Sig-Value (RFC 3279 §2.2.3), not raw r||s.
 *
 * `lowS: false` is REQUIRED and deliberate. @noble/curves enforces low-S
 * (canonical) signatures by default — a signature-malleability convention from
 * Bitcoin/Ethereum. It is NOT a requirement of X.509, RFC 3279 or FIPS 186: a
 * high-S ECDSA signature is perfectly valid, and roughly half of all signatures
 * are high-S. Leaving the default in place silently rejected ~50% of otherwise
 * valid composite certificates from other implementations. Caught 2026-08-18 by
 * the draft's own id-MLDSA87-ECDSA-P384-SHA512 vector, which happens to be
 * high-S: our Rust KMIP engine accepted it, this verifier did not, and the
 * disagreement between our own two implementations is what exposed it.
 */
function verifyClassical(
  profile: CompositeProfileDraft19,
  sig: Uint8Array,
  pub: Uint8Array,
  mprime: Uint8Array
): ComponentVerification {
  const base = { bytes: sig.length, range: '' }
  try {
    const digest = tradDigest(profile, mprime)
    if (
      profile.compositeOid === COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512.compositeOid ||
      profile.compositeOid === COMPOSITE_PROFILE_MLDSA44_ECDSA_P256_SHA256.compositeOid
    ) {
      const ok = p256.verify(sig, digest, pub, { prehash: false, format: 'der', lowS: false })
      return { ...base, algorithm: `ECDSA P-256 (${profile.tradHash})`, verified: ok }
    }
    if (profile.compositeOid === COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512.compositeOid) {
      const ok = p384.verify(sig, digest, pub, { prehash: false, format: 'der', lowS: false })
      return { ...base, algorithm: `ECDSA P-384 (${profile.tradHash})`, verified: ok }
    }
    if (profile.compositeOid === COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256.compositeOid) {
      // Deliberately NOT verified rather than silently passed: RSA-PSS is not
      // implemented in the @noble stack this module uses. Reporting null keeps
      // the overall verdict false, which is the safe direction.
      return {
        ...base,
        algorithm: 'RSA-2048 PSS (SHA-256)',
        verified: null,
        detail: 'RSA-PSS verification is not implemented in this workshop build.',
      }
    }
    return { ...base, algorithm: 'unknown', verified: null, detail: 'Unsupported profile.' }
  } catch (e) {
    return {
      ...base,
      algorithm: 'classical',
      verified: false,
      detail: e instanceof Error ? e.message : 'classical verification threw',
    }
  }
}

/**
 * Verify a composite certificate's self-signature.
 *
 * Self-signed only: the composite public key inside the certificate is used to
 * check the signature on it. That is what the workshop mints; a CA-issued
 * composite cert would need the issuer's key instead.
 */
export async function verifyCompositeCert(der: Uint8Array): Promise<CompositeVerifyResult> {
  const errors: string[] = []
  let cert: Certificate
  try {
    cert = AsnConvert.parse(der, Certificate)
  } catch (e) {
    return {
      recognized: false,
      oid: '',
      valid: false,
      errors: [`Not a parseable X.509 certificate: ${e instanceof Error ? e.message : e}`],
    }
  }

  const oid = cert.signatureAlgorithm.algorithm
  const profile = findCompositeProfile(oid)
  if (!profile) {
    return {
      recognized: false,
      oid,
      valid: false,
      errors: [`signatureAlgorithm ${oid} is not a known composite profile.`],
    }
  }

  const spk = new Uint8Array(cert.tbsCertificate.subjectPublicKeyInfo.subjectPublicKey)
  const sig = new Uint8Array(cert.signatureValue)

  // §4.1 / §4.3 — split at the ML-DSA component's fixed length.
  if (spk.length <= profile.mldsaPubKeyBytes) {
    errors.push(
      `Composite public key is ${spk.length} B; expected more than ${profile.mldsaPubKeyBytes} B ` +
        `(ML-DSA component) plus a classical component.`
    )
  }
  if (sig.length <= profile.mldsaSigBytes) {
    errors.push(
      `Composite signature is ${sig.length} B; expected more than ${profile.mldsaSigBytes} B ` +
        `(ML-DSA component) plus a classical component.`
    )
  }
  if (errors.length) {
    return { recognized: true, oid, profileLabel: profile.label, valid: false, errors }
  }

  const mldsaPub = spk.slice(0, profile.mldsaPubKeyBytes)
  const classicalPub = spk.slice(profile.mldsaPubKeyBytes)
  const mldsaSig = sig.slice(0, profile.mldsaSigBytes)
  const classicalSig = sig.slice(profile.mldsaSigBytes)

  // §2.2 — recompute the shared message representative over the TBS.
  const tbsDer = new Uint8Array(AsnConvert.serialize(cert.tbsCertificate))
  const mprime = await buildCompositeMessageRepresentative(profile, tbsDer, new Uint8Array(0))

  // ML-DSA half — the signature label MUST be supplied as the FIPS 204 ctx, or
  // a conformant signature fails to verify (draft §9.2.3 non-separability).
  const impl = mldsaImplFor(profile)
  let mldsaResult: ComponentVerification
  if (!impl) {
    mldsaResult = {
      algorithm: 'ML-DSA',
      bytes: mldsaSig.length,
      range: `[0..${profile.mldsaSigBytes - 1}]`,
      verified: null,
      detail: `Unknown ML-DSA OID ${profile.mldsaOid}.`,
    }
  } else {
    const ctx = new TextEncoder().encode(profile.signatureLabel)
    let ok = false
    let detail: string | undefined
    try {
      ok = impl.impl.verify(mldsaSig, mprime, mldsaPub, { context: ctx })
    } catch (e) {
      detail = e instanceof Error ? e.message : 'ML-DSA verification threw'
    }
    mldsaResult = {
      algorithm: impl.name,
      bytes: mldsaSig.length,
      range: `[0..${profile.mldsaSigBytes - 1}]`,
      verified: detail ? false : ok,
      detail,
    }
  }

  const classicalResult = verifyClassical(profile, classicalSig, classicalPub, mprime)
  classicalResult.range = `[${profile.mldsaSigBytes}..${sig.length - 1}]`

  return {
    recognized: true,
    oid,
    profileLabel: profile.label,
    // AND construction: both must verify. null (not checkable) is not a pass.
    valid: mldsaResult.verified === true && classicalResult.verified === true,
    mldsa: mldsaResult,
    classical: classicalResult,
    publicKeyBytes: spk.length,
    signatureBytes: sig.length,
    errors,
  }
}
