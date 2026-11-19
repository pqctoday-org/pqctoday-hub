// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the QuantumThreats module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import {
  CNSA_2022_PREFERRED_LABEL,
  CNSA_PHASE_OUT_LABEL,
} from '@/components/PKILearning/modules/PQCRiskManagement/data/cnsaLabels'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'quantum-threats',
  version: '1.0.6',
  lastReviewed: '2026-10-28',
  lastEdited: '2026-11-18',

  standards: [
    // Resource-estimate papers first — every qubit figure in this module comes
    // from one of these four, and they are the claims most likely to go stale.
    // The accuracy spot-check samples this list by even stride, so relevance
    // order is what decides which documents the numbers get checked against.
    getStandard('ref-gidney-factor-rsa'),
    getStandard('ref-gidney-factor-rsa-8h'), // DH-2048 row: finite-field discrete-log Tables 4 and 5
    getStandard('Google-QuantumAI-EC-Crypto-Quantum-2026'),
    getStandard('FIPS 203'),
    getStandard('Reducing-the-Number-of-Qubits-in-Quantum-Factoring'),
    getStandard('Reducing-the-Number-of-Qubits-in-Quantum-Discrete-Logarithms'),
    getStandard('NIST IR 8547'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('FIPS 186-5'),
    getStandard('FIPS 204'),
    getStandard('NSA CNSA 2.0'),
    getStandard('NSM-10'),
    // round 9 wave 4c (2026-09-20): cited for the figures the accuracy record found unmapped
    getStandard('A-fast-quantum-mechanical-algorithm-for-database-search'), // m-quantum-threats: 1996
    getStandard('Factoring-using-2n-2-qubits-with-Toffoli-based-modular-multi'), // m-quantum-threats: 4,098
    // round 9 wave 4c (2026-09-20): cited for the figures the accuracy record found unmapped
    getStandard('Polynomial-Time-Algorithms-for-Prime-Factorization-and-Discr'), // m-quantum-threats: wave 4c
    getStandard('GRI-Quantum-Threat-Timeline-2025'), // m-quantum-threats: wave 4c
    // IBM gross code "12 logical in 288 physical" (quantumConstants): Bravyi et al., Nature 2024
    getStandard('ref-bravyi-quantum-memory'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ECDSA P-384'),
    getAlgorithm('Ed25519'),
    getAlgorithm('FN-DSA-512'),
    getAlgorithm('HQC-128'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('RSA-3072'),
    getAlgorithm('RSA-4096'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    {
      label: CNSA_2022_PREFERRED_LABEL,
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: CNSA_PHASE_OUT_LABEL, year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
    {
      label: 'NIST: deprecate quantum-vulnerable public-key crypto (RSA, ECC)',
      year: NIST_DEPRECATION.deprecateClassical,
      source: 'NIST IR 8547',
    },
    {
      label: 'NIST: disallow all classical public-key crypto',
      year: NIST_DEPRECATION.disallowClassical,
      source: 'NIST IR 8547',
    },
  ],

  narratives: {
    overview:
      "The Quantum Threats module provides an in-depth technical explanation of how quantum computers threaten current cryptographic systems. It covers the physics of qubits and superposition, explains that a sufficiently capable CRQC running Shor's algorithm threatens RSA and discrete-log public-key cryptography, while Grover gives a quadratic query speedup for unstructured search and hash-collision attacks use different analysis. It presents CRQC planning scenarios and migration milestones from multiple sources, and details both the HNDL (Harvest Now, Decrypt Later) and HNFL (Harvest Now, Forge Later) attack models.",
    keyConcepts:
      "Qubits and superposition — quantum bits exist in a combination of 0 and 1 simultaneously; entanglement correlates them, so an N-qubit register holds a superposition over 2^N basis states at once. That is not 2^N computations run in parallel: a measurement returns one outcome, so an algorithm only wins when interference concentrates amplitude onto the answer — which is precisely what Shor's does. Shor's Algorithm — solves integer factorization and discrete logarithms in polynomial time. Concrete gate, depth, and qubit counts depend on the circuit and hardware model. Gidney's 2025 RSA-2048 estimate reports 1,537 logical qubits for its particular circuit; the Google Quantum AI / Ethereum Foundation 2026 estimate is specific to secp256k1 and must not be generalized to every 256-bit curve.",
    workshopSummary:
      'The workshop has 6 interactive steps: Step 1 (Security Level Degradation) — visualize how quantum attacks reduce the effective security level of classical algorithms, with configurable algorithm selection; Step 2 (Algorithm Vulnerability Matrix) — comprehensive comparison grid of all algorithms versus quantum attack types; Step 3 (Key Size Analyzer) — side-by-side comparison of two algorithms showing key sizes, ciphertext sizes, and security parameters; Step 4 (HNDL Timeline) — model confidentiality migration deadlines using Mosca’s Theorem; Step 5 (HNFL Risk Calculator) — model signing-credential rotation windows before CRQC recovery; Step 6 (Trajectory to Q-Day) — compare logical-qubit roadmaps against published, model-specific RSA and elliptic-curve resource estimates.',
    relatedStandards:
      'NIST IR 8547 (final, October 2026 — Transition to Post-Quantum Cryptography Standards). NSA CNSA 2.0 (FAQ v2.2). BSI Technical Recommendations (Germany). ANSSI Guidance on Post-Quantum Cryptography (France). Global Risk Institute Quantum Threat Timeline.',
  },
}
