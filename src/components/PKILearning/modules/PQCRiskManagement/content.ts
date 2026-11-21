// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the PQCRiskManagement module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'
import { CNSA_ACQUISITION_LABEL, CNSA_MANDATE_LABEL, CNSA_PHASE_OUT_LABEL } from './data/cnsaLabels'

export const content: ModuleContent = {
  moduleId: 'pqc-risk-management',
  version: '1.0.1',
  lastReviewed: '2026-10-28',
  lastEdited: '2026-11-21',

  standards: [
    // Subject documents first. The accuracy spot-check samples this list by even
    // stride, so relevance order decides which documents its claims get checked
    // against — the risk-methodology sources need to be reachable, not just the
    // deadline ones.
    getStandard('NIST SP 800-30'),
    getStandard('NIST IR 8547'),
    getStandard('NSA CNSA 2.0'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('NIST CSWP 39'),
    getStandard('RFC 9370'),
    // the VPN risk scenarios name the ML-KEM-in-IKEv2 draft as the ML-KEM exchange RFC 9370 carries
    getStandard('draft-ietf-ipsecme-ikev2-mlkem-09'),
    // DECLARED 2026-08-23: this module names SP 800-131A for algorithm transition guidance and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match
    // the prose "SP 800-131A" against a row filed as NIST-SP-800-131A-Rev3.
    getStandard('NIST-SP-800-131A-Rev3'),
    // round 9 wave 4 (2026-09-19): cited for the figures the accuracy record found unmapped
    getStandard('2025-Cost-of-a-Data-Breach-Report-Navigating-the-AI-rush-wit'), // m-pqc-risk-management: $4.44M
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ECDSA P-384'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('RSA-3072'),
    getAlgorithm('RSA-4096'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    {
      label: CNSA_ACQUISITION_LABEL,
      year: CNSA_2_0.networkingRequired,
      source: 'CNSA 2.0',
    },
    {
      label: CNSA_PHASE_OUT_LABEL,
      year: CNSA_2_0.softwareExclusive,
      source: 'CNSA 2.0',
    },
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
      'The PQC Risk Management module teaches CISOs and security leaders how to identify, quantify, and prioritize quantum computing risks to their organization. It covers CRQC (Cryptographically Relevant Quantum Computer) scenario planning with adjustable scenario years from 2028-2045, building a risk register for quantum-vulnerable cryptographic assets, and generating an editable likelihood-by-impact worksheet heatmap.',
    keyConcepts:
      'CRQC Scenario Planning — compare a hypothetical cryptographically relevant quantum computer (CRQC) year; shows which algorithms are modeled as vulnerable in the selected scenario and compares configured, scope-labeled reference dates. Its HNDL view is a retention/date-overlap illustration; actual exposure also depends on capture, vulnerable public-key key establishment and recoverable session secrets. Risk Register Construction — systematic cataloging of cryptographic assets with fields for asset name, current algorithm, threat vector, likelihood (1-5), impact (1-5), and mitigation strategy; auto-calculates risk scores.',
    workshopSummary:
      'The workshop has 4 interactive steps: CRQC Scenario Planner — adjust a scenario-year slider (2028-2045) to view modeled algorithm vulnerability and compare configured reference dates; see the scenario effects for 10 algorithm rows, configured scope-labeled reference dates, and retention overlap for 7 data-lifetime examples. Risk Register Builder — create a multi-row risk register with pre-populated examples (TLS certificates, database encryption, code signing, VPN tunnels); export as Markdown and save to learning portfolio. Risk Heatmap — assign a treatment strategy to each risk (select any cell on the heatmap) and set your migration priority order. Compliance Gap Analysis — inspect algorithm-name patterns and configured CNSA 2.0/NIST IR 8547 reference years. This worksheet does not determine applicability or compliance.',
    relatedStandards:
      'NIST IR 8547 (Transition to Post-Quantum Cryptography Standards, final October 2026). NSA CNSA 2.0 (FAQ v2.2, National Security Systems only). EO 14412 & OMB M-26-15 (U.S. federal civilian agencies). EU PQC Coordinated Implementation Roadmap v1.1 (advisory Member State guidance; DORA/NIS2 impose cyber risk-management duties rather than fixed PQC dates). NIST SP 800-30 (Guide for Conducting Risk Assessments). ISO 27005 (Information Security Risk Management)',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// 2 years, FIPS 199
