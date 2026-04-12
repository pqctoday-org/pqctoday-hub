// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the DatabaseEncryptionPQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'database-encryption-pqc',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST SP 800-111'),
  ],

  algorithms: [
    getAlgorithm('ECDH P-256'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
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
  ],

  narratives: {
    overview:
      'ID: database-encryption-pqc. Track: Infrastructure. Level: Intermediate. Duration: 75 min. Workshop Steps: 5. This module covers quantum-safe migration for database encryption layers, TDE key management, BYOK/HYOK architecture, queryable encryption compatibility, and regulatory compliance for enterprise database fleets. ---',
    keyConcepts:
      "AES-256 is quantum-safe: Grover's algorithm reduces effective bits from 256 to 128 — still above the 112-bit security minimum. No data file re-encryption needed. DEK wrapping is the PQC target: RSA-OAEP and ECDH used to wrap DEKs must be replaced with ML-KEM-1024. ML-KEM-1024 key sizes: Public key: 1,568 bytes (vs 256 bytes RSA-2048). Ciphertext: 1,568 bytes. ~6× metadata overhead per DEK — negligible for multi-TB databases.",
  },
}
