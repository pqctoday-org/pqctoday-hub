// SPDX-License-Identifier: GPL-3.0-only
// X.509 signature, chain and profile verification for the hybrid-certificate
// workshop — every format except composite, which compositeVerifier.ts owns.
//
// Why a separate verifier: the workshop signs inside SoftHSM (PKCS#11). This
// file verifies with @noble only, so a certificate is checked by a different
// implementation from the one that produced it. Before 2026-09-30 nothing
// verified the pure, Alt-Sig, Related or KEM certificates at all, which is how
// a raw r||s ECDSA value sat in X.509 signature fields unnoticed.
//
// It also checks the profile facts a card displays — key usage bits and
// criticality, basic constraints — against the DER, so the card cannot claim
// an extension the certificate does not carry.
import { AsnConvert } from '@peculiar/asn1-schema'
import {
  Certificate,
  TBSCertificate,
  Extensions,
  KeyUsage,
  BasicConstraints,
  SubjectPublicKeyInfo,
} from '@peculiar/asn1-x509'
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js'
import { slh_dsa_sha2_128s } from '@noble/post-quantum/slh-dsa.js'
import { p256 } from '@noble/curves/nist.js'
import { sha256 } from '@noble/hashes/sha2.js'

const OID = {
  mlDsa44: '2.16.840.1.101.3.4.3.17',
  mlDsa65: '2.16.840.1.101.3.4.3.18',
  mlDsa87: '2.16.840.1.101.3.4.3.19',
  slhDsaSha2_128s: '2.16.840.1.101.3.4.3.20',
  ecdsaSha256: '1.2.840.10045.4.3.2',
  unsigned: '1.3.6.1.5.5.7.6.36',
  keyUsage: '2.5.29.15',
  basicConstraints: '2.5.29.19',
  altSigPubKey: '2.5.29.72',
  altSigAlg: '2.5.29.73',
  altSigValue: '2.5.29.74',
  relatedCert: '1.3.6.1.5.5.7.1.36',
  sha256: '2.16.840.1.101.3.4.2.1',
} as const

export const KEY_USAGE_BITS = [
  'digitalSignature',
  'nonRepudiation',
  'keyEncipherment',
  'dataEncipherment',
  'keyAgreement',
  'keyCertSign',
  'cRLSign',
  'encipherOnly',
  'decipherOnly',
] as const
export type KeyUsageBit = (typeof KEY_USAGE_BITS)[number]

/** One named check and its outcome, for the per-format verification report. */
export interface VerificationCheck {
  name: string
  ok: boolean
  detail?: string
}

export function parseCertificate(der: Uint8Array): Certificate {
  return AsnConvert.parse(der, Certificate)
}

function tbsDer(cert: Certificate): Uint8Array {
  return new Uint8Array(AsnConvert.serialize(cert.tbsCertificate))
}

/** Raw subjectPublicKey bytes (the BIT STRING content) of an SPKI. */
export function spkiKeyBytes(spki: SubjectPublicKeyInfo): Uint8Array {
  return new Uint8Array(spki.subjectPublicKey)
}

/**
 * Verify `signature` over `message` with the public key described by
 * `spki`, under the signature algorithm `sigOid`. Supports exactly the
 * algorithms the workshop issues with; anything else is reported, not guessed.
 */
export function verifyWithSpki(
  sigOid: string,
  spki: SubjectPublicKeyInfo,
  message: Uint8Array,
  signature: Uint8Array
): { ok: boolean; detail?: string } {
  const pub = spkiKeyBytes(spki)
  const keyOid = spki.algorithm.algorithm
  try {
    switch (sigOid) {
      case OID.mlDsa44:
      case OID.mlDsa65:
      case OID.mlDsa87: {
        if (keyOid !== sigOid) return { ok: false, detail: `key ${keyOid} ≠ signature ${sigOid}` }
        const impl =
          sigOid === OID.mlDsa44 ? ml_dsa44 : sigOid === OID.mlDsa65 ? ml_dsa65 : ml_dsa87
        // RFC 9881: certificate signatures use the empty context string.
        return { ok: impl.verify(signature, message, pub) }
      }
      case OID.slhDsaSha2_128s: {
        if (keyOid !== sigOid) return { ok: false, detail: `key ${keyOid} ≠ signature ${sigOid}` }
        return { ok: slh_dsa_sha2_128s.verify(signature, message, pub) }
      }
      case OID.ecdsaSha256: {
        // X.509 carries an Ecdsa-Sig-Value (DER). A raw r||s value is a
        // malformed certificate, so it must fail here rather than be accepted.
        if (signature[0] !== 0x30) {
          return { ok: false, detail: 'ECDSA signature is not a DER Ecdsa-Sig-Value' }
        }
        return {
          // lowS: false — RFC 3279 allows either S; PKCS#11 tokens emit
          // high-S about half the time, and noble's default would reject them.
          ok: p256.verify(signature, sha256(message), pub, {
            prehash: false,
            format: 'der',
            lowS: false,
          }),
        }
      }
      case OID.unsigned:
        return { ok: false, detail: 'id-alg-unsigned carries no signature to verify' }
      default:
        return { ok: false, detail: `unsupported signature algorithm ${sigOid}` }
    }
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Verify `cert`'s signature with `issuer`'s public key (pass the cert itself
 * for a self-signed certificate) and that the issuer/subject names chain.
 */
export function verifyIssuedBy(cert: Certificate, issuer: Certificate): VerificationCheck[] {
  const checks: VerificationCheck[] = []
  const sigOid = cert.signatureAlgorithm.algorithm
  const sig = verifyWithSpki(
    sigOid,
    issuer.tbsCertificate.subjectPublicKeyInfo,
    tbsDer(cert),
    new Uint8Array(cert.signatureValue)
  )
  checks.push({ name: 'Certificate signature verifies', ok: sig.ok, detail: sig.detail })
  const issuerName = new Uint8Array(AsnConvert.serialize(cert.tbsCertificate.issuer))
  const subjectOfIssuer = new Uint8Array(AsnConvert.serialize(issuer.tbsCertificate.subject))
  checks.push({
    name: 'Issuer name matches the signing certificate',
    ok: bytesEqual(issuerName, subjectOfIssuer),
  })
  if (cert !== issuer) {
    const bc = readBasicConstraints(issuer)
    const ku = readKeyUsage(issuer)
    checks.push({
      name: 'Issuer is a CA allowed to sign certificates',
      ok: bc?.cA === true && (ku === null || ku.bits.includes('keyCertSign')),
    })
  }
  return checks
}

function findExtension(cert: Certificate, oid: string) {
  return cert.tbsCertificate.extensions?.find((e) => e.extnID === oid)
}

export function readKeyUsage(cert: Certificate): { bits: KeyUsageBit[]; critical: boolean } | null {
  const ext = findExtension(cert, OID.keyUsage)
  if (!ext) return null
  const ku = AsnConvert.parse(ext.extnValue.buffer, KeyUsage)
  // KeyUsage extends BitString; toNumber() gives bit 0 (digitalSignature) as 1.
  const value = ku.toNumber()
  const bits = KEY_USAGE_BITS.filter((_, i) => (value & (1 << i)) !== 0)
  return { bits: [...bits], critical: ext.critical === true }
}

export function readBasicConstraints(cert: Certificate): { cA: boolean; critical: boolean } | null {
  const ext = findExtension(cert, OID.basicConstraints)
  if (!ext) return null
  const bc = AsnConvert.parse(ext.extnValue.buffer, BasicConstraints)
  return { cA: bc.cA === true, critical: ext.critical === true }
}

/** Check the key usage and basic constraints a profile requires. */
export function checkProfile(
  cert: Certificate,
  expected: { keyUsage: KeyUsageBit[]; cA: boolean }
): VerificationCheck[] {
  const ku = readKeyUsage(cert)
  const bc = readBasicConstraints(cert)
  const want = [...expected.keyUsage].sort().join(',')
  return [
    {
      name: `keyUsage is critical and exactly {${expected.keyUsage.join(', ')}}`,
      ok: ku !== null && ku.critical && [...ku.bits].sort().join(',') === want,
      detail: ku ? `found {${ku.bits.join(', ')}}, critical=${ku.critical}` : 'no keyUsage',
    },
    {
      name: `basicConstraints is critical with cA=${expected.cA}`,
      ok: bc !== null && bc.critical && bc.cA === expected.cA,
      detail: bc ? `found cA=${bc.cA}, critical=${bc.critical}` : 'no basicConstraints',
    },
  ]
}

// ---------------------------------------------------------------------------
// Alternative signature (ITU-T X.509 (10/2019) §7.2.2)
// ---------------------------------------------------------------------------

/** Top-level TLV elements of a DER SEQUENCE, each returned with its header. */
export function derSequenceChildren(der: Uint8Array): Uint8Array[] {
  const readLen = (off: number): { len: number; hdr: number } => {
    const first = der[off + 1]
    if ((first & 0x80) === 0) return { len: first, hdr: 2 }
    const n = first & 0x7f
    let len = 0
    for (let i = 0; i < n; i++) len = len * 256 + der[off + 2 + i]
    return { len, hdr: 2 + n }
  }
  if (der[0] !== 0x30) throw new Error('not a DER SEQUENCE')
  const outer = readLen(0)
  const out: Uint8Array[] = []
  let off = outer.hdr
  const end = outer.hdr + outer.len
  while (off < end) {
    const { len, hdr } = readLen(off)
    out.push(der.subarray(off, off + hdr + len))
    off += hdr + len
  }
  if (off !== der.length) throw new Error('trailing bytes after SEQUENCE')
  return out
}

/** DER SEQUENCE wrapping already-encoded children. */
export function derSequence(children: Uint8Array[]): Uint8Array {
  const len = children.reduce((s, c) => s + c.length, 0)
  const lenBytes: number[] = []
  if (len < 0x80) lenBytes.push(len)
  else {
    for (let v = len; v > 0; v >>>= 8) lenBytes.unshift(v & 0xff)
    lenBytes.unshift(0x80 | lenBytes.length)
  }
  const out = new Uint8Array(1 + lenBytes.length + len)
  out[0] = 0x30
  out.set(lenBytes, 1)
  let off = 1 + lenBytes.length
  for (const c of children) {
    out.set(c, off)
    off += c.length
  }
  return out
}

/**
 * The bytes an alternative signature covers, per ITU-T X.509 (10/2019)
 * §7.2.2: the TBSCertificate with the altSignatureValue extension removed
 * AND the `signature` component removed. Keeping the `signature`
 * AlgorithmIdentifier — what this workshop did until 2026-09-30 — produces
 * an alternative signature no conformant verifier accepts.
 */
export function altSignatureInput(tbs: TBSCertificate): Uint8Array {
  const copy = AsnConvert.parse(AsnConvert.serialize(tbs), TBSCertificate)
  copy.extensions = new Extensions(
    (copy.extensions ?? []).filter((e) => e.extnID !== OID.altSigValue)
  )
  const children = derSequenceChildren(new Uint8Array(AsnConvert.serialize(copy)))
  // TBSCertificate: [0] version, serialNumber, signature, issuer, ...
  // A v3 certificate always carries the explicit version, so `signature` is
  // the third element.
  if (children[0][0] !== 0xa0) throw new Error('expected an explicit v3 version field')
  return derSequence([children[0], children[1], ...children.slice(3)])
}

/** Verify both the conventional and the alternative signature of an Alt-Sig cert. */
export function verifyAltSigCert(cert: Certificate): VerificationCheck[] {
  const checks = verifyIssuedBy(cert, cert)
  const altKey = findExtension(cert, OID.altSigPubKey)
  const altAlg = findExtension(cert, OID.altSigAlg)
  const altVal = findExtension(cert, OID.altSigValue)
  if (!altKey || !altAlg || !altVal) {
    checks.push({ name: 'Alternative-signature extensions present', ok: false })
    return checks
  }
  const spki = AsnConvert.parse(altKey.extnValue.buffer, SubjectPublicKeyInfo)
  const algOid = readAlgorithmOid(new Uint8Array(altAlg.extnValue.buffer))
  const sigBits = new Uint8Array(altVal.extnValue.buffer)
  // AltSignatureValue ::= BIT STRING — skip tag, length and the unused-bits byte.
  const sigStart = sigBits[1] & 0x80 ? 2 + (sigBits[1] & 0x7f) + 1 : 3
  const altSig = sigBits.subarray(sigStart)
  const alt = verifyWithSpki(algOid, spki, altSignatureInput(cert.tbsCertificate), altSig)
  checks.push({
    name: 'Alternative signature verifies over the X.509 §7.2.2 input',
    ok: alt.ok,
    detail: alt.detail,
  })
  return checks
}

function readAlgorithmOid(algIdDer: Uint8Array): string {
  // AlgorithmIdentifier ::= SEQUENCE { algorithm OID, ... }
  const oidTlv = derSequenceChildren(algIdDer)[0]
  const body = oidTlv.subarray(2)
  const parts = [Math.floor(body[0] / 40), body[0] % 40]
  let v = 0
  for (let i = 1; i < body.length; i++) {
    v = v * 128 + (body[i] & 0x7f)
    if ((body[i] & 0x80) === 0) {
      parts.push(v)
      v = 0
    }
  }
  return parts.join('.')
}

// ---------------------------------------------------------------------------
// Related Certificates (RFC 9763)
// ---------------------------------------------------------------------------

/**
 * Check that Cert B's RelatedCertificate extension holds the hash of the
 * complete final DER of Cert A — a one-way reference, not a mutual one.
 */
export function verifyRelatedCertificate(certB: Certificate, certADer: Uint8Array) {
  const ext = findExtension(certB, OID.relatedCert)
  if (!ext) return { name: 'Cert B carries a RelatedCertificate extension', ok: false }
  const [algId, hashValue] = derSequenceChildren(new Uint8Array(ext.extnValue.buffer))
  const hashOid = readAlgorithmOid(algId)
  if (hashOid !== OID.sha256) {
    return { name: 'RelatedCertificate hash algorithm', ok: false, detail: `${hashOid}` }
  }
  const stored = hashValue.subarray(2)
  const expected = sha256(certADer)
  return {
    name: 'RelatedCertificate hash equals SHA-256 of the final Cert A',
    ok: bytesEqual(stored, expected) && ext.critical !== true,
    detail: ext.critical ? 'extension must not be critical' : undefined,
  }
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

// ---------------------------------------------------------------------------
// Chameleon (historical — draft-bonnell-lamps-chameleon-certs-07)
// ---------------------------------------------------------------------------

const DELTA_CERT_DESC_OID = '2.16.840.1.114027.80.6.1'

/**
 * Rebuild the paired (delta) certificate from a Chameleon primary: copy the
 * primary TBSCertificate, drop the DeltaCertificateDescriptor extension, and
 * replace serialNumber, signature algorithm and subjectPublicKeyInfo with the
 * descriptor's values. Supports the descriptor shape this workshop emits:
 * SEQUENCE { serialNumber, [0] signature AlgorithmIdentifier,
 * subjectPublicKeyInfo, signatureValue BIT STRING }.
 */
export function reconstructChameleonDelta(primary: Certificate): Certificate {
  const ext = findExtension(primary, DELTA_CERT_DESC_OID)
  if (!ext) throw new Error('no DeltaCertificateDescriptor extension')
  const [serial, sigAlgTagged, spki, sigBits] = derSequenceChildren(
    new Uint8Array(ext.extnValue.buffer)
  )
  if (sigAlgTagged[0] !== 0xa0) throw new Error('descriptor has no [0] signature field')
  const sigAlgDer = sigAlgTagged.subarray(sigAlgTagged[1] & 0x80 ? 2 + (sigAlgTagged[1] & 0x7f) : 2)

  const tbs = AsnConvert.parse(AsnConvert.serialize(primary.tbsCertificate), TBSCertificate)
  tbs.extensions = new Extensions(
    (tbs.extensions ?? []).filter((e) => e.extnID !== DELTA_CERT_DESC_OID)
  )
  const children = derSequenceChildren(new Uint8Array(AsnConvert.serialize(tbs)))
  // [0] version, serialNumber, signature, issuer, validity, subject, spki, [3] extensions
  const rebuilt = derSequence([
    children[0],
    serial,
    sigAlgDer,
    children[3],
    children[4],
    children[5],
    spki,
    ...children.slice(7),
  ])
  const sigStart = sigBits[1] & 0x80 ? 2 + (sigBits[1] & 0x7f) + 1 : 3
  const certDer = derSequence([rebuilt, sigAlgDer, sigBits])
  const cert = parseCertificate(certDer)
  if (new Uint8Array(cert.signatureValue).length !== sigBits.length - sigStart) {
    throw new Error('delta signature length mismatch')
  }
  return cert
}

/** Verify a Chameleon primary and the delta certificate it encodes. */
export function verifyChameleonCert(primary: Certificate): VerificationCheck[] {
  const checks = verifyIssuedBy(primary, primary).map((c) => ({
    ...c,
    name: `Primary: ${c.name}`,
  }))
  try {
    const delta = reconstructChameleonDelta(primary)
    for (const c of verifyIssuedBy(delta, delta)) {
      checks.push({ ...c, name: `Reconstructed delta: ${c.name}` })
    }
  } catch (e) {
    checks.push({
      name: 'Delta certificate reconstructs from the descriptor',
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    })
  }
  return checks
}
