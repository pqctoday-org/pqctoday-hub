/**
 * v2p7-reference.ts
 *
 * Spec reference tables for the V2.7 RC1 PQC EK Credential Profile,
 * pasted from the canonical pqctoday-tpm headers so the hub UI can
 * cross-check TPM-resident artifacts against the spec without round-tripping
 * to a server. Sources:
 *
 *   - PolicyB SHA-256/384/512:
 *       pqctoday-tpm/swtpm/src/swtpm_setup/tcg_pqc_ek_constants.h §A.1.3-5
 *       (V2.7 RC1 Table 8)
 *   - NIST CSOR OIDs (id-alg-ml-kem-{512,768,1024}, id-ml-dsa-{44,65,87}):
 *       pqctoday-tpm/tests/compliance/vectors/v2p7-ek-cert-oids/
 *       v2p7_ek_cert_spki_oids.h  (V2.7 RC1 §6.2.x)
 *   - FIPS pubkey sizes: NIST FIPS 203 Table 3, NIST FIPS 204 Table 2.
 */

export interface V2p7EkSpec {
  /** Display name, exactly as in V2.7 RC1 Tables 13/14. */
  label: string
  /** Per-EK persistent handle (pqctoday-tpm allocation). */
  persistentHandle: number
  /** V2.7 §5.3.1 NV cert index. */
  nvCertIndex: number
  /** TPM_ALG_* numeric: 0x00A0 (ML-KEM) or 0x00A1 (ML-DSA). */
  algId: number
  /** TPM_ALG_* nameAlg per V2.7 Tables 13/14: SHA-256 / SHA-384 / SHA-512. */
  nameAlg: number
  /** FIPS pubkey size in bytes (FIPS 203 Table 3 / FIPS 204 Table 2). */
  fipsPubKeySize: number
  /** V2.7 mandated objectAttributes value. */
  objectAttributes: number
  /** PolicyB SHA-{256,384,512} digest expected for this nameAlg. */
  policyB: Uint8Array
  /** OpenSSL EVP keytype name (for cert SPKI parsing). */
  opensslKeytype:
    | 'ML-KEM-512'
    | 'ML-KEM-768'
    | 'ML-KEM-1024'
    | 'ML-DSA-44'
    | 'ML-DSA-65'
    | 'ML-DSA-87'
  /** NIST CSOR OID body bytes (post tag/length, X.690 §8.19). */
  nistCsorOid: Uint8Array
  /** Dotted OID notation for human display. */
  nistCsorOidDotted: string
}

// ── V2.7 RC1 Table 8 — PolicyBSHA{256,384,512} digests ─────────────────────
// Sourced exactly from tcg_pqc_ek_constants.h lines 86-115.

export const POLICYB_SHA256 = new Uint8Array([
  0xca, 0x3d, 0x0a, 0x99, 0xa2, 0xb9, 0x39, 0x06, 0xf7, 0xa3, 0x34, 0x24, 0x14, 0xef, 0xcf, 0xb3,
  0xa3, 0x85, 0xd4, 0x4c, 0xd1, 0xfd, 0x45, 0x90, 0x89, 0xd1, 0x9b, 0x50, 0x71, 0xc0, 0xb7, 0xa0,
])

export const POLICYB_SHA384 = new Uint8Array([
  0xb2, 0x6e, 0x7d, 0x28, 0xd1, 0x1a, 0x50, 0xbc, 0x53, 0xd8, 0x82, 0xbc, 0xf5, 0xfd, 0x3a, 0x1a,
  0x07, 0x41, 0x48, 0xbb, 0x35, 0xd3, 0xb4, 0xe4, 0xcb, 0x1c, 0x0a, 0xd9, 0xbd, 0xe4, 0x19, 0xca,
  0xcb, 0x47, 0xba, 0x09, 0x69, 0x96, 0x46, 0x15, 0x0f, 0x9f, 0xc0, 0x00, 0xf3, 0xf8, 0x0e, 0x12,
])

export const POLICYB_SHA512 = new Uint8Array([
  0xb8, 0x22, 0x1c, 0xa6, 0x9e, 0x85, 0x50, 0xa4, 0x91, 0x4d, 0xe3, 0xfa, 0xa6, 0xa1, 0x8c, 0x07,
  0x2c, 0xc0, 0x12, 0x08, 0x07, 0x3a, 0x92, 0x8d, 0x5d, 0x66, 0xd5, 0x9e, 0xf7, 0x9e, 0x49, 0xa4,
  0x29, 0xc4, 0x1a, 0x6b, 0x26, 0x95, 0x71, 0xd5, 0x7e, 0xdb, 0x25, 0xfb, 0xdb, 0x18, 0x38, 0x42,
  0x56, 0x08, 0xb4, 0x13, 0xcd, 0x61, 0x6a, 0x5f, 0x6d, 0xb5, 0xb6, 0x07, 0x1a, 0xf9, 0x9b, 0xea,
])

// TPM_ALG_* IDs we display by name in the explorer.
export const TPM_ALG = {
  SHA256: 0x000b,
  SHA384: 0x000c,
  SHA512: 0x000d,
  AES: 0x0006,
  CFB: 0x0043,
  MLKEM: 0x00a0,
  MLDSA: 0x00a1,
} as const

export function tpmAlgName(alg: number): string {
  switch (alg) {
    case TPM_ALG.SHA256:
      return 'SHA-256'
    case TPM_ALG.SHA384:
      return 'SHA-384'
    case TPM_ALG.SHA512:
      return 'SHA-512'
    case TPM_ALG.AES:
      return 'AES'
    case TPM_ALG.CFB:
      return 'CFB'
    case TPM_ALG.MLKEM:
      return 'ML-KEM'
    case TPM_ALG.MLDSA:
      return 'ML-DSA'
    default:
      return `0x${alg.toString(16).padStart(4, '0')}`
  }
}

// ── V2.7 §6.2.x — NIST CSOR OID DER bodies (9 bytes each) ─────────────────
// Sourced exactly from v2p7_ek_cert_spki_oids.h.

export const OID_ML_KEM_512 = new Uint8Array([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x04, 0x01])
export const OID_ML_KEM_768 = new Uint8Array([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x04, 0x02])
export const OID_ML_KEM_1024 = new Uint8Array([
  0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x04, 0x03,
])
export const OID_ML_DSA_44 = new Uint8Array([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x03, 0x11])
export const OID_ML_DSA_65 = new Uint8Array([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x03, 0x12])
export const OID_ML_DSA_87 = new Uint8Array([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x03, 0x13])

// ── The six V2.7 EK specs, in display order ───────────────────────────────

export const V2P7_EK_SPECS: readonly V2p7EkSpec[] = [
  {
    label: 'ML-KEM-512',
    persistentHandle: 0x810100b0,
    nvCertIndex: 0x01c00060,
    algId: TPM_ALG.MLKEM,
    nameAlg: TPM_ALG.SHA256,
    fipsPubKeySize: 800,
    objectAttributes: 0x000300b2,
    policyB: POLICYB_SHA256,
    opensslKeytype: 'ML-KEM-512',
    nistCsorOid: OID_ML_KEM_512,
    nistCsorOidDotted: '2.16.840.1.101.3.4.4.1',
  },
  {
    label: 'ML-KEM-768',
    persistentHandle: 0x810100a0,
    nvCertIndex: 0x01c00062,
    algId: TPM_ALG.MLKEM,
    nameAlg: TPM_ALG.SHA384,
    fipsPubKeySize: 1184,
    objectAttributes: 0x000300b2,
    policyB: POLICYB_SHA384,
    opensslKeytype: 'ML-KEM-768',
    nistCsorOid: OID_ML_KEM_768,
    nistCsorOidDotted: '2.16.840.1.101.3.4.4.2',
  },
  {
    label: 'ML-KEM-1024',
    persistentHandle: 0x810100b2,
    nvCertIndex: 0x01c00064,
    algId: TPM_ALG.MLKEM,
    nameAlg: TPM_ALG.SHA512,
    fipsPubKeySize: 1568,
    objectAttributes: 0x000300b2,
    policyB: POLICYB_SHA512,
    opensslKeytype: 'ML-KEM-1024',
    nistCsorOid: OID_ML_KEM_1024,
    nistCsorOidDotted: '2.16.840.1.101.3.4.4.3',
  },
  {
    label: 'ML-DSA-44',
    persistentHandle: 0x810100b4,
    nvCertIndex: 0x01c00070,
    algId: TPM_ALG.MLDSA,
    nameAlg: TPM_ALG.SHA256,
    fipsPubKeySize: 1312,
    objectAttributes: 0x000500b2,
    policyB: POLICYB_SHA256,
    opensslKeytype: 'ML-DSA-44',
    nistCsorOid: OID_ML_DSA_44,
    nistCsorOidDotted: '2.16.840.1.101.3.4.3.17',
  },
  {
    label: 'ML-DSA-65',
    persistentHandle: 0x810100b5,
    nvCertIndex: 0x01c00072,
    algId: TPM_ALG.MLDSA,
    nameAlg: TPM_ALG.SHA384,
    fipsPubKeySize: 1952,
    objectAttributes: 0x000500b2,
    policyB: POLICYB_SHA384,
    opensslKeytype: 'ML-DSA-65',
    nistCsorOid: OID_ML_DSA_65,
    nistCsorOidDotted: '2.16.840.1.101.3.4.3.18',
  },
  {
    label: 'ML-DSA-87',
    persistentHandle: 0x810100b6,
    nvCertIndex: 0x01c00074,
    algId: TPM_ALG.MLDSA,
    nameAlg: TPM_ALG.SHA512,
    fipsPubKeySize: 2592,
    objectAttributes: 0x000500b2,
    policyB: POLICYB_SHA512,
    opensslKeytype: 'ML-DSA-87',
    nistCsorOid: OID_ML_DSA_87,
    nistCsorOidDotted: '2.16.840.1.101.3.4.3.19',
  },
]

// ── ML-DSA AK persistent handles (Owner hierarchy, pre-V2.7, used by the
//     attestation tab) ─────────────────────────────────────────────────────

export interface MlDsaAkSpec {
  label: 'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87'
  persistentHandle: number
  fipsPubKeySize: number
  fipsSigSize: number
}

export const MLDSA_AK_SPECS: readonly MlDsaAkSpec[] = [
  { label: 'ML-DSA-44', persistentHandle: 0x810100a2, fipsPubKeySize: 1312, fipsSigSize: 2420 },
  { label: 'ML-DSA-65', persistentHandle: 0x810100a1, fipsPubKeySize: 1952, fipsSigSize: 3309 },
  { label: 'ML-DSA-87', persistentHandle: 0x810100a3, fipsPubKeySize: 2592, fipsSigSize: 4627 },
]

// ── helpers ───────────────────────────────────────────────────────────────

export function toHex(bytes: Uint8Array, sep = ''): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(sep)
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/**
 * TPM_GENERATED_VALUE prefix for TPMS_ATTEST (V1.85 Part 1 §22.1.2,
 * required by restricted signing keys per Part 2 §10.11.12). ASCII "TCG\0"
 * is misleading — actual bytes are 0xFF 0x54 0x43 0x47.
 */
export const TPM_GENERATED_VALUE = new Uint8Array([0xff, 0x54, 0x43, 0x47])
