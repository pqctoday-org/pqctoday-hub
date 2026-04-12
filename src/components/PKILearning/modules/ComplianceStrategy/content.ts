// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the ComplianceStrategy module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'compliance-strategy',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [getStandard('FIPS 203'), getStandard('NIST SP 800-227')],

  algorithms: [getAlgorithm('ML-DSA-87'), getAlgorithm('ML-KEM-1024')],

  deadlines: [
    {
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
    {
      label: 'NIST: deprecate RSA-2048 and 112-bit ECC',
      year: NIST_DEPRECATION.deprecateClassical,
      source: 'NIST IR 8547',
    },
    {
      label: 'NIST: disallow all classical public-key crypto',
      year: NIST_DEPRECATION.disallowClassical,
      source: 'NIST IR 8547',
    },
  ],

  narratives: {
    overview:
      'The Compliance & Regulatory Strategy module teaches executives how to navigate the complex and evolving landscape of PQC compliance requirements across jurisdictions. It covers jurisdiction mapping to identify applicable frameworks and deadline conflicts, audit readiness checklisting with 25 evidence items across 5 categories, and compliance timeline building that overlays organizational milestones on regulatory deadlines with gap analysis.',
    keyConcepts:
      'Major PQC Compliance Frameworks — CNSA 2.0 (NSA, US national security systems), NIST IR 8547 (US federal guidance, draft Nov 2024, finalized Mar 2025), ETSI (European standards), ANSSI (French national agency), BSI (German federal office). CNSA 2.0 Timeline — software/firmware signing preferred 2025, exclusive 2030; new networking equipment 2026; web/cloud/servers and all NSS by 2033. Compliance-First vs.',
    workshopSummary:
      'The workshop has 3 interactive steps: Jurisdiction Mapper — select from 24 jurisdictions across 4 regions (North America, Europe, Asia Pacific, Middle East); see matching compliance frameworks, earliest deadlines, and automatically detected conflicts including China algorithm divergence and early-deadline countries; export as Markdown/CSV.',
    relatedStandards:
      'NSA CNSA 2.0 (Commercial National Security Algorithm Suite 2.0). NIST IR 8547 (Transition to Post-Quantum Cryptography Standards, draft Nov 2024, final Mar 2025). NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms, Sep 2025). ETSI TS 103 744 (Quantum-Safe Cryptography). ANSSI Technical Position on PQC (2022 initial, 2023 follow-up). BSI Technical Guideline TR-02102 (Cryptographic Mechanisms). NSM-10 (National Security Memorandum on Promoting U.S.',
  },
}
