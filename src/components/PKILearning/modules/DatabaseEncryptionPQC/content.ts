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
  lastReviewed: '2026-08-10',
  lastEdited: '2026-08-23',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST SP 800-111'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('NSM-10'),
    getStandard('RFC 3394'),
    // DECLARED 2026-08-23: this module tells a reader that keys live in a FIPS 140-3
    // validated module and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match the
    // prose "FIPS 140-3" against a row filed as FIPS-140-3-STANDARD.
    getStandard('FIPS-140-3-STANDARD'),
    // DECLARED 2026-08-23: this module labels an AES-GCM mechanism it describes as conforming to SP 800-38D
    // and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match the
    // prose "SP 800-38D" against a row filed as NIST-SP-800-38D.
    getStandard('NIST-SP-800-38D'),
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
      "AES-256 is quantum-safe: Grover's algorithm reduces effective bits from 256 to 128, but AES-256 still meets NIST PQC Category 5 — the highest (AES-128 = Cat 1, AES-192 = Cat 3, AES-256 = Cat 5). Those categories already assume Grover's speedup — AES-128 still meets Category 1 and AES-192 still meets Category 3; AES-256 simply offers the largest security margin. No data file re-encryption needed. DEK wrapping is the PQC target: RSA-OAEP and ECDH used to wrap DEKs must be replaced with ML-KEM-1024. ML-KEM-1024 key sizes: Public key: 1,568 bytes (vs 256 bytes RSA-2048). Ciphertext: 1,568 bytes. ~6× metadata overhead per DEK — negligible for multi-TB databases.",
  },
}
