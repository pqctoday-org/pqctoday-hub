// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the HsmPqc module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'hsm-pqc',
  version: '1.0.0',
  lastReviewed: '2026-08-10',
  lastEdited: '2026-08-23',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    // Repointed 2026-08-22: this declared the DEPRECATED row `NIST SP 800-108`,
    // whose superseded_by names this one. A module pointing the accuracy check at a
    // retired row is worse than pointing it nowhere — the check runs, reads a
    // superseded document, and reports success.
    getStandard('NIST-SP-800-108-R1'),
    getStandard('NIST SP 800-208'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('RFC 3394'),
  ],

  algorithms: [
    getAlgorithm('ECDH P-256'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
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
      'HSM architecture for PQC (FIPS 140-3 levels, on-prem vs cloud side-by-side). PKCS#11 v3.2 PQC mechanisms (CKM_ML_KEM_KEY_PAIR_GEN, CKM_ML_KEM, CKM_ML_DSA_KEY_PAIR_GEN, CKM_ML_DSA, CKM_HASH_ML_DSA, plus CKK_ML_KEM and CKK_ML_DSA key types). On-prem HSM deep dive (Thales Luna v7.9.2, Entrust nShield v13.8.0, Utimaco Quantum Protect). Cloud HSM deep dive (AWS CloudHSM, Azure Dedicated HSM, Google Cloud HSM). Side-channel attack surfaces (NTT power analysis, EM emanation, fault injection, ML-DSA hedged signing).',
    workshopSummary:
      'PKCS#11 PQC Simulator — 8 operations with classical comparison and on-prem vs cloud notes. Vendor Comparison — Interactive matrix with PQC Maturity Score (0-100). HSM Migration Planner — 4-phase firmware migration wizard. FIPS Validation Tracker — CMVP/CAVP PQC validation status per vendor',
    relatedStandards:
      'FIPS 140-3 (Cryptographic Module Validation). PKCS#11 v3.2 (ratified OASIS Standard, 3 June 2026 — adds ML-KEM, ML-DSA, SLH-DSA mechanisms; supersedes v3.1 from 2023). FIPS 203/204/205 (ML-KEM, ML-DSA, SLH-DSA). NIST SP 800-208 (Stateful Hash-Based Signatures). CNSA 2.0 (NSA)',
  },
}
