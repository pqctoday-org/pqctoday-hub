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
import {
  canonicalThreatIndustry,
  THREAT_INDUSTRY_ALIASES,
  threatIndustrySlug,
} from '@/data/threatRowRules'

/** The threat id a URL asks to open: `?id=`, else the legacy `?threat=` alias
 *  that Endorse/Flag links carried until 2026-09-23 (links already shared
 *  keep working). */
export function threatIdParam(params: URLSearchParams): string | null {
  return params.get('id') || params.get('threat') || null
}

/** Old-label slug → current label, e.g. `energy-critical-infrastructure` →
 *  "Critical Infrastructure / OT" (ruling R3 aliases, as slugs). */
const ALIAS_SLUGS = new Map(
  Object.entries(THREAT_INDUSTRY_ALIASES).map(([old, label]) => [threatIndustrySlug(old), label])
)

/**
 * `?industry=` (comma-separated) → the page's industry labels. Each value may
 * be a label (matched case-insensitively), an OLD label the page has renamed
 * (e.g. "Energy / Critical Infrastructure", "Aerospace / Aviation" — ruling
 * R3), or the slug of either (`critical-infrastructure-ot`,
 * `aerospace-aviation`). Unknown values are dropped.
 */
export function resolveIndustryParam(
  param: string | null,
  rows: readonly Pick<ThreatItem, 'industry'>[]
): string[] {
  if (!param) return []
  const labels = new Map(rows.map((r) => [r.industry.toLowerCase(), r.industry]))
  const slugs = new Map(rows.map((r) => [threatIndustrySlug(r.industry), r.industry]))
  const out: string[] = []
  for (const part of param.split(',')) {
    const raw = part.trim()
    if (!raw) continue
    const slug = threatIndustrySlug(raw)
    const aliased = ALIAS_SLUGS.get(slug)
    const hit =
      labels.get(raw.toLowerCase()) ??
      labels.get(canonicalThreatIndustry(raw).toLowerCase()) ??
      slugs.get(slug) ??
      (aliased ? labels.get(aliased.toLowerCase()) : undefined)
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

/** Queries this short are matched at word starts, not anywhere (UX-16). */
export const SHORT_QUERY_MAX_LENGTH = 4

/** Is this a short (≤4-character) query — an acronym like "PCI" or "HSM"? */
export function isShortThreatQuery(query: string): boolean {
  const q = query.trim()
  return q.length > 0 && q.length <= SHORT_QUERY_MAX_LENGTH
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * The page's lexical search: id, description, industry, at-risk crypto, PQC.
 * A short query (≤4 characters) must start a word — "PCI" finds "PCI DSS" and
 * "PCI-002" but not the "pci" inside "EPCIS" (UX-16); "HSM" still finds
 * "HSMs". Longer queries keep plain substring matching.
 */
export function matchesThreatQuery(item: ThreatItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const fields = [
    item.threatId,
    item.description,
    item.industry,
    item.cryptoAtRisk,
    item.pqcReplacement,
  ].map((f) => f.toLowerCase())
  if (isShortThreatQuery(q)) {
    // eslint-disable-next-line security/detect-non-literal-regexp -- the query is escaped
    const wordStart = new RegExp(`(?<![a-z0-9])${escapeRegExp(q)}`)
    return fields.some((f) => wordStart.test(f))
  }
  return fields.some((f) => f.includes(q))
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
