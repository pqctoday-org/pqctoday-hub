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
import { ed25519 } from '@noble/curves/ed25519.js'
import { sha256, sha384, sha512 } from '@noble/hashes/sha2.js'
import {
  buildCompositeMessageRepresentative,
  COMPOSITE_PROFILE_MLDSA44_ECDSA_P256_SHA256,
  COMPOSITE_PROFILE_MLDSA44_ED25519_SHA512,
  COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256,
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512,
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P384_SHA512,
  COMPOSITE_PROFILE_MLDSA65_ED25519_SHA512,
  COMPOSITE_PROFILE_MLDSA65_RSA3072_PSS_SHA512,
  COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512,
  ML_DSA_44_OID_STR,
  ML_DSA_65_OID_STR,
  ML_DSA_87_OID_STR,
  type CompositeClassicalSpec,
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
  COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256, // .37
  COMPOSITE_PROFILE_MLDSA44_ED25519_SHA512, // .39  §10.4 recommended
  COMPOSITE_PROFILE_MLDSA44_ECDSA_P256_SHA256, // .40  §10.4 recommended
  COMPOSITE_PROFILE_MLDSA65_RSA3072_PSS_SHA512, // .41  §10.4 recommended
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512, // .45  §10.4 recommended
  COMPOSITE_PROFILE_MLDSA65_ED25519_SHA512, // .48  §10.4 recommended
  COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512, // .49  §10.4 recommended
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P384_SHA512, // .46  not §10.4 recommended
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
function tradDigest(hash: 'SHA-256' | 'SHA-384' | 'SHA-512', mprime: Uint8Array): Uint8Array {
  switch (hash) {
    case 'SHA-256':
      return sha256(mprime)
    case 'SHA-384':
      return sha384(mprime)
    case 'SHA-512':
      return sha512(mprime)
  }
}

/**
 * Bit length of a DER INTEGER's magnitude.
 *
 * ASN.1 INTEGER is signed, so a positive value whose top bit is set carries a
 * leading 0x00 pad byte — and an RSA modulus always has its top bit set, so the
 * pad is always there in practice. Counting it would report a 2048-bit modulus
 * as 2056 bits and fail every conformant certificate, so leading zeros are
 * stripped before counting.
 */
function integerBitLength(magnitude: Uint8Array): number {
  let i = 0
  while (i < magnitude.length && magnitude[i] === 0) i++
  if (i === magnitude.length) return 0
  return (magnitude.length - i - 1) * 8 + (32 - Math.clz32(magnitude[i]))
}

/** Read one DER TLV at `off`. Returns the tag, the value bytes, and the next offset. */
function readTlv(b: Uint8Array, off: number): { tag: number; value: Uint8Array; next: number } {
  if (off + 2 > b.length) throw new Error('truncated DER header')
  const tag = b[off]
  let len = b[off + 1]
  let p = off + 2
  if (len & 0x80) {
    const n = len & 0x7f
    if (n === 0 || n > 4) throw new Error('unsupported DER length form')
    if (p + n > b.length) throw new Error('truncated DER length')
    len = 0
    // Arithmetic, not `<< 8`: a 4-byte length with the top bit set would go
    // negative under JS bitwise ops and silently pass the bounds check below.
    for (let i = 0; i < n; i++) len = len * 256 + b[p + i]
    p += n
  }
  if (p + len > b.length) throw new Error('DER length overruns buffer')
  return { tag, value: b.subarray(p, p + len), next: p + len }
}

/**
 * Parse `RSAPublicKey ::= SEQUENCE { modulus INTEGER, publicExponent INTEGER }`
 * (RFC 8017 §A.1.1) — the encoding draft §4.1 uses for an RSA `tradPK`.
 *
 * Hand-rolled rather than via `@peculiar/asn1-rsa`, whose decorator-registered
 * schema does not survive this project's bundler ("Cannot get schema for
 * 'RSAPublicKey' target"). Two INTEGERs in a SEQUENCE is small enough to read
 * directly, and doing so keeps the caller's original DER bytes intact instead
 * of round-tripping them through a re-encoder.
 */
function parseRsaPublicKey(der: Uint8Array): { modulus: Uint8Array; exponent: Uint8Array } {
  const seq = readTlv(der, 0)
  if (seq.tag !== 0x30) throw new Error(`expected SEQUENCE (0x30), got 0x${seq.tag.toString(16)}`)
  if (seq.next !== der.length) throw new Error('trailing bytes after RSAPublicKey')
  const mod = readTlv(seq.value, 0)
  if (mod.tag !== 0x02) throw new Error('modulus is not an INTEGER')
  const exp = readTlv(seq.value, mod.next)
  if (exp.tag !== 0x02) throw new Error('publicExponent is not an INTEGER')
  if (exp.next !== seq.value.length) throw new Error('unexpected third field in RSAPublicKey')
  return { modulus: mod.value, exponent: exp.value }
}

/** DER definite-length encoding for a value of `len` bytes. */
function derLength(len: number): number[] {
  if (len < 0x80) return [len]
  const out: number[] = []
  for (let v = len; v > 0; v >>>= 8) out.unshift(v & 0xff)
  return [0x80 | out.length, ...out]
}

/**
 * rsaEncryption AlgorithmIdentifier with NULL parameters (RFC 8017 §A.1),
 * pre-encoded because it is a fixed 15-byte constant:
 *   SEQUENCE { OID 1.2.840.113549.1.1.1, NULL }
 */
const RSA_ENCRYPTION_ALGID_DER = new Uint8Array([
  0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00,
])

/**
 * Wrap a raw `RSAPublicKey` DER in a SubjectPublicKeyInfo so Web Crypto can
 * import it — `crypto.subtle.importKey` accepts 'spki', never a bare PKCS#1 key.
 *
 * The composite carries the PKCS#1 form per draft §4.1, so this wrapper exists
 * purely to bridge the two encodings; the key bytes pass through untouched.
 */
function wrapRsaPublicKeyInSpki(rsaPublicKeyDer: Uint8Array): Uint8Array {
  // BIT STRING with a leading 0x00 "unused bits" octet, per X.690 §8.6.2.2.
  const bitString = [0x03, ...derLength(rsaPublicKeyDer.length + 1), 0x00]
  const body = new Uint8Array(
    RSA_ENCRYPTION_ALGID_DER.length + bitString.length + rsaPublicKeyDer.length
  )
  body.set(RSA_ENCRYPTION_ALGID_DER, 0)
  body.set(bitString, RSA_ENCRYPTION_ALGID_DER.length)
  body.set(rsaPublicKeyDer, RSA_ENCRYPTION_ALGID_DER.length + bitString.length)

  const header = [0x30, ...derLength(body.length)]
  const out = new Uint8Array(header.length + body.length)
  out.set(header, 0)
  out.set(body, header.length)
  return out
}

/**
 * Verify the classical half against `mprime`.
 *
 * Dispatch is on the profile's `classical.kind` descriptor rather than on a
 * chain of composite-OID comparisons, so adding a §6 profile is a data change
 * in certBuilder and needs no edit here. The exhaustive switch means TypeScript
 * fails the build if a new classical family is added without a verifier arm —
 * which is the property that stops a profile from silently landing unverifiable.
 */
async function verifyClassical(
  spec: CompositeClassicalSpec,
  sig: Uint8Array,
  pub: Uint8Array,
  mprime: Uint8Array
): Promise<ComponentVerification> {
  const base = { bytes: sig.length, range: '' }
  try {
    switch (spec.kind) {
      /**
       * The hash here is the spec's `tradHash` (draft §6 "Traditional Signature
       * Algorithm"), NOT the pre-hash PH in the profile's name. For
       * id-MLDSA65-ECDSA-P256-SHA512 the traditional algorithm is
       * ecdsa-with-SHA256 — the ECDSA hash tracks the curve. Using PH here
       * instead produces a verifier that accepts only its own output and
       * rejects every conformant implementation.
       *
       * The signature is a DER Ecdsa-Sig-Value (RFC 3279 §2.2.3), not raw r||s.
       *
       * `lowS: false` is REQUIRED and deliberate. @noble/curves enforces low-S
       * (canonical) signatures by default — a signature-malleability convention
       * from Bitcoin/Ethereum. It is NOT a requirement of X.509, RFC 3279 or
       * FIPS 186: a high-S ECDSA signature is perfectly valid, and roughly half
       * of all signatures are high-S. Leaving the default in place silently
       * rejected ~50% of otherwise valid composite certificates from other
       * implementations. Caught 2026-08-18 by the draft's own
       * id-MLDSA87-ECDSA-P384-SHA512 vector, which happens to be high-S: our
       * Rust KMIP engine accepted it, this verifier did not, and the
       * disagreement between our own two implementations is what exposed it.
       */
      case 'ecdsa': {
        const algorithm = `ECDSA ${spec.curve} (${spec.tradHash})`
        // draft §4.1: "public key MUST be encoded as an uncompressed X9.62
        // [...] including the leading byte 0x04 indicating uncompressed", and
        // §3.3 step 2 makes a component key of the wrong type or length an
        // invalid signature rather than a parse error to shrug at.
        //
        // Note this is NOT the same situation as low-S: RFC 5480 would permit a
        // compressed point, but the composite draft explicitly forbids one, so
        // rejecting 33/49-byte keys is enforcing the spec, not over-reading it.
        if (pub.length !== spec.pubKeyBytes) {
          const compressed = pub.length === (spec.pubKeyBytes - 1) / 2 + 1
          return {
            ...base,
            algorithm,
            verified: false,
            detail:
              `Traditional public key is ${pub.length} B; draft §4.1 requires ${spec.pubKeyBytes} B ` +
              `for an uncompressed ${spec.curve} point (0x04 || X || Y)` +
              (compressed
                ? '. This looks like a COMPRESSED point — permitted by RFC 5480 in general, but forbidden here.'
                : '.'),
          }
        }
        if (pub[0] !== 0x04) {
          return {
            ...base,
            algorithm,
            verified: false,
            detail:
              `Traditional public key starts with 0x${pub[0].toString(16).padStart(2, '0')}; ` +
              `draft §4.1 requires the leading byte 0x04 indicating an uncompressed point.`,
          }
        }
        const curve = spec.curve === 'P-384' ? p384 : p256
        const digest = tradDigest(spec.tradHash, mprime)
        const ok = curve.verify(sig, digest, pub, { prehash: false, format: 'der', lowS: false })
        return { ...base, algorithm, verified: ok }
      }

      /**
       * Ed25519 is PureEdDSA (RFC 8032 §5.1.6): it takes the message itself,
       * not a digest, and hashes internally with SHA-512. So M' is passed
       * whole — pre-hashing it here would implement Ed25519ph, a different
       * algorithm that the draft does not specify for these profiles.
       *
       * Both the key and the signature are fixed-length raw byte strings
       * (RFC 8410), so unlike ECDSA and RSA the lengths are fully checkable.
       */
      case 'ed25519': {
        const algorithm = 'Ed25519'
        if (pub.length !== spec.pubKeyBytes) {
          return {
            ...base,
            algorithm,
            verified: false,
            detail: `Ed25519 public key is ${pub.length} B; RFC 8410 requires exactly ${spec.pubKeyBytes} B.`,
          }
        }
        if (sig.length !== spec.sigBytes) {
          return {
            ...base,
            algorithm,
            verified: false,
            detail: `Ed25519 signature is ${sig.length} B; RFC 8032 requires exactly ${spec.sigBytes} B.`,
          }
        }
        // @noble's default verification follows ZIP-215 rules, which are more
        // PERMISSIVE than a strict RFC 8032 reading (they accept non-canonical
        // point encodings and small-order points). That direction is deliberate
        // here, for the same reason `lowS: false` is set for ECDSA above:
        // rejecting a signature another conformant implementation considers
        // valid is the costlier failure, and the draft imposes no stricter
        // requirement than "Trad.Verify(tradPK, M', tradSig)".
        const ok = ed25519.verify(sig, mprime, pub)
        return { ...base, algorithm, verified: ok }
      }

      /**
       * RSASSA-PSS per draft §6.1 Table 2: SHA-256 for both the message digest
       * and MGF1, 32-byte salt, at 2048 and 3072 bits alike. Note that PH is
       * SHA-512 for the 3072-bit profile while PSS still uses SHA-256 — the
       * same PH-vs-traditional-hash trap as the ECDSA profiles.
       *
       * The traditional public key is a DER `RSAPublicKey` (RFC 8017 §A.1.1),
       * not an SPKI, so it is re-wrapped before import. Web Crypto is used
       * rather than @noble, which has no RSA.
       */
      case 'rsa-pss': {
        const algorithm = `RSA-${spec.modulusBits} PSS (${spec.tradHash})`

        let rsaPub: { modulus: Uint8Array; exponent: Uint8Array }
        try {
          rsaPub = parseRsaPublicKey(pub)
        } catch (e) {
          return {
            ...base,
            algorithm,
            verified: false,
            detail:
              `Traditional public key is not a parseable DER RSAPublicKey ` +
              `(RFC 8017 §A.1.1): ${e instanceof Error ? e.message : e}`,
          }
        }

        // draft §6 "RSA size" is normative, and §3.3 step 2 requires rejecting
        // a component key that is "not of the correct type or length". A cert
        // claiming .41 with a 2048-bit modulus is invalid — and unlike the
        // signature itself, this stays checkable in any environment.
        const bits = integerBitLength(rsaPub.modulus)
        if (bits !== spec.modulusBits) {
          return {
            ...base,
            algorithm,
            verified: false,
            detail:
              `RSA modulus is ${bits} bits; draft §6 fixes this profile at ${spec.modulusBits} bits. ` +
              `Per §3.3 step 2 a component key of the wrong length makes the composite signature invalid.`,
          }
        }

        // "the exponent is RECOMMENDED to be 65537. Implementations MAY support
        // only 65537 and reject other exponent values." RECOMMENDED, not
        // REQUIRED — so this is surfaced as a note and does not fail the cert.
        let exponent = 0n
        for (const byte of rsaPub.exponent) exponent = (exponent << 8n) | BigInt(byte)
        const exponentNote =
          exponent === BigInt(spec.recommendedExponent)
            ? undefined
            : `Public exponent is ${exponent}, not the RECOMMENDED ${spec.recommendedExponent} ` +
              `(draft §6). Valid, but some implementations reject it.`

        const key = await crypto.subtle.importKey(
          'spki',
          wrapRsaPublicKeyInSpki(pub) as BufferSource,
          { name: 'RSA-PSS', hash: spec.tradHash },
          false,
          ['verify']
        )
        const ok = await crypto.subtle.verify(
          { name: 'RSA-PSS', saltLength: spec.saltLength },
          key,
          sig as BufferSource,
          mprime as BufferSource
        )
        return { ...base, algorithm, verified: ok, detail: exponentNote }
      }

      default: {
        // Compile-time exhaustiveness: adding a classical family to
        // CompositeClassicalSpec without an arm above fails `tsc` here rather
        // than shipping a profile that silently cannot be verified.
        const unreachable: never = spec
        return {
          ...base,
          algorithm: 'unknown',
          verified: false,
          detail: `Unhandled classical family: ${JSON.stringify(unreachable)}`,
        }
      }
    }
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

  const classicalResult = await verifyClassical(
    profile.classical,
    classicalSig,
    classicalPub,
    mprime
  )
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
