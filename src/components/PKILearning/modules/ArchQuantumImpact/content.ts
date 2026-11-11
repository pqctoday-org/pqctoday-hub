// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the ArchQuantumImpact module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import {
  CNSA_2022_PREFERRED_LABEL,
  CNSA_PHASE_OUT_LABEL,
} from '@/components/PKILearning/modules/PQCRiskManagement/data/cnsaLabels'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'arch-quantum-impact',
  version: '1.0.0',
  lastReviewed: '2026-08-10',
  lastEdited: '2026-11-11',

  // ORDER MATTERS — the accuracy spot-check samples this list by even stride and
  // reads only four. Sampled at 0,1,3,5: FIPS 203 (the ML-KEM ciphertext sizes this module quotes),
  // SP 800-227 (hybrid KEM combiners), RFC 9147 (DTLS record growth) and IR 8547
  // (the transition timeline). The remaining FIPS specs are background here.
  standards: [
    getStandard('FIPS 203'),
    getStandard('NIST SP 800-227'),
    getStandard('FIPS 204'),
    getStandard('RFC 9147'),
    getStandard('FIPS 205'),
    getStandard('NIST IR 8547'),
    getStandard('NIST SP 800-208'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('NSA CNSA 2.0'),
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
      label: CNSA_2022_PREFERRED_LABEL,
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: CNSA_PHASE_OUT_LABEL, year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
  ],

  narratives: {
    overview:
      'Architect Quantum Impact connects six descriptive architecture scenarios to skill self-ratings, a phased action checklist and a nine-item exposure checklist. Separate linked tools support certificate-payload estimates, TLS configuration experiments and hybrid-certificate comparisons. The module also contains the Strangler Fig model and the source-attributed Trust Hardware Selector.',
    keyConcepts:
      'KMS Migration Complexity — key wrapping hierarchies must be redesigned to accommodate ML-KEM-768/1024 ciphertexts (1,088/1,568 bytes vs. RSA-OAEP 256 bytes); HSM firmware upgrades are required for hardware-backed PQC key generation — not all current HSM models have PQC firmware available; key wrapping with ML-KEM requires re-encryption of all existing DEKs under new PQC KEKs (envelope re-encryption at scale).',
    workshopSummary:
      'The workshop has six steps. Why It Matters shows six expandable impact/scenario cards and links to separate sample tools. What to Learn offers skill self-ratings and linked learning modules. How to Act provides a phased action checklist with Markdown export. Architecture Readiness is a nine-item exposure checklist, not an architecture scanner. Strangler Fig models migration of a legacy monolithic crypto service behind a PQC API gateway. Trust Hardware Selector compares eight kinds of trust hardware in cards and a 10-row grid, with Pick the right one and How they combine exercises. Its source-attributed Tessera material distinguishes specification and code from a product or certificate. Separate certificate-capacity, TLS and hybrid-certificate tools support design investigations; the role cards do not calculate chain/OCSP sizes or P99 budgets.',
    relatedStandards:
      'FIPS 203 (ML-KEM — parameter sets: ML-KEM-512, ML-KEM-768, ML-KEM-1024). FIPS 204 (ML-DSA — parameter sets: ML-DSA-44, ML-DSA-65, ML-DSA-87). FIPS 205 (SLH-DSA — 12 parameter sets including SLH-DSA-SHAKE-128f, SLH-DSA-SHAKE-256s). NIST IR 8547 (Transition to Post-Quantum Cryptography Standards). NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms — hybrid KEM combiners). NIST SP 800-208 (Recommendation for Stateful Hash-Based Signature Schemes — LMS/XMSS).',
  },
}

/** Separate sample tools rendered beside the role scenarios; not embedded role calculators. */
export const rolePracticeResources: readonly {
  readonly label: string
  readonly href: string
  readonly decision: string
  readonly capability: string
  readonly limits: string
}[] = [
  {
    label: 'Estimate certificate-related TLS payload',
    href: '/playground/cert-capacity',
    decision:
      'Compare certificate payload and renewal-storage assumptions before choosing a PKI migration design.',
    capability:
      'Adjust the three-level-chain model and leaf renewal cadence; compare estimated intermediate-plus-leaf TLS payload and annual leaf issuance storage.',
    limits:
      'The root is excluded from the TLS payload. This model does not predict CPU capacity, P99 latency, OCSP response size or MTU fragmentation.',
  },
  {
    label: 'Explore TLS configuration compatibility',
    href: '/playground/tls-simulator',
    decision: 'Choose client/server combinations to test before changing a shared protocol policy.',
    capability:
      'Configure sample TLS groups, cipher suites and identities and inspect the handshake interaction.',
    limits:
      'Use your own endpoints and workload to measure latency budgets, fallback behaviour and compatibility; this is not a P99 feasibility calculator.',
  },
  {
    label: 'Compare sample hybrid certificate formats',
    href: '/playground/hybrid-certs',
    decision: 'Distinguish certificate-format choices before assessing relying-party support.',
    capability:
      'Generate sample certificates and compare their parsed formats and verification results.',
    limits:
      'Sample format verification does not establish that your clients accept the format, that a vendor HSM supports it or that a product is certified.',
  },
]
