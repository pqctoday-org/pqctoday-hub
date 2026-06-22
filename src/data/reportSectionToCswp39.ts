// SPDX-License-Identifier: GPL-3.0-only
import type { ReportSectionId } from './personaConfig'
import type { CSWP39StepId } from '@/components/shared/CSWP39StepBadge'
import type { PhaseId } from './frameworkPhases'

/**
 * A /report section's placement on both the CSWP.39 5-step spine and the
 * Applied Quantum phase model (`frameworkPhases.ts`). The report surface is the
 * *communicate* expression of the phase journey: each section is the narrative
 * artifact a given phase produces for stakeholders.
 */
export interface ReportSectionCswp39 {
  /** The CSWP.39 process step this section primarily serves. */
  cswp39Step: CSWP39StepId
  /**
   * The Applied Quantum phase this section communicates (`PhaseId` from
   * `frameworkPhases.ts`). `PhaseId[]` only where a section genuinely spans
   * phases.
   */
  frameworkPhase: PhaseId | PhaseId[]
}

/**
 * Maps each /report section to the CSWP.39 process step it primarily serves and
 * the Applied Quantum phase it communicates. Surfaced via the CSWP.39
 * navigation legend at the top of /report so users can see how the long-form
 * report maps to the same 5-step structure that shapes the Command Center.
 */
export const REPORT_SECTION_TO_CSWP39: Record<ReportSectionId, ReportSectionCswp39> = {
  countryTimeline: { cswp39Step: 'govern', frameworkPhase: 'p4' },
  complianceImpact: { cswp39Step: 'govern', frameworkPhase: 'p7' },
  assessmentProfile: { cswp39Step: 'inventory', frameworkPhase: 'p1' },
  algorithmMigration: { cswp39Step: 'inventory', frameworkPhase: 'p1' },
  hndlHnfl: { cswp39Step: 'identify-gaps', frameworkPhase: 'p3' },
  riskBreakdown: { cswp39Step: 'identify-gaps', frameworkPhase: 'p3' },
  threatLandscape: { cswp39Step: 'identify-gaps', frameworkPhase: 'p3' },
  riskScore: { cswp39Step: 'prioritise', frameworkPhase: 'p3' },
  keyFindings: { cswp39Step: 'prioritise', frameworkPhase: 'p0' },
  executiveSummary: { cswp39Step: 'prioritise', frameworkPhase: 'p0' },
  recommendedActions: { cswp39Step: 'prioritise', frameworkPhase: 'p4' },
  migrationRoadmap: { cswp39Step: 'implement', frameworkPhase: 'p4' },
  migrationToolkit: { cswp39Step: 'implement', frameworkPhase: 'p5' },
}

/** Inverse: each CSWP.39 step → list of report section IDs that contribute. */
export function getReportSectionsForStep(stepId: CSWP39StepId): ReportSectionId[] {
  return (Object.entries(REPORT_SECTION_TO_CSWP39) as [ReportSectionId, ReportSectionCswp39][])
    .filter(([, s]) => s.cswp39Step === stepId)
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
