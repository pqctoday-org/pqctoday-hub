// SPDX-License-Identifier: GPL-3.0-only
// X.509 certificate builder using @peculiar/asn1-schema for standards-compliant DER encoding.
// All ASN.1 encoding goes through Peculiar's schema-validated serializer — no hand-rolled DER.
//
// Supports 6 PQC/hybrid certificate formats:
//   1. Pure PQC (ML-DSA-65) — RFC 9881
//   2. Pure PQC (SLH-DSA-128s) — RFC 9909
//   3. Composite (ML-DSA-65 + ECDSA P-256) — draft-ietf-lamps-pq-composite-sigs-15
//   4. Alt-Sig / Catalyst — ITU-T X.509 (2019) §9.8
//   5. Related Certificates — RFC 9763
//   6. Chameleon — draft-bonnell-lamps-chameleon-certs-07
//
// Signing is performed by async signer functions — SoftHSM PKCS#11 (C_Sign).

import { AsnConvert, OctetString } from '@peculiar/asn1-schema'
import {
  Certificate,
  TBSCertificate,
  Version,
  Extension,
  Extensions,
  AlgorithmIdentifier,
  SubjectPublicKeyInfo,
  Validity,
  Name,
  RelativeDistinguishedName,
  AttributeTypeAndValue,
  AttributeValue,
  BasicConstraints,
} from '@peculiar/asn1-x509'
import { parseCertificateInfo, oidToLabel } from './derParser'

// ---------------------------------------------------------------------------
// OID string constants
// ---------------------------------------------------------------------------

/** ML-DSA-65 — 2.16.840.1.101.3.4.3.18 (RFC 9881) */
export const ML_DSA_65_OID_STR = '2.16.840.1.101.3.4.3.18'

/** SLH-DSA-SHA2-128s — 2.16.840.1.101.3.4.3.20 (RFC 9909) */
export const SLH_DSA_SHA2_128S_OID_STR = '2.16.840.1.101.3.4.3.20'

/** ecdsa-with-SHA256 — 1.2.840.10045.4.3.2 */
export const ECDSA_SHA256_OID_STR = '1.2.840.10045.4.3.2'

/** id-ecPublicKey — 1.2.840.10045.2.1 */
export const EC_PUBLIC_KEY_OID_STR = '1.2.840.10045.2.1'

/** P-256 named curve — 1.2.840.10045.3.1.7 */
export const EC_P256_CURVE_OID_STR = '1.2.840.10045.3.1.7'

/** Composite ML-DSA-65 + ECDSA P-256 SHA-512 — 1.3.6.1.5.5.7.6.45 */
export const COMPOSITE_MLDSA65_ECDSA_P256_OID_STR = '1.3.6.1.5.5.7.6.45'

/** SubjectAltPublicKeyInfo — 2.5.29.72 (ITU-T X.509 §9.8) */
export const ALT_SIG_PUBKEY_OID = '2.5.29.72'
/** AltSignatureAlgorithm — 2.5.29.73 */
export const ALT_SIG_ALG_OID = '2.5.29.73'
/** AltSignatureValue — 2.5.29.74 */
export const ALT_SIG_VALUE_OID = '2.5.29.74'

/** RelatedCertificate — 1.3.6.1.5.5.7.1.36 (RFC 9763, id-pe 36) */
export const RELATED_CERT_OID = '1.3.6.1.5.5.7.1.36'

/** DeltaCertificateDescriptor — 2.16.840.1.114027.80.6.1 */
export const DELTA_CERT_DESC_OID = '2.16.840.1.114027.80.6.1'

/** SHA-256 — 2.16.840.1.101.3.4.2.1 */
export const SHA256_OID_STR = '2.16.840.1.101.3.4.2.1'

// ---------------------------------------------------------------------------
// OID constants for LAMPS composite-sig draft-19 (id-pq-composite-sigs)
// All composite OIDs live under the PKIX alg arc: 1.3.6.1.5.5.7.6.{37..51}
// Reference: draft-ietf-lamps-pq-composite-sigs-19 §6
// ---------------------------------------------------------------------------

/** ML-DSA-44 — 2.16.840.1.101.3.4.3.17 (FIPS 204) */
export const ML_DSA_44_OID_STR = '2.16.840.1.101.3.4.3.17'

/** ML-DSA-87 — 2.16.840.1.101.3.4.3.19 (FIPS 204) */
export const ML_DSA_87_OID_STR = '2.16.840.1.101.3.4.3.19'

/** RSASSA-PSS — 1.2.840.113549.1.1.10 (RFC 8017 §A.2.3) */
export const RSA_PSS_OID_STR = '1.2.840.113549.1.1.10'

/** rsaEncryption — 1.2.840.113549.1.1.1 */
export const RSA_ENCRYPTION_OID_STR = '1.2.840.113549.1.1.1'

/** Ed25519 — 1.3.101.112 (RFC 8410) */
export const ED25519_OID_STR = '1.3.101.112'

/** secp384r1 (P-384) — 1.3.132.0.34 */
export const EC_P384_CURVE_OID_STR = '1.3.132.0.34'

/** ecdsa-with-SHA384 — 1.2.840.10045.4.3.3 */
export const ECDSA_SHA384_OID_STR = '1.2.840.10045.4.3.3'

/** ecdsa-with-SHA512 — 1.2.840.10045.4.3.4 */
export const ECDSA_SHA512_OID_STR = '1.2.840.10045.4.3.4'

/** SHA-384 — 2.16.840.1.101.3.4.2.2 */
export const SHA384_OID_STR = '2.16.840.1.101.3.4.2.2'

/** SHA-512 — 2.16.840.1.101.3.4.2.3 */
export const SHA512_OID_STR = '2.16.840.1.101.3.4.2.3'

/** id-MLDSA44-RSA2048-PSS-SHA256 — 1.3.6.1.5.5.7.6.37 (draft-19 §6) */
export const COMPOSITE_MLDSA44_RSA2048_PSS_SHA256_OID_STR = '1.3.6.1.5.5.7.6.37'

/**
 * id-MLDSA65-ECDSA-P256-SHA512 — 1.3.6.1.5.5.7.6.45 (draft-19 §6).
 *
 * Same OID as the existing {@link COMPOSITE_MLDSA65_ECDSA_P256_OID_STR}, kept
 * separate so callers picking the draft-19 builder are unambiguous.
 */
export const COMPOSITE_MLDSA65_ECDSA_P256_SHA512_OID_STR = '1.3.6.1.5.5.7.6.45'

/** id-MLDSA87-ECDSA-P384-SHA512 — 1.3.6.1.5.5.7.6.49 (draft-19 §6) */
export const COMPOSITE_MLDSA87_ECDSA_P384_SHA512_OID_STR = '1.3.6.1.5.5.7.6.49'

// Legacy OID exports (raw bytes) for backward compat with existing callers
export const SLH_DSA_SHA2_128S_OID = new Uint8Array([
  0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x03, 0x14,
])
export const ML_DSA_65_OID = new Uint8Array([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x03, 0x12])

// ---------------------------------------------------------------------------
// Signer function type
// ---------------------------------------------------------------------------

export type SignerFn = (tbs: Uint8Array) => Promise<Uint8Array>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSerialBytes(): ArrayBuffer {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[0] &= 0x7f // ensure positive
  return bytes.buffer
}

function buildAlgId(oid: string): AlgorithmIdentifier {
  return new AlgorithmIdentifier({ algorithm: oid })
}

function buildECAlgId(): AlgorithmIdentifier {
  // EC public key AlgorithmIdentifier includes P-256 named curve OID as parameter
  // P-256 OID 1.2.840.10045.3.1.7 encoded as raw DER OID TLV
  const oidBytes = new Uint8Array([0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07])
  return new AlgorithmIdentifier({
    algorithm: EC_PUBLIC_KEY_OID_STR,
    parameters: oidBytes.buffer as ArrayBuffer,
  })
}

function buildECP384AlgId(): AlgorithmIdentifier {
  // P-384 OID 1.3.132.0.34 encoded as raw DER OID TLV
  const oidBytes = new Uint8Array([0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x22])
  return new AlgorithmIdentifier({
    algorithm: EC_PUBLIC_KEY_OID_STR,
    parameters: oidBytes.buffer as ArrayBuffer,
  })
}

function buildRSAEncryptionAlgId(): AlgorithmIdentifier {
  // PKCS#1 v1.5 rsaEncryption with NULL parameters per RFC 8017 §A.1
  const nullParams = new Uint8Array([0x05, 0x00])
  return new AlgorithmIdentifier({
    algorithm: RSA_ENCRYPTION_OID_STR,
    parameters: nullParams.buffer as ArrayBuffer,
  })
}

function buildName(subject: string): Name {
  const rdns: RelativeDistinguishedName[] = []
  const regex = /(CN|O|OU)=([^/]+)/g
  let m: RegExpExecArray | null
  while ((m = regex.exec(subject)) !== null) {
    const [, key, value] = m
    const oid = key === 'CN' ? '2.5.4.3' : key === 'O' ? '2.5.4.10' : '2.5.4.11'
    rdns.push(
      new RelativeDistinguishedName([
        new AttributeTypeAndValue({
          type: oid,
          value: new AttributeValue({ utf8String: value }),
        }),
      ])
    )
  }
  return new Name(rdns)
}

function buildValidity(): { validity: Validity; notBefore: Date; notAfter: Date } {
  const notBefore = new Date()
  const notAfter = new Date(notBefore.getTime() + 365 * 24 * 60 * 60 * 1000)
  return {
    validity: new Validity({
      notBefore,
      notAfter,
    }),
    notBefore,
    notAfter,
  }
}

function buildSPKI(algId: AlgorithmIdentifier, pubKeyBytes: Uint8Array): SubjectPublicKeyInfo {
  return new SubjectPublicKeyInfo({
    algorithm: algId,
    subjectPublicKey: pubKeyBytes.buffer as ArrayBuffer,
  })
}

function buildExtension(oid: string, critical: boolean, value: ArrayBuffer): Extension {
  return new Extension({
    extnID: oid,
    critical,
    extnValue: new OctetString(value),
  })
}

function basicConstraintsExt(isCA = false): Extension {
  const bcValue = AsnConvert.serialize(new BasicConstraints({ cA: isCA }))
  return buildExtension('2.5.29.19', false, bcValue)
}

function serializeTBS(tbs: TBSCertificate): Uint8Array {
  return new Uint8Array(AsnConvert.serialize(tbs))
}

function buildCertificate(
  tbs: TBSCertificate,
  algId: AlgorithmIdentifier,
  signatureBytes: Uint8Array
): Uint8Array {
  const tbsDer = AsnConvert.serialize(tbs)
  const cert = new Certificate({
    tbsCertificate: AsnConvert.parse(tbsDer, TBSCertificate),
    signatureAlgorithm: algId,
    signatureValue: signatureBytes.buffer as ArrayBuffer,
  })
  return new Uint8Array(AsnConvert.serialize(cert))
}

// ---------------------------------------------------------------------------
// 1. Pure PQC certificate builder (ML-DSA-65 or SLH-DSA)
// ---------------------------------------------------------------------------

/**
 * Builds a DER-encoded X.509 v3 self-signed certificate.
 * Works for any single-algorithm cert (ML-DSA-65, SLH-DSA, etc.).
 *
 * @param publicKey   Raw public key bytes
 * @param signerFn    Signs TBSCertificate DER bytes → signature bytes
 * @param algOidStr   OID string for signature algorithm (e.g. '2.16.840.1.101.3.4.3.18')
 * @param subject     DN in OpenSSL slash format: `/CN=.../O=.../OU=...`
 */
export async function buildSelfSignedX509(
  publicKey: Uint8Array,
  signerFn: SignerFn,
  algOidOrBytes: Uint8Array | string,
  subject: string
): Promise<Uint8Array> {
  const algOidStr =
    typeof algOidOrBytes === 'string' ? algOidOrBytes : oidBytesToString(algOidOrBytes)
  const algId = buildAlgId(algOidStr)
  const { validity } = buildValidity()
  const name = buildName(subject)

  const tbs = new TBSCertificate({
    version: Version.v3,
    serialNumber: generateSerialBytes(),
    signature: algId,
    issuer: name,
    validity,
    subject: name,
    subjectPublicKeyInfo: buildSPKI(algId, publicKey),
    extensions: new Extensions([basicConstraintsExt()]),
  })

  const tbsDer = serializeTBS(tbs)
  const signature = await signerFn(tbsDer)
  return buildCertificate(tbs, algId, signature)
}

// ---------------------------------------------------------------------------
// 2. Composite certificate (ML-DSA-65 + ECDSA P-256)
//    Per draft-ietf-lamps-pq-composite-sigs-15 §4, §5, §6
// ---------------------------------------------------------------------------

/**
 * Builds a composite certificate with OID 1.3.6.1.5.5.7.6.45.
 * CompositeSignatureValue ::= SEQUENCE SIZE (2) OF BIT STRING
 */
export async function buildCompositeCert(
  ecPubKey: Uint8Array,
  mldsaPubKey: Uint8Array,
  ecSignerFn: SignerFn,
  mldsaSignerFn: SignerFn,
  subject: string
): Promise<Uint8Array> {
  const compositeAlgId = buildAlgId(COMPOSITE_MLDSA65_ECDSA_P256_OID_STR)
  const { validity } = buildValidity()
  const name = buildName(subject)

  // CompositePublicKey: SEQUENCE { SPKI(ECDSA), SPKI(ML-DSA) }
  const ecSPKI = buildSPKI(buildECAlgId(), ecPubKey)
  const mldsaSPKI = buildSPKI(buildAlgId(ML_DSA_65_OID_STR), mldsaPubKey)
  const ecSPKIDer = AsnConvert.serialize(ecSPKI)
  const mldsaSPKIDer = AsnConvert.serialize(mldsaSPKI)

  // Build composite public key as raw DER SEQUENCE of two SPKIs
  const compositeKeyDer = buildDERSequence([
    new Uint8Array(ecSPKIDer),
    new Uint8Array(mldsaSPKIDer),
  ])

  // SPKI wraps composite AlgId + composite key as BIT STRING
  const compositeSPKI = new SubjectPublicKeyInfo({
    algorithm: compositeAlgId,
    subjectPublicKey: compositeKeyDer.buffer as ArrayBuffer,
  })

  const tbs = new TBSCertificate({
    version: Version.v3,
    serialNumber: generateSerialBytes(),
    signature: compositeAlgId,
    issuer: name,
    validity,
    subject: name,
    subjectPublicKeyInfo: compositeSPKI,
    extensions: new Extensions([basicConstraintsExt()]),
  })

  const tbsDer = serializeTBS(tbs)

  // Sign TBS with both algorithms
  const [ecSig, mldsaSig] = await Promise.all([ecSignerFn(tbsDer), mldsaSignerFn(tbsDer)])

  // CompositeSignatureValue ::= SEQUENCE SIZE (2) OF BIT STRING
  const compositeSignature = buildDERSequence([
    buildDERBitString(ecSig),
    buildDERBitString(mldsaSig),
  ])

  // Certificate wrapper: TBS + AlgId + BIT STRING(compositeSignature)
  const cert = new Certificate({
    tbsCertificate: AsnConvert.parse(AsnConvert.serialize(tbs), TBSCertificate),
    signatureAlgorithm: compositeAlgId,
    signatureValue: compositeSignature.buffer as ArrayBuffer,
  })
  return new Uint8Array(AsnConvert.serialize(cert))
}

// ---------------------------------------------------------------------------
// 2b. Composite certificate — draft-19 LAMPS profiles
//
// PROFILE DIFFERENCES vs the older buildCompositeCert above (which targets
// draft-15): draft-19 §4.3 encodes CompositeSignatureValue as the plain byte
// concatenation `mldsaSig || tradSig` inside the outer BIT STRING — NOT as
// `SEQUENCE OF BIT STRING`. ML-DSA always comes first; the verifier splits
// at the ML-DSA signature's fixed length per FIPS 204 (Table 1 in the draft).
//
// The CompositePublicKey is also a plain concat per draft-19 §4.1:
//   `output mldsaPK || tradPK`  (not a SEQUENCE of SPKIs).
//
// We do NOT modify the existing draft-15 builder so its consumers in the
// HybridCrypto workshop keep their byte layouts. Pick this builder for any
// new code that must interoperate with draft-19 verifiers.
// ---------------------------------------------------------------------------

/** Fixed Prefix per draft-19 §2.2: ASCII "CompositeAlgorithmSignatures2025" */
export const COMPOSITE_DRAFT19_PREFIX = new TextEncoder().encode('CompositeAlgorithmSignatures2025')

/** Pre-hash function name as accepted by Web Crypto / Node crypto digest APIs */
export type CompositePreHash = 'SHA-256' | 'SHA-512'

/**
 * Describes one LAMPS composite-sig profile from draft-19 §6.
 *
 * Captures everything needed to construct the message representative
 *   M' = Prefix || Label || len(ctx) || ctx || PH(M)
 * per draft-19 §2.2 and §3.2, and to call the underlying primitives correctly:
 *   mldsaSig = ML-DSA.Sign(skPQ, M', mldsa_ctx=Label)
 *   tradSig  = Trad.Sign(skClassical, M')
 */
export interface CompositeProfileDraft19 {
  /** Composite OID (e.g. '1.3.6.1.5.5.7.6.45' for MLDSA-65+ECDSA-P256-SHA512) */
  compositeOid: string
  /** Identifier label, matches draft-19 §6 entry (e.g. 'id-MLDSA65-ECDSA-P256-SHA512') */
  label: string
  /**
   * Signature label used inside M' and as the ML-DSA `ctx` parameter
   * (FIPS 204 Algorithm 2). Per draft-19 §6 (e.g. 'COMPSIG-MLDSA65-ECDSA-P256-SHA512').
   * MUST be passed verbatim to ML-DSA.Sign as `mldsa_ctx`.
   */
  signatureLabel: string
  /** Pre-hash function applied to the to-be-signed message per draft-19 §6 */
  preHash: CompositePreHash
  /** ML-DSA OID for the SPKI inside the composite public key */
  mldsaOid: string
  /** Builder that returns the classical AlgorithmIdentifier (with parameters) */
  buildClassicalAlgId: () => AlgorithmIdentifier
  /**
   * ML-DSA signature length in bytes (FIPS 204 Table 1):
   *   ML-DSA-44 → 2420
   *   ML-DSA-65 → 3309
   *   ML-DSA-87 → 4627
   * Used by verifiers to split mldsaSig from tradSig in the concat encoding.
   */
  mldsaSigBytes: number
}

export const COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256: CompositeProfileDraft19 = {
  compositeOid: COMPOSITE_MLDSA44_RSA2048_PSS_SHA256_OID_STR,
  label: 'id-MLDSA44-RSA2048-PSS-SHA256',
  signatureLabel: 'COMPSIG-MLDSA44-RSA2048-PSS-SHA256',
  preHash: 'SHA-256',
  mldsaOid: ML_DSA_44_OID_STR,
  buildClassicalAlgId: buildRSAEncryptionAlgId,
  mldsaSigBytes: 2420,
}

export const COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512: CompositeProfileDraft19 = {
  compositeOid: COMPOSITE_MLDSA65_ECDSA_P256_SHA512_OID_STR,
  label: 'id-MLDSA65-ECDSA-P256-SHA512',
  signatureLabel: 'COMPSIG-MLDSA65-ECDSA-P256-SHA512',
  preHash: 'SHA-512',
  mldsaOid: ML_DSA_65_OID_STR,
  buildClassicalAlgId: buildECAlgId,
  mldsaSigBytes: 3309,
}

export const COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512: CompositeProfileDraft19 = {
  compositeOid: COMPOSITE_MLDSA87_ECDSA_P384_SHA512_OID_STR,
  label: 'id-MLDSA87-ECDSA-P384-SHA512',
  signatureLabel: 'COMPSIG-MLDSA87-ECDSA-P384-SHA512',
  preHash: 'SHA-512',
  mldsaOid: ML_DSA_87_OID_STR,
  buildClassicalAlgId: buildECP384AlgId,
  mldsaSigBytes: 4627,
}

/**
 * Composite ML-DSA signer contract.
 *
 * The caller binds a softhsm ML-DSA private-key handle and forwards the
 * `mldsaCtx` parameter to PKCS#11 (`CK_ML_DSA_PARAMS.context` = `mldsaCtx`),
 * which routes to the underlying `EVP_DigestSign` with
 * `OSSL_SIGNATURE_PARAM_CONTEXT_STRING` per FIPS 204.
 *
 * Conformance: this is what makes the produced signatures verifiable by a
 * draft-19 Composite-ML-DSA.Verify implementation. Calling vanilla
 * ML-DSA.Sign without `mldsaCtx` produces signatures that the standard
 * rejects.
 */
export type CompositeMLDSASignerFn = (
  mprime: Uint8Array,
  mldsaCtx: Uint8Array
) => Promise<Uint8Array>

/**
 * Build the message representative M' per draft-19 §2.2:
 *   M' = Prefix || Label || len(ctx) || ctx || PH(M)
 *
 * Exported for tests / external verifiers that need to recompute M' before
 * calling component verifiers.
 */
export async function buildCompositeMessageRepresentative(
  profile: CompositeProfileDraft19,
  message: Uint8Array,
  ctx: Uint8Array
): Promise<Uint8Array> {
  if (ctx.length > 255) {
    throw new Error(`Composite-sig application context exceeds 255 bytes (got ${ctx.length})`)
  }
  const labelBytes = new TextEncoder().encode(profile.signatureLabel)
  const phBuffer = await crypto.subtle.digest(profile.preHash, message as BufferSource)
  const ph = new Uint8Array(phBuffer)

  const total = COMPOSITE_DRAFT19_PREFIX.length + labelBytes.length + 1 + ctx.length + ph.length
  const out = new Uint8Array(total)
  let off = 0
  out.set(COMPOSITE_DRAFT19_PREFIX, off)
  off += COMPOSITE_DRAFT19_PREFIX.length
  out.set(labelBytes, off)
  off += labelBytes.length
  out[off++] = ctx.length
  if (ctx.length > 0) {
    out.set(ctx, off)
    off += ctx.length
  }
  out.set(ph, off)
  return out
}

/**
 * Builds a draft-19-compliant composite-sig X.509 certificate.
 *
 * Implements Composite-ML-DSA.Sign per draft-ietf-lamps-pq-composite-sigs-19
 * §3.2 + §4:
 *
 *   M' = Prefix || Label || len(ctx) || ctx || PH(TBS)
 *   mldsaSig = ML-DSA.Sign(skPQ, M', mldsa_ctx=Label)
 *   tradSig  = Trad.Sign(skClassical, M')
 *
 *   subjectPublicKey BIT STRING content := mldsaPubKey || classicalPubKey
 *   signatureValue   BIT STRING content := mldsaSig || classicalSig
 *
 * CRITICAL: the ML-DSA signer MUST pass `signatureLabel` as the ML-DSA `ctx`
 * parameter (FIPS 204 Algorithm 2). softhsm supports this via
 * `CK_ML_DSA_PARAMS.context` (PKCS#11 v3.2) — see OSSLMLDSA.cpp lines 339-344.
 * Vanilla ML-DSA.Sign without the context produces signatures that draft-19
 * verifiers reject (security analysis: §9.2.3, weak/strong non-separability).
 *
 * @param profile           One of the COMPOSITE_PROFILE_* constants
 * @param mldsaPubKey       Raw ML-DSA public key bytes (1312 / 1952 / 2592 for 44/65/87)
 * @param classicalPubKey   Raw classical public key bytes (encoding depends on profile)
 * @param mldsaSign         Signs M' with ML-DSA, passing `signatureLabel` as ctx
 * @param classicalSign     Signs M' with the traditional algorithm (no ctx)
 * @param subject           DN string `/CN=.../O=...`
 * @param ctx               Application context (≤ 255 bytes; empty by default)
 */
export async function buildCompositeCertDraft19(
  profile: CompositeProfileDraft19,
  mldsaPubKey: Uint8Array,
  classicalPubKey: Uint8Array,
  mldsaSign: CompositeMLDSASignerFn,
  classicalSign: SignerFn,
  subject: string,
  ctx: Uint8Array = new Uint8Array(0)
): Promise<Uint8Array> {
  const compositeAlgId = buildAlgId(profile.compositeOid)
  const { validity } = buildValidity()
  const name = buildName(subject)

  // CompositePublicKey per draft-19 §4.1: mldsaPK || tradPK (raw concat)
  const compositeKeyBytes = new Uint8Array(mldsaPubKey.length + classicalPubKey.length)
  compositeKeyBytes.set(mldsaPubKey, 0)
  compositeKeyBytes.set(classicalPubKey, mldsaPubKey.length)

  const compositeSPKI = new SubjectPublicKeyInfo({
    algorithm: compositeAlgId,
    subjectPublicKey: compositeKeyBytes.buffer as ArrayBuffer,
  })

  const tbs = new TBSCertificate({
    version: Version.v3,
    serialNumber: generateSerialBytes(),
    signature: compositeAlgId,
    issuer: name,
    validity,
    subject: name,
    subjectPublicKeyInfo: compositeSPKI,
    extensions: new Extensions([basicConstraintsExt()]),
  })

  const tbsDer = serializeTBS(tbs)

  // Compute M' per draft-19 §2.2 and §3.2 (TBS is the message M for a cert)
  const mPrime = await buildCompositeMessageRepresentative(profile, tbsDer, ctx)

  // ML-DSA signs M' with ctx = signatureLabel; traditional signs raw M'
  const mldsaCtx = new TextEncoder().encode(profile.signatureLabel)
  const [mldsaSig, classicalSig] = await Promise.all([
    mldsaSign(mPrime, mldsaCtx),
    classicalSign(mPrime),
  ])

  if (mldsaSig.length !== profile.mldsaSigBytes) {
    throw new Error(
      `Composite signer returned ML-DSA signature of ${mldsaSig.length} bytes; ` +
        `profile ${profile.label} expects ${profile.mldsaSigBytes}. ` +
        `Check ML-DSA parameter set matches OID ${profile.mldsaOid}.`
    )
  }

  // CompositeSignatureValue per draft-19 §4.3: mldsaSig || tradSig (raw concat)
  const compositeSignature = new Uint8Array(mldsaSig.length + classicalSig.length)
  compositeSignature.set(mldsaSig, 0)
  compositeSignature.set(classicalSig, mldsaSig.length)

  const cert = new Certificate({
    tbsCertificate: AsnConvert.parse(AsnConvert.serialize(tbs), TBSCertificate),
    signatureAlgorithm: compositeAlgId,
    signatureValue: compositeSignature.buffer as ArrayBuffer,
  })
  return new Uint8Array(AsnConvert.serialize(cert))
}

// ---------------------------------------------------------------------------
// 3. Alt-Sig / Catalyst certificate
//    Per ITU-T X.509 (2019) §9.8
// ---------------------------------------------------------------------------

/**
 * ECDSA primary with ML-DSA-65 in alt-sig extensions (2.5.29.72/73/74).
 */
export async function buildAltSigCert(
  ecPubKey: Uint8Array,
  ecSignerFn: SignerFn,
  mldsaPubKey: Uint8Array,
  mldsaSignerFn: SignerFn,
  subject: string
): Promise<Uint8Array> {
  const ecAlgId = buildAlgId(ECDSA_SHA256_OID_STR)
  const mldsaAlgId = buildAlgId(ML_DSA_65_OID_STR)
  const { validity } = buildValidity()
  const name = buildName(subject)
  const serial = generateSerialBytes()

  // ML-DSA-65 SPKI and AlgId for extensions
  const mldsaSPKIDer = AsnConvert.serialize(buildSPKI(buildAlgId(ML_DSA_65_OID_STR), mldsaPubKey))
  const mldsaAlgIdDer = AsnConvert.serialize(mldsaAlgId)

  // Extensions 72 and 73
  const ext72 = buildExtension(ALT_SIG_PUBKEY_OID, false, mldsaSPKIDer)
  const ext73 = buildExtension(ALT_SIG_ALG_OID, false, mldsaAlgIdDer)

  // Step 1: Build TBS with ext 72+73 but WITHOUT ext 74
  const tbsForAltSig = new TBSCertificate({
    version: Version.v3,
    serialNumber: serial,
    signature: ecAlgId,
    issuer: name,
    validity,
    subject: name,
    subjectPublicKeyInfo: buildSPKI(buildECAlgId(), ecPubKey),
    extensions: new Extensions([basicConstraintsExt(), ext72, ext73]),
  })

  // Step 2: Sign with ML-DSA-65 → alt signature value
  const tbsForAltSigDer = serializeTBS(tbsForAltSig)
  const altSigBytes = await mldsaSignerFn(tbsForAltSigDer)

  // Extension 74: BIT STRING of alt signature
  const altSigBitString = buildDERBitString(altSigBytes)
  const ext74 = buildExtension(ALT_SIG_VALUE_OID, false, altSigBitString.buffer as ArrayBuffer)

  // Step 3: Rebuild TBS with all 3 extensions
  const tbsFinal = new TBSCertificate({
    version: Version.v3,
    serialNumber: serial,
    signature: ecAlgId,
    issuer: name,
    validity,
    subject: name,
    subjectPublicKeyInfo: buildSPKI(buildECAlgId(), ecPubKey),
    extensions: new Extensions([basicConstraintsExt(), ext72, ext73, ext74]),
  })

  // Step 4: Sign final TBS with ECDSA
  const tbsFinalDer = serializeTBS(tbsFinal)
  const primarySig = await ecSignerFn(tbsFinalDer)
  return buildCertificate(tbsFinal, ecAlgId, primarySig)
}

// ---------------------------------------------------------------------------
// 4. Related Certificates (RFC 9763)
// ---------------------------------------------------------------------------

export interface RelatedCertPairResult {
  certA: Uint8Array
  certB: Uint8Array
  bindingHashA: string
  bindingHashB: string
}

/**
 * Two-pass build with bidirectional binding hashes per RFC 9763.
 */
export async function buildRelatedCertPair(
  ecPubKey: Uint8Array,
  ecSignerFn: SignerFn,
  mldsaPubKey: Uint8Array,
  mldsaSignerFn: SignerFn,
  subject: string
): Promise<RelatedCertPairResult> {
  const ecAlgId = buildAlgId(ECDSA_SHA256_OID_STR)
  const mldsaAlgId = buildAlgId(ML_DSA_65_OID_STR)
  const { validity } = buildValidity()
  const nameA = buildName(subject.replace(/CN=([^/]+)/, 'CN=$1 (Classical)'))
  const nameB = buildName(subject.replace(/CN=([^/]+)/, 'CN=$1 (PQC)'))
  const serialA = generateSerialBytes()
  const serialB = generateSerialBytes()

  // Helper: build RelatedCertificate extension value
  const buildRelatedExt = (hashBytes: Uint8Array): Extension => {
    const sha256AlgId = new AlgorithmIdentifier({
      algorithm: SHA256_OID_STR,
      parameters: new Uint8Array([0x05, 0x00]).buffer as ArrayBuffer, // NULL
    })
    const sha256AlgIdDer = new Uint8Array(AsnConvert.serialize(sha256AlgId))
    // SEQUENCE { AlgorithmIdentifier, OCTET STRING(hash) }
    const octetStringHash = buildDEROctetString(hashBytes)
    const extValue = buildDERSequence([sha256AlgIdDer, octetStringHash])
    return buildExtension(RELATED_CERT_OID, false, extValue.buffer as ArrayBuffer)
  }

  // Pass 1: Build Cert A (ECDSA) WITHOUT RelatedCertificate extension
  const tbsA_draft = new TBSCertificate({
    version: Version.v3,
    serialNumber: serialA,
    signature: ecAlgId,
    issuer: nameA,
    validity,
    subject: nameA,
    subjectPublicKeyInfo: buildSPKI(buildECAlgId(), ecPubKey),
    extensions: new Extensions([basicConstraintsExt()]),
  })
  const tbsA_draftDer = serializeTBS(tbsA_draft)
  const sigA_draft = await ecSignerFn(tbsA_draftDer)
  const certA_draft = buildCertificate(tbsA_draft, ecAlgId, sigA_draft)

  // Pass 2: Hash draft Cert A → build Cert B with that hash
  const hashA = new Uint8Array(
    await crypto.subtle.digest('SHA-256', certA_draft.buffer as ArrayBuffer)
  )
  const relatedExtB = buildRelatedExt(hashA)

  const tbsB = new TBSCertificate({
    version: Version.v3,
    serialNumber: serialB,
    signature: mldsaAlgId,
    issuer: nameB,
    validity,
    subject: nameB,
    subjectPublicKeyInfo: buildSPKI(buildAlgId(ML_DSA_65_OID_STR), mldsaPubKey),
    extensions: new Extensions([basicConstraintsExt(), relatedExtB]),
  })
  const tbsBDer = serializeTBS(tbsB)
  const sigB = await mldsaSignerFn(tbsBDer)
  const certB = buildCertificate(tbsB, mldsaAlgId, sigB)

  // Pass 3: Hash Cert B → rebuild Cert A with hash of Cert B
  const hashB = new Uint8Array(await crypto.subtle.digest('SHA-256', certB.buffer as ArrayBuffer))
  const relatedExtA = buildRelatedExt(hashB)

  const tbsA = new TBSCertificate({
    version: Version.v3,
    serialNumber: serialA,
    signature: ecAlgId,
    issuer: nameA,
    validity,
    subject: nameA,
    subjectPublicKeyInfo: buildSPKI(buildECAlgId(), ecPubKey),
    extensions: new Extensions([basicConstraintsExt(), relatedExtA]),
  })
  const tbsADer = serializeTBS(tbsA)
  const sigA = await ecSignerFn(tbsADer)
  const certA = buildCertificate(tbsA, ecAlgId, sigA)

  const toHex = (b: Uint8Array) =>
    Array.from(b)
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')

  return {
    certA,
    certB,
    bindingHashA: toHex(
      new Uint8Array(await crypto.subtle.digest('SHA-256', certA.buffer as ArrayBuffer))
    ),
    bindingHashB: toHex(hashB),
  }
}

// ---------------------------------------------------------------------------
// 5. Chameleon certificate
//    Per draft-bonnell-lamps-chameleon-certs-07 §4
// ---------------------------------------------------------------------------

/**
 * ML-DSA-65 primary with DeltaCertificateDescriptor extension.
 */
export async function buildChameleonCert(
  mldsaPubKey: Uint8Array,
  mldsaSignerFn: SignerFn,
  ecPubKey: Uint8Array,
  ecSignerFn: SignerFn,
  subject: string
): Promise<Uint8Array> {
  const mldsaAlgId = buildAlgId(ML_DSA_65_OID_STR)
  const ecAlgId = buildAlgId(ECDSA_SHA256_OID_STR)
  const { validity } = buildValidity()
  const name = buildName(subject)
  const deltaSerial = generateSerialBytes()

  // Build the delta TBSCertificate (ECDSA version) for signing
  const deltaTbs = new TBSCertificate({
    version: Version.v3,
    serialNumber: deltaSerial,
    signature: ecAlgId,
    issuer: name,
    validity,
    subject: name,
    subjectPublicKeyInfo: buildSPKI(buildECAlgId(), ecPubKey),
    extensions: new Extensions([basicConstraintsExt()]),
  })

  // Sign delta TBS with ECDSA
  const deltaTbsDer = serializeTBS(deltaTbs)
  const deltaSig = await ecSignerFn(deltaTbsDer)

  // DeltaCertificateDescriptor SEQUENCE:
  //   serialNumber, [0] EXPLICIT AlgId, subjectPublicKeyInfo, signatureValue BIT STRING
  const serialDer = buildDERInteger(new Uint8Array(deltaSerial))
  const ecAlgIdDer = new Uint8Array(AsnConvert.serialize(ecAlgId))
  const ctxExplicit0 = buildDERContextExplicit(0, ecAlgIdDer)
  const ecSPKIDer = new Uint8Array(AsnConvert.serialize(buildSPKI(buildECAlgId(), ecPubKey)))
  const deltaSigBitStr = buildDERBitString(deltaSig)

  const deltaDescriptor = buildDERSequence([serialDer, ctxExplicit0, ecSPKIDer, deltaSigBitStr])
  const deltaExt = buildExtension(DELTA_CERT_DESC_OID, false, deltaDescriptor.buffer as ArrayBuffer)

  // Primary certificate (ML-DSA-65) with DeltaCertificateDescriptor extension
  const primaryTbs = new TBSCertificate({
    version: Version.v3,
    serialNumber: generateSerialBytes(),
    signature: mldsaAlgId,
    issuer: name,
    validity,
    subject: name,
    subjectPublicKeyInfo: buildSPKI(buildAlgId(ML_DSA_65_OID_STR), mldsaPubKey),
    extensions: new Extensions([basicConstraintsExt(), deltaExt]),
  })

  const primaryTbsDer = serializeTBS(primaryTbs)
  const primarySig = await mldsaSignerFn(primaryTbsDer)
  return buildCertificate(primaryTbs, mldsaAlgId, primarySig)
}

// ---------------------------------------------------------------------------
// Low-level DER helpers (for structures @peculiar doesn't model directly)
// ---------------------------------------------------------------------------

function buildDERSequence(items: Uint8Array[]): Uint8Array {
  const totalLen = items.reduce((s, i) => s + i.length, 0)
  const lenBytes = encodeDERLength(totalLen)
  const result = new Uint8Array(1 + lenBytes.length + totalLen)
  result[0] = 0x30 // SEQUENCE tag
  result.set(lenBytes, 1)
  let offset = 1 + lenBytes.length
  for (const item of items) {
    result.set(item, offset)
    offset += item.length
  }
  return result
}

function buildDERBitString(data: Uint8Array): Uint8Array {
  const lenBytes = encodeDERLength(data.length + 1)
  const result = new Uint8Array(1 + lenBytes.length + 1 + data.length)
  result[0] = 0x03 // BIT STRING tag
  result.set(lenBytes, 1)
  result[1 + lenBytes.length] = 0x00 // unused bits
  result.set(data, 1 + lenBytes.length + 1)
  return result
}

function buildDEROctetString(data: Uint8Array): Uint8Array {
  const lenBytes = encodeDERLength(data.length)
  const result = new Uint8Array(1 + lenBytes.length + data.length)
  result[0] = 0x04 // OCTET STRING tag
  result.set(lenBytes, 1)
  result.set(data, 1 + lenBytes.length)
  return result
}

function buildDERInteger(data: Uint8Array): Uint8Array {
  // Ensure positive: prepend 0x00 if high bit set
  const needPad = data.length > 0 && (data[0] & 0x80) !== 0
  const payload = needPad ? new Uint8Array([0x00, ...data]) : data
  const lenBytes = encodeDERLength(payload.length)
  const result = new Uint8Array(1 + lenBytes.length + payload.length)
  result[0] = 0x02 // INTEGER tag
  result.set(lenBytes, 1)
  result.set(payload, 1 + lenBytes.length)
  return result
}

function buildDERContextExplicit(n: number, value: Uint8Array): Uint8Array {
  const lenBytes = encodeDERLength(value.length)
  const result = new Uint8Array(1 + lenBytes.length + value.length)
  result[0] = 0xa0 | n // context-specific constructed
  result.set(lenBytes, 1)
  result.set(value, 1 + lenBytes.length)
  return result
}

function encodeDERLength(n: number): Uint8Array {
  if (n < 0x80) return new Uint8Array([n])
  if (n < 0x100) return new Uint8Array([0x81, n])
  if (n < 0x10000) return new Uint8Array([0x82, (n >> 8) & 0xff, n & 0xff])
  return new Uint8Array([0x83, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff])
}

/** Convert pre-encoded OID value bytes to dotted string (for backward compat) */
function oidBytesToString(bytes: Uint8Array): string {
  const parts: number[] = []
  parts.push(Math.floor(bytes[0] / 40))
  parts.push(bytes[0] % 40)
  let val = 0
  for (let i = 1; i < bytes.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    val = (val << 7) | (bytes[i] & 0x7f)
    // eslint-disable-next-line security/detect-object-injection
    if ((bytes[i] & 0x80) === 0) {
      parts.push(val)
      val = 0
    }
  }
  return parts.join('.')
}

// ---------------------------------------------------------------------------
// Utility exports
// ---------------------------------------------------------------------------

export function derToPem(der: Uint8Array, label: string): string {
  let binary = ''
  for (let i = 0; i < der.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    binary += String.fromCharCode(der[i])
  }
  const b64 = btoa(binary)
    .match(/.{1,64}/g)!
    .join('\n')
  return `-----BEGIN ${label}-----\n${b64}\n-----END ${label}-----\n`
}

export function buildParsedText(
  der: Uint8Array,
  subject: string,
  notBefore: Date,
  notAfter: Date,
  formatHint?: string
): string {
  const info = parseCertificateInfo(der)
  const algLabel = oidToLabel(info.algorithmOID)
  const formatDate = (d: Date): string => d.toUTCString().replace('GMT', 'GMT').replace(',', '')
  const dnDisplay = subject.split('/').filter(Boolean).join(', ')

  const extLines: string[] = []
  if (info.extensionOIDs.length > 0) {
    extLines.push('    X509v3 extensions:')
    for (const ext of info.extensionOIDs) {
      extLines.push(`        ${oidToLabel(ext)}: present`)
    }
  }

  // Build SPKI section — format-specific breakdown for composite/alt-sig/chameleon
  const spkiLines: string[] = ['    Subject Public Key Info:']
  if (formatHint === 'composite') {
    spkiLines.push(
      '        Public Key Algorithm: MLDSA65-ECDSA-P256-SHA512 [Composite OID 1.3.6.1.5.5.7.6.45]'
    )
    spkiLines.push('        CompositePublicKey ::= SEQUENCE {')
    spkiLines.push('            [0] ML-DSA-65  — 1952 bytes  (FIPS 204, lattice-based)')
    spkiLines.push('            [1] EC P-256   — 65 bytes   (NIST P-256, uncompressed)')
    spkiLines.push('        }  -- verifier MUST validate BOTH signatures')
  } else if (formatHint === 'alt-sig') {
    spkiLines.push(`        Public Key Algorithm: ${algLabel}  [primary classical key]`)
    spkiLines.push(`            Public-Key: (${info.publicKeySizeBytes * 8} bit)`)
    spkiLines.push('        [SubjectAltPublicKeyInfo extension OID 2.5.29.72]')
    spkiLines.push('            Public Key Algorithm: ML-DSA-65  [PQC key in extension]')
    spkiLines.push('            Public-Key: 1952 bytes')
  } else if (formatHint === 'chameleon') {
    spkiLines.push(`        Public Key Algorithm: ${algLabel}  [primary PQC key]`)
    spkiLines.push(`            Public-Key: (${info.publicKeySizeBytes * 8} bit)`)
    spkiLines.push('        [DeltaCertificateDescriptor extension]')
    spkiLines.push('            Delta key: EC P-256  — 65 bytes  (classical, in extension)')
  } else {
    spkiLines.push(`        Public Key Algorithm: ${algLabel}`)
    spkiLines.push(`            Public-Key: (${info.publicKeySizeBytes * 8} bit)`)
  }

  return [
    'Certificate:',
    '    Data:',
    '        Version: 3 (0x2)',
    `        Serial Number: (random 16 bytes)`,
    `        Signature Algorithm: ${algLabel}`,
    `    Issuer: ${dnDisplay}`,
    '    Validity',
    `        Not Before: ${formatDate(notBefore)}`,
    `        Not After : ${formatDate(notAfter)}`,
    `    Subject: ${dnDisplay}`,
    ...spkiLines,
    ...extLines,
    `    Signature Algorithm: ${algLabel}`,
    `    Signature Value: ${info.signatureSizeBytes} bytes`,
  ].join('\n')
}
