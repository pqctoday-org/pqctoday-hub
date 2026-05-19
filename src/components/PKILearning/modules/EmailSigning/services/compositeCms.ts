// SPDX-License-Identifier: GPL-3.0-only
//
// LAMPS draft-ietf-lamps-pq-composite-sigs-19 CMS SignedData builder + verifier.
//
// Why this exists: the openssl.wasm pkcs11-provider composite path can produce
// composite X.509 certs but CMS_sign() trips on X509_check_private_key because
// the provider has no SPKI decoder for composite keys (registering one causes
// d2i_X509_PUBKEY infinite recursion). We bypass the openssl CMS_sign code
// path entirely and assemble the SignedData ASN.1 ourselves using
// @peculiar/asn1-cms, then verify by parsing the ASN.1 and running each half
// of the composite signature through @noble/post-quantum (ML-DSA) and either
// @noble/curves (ECDSA) or WebCrypto (RSA-PSS).
//
// Semantics: NOATTR (no SignedAttributes). The "message" signed is the raw
// eContent (the payload bytes). M' is computed per draft-19 §2.2:
//   M' = Prefix || Label || len(ctx) || ctx || PH(M)
// where ctx is empty (application context) for our hub flow. The ML-DSA
// component uses signatureLabel as its FIPS 204 ctx parameter.

import { AsnConvert, OctetString } from '@peculiar/asn1-schema'
import {
  CMSVersion,
  CertificateChoices,
  CertificateSet,
  ContentInfo,
  DigestAlgorithmIdentifier,
  DigestAlgorithmIdentifiers,
  EncapsulatedContent,
  EncapsulatedContentInfo,
  IssuerAndSerialNumber,
  SignatureAlgorithmIdentifier,
  SignedData,
  SignerIdentifier,
  SignerInfo,
  SignerInfos,
  id_data,
  id_signedData,
} from '@peculiar/asn1-cms'
import { Certificate } from '@peculiar/asn1-x509'
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js'
import { p256, p384 } from '@noble/curves/nist.js'
import {
  COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256,
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512,
  COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512,
  buildCompositeMessageRepresentative,
  type CompositeProfileDraft19,
} from '@/components/PKILearning/modules/HybridCrypto/services/certBuilder'

/** SHA-256 OID — used as the (informational) DigestAlgorithmIdentifier in
 *  SignerInfo + SignedData. With NOATTR semantics nothing actually digests
 *  the eContent with this hash; M' carries its own PH(M). RFC 5652 §5.3
 *  still requires the field. */
const SHA256_OID = '2.16.840.1.101.3.4.2.1'

/** Signs M' under ML-DSA, passing `mldsaCtx` (= signatureLabel) as the
 *  FIPS 204 ctx parameter. Worker-provided binding to softhsmv3. */
export type CompositeMLDSASignerFn = (
  mprime: Uint8Array,
  mldsaCtx: Uint8Array
) => Promise<Uint8Array>

/** Signs M' under the classical algorithm pinned by the profile (ECDSA-SHA512
 *  or RSASSA-PSS-SHA256). Returns the signature in its standard encoding —
 *  DER for ECDSA, raw octet string for RSA-PSS — per draft-19 §4.3. */
export type CompositeClassicalSignerFn = (mprime: Uint8Array) => Promise<Uint8Array>

/** Resolve a draft-19 profile descriptor by composite-signature OID. */
export function compositeProfileByOid(oid: string): CompositeProfileDraft19 | null {
  switch (oid) {
    case COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256.compositeOid:
      return COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256
    case COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512.compositeOid:
      return COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512
    case COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512.compositeOid:
      return COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512
    default:
      return null
  }
}

/** ML-DSA raw public key length (FIPS 204 Table 1). Same indexing as
 *  mldsaSigBytes — let the call site stay terse. */
function mldsaPubBytes(profile: CompositeProfileDraft19): number {
  if (profile.compositeOid === COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256.compositeOid)
    return 1312
  if (profile.compositeOid === COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512.compositeOid) return 1952
  if (profile.compositeOid === COMPOSITE_PROFILE_MLDSA87_ECDSA_P384_SHA512.compositeOid) return 2592
  throw new Error(`unknown composite profile OID: ${profile.compositeOid}`)
}

function selectMldsa(
  profile: CompositeProfileDraft19
): typeof ml_dsa44 | typeof ml_dsa65 | typeof ml_dsa87 {
  if (profile.compositeOid === COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256.compositeOid)
    return ml_dsa44
  if (profile.compositeOid === COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512.compositeOid)
    return ml_dsa65
  return ml_dsa87
}

/** Copies the underlying bytes of a Uint8Array view into a fresh ArrayBuffer.
 *  Necessary because @peculiar serializers refuse Uint8Array.buffer when the
 *  view does not cover the whole backing buffer (byteOffset != 0). */
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(u8.byteLength)
  new Uint8Array(out).set(u8)
  return out
}

/** Build a CMS ContentInfo wrapping SignedData with a single composite
 *  SignerInfo. Conforms to RFC 5652 + draft-19 §4.3 for the signature value.
 *
 *  CMS_NOATTR mode: SignerInfo.signedAttrs is OMITTED, so the composite
 *  signers operate on the raw payload (then composite-sig hashes inside
 *  buildCompositeMessageRepresentative). The DigestAlgorithmIdentifier
 *  fields remain (RFC 5652 §5.3 requires them present even with NOATTR)
 *  but carry no semantic weight for the composite path. */
export async function buildCompositeCmsSignedData(
  profile: CompositeProfileDraft19,
  signerCertDer: Uint8Array,
  payload: Uint8Array,
  mldsaSign: CompositeMLDSASignerFn,
  classicalSign: CompositeClassicalSignerFn
): Promise<Uint8Array> {
  const cert = AsnConvert.parse(toArrayBuffer(signerCertDer), Certificate)

  // Compute M' over the raw payload (draft-19 §2.2 — ctx is empty here)
  const mldsaCtx = new TextEncoder().encode(profile.signatureLabel)
  const mPrime = await buildCompositeMessageRepresentative(profile, payload, new Uint8Array(0))

  const [mldsaSig, classicalSig] = await Promise.all([
    mldsaSign(mPrime, mldsaCtx),
    classicalSign(mPrime),
  ])

  if (mldsaSig.length !== profile.mldsaSigBytes) {
    throw new Error(
      `Composite ML-DSA signer returned ${mldsaSig.length} bytes; profile ${profile.label} expects ${profile.mldsaSigBytes}`
    )
  }

  // draft-19 §4.3: signatureValue = mldsaSig || tradSig (raw concat)
  const compositeSig = new Uint8Array(mldsaSig.length + classicalSig.length)
  compositeSig.set(mldsaSig, 0)
  compositeSig.set(classicalSig, mldsaSig.length)

  const sid = new SignerIdentifier({
    issuerAndSerialNumber: new IssuerAndSerialNumber({
      issuer: cert.tbsCertificate.issuer,
      serialNumber: cert.tbsCertificate.serialNumber,
    }),
  })

  const signerInfo = new SignerInfo({
    version: CMSVersion.v1, // issuerAndSerialNumber → v1
    sid,
    digestAlgorithm: new DigestAlgorithmIdentifier({ algorithm: SHA256_OID }),
    // signedAttrs omitted intentionally (NOATTR)
    signatureAlgorithm: new SignatureAlgorithmIdentifier({ algorithm: profile.compositeOid }),
    signature: new OctetString(toArrayBuffer(compositeSig)),
  })

  const signedData = new SignedData({
    version: CMSVersion.v1,
    digestAlgorithms: new DigestAlgorithmIdentifiers([
      new DigestAlgorithmIdentifier({ algorithm: SHA256_OID }),
    ]),
    encapContentInfo: new EncapsulatedContentInfo({
      eContentType: id_data,
      eContent: new EncapsulatedContent({
        single: new OctetString(toArrayBuffer(payload)),
      }),
    }),
    certificates: new CertificateSet([new CertificateChoices({ certificate: cert })]),
    signerInfos: new SignerInfos([signerInfo]),
  })

  const contentInfo = new ContentInfo({
    contentType: id_signedData,
    content: AsnConvert.serialize(signedData),
  })

  return new Uint8Array(AsnConvert.serialize(contentInfo))
}

export interface CompositeCmsVerifyResult {
  ok: boolean
  payload?: Uint8Array
  detail?: string
}

/** Verifies a CMS ContentInfo produced by buildCompositeCmsSignedData (or any
 *  spec-conformant composite signer). Returns the payload on success.
 *
 *  Two-stage verification per draft-19 §3.3:
 *    1. Split composite signature → (mldsaSig, classicalSig) at the
 *       ML-DSA signature's fixed length
 *    2. Split composite pubkey → (mldsaPub, classicalPub) at the
 *       ML-DSA pubkey's fixed length
 *    3. Recompute M' over the eContent
 *    4. Verify both halves; require both to pass */
export async function verifyCompositeCmsSignedData(
  profile: CompositeProfileDraft19,
  cmsP7mDer: Uint8Array,
  signerCertDer: Uint8Array
): Promise<CompositeCmsVerifyResult> {
  try {
    const contentInfo = AsnConvert.parse(toArrayBuffer(cmsP7mDer), ContentInfo)
    if (contentInfo.contentType !== id_signedData) {
      return {
        ok: false,
        detail: `expected SignedData (${id_signedData}), got ${contentInfo.contentType}`,
      }
    }
    const signedData = AsnConvert.parse(contentInfo.content, SignedData)

    const encap = signedData.encapContentInfo.eContent
    if (!encap || !encap.single) {
      return { ok: false, detail: 'eContent missing — detached composite signatures not supported' }
    }
    const payload = new Uint8Array(encap.single.buffer)

    const signerInfo = [...signedData.signerInfos].find(
      (si) => si.signatureAlgorithm.algorithm === profile.compositeOid
    )
    if (!signerInfo) {
      return { ok: false, detail: `no SignerInfo with composite OID ${profile.compositeOid}` }
    }
    if (signerInfo.signedAttrs && signerInfo.signedAttrs.length > 0) {
      return { ok: false, detail: 'composite verifier only supports NOATTR signers' }
    }

    const sigBytes = new Uint8Array(signerInfo.signature.buffer)
    const mldsaSigLen = profile.mldsaSigBytes
    if (sigBytes.length <= mldsaSigLen) {
      return {
        ok: false,
        detail: `composite signature too short (${sigBytes.length} ≤ ${mldsaSigLen})`,
      }
    }
    const mldsaSig = sigBytes.subarray(0, mldsaSigLen)
    const classicalSig = sigBytes.subarray(mldsaSigLen)

    const cert = AsnConvert.parse(toArrayBuffer(signerCertDer), Certificate)
    const compositePub = new Uint8Array(cert.tbsCertificate.subjectPublicKeyInfo.subjectPublicKey)
    const mldsaPubLen = mldsaPubBytes(profile)
    if (compositePub.length <= mldsaPubLen) {
      return {
        ok: false,
        detail: `composite pubkey too short (${compositePub.length} ≤ ${mldsaPubLen})`,
      }
    }
    const mldsaPub = compositePub.subarray(0, mldsaPubLen)
    const classicalPub = compositePub.subarray(mldsaPubLen)

    const mPrime = await buildCompositeMessageRepresentative(profile, payload, new Uint8Array(0))
    const mldsaCtx = new TextEncoder().encode(profile.signatureLabel)

    const mldsa = selectMldsa(profile)
    let mldsaOk = false
    try {
      mldsaOk = mldsa.verify(mldsaSig, mPrime, mldsaPub, { context: mldsaCtx })
    } catch (err) {
      return { ok: false, detail: `ML-DSA verify threw: ${String(err)}` }
    }
    if (!mldsaOk) {
      return { ok: false, detail: 'ML-DSA half FAILED' }
    }

    const classicalOk = await verifyClassical(profile, classicalPub, classicalSig, mPrime)
    if (!classicalOk) {
      return { ok: false, detail: 'classical half FAILED' }
    }

    return { ok: true, payload }
  } catch (err) {
    return {
      ok: false,
      detail: `verify exception: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

async function verifyClassical(
  profile: CompositeProfileDraft19,
  pub: Uint8Array,
  sig: Uint8Array,
  mPrime: Uint8Array
): Promise<boolean> {
  // RSA-PSS-SHA256: pub is raw DER RSAPublicKey, sig is raw modulus-length octets
  if (profile.compositeOid === COMPOSITE_PROFILE_MLDSA44_RSA2048_PSS_SHA256.compositeOid) {
    try {
      const spki = wrapRsaPublicKeyInSpki(pub)
      const cryptoKey = await crypto.subtle.importKey(
        'spki',
        spki as BufferSource,
        { name: 'RSA-PSS', hash: 'SHA-256' },
        false,
        ['verify']
      )
      // WebCrypto RSA-PSS hashes the input internally; pass mPrime as-is
      return await crypto.subtle.verify(
        { name: 'RSA-PSS', saltLength: 32 } as RsaPssParams,
        cryptoKey,
        sig as BufferSource,
        mPrime as BufferSource
      )
    } catch {
      return false
    }
  }
  // ECDSA P-256-SHA-512 / P-384-SHA-512: pub = uncompressed point (0x04|X|Y),
  // sig = DER ECDSA-Sig-Value SEQUENCE { r, s }.
  //
  // CRITICAL: pass `lowS: false`. @noble/curves defaults to `lowS: true`
  // (Bitcoin/Ethereum malleability rule, BIP-62) which rejects ~half of
  // mathematically-valid ECDSA signatures whose `s` falls in the upper
  // half of [1, n-1]. RFC 5480 / RFC 6090 / X.509 / CMS make NO such
  // requirement — softhsm + OpenSSL emit raw r||s without S normalization.
  // Without lowS:false here, half of all composite verifications fail.
  const curve =
    profile.compositeOid === COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512.compositeOid ? p256 : p384
  try {
    const msgHash = new Uint8Array(await crypto.subtle.digest('SHA-512', mPrime as BufferSource))
    return curve.verify(sig, msgHash, pub, { format: 'der', prehash: false, lowS: false })
  } catch {
    return false
  }
}

/** Wrap a raw RSAPublicKey DER blob in an SPKI envelope so it can be passed
 *  to WebCrypto importKey('spki', ...). Hand-rolled DER; the SPKI structure
 *  is fixed for rsaEncryption + NULL params + BIT STRING(0, RSAPublicKey). */
function wrapRsaPublicKeyInSpki(rsaPublicKeyDer: Uint8Array): Uint8Array {
  // AlgorithmIdentifier: SEQUENCE { OID rsaEncryption (1.2.840.113549.1.1.1), NULL }
  const algId = new Uint8Array([
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00,
  ])
  // BIT STRING content: unused bits byte (0) || RSAPublicKey DER
  const bitContent = new Uint8Array(1 + rsaPublicKeyDer.length)
  bitContent[0] = 0
  bitContent.set(rsaPublicKeyDer, 1)
  const bitString = derWrap(0x03, bitContent)
  const seqContent = new Uint8Array(algId.length + bitString.length)
  seqContent.set(algId, 0)
  seqContent.set(bitString, algId.length)
  return derWrap(0x30, seqContent)
}

function derWrap(tag: number, content: Uint8Array): Uint8Array {
  const lenBytes = derLen(content.length)
  const out = new Uint8Array(1 + lenBytes.length + content.length)
  out[0] = tag
  out.set(lenBytes, 1)
  out.set(content, 1 + lenBytes.length)
  return out
}

function derLen(n: number): Uint8Array {
  if (n < 0x80) return new Uint8Array([n])
  const bytes: number[] = []
  let v = n
  while (v > 0) {
    bytes.unshift(v & 0xff)
    v >>>= 8
  }
  bytes.unshift(0x80 | bytes.length)
  return new Uint8Array(bytes)
}

/** Convert a raw ECDSA r||s signature (as emitted by PKCS#11 CKM_ECDSA) into
 *  DER ECDSA-Sig-Value. Used by the worker's classical signer adapter so the
 *  signature emitted into the composite blob is spec-compliant per RFC 5480
 *  / draft-19 §4.3.
 *
 *  rawRs MUST be a fixed-width concat (2 × component-length): 64 bytes for
 *  P-256, 96 for P-384. We split in half, INTEGER-encode each, wrap as
 *  SEQUENCE. INTEGER encoding strips leading 0x00 padding except where
 *  needed to keep the high bit clear (positive integers per X.690 §8.3). */
export function ecdsaRawRsToDer(rawRs: Uint8Array): Uint8Array {
  if (rawRs.length % 2 !== 0) {
    throw new Error(`ECDSA raw r||s must be even length; got ${rawRs.length}`)
  }
  const half = rawRs.length / 2
  const r = derInteger(rawRs.subarray(0, half))
  const s = derInteger(rawRs.subarray(half))
  const body = new Uint8Array(r.length + s.length)
  body.set(r, 0)
  body.set(s, r.length)
  return derWrap(0x30, body)
}

function derInteger(bytes: Uint8Array): Uint8Array {
  // Strip leading zero bytes
  let i = 0
  while (i < bytes.length - 1 && bytes[i] === 0) i++
  let trimmed = bytes.subarray(i)
  // Prepend 0x00 if high bit is set (DER positive-integer rule)
  if (trimmed[0] !== undefined && (trimmed[0] & 0x80) !== 0) {
    const padded = new Uint8Array(trimmed.length + 1)
    padded[0] = 0
    padded.set(trimmed, 1)
    trimmed = padded
  }
  return derWrap(0x02, trimmed)
}
