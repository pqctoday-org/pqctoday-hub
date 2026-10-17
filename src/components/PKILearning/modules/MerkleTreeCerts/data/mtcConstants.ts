// SPDX-License-Identifier: AGPL-3.0-only
import type { CertLeaf } from '../utils/merkleTree'

// ---------------------------------------------------------------------------
// Algorithm signature & key sizes (bytes)
// ---------------------------------------------------------------------------

export interface AlgorithmSizes {
  name: string
  shortName: string
  signatureBytes: number
  publicKeyBytes: number
  /** Category for grouping in the UI */
  category: 'classical' | 'pqc-lattice' | 'pqc-hash'
}

export const ALGORITHM_SIZES: AlgorithmSizes[] = [
  {
    name: 'ECDSA P-256',
    shortName: 'ECDSA',
    signatureBytes: 64,
    publicKeyBytes: 65,
    category: 'classical',
  },
  {
    name: 'RSA-2048',
    shortName: 'RSA-2048',
    signatureBytes: 256,
    publicKeyBytes: 294,
    category: 'classical',
  },
  {
    name: 'ML-DSA-44 (FIPS 204)',
    shortName: 'ML-DSA-44',
    signatureBytes: 2420,
    publicKeyBytes: 1312,
    category: 'pqc-lattice',
  },
  {
    name: 'ML-DSA-65 (FIPS 204)',
    shortName: 'ML-DSA-65',
    signatureBytes: 3309,
    publicKeyBytes: 1952,
    category: 'pqc-lattice',
  },
  {
    name: 'ML-DSA-87 (FIPS 204)',
    shortName: 'ML-DSA-87',
    signatureBytes: 4627,
    publicKeyBytes: 2592,
    category: 'pqc-lattice',
  },
  {
    name: 'SLH-DSA-SHA2-128s (FIPS 205)',
    shortName: 'SLH-DSA-128s',
    signatureBytes: 7856,
    publicKeyBytes: 32,
    category: 'pqc-hash',
  },
]

// ---------------------------------------------------------------------------
// TLS handshake component sizes
// ---------------------------------------------------------------------------

/** Approximate fixed overhead per SCT (Signed Certificate Timestamp) in CT logs */
export const SCT_OVERHEAD_BYTES = 119

/**
 * Number of SCTs embedded in the end-entity (EE) certificate.
 * Modern browsers require ≥2 SCTs; they appear in the EE cert only —
 * not in the intermediate CA cert.
 */
export const TYPICAL_SCT_COUNT = 2

/** Fixed certificate metadata overhead (serial, validity, extensions, etc.) */
export const CERT_METADATA_BYTES = 200

/**
 * The two subtree sizes draft-ietf-plants-merkle-tree-certs-07 §6.5 ("Size
 * Estimates") projects. They are NOT the same number, and this module once
 * applied the larger one to both, so each constant is named for the certificate
 * type it belongs to.
 *
 * Both projections share one starting assumption: 7-day certificate lifetimes
 * renewed 75% of the way through, so every certificate is reissued every 126
 * hours. For a Let's Encrypt-sized CA (about 682 million active certificates in
 * September 2026) that is about 5,400,000 certificates per hour. What differs
 * is how often the CA cuts a subtree:
 *
 *   standalone — "if the CA mints a checkpoint every 2 seconds, standalone
 *   certificate subtrees will span around 3,000 certificates, leading to 12
 *   hashes in the inclusion proof, or 384 bytes. Standalone certificates
 *   additionally must carry a sufficient set of signatures to meet relying
 *   party requirements."                                              (§6.5)
 *
 *   landmark-relative — "if a new landmark is allocated every hour,
 *   landmark-relative certificate subtrees will span around 5,400,000
 *   certificates, leading to 23 hashes in the inclusion proof, giving an
 *   inclusion proof size of 736 bytes, with no signatures."            (§6.5)
 *
 * "No signatures" describes the certificate. The TLS handshake still carries
 * the server's public key and its CertificateVerify signature, which the
 * handshake model below counts for every mode.
 */
export const MTC_STANDALONE_PROOF_BYTES = 384
export const MTC_LANDMARK_PROOF_BYTES = 736

/** Subtree sizes the two figures above are projected from (§6.5). */
export const MTC_STANDALONE_SUBTREE_CERTS = 3_000
export const MTC_LANDMARK_SUBTREE_CERTS = 5_400_000

/**
 * Compute inclusion proof size for a given batch size (number of certificates).
 * Per draft-ietf-plants-merkle-tree-certs-07: proof = ⌈log₂(batchSize)⌉ hashes × 32 bytes.
 * The draft's own two data points both satisfy this: 3,000 certs → 12 × 32 = 384 B,
 * and 5,400,000 certs → 23 × 32 = 736 B (§6.5). The demo tree of 8 certs → 3 × 32 = 96 B.
 * Proof size depends ONLY on subtree size — never on the signature algorithm.
 */
export function computeProofBytes(batchSize: number): number {
  if (batchSize < 2) return 32 // height 1 → 1 sibling × 32 bytes
  return Math.ceil(Math.log2(batchSize)) * 32
}

/**
 * One scenario for all three modes, the one the module introduction states as
 * 9,884 B for ML-DSA-44 before overheads: the server's key and every signature
 * use the same algorithm, and the root certificate is already in the client's
 * trust store, so it is never sent.
 *
 *   traditional — leaf and intermediate certificates: 2 public keys, 2
 *   certificate signatures (the leaf signed by the intermediate, the
 *   intermediate signed by the root) and the CertificateVerify signature, so
 *   2 keys + 3 signatures, plus 2 SCTs and metadata for 2 certificates.
 *
 *   standalone MTC — one certificate: the server's public key, the inclusion
 *   proof, the CA's cosignature(s) and the CertificateVerify signature.
 *
 *   landmark MTC — one certificate: the server's public key and the inclusion
 *   proof, no cosignatures (the client already holds the trusted subtree), and
 *   the CertificateVerify signature.
 *
 * SCTs are counted for the traditional chain only. The draft contrasts the MTC
 * proof with the three ML-DSA-44 signatures post-quantum SCTs would need (§6.5).
 */
export const TRADITIONAL_CERTS_SENT = 2

/**
 * Cosignatures a standalone certificate carries. The draft says only "a
 * sufficient set of signatures to meet relying party requirements"; one CA
 * cosignature, in the same algorithm as the server's key, is the minimum. Each
 * further cosigner a relying party requires adds one signature.
 */
export const STANDALONE_COSIGNATURE_COUNT = 1

/**
 * Calculate total traditional TLS handshake authentication size.
 *
 * Components: leaf and intermediate public keys, the two certificate
 * signatures, the CertificateVerify signature, the SCTs embedded in the leaf
 * certificate (≥2 required by browsers) and metadata for both certificates.
 */
export function traditionalChainSize(algo: AlgorithmSizes): number {
  const sigs = algo.signatureBytes * (TRADITIONAL_CERTS_SENT + 1) // 2 cert signatures + CertificateVerify
  const keys = algo.publicKeyBytes * TRADITIONAL_CERTS_SENT
  const scts = SCT_OVERHEAD_BYTES * TYPICAL_SCT_COUNT
  const metadata = CERT_METADATA_BYTES * TRADITIONAL_CERTS_SENT
  return sigs + keys + scts + metadata
}

/**
 * Calculate standalone MTC TLS handshake authentication size.
 *
 * Components: the server's public key, the CertificateVerify signature, the CA
 * cosignature(s) carried in the certificate (draft §6.3), the inclusion proof
 * and metadata. The proof defaults to the STANDALONE figure (§6.5): a standalone
 * subtree is cut every checkpoint, not every landmark, so it is far smaller.
 */
export function mtcChainSize(algo: AlgorithmSizes, proofBytes?: number): number {
  return (
    algo.publicKeyBytes +
    algo.signatureBytes + // CertificateVerify
    algo.signatureBytes * STANDALONE_COSIGNATURE_COUNT +
    (proofBytes ?? MTC_STANDALONE_PROOF_BYTES) +
    CERT_METADATA_BYTES
  )
}

/**
 * Calculate landmark MTC TLS handshake authentication size.
 *
 * A landmark-relative certificate carries no signatures (§6.4): relying parties
 * pre-sync trusted subtrees out-of-band. The handshake still carries the server's
 * public key and its CertificateVerify signature, plus the inclusion proof and
 * metadata.
 */
export function mtcLandmarkChainSize(algo: AlgorithmSizes, proofBytes?: number): number {
  return (
    algo.publicKeyBytes +
    algo.signatureBytes + // CertificateVerify
    (proofBytes ?? MTC_LANDMARK_PROOF_BYTES) +
    CERT_METADATA_BYTES
  )
}

/**
 * Format a size change against the traditional baseline. A positive percent is a
 * saving; a negative one means the MTC handshake is larger (for example a
 * landmark proof next to an ECDSA chain, which is smaller than the proof).
 */
export function describeSizeChange(percent: number): { text: string; smaller: boolean } {
  return percent >= 0
    ? { text: `${percent}% smaller`, smaller: true }
    : { text: `${-percent}% larger`, smaller: false }
}

/** Breakdown for display in the size comparison table */
export interface SizeBreakdown {
  label: string
  traditional: { component: string; bytes: number }[]
  mtc: { component: string; bytes: number }[]
  mtcLandmark: { component: string; bytes: number }[]
  traditionalTotal: number
  mtcTotal: number
  mtcLandmarkTotal: number
  /** Percent smaller than traditional; negative when the MTC handshake is larger. */
  reductionPercent: number
  landmarkReductionPercent: number
}

/**
 * Two proof sizes, not one. The standalone and landmark columns describe subtrees
 * cut at different cadences (§6.5), so a caller that passes only one figure would
 * reproduce exactly the conflation this module used to publish.
 */
export function getSizeBreakdown(
  algo: AlgorithmSizes,
  standaloneProofBytes?: number,
  landmarkProofBytes?: number
): SizeBreakdown {
  const standaloneProof = standaloneProofBytes ?? MTC_STANDALONE_PROOF_BYTES
  const landmarkProof = landmarkProofBytes ?? MTC_LANDMARK_PROOF_BYTES
  const traditional = [
    { component: 'Leaf public key', bytes: algo.publicKeyBytes },
    { component: 'Leaf certificate signature (by intermediate)', bytes: algo.signatureBytes },
    { component: 'Intermediate public key', bytes: algo.publicKeyBytes },
    { component: 'Intermediate certificate signature (by root)', bytes: algo.signatureBytes },
    { component: 'CertificateVerify signature', bytes: algo.signatureBytes },
    { component: 'CT SCTs ×2 (leaf cert)', bytes: SCT_OVERHEAD_BYTES * TYPICAL_SCT_COUNT },
    {
      component: 'Certificate metadata (×2)',
      bytes: CERT_METADATA_BYTES * TRADITIONAL_CERTS_SENT,
    },
  ]
  const mtc = [
    { component: 'Server public key', bytes: algo.publicKeyBytes },
    { component: 'CertificateVerify signature', bytes: algo.signatureBytes },
    {
      component: `CA cosignature (minimum ${STANDALONE_COSIGNATURE_COUNT})`,
      bytes: algo.signatureBytes * STANDALONE_COSIGNATURE_COUNT,
    },
    { component: 'Inclusion proof', bytes: standaloneProof },
    { component: 'Certificate metadata', bytes: CERT_METADATA_BYTES },
  ]
  const mtcLandmark = [
    { component: 'Server public key', bytes: algo.publicKeyBytes },
    { component: 'CertificateVerify signature', bytes: algo.signatureBytes },
    { component: 'Inclusion proof (to pre-synced subtree)', bytes: landmarkProof },
    { component: 'Certificate metadata', bytes: CERT_METADATA_BYTES },
  ]

  const traditionalTotal = traditional.reduce((sum, c) => sum + c.bytes, 0)
  const mtcTotal = mtc.reduce((sum, c) => sum + c.bytes, 0)
  const mtcLandmarkTotal = mtcLandmark.reduce((sum, c) => sum + c.bytes, 0)
  const reductionPercent = Math.round(((traditionalTotal - mtcTotal) / traditionalTotal) * 100)
  const landmarkReductionPercent = Math.round(
    ((traditionalTotal - mtcLandmarkTotal) / traditionalTotal) * 100
  )

  return {
    label: algo.name,
    traditional,
    mtc,
    mtcLandmark,
    traditionalTotal,
    mtcTotal,
    mtcLandmarkTotal,
    reductionPercent,
    landmarkReductionPercent,
  }
}

// ---------------------------------------------------------------------------
// Sample certificates for the interactive builder
// ---------------------------------------------------------------------------

export const SAMPLE_CERTS: CertLeaf[] = [
  {
    id: 1,
    subject: 'www.example.com',
    issuer: 'MTC Authority',
    algorithm: 'ML-DSA-44',
    publicKeySize: 1312,
    notBefore: '2026-01-01',
    notAfter: '2026-03-01',
  },
  {
    id: 2,
    subject: 'api.example.com',
    issuer: 'MTC Authority',
    algorithm: 'ML-DSA-44',
    publicKeySize: 1312,
    notBefore: '2026-01-01',
    notAfter: '2026-03-01',
  },
  {
    id: 3,
    subject: 'mail.example.org',
    issuer: 'MTC Authority',
    algorithm: 'ML-DSA-65',
    publicKeySize: 1952,
    notBefore: '2026-01-15',
    notAfter: '2026-03-15',
  },
  {
    id: 4,
    subject: 'shop.acme.io',
    issuer: 'MTC Authority',
    algorithm: 'ML-DSA-44',
    publicKeySize: 1312,
    notBefore: '2026-02-01',
    notAfter: '2026-04-01',
  },
  {
    id: 5,
    subject: 'cdn.cloudsite.net',
    issuer: 'MTC Authority',
    algorithm: 'ML-DSA-44',
    publicKeySize: 1312,
    notBefore: '2026-02-01',
    notAfter: '2026-04-01',
  },
  {
    id: 6,
    subject: 'auth.bankdemo.com',
    issuer: 'MTC Authority',
    algorithm: 'ML-DSA-87',
    publicKeySize: 2592,
    notBefore: '2026-01-01',
    notAfter: '2026-03-01',
  },
  {
    id: 7,
    subject: 'iot.factory.local',
    issuer: 'MTC Authority',
    algorithm: 'ML-DSA-44',
    publicKeySize: 1312,
    notBefore: '2026-02-15',
    notAfter: '2026-04-15',
  },
  {
    id: 8,
    subject: 'vpn.enterprise.co',
    issuer: 'MTC Authority',
    algorithm: 'ML-DSA-65',
    publicKeySize: 1952,
    notBefore: '2026-01-15',
    notAfter: '2026-03-15',
  },
]

/** Tree height options for the interactive builder */
export const TREE_HEIGHT_OPTIONS = [
  { height: 2, leaves: 4, label: 'Height 2 (4 leaves)' },
  { height: 3, leaves: 8, label: 'Height 3 (8 leaves)' },
  { height: 4, leaves: 16, label: 'Height 4 (16 leaves)' },
  { height: 5, leaves: 32, label: 'Height 5 (32 leaves)' },
]

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatBytes(bytes: number): string {
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${bytes} B`
}

export function truncateHash(hash: string, chars = 8): string {
  if (hash.length <= chars * 2 + 2) return hash
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`
}
