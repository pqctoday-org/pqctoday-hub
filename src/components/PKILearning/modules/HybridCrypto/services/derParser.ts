// SPDX-License-Identifier: GPL-3.0-only
// Minimal pure-TypeScript ASN.1 DER parser for educational certificate inspection.
// No external dependencies. Handles X.509 certificate structure to extract:
//   - Algorithm OIDs (signatureAlgorithm, subjectPublicKeyInfo)
//   - Extension OIDs from the v3 extensions block
//   - BIT STRING lengths for key/signature sizing

/** Result from parsing an X.509 certificate DER structure. */
export interface CertInfo {
  /** OID from the outer signatureAlgorithm SEQUENCE */
  algorithmOID: string
  /** OID from subjectPublicKeyInfo algorithm SEQUENCE */
  publicKeyOID: string
  /** All extension OIDs found in the v3 extensions [3] block */
  extensionOIDs: string[]
  /** Outer signature BIT STRING byte count (excluding unused-bits byte) */
  signatureSizeBytes: number
  /** subjectPublicKeyInfo BIT STRING byte count (excluding unused-bits byte) */
  publicKeySizeBytes: number
}

// ---------------------------------------------------------------------------
// DER tag constants
// ---------------------------------------------------------------------------
const TAG_INTEGER = 0x02
const TAG_BIT_STRING = 0x03
const TAG_OID = 0x06
const TAG_SEQUENCE = 0x30
const CONTEXT_CONSTRUCTED_3 = 0xa3 // [3] EXPLICIT (extensions)

// ---------------------------------------------------------------------------
// Low-level DER length decoder
// ---------------------------------------------------------------------------
function readLength(der: Uint8Array, offset: number): { length: number; nextOffset: number } {
  const first = der[offset]
  if (first < 0x80) {
    return { length: first, nextOffset: offset + 1 }
  }
  const numBytes = first & 0x7f
  let length = 0
  for (let i = 0; i < numBytes; i++) {
    length = (length << 8) | der[offset + 1 + i]
  }
  return { length, nextOffset: offset + 1 + numBytes }
}

/** Read a TLV (tag, length, value) starting at `offset`. Returns end offset of the value. */
function readTLV(
  der: Uint8Array,
  offset: number
): { tag: number; valueStart: number; valueEnd: number; nextOffset: number } {
  const tag = der[offset]
  const { length, nextOffset: valueStart } = readLength(der, offset + 1)
  return {
    tag,
    valueStart,
    valueEnd: valueStart + length,
    nextOffset: valueStart + length,
  }
}

// ---------------------------------------------------------------------------
// OID decoding
// ---------------------------------------------------------------------------
function decodeOID(der: Uint8Array, start: number, length: number): string {
  if (length === 0) return ''
  const parts: number[] = []

  // First byte encodes two components: X.Y where X = byte / 40, Y = byte % 40
  const first = der[start]
  parts.push(Math.floor(first / 40))
  parts.push(first % 40)

  let value = 0
  for (let i = 1; i < length; i++) {
    const b = der[start + i]
    if (b & 0x80) {
      value = (value << 7) | (b & 0x7f)
    } else {
      value = (value << 7) | b
      parts.push(value)
      value = 0
    }
  }
  return parts.join('.')
}

// ---------------------------------------------------------------------------
// OID label lookup
// ---------------------------------------------------------------------------
const OID_LABELS: Record<string, string> = {
  // ML-DSA (FIPS 204)
  '2.16.840.1.101.3.4.3.17': 'ML-DSA-44',
  '2.16.840.1.101.3.4.3.18': 'ML-DSA-65',
  '2.16.840.1.101.3.4.3.19': 'ML-DSA-87',
  // ML-KEM (FIPS 203)
  '2.16.840.1.101.3.4.4.1': 'ML-KEM-512',
  '2.16.840.1.101.3.4.4.2': 'ML-KEM-768',
  '2.16.840.1.101.3.4.4.3': 'ML-KEM-1024',
  // SLH-DSA (FIPS 205)
  '2.16.840.1.101.3.4.3.20': 'SLH-DSA-SHA2-128s',
  '2.16.840.1.101.3.4.3.21': 'SLH-DSA-SHA2-128f',
  '2.16.840.1.101.3.4.3.22': 'SLH-DSA-SHA2-192s',
  '2.16.840.1.101.3.4.3.23': 'SLH-DSA-SHA2-192f',
  '2.16.840.1.101.3.4.3.24': 'SLH-DSA-SHA2-256s',
  '2.16.840.1.101.3.4.3.25': 'SLH-DSA-SHA2-256f',
  '2.16.840.1.101.3.4.3.26': 'SLH-DSA-SHAKE-128s',
  '2.16.840.1.101.3.4.3.27': 'SLH-DSA-SHAKE-128f',
  '2.16.840.1.101.3.4.3.28': 'SLH-DSA-SHAKE-192s',
  '2.16.840.1.101.3.4.3.29': 'SLH-DSA-SHAKE-192f',
  '2.16.840.1.101.3.4.3.30': 'SLH-DSA-SHAKE-256s',
  '2.16.840.1.101.3.4.3.31': 'SLH-DSA-SHAKE-256f',
  // ECDSA
  '1.2.840.10045.4.3.2': 'ecdsa-with-SHA256',
  '1.2.840.10045.4.3.3': 'ecdsa-with-SHA384',
  '1.2.840.10045.4.3.4': 'ecdsa-with-SHA512',
  '1.2.840.10045.2.1': 'id-ecPublicKey',
  // EC curves
  '1.2.840.10045.3.1.7': 'P-256',
  '1.3.132.0.34': 'P-384',
  // RSA
  '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
  '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
  '1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
  '1.2.840.113549.1.1.1': 'rsaEncryption',
  // Ed25519 / X25519
  '1.3.101.110': 'X25519',
  '1.3.101.112': 'Ed25519',
  // Composite signatures (draft-ietf-lamps-pq-composite-sigs)
  '1.3.6.1.5.5.7.6.37': 'MLDSA44-RSA2048-PSS-SHA256',
  '1.3.6.1.5.5.7.6.38': 'MLDSA44-RSA2048-PKCS15-SHA256',
  '1.3.6.1.5.5.7.6.39': 'MLDSA44-Ed25519',
  '1.3.6.1.5.5.7.6.40': 'MLDSA44-ECDSA-P256',
  '1.3.6.1.5.5.7.6.41': 'MLDSA65-RSA3072-PSS-SHA512',
  '1.3.6.1.5.5.7.6.42': 'MLDSA65-RSA3072-PKCS15-SHA512',
  '1.3.6.1.5.5.7.6.45': 'MLDSA65-ECDSA-P256-SHA512 (Composite)',
  '1.3.6.1.5.5.7.6.46': 'MLDSA65-ECDSA-P384-SHA512',
  '1.3.6.1.5.5.7.6.48': 'MLDSA65-Ed25519',
  '1.3.6.1.5.5.7.6.49': 'MLDSA87-ECDSA-P384-SHA512',
  // Standard X.509v3 extensions
  '2.5.29.14': 'Subject Key Identifier',
  '2.5.29.15': 'Key Usage',
  '2.5.29.17': 'Subject Alternative Name',
  '2.5.29.19': 'Basic Constraints',
  '2.5.29.31': 'CRL Distribution Points',
  '2.5.29.32': 'Certificate Policies',
  '2.5.29.35': 'Authority Key Identifier',
  '2.5.29.37': 'Extended Key Usage',
  // Alt-sig extensions (catalyst / draft-ietf-lamps-cert-binding-for-multi-auth)
  '2.5.29.72': 'SubjectAltPublicKeyInfo (alt-sig PQC key)',
  '2.5.29.73': 'AltSignatureAlgorithm (alt-sig algorithm)',
  '2.5.29.74': 'AltSignatureValue (alt-sig PQC signature)',
  // Chameleon delta extension (draft-bonnell-lamps-chameleon-certs)
  '2.16.840.1.114027.80.6.1': 'DeltaCertificateDescriptor (chameleon)',
  // Related certs (RFC 9763)
  '1.3.6.1.5.5.7.1.35': 'RelatedCertificate (RFC 9763)',
}

export function oidToLabel(oid: string): string {
  return OID_LABELS[oid] ?? oid
}

// ---------------------------------------------------------------------------
// Certificate parser
// ---------------------------------------------------------------------------

/**
 * Parse an X.509 DER-encoded certificate and extract key structural information.
 * Returns a best-effort result even if the certificate uses unknown OIDs.
 */
export function parseCertificateInfo(der: Uint8Array): CertInfo {
  const result: CertInfo = {
    algorithmOID: '',
    publicKeyOID: '',
    extensionOIDs: [],
    signatureSizeBytes: 0,
    publicKeySizeBytes: 0,
  }

  try {
    // Top-level SEQUENCE: Certificate ::= SEQUENCE { tbs, sigAlg, sigValue }
    if (der[0] !== TAG_SEQUENCE) return result
    const { valueStart: certStart, valueEnd: certEnd } = readTLV(der, 0)
    let pos = certStart

    // --- TBSCertificate (first child SEQUENCE) ---
    if (der[pos] !== TAG_SEQUENCE) return result
    const tbsTLV = readTLV(der, pos)
    const tbsStart = tbsTLV.valueStart
    const tbsEnd = tbsTLV.valueEnd
    pos = tbsTLV.nextOffset

    // --- signatureAlgorithm (second child SEQUENCE) ---
    if (pos < certEnd && der[pos] === TAG_SEQUENCE) {
      const sigAlgTLV = readTLV(der, pos)
      const sigAlgStart = sigAlgTLV.valueStart
      if (der[sigAlgStart] === TAG_OID) {
        const oidTLV = readTLV(der, sigAlgStart)
        result.algorithmOID = decodeOID(der, oidTLV.valueStart, oidTLV.valueEnd - oidTLV.valueStart)
      }
      pos = sigAlgTLV.nextOffset
    }

    // --- signatureValue (third child BIT STRING) ---
    if (pos < certEnd && der[pos] === TAG_BIT_STRING) {
      const sigTLV = readTLV(der, pos)
      // BIT STRING: first byte is unused-bit count; rest is the actual signature
      result.signatureSizeBytes = Math.max(0, sigTLV.valueEnd - sigTLV.valueStart - 1)
    }

    // --- Parse TBSCertificate internals ---
    parseTBS(der, tbsStart, tbsEnd, result)
  } catch {
    // Return best-effort result on parse errors
  }

  return result
}

function parseTBS(der: Uint8Array, start: number, end: number, result: CertInfo): void {
  let pos = start

  // Skip version [0] if present
  if (pos < end && der[pos] === 0xa0) {
    const versionTLV = readTLV(der, pos)
    pos = versionTLV.nextOffset
  }

  // Skip serialNumber INTEGER
  if (pos < end && der[pos] === TAG_INTEGER) {
    pos = readTLV(der, pos).nextOffset
  }

  // Skip signature SEQUENCE (duplicate of outer sigAlg)
  if (pos < end && der[pos] === TAG_SEQUENCE) {
    pos = readTLV(der, pos).nextOffset
  }

  // Skip issuer SEQUENCE
  if (pos < end && der[pos] === TAG_SEQUENCE) {
    pos = readTLV(der, pos).nextOffset
  }

  // Skip validity SEQUENCE
  if (pos < end && der[pos] === TAG_SEQUENCE) {
    pos = readTLV(der, pos).nextOffset
  }

  // Skip subject SEQUENCE
  if (pos < end && der[pos] === TAG_SEQUENCE) {
    pos = readTLV(der, pos).nextOffset
  }

  // subjectPublicKeyInfo SEQUENCE
  if (pos < end && der[pos] === TAG_SEQUENCE) {
    const spkiTLV = readTLV(der, pos)
    const spkiStart = spkiTLV.valueStart
    const spkiEnd = spkiTLV.valueEnd

    // algorithm SEQUENCE inside SPKI
    if (spkiStart < spkiEnd && der[spkiStart] === TAG_SEQUENCE) {
      const algTLV = readTLV(der, spkiStart)
      if (der[algTLV.valueStart] === TAG_OID) {
        const oidTLV = readTLV(der, algTLV.valueStart)
        result.publicKeyOID = decodeOID(der, oidTLV.valueStart, oidTLV.valueEnd - oidTLV.valueStart)
      }
    }

    // subjectPublicKey BIT STRING
    let spkiInner = spkiStart
    // skip algorithm SEQUENCE
    if (spkiInner < spkiEnd && der[spkiInner] === TAG_SEQUENCE) {
      spkiInner = readTLV(der, spkiInner).nextOffset
    }
    if (spkiInner < spkiEnd && der[spkiInner] === TAG_BIT_STRING) {
      const bsTLV = readTLV(der, spkiInner)
      result.publicKeySizeBytes = Math.max(0, bsTLV.valueEnd - bsTLV.valueStart - 1)
    }

    pos = spkiTLV.nextOffset
  }

  // Skip issuerUniqueID [1] and subjectUniqueID [2] if present
  while (pos < end && (der[pos] === 0xa1 || der[pos] === 0xa2)) {
    pos = readTLV(der, pos).nextOffset
  }

  // Extensions [3] EXPLICIT SEQUENCE OF Extension
  if (pos < end && der[pos] === CONTEXT_CONSTRUCTED_3) {
    const extWrapperTLV = readTLV(der, pos)
    // Inside [3] is a SEQUENCE OF Extension
    if (der[extWrapperTLV.valueStart] === TAG_SEQUENCE) {
      const extSeqTLV = readTLV(der, extWrapperTLV.valueStart)
      let extPos = extSeqTLV.valueStart
      const extSeqEnd = extSeqTLV.valueEnd

      // Each Extension is a SEQUENCE
      while (extPos < extSeqEnd && der[extPos] === TAG_SEQUENCE) {
        const extTLV = readTLV(der, extPos)
        // First field: extnID OID
        if (der[extTLV.valueStart] === TAG_OID) {
          const oidTLV = readTLV(der, extTLV.valueStart)
          const oid = decodeOID(der, oidTLV.valueStart, oidTLV.valueEnd - oidTLV.valueStart)
          if (oid) result.extensionOIDs.push(oid)
        }
        extPos = extTLV.nextOffset
      }
    }
  }
}
