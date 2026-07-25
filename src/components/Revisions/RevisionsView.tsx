// SPDX-License-Identifier: GPL-3.0-only
import { GitMerge } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { GlobalRevisionsFeed } from '@/components/ui/GlobalRevisionsFeed'
import { useRevisions, type RevisionEntry } from '@/hooks/useRevisions'

// Kept as a module-level helper (like formatRelative in GlobalRevisionsFeed) so the
// Date.now() read isn't an impure call in the component render body.
function summarizeRecentRevisions(
  revisions: RevisionEntry[],
  windowDays = 30
): { count: number; topDomains: string } | null {
  const cutoff = Date.now() - windowDays * 86400000
  const recent = revisions.filter((r) => {
    const t = new Date(r.merge_timestamp).getTime()
    return !Number.isNaN(t) && t >= cutoff
  })
  if (recent.length === 0) return null

  const byDomain = new Map<string, number>()
  for (const r of recent) byDomain.set(r.domain, (byDomain.get(r.domain) ?? 0) + 1)
  const topDomains = [...byDomain.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([domain, count]) => `${count} ${domain}`)
    .join(' · ')

  return { count: recent.length, topDomains }
}

function RevisionsSummary() {
  const { revisions, isLoading } = useRevisions()
  if (isLoading || revisions.length === 0) return null

  const summary = summarizeRecentRevisions(revisions)
  if (!summary) return null

  return (
    <p className="text-sm text-foreground">
      <span className="font-semibold">{summary.count}</span> reviewed update
      {summary.count !== 1 ? 's' : ''} in the last 30 days
      {summary.topDomains && <span className="text-muted-foreground"> — {summary.topDomains}</span>}
    </p>
  )
}

export function RevisionsView() {
  const [searchParams] = useSearchParams()
  const entityFilter = searchParams.get('entity') ?? undefined
  const domainFilter = searchParams.get('domain') ?? undefined

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-primary" aria-hidden="true" />
          <h1 className="text-gradient text-2xl font-bold">Content Revisions</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Every correction to our compliance, vendor, and migration data is reviewed, logged, and
          shown here — this is how we keep the data you rely on trustworthy and auditable. See our{' '}
          <Link to="/editorial-independence" className="text-primary hover:underline">
            editorial-independence policy
          </Link>{' '}
          for how changes are approved.
        </p>
        <p className="text-sm text-muted-foreground">
          In plain terms: if a fact on this site turned out to be wrong or out of date, what
          changed, who reviewed it, and why is recorded below — nothing gets corrected silently.
        </p>
        <RevisionsSummary />
      </header>

      <div className="glass-panel p-4">
        <GlobalRevisionsFeed
          pageSize={25}
          entityFilter={entityFilter}
          domainFilter={domainFilter}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Raw feed:{' '}
        <a href="/data/revisions.jsonl" className="font-mono text-accent hover:underline">
          /data/revisions.jsonl
        </a>
      </p>
    </div>
  )
}
