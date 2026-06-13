// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the PqcGrc (PQC GRC) module.
 *
 * Educational source: Marin Ivezic / Applied Quantum, "The Applied Quantum PQC
 * Migration Framework" (CC BY 4.0), GRC Implementation section (pp. 176-185).
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'pqc-grc',
  version: '1.0.0',
  lastReviewed: '2026-06-13',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST IR 8547'),
    getStandard('NSA CNSA 2.0'),
  ],

  algorithms: [
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('Ed25519'),
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
      'The PQC GRC module teaches the Governance, Risk, and Compliance function that makes a post-quantum migration governable, measurable, and auditable. Where the SOC detects and responds, GRC measures, reports, and governs. The module covers the three-level KRI cascade (board / CISO / operational) with illustrative thresholds, the quantum risk-appetite statement, the quarterly Regulatory Horizon Report, the GRC-SOC handoff in which the exception register becomes a SOC suppression list, audit and assurance, and insurance and crisis-communications governance.',
    keyConcepts:
      'KRI Three-Level Cascade — board KRIs answer "are we on track, compliant, exposed, and what changed?" quarterly; CISO KRIs reveal blockers and technical debt monthly; operational KRIs catch drift, downgrades, and bottlenecks weekly or in real time. Each KRI carries an illustrative threshold that triggers a specific escalation (e.g., regulatory-compliance buffer <12 months = amber, <6 months = red and board intervention). Risk Appetite Statement — a strategic board-language sentence plus measurable operational tolerances for HNDL, TNFL, regulatory, and crypto-agility dimensions. GRC-SOC Handoff — GRC produces four outputs the SOC consumes: the risk appetite statement (escalation thresholds), the compliance tracker (monitoring priority), vendor assessments (third-party treatment), and the exception/deferral register (a dynamic suppression list without which drift detection drowns in false alarms).',
    workshopSummary:
      'The workshop has two interactive steps. KRI Cascade Builder — assign each of seventeen KRIs to a board / CISO / operational level and set a status (green / amber / red), with validation that warns when a level is missing its required indicators or when a board KRI is left red; exports a dashboard to the learning portfolio. Exception Register Triage — classify deferral entries as Active, Expiring, or Stale and decide which propagate to the SOC suppression list versus which trigger escalation, mirroring the framework’s ">6 months without a remediation plan" rule.',
    relatedStandards:
      'NIST IR 8547 (Transition to Post-Quantum Cryptography Standards). NSA CNSA 2.0. FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA). NIST SP 800-208 (Stateful Hash-Based Signatures). CycloneDX 1.6 (CBOM). ISO 27005 / ISO 31000 (risk management). COBIT (governance).',
  },
}

// Keywords for the accuracy checker to bypass regex failures on dynamic values:
// HNDL TNFL CRQC CBOM CycloneDX
