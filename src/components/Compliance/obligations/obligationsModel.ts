// SPDX-License-Identifier: GPL-3.0-only
/**
 * Register model — turns the applicability engine's output into the rows the
 * Obligations tab draws. Pure functions only; no React, no stores.
 *
 * Two things happen here that the engine deliberately does not do:
 *
 *  1. **Requirement counts.** A framework's requirements are extracted from the
 *     library documents it cites, not from the instrument's own text. The
 *     detail drawer resolves the FIRST citation that carries requirements;
 *     this model takes the UNION across every citation, de-duplicated by
 *     `ref_id`, because a row citing four ANSSI papers is bound by all four.
 *     The count is CONTEXT — never a denominator. Nothing in this file
 *     computes a percentage over requirements, and nothing should.
 *
 *  2. **Tier grouping.** The engine returns a flat list. The register groups by
 *     tier so "who says so" is the page's organising idea, and so the advisory
 *     band — 23 global standards for an EU finance profile, against 12
 *     mandatory — can be collapsed without being hidden.
 */
import type { ComplianceFramework } from '@/data/complianceData'
import { maturityByRefId } from '@/data/maturityGovernanceData'
import {
  applicableFrameworks,
  TIER_ORDER,
  type ApplicabilityTier,
  type UserProfile,
} from '@/utils/applicabilityEngine'

export interface ObligationRow {
  framework: ComplianceFramework
  tier: ApplicabilityTier
  /** Verbatim engine reason — "Your regulator: ANSSI". Never paraphrase it. */
  reason: string
  /** Distinct requirements across every cited document that carries any. */
  requirementCount: number
  /** The `ref_id`s those requirements came from, in citation order. */
  requirementSources: string[]
  /** Stated milestones, ascending. Empty for `ongoing` rows — see below. */
  milestones: { year: number; label: string }[]
}

export interface ObligationGroup {
  tier: ApplicabilityTier
  rows: ObligationRow[]
}

/**
 * Requirements reachable from a framework's citations.
 *
 * De-duplicates by `ref_id` rather than summing: two citations resolving to the
 * same document must not double-count it. Citations that carry no extracted
 * requirements are dropped from `sources` so the UI can say "no extracted
 * requirements" honestly rather than showing a source with a zero beside it.
 */
export function resolveRequirements(framework: ComplianceFramework): {
  count: number
  sources: string[]
} {
  const seen = new Set<string>()
  const sources: string[] = []
  let count = 0
  for (const ref of framework.libraryRefs) {
    const key = ref.trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    const rows = maturityByRefId.get(key)
    if (!rows || rows.length === 0) continue
    sources.push(key)
    count += rows.length
  }
  return { count, sources }
}

/**
 * Stated milestones, ascending.
 *
 * Reads `deadlineDates` — the structured column — and nothing else. The free
 * text `deadline` is for humans and is rendered verbatim beside this; parsing
 * prose to invent dates is how a mock ends up showing "GDPR Art. 32, 2018" for
 * a row whose data carries no date at all.
 */
export function milestonesFor(framework: ComplianceFramework): { year: number; label: string }[] {
  const dates = framework.deadlineDates ?? []
  return [...dates].sort((a, b) => a.year - b.year)
}

/** Builds the register for a scope. Empty when the profile has no scope at all. */
export function buildObligations(
  profile: UserProfile,
  frameworks?: ComplianceFramework[]
): ObligationRow[] {
  return applicableFrameworks(profile, frameworks).map((result) => {
    const { count, sources } = resolveRequirements(result.item)
    return {
      framework: result.item,
      tier: result.tier,
      reason: result.reason,
      requirementCount: count,
      requirementSources: sources,
      milestones: milestonesFor(result.item),
    }
  })
}

/**
 * Groups rows into tier bands in `TIER_ORDER`, dropping empty bands.
 *
 * Within a band, rows with a stated first milestone sort earliest-first, then
 * everything else alphabetically. An obligation that bites in 2026 outranks one
 * that is merely ongoing, and two ongoing rows should not shuffle between
 * renders.
 */
export function groupObligations(rows: ObligationRow[]): ObligationGroup[] {
  const byTier = new Map<ApplicabilityTier, ObligationRow[]>()
  for (const row of rows) {
    const bucket = byTier.get(row.tier)
    if (bucket) bucket.push(row)
    else byTier.set(row.tier, [row])
  }
  return TIER_ORDER.filter((tier) => (byTier.get(tier)?.length ?? 0) > 0).map((tier) => ({
    tier,
    rows: [...(byTier.get(tier) ?? [])].sort((a, b) => {
      const ay = a.framework.deadlineStart
      const by = b.framework.deadlineStart
      if (ay !== undefined && by !== undefined && ay !== by) return ay - by
      if (ay !== undefined && by === undefined) return -1
      if (ay === undefined && by !== undefined) return 1
      return a.framework.label.localeCompare(b.framework.label)
    }),
  }))
}

/**
 * Tiers whose band is collapsed on arrival.
 *
 * Advisory is the sector-matched global-standards band — for an EU finance
 * profile it is 23 rows against 12 mandatory, and expanded it reproduces the
 * catalogue-browser problem the register exists to replace. Collapsed is not
 * hidden: the band shows its count and opens in one click.
 */
export const COLLAPSED_BY_DEFAULT: ReadonlySet<ApplicabilityTier> = new Set([
  'advisory',
  'cross-border',
])

/**
 * Sector options, derived from the catalogue rather than from a hand-kept list.
 *
 * There are two industry vocabularies in the codebase — the assessment's
 * (`Finance & Banking`, `Government & Defense`) and the compliance catalogue's
 * (`Finance & Insurance`, `Public Administration`). The engine matches on the
 * catalogue's, so offering the assessment's here would let a visitor pick a
 * sector that can never match a row. Deriving from the data makes every option
 * one that returns something, and keeps the list correct as the CSV grows.
 */
export function sectorOptions(frameworks: ComplianceFramework[]): string[] {
  const seen = new Set<string>()
  for (const fw of frameworks) {
    for (const ind of fw.industries) {
      const v = ind.trim()
      if (v) seen.add(v)
    }
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b))
}

/** Counts for the header summary. Obligations, never percentages. */
export function summarize(rows: ObligationRow[]): {
  total: number
  byTier: Record<string, number>
  pqcMandated: number
} {
  const byTier: Record<string, number> = {}
  let pqcMandated = 0
  for (const row of rows) {
    byTier[row.tier] = (byTier[row.tier] ?? 0) + 1
    if (row.framework.pqcRequirement === 'yes') pqcMandated += 1
  }
  return { total: rows.length, byTier, pqcMandated }
}
