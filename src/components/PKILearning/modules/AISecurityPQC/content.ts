// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the AISecurityPQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'ai-security-pqc',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [getStandard('FIPS 203'), getStandard('FIPS 204'), getStandard('RFC 8446')],

  algorithms: [
    getAlgorithm('ECDH P-256'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    overview:
      'Quantum threats to AI data pipelines (HNDL on training data, data poisoning via forged signatures). Model collapse from AI-generated training data contamination. Cryptographic data provenance (C2PA content credentials, hash chains, watermark detection). Model weight protection (encryption at rest/transit/use, ML-DSA model signing). AI agent authentication (machine identity, delegation tokens, credential lifecycles).',
    workshopSummary:
      'Data Protection Analyzer — Audit AI pipeline crypto operations for quantum vulnerabilities. Data Authenticity Verifier — Configure verification layers, visualize model collapse, compare signing overheads. Model Weight Vault — Configure model encryption/signing, compare classical vs PQC overhead. Agent Auth Designer — Design delegation chains with PQC credentials. Agentic Commerce Simulator — Step through agent transaction flows with quantum overlay.',
    relatedStandards:
      'FIPS 203 (ML-KEM) — key encapsulation for data and model encryption. FIPS 204 (ML-DSA) — digital signatures for data provenance, model signing, agent credentials. C2PA (Coalition for Content Provenance and Authenticity) — content credentials standard. RFC 8446 (TLS 1.3) — transport security for AI API endpoints. NIST AI RMF — AI risk management framework',
  },
}
