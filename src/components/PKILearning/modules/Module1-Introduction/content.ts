// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the PQC 101 module.
 *
 * All verifiable facts are sourced from central registries.
 * Narrative text is explicitly labeled and separated from facts.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, NIST_DEPRECATION, FIPS_STANDARDS } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'pqc-101',
  version: '1.0.1',
  lastReviewed: '2026-08-22',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    // The deadlines below are IR 8547's; cite it so they are traceable.
    getStandard('NIST IR 8547'),
  ],

  algorithms: [
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
  ],

  deadlines: [
    {
      label: 'FIPS 203, 204, 205 published — PQC standards are official',
      year: parseInt(NIST_DEPRECATION.fipsFinalized.slice(0, 4)),
      source: 'NIST',
    },
    {
      label: 'CNSA 2.0 begins phased PQC mandates for U.S. national security systems',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    {
      label: 'NIST target: deprecate RSA-2048 and 112-bit ECC',
      year: NIST_DEPRECATION.deprecateClassical,
      source: 'NIST IR 8547',
    },
    {
      label: 'NIST target: disallow all classical public-key crypto',
      year: NIST_DEPRECATION.disallowClassical,
      source: 'NIST IR 8547',
    },
  ],

  narratives: {
    quantumThreatIntro:
      "Quantum computers use qubits instead of classical bits. Shor's Algorithm can solve the mathematical problems underlying RSA and ECC exponentially faster than any classical computer.",
    hndlExplain:
      'Harvest Now, Decrypt Later (HNDL): Adversaries record encrypted traffic today, planning to decrypt it once quantum computers become available.',
    tnflExplain:
      'Harvest Now, Forge Later (HNFL): Quantum computers could forge digital signatures, allowing attackers to impersonate trusted parties or tamper with signed firmware/documents.',
    latticeFamilyDesc:
      'Based on the mathematical hardness of lattice problems. Most NIST-selected algorithms use this approach.',
    hashFamilyDesc:
      'Security relies only on the properties of hash functions (e.g., those built on SHA-3). Very conservative — simplest security assumptions, minimal attack surface.',
    codeFamilyDesc:
      'Based on the hardness of decoding error-correcting codes. Among the oldest PQC proposals with decades of cryptanalysis.',
    symmetricMention:
      "Symmetric cryptography (like AES-256) is largely unaffected by Shor's algorithm and remains quantum-safe.",
    fips206Mention:
      'Note: The upcoming FIPS 206 (FN-DSA) standard will provide an additional lattice-based signature scheme optimized for small signatures.',
  },
}

/** FIPS standard-to-algorithm mapping for the transition table */
export const transitionTable = {
  keyEstablishment: {
    classical: 'RSA, ECDH, DH',
    pqc: FIPS_STANDARDS[203].algorithm,
    fips: 'FIPS 203',
  },
  digitalSignatures: {
    classical: 'RSA, ECDSA, EdDSA',
    pqc: FIPS_STANDARDS[204].algorithm,
    fips: 'FIPS 204',
  },
  conservativeSignatures: {
    classical: 'RSA, ECDSA',
    pqc: FIPS_STANDARDS[205].algorithm,
    fips: 'FIPS 205',
  },
}

/** PQC timeline milestones — years from regulatory constants, not hardcoded */
export const timelineMilestones = [
  {
    year: '2016',
    event: 'NIST opens the PQC standardization process (call for proposals)',
    phase: 'Research',
  },
  {
    year: '2022',
    event: 'NIST selects first PQC standards (Kyber, Dilithium, FALCON, SPHINCS+)',
    phase: 'Selection',
  },
  {
    year: String(parseInt(NIST_DEPRECATION.fipsFinalized.slice(0, 4))),
    event: 'FIPS 203, 204, 205 published — PQC standards are official',
    phase: 'Standardization',
  },
  {
    year: '2025',
    event:
      'NIST selects HQC as a backup KEM (IR 8545) and finalizes SP 800-227, its KEM usage guidance',
    phase: 'Standardization',
  },
  {
    year: String(CNSA_2_0.softwarePreferred),
    event: 'CNSA 2.0 begins phased PQC mandates for U.S. national security systems',
    phase: 'Policy',
  },
  {
    year: '2026',
    event:
      'EO 14412 sets U.S. federal civilian PQC deadlines — key establishment 2030, digital signatures 2031',
    phase: 'Policy',
  },
  {
    year: String(NIST_DEPRECATION.deprecateClassical),
    event: 'NIST target: deprecate RSA-2048 and 112-bit ECC',
    phase: 'Deprecation',
  },
  {
    year: String(NIST_DEPRECATION.disallowClassical),
    event: 'NIST target: disallow all classical public-key crypto',
    phase: 'Deadline',
  },
]
