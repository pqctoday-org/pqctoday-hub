// SPDX-License-Identifier: GPL-3.0-only
//
// Cross-reference resolvers for the Industry Landscape detail view — the
// lookups that turn one industry into its Learn modules, technical standards,
// Crypto Lab tools and a pointer at the regulatory register.
//
// Pure functions over already-loaded data, deliberately: the view stays a
// renderer, and every lookup here is testable without a DOM. Nothing in this
// file reads a store — `regulatoryFor` takes the profile as an argument so the
// component owns that decision and the resolver stays pure.
//
// NOT here, on purpose: a deadlines resolver. Deriving deadlines through each
// framework's `timeline_refs` was measured on 2026-08-13 and produces the
// IDENTICAL 9 events for 20 of the 22 industries (union 27, intersection 9) —
// every ref pulls all events for a (country, org) pair and the same regulators
// back every sector. A block captioned "deadlines for this industry" would show
// the same nine rows on twenty tiles, so there is no such block.

import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'
import { resolveToNaicsSet } from '@/data/sectorVocabularyData'
import { isCrossIndustry } from '@/data/industryMatch'
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { WORKSHOP_TOOLS, type WorkshopTool } from '@/components/Playground/workshopRegistry'
import type { IndustryStandard, IndustryUseCase } from '@/data/industryLandscapeData'
import { learnHref } from './learnHref'

// ── Sector identity ──────────────────────────────────────────────────────────

/**
 * NAICS codes for a landscape industry, via the shared sector vocabulary
 * (`sector_vocabulary_*.csv`) that the Library facet and the compliance
 * industry filter both resolve through.
 *
 * `resolveToNaicsSet` is exact-match on the lowercased alias and **echoes its
 * input** when nothing matches, which would silently produce
 * `/library?sector=Healthcare / Pharmaceutical` — a filter matching nothing.
 * We treat the echo as "unresolved" and return `[]` so callers render no link
 * rather than a broken one. The driftguard pins that only a `Cross-Industry`
 * label takes that path.
 */
export function sectorCodesFor(industry: string): string[] {
  // 'Cross-Industry' (and its 'Cross-Industry / X' sub-labels — see
  // isCrossIndustry) is the absence of a sector, not a sector — it has no
  // alias by design and must not be linked at a sector-filtered page.
  if (!industry || isCrossIndustry(industry)) return []
  const codes = resolveToNaicsSet(industry)
  if (codes.length === 1 && codes[0] === industry) return []
  return codes
}

/** `/library?sector=…` for an industry, or null when it has no sector identity. */
export function librarySectorHref(industry: string): string | null {
  const codes = sectorCodesFor(industry)
  if (codes.length === 0) return null
  return `/library?${codes.map((c) => `sector=${encodeURIComponent(c)}`).join('&')}`
}

// ── Learn ────────────────────────────────────────────────────────────────────

export interface IndustryLearnModule {
  manifest: ModuleManifest
  href: string
}

/**
 * The Learn modules for an industry, resolved across ALL its use-case rows.
 *
 * `learn_module_id` is an industry-level field stored at use-case grain, and
 * the driftguard already asserts every row for an industry agrees — so this
 * returns the same single module `cases[0]` would. Reading every row anyway
 * keeps the invariant local instead of depending on a test in another file,
 * and means adding a genuinely per-use-case module later is a data change
 * rather than a code change.
 */
export function learnModulesForIndustry(
  industry: string,
  useCases: IndustryUseCase[]
): IndustryLearnModule[] {
  const seen = new Set<string>()
  const out: IndustryLearnModule[] = []
  for (const uc of useCases) {
    if (uc.industry !== industry || !uc.learnModuleId || seen.has(uc.learnModuleId)) continue
    seen.add(uc.learnModuleId)
    const manifest = MANIFEST_BY_ID[uc.learnModuleId]
    // Guarded by the driftguard, but an unknown id must not crash the tile.
    if (!manifest) continue
    out.push({ manifest, href: learnHref(uc.learnModuleId, industry) })
  }
  return out
}

// ── Standards ────────────────────────────────────────────────────────────────

export interface StandardsGroup {
  body: string
  standards: IndustryStandard[]
}

/**
 * An industry's technical standards, grouped by standards body.
 *
 * Deliberately does NOT fall back to the 12 `Cross-Industry` rows (user
 * decision 2026-08-13): 10 of 22 industries have no rows at all, and
 * inheriting would hide that gap behind a block that looks populated. The
 * view renders an explicit empty state plus `librarySectorHref` instead.
 */
export function standardsForIndustry(
  industry: string,
  standards: IndustryStandard[]
): StandardsGroup[] {
  const byBody = new Map<string, IndustryStandard[]>()
  for (const s of standards) {
    if (s.industry !== industry) continue
    const list = byBody.get(s.standardsBody) ?? []
    list.push(s)
    byBody.set(s.standardsBody, list)
  }
  return [...byBody.entries()]
    .map(([body, list]) => ({ body, standards: list }))
    .sort((a, b) => a.body.localeCompare(b.body))
}

// ── Playground tools ─────────────────────────────────────────────────────────

const TOOL_BY_ID = new Map(WORKSHOP_TOOLS.map((t) => [t.id, t]))

/** Browser-runnable tools before sandbox scenarios; stable within each group. */
function sandboxLast(a: WorkshopTool, b: WorkshopTool): number {
  return Number(a.sandbox ?? false) - Number(b.sandbox ?? false)
}

/** Curated Crypto Lab tools for one use case, registry order preserved. */
export function toolsForUseCase(useCase: IndustryUseCase): WorkshopTool[] {
  return useCase.playgroundTools
    .map((id) => TOOL_BY_ID.get(id))
    .filter((t): t is WorkshopTool => !!t)
    .sort(sandboxLast)
}

export interface IndustryTool {
  tool: WorkshopTool
  /** Use cases in this industry that named the tool — drives the tooltip. */
  useCases: IndustryUseCase[]
}

/** Every tool named by any use case in the industry, de-duplicated. */
export function toolsForIndustry(industry: string, useCases: IndustryUseCase[]): IndustryTool[] {
  const byId = new Map<string, IndustryTool>()
  for (const uc of useCases) {
    if (uc.industry !== industry) continue
    for (const id of uc.playgroundTools) {
      const tool = TOOL_BY_ID.get(id)
      if (!tool) continue
      const hit = byId.get(id)
      if (hit) hit.useCases.push(uc)
      else byId.set(id, { tool, useCases: [uc] })
    }
  }
  return [...byId.values()].sort((a, b) => sandboxLast(a.tool, b.tool))
}

// ── Regulatory ───────────────────────────────────────────────────────────────

/**
 * `requires_pqc` values that make a framework worth counting on an Algorithms
 * page (user decision 2026-08-13): 37 of 197 active rows. `guidance` (69 rows)
 * and `no` (91) are excluded — they are real obligations, but not
 * post-quantum ones, and this is a count shown beside a crypto mechanism list.
 */
const PQC_RELEVANT = new Set(['yes', 'expected', 'partial'])

export interface RegulatoryPointer {
  /** PQC-relevant frameworks this sector's reader will see at `href`. */
  count: number
  /** `/compliance` deep link carrying the same industry + filter as the count. */
  href: string
}

/**
 * A count and a link — deliberately not a list.
 *
 * Rendering the register inline on the Algorithms tab would be a second,
 * degraded copy of `/compliance`, which already does this with country
 * filters, tiers, trust paths and a detail drawer. The count answers "is there
 * anything here for me", the link hands off the rest.
 *
 * The count MUST use the destination's own predicate, not the applicability
 * engine. That was the first implementation and a browser probe caught it: the
 * engine's tier rules require a country signal, so with no country saved it
 * returned 0 for Healthcare and 1 for Payment Card Industry while the register
 * those links opened listed far more. A count that disagrees with the page it
 * links to is worse than no count.
 *
 * So this mirrors ComplianceLandscape's industry filter exactly — resolve the
 * industry to a NAICS set, intersect with each row's `naicsCodes` — and applies
 * the same `req` narrowing the link carries. Same inputs, same predicate, same
 * number. Country deliberately plays no part: the link does not carry one, so
 * folding it into the count would make the two disagree again (and make a
 * shared URL show different numbers to different readers).
 */
export function regulatoryFor(
  landscapeIndustry: string,
  frameworks: ComplianceFramework[] = complianceFrameworks
): RegulatoryPointer {
  const wanted = sectorCodesFor(landscapeIndustry)
  const count =
    wanted.length === 0
      ? 0
      : frameworks.filter(
          (fw) =>
            PQC_RELEVANT.has(fw.pqcRequirement) &&
            (fw.naicsCodes ?? []).some((c) => wanted.includes(c))
        ).length

  // `ind` carries the landscape label; the compliance filter resolves it
  // through the same sector vocabulary sectorCodesFor uses, so the label the
  // reader clicked is what appears in the URL and both sides resolve alike.
  const params = new URLSearchParams({
    tab: 'standards',
    ind: landscapeIndustry,
    req: [...PQC_RELEVANT].join(','),
  })
  return { count, href: `/compliance?${params}` }
}
