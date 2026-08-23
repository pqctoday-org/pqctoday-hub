// SPDX-License-Identifier: GPL-3.0-only
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
 * The two subtree sizes draft-ietf-plants-merkle-tree-certs-04 §6.4 ("Size
 * Estimates") actually projects. They are NOT the same number, and this module
 * used to apply the larger one to both — the correction is itself the lesson,
 * so both constants are named for the certificate type they belong to.
 *
 * Both projections share the same starting assumption: 7-day certificate
 * lifetimes renewed 75% of the way through, giving ~4,400,000 certificates per
 * hour for a Let's Encrypt-sized CA (558M active certs, reissued every 126
 * hours). What differs is how often the CA cuts a subtree:
 *
 *   standalone — "if the CA mints a checkpoint every 2 seconds, standalone
 *   certificate subtrees will span around 2,500 certificates, leading to 12
 *   hashes in the inclusion proof, or 384 bytes"                       (§6.4)
 *
 *   landmark-relative — "if a new landmark is allocated every hour,
 *   landmark-relative certificate subtrees will span around 4,400,000
 *   certificates, leading to 23 hashes in the inclusion proof, giving an
 *   inclusion proof size of 736 bytes, with no signatures"             (§6.4)
 *
 * Using 736 B for a standalone certificate roughly doubles its real proof, and
 * it is the standalone column where that matters most: the proof is compared
 * against the signature it replaces, so an inflated proof understates MTC's
 * benefit for every algorithm and overstates the "barely helps ECDSA" effect.
 */
export const MTC_STANDALONE_PROOF_BYTES = 384
export const MTC_LANDMARK_PROOF_BYTES = 736

/** Subtree sizes the two figures above are projected from (§6.4). */
export const MTC_STANDALONE_SUBTREE_CERTS = 2_500
export const MTC_LANDMARK_SUBTREE_CERTS = 4_400_000

/**
 * Compute inclusion proof size for a given batch size (number of certificates).
 * Per draft-ietf-plants-merkle-tree-certs-04: proof = ⌈log₂(batchSize)⌉ hashes × 32 bytes.
 * The draft's own two data points both satisfy this: 2,500 certs → 12 × 32 = 384 B,
 * and 4,400,000 certs → 23 × 32 = 736 B (§6.4). The demo tree of 8 certs → 3 × 32 = 96 B.
 * Proof size depends ONLY on subtree size — never on the signature algorithm.
 */
export function computeProofBytes(batchSize: number): number {
  if (batchSize < 2) return 32 // height 1 → 1 sibling × 32 bytes
  return Math.ceil(Math.log2(batchSize)) * 32
}

/**
 * Calculate total traditional TLS handshake authentication size.
 *
 * Components: Root CA sig + Intermediate CA sig + EE cert sig
 * + Root CA pubkey + Intermediate CA pubkey + EE pubkey
 * + SCTs embedded in EE cert (≥2 required by browsers; not in intermediate)
 * + cert metadata × 3
 */
export function traditionalChainSize(algo: AlgorithmSizes): number {
  const sigs = algo.signatureBytes * 3 // Root, Intermediate, EE
  const keys = algo.publicKeyBytes * 3
  const scts = SCT_OVERHEAD_BYTES * TYPICAL_SCT_COUNT // SCTs in EE cert only
  const metadata = CERT_METADATA_BYTES * 3
  return sigs + keys + scts + metadata
}

/**
 * Estimated cosigner signature overhead in a standalone certificate.
 * Per draft-ietf-plants-merkle-tree-certs-04 Section 6.2, standalone certs carry
 * cosignatures from the CA and external cosigners. Cosigner signatures use Ed25519
 * (64 bytes each). Typical policy: 2 external cosigners → ~128 bytes of cosignatures.
 * This is a conservative minimum; actual overhead depends on relying party requirements.
 */
export const COSIGNER_SIGNATURE_OVERHEAD_BYTES = 128

/**
 * Calculate standalone MTC TLS handshake authentication size.
 *
 * Components: 1 CA signature + 1 CA public key + cosigner signatures + inclusion proof + metadata
 * Per Section 6.2, standalone certs carry sufficient cosignatures to meet relying party requirements.
 * The proof defaults to the STANDALONE figure (§6.4) — a standalone subtree is cut
 * every checkpoint, not every landmark, so it is an order of magnitude smaller.
 */
export function mtcChainSize(algo: AlgorithmSizes, proofBytes?: number): number {
  return (
    algo.signatureBytes +
    algo.publicKeyBytes +
    COSIGNER_SIGNATURE_OVERHEAD_BYTES +
    (proofBytes ?? MTC_STANDALONE_PROOF_BYTES) +
    CERT_METADATA_BYTES
  )
}

/**
 * Calculate landmark MTC TLS handshake authentication size.
 *
 * Landmark certificates carry ZERO embedded signatures — relying parties pre-sync
 * trusted subtrees out-of-band. Per draft-ietf-plants-merkle-tree-certs §6.3:
 * only the inclusion proof + certificate metadata are transmitted in the handshake.
 */
export function mtcLandmarkChainSize(proofBytes?: number): number {
  return (proofBytes ?? MTC_LANDMARK_PROOF_BYTES) + CERT_METADATA_BYTES
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
  reductionPercent: number
  landmarkReductionPercent: number
}

/**
 * Two proof sizes, not one. The standalone and landmark columns describe subtrees
 * cut at different cadences (§6.4), so a caller that passes only one figure would
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
    { component: 'Root CA signature', bytes: algo.signatureBytes },
    { component: 'Root CA public key', bytes: algo.publicKeyBytes },
    { component: 'Intermediate CA signature', bytes: algo.signatureBytes },
    { component: 'Intermediate CA public key', bytes: algo.publicKeyBytes },
    { component: 'End-entity signature', bytes: algo.signatureBytes },
    { component: 'End-entity public key', bytes: algo.publicKeyBytes },
    { component: 'CT SCTs ×2 (EE cert)', bytes: SCT_OVERHEAD_BYTES * TYPICAL_SCT_COUNT },
    { component: 'Certificate metadata (×3)', bytes: CERT_METADATA_BYTES * 3 },
  ]
  const mtc = [
    { component: 'CA signature (batch)', bytes: algo.signatureBytes },
    { component: 'CA public key', bytes: algo.publicKeyBytes },
    { component: 'Cosigner signatures (≥2)', bytes: COSIGNER_SIGNATURE_OVERHEAD_BYTES },
    { component: 'Inclusion proof', bytes: standaloneProof },
    { component: 'Certificate metadata', bytes: CERT_METADATA_BYTES },
  ]
  const mtcLandmark = [
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
