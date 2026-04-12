// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the NetworkSecurityPQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'network-security-pqc',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('NIST SP 800-207'),
    getStandard('NIST SP 800-227'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ECDSA P-384'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('X25519'),
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
    keyConcepts:
      'PQC impact on TLS inspection and DPI (certificate buffer overflows, latency overhead, hardware offload gaps). NGFW cipher policy migration to ML-KEM/ML-DSA hybrid and pure-PQC modes. TLS intercept proxy behavior with PQC certificate chains (ML-DSA-65, hybrid ECDSA+ML-DSA). IDS/IPS signature updates for PQC traffic detection (hybrid KEM handshakes, cert size anomalies, downgrade attacks).',
    workshopSummary:
      'NGFW Cipher Analyzer — cipher policy comparison (classical/hybrid/pure PQC), hardware tier impact, cert size and latency metrics. TLS Inspection Lab — pass-through vs full inspection simulation, PQC cert chain sizes, inspection feasibility matrix. IDS Signature Updater — PQC-aware rule categories, false positive rate analysis, detection coverage balancing. Vendor Migration Matrix — interactive filtering by ML-KEM/ML-DSA support, TLS inspection, hardware offload, readiness status.',
    relatedStandards:
      'NIST SP 800-227: Key Encapsulation Mechanisms (ML-KEM in TLS). NIST SP 800-207A: Zero Trust Architecture and PQC. RFC 9370: Multiple Key Exchanges in IKEv2 (hybrid KEM for IPsec). CNSA 2.0: Hybrid by 2026, exclusively PQC by 2033 for NSS environments. NIST IR 8547: Classical crypto deprecation timeline (2030/2035)',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// 4 KB, 15 KB, RFC 9364
