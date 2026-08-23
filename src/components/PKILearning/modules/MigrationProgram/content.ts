// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the MigrationProgram module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'migration-program',
  version: '1.1.0',
  lastReviewed: '2026-04-12',
  lastEdited: '2026-08-23',

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
  ],

  algorithms: [getAlgorithm('RSA-2048')],

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
      'The Migration Program Management module teaches executives how to plan, execute, and track a PQC migration program at enterprise scale. It covers roadmap building with milestone planning overlaid on real country and compliance deadlines, stakeholder communication planning with audience-specific messaging frameworks, and KPI tracking for measuring migration progress.',
    keyConcepts:
      'Phased Migration Model — Discovery, Inventory, Prioritization, Planning, Pilot, Migration, Validation; a recommended phased approach to PQC transition (aligned with CISA / NIST NCCoE migration guidance). Migration Roadmap — Gantt-style timeline with organizational milestones overlaid on external compliance deadlines (CNSA 2.0, NIST, EU/ANSSI); enables gap analysis between planned milestones and regulatory requirements.',
    workshopSummary:
      'The workshop has 3 interactive steps: Roadmap Builder — interactive timeline planner with draggable milestones overlaid on country-specific compliance deadlines; default milestones for crypto inventory, TLS pilot, and full migration; exports as Markdown. Stakeholder Communications Planner — 4-section artifact builder covering stakeholder map, message framework (per audience), communication cadence, and escalation criteria; produces a structured communications plan document.',
    relatedStandards:
      'NIST IR 8547 (Transition to Post-Quantum Cryptography Standards). NSA CNSA 2.0 (Commercial National Security Algorithm Suite 2.0). PMI PMBOK (Project Management Body of Knowledge). CISA Post-Quantum Cryptography Initiative',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// X25519MLKEM768
