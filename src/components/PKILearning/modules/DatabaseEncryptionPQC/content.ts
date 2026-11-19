// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the DatabaseEncryptionPQC module.
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
  moduleId: 'database-encryption-pqc',
  version: '1.0.1',
  lastReviewed: '2026-08-10',
  lastEdited: '2026-11-18',

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
    // DECLARED 2026-08-23: this module names "NSM-8" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('NSM-8'),
    // round 9 wave 4 (2026-09-19): cited for the figures the accuracy record found unmapped
    getStandard('Key-Management-Interoperability-Protocol-Specification-Versi'), // m-database-encryption-pqc: KMIP 2.0
    getStandard('The-Applied-Quantum-PQC-Migration-Framework-Universal-Versio'), // m-database-encryption-pqc: §5.6
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
      label: CNSA_2022_PREFERRED_LABEL,
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: CNSA_PHASE_OUT_LABEL, year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
  ],

  narratives: {
    overview:
      'ID: database-encryption-pqc. Track: Infrastructure. Level: Intermediate. Duration: 75 min. Workshop Steps: 5. This module covers quantum-safe migration for database encryption layers, TDE key management, BYOK/HYOK architecture, queryable encryption compatibility, and regulatory compliance for enterprise database fleets. ---',
    keyConcepts:
      "Shor's algorithm does not break AES; Grover's algorithm reduces effective key-search strength, so AES-256 retains a 128-bit margin and is a common quantum-resistant symmetric choice. The actual data cipher varies by database product and configuration. Review asymmetric key establishment, DEK wrapping and KMS transport independently. FIPS 203 recommends ML-KEM-768 as the default parameter set; CNSA 2.0 specifies ML-KEM-1024 for its applicable NSS use. FIPS 203 sizes: ML-KEM-1024 encapsulation key 1,568 bytes and ciphertext 1,568 bytes. If a proposed design stores one ciphertext per wrapped DEK, metadata growth scales with key count and serialization format; this is not a generally supported database command or a measured estimate.",
  },
}
