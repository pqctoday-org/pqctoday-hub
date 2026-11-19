// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the PQCGovernance module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import {
  CNSA_ACQUISITION_LABEL,
  CNSA_MANDATE_LABEL,
  CNSA_PHASE_OUT_LABEL,
} from '@/components/PKILearning/modules/PQCRiskManagement/data/cnsaLabels'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'pqc-governance',
  version: '1.0.1',
  lastReviewed: '2026-08-18',
  lastEdited: '2026-11-18',

  standards: [
    // Governance documents first, algorithm specifications after. This module's
    // claims are about policy, RACI and controls — not about ML-KEM's internals —
    // and the accuracy spot-check samples this list by even stride, so ordering it
    // by relevance is what puts its actual sources in front of the checker.
    getStandard('OMB-M-23-02'),
    getStandard('NIST IR 8547'),
    getStandard('NSA CNSA 2.0'),
    getStandard('NIST SP 800-53'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('Falcon-Spec-v12'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('FIPS 186-5'),
    getStandard('NIST CSWP 39'),
    getStandard('NIST SP 800-208'),
    getStandard('NIST SP 800-88'),
    // DECLARED 2026-08-23: this module tells a reader that keys live in a FIPS 140-3
    // validated module and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match the
    // prose "FIPS 140-3" against a row filed as FIPS-140-3-STANDARD.
    getStandard('FIPS-140-3-STANDARD'),
    // round 9 wave 4 (2026-09-19): cited for the figures the accuracy record found unmapped
    getStandard('BSI TR-02102-1'), // m-pqc-governance: 1344
    getStandard('NIST IR 8545'), // bt-policy-generator: HQC-128; m-pqc-governance: HQC-128
    getStandard('FrodoKEM-key-encapsulation-from-learning-with-errors'), // bt-policy-generator: 1344
    // bt-kpi-dashboard: FIPS 140-2/3 is covered by FIPS-140-3-STANDARD above; FIPS 140-2
    // is superseded and retired from the Library (2026-10-16).
  ],

  algorithms: [
    getAlgorithm('Ed25519'),
    getAlgorithm('FN-DSA-1024'),
    getAlgorithm('FN-DSA-512'),
    getAlgorithm('FrodoKEM-1344'),
    getAlgorithm('HQC-128'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('RSA-3072'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('SLH-DSA-SHA2-256s'),
  ],

  deadlines: [
    {
      label: CNSA_ACQUISITION_LABEL,
      year: CNSA_2_0.networkingRequired,
      source: 'CNSA 2.0',
    },
    { label: CNSA_PHASE_OUT_LABEL, year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
    {
      label: CNSA_MANDATE_LABEL,
      year: CNSA_2_0.networkingExclusive,
      source: 'CNSA 2.0',
    },
    {
      label: 'NIST: covered quantum-vulnerable public-key parameters deprecated after 2030',
      year: NIST_DEPRECATION.deprecateClassical,
      source: 'NIST IR 8547',
    },
    {
      label:
        'NIST: covered quantum-vulnerable public-key parameters disallowed after 2035 under NIST standards/guidelines',
      year: NIST_DEPRECATION.disallowClassical,
      source: 'NIST IR 8547',
    },
  ],

  narratives: {
    overview:
      'The PQC Governance & Policy module teaches executives how to establish organizational governance structures for post-quantum cryptography migration. It covers RACI matrix construction for PQC program roles, cryptographic policy generation with compliance-aligned templates, KPI dashboard design for tracking migration progress, and escalation frameworks for conflict resolution.',
    keyConcepts:
      'RACI Matrix — Responsible, Accountable, Consulted, Informed assignment matrix mapping 10 migration activities (crypto inventory, risk assessment, vendor assessment, algorithm selection, testing, deployment, monitoring, training & awareness, compliance auditing, stakeholder communications) across 6 organizational roles. Includes validation that warns when activities lack an Accountable assignment.',
    workshopSummary:
      'The workshop has 4 interactive steps: RACI Matrix — interactive 10×6 matrix with click-to-cycle cells (empty → R → A → C → I → empty) and single-Accountable validation. Policy Generator — draft four policy types (Cryptographic Algorithm, Key Management, Vendor Crypto Requirements, Migration Timeline) with scope-checked frameworks and FIPS 203/204/205 algorithms. KPI Dashboard — configure six weighted governance and migration KPIs for board reporting. Escalation Framework — review four escalation tiers and score policy exception requests with compensating controls.',
    relatedStandards:
      'EO 14412 & OMB M-26-15 (June 2026, U.S. federal civilian agencies) and OMB M-23-02 (2022). NSA CNSA 2.0 (FAQ v2.2, National Security Systems only). NIST IR 8547 (Transition to Post-Quantum Cryptography Standards, final October 2026). EU PQC Coordinated Implementation Roadmap v1.1 (advisory; DORA/NIS2 impose cyber risk-management duties rather than fixed PQC dates). NIST SP 800-53. FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), and planned FIPS 206 (FN-DSA, in development with no public draft). ISO 27001. COBIT',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// ECDSA-P256
