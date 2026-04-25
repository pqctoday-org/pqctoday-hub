// SPDX-License-Identifier: GPL-3.0-only
import type { BusinessMetrics } from '../hooks/useBusinessMetrics'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'

export type CSWP39StepId = 'govern' | 'inventory' | 'identify-gaps' | 'prioritise' | 'implement'

export type MaturityTier = 1 | 2 | 3 | 4

export const TIER_LABELS: Record<MaturityTier, string> = {
  1: 'Partial',
  2: 'Risk-Informed',
  3: 'Repeatable',
  4: 'Adaptive',
}

export interface StepTierResult {
  tier: MaturityTier
  reasons: string[]
}

// ── Tunable thresholds ────────────────────────────────────────────────────

const T = {
  inventoryAssessedLayersForRepeatable: 6,
  inventoryProductsForRepeatable: 5,
  inventoryAssessedLayersForAdaptive: 8,
  identifyAssessmentHistoryForAdaptive: 2,
  prioritiseAssessmentHistoryForAdaptive: 3,
  implementCompletedPhasesForAdaptive: 3,
} as const

// ── Helpers ───────────────────────────────────────────────────────────────

function allArtifacts(metrics: BusinessMetrics): ExecutiveDocument[] {
  const { risk, compliance, governance, vendor } = metrics.artifactsByPillar
  return [...risk, ...compliance, ...governance, ...vendor]
}

function hasArtifact(metrics: BusinessMetrics, type: ExecutiveDocumentType): boolean {
  return allArtifacts(metrics).some((d) => d.type === type)
}

function hasAnyArtifact(metrics: BusinessMetrics, types: ExecutiveDocumentType[]): boolean {
  return types.some((t) => hasArtifact(metrics, t))
}

/**
 * True if any artifact of the given type carries a Markdown heading whose text
 * starts with `headingPrefix` (case-insensitive). Used to credit Tier 4 only
 * when the educational extensions on existing tools have been filled in.
 */
function artifactContainsSection(
  metrics: BusinessMetrics,
  type: ExecutiveDocumentType,
  headingPrefix: string
): boolean {
  const needle = `## ${headingPrefix.toLowerCase()}`
  return allArtifacts(metrics).some((d) => {
    if (d.type !== type) return false
    const text = (d.data || '').toLowerCase()
    return text.includes(needle)
  })
}

// ── Per-step rules ────────────────────────────────────────────────────────

export function governTier(metrics: BusinessMetrics): StepTierResult {
  const reasons: string[] = []
  const policy = hasArtifact(metrics, 'policy-draft')
  const raci = hasArtifact(metrics, 'raci-matrix')
  const checklist =
    hasArtifact(metrics, 'audit-checklist') || hasArtifact(metrics, 'compliance-checklist')
  const contract = hasArtifact(metrics, 'contract-clause')
  const tracked = metrics.trackedFrameworks.length >= 1
  const allGovDone =
    metrics.governanceModules.length > 0 &&
    metrics.governanceModules.every((m) => m.status === 'completed')

  const exceptionsDocumented = artifactContainsSection(metrics, 'audit-checklist', 'Exceptions')

  if (policy) reasons.push('Policy draft on file')
  if (raci) reasons.push('RACI matrix on file')
  if (checklist) reasons.push('Audit / compliance checklist on file')
  if (tracked) reasons.push(`${metrics.trackedFrameworks.length} framework(s) tracked`)
  if (contract) reasons.push('Contract clause on file')
  if (allGovDone) reasons.push('All governance learning modules completed')
  if (exceptionsDocumented) reasons.push('Exceptions documented (audit-checklist §5.1)')

  let tier: MaturityTier = 1
  if (policy || raci || tracked) tier = 2
  if (policy && raci && checklist) tier = 3
  if (policy && raci && checklist && allGovDone && contract && exceptionsDocumented) tier = 4

  return { tier, reasons }
}

export function inventoryTier(metrics: BusinessMetrics): StepTierResult {
  const reasons: string[] = []
  const assessedLayers = metrics.infraLayerCoverage.filter((l) => l.assessed).length
  const products = metrics.bookmarkedProducts.length
  const supplyMatrix = hasArtifact(metrics, 'supply-chain-matrix')
  const assessed = metrics.assessmentStatus === 'complete'
  const fips = metrics.fipsBreakdown

  const cbomDocumented = artifactContainsSection(metrics, 'supply-chain-matrix', 'CBOM')
  const pipelineDocumented = artifactContainsSection(
    metrics,
    'supply-chain-matrix',
    'Pipeline Sources'
  )

  if (products > 0) reasons.push(`${products} product(s) bookmarked`)
  if (assessed) reasons.push('Risk assessment complete')
  if (supplyMatrix) reasons.push('Supply-chain matrix on file')
  if (assessedLayers > 0) reasons.push(`${assessedLayers}/9 infra layers assessed`)
  if (fips.validated > 0) reasons.push(`${fips.validated} FIPS-validated product(s)`)
  if (cbomDocumented) reasons.push('CBOM 6 asset classes documented (supply-chain-matrix §5.2)')
  if (pipelineDocumented) reasons.push('Pipeline sources documented (supply-chain-matrix §5.2)')

  let tier: MaturityTier = 1
  if (products >= 1 || assessed || supplyMatrix) tier = 2
  if (
    assessedLayers >= T.inventoryAssessedLayersForRepeatable &&
    products >= T.inventoryProductsForRepeatable
  )
    tier = 3
  if (
    fips.validated >= fips.none &&
    fips.validated > 0 &&
    assessedLayers >= T.inventoryAssessedLayersForAdaptive &&
    supplyMatrix &&
    cbomDocumented &&
    pipelineDocumented
  )
    tier = 4

  return { tier, reasons }
}

export function identifyGapsTier(metrics: BusinessMetrics): StepTierResult {
  const reasons: string[] = []
  const register = hasArtifact(metrics, 'risk-register')
  const scorecard = hasArtifact(metrics, 'vendor-scorecard')
  const result = metrics.assessmentResult !== null
  const tracked = metrics.trackedFrameworks.length >= 1
  const history = metrics.assessmentHistory.length

  const observabilityDocumented = artifactContainsSection(
    metrics,
    'vendor-scorecard',
    'Observability Tooling Notes'
  )

  if (register) reasons.push('Risk register on file')
  if (scorecard) reasons.push('Vendor scorecard on file')
  if (result) reasons.push('Assessment result available')
  if (tracked) reasons.push(`${metrics.complianceGapCount} compliance gap(s) tracked`)
  if (history >= 2) reasons.push(`${history} assessments completed`)
  if (observabilityDocumented)
    reasons.push('Observability tooling notes documented (vendor-scorecard §5.3)')

  let tier: MaturityTier = 1
  if (register || result) tier = 2
  if (register && scorecard && tracked) tier = 3
  if (
    register &&
    scorecard &&
    tracked &&
    history >= T.identifyAssessmentHistoryForAdaptive &&
    observabilityDocumented
  )
    tier = 4

  return { tier, reasons }
}

export function prioritiseTier(metrics: BusinessMetrics): StepTierResult {
  const reasons: string[] = []
  const timeline = hasArtifact(metrics, 'compliance-timeline')
  const anyKpi = hasAnyArtifact(metrics, ['kpi-dashboard', 'kpi-tracker'])
  const crqc = hasArtifact(metrics, 'crqc-scenario')
  const history = metrics.assessmentHistory.length

  const formulaDocumented = artifactContainsSection(metrics, 'kpi-dashboard', 'Formula Explainer')

  if (timeline) reasons.push('Compliance timeline on file')
  if (anyKpi) reasons.push('KPI dashboard / tracker on file')
  if (crqc) reasons.push('CRQC scenario on file')
  if (history >= 3) reasons.push(`${history} assessments completed`)
  if (formulaDocumented) reasons.push('Composite scoring formula documented (kpi-dashboard §5.4)')

  let tier: MaturityTier = 1
  if (timeline || anyKpi) tier = 2
  if (timeline && anyKpi) tier = 3
  if (crqc && anyKpi && history >= T.prioritiseAssessmentHistoryForAdaptive && formulaDocumented)
    tier = 4

  return { tier, reasons }
}

export function implementTier(metrics: BusinessMetrics): StepTierResult {
  const reasons: string[] = []
  const roadmap = hasArtifact(metrics, 'migration-roadmap')
  const treatment = hasArtifact(metrics, 'risk-treatment-plan')
  const playbook = hasArtifact(metrics, 'deployment-playbook')
  const migrationStarted = metrics.migrationStatus !== 'Not assessed'
  const completedPhases = metrics.completedPhases.length

  const mitigationDocumented = artifactContainsSection(
    metrics,
    'migration-roadmap',
    'Mitigation Gateway'
  )
  const decommissionDocumented = artifactContainsSection(
    metrics,
    'deployment-playbook',
    'Decommission'
  )
  const evidenceDocumented = artifactContainsSection(metrics, 'audit-checklist', 'Evidence')

  if (roadmap) reasons.push('Migration roadmap on file')
  if (treatment) reasons.push('Risk treatment plan on file')
  if (playbook) reasons.push('Deployment playbook on file')
  if (migrationStarted) reasons.push(`Migration status: ${metrics.migrationStatus}`)
  if (metrics.workflowActive) reasons.push('Active migration workflow')
  if (completedPhases > 0) reasons.push(`${completedPhases} phase(s) completed`)
  if (mitigationDocumented) reasons.push('Mitigation gateway documented (roadmap §4.6)')
  if (decommissionDocumented)
    reasons.push('Decommission plan documented (deployment-playbook §4.6)')
  if (evidenceDocumented)
    reasons.push('Evidence (CMVP / ACVP / ESV / CVE-scan) documented (audit-checklist §5.5)')

  let tier: MaturityTier = 1
  if (migrationStarted || roadmap) tier = 2
  if (roadmap && treatment && playbook) tier = 3
  if (
    roadmap &&
    treatment &&
    playbook &&
    metrics.workflowActive &&
    completedPhases >= T.implementCompletedPhasesForAdaptive &&
    metrics.fipsBreakdown.validated >= 1 &&
    mitigationDocumented &&
    decommissionDocumented &&
    evidenceDocumented
  )
    tier = 4

  return { tier, reasons }
}

// ── Aggregate ─────────────────────────────────────────────────────────────

export function computeStepTiers(metrics: BusinessMetrics): Record<CSWP39StepId, StepTierResult> {
  return {
    govern: governTier(metrics),
    inventory: inventoryTier(metrics),
    'identify-gaps': identifyGapsTier(metrics),
    prioritise: prioritiseTier(metrics),
    implement: implementTier(metrics),
  }
}
