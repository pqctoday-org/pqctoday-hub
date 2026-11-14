// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The row selection each persona's For You view makes. The views and the page's For You
 * export both read these functions, so an export lists exactly what the view lists.
 */
import { groupByTier, type ApplicabilityResult } from '../../../utils/applicabilityEngine'
import {
  complianceFrameworks,
  regionForCountry,
  type ComplianceFramework,
  type DeadlinePhase,
  type RegionBloc,
} from '../../../data/complianceData'
import type { DerivedResult } from '../../../utils/trustPathTraversal'

/** Row limits each view shows: shared here so a view and its export cannot drift apart. */
export const ARCHITECT_PER_REGION = 8
export const DEVELOPER_ROWS = 12
export const OPS_PHASE_LANE = 4
export const OPS_TABLE_ROWS = 10

/** The applicability results grouped by tier, as the Executive view and the default panel group them. */
export function tierGroups<T>(results: ApplicabilityResult<T>[]) {
  return groupByTier(results)
}

/** Applicable frameworks in the order the For You views list them: mandatory, recognised, cross-border, advisory. */
export function applicableInTierOrder(
  results: ApplicabilityResult<ComplianceFramework>[]
): ApplicabilityResult<ComplianceFramework>[] {
  const grouped = groupByTier(results)
  return [
    ...grouped.mandatory,
    ...grouped.recognized,
    ...grouped['cross-border'],
    ...grouped.advisory,
  ]
}

export function applicableFrameworks(
  results: ApplicabilityResult<ComplianceFramework>[]
): ComplianceFramework[] {
  return applicableInTierOrder(results).map((r) => r.item)
}

/** Region display order — same as REGION_BLOC_ORDER in complianceData. */
export const REGION_ORDER: (RegionBloc | 'Other')[] = [
  'Global',
  'North America',
  'European Union',
  'United Kingdom',
  'Europe (non-EU)',
  'Latin America',
  'Asia-Pacific',
  'Middle East',
  'Africa',
  'Other',
]

/** Each framework sits in every region bloc its countries fall in (e.g. EU and Global). */
export function frameworksByRegion(
  applicable: ComplianceFramework[]
): Map<RegionBloc | 'Other', ComplianceFramework[]> {
  const m = new Map<RegionBloc | 'Other', ComplianceFramework[]>()
  for (const fw of applicable) {
    const regions = new Set<RegionBloc | 'Other'>()
    for (const c of fw.countries) regions.add(regionForCountry(c) as RegionBloc)
    for (const r of regions) {
      const arr = m.get(r) ?? []
      arr.push(fw)
      m.set(r, arr)
    }
  }
  return m
}

export const PHASE_ORDER: DeadlinePhase[] = ['active', 'imminent', 'near', 'mid', 'long', 'ongoing']

export function frameworksByPhase(
  applicable: ComplianceFramework[]
): Map<DeadlinePhase, ComplianceFramework[]> {
  const m = new Map<DeadlinePhase, ComplianceFramework[]>()
  for (const fw of applicable) {
    const phase = fw.deadlinePhase ?? 'ongoing'
    const bucket = m.get(phase) ?? []
    bucket.push(fw)
    m.set(phase, bucket)
  }
  return m
}

/** The certification schemes' PQC wording, keyed by the PQC requirement value. */
export const PQC_EXPECTATION: Record<string, string> = {
  yes: 'Requires PQC',
  expected: 'PQC expected',
  partial: 'Partly PQC',
  guidance: 'PQC guidance',
}

export function certSchemesByExpectation(frameworks: ComplianceFramework[]): {
  expecting: ComplianceFramework[]
  others: ComplianceFramework[]
} {
  const schemes = frameworks.filter((fw) => fw.bodyType === 'certification_body')
  const expectsPqc = (fw: ComplianceFramework) =>
    Boolean(fw.pqcRequirement && fw.pqcRequirement in PQC_EXPECTATION)
  return {
    expecting: schemes.filter(expectsPqc),
    others: schemes.filter((fw) => !expectsPqc(fw)),
  }
}

export interface RuleMakerBody {
  body: string
  earliest: number | null
  count: number
}

/** The enforcement bodies of the PQC-requiring frameworks, earliest milestone first, six at most. */
export function ruleMakerBodies(
  frameworks: readonly ComplianceFramework[] = complianceFrameworks
): RuleMakerBody[] {
  const byBody = new Map<string, RuleMakerBody>()
  for (const fw of frameworks) {
    if (!fw.requiresPQC) continue
    const body = fw.enforcementBody?.trim()
    if (!body) continue
    const year =
      fw.deadlineYear ??
      (fw.deadlineDates?.length ? Math.min(...fw.deadlineDates.map((d) => d.year)) : null)
    const existing = byBody.get(body)
    if (existing) {
      existing.count += 1
      if (year !== null && (existing.earliest === null || year < existing.earliest)) {
        existing.earliest = year
      }
    } else {
      byBody.set(body, { body, earliest: year, count: 1 })
    }
  }
  return [...byBody.values()]
    .sort((a, b) => (a.earliest ?? 9999) - (b.earliest ?? 9999))
    .slice(0, 6)
}

/**
 * The GRC view sorts the applicable set by data confidence, least first; frameworks with no
 * score go last. The researcher view sorts most first; no score sorts last.
 */
export function sortedByConfidence(
  results: ApplicabilityResult<ComplianceFramework>[],
  direction: 'ascending' | 'descending'
): ApplicabilityResult<ComplianceFramework>[] {
  const all = applicableInTierOrder(results)
  return all.slice().sort((a, b) => {
    if (direction === 'ascending') {
      const cA = a.item.confidenceScore ?? Number.MAX_SAFE_INTEGER
      const cB = b.item.confidenceScore ?? Number.MAX_SAFE_INTEGER
      return cA - cB
    }
    const cA = a.item.confidenceScore ?? -1
    const cB = b.item.confidenceScore ?? -1
    return cB - cA
  })
}

/** Derived (trust-path) frameworks appear on the default panel and on these persona views only. */
export function forYouShowsDerived(persona: string | null | undefined): boolean {
  return !persona || persona === 'executive' || persona === 'grc' || persona === 'researcher'
}

/** One row of a For You view, as the view lists it. `section` names the view's own grouping. */
export interface ForYouViewRow {
  section: string
  id: string
  label: string
  tier?: string
  reason?: string
  bindingStatus?: string
  deadline?: string
  confidenceScore?: number
  trustedSource?: string
}

function frameworkRow(
  section: string,
  fw: ComplianceFramework,
  tier?: string,
  reason?: string
): ForYouViewRow {
  return {
    section,
    id: fw.id,
    label: fw.label,
    tier,
    reason,
    bindingStatus: fw.bindingStatus,
    deadline: fw.deadline,
    confidenceScore: fw.confidenceScore,
    trustedSource: fw.trustedSourceId,
  }
}

/** The frameworks the trust paths reach, as the views list them under "Derived via cross-walk". */
function derivedRows(derived: DerivedResult[]): ForYouViewRow[] {
  return derived.map((d) => ({
    section: 'reached through a trust path',
    id: d.standardId,
    label: d.standardLabel,
    tier: d.derivedTier,
    reason: 'Reached through a trust path from your applicable frameworks',
  }))
}

/**
 * The rows the For You view for this persona lists. Each branch reads the same selection
 * the view reads; the default panel and the Executive, GRC and Researcher views list the
 * applicable set in full, with derived rows where forYouShowsDerived is true.
 */
export function forYouViewRows(
  persona: string | null | undefined,
  results: ApplicabilityResult<ComplianceFramework>[],
  derived: DerivedResult[]
): ForYouViewRow[] {
  const applicable = applicableFrameworks(results)
  switch (persona) {
    case 'architect': {
      const tierById = new Map(applicableInTierOrder(results).map((r) => [r.item.id, r.tier]))
      const byRegion = frameworksByRegion(applicable)
      return REGION_ORDER.filter((r) => byRegion.has(r)).flatMap((region) =>
        (byRegion.get(region) ?? [])
          .slice(0, ARCHITECT_PER_REGION)
          .map((fw) => frameworkRow(region, fw, tierById.get(fw.id)))
      )
    }
    case 'developer':
      return applicable.slice(0, DEVELOPER_ROWS).map((fw) => frameworkRow('', fw))
    case 'ops': {
      const byPhase = frameworksByPhase(applicable)
      const lanes = PHASE_ORDER.filter((p) => byPhase.has(p)).flatMap((phase) =>
        (byPhase.get(phase) ?? []).slice(0, OPS_PHASE_LANE).map((fw) => frameworkRow(phase, fw))
      )
      return [
        ...lanes,
        ...applicable.slice(0, OPS_TABLE_ROWS).map((fw) => frameworkRow('table', fw)),
      ]
    }
    case 'cert-engineer':
      // The cert view splits the engine's own order, not the tier order.
      return certSchemesByExpectation(results.map((r) => r.item)).expecting.map((fw) =>
        frameworkRow('expects PQC', fw)
      )
    case 'grc':
    case 'researcher': {
      const direction = persona === 'grc' ? 'ascending' : 'descending'
      const rows = sortedByConfidence(results, direction).map((r) =>
        frameworkRow('', r.item, r.tier, r.reason)
      )
      return [...rows, ...(forYouShowsDerived(persona) ? derivedRows(derived) : [])]
    }
    case 'curious':
      return ruleMakerBodies().map((b) => ({
        section: '',
        id: b.body,
        label: b.body,
        reason: `${b.count} framework${b.count === 1 ? '' : 's'} require PQC; earliest milestone ${b.earliest ?? 'not recorded'}`,
      }))
    default: {
      const direct = applicableInTierOrder(results).map((r) =>
        frameworkRow('', r.item, r.tier, r.reason)
      )
      return [...direct, ...(forYouShowsDerived(persona) ? derivedRows(derived) : [])]
    }
  }
}
