// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the HealthcarePQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'healthcare-pqc',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST SP 800-111'),
    getStandard('NIST SP 800-66'),
  ],

  algorithms: [
    getAlgorithm('ECDH P-256'),
    getAlgorithm('ECDH P-384'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ECDSA P-384'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('RSA-4096'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    overview:
      'Intermediate-level module (75 min, 5 workshop steps) covering post-quantum cryptography migration for the healthcare industry — a sector with the highest density of irreplaceable biometric data, long data retention requirements (PHI, genomic records), life-critical medical device security, and complex regulatory obligations under HIPAA, GDPR Article 9, and FDA cybersecurity guidance.',
    keyConcepts:
      'Biometric data profiles and irreplaceability: Healthcare holds uniquely irreplaceable biometric data — unlike passwords, biometrics cannot be rotated when compromised. PQC protection priority is driven by replaceability and lifetime sensitivity: Fingerprint (512-byte template, irreplaceable — unique ridge patterns, recommend ML-KEM-768 + ML-DSA-65). Iris (256-byte template, irreplaceable — stable for life, unique per person, ML-KEM-768 + ML-DSA-65).',
    workshopSummary:
      'BiometricVaultAssessor — Inventory biometric data types by replaceability tier, template size, and storage system; map each to recommended ML-KEM/ML-DSA variant; calculate vault re-keying scope and estimated data re-encryption time for a hospital network with 500K patient records.',
    relatedStandards:
      'HIPAA Security Rule (45 CFR Part 164) — PHI encryption standards and administrative safeguards. GDPR Articles 9, 17, 32 — Special category data, Right to Erasure, technical security measures. FDA Cybersecurity in Medical Devices Guidance (September 2023) — premarket and post-market requirements. IEC 62443-4-2 — Security for Industrial Automation and Control Systems: Component Requirements. HL7 FHIR R4/R5 — Fast Healthcare Interoperability Resources (API security).',
  },
}
