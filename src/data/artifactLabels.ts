// SPDX-License-Identifier: GPL-3.0-only
/**
 * Display names for executive artifact types.
 *
 * Extracted from `components/BusinessCenter/ArtifactCard.tsx` on 2026-08-02 so
 * that DATA modules can use it too. `personaConfig.ts` builds the role-home
 * board copy and was naming artifacts by raw id — "Governance zone featuring
 * crypto-architecture, raci-matrix, policy-draft…" — because the only label map
 * lived inside a React component it could not import without dragging that
 * component (and lucide, Button, Input) into the main bundle. The map itself
 * was always complete; nothing here is new copy.
 */
import type { ExecutiveDocumentType } from '@/services/storage/types'

export const TYPE_LABELS: Record<ExecutiveDocumentType, string> = {
  'roi-model': 'ROI Model',
  'risk-register': 'Risk Register',
  'raci-matrix': 'RACI Matrix',
  'vendor-scorecard': 'Vendor Scorecard',
  'policy-draft': 'Policy Draft',
  'compliance-checklist': 'Compliance Checklist',
  'audit-checklist': 'Audit Checklist',
  'compliance-timeline': 'Compliance Timeline',
  'migration-verification': 'Migration Verification & Closure',
  'board-deck': 'Board Deck',
  'contract-clause': 'Contract Clause',
  'kpi-dashboard': 'KPI Dashboard',
  'migration-roadmap': 'Migration Roadmap',
  'stakeholder-comms': 'Stakeholder Comms',
  'kpi-tracker': 'KPI Tracker',
  'risk-treatment-plan': 'Risk Treatment Plan',
  'crqc-scenario': 'CRQC Scenario',
  'breach-scenario': 'Breach Scenario',
  'cost-of-inaction': 'Cost of Inaction',
  'cost-model-comparison': 'Cost Model Comparison',
  'supply-chain-matrix': 'Supply Chain Matrix',
  'deployment-playbook': 'Deployment Playbook',
  'crypto-architecture': 'Crypto Architecture',
  'management-tools-audit': 'Management Tools Audit',
  'crypto-cbom': 'Crypto BOM (CBOM)',
  'crypto-vulnerability-watch': 'Crypto Vulnerability Watch',
  'hybrid-transition': 'Hybrid Transition Plan',
  'mti-negotiator': 'MTI Recommendation',
  'crypto-api-refactor': 'Crypto API Refactor Audit',
  'cloud-responsibility-matrix': 'Cloud Responsibility Matrix',
  'program-charter': 'Program Charter',
  'initial-scoping': 'Initial Scoping Assessment',
  'skills-team-plan': 'Skills & Team Plan',
  'crypto-champion-roster': 'Crypto Champion Roster',
  'team-sizing-plan': 'Team Sizing Plan',
  'infra-modernization-plan': 'Infrastructure Modernization Plan',
  'refresh-cycle-alignment': 'Refresh-Cycle Alignment',
  'accelerated-execution-profile': 'Accelerated Execution Profile',
  'data-at-rest-strategy': 'Data-at-Rest Strategy',
  'sim-roadmap': 'Simulation Roadmap',
}
