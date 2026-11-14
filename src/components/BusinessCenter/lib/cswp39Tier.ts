// SPDX-License-Identifier: AGPL-3.0-only
import type { BusinessMetrics } from '../hooks/useBusinessMetrics'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'
import type { ZoneId } from '@/data/cswp39ZoneData'

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

export const T = {
  inventoryAssessedLayersForRepeatable: 6,
  inventoryProductsForRepeatable: 5,
  inventoryAssessedLayersForAdaptive: 8,
  identifyAssessmentHistoryForAdaptive: 2,
  prioritiseAssessmentHistoryForAdaptive: 3,
  implementCompletedPhasesForAdaptive: 3,
} as const

// ── Helpers ───────────────────────────────────────────────────────────────

function allArtifacts(metrics: BusinessMetrics): ExecutiveDocument[] {
  const { risk, compliance, governance, vendor, inventory, architecture } =
    metrics.artifactsByPillar
  return [...risk, ...compliance, ...governance, ...vendor, ...inventory, ...architecture]
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
  reasons.push(
    `${metrics.pqcFrameworkReviewCount} tracked PQC framework review prompt(s); compliance not assessed`
  )
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

  // The kpi-dashboard export documents its scoring methodology under a
  // "## How this score is computed" section (renamed from the old "Formula
  // Explainer"). Match the current heading so this Tier-4 path stays reachable.
  const methodologyDocumented = artifactContainsSection(
    metrics,
    'kpi-dashboard',
    'How this score is computed'
  )

  if (timeline) reasons.push('Compliance timeline on file')
  if (anyKpi) reasons.push('KPI dashboard / tracker on file')
  if (crqc) reasons.push('CRQC scenario on file')
  if (history >= 3) reasons.push(`${history} assessments completed`)
  if (methodologyDocumented) reasons.push('KPI scoring methodology documented (kpi-dashboard)')

  let tier: MaturityTier = 1
  if (timeline || anyKpi) tier = 2
  if (timeline && anyKpi) tier = 3
  if (
    crqc &&
    anyKpi &&
    history >= T.prioritiseAssessmentHistoryForAdaptive &&
    methodologyDocumented
  )
    tier = 4

  return { tier, reasons }
}

export function implementTier(metrics: BusinessMetrics): StepTierResult {
  const reasons: string[] = []
  const roadmap = hasArtifact(metrics, 'migration-roadmap')
  const treatment = hasArtifact(metrics, 'risk-treatment-plan')
  const playbook = hasArtifact(metrics, 'deployment-playbook')
  // Planning, not-started and unknown answers do not establish implementation.
  const migrationStarted = metrics.migrationStatus === 'started'
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
    // No §-ref: CSWP.39 has no §5.5 (§5 runs 5.1-5.4), and it never mentions
    // CMVP, ACVP or ESV at all — it says "cryptographic validation program"
    // once, in §5.3. Rather than swap in a section that only approximately
    // fits, the false attribution is dropped: this line describes what the
    // USER has on file, not something the publication says.
    reasons.push('Evidence (CMVP / ACVP / ESV / CVE-scan) documented (audit-checklist)')

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

// ─────────────────────────────────────────────────────────────────────────────
// Zone-keyed tier aggregation (CSWP.39 Fig 3 — Crypto Agility Strategic Plan)
// ─────────────────────────────────────────────────────────────────────────────

/** Which legacy step tiers feed into each Fig 3 zone's tier. The zone tier is
 *  the max() across contributing step tiers; reasons are concatenated.
 *
 *  Assets, Management Tools and Mitigation no longer take their tier from these
 *  rows: they have their own rules (ZONE_OWN_TIER below). The rows still name the
 *  step each zone's resources belong to (primaryStepForZone). Migration and
 *  Risk Management still take their tier from these rows. */
export const ZONE_STEP_CONTRIBUTORS: Record<ZoneId, CSWP39StepId[]> = {
  // Governance — policy, standards, supply chain, threats, business reqs
  governance: ['govern'],
  // Assets — CBOM coverage of code/libs/apps/files/protocols/systems
  assets: ['inventory'],
  // Management Tools — discovery / assessment / config / enforcement automation
  'management-tools': ['identify-gaps'],
  // Data-Centric Risk Mgmt — info repo, risk engine, KPIs, monitoring
  'risk-management': ['prioritise', 'identify-gaps'],
  // Mitigation — bump-in-the-wire compensating controls
  mitigation: ['implement'],
  // Migration — full algorithm replacement
  migration: ['implement'],
}

/**
 * The step whose resources best fit a zone — the first contributor above.
 * Used to key the Recommended-resources panel on a standalone tool page,
 * where there is no step section to inherit it from. Reuses the existing
 * mapping rather than introducing a second, drift-prone one.
 */
export function primaryStepForZone(zone: ZoneId): CSWP39StepId {
  return ZONE_STEP_CONTRIBUTORS[zone][0]
}

export function computeZoneTiers(metrics: BusinessMetrics): Record<ZoneId, StepTierResult> {
  const stepTiers = computeStepTiers(metrics)
  const out = {} as Record<ZoneId, StepTierResult>
  for (const [zoneId, contributors] of Object.entries(ZONE_STEP_CONTRIBUTORS) as Array<
    [ZoneId, CSWP39StepId[]]
  >) {
    // eslint-disable-next-line security/detect-object-injection
    const ownRule = ZONE_OWN_TIER[zoneId]
    if (ownRule) {
      out[zoneId] = ownRule(metrics)
      continue
    }
    let tier: MaturityTier = 1
    const reasons: string[] = []
    for (const stepId of contributors) {
      // eslint-disable-next-line security/detect-object-injection
      const step = stepTiers[stepId]
      if (step.tier > tier) tier = step.tier
      reasons.push(...step.reasons)
    }
    out[zoneId] = { tier, reasons }
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone-own tier rules: each zone's tier counts that zone's own tools.
// ─────────────────────────────────────────────────────────────────────────────
// Assets, Management Tools and Mitigation used to take their tier from step
// rules that did not count the zone's own builders. Assets read the inventory
// step, which never looked at the CBOM. Management Tools read the identify-gaps
// step, which never looked at its two tools. Mitigation read the implement step,
// which Migration reads too. Each of these zones now has a rule over its own
// tools, plus the evidence signals of the old rule that still describe that zone.
// Migration keeps implementTier, and Risk Management keeps its two contributors.
//
// Thresholds, shared by the three zones:
//   - Tier 2: at least one of the zone's own tools is on file. That is the first
//     sign the zone has been worked on.
//   - Tier 3: more of the zone's tools, plus evidence (where the zone has more
//     than one tool).
//   - Tier 4: all of the tier-3 conditions, plus the zone's adaptive evidence.
// Every tier repeats the conditions of the tier below, so the tiers are monotonic.
// Assets has one builder, so its Tier 3 and 4 rest on the inventory evidence the
// old rule used (layers assessed, products, FIPS validation, supply-chain matrix).
// A second Assets builder would add a tool count to those tiers.

/** The builder types each zone owns (registry: cswp39Zone of each tool). */
const ZONE_OWN_TOOL_TYPES = {
  assets: ['crypto-cbom'],
  'management-tools': ['management-tools-audit', 'crypto-vulnerability-watch'],
  mitigation: ['deployment-playbook', 'infra-modernization-plan', 'data-at-rest-strategy'],
} as const satisfies Partial<Record<ZoneId, readonly ExecutiveDocumentType[]>>

type OwnRuleZone = keyof typeof ZONE_OWN_TOOL_TYPES

/** How many of the zone's own builder types are on file (each type counts once). */
function ownToolsOnFile(metrics: BusinessMetrics, zone: OwnRuleZone): number {
  const types: readonly ExecutiveDocumentType[] = ZONE_OWN_TOOL_TYPES[zone]
  return types.filter((t) => hasArtifact(metrics, t)).length
}

/** The zone's own types not yet on file, as short phrases for a hint. */
function ownToolsMissing(metrics: BusinessMetrics, zone: OwnRuleZone): string[] {
  const types: readonly ExecutiveDocumentType[] = ZONE_OWN_TOOL_TYPES[zone]
  return types.filter((t) => !hasArtifact(metrics, t)).map((t) => OWN_TOOL_PHRASE[t] ?? t)
}

/** Assets: CBOM is the zone's own tool. Its Tier 3-4 signals are the inventory
 *  evidence the old inventory rule used. */
export function assetsTier(metrics: BusinessMetrics): StepTierResult {
  const reasons: string[] = []
  const cbom = hasArtifact(metrics, 'crypto-cbom')
  const layers = metrics.infraLayerCoverage.filter((l) => l.assessed).length
  const products = metrics.bookmarkedProducts.length
  const supplyMatrix = hasArtifact(metrics, 'supply-chain-matrix')
  const fips = metrics.fipsBreakdown
  const cbomDocumented = artifactContainsSection(metrics, 'supply-chain-matrix', 'CBOM')

  if (cbom) reasons.push('CBOM on file')
  if (products > 0) reasons.push(`${products} product(s) bookmarked`)
  if (layers > 0) reasons.push(`${layers}/9 infra layers assessed`)
  if (fips.validated > 0) reasons.push(`${fips.validated} FIPS-validated product(s)`)
  if (supplyMatrix) reasons.push('Supply-chain matrix on file')
  if (cbomDocumented) reasons.push('CBOM 6 asset classes documented (supply-chain-matrix §5.2)')

  let tier: MaturityTier = 1
  if (cbom) tier = 2
  if (
    cbom &&
    layers >= T.inventoryAssessedLayersForRepeatable &&
    products >= T.inventoryProductsForRepeatable
  )
    tier = 3
  if (
    cbom &&
    layers >= T.inventoryAssessedLayersForRepeatable &&
    products >= T.inventoryProductsForRepeatable &&
    layers >= T.inventoryAssessedLayersForAdaptive &&
    fips.validated > 0 &&
    fips.validated >= fips.none &&
    supplyMatrix &&
    cbomDocumented
  )
    tier = 4

  return { tier, reasons }
}

/** Management Tools: the audit and the vulnerability watch are the zone's own
 *  tools. Its Tier 3-4 signals are the assessment result and history, and the
 *  observability tooling notes (the tool-specific part of the old identify-gaps
 *  rule). The risk register and the tracked frameworks are left out: they are
 *  Risk Management evidence, not tooling. */
export function managementToolsTier(metrics: BusinessMetrics): StepTierResult {
  const reasons: string[] = []
  const own = ownToolsOnFile(metrics, 'management-tools')
  const result = metrics.assessmentResult !== null
  const history = metrics.assessmentHistory.length
  const observability = artifactContainsSection(
    metrics,
    'vendor-scorecard',
    'Observability Tooling Notes'
  )

  if (hasArtifact(metrics, 'management-tools-audit')) reasons.push('Management-tools audit on file')
  if (hasArtifact(metrics, 'crypto-vulnerability-watch'))
    reasons.push('Crypto vulnerability watch on file')
  if (result) reasons.push('Assessment result available')
  if (history >= 2) reasons.push(`${history} assessments completed`)
  if (observability) reasons.push('Observability tooling notes documented (vendor-scorecard §5.3)')

  let tier: MaturityTier = 1
  if (own >= 1) tier = 2
  if (own >= 2 && result) tier = 3
  if (own >= 2 && result && history >= T.identifyAssessmentHistoryForAdaptive && observability)
    tier = 4

  return { tier, reasons }
}

/** Mitigation: the deployment playbook, the infra modernization plan and the
 *  data-at-rest strategy are the zone's own tools. Its evidence signals are the
 *  gateway and decommission sections, the evidence section and FIPS validation
 *  (the tooling-evidence part of the old implement rule). The roadmap, workflow
 *  and phase signals stay with Migration. */
export function mitigationTier(metrics: BusinessMetrics): StepTierResult {
  const reasons: string[] = []
  const own = ownToolsOnFile(metrics, 'mitigation')
  const gateway = artifactContainsSection(metrics, 'migration-roadmap', 'Mitigation Gateway')
  const decommission = artifactContainsSection(metrics, 'deployment-playbook', 'Decommission')
  const evidence = artifactContainsSection(metrics, 'audit-checklist', 'Evidence')
  const fipsValidated = metrics.fipsBreakdown.validated

  if (hasArtifact(metrics, 'deployment-playbook')) reasons.push('Deployment playbook on file')
  if (hasArtifact(metrics, 'infra-modernization-plan'))
    reasons.push('Infrastructure modernization plan on file')
  if (hasArtifact(metrics, 'data-at-rest-strategy')) reasons.push('Data-at-rest strategy on file')
  if (gateway) reasons.push('Mitigation gateway documented (roadmap §4.6)')
  if (decommission) reasons.push('Decommission plan documented (deployment-playbook §4.6)')
  if (evidence) reasons.push('Evidence (CMVP / ACVP / ESV / CVE-scan) documented (audit-checklist)')
  if (fipsValidated > 0) reasons.push(`${fipsValidated} FIPS-validated product(s)`)

  let tier: MaturityTier = 1
  if (own >= 1) tier = 2
  if (own >= 2 && (gateway || decommission)) tier = 3
  if (own === 3 && gateway && decommission && evidence && fipsValidated >= 1) tier = 4

  return { tier, reasons }
}

/** The zone-own tier rule for each zone that has one. Other zones keep the
 *  step-contributor rule above. */
const ZONE_OWN_TIER: Partial<Record<ZoneId, (metrics: BusinessMetrics) => StepTierResult>> = {
  assets: assetsTier,
  'management-tools': managementToolsTier,
  mitigation: mitigationTier,
}

// Short names for the zone's own tools, used in hints (no article, lower case).
const OWN_TOOL_PHRASE: Partial<Record<ExecutiveDocumentType, string>> = {
  'crypto-cbom': 'CBOM',
  'management-tools-audit': 'management-tools audit',
  'crypto-vulnerability-watch': 'crypto vulnerability watch',
  'deployment-playbook': 'deployment playbook',
  'infra-modernization-plan': 'infrastructure modernization plan',
  'data-at-rest-strategy': 'data-at-rest strategy',
}

function ownHintMissing(metrics: BusinessMetrics, zone: OwnRuleZone, need: number): string | null {
  if (need <= 0) return null
  const names = ownToolsMissing(metrics, zone)
  return names.length
    ? `${need === 1 ? 'one more' : `${need} more`} of ${names.join(' or ')}`
    : null
}

/** "Missing for next tier" for the three zones with their own rule. Each hint
 *  names the zone's own tools (and the evidence the rule asks for). */
const ZONE_OWN_MISSING: Partial<
  Record<OwnRuleZone, (metrics: BusinessMetrics, tier: MaturityTier) => string | null>
> = {
  assets: (m, tier) => {
    if (tier >= 4) return null
    if (tier === 1) return 'Build a CBOM (crypto bill of materials) in the CBOM builder.'
    if (tier === 2) {
      const layers = m.infraLayerCoverage.filter((l) => l.assessed).length
      const products = m.bookmarkedProducts.length
      const need: string[] = []
      if (layers < T.inventoryAssessedLayersForRepeatable)
        need.push(`assess ${T.inventoryAssessedLayersForRepeatable - layers} more infra layer(s)`)
      if (products < T.inventoryProductsForRepeatable)
        need.push(`bookmark ${T.inventoryProductsForRepeatable - products} more product(s)`)
      return need.length ? `Still need: ${need.join(', ')}.` : null
    }
    const layers = m.infraLayerCoverage.filter((l) => l.assessed).length
    const fips = m.fipsBreakdown
    return (
      [
        layers < T.inventoryAssessedLayersForAdaptive &&
          `assess ${T.inventoryAssessedLayersForAdaptive - layers} more infra layer(s)`,
        !hasArtifact(m, 'supply-chain-matrix') && 'add a supply-chain matrix',
        !artifactContainsSection(m, 'supply-chain-matrix', 'CBOM') && 'document CBOM asset classes',
        !(fips.validated >= fips.none && fips.validated > 0) &&
          'get at least 1 FIPS-validated product on file',
      ]
        .filter(Boolean)
        .join(', ') || null
    )
  },
  'management-tools': (m, tier) => {
    if (tier >= 4) return null
    if (tier === 1) return 'Build a management-tools audit or a crypto vulnerability watch.'
    const own = ownToolsOnFile(m, 'management-tools')
    if (tier === 2) {
      const need = [
        ownHintMissing(m, 'management-tools', 2 - own),
        m.assessmentResult === null && 'complete a risk assessment',
      ].filter(Boolean)
      return need.length ? `Still need: ${need.join(', ')}.` : null
    }
    return (
      [
        m.assessmentHistory.length < T.identifyAssessmentHistoryForAdaptive &&
          'complete a second assessment',
        !artifactContainsSection(m, 'vendor-scorecard', 'Observability Tooling Notes') &&
          'document observability tooling notes',
      ]
        .filter(Boolean)
        .join(', ') || null
    )
  },
  mitigation: (m, tier) => {
    if (tier >= 4) return null
    if (tier === 1)
      return 'Build a deployment playbook, an infrastructure modernization plan or a data-at-rest strategy.'
    const own = ownToolsOnFile(m, 'mitigation')
    const gateway = artifactContainsSection(m, 'migration-roadmap', 'Mitigation Gateway')
    const decommission = artifactContainsSection(m, 'deployment-playbook', 'Decommission')
    if (tier === 2) {
      const need = [
        ownHintMissing(m, 'mitigation', 2 - own),
        !(gateway || decommission) && 'document a mitigation gateway or a decommission plan',
      ].filter(Boolean)
      return need.length ? `Still need: ${need.join(', ')}.` : null
    }
    const evidence = artifactContainsSection(m, 'audit-checklist', 'Evidence')
    return (
      [
        own < 3 && `add ${ownToolsMissing(m, 'mitigation').join(' and ')}`,
        !gateway && 'document your mitigation gateway',
        !decommission && 'document a decommission plan',
        !evidence && 'document evidence (CMVP/ACVP/ESV/CVE-scan)',
        m.fipsBreakdown.validated < 1 && 'get at least 1 product FIPS-validated',
      ]
        .filter(Boolean)
        .join(', ') || null
    )
  },
}

/** The tier a zone's "missing for next tier" hint is measured from. For the three
 *  zones with their own rule that is the zone's tier. Migration and Risk
 *  Management keep the step tier the hint has always been keyed on.
 *
 *  Pass `stepTiers` (from computeStepTiers(metrics)) when hinting several zones in
 *  one render, so the step tiers are computed once rather than per zone. */
export function zoneHintTier(
  zone: ZoneId,
  metrics: BusinessMetrics,
  stepTiers?: Record<CSWP39StepId, StepTierResult>
): MaturityTier {
  const ownRule = ZONE_OWN_TIER[zone]
  if (ownRule) return ownRule(metrics).tier
  const step = primaryStepForZone(zone)
  return (stepTiers ?? computeStepTiers(metrics))[step].tier
}

/** "Missing for next tier" for a zone, measured from zoneHintTier. The three
 *  zones with their own rule get hints that name their own tools. Migration and
 *  Risk Management get the same hint as before: the hint for the step they take
 *  their tier from (see primaryStepForZone). */
export function missingForNextZoneTier(
  zone: ZoneId,
  metrics: BusinessMetrics,
  stepTiers?: Record<CSWP39StepId, StepTierResult>
): string | null {
  const ownMissing = ZONE_OWN_MISSING[zone as OwnRuleZone]
  const tier = zoneHintTier(zone, metrics, stepTiers)
  if (ZONE_OWN_TIER[zone] && ownMissing) return ownMissing(metrics, tier)
  return missingForNextTier(primaryStepForZone(zone), metrics, tier)
}

// ─────────────────────────────────────────────────────────────────────────────
// "Missing for next tier" — the mobile Command Center's own feature (2026-08-23,
// desktop's TierBadge only ever renders reasons FOR the tier already achieved,
// never an absence/next-tier message). Originally built as a parallel copy in
// MobileCommandCenterView.tsx; moved here (2026-08-24 audit R1.4) so it reads
// the SAME `T` thresholds and per-step boolean gates the tier functions above
// use, rather than a hand-copied shadow of them. The move also restored two
// real gates the copy had silently dropped: inventoryTier's and
// implementTier's FIPS-validation conditions — a user could satisfy every
// item this function listed, stay capped below Tier 4, and the "for the next
// tier" hint would still say nothing was missing.
// ─────────────────────────────────────────────────────────────────────────────

const MISSING_LABEL: Record<string, string> = {
  'policy-draft': 'a policy draft',
  'raci-matrix': 'a RACI matrix',
  'audit-checklist': 'an audit checklist',
  'compliance-checklist': 'a compliance checklist',
  'contract-clause': 'a contract clause',
  'supply-chain-matrix': 'a supply-chain matrix',
  'risk-register': 'a risk register',
  'vendor-scorecard': 'a vendor scorecard',
  'compliance-timeline': 'a compliance timeline',
  'kpi-dashboard': 'a KPI dashboard',
  'kpi-tracker': 'a KPI tracker',
  'crqc-scenario': 'a CRQC scenario',
  'migration-roadmap': 'a migration roadmap',
  'risk-treatment-plan': 'a risk treatment plan',
  'deployment-playbook': 'a deployment playbook',
}

export function missingForNextTier(
  stepId: CSWP39StepId,
  metrics: BusinessMetrics,
  tier: MaturityTier
): string | null {
  if (tier >= 4) return null
  const policy = hasArtifact(metrics, 'policy-draft')
  const raci = hasArtifact(metrics, 'raci-matrix')
  const checklist = hasAnyArtifact(metrics, ['audit-checklist', 'compliance-checklist'])
  const contract = hasArtifact(metrics, 'contract-clause')
  const allGovDone =
    metrics.governanceModules.length > 0 &&
    metrics.governanceModules.every((m) => m.status === 'completed')
  const exceptionsDocumented = artifactContainsSection(metrics, 'audit-checklist', 'Exceptions')

  const assessedLayers = metrics.infraLayerCoverage.filter((l) => l.assessed).length
  const products = metrics.bookmarkedProducts.length
  const supplyMatrix = hasArtifact(metrics, 'supply-chain-matrix')
  const cbomDocumented = artifactContainsSection(metrics, 'supply-chain-matrix', 'CBOM')
  const pipelineDocumented = artifactContainsSection(
    metrics,
    'supply-chain-matrix',
    'Pipeline Sources'
  )
  const fipsValidatedForInventory =
    metrics.fipsBreakdown.validated >= metrics.fipsBreakdown.none &&
    metrics.fipsBreakdown.validated > 0

  const register = hasArtifact(metrics, 'risk-register')
  const scorecard = hasArtifact(metrics, 'vendor-scorecard')
  const tracked = metrics.trackedFrameworks.length >= 1
  const observabilityDocumented = artifactContainsSection(
    metrics,
    'vendor-scorecard',
    'Observability Tooling Notes'
  )

  const timeline = hasArtifact(metrics, 'compliance-timeline')
  const anyKpi = hasAnyArtifact(metrics, ['kpi-dashboard', 'kpi-tracker'])
  const crqc = hasArtifact(metrics, 'crqc-scenario')
  const methodologyDocumented = artifactContainsSection(
    metrics,
    'kpi-dashboard',
    'How this score is computed'
  )

  const roadmap = hasArtifact(metrics, 'migration-roadmap')
  const treatment = hasArtifact(metrics, 'risk-treatment-plan')
  const playbook = hasArtifact(metrics, 'deployment-playbook')
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

  switch (stepId) {
    case 'govern':
      if (tier === 1)
        return `Add ${MISSING_LABEL['policy-draft']}, ${MISSING_LABEL['raci-matrix']}, or track a compliance framework.`
      if (tier === 2) {
        const need = [
          !policy && MISSING_LABEL['policy-draft'],
          !raci && MISSING_LABEL['raci-matrix'],
          !checklist && MISSING_LABEL['audit-checklist'],
        ].filter(Boolean)
        return need.length ? `Still need: ${need.join(', ')}.` : null
      }
      return (
        [
          !allGovDone && 'complete every governance learning module',
          !contract && MISSING_LABEL['contract-clause'],
          !exceptionsDocumented && 'document exceptions in your audit checklist',
        ]
          .filter(Boolean)
          .join(', ') || null
      )
    case 'inventory':
      if (tier === 1)
        return `Bookmark a product, complete your risk assessment, or add ${MISSING_LABEL['supply-chain-matrix']}.`
      if (tier === 2) {
        const need: string[] = []
        if (assessedLayers < T.inventoryAssessedLayersForRepeatable)
          need.push(
            `assess ${T.inventoryAssessedLayersForRepeatable - assessedLayers} more infra layer${T.inventoryAssessedLayersForRepeatable - assessedLayers === 1 ? '' : 's'}`
          )
        if (products < T.inventoryProductsForRepeatable)
          need.push(
            `bookmark ${T.inventoryProductsForRepeatable - products} more product${T.inventoryProductsForRepeatable - products === 1 ? '' : 's'}`
          )
        return need.length ? `Still need: ${need.join(', ')}.` : null
      }
      return (
        [
          assessedLayers < T.inventoryAssessedLayersForAdaptive &&
            `assess ${T.inventoryAssessedLayersForAdaptive - assessedLayers} more infra layer(s)`,
          !supplyMatrix && MISSING_LABEL['supply-chain-matrix'],
          !cbomDocumented && 'document CBOM asset classes',
          !pipelineDocumented && 'document pipeline sources',
          !fipsValidatedForInventory && 'get at least 1 FIPS-validated product on file',
        ]
          .filter(Boolean)
          .join(', ') || null
      )
    case 'identify-gaps':
      if (tier === 1)
        return `Add ${MISSING_LABEL['risk-register']} or complete your risk assessment.`
      if (tier === 2) {
        const need = [
          !register && MISSING_LABEL['risk-register'],
          !scorecard && MISSING_LABEL['vendor-scorecard'],
          !tracked && 'track a compliance framework',
        ].filter(Boolean)
        return need.length ? `Still need: ${need.join(', ')}.` : null
      }
      return (
        [
          metrics.assessmentHistory.length < T.identifyAssessmentHistoryForAdaptive &&
            'complete a second assessment',
          !observabilityDocumented && 'document observability tooling notes',
        ]
          .filter(Boolean)
          .join(', ') || null
      )
    case 'prioritise':
      if (tier === 1) return `Add ${MISSING_LABEL['compliance-timeline']} or a KPI dashboard.`
      if (tier === 2)
        return !anyKpi
          ? 'Still need: a KPI dashboard or tracker.'
          : !timeline
            ? `Still need: ${MISSING_LABEL['compliance-timeline']}.`
            : null
      return (
        [
          !crqc && MISSING_LABEL['crqc-scenario'],
          metrics.assessmentHistory.length < T.prioritiseAssessmentHistoryForAdaptive &&
            'complete a third assessment',
          !methodologyDocumented && 'document your KPI scoring methodology',
        ]
          .filter(Boolean)
          .join(', ') || null
      )
    case 'implement':
      if (tier === 1) return `Add ${MISSING_LABEL['migration-roadmap']} or start a migration.`
      if (tier === 2) {
        const need = [
          !roadmap && MISSING_LABEL['migration-roadmap'],
          !treatment && MISSING_LABEL['risk-treatment-plan'],
          !playbook && MISSING_LABEL['deployment-playbook'],
        ].filter(Boolean)
        return need.length ? `Still need: ${need.join(', ')}.` : null
      }
      return (
        [
          !metrics.workflowActive && 'start an active migration workflow',
          metrics.completedPhases.length < T.implementCompletedPhasesForAdaptive &&
            'complete 3+ migration phases',
          metrics.fipsBreakdown.validated < 1 && 'get at least 1 product FIPS-validated',
          !mitigationDocumented && 'document your mitigation gateway',
          !decommissionDocumented && 'document a decommission plan',
          !evidenceDocumented && 'document evidence (CMVP/ACVP/ESV/CVE-scan)',
        ]
          .filter(Boolean)
          .join(', ') || null
      )
  }
}
