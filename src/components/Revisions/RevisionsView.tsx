// SPDX-License-Identifier: GPL-3.0-only
import { GitMerge } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { GlobalRevisionsFeed } from '@/components/ui/GlobalRevisionsFeed'

export function RevisionsView() {
  const [searchParams] = useSearchParams()
  const entityFilter = searchParams.get('entity') ?? undefined
  const domainFilter = searchParams.get('domain') ?? undefined

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-primary" aria-hidden="true" />
          <h1 className="text-gradient text-2xl font-bold">Content Revisions</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Audit trail of all reviewed and merged data updates — sourced from{' '}
          <code className="text-xs font-mono text-accent">/data/revisions.jsonl</code>.
        </p>
      </header>

      <div className="glass-panel p-4">
        <GlobalRevisionsFeed
          pageSize={25}
          entityFilter={entityFilter}
          domainFilter={domainFilter}
        />
      </div>
    </div>
  )
}
