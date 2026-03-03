// SPDX-License-Identifier: GPL-3.0-only
// Minimal pure-TypeScript ASN.1 DER X.509 self-signed certificate builder.
// No external dependencies. Companion to derParser.ts (read side).
// Supports building real X.509 v3 certificates signed by an arbitrary signer function
// (e.g. liboqs SLH-DSA) when OpenSSL WASM does not include the required algorithm.

import { parseCertificateInfo, oidToLabel } from './derParser'

// ---------------------------------------------------------------------------
// DER encoding primitives
// ---------------------------------------------------------------------------

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) {
    result.set(a, offset)
    offset += a.length
  }
  return result
}

function encodeLength(n: number): Uint8Array {
  if (n < 0x80) return new Uint8Array([n])
  if (n < 0x100) return new Uint8Array([0x81, n])
  if (n < 0x10000) return new Uint8Array([0x82, (n >> 8) & 0xff, n & 0xff])
  return new Uint8Array([0x83, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff])
}

function tlv(tag: number, value: Uint8Array): Uint8Array {
  return concat(new Uint8Array([tag]), encodeLength(value.length), value)
}

const seq = (v: Uint8Array) => tlv(0x30, v)
const set_ = (v: Uint8Array) => tlv(0x31, v)

/** BIT STRING with no unused bits (0x00 prefix byte) */
const bitStr = (v: Uint8Array) => tlv(0x03, concat(new Uint8Array([0x00]), v))

/** INTEGER — value bytes must already be a positive DER integer */
const int_ = (v: Uint8Array) => tlv(0x02, v)

const oidTlv = (v: Uint8Array) => tlv(0x06, v)
const utf8Str = (s: string) => tlv(0x0c, new TextEncoder().encode(s))
const octetStr = (v: Uint8Array) => tlv(0x04, v)

/** [N] EXPLICIT context-specific constructed wrapper */
const ctxExplicit = (n: number, v: Uint8Array) => tlv(0xa0 | n, v)

function encodeUtcTime(d: Date): Uint8Array {
  const pad2 = (n: number) => n.toString().padStart(2, '0')
  // YYMMDDHHMMSSZ — valid for dates 2000–2049
  const s = `${d.getUTCFullYear().toString().slice(-2)}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  return tlv(0x17, new TextEncoder().encode(s))
}

// ---------------------------------------------------------------------------
// Name / DN encoding
// ---------------------------------------------------------------------------

// Attribute OIDs (pre-encoded)
const OID_CN = new Uint8Array([0x55, 0x04, 0x03]) // 2.5.4.3
const OID_O = new Uint8Array([0x55, 0x04, 0x0a]) // 2.5.4.10
const OID_OU = new Uint8Array([0x55, 0x04, 0x0b]) // 2.5.4.11

/**
 * Encodes a subject string like `/CN=foo/O=bar/OU=baz` into a DER RDNSequence.
 * Each component becomes a separate RDN (SET containing one AttributeTypeAndValue).
 */
function encodeName(subject: string): Uint8Array {
  const parts: Uint8Array[] = []
  const regex = /(CN|O|OU)=([^/]+)/g
  let m: RegExpExecArray | null
  while ((m = regex.exec(subject)) !== null) {
    const [, key, value] = m
    const attrOid = key === 'CN' ? OID_CN : key === 'O' ? OID_O : OID_OU
    // AttributeTypeAndValue ::= SEQUENCE { type OID, value ANY }
    const atv = seq(concat(oidTlv(attrOid), utf8Str(value)))
    // RelativeDistinguishedName ::= SET OF AttributeTypeAndValue
    parts.push(set_(atv))
  }
  // Name ::= SEQUENCE OF RelativeDistinguishedName
  return seq(concat(...parts))
}

// ---------------------------------------------------------------------------
// AlgorithmIdentifier
// ---------------------------------------------------------------------------

/**
 * AlgorithmIdentifier with absent parameters (required for SLH-DSA per RFC 9909).
 * SEQUENCE { algorithm OID }
 */
function encodeAlgId(algOidBytes: Uint8Array): Uint8Array {
  return seq(oidTlv(algOidBytes))
}

// ---------------------------------------------------------------------------
// SubjectPublicKeyInfo
// ---------------------------------------------------------------------------

function encodeSPKI(algOidBytes: Uint8Array, pubKey: Uint8Array): Uint8Array {
  return seq(concat(encodeAlgId(algOidBytes), bitStr(pubKey)))
}

// ---------------------------------------------------------------------------
// Extensions
// ---------------------------------------------------------------------------

/**
 * Encodes the v3 extensions block with BasicConstraints (non-CA).
 * [3] EXPLICIT SEQUENCE OF Extension
 */
function encodeExtensions(): Uint8Array {
  // BasicConstraints OID: 2.5.29.19 → [0x55, 0x1d, 0x13]
  const bcOid = new Uint8Array([0x55, 0x1d, 0x13])
  // Value: OCTET STRING wrapping DER-encoded BasicConstraints = SEQUENCE {} (cA: FALSE = default)
  const bcValue = seq(new Uint8Array(0)) // empty SEQUENCE → cA absent (defaults FALSE)
  const bcExt = seq(concat(oidTlv(bcOid), octetStr(bcValue)))
  // extensions [3] EXPLICIT SEQUENCE OF Extension
  return ctxExplicit(3, seq(bcExt))
}

// ---------------------------------------------------------------------------
// Serial number
// ---------------------------------------------------------------------------

/**
 * Generates a random 16-byte positive DER INTEGER for use as certificate serial number.
 * High bit is masked to zero to ensure positivity without a leading 0x00 pad.
 */
function generateSerial(): Uint8Array {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[0] &= 0x7f // ensure positive integer
  return int_(bytes)
}

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------

/** [0] EXPLICIT INTEGER (2) = v3 */
function encodeVersion(): Uint8Array {
  return ctxExplicit(0, int_(new Uint8Array([0x02])))
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * OID bytes for SLH-DSA-SHA2-128s (2.16.840.1.101.3.4.3.20)
 * Per FIPS 205 / RFC 9909.
 */
export const SLH_DSA_SHA2_128S_OID = new Uint8Array([
  0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x03, 0x14,
])

/**
 * Builds a DER-encoded X.509 v3 self-signed certificate.
 *
 * @param publicKey   Raw public key bytes (e.g. 32 bytes for SLH-DSA-SHA2-128s)
 * @param signerFn    Async function that signs the TBSCertificate DER bytes
 * @param algOidBytes Pre-encoded OID bytes for the signature algorithm (and public key type)
 * @param subject     Subject/Issuer DN string in OpenSSL slash format: `/CN=.../O=.../OU=...`
 * @returns           DER-encoded Certificate
 */
export async function buildSelfSignedX509(
  publicKey: Uint8Array,
  signerFn: (tbs: Uint8Array) => Promise<Uint8Array>,
  algOidBytes: Uint8Array,
  subject: string
): Promise<Uint8Array> {
  const now = new Date()
  const notAfter = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

  const name = encodeName(subject)
  const algId = encodeAlgId(algOidBytes)

  // TBSCertificate ::= SEQUENCE { version, serial, signature, issuer, validity, subject, spki, extensions }
  const tbs = seq(
    concat(
      encodeVersion(),
      generateSerial(),
      algId, // signature algorithm inside TBS
      name, // issuer (self-signed: issuer = subject)
      seq(concat(encodeUtcTime(now), encodeUtcTime(notAfter))), // validity
      name, // subject
      encodeSPKI(algOidBytes, publicKey),
      encodeExtensions()
    )
  )

  const signature = await signerFn(tbs)

  // Certificate ::= SEQUENCE { tbsCertificate, signatureAlgorithm, signatureValue }
  return seq(concat(tbs, algId, bitStr(signature)))
}

/**
 * Wraps DER bytes in PEM armor (e.g. `-----BEGIN CERTIFICATE-----`).
 * Uses a char-by-char loop for btoa to safely handle large buffers (e.g. 8KB SLH-DSA certs).
 */
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

/**
 * Builds an `openssl x509 -text -noout` style summary from a DER certificate.
 * Uses parseCertificateInfo from derParser.ts for structural extraction.
 */
export function buildParsedText(
  der: Uint8Array,
  subject: string,
  notBefore: Date,
  notAfter: Date
): string {
  const info = parseCertificateInfo(der)
  const algLabel = oidToLabel(info.algorithmOID)

  const formatDate = (d: Date): string => d.toUTCString().replace('GMT', 'GMT').replace(',', '')

  // Convert /CN=foo/O=bar into "CN=foo, O=bar"
  const dnDisplay = subject.split('/').filter(Boolean).join(', ')

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
    '    Subject Public Key Info:',
    `        Public Key Algorithm: ${algLabel}`,
    `            Public-Key: (${info.publicKeySizeBytes * 8} bit)`,
    `    X509v3 extensions:`,
    `        X509v3 Basic Constraints:`,
    `            CA:FALSE`,
    `    Signature Algorithm: ${algLabel}`,
    `    Signature Value: ${info.signatureSizeBytes} bytes`,
  ].join('\n')
}
