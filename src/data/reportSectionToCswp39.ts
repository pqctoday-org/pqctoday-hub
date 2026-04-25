// SPDX-License-Identifier: GPL-3.0-only
import type { ReportSectionId } from './personaConfig'
import type { CSWP39StepId } from '@/components/shared/CSWP39StepBadge'

/**
 * Maps each /report section to the CSWP.39 process step it primarily serves.
 * Surfaced via the CSWP.39 navigation legend at the top of /report so users
 * can see how the long-form report maps to the same 5-step structure that
 * shapes the Command Center.
 */
export const REPORT_SECTION_TO_CSWP39: Record<ReportSectionId, CSWP39StepId> = {
  countryTimeline: 'govern',
  complianceImpact: 'govern',
  assessmentProfile: 'inventory',
  algorithmMigration: 'inventory',
  hndlHnfl: 'identify-gaps',
  riskBreakdown: 'identify-gaps',
  threatLandscape: 'identify-gaps',
  riskScore: 'prioritise',
  keyFindings: 'prioritise',
  executiveSummary: 'prioritise',
  recommendedActions: 'prioritise',
  migrationRoadmap: 'implement',
  migrationToolkit: 'implement',
}

/** Inverse: each CSWP.39 step → list of report section IDs that contribute. */
export function getReportSectionsForStep(stepId: CSWP39StepId): ReportSectionId[] {
  return (Object.entries(REPORT_SECTION_TO_CSWP39) as [ReportSectionId, CSWP39StepId][])
    .filter(([, s]) => s === stepId)
    .map(([id]) => id)
}

/** Human-readable label per section ID — shown in the CSWP.39 nav legend. */
export const REPORT_SECTION_LABELS: Record<ReportSectionId, string> = {
  countryTimeline: 'Country PQC Migration Timeline',
  riskScore: 'Risk Score',
  keyFindings: 'Key Findings',
  riskBreakdown: 'Risk Breakdown',
  executiveSummary: 'Executive Summary',
  assessmentProfile: 'Assessment Profile',
  hndlHnfl: 'HNDL / HNFL Risk Windows',
  algorithmMigration: 'Algorithm Migration Priority',
  complianceImpact: 'Compliance Impact',
  recommendedActions: 'Recommended Actions',
  migrationRoadmap: 'Migration Roadmap',
  migrationToolkit: 'Migration Toolkit',
  threatLandscape: 'Industry Threat Landscape',
}
