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
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST SP 800-108'),
    getStandard('NIST SP 800-208'),
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
      'HSM architecture for PQC (FIPS 140-3 levels, on-prem vs cloud side-by-side). PKCS#11 v3.2 PQC mechanisms (CKM*ML_KEM*_, CKM*ML_DSA*_, CKK_* key types). On-prem HSM deep dive (Thales Luna v7.9.2, Entrust nShield v13.8.0, Utimaco Quantum Protect). Cloud HSM deep dive (AWS CloudHSM, Azure Dedicated HSM, Google Cloud HSM). Side-channel attack surfaces (NTT power analysis, EM emanation, fault injection, ML-DSA hedged signing).',
    workshopSummary:
      'PKCS#11 PQC Simulator — 8 operations with classical comparison and on-prem vs cloud notes. Vendor Comparison — Interactive matrix with PQC Maturity Score (0-100). HSM Migration Planner — 4-phase firmware migration wizard. FIPS Validation Tracker — CMVP/CAVP PQC validation status per vendor',
    relatedStandards:
      'FIPS 140-3 (Cryptographic Module Validation). PKCS#11 v3.2 (OASIS PQC draft). FIPS 203/204/205 (ML-KEM, ML-DSA, SLH-DSA). NIST SP 800-208 (Stateful Hash-Based Signatures). CNSA 2.0 (NSA)',
  },
}
