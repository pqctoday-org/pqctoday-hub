// SPDX-License-Identifier: GPL-3.0-only
/**
 * B+ round 8 UX fix (2026-09-19): reviewed data revisions that merged after
 * the reader's previous landing visit. Returns null until there is something
 * to say — first ever visit, revisions still loading, or nothing merged since.
 */
import { useEffect, useMemo } from 'react'
import { useRevisions } from '@/hooks/useRevisions'
import { useLastVisitStore } from '@/store/useLastVisitStore'

const DOMAIN_LABEL: Record<string, string> = {
  module: 'Learn modules',
  tool: 'Playground tools',
  library: 'Library',
  compliance: 'Compliance',
  migrate: 'Migrate catalog',
  threats: 'Threats',
  algorithms: 'Algorithms',
  timeline: 'Timeline',
  leaders: 'Community',
  patents: 'Patents',
  vendors: 'Vendors',
  'trusted-sources': 'Trusted sources',
}

export interface RevisionsSinceLastVisit {
  count: number
  /** ISO timestamp the count is measured from. */
  since: string
  /** Up to three domain labels, most-revised first. */
  domains: string[]
}

export function useRevisionsSinceLastVisit(): RevisionsSinceLastVisit | null {
  const { revisions, isLoading } = useRevisions()
  const previousVisitAt = useLastVisitStore((s) => s.previousVisitAt)
  const recordVisit = useLastVisitStore((s) => s.recordVisit)

  useEffect(() => {
    recordVisit()
  }, [recordVisit])

  return useMemo(() => {
    if (isLoading || !previousVisitAt) return null
    const since = new Date(previousVisitAt).getTime()
    if (Number.isNaN(since)) return null
    const fresh = revisions.filter((r) => {
      if (r.merge_sha === 'pending') return false
      const t = new Date(r.merge_timestamp).getTime()
      return !Number.isNaN(t) && t > since
    })
    if (fresh.length === 0) return null
    const byDomain = new Map<string, number>()
    for (const r of fresh) byDomain.set(r.domain, (byDomain.get(r.domain) ?? 0) + 1)
    const domains = [...byDomain.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([d]) => DOMAIN_LABEL[d] ?? d)
    return { count: fresh.length, since: previousVisitAt, domains }
  }, [revisions, isLoading, previousVisitAt])
}
