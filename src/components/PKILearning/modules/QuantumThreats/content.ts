// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the QuantumThreats module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'quantum-threats',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [getStandard('FIPS 203')],

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
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
    {
      label: 'NIST: deprecate RSA-2048 and 112-bit ECC',
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
      "The Quantum Threats module provides an in-depth technical explanation of how quantum computers threaten current cryptographic systems. It covers the physics of qubits and superposition, explains Shor's algorithm (which breaks RSA and ECC) and Grover's algorithm (which weakens AES and SHA), presents CRQC timeline projections from multiple agencies, and details both the HNDL (Harvest Now, Decrypt Later) and HNFL (Harvest Now, Forge Later) attack models.",
    keyConcepts:
      "Qubits and superposition — quantum bits exist in a combination of 0 and 1 simultaneously; entanglement correlates qubits so N qubits can process 2^N states in parallel. Shor's Algorithm — solves integer factorization (RSA) and discrete logarithm (ECC/DH) in polynomial time O(n^3); RSA-2048 requires approximately 4,098 logical qubits; P-256 requires approximately 2,330 logical qubits.",
    workshopSummary:
      'The workshop has 5 interactive steps: Security Level Degradation — visualize how quantum attacks reduce the effective security level of classical algorithms, with configurable algorithm selection. Algorithm Vulnerability Matrix — comprehensive comparison grid of all algorithms versus quantum attack types. Key Size Analyzer — side-by-side comparison of two algorithms showing key sizes, ciphertext sizes, and security parameters.',
    relatedStandards:
      'NIST IR 8547 (Transition to Post-Quantum Cryptography Standards). NSA CNSA 2.0. BSI Technical Recommendations (Germany). ANSSI Guidance on Post-Quantum Cryptography (France). Global Risk Institute Quantum Threat Timeline',
  },
}
