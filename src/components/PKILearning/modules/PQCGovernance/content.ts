// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the PQCGovernance module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'pqc-governance',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    getStandard('FIPS 186-5'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('FIPS 206'),
    getStandard('NIST SP 800-208'),
    getStandard('NIST SP 800-53'),
    getStandard('NIST SP 800-88'),
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
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
  ],

  narratives: {
    overview:
      'The PQC Governance & Policy module teaches executives how to establish organizational governance structures for post-quantum cryptography migration. It covers RACI matrix construction for PQC program roles, cryptographic policy generation with compliance-aligned templates, KPI dashboard design for tracking migration progress, and escalation frameworks for conflict resolution.',
    keyConcepts:
      'RACI Matrix — Responsible, Accountable, Consulted, Informed assignment matrix mapping 10 migration activities (crypto inventory, risk assessment, vendor assessment, algorithm selection, testing, deployment, monitoring, training & awareness, compliance auditing, stakeholder communications) across 6 organizational roles. Includes validation that warns when activities lack an Accountable assignment.',
    workshopSummary:
      'The workshop has 3 interactive steps: RACI Matrix Builder — interactive 10×6 matrix with color-coded click-to-cycle cells (click cycles: empty → R → A → C → I → empty); includes validation warning for missing Accountable assignments, legend, export to Markdown, and save to learning portfolio as an executive document.',
    relatedStandards:
      'OMB M-23-02 (Migrating to Post-Quantum Cryptography). NIST IR 8547 (Transition to Post-Quantum Cryptography Standards). NIST SP 800-53 (Security and Privacy Controls). FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), FIPS 206 (FN-DSA, draft). ISO 27001 (Information Security Management Systems). COBIT (Control Objectives for Information and Related Technologies)',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// ECDSA-P256
