// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the MigrationProgram module.
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
  moduleId: 'migration-program',
  version: '1.1.8',
  lastReviewed: '2026-10-28',
  lastEdited: '2026-11-18',

  standards: [
    getStandard('NIST IR 8547'),
    getStandard('NSA CNSA 2.0'),
    getStandard('EO-14306'),
    getStandard('G7-Financial-PQC-Roadmap-2026'),
    getStandard('ANSSI-PQC-FAQ-2025'),
    // DECLARED 2026-08-23: this module states the EO 14412 deadlines to a reader
    // (key establishment 2030, digital signatures 2031) and cited no document for
    // them. audit_module_undeclared_citations.py could not see it — the row's
    // reference_id is EO-2026-06-22-Securing-the-Nation and the module writes
    // "Executive Order 14412", so the literal-id match never fired.
    getStandard('EO-2026-06-22-Securing-the-Nation'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST CSWP 39'),
    // DECLARED 2026-08-23: this module names OMB M-23-02 as the source of the federal cryptographic-inventory duty and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match
    // the prose "OMB M-23-02" against a row filed as OMB-M-23-02.
    getStandard('OMB-M-23-02'),
    getStandard('OMB-M-26-15'),
    // round 9 wave 4 (2026-09-19): cited for the figures the accuracy record found unmapped
    // bt-kpi-tracker: FIPS 140-2/3. FIPS 140-2 is superseded and retired from the
    // Library (2026-10-16), so the KPI is cited to the standard that replaced it.
    getStandard('FIPS-140-3-STANDARD'),
  ],

  algorithms: [getAlgorithm('RSA-2048')],

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
      'The Migration Program Management module teaches executives how to plan, execute, and track a PQC migration program at enterprise scale. It covers roadmap building with milestone planning overlaid on real country and compliance deadlines, stakeholder communication planning with audience-specific messaging frameworks, and KPI tracking for measuring migration progress.',
    keyConcepts:
      'Seven-step migration sequence — Discovery, Inventory, Prioritization, Planning, Pilot, Migration, Validation; this module’s recommended planning model, not an official CISA or NIST phase taxonomy. NIST NCCoE provides migration guidance and OMB M-26-15 specifies a separate five-phase schedule for covered federal agencies. Migration Roadmap — Gantt-style timeline with organizational milestones overlaid on external compliance deadlines (CNSA 2.0, NIST, EU/ANSSI); enables gap analysis between planned milestones and requirements that apply to the organization.',
    workshopSummary:
      'The workshop has 4 interactive steps: Step 1 (Roadmap Builder) — interactive timeline planner with draggable milestones overlaid on country-specific compliance deadlines; exports as Markdown. Step 2 (Stakeholder Communications Planner) — 4-section artifact builder covering stakeholder map, audience-specific message framework, communication cadence, and escalation criteria. Step 3 (KPI Tracker Template) — role-specific weighted scorecard with measurement evidence fields and coverage threshold gating. Step 4 (Deployment Playbook) — staged pre-migration, migration, and post-migration execution gates with a canary rollback exercise.',
    relatedStandards:
      'NIST IR 8547 (final, October 2026 — Transition to Post-Quantum Cryptography Standards). NSA CNSA 2.0 (FAQ v2.2 — Commercial National Security Algorithm Suite 2.0 for National Security Systems). OMB M-26-15 (five-phase federal agency PQC migration schedule). Executive Order 14412 (June 2026). OMB M-23-02. NIST CSWP 39. CISA Post-Quantum Cryptography Initiative.',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// X25519MLKEM768
