// SPDX-License-Identifier: GPL-3.0-only
/**
 * Quantum Readiness Assessment (QRA) — gap-closer #3, the single highest-value
 * artifact (spec §6.1, Assess #3; framework §3.4 p.76). Phase 3.
 *
 * Assembles a *structured* QRA object from the Assess engine output so the
 * Report page (the "communicate" surface) can render it without re-deriving
 * anything. This module is the stable contract: the `QuantumReadinessAssessment`
 * type and the `buildQRA` builder are the things other pages import.
 *
 * The five framework QRA sections (p.76) map to these fields:
 *   1. Executive summary + aggregate maturity score → `execSummary` + `maturity`
 *   2. Estate heatmap by tier/domain               → `heatmap`
 *   3. Prioritised backlog with owner assignment   → `backlog`
 *   4. Gap analysis vs. regulatory                 → `regulatoryGaps`
 *   5. Compliance mapping                          → `complianceMapping`
 *
 * Pure assembly: reuses `AssessmentResult` (riskScore, categoryScores,
 * recommendedActions, complianceImpacts, migrationEffort), the urgency-tier
 * mapping, the Mosca result, the two-track plan, the maturity aggregate, and
 * the `ROLE_CROSSWALK` for owner assignment. No new scoring, no React.
 */

import type {
  AssessmentInput,
  AssessmentResult,
  ComplianceImpact,
  RecommendedAction,
} from '../assessmentTypes'
import { getUrgencyTier, type UrgencyTier } from './urgencyTiers'
import { computeMoscaResult, type MoscaResult } from './mosca'
import { buildTwoTrackPlan, type TwoTrackPlan } from './twoTrack'
import { aggregateMaturity, type MaturityAssessment, type MaturityDomainRating } from './maturity'
import { ROLE_CROSSWALK, type FrameworkRoleId } from '../../data/roleCrosswalk'
import { FRAMEWORK_PHASES, type PhaseId } from '../../data/frameworkPhases'

/** One cell of the estate heatmap: a domain scored on a 0–100 readiness axis. */
export interface QRAHeatmapCell {
  /** Domain key (reuses the category-score axes the engine already produces). */
  domain:
    | 'quantumExposure'
    | 'migrationComplexity'
    | 'regulatoryPressure'
    | 'organizationalReadiness'
  label: string
  /** 0–100. For exposure/complexity/pressure higher = worse; for readiness
   *  higher = better. `severity` normalises this so the UI can colour uniformly. */
  score: number
  /** Normalised 0–100 where higher ALWAYS means "more attention needed". */
  severity: number
  /** Coarse band for colouring. */
  band: 'low' | 'medium' | 'high' | 'critical'
}

/** A prioritised backlog item with an owning framework role. */
export interface QRABacklogItem {
  priority: number
  action: string
  category: RecommendedAction['category']
  /** Owning framework role id (from `roleCrosswalk`), or null when generic. */
  ownerRoleId: FrameworkRoleId | null
  /** Human-readable owner label, e.g. "Cryptographic Architect". */
  ownerLabel: string
  /** Which framework phase this item advances. */
  phase: PhaseId
  effort?: RecommendedAction['effort']
}

/** A regulatory gap: a PQC-required framework and the deadline pressure it implies. */
export interface QRARegulatoryGap {
  framework: string
  deadline: string
  /** true when the framework explicitly requires PQC. */
  requiresPQC: boolean
  notes: string
}

/** A compliance-mapping row: framework → its PQC obligation status. */
export interface QRAComplianceRow {
  framework: string
  /** true / false / null (unknown — not in DB). */
  requiresPQC: boolean | null
  deadline: string
  notes: string
}

/**
 * The structured Quantum Readiness Assessment. This is the stable export other
 * pages (notably Report) import and render. Every field is derived; nothing is
 * hand-authored at call time.
 */
export interface QuantumReadinessAssessment {
  /** ISO timestamp the QRA was assembled. */
  generatedAt: string
  /** Section 1 — executive summary text + headline numbers. */
  execSummary: {
    text: string
    riskScore: number
    riskLevel: AssessmentResult['riskLevel']
    tier: UrgencyTier
    /** Aggregate maturity 0–100, or null when not self-rated. */
    maturityScore: number | null
    industry: string
    country?: string
  }
  /** Section 1b — full maturity self-rating aggregate, when provided. */
  maturity?: MaturityAssessment
  /** Section 2 — estate heatmap by readiness domain. */
  heatmap: QRAHeatmapCell[]
  /** Section 3 — prioritised backlog with owner assignment. */
  backlog: QRABacklogItem[]
  /** Section 4 — gap analysis vs. regulatory obligations. */
  regulatoryGaps: QRARegulatoryGap[]
  /** Section 5 — compliance mapping (all impacted frameworks). */
  complianceMapping: QRAComplianceRow[]
  /** Mosca's-Inequality result (gap-closer #1), surfaced alongside the QRA. */
  mosca?: MoscaResult
  /** Two-Track sequenced plan (gap-closer #4). */
  twoTrack?: TwoTrackPlan
}

/** Optional extras the caller supplies (maturity self-rating from the UI). */
export interface BuildQRAOptions {
  /** Per-domain maturity self-rating from `MaturitySelfRating`. */
  maturityRatings?: MaturityDomainRating[]
}

function severityBand(severity: number): QRAHeatmapCell['band'] {
  if (severity > 75) return 'critical'
  if (severity > 55) return 'high'
  if (severity > 25) return 'medium'
  return 'low'
}

function buildHeatmap(result: AssessmentResult): QRAHeatmapCell[] {
  const cs = result.categoryScores
  if (!cs) return []
  // For three axes higher = worse; for organizationalReadiness higher = better,
  // so its severity is inverted.
  return [
    {
      domain: 'quantumExposure',
      label: 'Quantum Exposure',
      score: cs.quantumExposure,
      severity: cs.quantumExposure,
      band: severityBand(cs.quantumExposure),
    },
    {
      domain: 'migrationComplexity',
      label: 'Migration Complexity',
      score: cs.migrationComplexity,
      severity: cs.migrationComplexity,
      band: severityBand(cs.migrationComplexity),
    },
    {
      domain: 'regulatoryPressure',
      label: 'Regulatory Pressure',
      score: cs.regulatoryPressure,
      severity: cs.regulatoryPressure,
      band: severityBand(cs.regulatoryPressure),
    },
    {
      domain: 'organizationalReadiness',
      label: 'Organizational Readiness',
      score: cs.organizationalReadiness,
      severity: 100 - cs.organizationalReadiness,
      band: severityBand(100 - cs.organizationalReadiness),
    },
  ]
}

/**
 * Assign an owning framework role to a backlog action by routing its text /
 * related module to the role most likely to own it:
 *   inventory / CBOM             → Cryptographic Architect (p1/p2/p3)
 *   risk / assessment / prioritise → QRPM (p3)
 *   migrate / implement / pilot  → Application Security Lead (p5)
 *   infrastructure / HSM / KMS   → Security Engineers (p6)
 *   compliance / regulatory      → Vendor/Procurement Lead or PMO (p7/found.)
 *   awareness / training / skills → PMO Analyst (foundations)
 * Falls back to QRPM (the program owner) when nothing matches.
 */
function ownerForAction(action: RecommendedAction): { roleId: FrameworkRoleId; phase: PhaseId } {
  const t = `${action.action} ${action.relatedModule ?? ''}`.toLowerCase()
  if (/inventor|cbom|discover|asset map/.test(t)) return { roleId: 'crypto-architect', phase: 'p1' }
  if (/infrastructure|\bhsm\b|\bkms\b|network|performance/.test(t))
    return { roleId: 'security-eng', phase: 'p6' }
  if (/migrat|implement|pilot|deploy|hybrid|refactor|library|libraries|tooling/.test(t))
    return { roleId: 'appsec-lead', phase: 'p5' }
  if (/vendor|supply chain|procurement|contract/.test(t))
    return { roleId: 'vendor-lead', phase: 'p7' }
  if (/complian|regulat|framework|audit/.test(t))
    return { roleId: 'pmo-analyst', phase: 'foundations' }
  if (/awareness|training|skill|team|champion/.test(t))
    return { roleId: 'pmo-analyst', phase: 'foundations' }
  if (/risk|assess|prioriti|classif|sensitiv/.test(t)) return { roleId: 'qrpm', phase: 'p3' }
  return { roleId: 'qrpm', phase: 'p3' }
}

function buildBacklog(result: AssessmentResult): QRABacklogItem[] {
  return (result.recommendedActions ?? [])
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map((a) => {
      const { roleId, phase } = ownerForAction(a)
      // eslint-disable-next-line security/detect-object-injection
      const phaseExists = !!FRAMEWORK_PHASES[phase]
      return {
        priority: a.priority,
        action: a.action,
        category: a.category,
        ownerRoleId: roleId,
        // roleId is a controlled FrameworkRoleId from ownerForAction (not user input).
        // eslint-disable-next-line security/detect-object-injection
        ownerLabel: ROLE_CROSSWALK[roleId].label,
        phase: phaseExists ? phase : 'p3',
        effort: a.effort,
      }
    })
}

function buildRegulatoryGaps(impacts: ComplianceImpact[]): QRARegulatoryGap[] {
  return impacts
    .filter((c) => c.requiresPQC === true)
    .map((c) => ({
      framework: c.framework,
      deadline: c.deadline,
      requiresPQC: true,
      notes: c.notes,
    }))
}

function buildComplianceMapping(impacts: ComplianceImpact[]): QRAComplianceRow[] {
  return impacts.map((c) => ({
    framework: c.framework,
    requiresPQC: c.requiresPQC,
    deadline: c.deadline,
    notes: c.notes,
  }))
}

function buildExecSummaryText(
  input: AssessmentInput,
  result: AssessmentResult,
  tier: UrgencyTier,
  maturityScore: number | null
): string {
  const where = input.country && input.country !== 'Global' ? ` in ${input.country}` : ''
  const maturityClause =
    maturityScore !== null ? ` Current quantum-readiness maturity is ${maturityScore}/100.` : ''
  return (
    `This ${input.industry} organization${where} scores ${result.riskScore}/100 ` +
    `(${result.riskLevel} risk), placing it in ${tier.label}. ` +
    `Recommended posture: start ${tier.startWindow.toLowerCase()} and deploy ${tier.deployWindow.toLowerCase()}.` +
    maturityClause
  )
}

/**
 * Build the structured QRA from an assessment input + result (+ optional
 * maturity self-rating). The single stable entry point others import.
 *
 * Designed to degrade gracefully: quick-mode results (no categoryScores /
 * migrationEffort) still yield a valid QRA — the heatmap and two-track sections
 * are simply empty/omitted rather than throwing.
 */
export function buildQRA(
  input: AssessmentInput,
  result: AssessmentResult,
  options: BuildQRAOptions = {}
): QuantumReadinessAssessment {
  const tier = getUrgencyTier(result.riskScore)

  const maturity =
    options.maturityRatings && options.maturityRatings.some((r) => r.level !== null)
      ? aggregateMaturity(options.maturityRatings)
      : undefined
  const maturityScore = maturity ? maturity.score : null

  const mosca = computeMoscaResult(input)
  const twoTrack = buildTwoTrackPlan(input, result)

  return {
    generatedAt: new Date().toISOString(),
    execSummary: {
      text: buildExecSummaryText(input, result, tier, maturityScore),
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      tier,
      maturityScore,
      industry: input.industry,
      country: input.country,
    },
    maturity,
    heatmap: buildHeatmap(result),
    backlog: buildBacklog(result),
    regulatoryGaps: buildRegulatoryGaps(result.complianceImpacts),
    complianceMapping: buildComplianceMapping(result.complianceImpacts),
    mosca,
    twoTrack,
  }
}
