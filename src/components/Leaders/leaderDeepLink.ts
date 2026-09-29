// SPDX-License-Identifier: GPL-3.0-only
import type { Leader } from '@/data/leadersData'
import { LEADERS_REGION_COUNTRIES, leaderMatchesCategory } from './leadersConstants'

/**
 * `?leader=` is still keyed on the display name (a stable `leader_id` column is
 * a later PR). Until then, match tolerantly so harmless differences don't make a
 * shared link fall flat: case, surrounding/duplicate whitespace, and an optional
 * "Dr." prefix (45 rows carry one; links built elsewhere often drop it).
 */
export function normalizeLeaderName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^dr\.?\s+/i, '')
    .toLowerCase()
}

/** Exact name first (so duplicate rows resolve predictably), then normalized. */
export function findLeaderByName(leaders: readonly Leader[], name: string): Leader | undefined {
  const exact = leaders.find((l) => l.name === name)
  if (exact) return exact
  const wanted = normalizeLeaderName(name)
  if (!wanted) return undefined
  return leaders.find((l) => normalizeLeaderName(l.name) === wanted)
}

/** Lexical half of the page's search filter (the semantic supplement is async). */
function matchesSearch(leader: Leader, query: string): boolean {
  const q = query.toLowerCase()
  return (
    leader.name.toLowerCase().includes(q) ||
    leader.title.toLowerCase().includes(q) ||
    leader.organizations.some((o) => o.toLowerCase().includes(q)) ||
    leader.bio.toLowerCase().includes(q) ||
    leader.category.toLowerCase().includes(q)
  )
}

export type LeaderDeepLinkPlan =
  | { kind: 'not-found'; name: string }
  | {
      kind: 'found'
      leader: Leader
      /** Human labels of what had to be cleared/revealed; empty = nothing hidden it. */
      widened: string[]
      /** Params with just the excluding filters removed (null when nothing changed). */
      nextParams: URLSearchParams | null
    }

/**
 * Resolve a `?leader=` deep link against the full dataset and work out the
 * smallest filter change that makes the person visible. Mirrors the filter
 * semantics in LeadersGrid's `filteredLeaders` (country wins over region).
 * Filters that don't exclude the person are kept.
 */
export function planLeaderDeepLink(
  leaders: readonly Leader[],
  params: URLSearchParams
): LeaderDeepLinkPlan | null {
  const raw = params.get('leader')
  if (!raw || !raw.trim()) return null
  const leader = findLeaderByName(leaders, raw)
  if (!leader) return { kind: 'not-found', name: raw.trim() }

  const next = new URLSearchParams(params)
  const widened: string[] = []

  if (leader.sourceKind === 'auto-imported' && params.get('all') !== '1') {
    next.set('all', '1')
    widened.push('the curated-only view')
  }
  const cat = params.get('cat')
  if (cat && cat !== 'All' && !leaderMatchesCategory(leader, cat)) {
    next.delete('cat')
    widened.push(`category "${cat}"`)
  }
  const country = params.get('country')
  const region = params.get('region')
  if (country && country !== 'All') {
    if (leader.country !== country) {
      next.delete('country')
      widened.push(`country "${country}"`)
      // With country cleared, the region filter takes effect again.
      if (region && region !== 'All' && !regionIncludes(region, leader.country)) {
        next.delete('region')
        widened.push(`region "${region}"`)
      }
    }
  } else if (region && region !== 'All' && !regionIncludes(region, leader.country)) {
    next.delete('region')
    widened.push(`region "${region}"`)
  }
  const sector = params.get('sector')
  if (sector && sector !== 'All' && leader.type !== sector) {
    next.delete('sector')
    widened.push(`sector "${sector}"`)
  }
  const q = params.get('q')
  if (q && q.trim() && !matchesSearch(leader, q)) {
    next.delete('q')
    widened.push(`search "${q}"`)
  }

  return { kind: 'found', leader, widened, nextParams: widened.length > 0 ? next : null }
}

function regionIncludes(region: string, country: string): boolean {
  // eslint-disable-next-line security/detect-object-injection -- region is a filter id
  return (LEADERS_REGION_COUNTRIES[region] ?? []).includes(country)
}
