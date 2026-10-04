// SPDX-License-Identifier: GPL-3.0-only
/**
 * Community profiles behind a product's credited open-source maintainers, for
 * the `/leaders?leader=<leader_id>` links on the product detail (desktop
 * ProductDetail and the phone product sheet). Pure logic plus one loader hook,
 * no JSX.
 *
 * `open_source_maintainers` (catalogue column, populated by the
 * enrich-migrate-open-source-maintainers skill) is `;`-separated, never `,` —
 * a name may itself carry a comma. Measured 2026-10-03 on
 * pqc_product_catalog_10022026_r1.csv: 18 of 1038 rows filled, 46 entries,
 * two shapes:
 *   - "Peter Dettman (github:peterdettman)"  — a person plus their handle
 *   - "Web3 Foundation", "IntersectMBO (Cardano)" — an organisation
 * and one surname-first person ("Lim, Thing-han").
 *
 * A maintainer links to a profile when, in order:
 *  1. a leader whose `MigrateCatalogRefs` credits THIS product has the same
 *     name (normalized, accent-folded, or "Surname, Given" re-ordered) — the
 *     crosscheck-migrate-leaders skill writes that reverse edge, so it is the
 *     authoritative anchor; or
 *  2. the name resolves via the Community page's own tolerant matcher
 *     (findLeaderByName: exact, then normalized), as written or re-ordered.
 * Anything else renders as plain text: no fuzzy guessing at a person.
 */
import { useEffect, useState } from 'react'
import type { Leader } from '@/data/leadersData'
import {
  findLeaderByName,
  leaderNameSlug,
  normalizeLeaderName,
} from '@/components/Leaders/leaderDeepLink'

export interface MaintainerLink {
  /** The maintainer as displayed: the catalogue entry minus any handle. */
  name: string
  /** Forge handle carried by the entry ("github:dghgit" → "dghgit"), if any. */
  handle?: string
  /** Community profile for this maintainer, or null (render plain text). */
  leader: Leader | null
}

const HANDLE_SUFFIX = /\s*\((?:github|gitlab|gh):\s*([^)]*)\)\s*$/i

/** "David Hook (github:dghgit)" → { name: "David Hook", handle: "dghgit" }. */
export function parseMaintainer(raw: string): { name: string; handle?: string } {
  const m = HANDLE_SUFFIX.exec(raw)
  const name = (m ? raw.slice(0, m.index) : raw).trim()
  const handle = m?.[1]?.trim()
  return handle ? { name, handle } : { name }
}

/** "Lim, Thing-han" → "Thing-han Lim"; null when the name has no single comma. */
function givenFirst(name: string): string | null {
  const parts = name.split(',')
  if (parts.length !== 2) return null
  const [surname, given] = parts.map((p) => p.trim())
  return surname && given ? `${given} ${surname}` : null
}

function sameName(leaderName: string, candidate: string): boolean {
  return (
    normalizeLeaderName(leaderName) === normalizeLeaderName(candidate) ||
    (leaderNameSlug(leaderName) !== '' && leaderNameSlug(leaderName) === leaderNameSlug(candidate))
  )
}

export function maintainerLinksFor(
  product: { productId: string; openSourceMaintainers?: readonly string[] },
  leaders: readonly Leader[] | null
): MaintainerLink[] {
  const entries = product.openSourceMaintainers ?? []
  if (entries.length === 0) return []
  const credited = (leaders ?? []).filter((l) =>
    (l.migrateCatalogRefs ?? []).includes(product.productId)
  )
  return entries.map((raw) => {
    const { name, handle } = parseMaintainer(raw)
    const names = [name, givenFirst(name)].filter((n): n is string => !!n)
    let leader: Leader | null = null
    if (leaders && name) {
      leader =
        credited.find((l) => names.some((n) => sameName(l.name, n))) ??
        names.map((n) => findLeaderByName(leaders, n)).find((l) => !!l) ??
        null
    }
    return handle ? { name, handle, leader } : { name, leader }
  })
}

/** `?leader=` takes the stable leader_id first, the display name as fallback. */
export function leaderProfileHref(leader: Pick<Leader, 'leaderId' | 'name'>): string {
  return `/leaders?leader=${encodeURIComponent(leader.leaderId || leader.name)}`
}

let leadersCache: readonly Leader[] | null = null

/**
 * The Community roster, loaded on demand: only ~2% of catalogue rows credit a
 * maintainer, so the product views must not carry the leaders CSV in their
 * own chunk. Returns null until loaded (and when `needed` is false); callers
 * render the names as plain text meanwhile.
 */
export function useLeadersRoster(needed: boolean): readonly Leader[] | null {
  const [leaders, setLeaders] = useState<readonly Leader[] | null>(leadersCache)
  useEffect(() => {
    if (!needed || leaders) return
    let cancelled = false
    void import('@/data/leadersData').then((m) => {
      leadersCache = m.leadersData
      if (!cancelled) setLeaders(m.leadersData)
    })
    return () => {
      cancelled = true
    }
  }, [needed, leaders])
  return needed ? leaders : null
}
