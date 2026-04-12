// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the ArchQuantumImpact module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'arch-quantum-impact',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST SP 800-208'),
    getStandard('NIST SP 800-227'),
    getStandard('RFC 9147'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('FN-DSA-512'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('RSA-4096'),
    getAlgorithm('SLH-DSA-SHAKE-128f'),
    getAlgorithm('SLH-DSA-SHAKE-256s'),
  ],

  deadlines: [
    {
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
  ],

  narratives: {
    overview:
      'The Architect Quantum Impact module addresses the structural design decisions that determine whether a system can migrate to post-quantum cryptography gracefully or requires full re-architecture. It covers six high-impact architectural concerns — KMS and HSM migration complexity, certificate chain size explosion, hybrid algorithm path design, algorithm selection for constrained and general environments, TLS handshake latency budgets, and crypto-agility debt — alongside a nine-criterion archit...',
    keyConcepts:
      'KMS Migration Complexity — key wrapping hierarchies must be redesigned to accommodate ML-KEM-768/1024 ciphertexts (1,088/1,568 bytes vs. RSA-OAEP 256 bytes); HSM firmware upgrades are required for hardware-backed PQC key generation — not all current HSM models have PQC firmware available; key wrapping with ML-KEM requires re-encryption of all existing DEKs under new PQC KEKs (envelope re-encryption at scale).',
    workshopSummary:
      'The workshop has 3 interactive steps: Threat Impact Explorer — six-panel architectural briefing: KMS/HSM migration complexity matrix (by HSM vendor tier and key hierarchy depth), certificate chain size calculator (input: cert count + algorithm + chain depth → output: total chain size, MTU fragmentation risk, OCSP response size), hybrid architecture decision flowchart (KEM combiner selection, fallback logic patterns, dual-cert vs.',
    relatedStandards:
      'FIPS 203 (ML-KEM — parameter sets: ML-KEM-512, ML-KEM-768, ML-KEM-1024). FIPS 204 (ML-DSA — parameter sets: ML-DSA-44, ML-DSA-65, ML-DSA-87). FIPS 205 (SLH-DSA — 12 parameter sets including SLH-DSA-SHAKE-128f, SLH-DSA-SHAKE-256s). NIST IR 8547 (Transition to Post-Quantum Cryptography Standards). NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms — hybrid KEM combiners). NIST SP 800-208 (Recommendation for Stateful Hash-Based Signature Schemes — LMS/XMSS).',
  },
}
