// SPDX-License-Identifier: GPL-3.0-only
import type { MigrationPhase, PrivacyTechProfile } from './aiSecurityConstants'

// ── Scale Calculation Helpers ─────────────────────────────────────────────

/** Estimate total Data Encryption Keys needed */
export function estimateDEKCount(datasetSizeGB: number, modelCount: number): number {
  // ~1 DEK per 1 GB chunk + 1 DEK per model file shard (assume 10 shards each)
  return Math.ceil(datasetSizeGB) + modelCount * 10
}

/** Estimate Key Encryption Keys needed */
export function estimateKEKCount(regions: number, modelCount: number): number {
  // 1 root KEK per region + 1 intermediate KEK per model per region
  return regions + regions * modelCount
}

/** Estimate daily KMS operations */
export function estimateKMSOpsPerDay(
  inferenceRequestsPerDay: number,
  agentCount: number,
  dekCount: number
): number {
  // Each inference request needs 1 DEK unwrap
  // Each agent needs ~10 credential operations per day
  // DEK rotation: ~1% of DEKs rotated per day
  return inferenceRequestsPerDay + agentCount * 10 + Math.ceil(dekCount * 0.01)
}

/** Estimate storage overhead for PQC vs classical (GB) */
export function estimateStorageOverhead(dekCount: number, modelCount: number): number {
  // ML-KEM-768 ciphertext: 1088 bytes vs RSA-2048: 256 bytes per DEK
  // ML-DSA-65 signature: 3309 bytes vs ECDSA: 64 bytes per model
  const dekOverhead = dekCount * (1088 - 256)
  const sigOverhead = modelCount * (3309 - 64)
  return (dekOverhead + sigOverhead) / (1024 * 1024 * 1024) // convert to GB
}

/** Estimate bandwidth overhead percentage */
export function estimateBandwidthOverhead(inferenceRequestsPerDay: number): number {
  // TLS 1.3 hybrid handshake adds ~2KB per connection vs classical
  // Amortized over the connection lifetime (assume 100 requests per connection)
  const connectionsPerDay = inferenceRequestsPerDay / 100
  const overheadBytesPerDay = connectionsPerDay * 2048
  // Assume average connection transfers ~1MB of data
  const totalBytesPerDay = connectionsPerDay * 1024 * 1024
  return totalBytesPerDay > 0 ? (overheadBytesPerDay / totalBytesPerDay) * 100 : 0
}

/** Estimate HNDL risk window description */
export function estimateHNDLRiskWindow(retentionYears: number): string {
  // Conservative CRQC estimates: 2030–2040
  const currentYear = 2026
  const dataExpiresYear = currentYear + retentionYears
  if (dataExpiresYear <= 2030) {
    return `Low — data expires (${dataExpiresYear}) before most CRQC estimates (2030–2040)`
  }
  if (dataExpiresYear <= 2035) {
    return `Medium — data retention (${dataExpiresYear}) overlaps early CRQC estimates (2030–2035)`
  }
  return `High — data retention extends to ${dataExpiresYear}, well within CRQC threat window (2030–2040+)`
}

// ── Migration Phase Templates ─────────────────────────────────────────────

export const MIGRATION_PHASE_TEMPLATES: MigrationPhase[] = [
  {
    phase: 1,
    name: 'Inventory & Assessment',
    durationMonths: 3,
    components: [
      'Crypto inventory of all AI pipeline touchpoints',
      'Key management system audit',
      'Agent credential catalog',
      'Data classification for HNDL risk',
    ],
    pqcAlgorithms: [],
    effortLevel: 'low',
  },
  {
    phase: 2,
    name: 'Hybrid TLS & Key Wrapping',
    durationMonths: 6,
    components: [
      'TLS 1.3 with hybrid ML-KEM for API endpoints',
      'ML-KEM key wrapping for data-at-rest DEKs',
      'KMS upgrade to support PQC key types',
      'Certificate infrastructure for ML-DSA',
    ],
    pqcAlgorithms: ['ML-KEM-768', 'ML-KEM-1024'],
    effortLevel: 'medium',
  },
  {
    phase: 3,
    name: 'Model Signing & Agent Auth',
    durationMonths: 6,
    components: [
      'ML-DSA model signing for all model artifacts',
      'PQC agent certificates (ML-DSA X.509)',
      'Delegation token migration to ML-DSA',
      'Data provenance chain PQC signatures',
    ],
    pqcAlgorithms: ['ML-DSA-44', 'ML-DSA-65'],
    effortLevel: 'medium',
  },
  {
    phase: 4,
    name: 'Full PQC & Decommission Classical',
    durationMonths: 12,
    components: [
      'Remove classical-only cipher suites',
      'Re-encrypt archived data with PQC-wrapped keys',
      'Agent-to-agent protocol upgrade to full PQC',
      'Compliance certification for PQC deployment',
    ],
    pqcAlgorithms: ['ML-KEM-768', 'ML-KEM-1024', 'ML-DSA-44', 'ML-DSA-65'],
    effortLevel: 'high',
  },
]

// ── Privacy-Preserving Computation ────────────────────────────────────────

export const PRIVACY_TECH_PROFILES: PrivacyTechProfile[] = [
  {
    id: 'fhe',
    name: 'Fully Homomorphic Encryption (FHE)',
    description:
      'Perform computations directly on encrypted data without decryption. Lattice-based FHE schemes (BGV, BFV, CKKS) are inherently resistant to quantum attacks because they rely on the hardness of lattice problems.',
    performanceOverhead: '1,000–10,000x slowdown vs plaintext computation',
    pqcRelevance:
      'FHE is inherently quantum-safe — lattice-based security assumptions are the same ones underlying ML-KEM and ML-DSA. No migration needed for FHE itself.',
    quantumSafe: true,
    maturity: 'emerging',
    useCases: [
      'Privacy-preserving ML inference (encrypted queries)',
      'Secure data analytics across organizations',
      'Encrypted database queries',
    ],
  },
  {
    id: 'mpc',
    name: 'Secure Multi-Party Computation (MPC)',
    description:
      'Multiple parties jointly compute a function over their inputs while keeping each input private. Used for collaborative model training and federated analytics without revealing raw data.',
    performanceOverhead: '10–100x slowdown, plus network communication overhead',
    pqcRelevance:
      'MPC protocols use oblivious transfer (OT) which relies on key exchange — currently RSA/ECDH. Must migrate OT to PQC-based schemes (lattice-based OT). Garbled circuits are symmetric-crypto-based and quantum-safe.',
    quantumSafe: false,
    maturity: 'emerging',
    useCases: [
      'Collaborative model training (data stays with each party)',
      'Private set intersection for fraud detection',
      'Joint risk assessment across institutions',
    ],
  },
  {
    id: 'differential-privacy',
    name: 'Differential Privacy (DP)',
    description:
      'Adds calibrated noise to data or model outputs to prevent individual data points from being identified. Mathematical guarantee that any single data point has limited impact on the output.',
    performanceOverhead:
      'Minimal compute overhead, but reduces model accuracy (privacy-utility tradeoff)',
    pqcRelevance:
      'DP itself is information-theoretic (not crypto-dependent), so it is quantum-safe. However, DP mechanisms often combine with encrypted aggregation channels that need PQC migration.',
    quantumSafe: true,
    maturity: 'production',
    useCases: [
      'Privacy-preserving model training (DP-SGD)',
      'Census data release',
      'Federated learning with privacy guarantees',
    ],
  },
  {
    id: 'federated-learning',
    name: 'Federated Learning (FL)',
    description:
      'Train ML models across decentralized data sources without centralizing raw data. Each participant trains locally and shares only encrypted model updates (gradients), which are aggregated centrally.',
    performanceOverhead: '2–5x training time due to communication rounds and aggregation',
    pqcRelevance:
      'FL gradient encryption uses key exchange (ECDH → ML-KEM) and gradient signing (ECDSA → ML-DSA). Secure aggregation protocols also use Shamir secret sharing with encrypted channels. All need PQC migration.',
    quantumSafe: false,
    maturity: 'emerging',
    useCases: [
      'Healthcare: multi-hospital model training without sharing patient data',
      'Finance: fraud detection across banks without sharing transactions',
      'Mobile: on-device learning with privacy (keyboard prediction, etc.)',
    ],
  },
  {
    id: 'tee',
    name: 'Trusted Execution Environments (TEEs)',
    description:
      'Hardware-enforced isolated execution environments (Intel SGX/TDX, AMD SEV-SNP, ARM CCA). Model and data are decrypted only inside the enclave, protected from the OS, hypervisor, and other tenants.',
    performanceOverhead: '5–30% depending on workload and enclave memory pressure',
    pqcRelevance:
      'TEE attestation uses ECDSA signatures — must migrate to ML-DSA. Memory encryption uses AES (quantum-safe for AES-256). Key sealing derivation may need PQC upgrade.',
    quantumSafe: false,
    maturity: 'production',
    useCases: [
      'Confidential ML inference (model weights never exposed)',
      'Secure model aggregation in federated learning',
      'Privacy-preserving data processing in cloud',
    ],
  },
]

// ── Scale Reference Data ──────────────────────────────────────────────────

export interface ScaleReferencePoint {
  id: string
  name: string
  datasetSizeTB: number
  modelParams: string
  inferencePerDay: string
  keyCount: string
  notes: string
}

export const SCALE_REFERENCE_POINTS: ScaleReferencePoint[] = [
  {
    id: 'startup',
    name: 'AI Startup',
    datasetSizeTB: 1,
    modelParams: '1–7B',
    inferencePerDay: '100K',
    keyCount: '~1,000 DEKs',
    notes: 'Single region, single model, API-only deployment',
  },
  {
    id: 'enterprise',
    name: 'Enterprise AI Platform',
    datasetSizeTB: 100,
    modelParams: '7–70B',
    inferencePerDay: '10M',
    keyCount: '~100K DEKs',
    notes: 'Multi-model, multi-tenant, 3 regions, per-tenant isolation',
  },
  {
    id: 'hyperscaler',
    name: 'Hyperscaler AI Service',
    datasetSizeTB: 10000,
    modelParams: '70–405B',
    inferencePerDay: '1B',
    keyCount: '~10M DEKs',
    notes: 'Global deployment, hundreds of models, billions of daily operations',
  },
]
