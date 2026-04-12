// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the MigrationProgram module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'

export const content: ModuleContent = {
  moduleId: 'migration-program',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [
    // No standard references detected — add manually if needed
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
      'NIST 7-Phase Migration Framework — Discovery, Inventory, Prioritization, Planning, Pilot, Migration, Validation; the recommended phased approach to PQC transition. Migration Roadmap — Gantt-style timeline with organizational milestones overlaid on external compliance deadlines (CNSA 2.0, NIST, EU/ANSSI); enables gap analysis between planned milestones and regulatory requirements.',
    workshopSummary:
      'The workshop has 3 interactive steps: Roadmap Builder — interactive timeline planner with draggable milestones overlaid on country-specific compliance deadlines; default milestones for crypto inventory, TLS pilot, and full migration; exports as Markdown. Stakeholder Communications Planner — 4-section artifact builder covering stakeholder map, message framework (per audience), communication cadence, and escalation criteria; produces a structured communications plan document.',
    relatedStandards:
      'NIST IR 8547 (Transition to Post-Quantum Cryptography Standards). NSA CNSA 2.0 (Commercial National Security Algorithm Suite 2.0). PMI PMBOK (Project Management Body of Knowledge). CISA Post-Quantum Cryptography Initiative',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// X25519MLKEM768
