// SPDX-License-Identifier: GPL-3.0-only
import type {
  VerificationLayerProfile,
  ModelCollapseDataPoint,
  DatasetScenarioProfile,
} from './aiSecurityConstants'

// ── Verification Layer Profiles ───────────────────────────────────────────

export const VERIFICATION_LAYERS: VerificationLayerProfile[] = [
  {
    id: 'c2pa-credentials',
    name: 'C2PA Content Credentials',
    description:
      'Coalition for Content Provenance and Authenticity standard. Embeds cryptographically signed metadata (creator identity, creation tool, edit history) directly into content files. Creates a verifiable chain of custody from origin to consumption.',
    cryptoInvolved: 'X.509 certificate chains, ECDSA/RSA signatures on JUMBF metadata boxes',
    pqcRelevance:
      'Current C2PA signatures use ECDSA P-256 — quantum-vulnerable. Migration to ML-DSA needed to preserve long-term provenance trust. Data signed today with ECDSA can be forged post-CRQC, undermining the entire provenance chain.',
    accuracy: '100% for signed content (cryptographic verification), 0% for unsigned content',
    performanceOverhead: 'Minimal — metadata signing adds <10ms per content item',
    maturity: 'production',
  },
  {
    id: 'perceptual-hashing',
    name: 'Perceptual Hashing',
    description:
      'Generates fingerprints based on content perception (visual/semantic features) rather than exact bytes. Robust to minor modifications (resizing, compression) while detecting substantive changes. Used for near-duplicate detection in training datasets.',
    cryptoInvolved:
      'Non-cryptographic hashing (pHash, dHash, SSIM). Can combine with HMAC for authentication.',
    pqcRelevance:
      'Perceptual hashes themselves are not quantum-vulnerable, but HMAC-authenticated hash databases use symmetric keys that benefit from PQC key wrapping.',
    accuracy:
      '85–95% for near-duplicate detection, high false-positive rate for AI-generated variants',
    performanceOverhead: 'Low — ~5ms per image, ~50ms per text document',
    maturity: 'production',
  },
  {
    id: 'watermark-detection',
    name: 'AI Watermark Detection',
    description:
      'Identifies invisible watermarks embedded by AI generators (e.g., SynthID, C2PA AI markers, statistical watermarks in LLM outputs). Detects whether content was AI-generated to prevent synthetic data from contaminating training sets.',
    cryptoInvolved:
      'Watermark embedding uses keyed PRNGs, detection uses statistical hypothesis testing. Key management via KMS.',
    pqcRelevance:
      'Watermark keying material stored long-term needs PQC-wrapped keys. If watermark keys are compromised via quantum attack, adversaries can strip watermarks from synthetic content, defeating detection.',
    accuracy: '70–90% for known watermark schemes, <50% for unknown or removed watermarks',
    performanceOverhead: 'Medium — watermark detection requires model inference (~100ms per item)',
    maturity: 'emerging',
  },
  {
    id: 'provenance-chain',
    name: 'Cryptographic Provenance Chain',
    description:
      'Hash-chain-based data lineage tracking. Each data transformation (download, filter, augment, merge) appends a signed entry to an append-only provenance log. Similar to a blockchain but purpose-built for dataset versioning.',
    cryptoInvolved:
      'SHA-256 hash chain + ECDSA/ML-DSA signature per entry. Merkle tree for batch verification.',
    pqcRelevance:
      'Critical PQC target. Provenance chains must remain trustworthy for the lifetime of the model (potentially decades). ECDSA-signed provenance entries become forgeable post-CRQC, allowing retroactive data poisoning claims.',
    accuracy: '100% for tamper detection (cryptographic), relies on honest initial signing',
    performanceOverhead:
      'Low per-entry (<5ms signing), scales linearly with dataset transformations',
    maturity: 'emerging',
  },
  {
    id: 'statistical-detection',
    name: 'Statistical AI Content Detection',
    description:
      'ML-based classifiers that detect AI-generated content by analyzing statistical patterns (token frequency, perplexity distribution, burstiness). Includes tools like GPTZero, Originality.ai, and GLTR.',
    cryptoInvolved: 'None directly. Classification results should be signed for integrity.',
    pqcRelevance:
      'Detection result attestations need PQC signatures to remain trustworthy. A CRQC could forge "human-verified" labels on AI-generated content.',
    accuracy: '60–85% overall, degrades rapidly with paraphrasing and newer models',
    performanceOverhead: 'High — requires separate inference model (~200-500ms per document)',
    maturity: 'emerging',
  },
]

// ── Model Collapse Data ───────────────────────────────────────────────────

export const MODEL_COLLAPSE_CURVES: Record<string, ModelCollapseDataPoint[]> = {
  'no-verification': [
    {
      generation: 0,
      humanDataPercent: 100,
      syntheticDataPercent: 0,
      qualityScore: 100,
      perplexityIncrease: 0,
    },
    {
      generation: 1,
      humanDataPercent: 70,
      syntheticDataPercent: 30,
      qualityScore: 92,
      perplexityIncrease: 8,
    },
    {
      generation: 2,
      humanDataPercent: 49,
      syntheticDataPercent: 51,
      qualityScore: 78,
      perplexityIncrease: 22,
    },
    {
      generation: 3,
      humanDataPercent: 34,
      syntheticDataPercent: 66,
      qualityScore: 58,
      perplexityIncrease: 45,
    },
    {
      generation: 4,
      humanDataPercent: 24,
      syntheticDataPercent: 76,
      qualityScore: 35,
      perplexityIncrease: 78,
    },
    {
      generation: 5,
      humanDataPercent: 17,
      syntheticDataPercent: 83,
      qualityScore: 18,
      perplexityIncrease: 125,
    },
  ],
  'basic-filtering': [
    {
      generation: 0,
      humanDataPercent: 100,
      syntheticDataPercent: 0,
      qualityScore: 100,
      perplexityIncrease: 0,
    },
    {
      generation: 1,
      humanDataPercent: 85,
      syntheticDataPercent: 15,
      qualityScore: 96,
      perplexityIncrease: 4,
    },
    {
      generation: 2,
      humanDataPercent: 72,
      syntheticDataPercent: 28,
      qualityScore: 88,
      perplexityIncrease: 12,
    },
    {
      generation: 3,
      humanDataPercent: 61,
      syntheticDataPercent: 39,
      qualityScore: 75,
      perplexityIncrease: 25,
    },
    {
      generation: 4,
      humanDataPercent: 52,
      syntheticDataPercent: 48,
      qualityScore: 60,
      perplexityIncrease: 42,
    },
    {
      generation: 5,
      humanDataPercent: 44,
      syntheticDataPercent: 56,
      qualityScore: 45,
      perplexityIncrease: 65,
    },
  ],
  'provenance-verified': [
    {
      generation: 0,
      humanDataPercent: 100,
      syntheticDataPercent: 0,
      qualityScore: 100,
      perplexityIncrease: 0,
    },
    {
      generation: 1,
      humanDataPercent: 95,
      syntheticDataPercent: 5,
      qualityScore: 98,
      perplexityIncrease: 2,
    },
    {
      generation: 2,
      humanDataPercent: 90,
      syntheticDataPercent: 10,
      qualityScore: 95,
      perplexityIncrease: 5,
    },
    {
      generation: 3,
      humanDataPercent: 86,
      syntheticDataPercent: 14,
      qualityScore: 92,
      perplexityIncrease: 8,
    },
    {
      generation: 4,
      humanDataPercent: 82,
      syntheticDataPercent: 18,
      qualityScore: 88,
      perplexityIncrease: 12,
    },
    {
      generation: 5,
      humanDataPercent: 78,
      syntheticDataPercent: 22,
      qualityScore: 84,
      perplexityIncrease: 16,
    },
  ],
}

export const COLLAPSE_SCENARIO_LABELS: Record<string, { label: string; color: string }> = {
  'no-verification': {
    label: 'No Verification',
    color: 'text-status-error',
  },
  'basic-filtering': {
    label: 'Statistical Filtering Only',
    color: 'text-status-warning',
  },
  'provenance-verified': {
    label: 'Cryptographic Provenance',
    color: 'text-status-success',
  },
}

// ── Dataset Scenario Profiles ─────────────────────────────────────────────

export const DATASET_SCENARIOS: DatasetScenarioProfile[] = [
  {
    id: 'web-scraped',
    name: 'Web-Scraped Dataset',
    description:
      'Large-scale web crawl (Common Crawl, custom scrapers). Highest contamination risk — the open web increasingly contains AI-generated content with no provenance markers.',
    typicalSyntheticPercent: 35,
    riskLevel: 'critical',
    recommendedVerification: [
      'c2pa-credentials',
      'watermark-detection',
      'statistical-detection',
      'provenance-chain',
    ],
    provenanceSigningNeeded: true,
  },
  {
    id: 'curated',
    name: 'Curated & Licensed Dataset',
    description:
      'Hand-selected, licensed data from trusted publishers (academic papers, licensed news archives, verified datasets). Lower contamination risk but still requires verification for long-term data integrity.',
    typicalSyntheticPercent: 5,
    riskLevel: 'low',
    recommendedVerification: ['c2pa-credentials', 'provenance-chain'],
    provenanceSigningNeeded: true,
  },
  {
    id: 'synthetic-mixed',
    name: 'Synthetic-Augmented Dataset',
    description:
      'Intentionally blends human and AI-generated data for augmentation. Requires strict labeling, ratio control, and quality monitoring to prevent model collapse.',
    typicalSyntheticPercent: 50,
    riskLevel: 'high',
    recommendedVerification: [
      'c2pa-credentials',
      'watermark-detection',
      'provenance-chain',
      'perceptual-hashing',
    ],
    provenanceSigningNeeded: true,
  },
  {
    id: 'federated',
    name: 'Federated Learning Dataset',
    description:
      'Data remains distributed across participants — only encrypted gradients are shared. Each participant must verify local data quality, and gradient integrity must be cryptographically guaranteed.',
    typicalSyntheticPercent: 15,
    riskLevel: 'medium',
    recommendedVerification: ['provenance-chain', 'statistical-detection'],
    provenanceSigningNeeded: true,
  },
]

// ── Signing Overhead Data ─────────────────────────────────────────────────

export interface ManifestSigningProfile {
  id: string
  algorithm: string
  signatureSize: number // bytes
  signTimeMs: number // per-batch
  verifyTimeMs: number
  quantumSafe: boolean
  nistLevel: number
}

export const MANIFEST_SIGNING_PROFILES: ManifestSigningProfile[] = [
  {
    id: 'ecdsa-p256',
    algorithm: 'ECDSA P-256',
    signatureSize: 64,
    signTimeMs: 0.3,
    verifyTimeMs: 0.5,
    quantumSafe: false,
    nistLevel: 0,
  },
  {
    id: 'ml-dsa-44',
    algorithm: 'ML-DSA-44',
    signatureSize: 2420,
    signTimeMs: 0.8,
    verifyTimeMs: 0.3,
    quantumSafe: true,
    nistLevel: 2,
  },
  {
    id: 'ml-dsa-65',
    algorithm: 'ML-DSA-65',
    signatureSize: 3309,
    signTimeMs: 1.2,
    verifyTimeMs: 0.5,
    quantumSafe: true,
    nistLevel: 3,
  },
  {
    id: 'slh-dsa-sha2-128s',
    algorithm: 'SLH-DSA-SHA2-128s',
    signatureSize: 7856,
    signTimeMs: 150,
    verifyTimeMs: 5,
    quantumSafe: true,
    nistLevel: 1,
  },
]
