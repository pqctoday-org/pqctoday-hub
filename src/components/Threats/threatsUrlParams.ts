// SPDX-License-Identifier: GPL-3.0-only
/**
 * The Threats page's URL contract, parsed in one place for both the desktop
 * dashboard and the mobile screen (which ignored every parameter until
 * 2026-09-23, so a shared link opened the unfiltered list — or, on a first
 * visit, the role picker — instead of the threat).
 *
 * Keep runtime imports to the tiny, data-free `threatRowRules`: MainLayout
 * imports `isThreatsDeepLink` into the app shell, so anything this module
 * pulled in (the threats CSV above all) would land in every visitor's boot
 * bundle.
 */
import type { ThreatClass } from './threatClassification'
import type { ThreatItem } from '@/data/threatsData'
import { canonicalThreatIndustry } from '@/data/threatRowRules'

/** The threat id a URL asks to open: `?id=`, else the legacy `?threat=` alias
 *  that Endorse/Flag links carried until 2026-09-23 (links already shared
 *  keep working). */
export function threatIdParam(params: URLSearchParams): string | null {
  return params.get('id') || params.get('threat') || null
}

/**
 * `?industry=` (comma-separated) → the page's industry labels, matched
 * case-insensitively. A raw CSV label the page merges (e.g. "Critical
 * Infrastructure") resolves to the merged label, so links built from the CSV
 * still land. Unknown values are dropped.
 */
export function resolveIndustryParam(
  param: string | null,
  rows: readonly Pick<ThreatItem, 'industry'>[]
): string[] {
  if (!param) return []
  const labels = new Map(rows.map((r) => [r.industry.toLowerCase(), r.industry]))
  const out: string[] = []
  for (const part of param.split(',')) {
    const raw = part.trim()
    if (!raw) continue
    const hit =
      labels.get(raw.toLowerCase()) ?? labels.get(canonicalThreatIndustry(raw).toLowerCase())
    if (hit && !out.includes(hit)) out.push(hit)
  }
  return out
}

const CLASS_PARAM_VALUES: readonly ThreatClass[] = ['hndl', 'hnfl', 'both']

/** `?class=` → a threat class, or null for absent/unknown values. */
export function threatClassParam(params: URLSearchParams): ThreatClass | null {
  const v = params.get('class')?.toLowerCase()
  return (CLASS_PARAM_VALUES as readonly string[]).includes(v ?? '') ? (v as ThreatClass) : null
}

/** The page's lexical search: id, description, industry, at-risk crypto, PQC. */
export function matchesThreatQuery(item: ThreatItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    item.threatId.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.industry.toLowerCase().includes(q) ||
    item.cryptoAtRisk.toLowerCase().includes(q) ||
    item.pqcReplacement.toLowerCase().includes(q)
  )
}

/** `?view=horizon` — open scrolled to the CRQC Threat Horizon section. */
export function wantsHorizonView(params: URLSearchParams): boolean {
  return params.get('view') === 'horizon'
}

/** Parameters that make a /threats URL a link to specific content. */
const DEEP_LINK_PARAMS = ['id', 'threat', 'industry', 'q', 'class'] as const

/** Is this a link into specific Threats content (a threat, a filtered set)?
 *  The mobile first-run role picker must not stand in front of one. */
export function isThreatsDeepLink(pathname: string, search: string): boolean {
  if (pathname.replace(/\/+$/, '') !== '/threats') return false
  const params = new URLSearchParams(search)
  return DEEP_LINK_PARAMS.some((p) => params.get(p))
}
