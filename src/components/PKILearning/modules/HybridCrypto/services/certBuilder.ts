// SPDX-License-Identifier: GPL-3.0-only
// X.509 certificate builder using @peculiar/asn1-schema for standards-compliant DER encoding.
// All ASN.1 encoding goes through Peculiar's schema-validated serializer — no hand-rolled DER.
//
// Supports the workshop's certificate formats:
//   1. Pure PQC (ML-DSA-65) — RFC 9881, CA-issued end entity
//   2. Pure PQC (SLH-DSA-128s) — RFC 9909, CA-issued end entity
//   3. Composite (ML-DSA + classical) — draft-ietf-lamps-pq-composite-sigs-19
//   4. Alt-Sig / Catalyst — ITU-T X.509 (10/2019) §7.2.2, §9.8
//   5. Related Certificates — RFC 9763 (new Cert B references existing Cert A)
//   6. Pure PQC KEM (ML-KEM-768) — RFC 9935, CA-issued end entity
//   7. Composite KEM (ML-KEM-768 + X25519) — draft-ietf-lamps-pq-composite-kem-21
//   Historical: Chameleon — draft-bonnell-lamps-chameleon-certs-07 (EXPIRED)
//
// Signing is performed by async signer functions — SoftHSM PKCS#11 (C_Sign).
//
// ⚠️  DO NOT build composite structures from `@peculiar/asn1-x509-post-quantum`.
//     It is an installed dependency and ships invitingly-named classes
//     (CompositePublicKey, CompositeSignatureValue, CompositeAlgorithmIdentifier),
//     but it implements the ABANDONED draft-02-era composite format:
//       · id_alg_composite = 1.3.6.1.4.1.18227.2.1 — the OpenCA PRIVATE
//         ENTERPRISE arc, not the PKIX arc the draft now uses (1.3.6.1.5.5.7.6.x)
//       · CompositeSignatureValue ::= SEQUENCE SIZE (2..MAX) OF BIT STRING —
//         the ASN.1-wrapped layout the draft dropped at -06; the current
//         serialization is a RAW CONCATENATION, ML-DSA component first
//       · id_Dilithium3_ECDSA_P256 — pre-standardization naming (now ML-DSA-65)
//     Nothing imports it today (it appears only in the About-page SBOM list).
//     Reaching for it would silently reintroduce the exact wire-format defect
//     this module was corrected for on 2026-08-17 — and it would look more
//     authoritative in review than the hand-assembled structures below, not
//     less. That is why the composite key/signature bytes are assembled here.
//     Surveyed 2026-08-17: no third-party library available to this project
//     implements the CURRENT composite format — not OpenSSL 3.6.3 or 4.x
//     (zero composite algorithms registered), not @oqs/liboqs-js (no composite
//     concept), not @peculiar/x509 (does not know the PKIX composite OIDs).
//     The only independent implementation that agrees with this file is the
//     Rust KMIP engine — see compositeVerifier.ts for the parity proof.

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
  KeyUsage,
  KeyUsageFlags,
  SubjectKeyIdentifier,
  AuthorityKeyIdentifier,
  KeyIdentifier,
} from '@peculiar/asn1-x509'
import { parseCertificateInfo, oidToLabel } from './derParser'
import { canonicalPositiveInteger } from '@/utils/derInteger'
import {
  altSignatureInput,
  parseCertificate,
  readBasicConstraints,
  readKeyUsage,
  verifyWithSpki,
  type KeyUsageBit,
} from './certVerifier'

// ---------------------------------------------------------------------------
// OID string constants
// ---------------------------------------------------------------------------

/** ML-DSA-65 — 2.16.840.1.101.3.4.3.18 (RFC 9881) */
export const ML_DSA_65_OID_STR = '2.16.840.1.101.3.4.3.18'

/** id-MLKEM768-X25519-SHA3-256 — 1.3.6.1.5.5.7.6.58 (draft-ietf-lamps-pq-composite-kem-21). Re-verified 2026-09-30 against the -21 text (allocated block 1.3.6.1.5.5.7.6.55–.66). Not X-Wing: this is the LAMPS composite construction with its own combiner. */
export const COMPOSITE_KEM_MLKEM768_X25519_OID_STR = '1.3.6.1.5.5.7.6.58'

/** id-MLKEM768-ECDH-P256-SHA3-256 — 1.3.6.1.5.5.7.6.59 (draft-ietf-lamps-pq-composite-kem §6; unchanged -17→-19) */
export const COMPOSITE_KEM_MLKEM768_SECP256R1_OID_STR = '1.3.6.1.5.5.7.6.59'

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
// Reference: draft-ietf-lamps-pq-composite-sigs §6
// ---------------------------------------------------------------------------

/** ML-DSA-44 — 2.16.840.1.101.3.4.3.17 (FIPS 204) */
export const ML_DSA_44_OID_STR = '2.16.840.1.101.3.4.3.17'

/** ML-DSA-87 — 2.16.840.1.101.3.4.3.19 (FIPS 204) */
export const ML_DSA_87_OID_STR = '2.16.840.1.101.3.4.3.19'

/**
 * ML-DSA-65 public key length in bytes (FIPS 204 Table 2).
 * Fixed-length: this is the offset a composite verifier splits at, since the
 * composite concatenation carries no internal length framing.
 */
export const ML_DSA_65_PUBKEY_BYTES = 1952

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

/**
 * id-MLDSA65-ECDSA-P384-SHA512 — 1.3.6.1.5.5.7.6.46 (draft-19 §6).
 *
 * Added 2026-08-18 alongside the matching KMIP engine profile (composite/
 * hybrid remediation plan's Gap 3) — the one profile in the engine's
 * §6 set that had no hub-side counterpart either, closing the last
 * mismatch between the two.
 */
export const COMPOSITE_MLDSA65_ECDSA_P384_SHA512_OID_STR = '1.3.6.1.5.5.7.6.46'

/** id-MLDSA44-Ed25519-SHA512 — 1.3.6.1.5.5.7.6.39 (draft-19 §6) */
export const COMPOSITE_MLDSA44_ED25519_SHA512_OID_STR = '1.3.6.1.5.5.7.6.39'

/** id-MLDSA65-RSA3072-PSS-SHA512 — 1.3.6.1.5.5.7.6.41 (draft-19 §6) */
export const COMPOSITE_MLDSA65_RSA3072_PSS_SHA512_OID_STR = '1.3.6.1.5.5.7.6.41'

/** id-MLDSA65-Ed25519-SHA512 — 1.3.6.1.5.5.7.6.48 (draft-19 §6) */
export const COMPOSITE_MLDSA65_ED25519_SHA512_OID_STR = '1.3.6.1.5.5.7.6.48'

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
  return canonicalPositiveInteger(bytes).buffer as ArrayBuffer
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

function buildEd25519AlgId(): AlgorithmIdentifier {
  // RFC 8410 §3: the parameters field MUST be absent for id-Ed25519 — not
  // NULL. Encoding NULL here would produce an AlgorithmIdentifier that
  // conformant parsers reject.
  return new AlgorithmIdentifier({ algorithm: ED25519_OID_STR })
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

function basicConstraintsExt(isCA = false, critical = false): Extension {
  const bcValue = AsnConvert.serialize(new BasicConstraints({ cA: isCA }))
  return buildExtension('2.5.29.19', critical, bcValue)
}

/** keyUsage, always critical (RFC 5280 §4.2.1.3: conforming CAs SHOULD mark it critical). */
function keyUsageExt(bits: KeyUsageBit[]): Extension {
  const flags = bits.reduce((acc, b) => acc | KeyUsageFlags[b], 0)
  return buildExtension('2.5.29.15', true, AsnConvert.serialize(new KeyUsage(flags)))
}

/**
 * Key identifier per RFC 7093 §2 method 1: the leftmost 160 bits of the
 * SHA-256 hash of the subjectPublicKey BIT STRING value.
 */
export async function computeKeyIdentifier(subjectPublicKey: Uint8Array): Promise<Uint8Array> {
  const h = await crypto.subtle.digest('SHA-256', subjectPublicKey as BufferSource)
  return new Uint8Array(h).slice(0, 20)
}

function subjectKeyIdExt(keyId: Uint8Array): Extension {
  const ski = new SubjectKeyIdentifier(keyId.buffer as ArrayBuffer)
  return buildExtension('2.5.29.14', false, AsnConvert.serialize(ski))
}

function authorityKeyIdExt(keyId: Uint8Array): Extension {
  const aki = new AuthorityKeyIdentifier({
    keyIdentifier: new KeyIdentifier(keyId.buffer as ArrayBuffer),
  })
  return buildExtension('2.5.29.35', false, AsnConvert.serialize(aki))
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
// CA issuance — the workshop CA and every certificate it issues
// ---------------------------------------------------------------------------

/** What a CA needs to issue a certificate. */
export interface CertIssuer {
  /** The issuer's own certificate, DER */
  certDer: Uint8Array
  /** Issuer DN in OpenSSL slash format */
  subject: string
  /** Signature algorithm OID the issuer key produces */
  signatureOid: string
  /** Signs TBSCertificate DER with the issuer's private key */
  signerFn: SignerFn
  /** The issuer's subjectKeyIdentifier, copied into the AKI of what it issues */
  keyId: Uint8Array
}

export interface IssueCertOptions {
  subject: string
  /** Subject key: algorithm OID (parameters absent) and raw public key bytes */
  subjectKeyOid: string
  subjectPublicKey: Uint8Array
  /** null = self-signed with `selfSigner` */
  issuer: CertIssuer | null
  selfSigner?: { signatureOid: string; signerFn: SignerFn }
  isCA: boolean
  keyUsage: KeyUsageBit[]
  extraExtensions?: Extension[]
  /** Pre-built SPKI algorithm, for keys whose AlgorithmIdentifier has parameters (EC) */
  subjectAlgId?: AlgorithmIdentifier
}

/**
 * Build a v3 certificate with critical keyUsage and basicConstraints, a
 * subjectKeyIdentifier, and — when CA-issued — an authorityKeyIdentifier.
 *
 * The subject key and the signature are independent: an ML-KEM subject key
 * is signed here by an ML-DSA issuer, which is exactly the RFC 9935 model.
 */
export async function issueCertificate(
  opts: IssueCertOptions
): Promise<{ der: Uint8Array; keyId: Uint8Array }> {
  const signing = opts.issuer ?? (opts.selfSigner && { ...opts.selfSigner, subject: opts.subject })
  if (!signing) throw new Error('issueCertificate: need an issuer or a self-signer')
  const sigAlgId = buildAlgId(signing.signatureOid)
  const keyId = await computeKeyIdentifier(opts.subjectPublicKey)
  const extensions = [
    basicConstraintsExt(opts.isCA, true),
    keyUsageExt(opts.keyUsage),
    subjectKeyIdExt(keyId),
    ...(opts.issuer ? [authorityKeyIdExt(opts.issuer.keyId)] : []),
    ...(opts.extraExtensions ?? []),
  ]
  const tbs = new TBSCertificate({
    version: Version.v3,
    serialNumber: generateSerialBytes(),
    signature: sigAlgId,
    issuer: buildName(signing.subject),
    validity: buildValidity().validity,
    subject: buildName(opts.subject),
    subjectPublicKeyInfo: buildSPKI(
      opts.subjectAlgId ?? buildAlgId(opts.subjectKeyOid),
      opts.subjectPublicKey
    ),
    extensions: new Extensions(extensions),
  })
  const signature = await signing.signerFn(serializeTBS(tbs))
  return { der: buildCertificate(tbs, sigAlgId, signature), keyId }
}

/**
 * The workshop's root CA: a self-signed certificate with cA=TRUE and
 * keyUsage {keyCertSign, cRLSign}, both critical. One signature algorithm
 * per CA — an SLH-DSA end entity is issued by an SLH-DSA CA so its card
 * still shows an SLH-DSA certificate signature.
 */
export async function buildWorkshopCA(opts: {
  subject: string
  keyOid: string
  publicKey: Uint8Array
  signerFn: SignerFn
}): Promise<CertIssuer> {
  const { der, keyId } = await issueCertificate({
    subject: opts.subject,
    subjectKeyOid: opts.keyOid,
    subjectPublicKey: opts.publicKey,
    issuer: null,
    selfSigner: { signatureOid: opts.keyOid, signerFn: opts.signerFn },
    isCA: true,
    keyUsage: ['keyCertSign', 'cRLSign'],
  })
  return {
    certDer: der,
    subject: opts.subject,
    signatureOid: opts.keyOid,
    signerFn: opts.signerFn,
    keyId,
  }
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
// 1b. Composite KEM certificate — draft-ietf-lamps-pq-composite-kem-21
//
//     Subject public key: id-MLKEM768-X25519-SHA3-256 (1.3.6.1.5.5.7.6.58)
//     SubjectPublicKey:   mlkem768PublicKey(1184B) || x25519PublicKey(32B)
//                         — raw concatenation, ML-KEM component first (§4.1)
//     keyUsage:           keyEncipherment only (the draft's CERT-KEY-USAGE)
//     Signature:          by a separate CA. A KEM key cannot sign, so the
//                         certificate is never self-issued.
// ---------------------------------------------------------------------------

/** CA-issue an end-entity certificate carrying a composite ML-KEM public key. */
export async function buildCompositeKEMCert(
  compositePubKeyBytes: Uint8Array,
  compositeKemOidStr: string,
  issuer: CertIssuer,
  subject: string
): Promise<Uint8Array> {
  const { der } = await issueCertificate({
    subject,
    subjectKeyOid: compositeKemOidStr,
    subjectPublicKey: compositePubKeyBytes,
    issuer,
    isCA: false,
    keyUsage: ['keyEncipherment'],
  })
  return der
}

// ---------------------------------------------------------------------------
// 2. Composite certificate — SUPERSEDED ENCODING, retained for comparison only
//
// ⚠️  DO NOT USE FOR NEW CODE. Use buildCompositeCertDraft19 (§2b) instead.
//
// This builder emits `CompositeSignatureValue ::= SEQUENCE SIZE (2) OF BIT
// STRING` with the ECDSA component first. That structure appeared only in
// draft-ietf-lamps-pq-composite-sigs; -04 replaced it with a plain BIT
// STRING, and from -06 onward the identifier was removed entirely in favour of
// raw byte concatenation. No current draft specifies this layout, and a
// composite-aware verifier rejects certificates built with it.
//
// It is kept ONLY as a teaching exhibit — the "before" half of the before/after
// comparison showing why LAMPS abandoned ASN.1-wrapped composite signatures in
// favour of fixed-length concatenation. Nothing in the workshop signing path
// calls it.
// ---------------------------------------------------------------------------

/**
 * Builds a composite certificate using the SUPERSEDED draft-02-era encoding.
 * CompositeSignatureValue ::= SEQUENCE SIZE (2) OF BIT STRING (ECDSA first).
 *
 * @deprecated Superseded by {@link buildCompositeCertDraft19}, which implements
 * the current raw-concatenation serialization (ML-DSA first). Retained for
 * format comparison only.
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
// THIS IS THE CURRENT, CONFORMANT BUILDER — the workshop signing path uses it.
//
// PROFILE DIFFERENCES vs the superseded buildCompositeCert above: §4.3 encodes
// the composite signature as the plain byte concatenation `mldsaSig || tradSig`
// inside the outer BIT STRING — NOT as `SEQUENCE OF BIT STRING`. ML-DSA always
// comes first; the verifier splits at the ML-DSA signature's fixed length per
// FIPS 204 (Table 1 in the draft).
//
// The composite public key is also a plain concat per §4.1:
//   `output mldsaPK || tradPK`  (not a SEQUENCE of SPKIs).
// Per §5.1 the BIT STRING carries that raw byte string "without further
// encoding". The identifier `CompositeSignatureValue` no longer exists in the
// specification at all.
//
// Verified against draft-ietf-lamps-pq-composite-sigs (RFC Editor queue) on
// 2026-08-17. The wire format is byte-identical across -15..-19; those
// revisions differ only editorially, so the version suffix is deliberately
// omitted from teaching prose.
// ---------------------------------------------------------------------------

/** Fixed Prefix per draft-19 §2.2: ASCII "CompositeAlgorithmSignatures2025" */
export const COMPOSITE_DRAFT19_PREFIX = new TextEncoder().encode('CompositeAlgorithmSignatures2025')

/** Pre-hash function name as accepted by Web Crypto / Node crypto digest APIs */
export type CompositePreHash = 'SHA-256' | 'SHA-512'

/** Hash used by the traditional component (draft §6 "Traditional Signature Algorithm"). */
export type CompositeTradHash = 'SHA-256' | 'SHA-384' | 'SHA-512'

/**
 * The traditional (non-PQ) half of a composite profile, exactly as draft-19 §6
 * specifies it.
 *
 * This is a DISCRIMINATED UNION rather than a bag of optional fields on purpose.
 * Each traditional family needs a genuinely different set of parameters, and the
 * previous shape — a single `tradHash` plus an if-chain over composite OIDs in
 * the verifier — could not express Ed25519 (which has no separate hash) or an
 * RSA size at all. It also meant every new profile required editing the
 * verifier's control flow, which is precisely how F17 (the 2026-08-17
 * traditional-hash bug) stayed invisible: the spec facts lived in code paths
 * instead of in data. Here they live in data, and the verifier switches on
 * `kind` with an exhaustive check.
 */
export type CompositeClassicalSpec =
  /** draft §6 "Traditional Algorithm: ECDSA" */
  | {
      kind: 'ecdsa'
      curve: 'P-256' | 'P-384'
      /**
       * draft §6 "Traditional Signature Algorithm" — `ecdsa-with-SHAxxx`.
       *
       * CRITICAL and easy to get wrong: the `SHAxxx` in a profile NAME is the
       * pre-hash PH applied to the message, NOT this hash. For
       * id-MLDSA65-ECDSA-P256-SHA512 the traditional algorithm is
       * `ecdsa-with-SHA256` — the ECDSA hash tracks the CURVE, not the name.
       * Getting this wrong yields certificates that verify against your own
       * verifier and fail against every conformant one (found 2026-08-17 by
       * checking a Bouncy Castle IETF Hackathon vector).
       */
      tradHash: CompositeTradHash
      /** Uncompressed SEC1 point length: 65 (P-256) / 97 (P-384). */
      pubKeyBytes: number
    }
  /** draft §6 "Traditional Signature Algorithm: id-RSASSA-PSS" */
  | {
      kind: 'rsa-pss'
      /**
       * draft §6 "RSA size". NORMATIVE, and checkable: §3.3 step 2 requires a
       * verifier to output "Invalid signature" if a component key "is not of
       * the correct type or length for the given component algorithm". A cert
       * claiming id-MLDSA65-RSA3072-PSS-SHA512 while carrying a 2048-bit
       * modulus is therefore invalid, not merely unusual.
       */
      modulusBits: 2048 | 3072
      /**
       * draft §6.1 Table 2 `hashAlgorithm` and `maskGenAlgorithm.parameters`.
       * Both 2048 and 3072 use SHA-256 — again NOT the profile name's PH.
       */
      tradHash: 'SHA-256'
      /** draft §6.1 Table 2 `saltLength`. */
      saltLength: 32
      /** draft §6: "the exponent is RECOMMENDED to be 65537". */
      recommendedExponent: 65537
    }
  /** draft §6 "Traditional Signature Algorithm: id-Ed25519" */
  | {
      kind: 'ed25519'
      /**
       * Ed25519 is PureEdDSA (RFC 8032 §5.1): it hashes the message internally
       * with SHA-512 as part of the algorithm. There is no separate traditional
       * hash to choose, which is why this variant carries no `tradHash`.
       */
      pubKeyBytes: 32
      sigBytes: 64
    }

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
  /**
   * ML-DSA public key length in bytes (FIPS 204 Table 2):
   *   ML-DSA-44 → 1312
   *   ML-DSA-65 → 1952
   *   ML-DSA-87 → 2592
   * Used by verifiers to split mldsaPK from tradPK in the concat encoding —
   * the composite key carries no internal length framing, so the split point
   * is this fixed length and nothing else.
   */
  mldsaPubKeyBytes: number
  /**
   * The traditional component's family and its draft §6 parameters. See
   * {@link CompositeClassicalSpec} — in particular the warning that a profile
   * name's `SHAxxx` is the pre-hash PH, never the traditional algorithm's hash.
   */
  classical: CompositeClassicalSpec
}

/** draft §6.1 Table 2 — shared by every RSASSA-PSS profile at 2048 and 3072 bits. */
const RSA_PSS_TABLE2 = {
  kind: 'rsa-pss',
  tradHash: 'SHA-256',
  saltLength: 32,
  recommendedExponent: 65537,
} as const

export const COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256: CompositeProfileDraft19 = {
  compositeOid: COMPOSITE_MLDSA44_RSA2048_PSS_SHA256_OID_STR,
  label: 'id-MLDSA44-RSA2048-PSS-SHA256',
  signatureLabel: 'COMPSIG-MLDSA44-RSA2048-PSS-SHA256',
  preHash: 'SHA-256',
  mldsaOid: ML_DSA_44_OID_STR,
  buildClassicalAlgId: buildRSAEncryptionAlgId,
  mldsaSigBytes: 2420,
  mldsaPubKeyBytes: 1312,
  classical: { ...RSA_PSS_TABLE2, modulusBits: 2048 },
}

/**
 * id-MLDSA44-Ed25519-SHA512 — 1.3.6.1.5.5.7.6.39 (draft §6).
 *
 * One of the two profiles §10.4 RECOMMENDS "when performance or bandwidth is a
 * concern", alongside .40. Ed25519 gives the smallest traditional half of any
 * profile: 32-byte key, 64-byte signature, both fixed-length.
 *
 * Note the pre-hash is SHA512 rather than SHA256 as with the other ML-DSA-44
 * profiles. Per the draft's §6 note this is deliberate — for Ed25519 and Ed448
 * the pre-hash is chosen to match the hash inside RFC 8032 itself (SHA-512 for
 * Ed25519ph), not to match the ML-DSA parameter set.
 */
export const COMPOSITE_PROFILE_MLDSA44_ED25519_SHA512: CompositeProfileDraft19 = {
  compositeOid: COMPOSITE_MLDSA44_ED25519_SHA512_OID_STR,
  label: 'id-MLDSA44-Ed25519-SHA512',
  signatureLabel: 'COMPSIG-MLDSA44-Ed25519-SHA512',
  preHash: 'SHA-512',
  mldsaOid: ML_DSA_44_OID_STR,
  buildClassicalAlgId: buildEd25519AlgId,
  mldsaSigBytes: 2420,
  mldsaPubKeyBytes: 1312,
  classical: { kind: 'ed25519', pubKeyBytes: 32, sigBytes: 64 },
}

/**
 * id-MLDSA44-ECDSA-P256-SHA256 — 1.3.6.1.5.5.7.6.40 (draft §6).
 *
 * Added 2026-08-18. The only profile where PH and the traditional hash are the
 * SAME (both SHA-256), which makes it the control case for the F17 class of
 * bug: an implementation that wrongly uses PH as the traditional hash still
 * produces a VALID certificate here, and only diverges on profiles where the
 * two differ. Second-source verified against the IETF Hackathon r5
 * composite-sigs-ref-impl artifact for this OID.
 */
export const COMPOSITE_PROFILE_MLDSA44_ECDSA_P256_SHA256: CompositeProfileDraft19 = {
  compositeOid: '1.3.6.1.5.5.7.6.40',
  label: 'id-MLDSA44-ECDSA-P256-SHA256',
  signatureLabel: 'COMPSIG-MLDSA44-ECDSA-P256-SHA256',
  preHash: 'SHA-256',
  mldsaOid: ML_DSA_44_OID_STR,
  buildClassicalAlgId: buildECAlgId,
  mldsaSigBytes: 2420,
  mldsaPubKeyBytes: 1312,
  // §6: ecdsa-with-SHA256 (same as PH here — the control case)
  classical: { kind: 'ecdsa', curve: 'P-256', tradHash: 'SHA-256', pubKeyBytes: 65 },
}

/**
 * id-MLDSA65-RSA3072-PSS-SHA512 — 1.3.6.1.5.5.7.6.41 (draft §6).
 *
 * The profile §10.4 RECOMMENDS "when RSA is required". Note that the draft
 * points at RSA-3072 here, NOT at the RSA-2048 profile (.37) — so .37 is
 * implemented for teaching and for the certificates learners will actually meet
 * in the wild, while .41 is the one to reach for in new deployments.
 *
 * The RSA size is a normative §6 parameter, and §3.3 step 2 requires a verifier
 * to reject a component key that "is not of the correct type or length". The
 * verifier enforces exactly 3072 bits here.
 */
export const COMPOSITE_PROFILE_MLDSA65_RSA3072_PSS_SHA512: CompositeProfileDraft19 = {
  compositeOid: COMPOSITE_MLDSA65_RSA3072_PSS_SHA512_OID_STR,
  label: 'id-MLDSA65-RSA3072-PSS-SHA512',
  signatureLabel: 'COMPSIG-MLDSA65-RSA3072-PSS-SHA512',
  preHash: 'SHA-512',
  mldsaOid: ML_DSA_65_OID_STR,
  buildClassicalAlgId: buildRSAEncryptionAlgId,
  mldsaSigBytes: 3309,
  mldsaPubKeyBytes: ML_DSA_65_PUBKEY_BYTES,
  // §6.1 Table 2 covers BOTH 2048 and 3072 — the PSS hash stays SHA-256 even
  // though PH is SHA-512 here. Same trap as the ECDSA profiles.
  classical: { ...RSA_PSS_TABLE2, modulusBits: 3072 },
}

/**
 * id-MLDSA65-Ed25519-SHA512 — 1.3.6.1.5.5.7.6.48 (draft §6).
 *
 * §10.4 names this one for applications concerned with SUF-CMA. Read §9.2.2
 * carefully before relying on that: the draft's own analysis concludes
 * Composite ML-DSA is NOT SUF-CMA secure against quantum adversaries, and that
 * "applications where SUF-CMA security is critical SHOULD NOT use Composite
 * ML-DSA". What Ed25519 buys is the removal of ECDSA's trivial signature
 * malleability, which is a real improvement but not the full property.
 */
export const COMPOSITE_PROFILE_MLDSA65_ED25519_SHA512: CompositeProfileDraft19 = {
  compositeOid: COMPOSITE_MLDSA65_ED25519_SHA512_OID_STR,
  label: 'id-MLDSA65-Ed25519-SHA512',
  signatureLabel: 'COMPSIG-MLDSA65-Ed25519-SHA512',
  preHash: 'SHA-512',
  mldsaOid: ML_DSA_65_OID_STR,
  buildClassicalAlgId: buildEd25519AlgId,
  mldsaSigBytes: 3309,
  mldsaPubKeyBytes: ML_DSA_65_PUBKEY_BYTES,
  classical: { kind: 'ed25519', pubKeyBytes: 32, sigBytes: 64 },
}

export const COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512: CompositeProfileDraft19 = {
  compositeOid: COMPOSITE_MLDSA65_ECDSA_P256_SHA512_OID_STR,
  label: 'id-MLDSA65-ECDSA-P256-SHA512',
  signatureLabel: 'COMPSIG-MLDSA65-ECDSA-P256-SHA512',
  preHash: 'SHA-512',
  mldsaOid: ML_DSA_65_OID_STR,
  buildClassicalAlgId: buildECAlgId,
  mldsaSigBytes: 3309,
  mldsaPubKeyBytes: ML_DSA_65_PUBKEY_BYTES,
  // §6: ecdsa-with-SHA256 (NOT SHA-512 — that is PH)
  classical: { kind: 'ecdsa', curve: 'P-256', tradHash: 'SHA-256', pubKeyBytes: 65 },
}

export const COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512: CompositeProfileDraft19 = {
  compositeOid: COMPOSITE_MLDSA87_ECDSA_P384_SHA512_OID_STR,
  label: 'id-MLDSA87-ECDSA-P384-SHA512',
  signatureLabel: 'COMPSIG-MLDSA87-ECDSA-P384-SHA512',
  preHash: 'SHA-512',
  mldsaOid: ML_DSA_87_OID_STR,
  buildClassicalAlgId: buildECP384AlgId,
  mldsaSigBytes: 4627,
  mldsaPubKeyBytes: 2592,
  // §6: ecdsa-with-SHA384 (NOT SHA-512 — that is PH)
  classical: { kind: 'ecdsa', curve: 'P-384', tradHash: 'SHA-384', pubKeyBytes: 97 },
}

/**
 * id-MLDSA65-ECDSA-P384-SHA512 — 1.3.6.1.5.5.7.6.46 (draft §6).
 *
 * Added 2026-08-18. Not a §10.4 recommendation (a mismatched-tier pairing —
 * "medium" ML-DSA-65 with "high" P-384 — rather than one of the matched-tier
 * pairs .45/.49 above), but implemented for parity with the KMIP engine,
 * which added it the same day to close its own last gap against the
 * draft's full §6 set. Pre-hash/traditional-hash pairing confirmed against
 * the same shared external KAT vector the engine's implementation was
 * verified against (tcId `id-MLDSA65-ECDSA-P384-SHA512`: ph=SHA512,
 * trad_hash=SHA384).
 */
export const COMPOSITE_PROFILE_MLDSA65_ECDSA_P384_SHA512: CompositeProfileDraft19 = {
  compositeOid: COMPOSITE_MLDSA65_ECDSA_P384_SHA512_OID_STR,
  label: 'id-MLDSA65-ECDSA-P384-SHA512',
  signatureLabel: 'COMPSIG-MLDSA65-ECDSA-P384-SHA512',
  preHash: 'SHA-512',
  mldsaOid: ML_DSA_65_OID_STR,
  buildClassicalAlgId: buildECP384AlgId,
  mldsaSigBytes: 3309,
  mldsaPubKeyBytes: ML_DSA_65_PUBKEY_BYTES,
  // §6: ecdsa-with-SHA384 (NOT SHA-512 — that is PH). Traditional hash
  // tracks the P-384 curve, same as .49 above.
  classical: { kind: 'ecdsa', curve: 'P-384', tradHash: 'SHA-384', pubKeyBytes: 97 },
}

/**
 * The six profiles draft §10.4 RECOMMENDS for applications with no regulatory
 * or legacy constraint, in the draft's own order.
 *
 * §10.4 is explicit that the specification "does not list any particular
 * composite algorithm as mandatory-to-implement" — this is a recommendation to
 * narrow the combinatorial explosion, not a conformance requirement. .37 is
 * deliberately absent: it is implemented above, but the draft points at .41 for
 * RSA.
 */
export const COMPOSITE_PROFILES_RECOMMENDED: readonly CompositeProfileDraft19[] = [
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512, // general use — "best overall balance"
  COMPOSITE_PROFILE_MLDSA65_RSA3072_PSS_SHA512, // when RSA is required
  COMPOSITE_PROFILE_MLDSA44_ECDSA_P256_SHA256, // performance / bandwidth
  COMPOSITE_PROFILE_MLDSA44_ED25519_SHA512, // performance / bandwidth
  COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512, // NIST level 5 only
  COMPOSITE_PROFILE_MLDSA65_ED25519_SHA512, // SUF-CMA concerns (see §9.2.2)
]

/** One selectable composite profile, with the guidance the draft gives for it. */
export interface CompositeProfileChoice {
  profile: CompositeProfileDraft19
  /** Short label for a picker, e.g. 'ML-DSA-65 + ECDSA P-256' */
  shortLabel: string
  /** When §10.4 suggests reaching for this one */
  useWhen: string
  /** true if §10.4 lists it; false = implemented but not recommended */
  recommended: boolean
}

/**
 * Every composite profile the workshop can mint, in the order §10.4 presents
 * its recommendations.
 *
 * The `useWhen` strings paraphrase §10.4 rather than inventing advice. Note the
 * draft is explicit that it "does not list any particular composite algorithm
 * as mandatory-to-implement" — this is guidance for narrowing an awkward number
 * of options, not a conformance ranking.
 */
export const COMPOSITE_PROFILE_CHOICES: readonly CompositeProfileChoice[] = [
  {
    profile: COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512,
    shortLabel: 'ML-DSA-65 + ECDSA P-256',
    useWhen: 'General use — §10.4 calls this the best overall balance of performance and security.',
    recommended: true,
  },
  {
    profile: COMPOSITE_PROFILE_MLDSA65_RSA3072_PSS_SHA512,
    shortLabel: 'ML-DSA-65 + RSA-3072 PSS',
    useWhen:
      'When RSA is required. Note the draft points here rather than at the RSA-2048 profile below.',
    recommended: true,
  },
  {
    profile: COMPOSITE_PROFILE_MLDSA44_ECDSA_P256_SHA256,
    shortLabel: 'ML-DSA-44 + ECDSA P-256',
    useWhen: 'When performance or bandwidth is a concern.',
    recommended: true,
  },
  {
    profile: COMPOSITE_PROFILE_MLDSA44_ED25519_SHA512,
    shortLabel: 'ML-DSA-44 + Ed25519',
    useWhen:
      'When performance or bandwidth is a concern. Smallest traditional half of any profile: 32-byte key, 64-byte signature.',
    recommended: true,
  },
  {
    profile: COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512,
    shortLabel: 'ML-DSA-87 + ECDSA P-384',
    useWhen: 'When NIST security level 5 is required, and only then — the largest option here.',
    recommended: true,
  },
  {
    profile: COMPOSITE_PROFILE_MLDSA65_ED25519_SHA512,
    shortLabel: 'ML-DSA-65 + Ed25519',
    useWhen:
      'Where SUF-CMA is a concern. Read §9.2.2 first: the draft concludes Composite ML-DSA is NOT SUF-CMA secure against quantum adversaries. Ed25519 removes ECDSA’s trivial signature malleability, which is a real improvement but not the full property.',
    recommended: true,
  },
  {
    profile: COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256,
    shortLabel: 'ML-DSA-44 + RSA-2048 PSS',
    useWhen:
      'Not recommended by §10.4 — included because it is the composite certificate you are most likely to meet in the wild. For new RSA deployments the draft points at RSA-3072 above.',
    recommended: false,
  },
  {
    profile: COMPOSITE_PROFILE_MLDSA65_ECDSA_P384_SHA512,
    shortLabel: 'ML-DSA-65 + ECDSA P-384',
    useWhen:
      'Not a §10.4 recommendation — a mismatched-tier pairing (medium ML-DSA-65 with high-security P-384) rather than one of the matched-tier options above. Included for parity with the KMIP engine, which implements it.',
    recommended: false,
  },
]

/**
 * Convert a raw `r || s` ECDSA signature into a DER `Ecdsa-Sig-Value`.
 *
 * PKCS#11 `C_Sign` returns ECDSA signatures as the raw fixed-width
 * concatenation `r || s` (64 bytes for P-256, 96 for P-384). draft §4.1
 * requires the opposite: "A signature MUST be encoded as an Ecdsa-Sig-Value as
 * specified in Section 2.2.3 of [RFC3279]" — a `SEQUENCE { r INTEGER, s
 * INTEGER }`. Handing the raw form straight to the certificate builder produces
 * a composite signature that no conformant verifier accepts.
 *
 * Found 2026-08-18: the workshop's HSM-backed minting path did exactly that.
 * The bug was invisible because nothing could verify a composite certificate
 * until compositeVerifier existed — the same shape as F17, where signer and
 * verifier had to disagree before anyone noticed.
 *
 * Each half is an unsigned big-endian magnitude, so it gets a 0x00 pad whenever
 * its top bit is set: ASN.1 INTEGER is signed, and without the pad a value with
 * the high bit set encodes as negative.
 */
export function ecdsaRawSignatureToDer(raw: Uint8Array): Uint8Array {
  if (raw.length === 0 || raw.length % 2 !== 0) {
    throw new Error(`Raw ECDSA signature must be an even number of bytes (got ${raw.length})`)
  }
  const half = raw.length / 2
  const encodeInt = (magnitude: Uint8Array): number[] => {
    let i = 0
    while (i < magnitude.length - 1 && magnitude[i] === 0) i++
    const body = magnitude.subarray(i)
    const content = (body[0] & 0x80) !== 0 ? [0x00, ...body] : [...body]
    return [0x02, content.length, ...content]
  }
  const body = [...encodeInt(raw.subarray(0, half)), ...encodeInt(raw.subarray(half))]
  // r and s are at most 66 bytes even for P-521, so the SEQUENCE body always
  // fits the short-form length. No multi-byte length case to handle.
  return new Uint8Array([0x30, body.length, ...body])
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
 * Implements Composite-ML-DSA.Sign per draft-ietf-lamps-pq-composite-sigs
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
 *
 * @param ecSignerFn must return a DER Ecdsa-Sig-Value (RFC 3279 §2.2.3) — the
 *                   X.509 signatureValue never carries raw PKCS#11 r||s.
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

  // Step 2: Sign with ML-DSA-65 → alt signature value. ITU-T X.509 (10/2019)
  // §7.2.2: the input is the TBSCertificate with BOTH the altSignatureValue
  // extension AND the `signature` component removed. Until 2026-09-30 this
  // signed the TBS with `signature` still present.
  const altSigBytes = await mldsaSignerFn(altSignatureInput(tbsForAltSig))

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
//
//   Existing Cert A ──(hash of its complete final DER)──▶ new Cert B
//
// One-way: Cert A is issued first and never modified. The requester proves it
// holds Cert A's key with a relatedCertRequest CSR attribute; the CA checks
// that proof and issues Cert B carrying a RelatedCertificate extension.
// Until 2026-09-30 this built a reciprocal pair and hashed a draft Cert A that
// was then re-signed, so the stored hash never matched the returned Cert A.
// ---------------------------------------------------------------------------

export const RELATED_CERT_REQUEST_OID = '1.2.840.113549.1.9.16.2.60' // id-aa 60

export interface RelatedCertificatesResult {
  /** DER RequesterCertificate (the relatedCertRequest attribute value) */
  relatedCertRequest: Uint8Array
  /** Did the CA's proof-of-possession check pass? Issuance stops if not. */
  requestVerified: true
  certB: Uint8Array
  /** Hex SHA-256 of the complete final DER of Cert A, as stored in Cert B */
  bindingHash: string
}

const toHex = (b: Uint8Array) =>
  Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')

function derIA5String(s: string): Uint8Array {
  const body = new TextEncoder().encode(s)
  return new Uint8Array([0x16, ...encodeDERLength(body.length), ...body])
}

/**
 * Issue Cert B referencing the existing, final Cert A per RFC 9763.
 *
 * @param certA           Existing certificate, final DER — hashed as-is
 * @param certASignerFn   Cert A's private key, producing signatures in the
 *                        form Cert A's own signature algorithm uses (DER ECDSA)
 * @param locationInfo    Where Cert A can be fetched (deterministic local URI)
 */
export async function buildRelatedCertificates(opts: {
  certA: Uint8Array
  certASignerFn: SignerFn
  locationInfo: string
  certBSubject: string
  certBKeyOid: string
  certBPublicKey: Uint8Array
  issuer: CertIssuer
  requestTime?: Date
}): Promise<RelatedCertificatesResult> {
  const certA = parseCertificate(opts.certA)
  const tbsA = certA.tbsCertificate

  // RequesterCertificate.certID — IssuerAndSerialNumber of Cert A
  const issuerAndSerial = buildDERSequence([
    new Uint8Array(AsnConvert.serialize(tbsA.issuer)),
    buildDERInteger(new Uint8Array(tbsA.serialNumber)),
  ])
  // requestTime — BinaryTime (RFC 6019): seconds since the epoch
  const seconds = Math.floor((opts.requestTime ?? new Date()).getTime() / 1000)
  const secBytes: number[] = []
  for (let v = seconds; v > 0; v = Math.floor(v / 256)) secBytes.unshift(v & 0xff)
  const binaryTime = buildDERInteger(new Uint8Array(secBytes.length ? secBytes : [0]))

  // §3.1: signature over DER(IssuerAndSerialNumber) || DER(BinaryTime) with
  // Cert A's key and signature algorithm.
  const signed = new Uint8Array([...issuerAndSerial, ...binaryTime])
  const popSig = await opts.certASignerFn(signed)
  const relatedCertRequest = buildDERSequence([
    issuerAndSerial,
    binaryTime,
    derIA5String(opts.locationInfo),
    buildDERBitString(popSig),
  ])

  // §3.2: the CA verifies possession with the public key in Cert A.
  const pop = verifyWithSpki(
    certA.signatureAlgorithm.algorithm,
    tbsA.subjectPublicKeyInfo,
    signed,
    popSig
  )
  if (!pop.ok) {
    throw new Error(
      `relatedCertRequest proof of possession failed${pop.detail ? `: ${pop.detail}` : ''}`
    )
  }

  // §4: Cert A must already carry the key usage Cert B will assert.
  const kuA = tbsA.extensions?.find((e) => e.extnID === '2.5.29.15')
  if (
    !kuA ||
    (AsnConvert.parse(kuA.extnValue.buffer, KeyUsage).toNumber() &
      KeyUsageFlags.digitalSignature) ===
      0
  ) {
    throw new Error('Cert A does not assert digitalSignature, which Cert B would assert')
  }

  // RelatedCertificate ::= SEQUENCE { hashAlgorithm, hashValue } over the
  // entire final Cert A. Cert A is ecdsa-with-SHA256, so SHA-256 (§4 SHOULD),
  // parameters absent (RFC 5754 §2).
  const hashA = new Uint8Array(await crypto.subtle.digest('SHA-256', opts.certA as BufferSource))
  const relatedExt = buildExtension(
    RELATED_CERT_OID,
    false, // §4: SHOULD NOT be critical
    buildDERSequence([
      new Uint8Array(AsnConvert.serialize(buildAlgId(SHA256_OID_STR))),
      buildDEROctetString(hashA),
    ]).buffer as ArrayBuffer
  )

  const { der: certB } = await issueCertificate({
    subject: opts.certBSubject,
    subjectKeyOid: opts.certBKeyOid,
    subjectPublicKey: opts.certBPublicKey,
    issuer: opts.issuer,
    isCA: false,
    keyUsage: ['digitalSignature'],
    extraExtensions: [relatedExt],
  })

  return { relatedCertRequest, requestVerified: true, certB, bindingHash: toHex(hashA) }
}

// ---------------------------------------------------------------------------
// Advanced: Certificate Discovery (draft-ietf-lamps-certdiscovery-03)
//
// A primary certificate advertises where a secondary certificate (here one
// with a PQC key) can be fetched, in a subjectInfoAccess entry whose
// accessMethod is id-ad-certDiscovery and whose accessLocation is an
// otherName carrying a RelatedCertificateDescriptor.
//
// The draft's OIDs are still TBD. These placeholders sit under the IANA
// documentation enterprise number 32473 (RFC 5612) — clearly not real,
// and never valid in a deployed certificate.
// ---------------------------------------------------------------------------

export const CERT_DISCOVERY_PLACEHOLDER_OIDS = {
  /** stands in for id-ad-certDiscovery (id-ad TBD) */
  accessMethod: '1.3.6.1.4.1.32473.1.1',
  /** stands in for id-on-relatedCertificateDescriptor (id-on TBD) */
  otherName: '1.3.6.1.4.1.32473.1.2',
  /** stands in for id-rcd-agility (id-rcd 1, id-rcd TBD4) */
  intentAgility: '1.3.6.1.4.1.32473.1.3.1',
} as const

const SUBJECT_INFO_ACCESS_OID = '1.3.6.1.5.5.7.1.11'

function derOid(oid: string): Uint8Array {
  const parts = oid.split('.').map(Number)
  const body: number[] = [parts[0] * 40 + parts[1]]
  for (const v of parts.slice(2)) {
    const stack = [v & 0x7f]
    for (let x = Math.floor(v / 128); x > 0; x = Math.floor(x / 128))
      stack.unshift((x & 0x7f) | 0x80)
    body.push(...stack)
  }
  return new Uint8Array([0x06, ...encodeDERLength(body.length), ...body])
}

/** Re-tag a DER TLV (e.g. an AlgorithmIdentifier SEQUENCE) with an IMPLICIT [n] constructed tag. */
function implicitConstructed(n: number, tlv: Uint8Array): Uint8Array {
  const out = tlv.slice()
  out[0] = 0xa0 | n
  return out
}

/**
 * Build the subjectInfoAccess extension advertising a secondary certificate:
 *
 *   AccessDescription { accessMethod id-ad-certDiscovery,
 *     accessLocation otherName { type-id id-on-relatedCertificateDescriptor,
 *       value [0] EXPLICIT RelatedCertificateDescriptor {
 *         method byUri [0] IMPLICIT IA5String,
 *         intent id-rcd-agility,
 *         signatureAlgorithm [0] IMPLICIT AlgorithmIdentifier,
 *         publicKeyAlgorithm [1] IMPLICIT AlgorithmIdentifier } } }
 */
export function buildCertDiscoveryExtension(opts: {
  uri: string
  signatureOid: string
  publicKeyOid: string
}): Extension {
  const ids = CERT_DISCOVERY_PLACEHOLDER_OIDS
  const uriBytes = new TextEncoder().encode(opts.uri)
  const byUri = new Uint8Array([0x80, ...encodeDERLength(uriBytes.length), ...uriBytes])
  const algId = (oid: string) => new Uint8Array(AsnConvert.serialize(buildAlgId(oid)))
  const descriptor = buildDERSequence([
    byUri,
    derOid(ids.intentAgility),
    implicitConstructed(0, algId(opts.signatureOid)),
    implicitConstructed(1, algId(opts.publicKeyOid)),
  ])
  // GeneralName otherName is [0] IMPLICIT AnotherName (constructed).
  const otherName = implicitConstructed(
    0,
    buildDERSequence([derOid(ids.otherName), buildDERContextExplicit(0, descriptor)])
  )
  const accessDescription = buildDERSequence([derOid(ids.accessMethod), otherName])
  // RFC 5280 §4.2.2.2: subjectInfoAccess MUST be non-critical.
  return buildExtension(
    SUBJECT_INFO_ACCESS_OID,
    false,
    buildDERSequence([accessDescription]).buffer as ArrayBuffer
  )
}

// ---------------------------------------------------------------------------
// Advanced: unsigned certificate (RFC 9925)
// ---------------------------------------------------------------------------

/** id-alg-unsigned (RFC 9925) */
export const ID_ALG_UNSIGNED_OID = '1.3.6.1.5.5.7.6.36'
/** id-rdna-unsigned — the placeholder issuer RDN attribute (RFC 9925) */
export const ID_RDNA_UNSIGNED_OID = '1.3.6.1.5.5.7.25.1'

/**
 * Build an RFC 9925 unsigned certificate: signature algorithm id-alg-unsigned
 * with absent parameters, a zero-length signature BIT STRING, and the
 * placeholder issuer `1.3.6.1.5.5.7.25.1=#0C00` (an empty UTF8String) so the
 * object can never be mistaken for a self-signed certificate. issuerUniqueID,
 * authorityKeyIdentifier and issuerAltName are omitted as the RFC requires /
 * recommends. Validators MUST NOT accept it as a signature in a certification path.
 */
export async function buildUnsignedCertificate(opts: {
  subject: string
  subjectKeyOid: string
  subjectPublicKey: Uint8Array
  keyUsage: KeyUsageBit[]
}): Promise<Uint8Array> {
  const unsigned = buildAlgId(ID_ALG_UNSIGNED_OID)
  const issuer = new Name([
    new RelativeDistinguishedName([
      new AttributeTypeAndValue({
        type: ID_RDNA_UNSIGNED_OID,
        value: new AttributeValue({ utf8String: '' }),
      }),
    ]),
  ])
  const keyId = await computeKeyIdentifier(opts.subjectPublicKey)
  const tbs = new TBSCertificate({
    version: Version.v3,
    serialNumber: generateSerialBytes(),
    signature: unsigned,
    issuer,
    validity: buildValidity().validity,
    subject: buildName(opts.subject),
    subjectPublicKeyInfo: buildSPKI(buildAlgId(opts.subjectKeyOid), opts.subjectPublicKey),
    extensions: new Extensions([keyUsageExt(opts.keyUsage), subjectKeyIdExt(keyId)]),
  })
  return buildCertificate(tbs, unsigned, new Uint8Array(0))
}

/** The ECDSA P-256 AlgorithmIdentifier (with namedCurve), for issueCertificate. */
export function ecP256SpkiAlgId(): AlgorithmIdentifier {
  return buildECAlgId()
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
  // Canonicalize (strip a redundant leading zero, or pad a set sign bit) —
  // its one current caller always passes pre-canonicalized bytes already,
  // but hardened here so a future caller passing raw bytes can't reproduce
  // the 2026-08-18 serial-number bug (see src/utils/derInteger.ts).
  const payload = data.length > 0 ? canonicalPositiveInteger(data) : new Uint8Array([0x00])
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
  formatHint?: string,
  /**
   * Required when `formatHint === 'composite'`. Everything the composite
   * SPKI/signature breakdown below prints — the classical family, curve,
   * byte lengths, OID — comes from this, not from a hardcoded assumption.
   *
   * Found 2026-08-18 while adding the .46 profile: this branch was
   * hardcoded to id-MLDSA65-ECDSA-P256-SHA512's own label, OID, and byte
   * lengths regardless of which profile was actually selected. Every
   * profile OTHER than .45 itself showed the wrong classical family name
   * and OID in its Parsed tab — RSA-PSS and Ed25519 profiles (.37, .39,
   * .41, .48) as well as the other ECDSA ones — and any ML-DSA-44 profile
   * would have shown a garbage byte-range split too, since the hardcoded
   * split point (.45's ML-DSA-65 lengths) doesn't match ML-DSA-44's.
   */
  compositeProfile?: CompositeProfileDraft19
): string {
  const info = parseCertificateInfo(der)
  const algLabel = oidToLabel(info.algorithmOID)
  const formatDate = (d: Date): string => d.toUTCString().replace('GMT', 'GMT').replace(',', '')
  const dnDisplay = subject.split('/').filter(Boolean).join(', ')

  // Issuer, subject, validity and extension values come from the certificate
  // itself, so a CA-issued certificate shows its real issuer and the Parsed
  // view can never claim an extension value the DER does not carry.
  const cert = parseCertificate(der)
  const tbs = cert.tbsCertificate
  const nameText = (n: Name): string =>
    n
      .map((rdn) =>
        rdn
          .map((atv) => {
            const short =
              atv.type === '2.5.4.3'
                ? 'CN'
                : atv.type === '2.5.4.10'
                  ? 'O'
                  : atv.type === '2.5.4.11'
                    ? 'OU'
                    : atv.type
            return `${short}=${atv.value.utf8String ?? atv.value.printableString ?? atv.value.toString()}`
          })
          .join('+')
      )
      .join(', ')
  const issuerDisplay = nameText(tbs.issuer) || dnDisplay
  const subjectDisplay = nameText(tbs.subject) || dnDisplay
  const certNotBefore = tbs.validity.notBefore.getTime() ?? notBefore
  const certNotAfter = tbs.validity.notAfter.getTime() ?? notAfter

  const extLines: string[] = []
  if (tbs.extensions && tbs.extensions.length > 0) {
    extLines.push('    X509v3 extensions:')
    for (const ext of tbs.extensions) {
      extLines.push(`        ${oidToLabel(ext.extnID)}${ext.critical ? ' (critical)' : ''}:`)
      if (ext.extnID === '2.5.29.15') {
        extLines.push(`            ${readKeyUsage(cert)?.bits.join(', ') ?? '(unreadable)'}`)
      } else if (ext.extnID === '2.5.29.19') {
        extLines.push(`            CA:${readBasicConstraints(cert)?.cA ? 'TRUE' : 'FALSE'}`)
      } else {
        extLines.push(`            present (${ext.extnValue.buffer.byteLength} bytes)`)
      }
    }
  }

  // Build SPKI section — format-specific breakdown for composite/alt-sig/chameleon
  const spkiLines: string[] = ['    Subject Public Key Info:']
  if (formatHint === 'composite' && compositeProfile) {
    // Derived from the actual profile and certificate, not hardcoded: a
    // composite verifier splits both the key and the signature at the
    // ML-DSA component's fixed length (FIPS 204), because the
    // concatenation carries no internal framing. Deriving it here means
    // this panel can never disagree with the bytes, or with which
    // profile was actually selected.
    const mldsaLabel =
      compositeProfile.mldsaOid === ML_DSA_44_OID_STR
        ? 'ML-DSA-44'
        : compositeProfile.mldsaOid === ML_DSA_87_OID_STR
          ? 'ML-DSA-87'
          : 'ML-DSA-65'
    const mldsaPkBytes = compositeProfile.mldsaPubKeyBytes
    const mldsaSigBytes = compositeProfile.mldsaSigBytes
    const tradPkBytes = info.publicKeySizeBytes - mldsaPkBytes
    const tradSigBytes = info.signatureSizeBytes - mldsaSigBytes
    const classical = compositeProfile.classical
    const tradFamilyLabel =
      classical.kind === 'ecdsa'
        ? `EC ${classical.curve}`
        : classical.kind === 'rsa-pss'
          ? `RSA-${classical.modulusBits}`
          : 'Ed25519'
    const tradPkEncoding =
      classical.kind === 'ecdsa'
        ? 'X9.62 uncompressed point'
        : classical.kind === 'rsa-pss'
          ? 'RSAPublicKey, DER'
          : 'RFC 8032, raw 32 bytes'
    const tradSigEncoding =
      classical.kind === 'ecdsa'
        ? 'Ecdsa-Sig-Value, DER'
        : classical.kind === 'rsa-pss'
          ? 'RSASSA-PSS, fixed-width'
          : 'RFC 8032, raw 64 bytes'

    spkiLines.push(
      `        Public Key Algorithm: ${compositeProfile.label} [Composite OID ${compositeProfile.compositeOid}]`
    )
    spkiLines.push(
      `        CompositePublicKey — raw concatenation, ${info.publicKeySizeBytes} bytes total:`
    )
    if (tradPkBytes > 0) {
      spkiLines.push(
        `            [0..${mldsaPkBytes - 1}]  ${mldsaLabel} — ${mldsaPkBytes} bytes  (FIPS 204, lattice-based)`
      )
      spkiLines.push(
        `            [${mldsaPkBytes}..${info.publicKeySizeBytes - 1}]  ${tradFamilyLabel}  — ${tradPkBytes} bytes  (${tradPkEncoding})`
      )
    } else {
      spkiLines.push(
        `            (unexpected key size — expected > ${mldsaPkBytes} bytes for a composite key)`
      )
    }
    spkiLines.push('        No ASN.1 wrapping: the BIT STRING holds the raw bytes directly.')
    spkiLines.push('        Signature splits the same way — ML-DSA first:')
    if (tradSigBytes > 0) {
      spkiLines.push(
        `            [0..${mldsaSigBytes - 1}]  ${mldsaLabel} — ${mldsaSigBytes} bytes`
      )
      spkiLines.push(
        `            [${mldsaSigBytes}..${info.signatureSizeBytes - 1}]  ${tradFamilyLabel} — ${tradSigBytes} bytes (${tradSigEncoding})`
      )
    }
    spkiLines.push('        -- verifier MUST validate BOTH components')
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
    `    Issuer: ${issuerDisplay}`,
    '    Validity',
    `        Not Before: ${formatDate(certNotBefore)}`,
    `        Not After : ${formatDate(certNotAfter)}`,
    `    Subject: ${subjectDisplay}`,
    ...spkiLines,
    ...extLines,
    `    Signature Algorithm: ${algLabel}`,
    `    Signature Value: ${info.signatureSizeBytes} bytes`,
  ].join('\n')
}
