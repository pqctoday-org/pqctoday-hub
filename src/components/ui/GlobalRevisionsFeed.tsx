// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { GitMerge, Bot, Filter } from 'lucide-react'
import { useRevisions, type RevisionEntry } from '@/hooks/useRevisions'
import { Button } from '@/components/ui/button'

const ALL_DOMAINS = ['module', 'tool', 'library', 'compliance', 'migrate', 'threats', 'algorithms']

interface GlobalRevisionsFeedProps {
  /** Limit to specific domains; omit for all */
  domains?: string[]
  /** Maximum entries to show before "load more" */
  pageSize?: number
  className?: string
}

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 30) return `${days}d ago`
    if (days < 365) return `${Math.floor(days / 30)}mo ago`
    return `${Math.floor(days / 365)}y ago`
  } catch {
    return iso.slice(0, 10)
  }
}

function DomainChip({
  domain,
  active,
  onClick,
}: {
  domain: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`px-2 py-0.5 h-auto rounded text-xs capitalize transition-colors ${
        active
          ? 'bg-primary/10 text-primary border border-primary/30'
          : 'bg-muted text-muted-foreground border border-border hover:text-foreground'
      }`}
    >
      {domain}
    </Button>
  )
}

function FeedEntry({ r }: { r: RevisionEntry }) {
  const offlineSuffix =
    r.approval_method === 'offline' && r.approved_via ? ` · via ${r.approved_via}` : ''

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="mt-0.5 shrink-0">
        {r.authored_by_llm ? (
          <Bot className="w-4 h-4 text-accent" aria-label="LLM-authored" />
        ) : (
          <GitMerge className="w-4 h-4 text-status-success" aria-label="Human-reviewed" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-foreground">{r.reviewer_display}</span>
          <span className="text-xs text-muted-foreground capitalize">{r.domain}</span>
          <span className="text-xs text-muted-foreground">{r.change_type.replace(/_/g, ' ')}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.scope_summary}</p>
        <div className="flex items-center gap-2 mt-1">
          {r.pr_number > 0 ? (
            <a
              href={`https://github.com/pqctoday-org/pqctoday-hub/pull/${r.pr_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              PR #{r.pr_number}
            </a>
          ) : (
            <a
              href={`https://github.com/pqctoday-org/pqctoday-hub/commit/${r.merge_sha}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline font-mono"
            >
              {r.merge_sha.slice(0, 7)}
            </a>
          )}
          {offlineSuffix && <span className="text-xs text-muted-foreground">{offlineSuffix}</span>}
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
        {formatRelative(r.merge_timestamp)}
      </span>
    </div>
  )
}

export function GlobalRevisionsFeed({
  domains,
  pageSize = 20,
  className = '',
}: GlobalRevisionsFeedProps) {
  const { revisions, isLoading } = useRevisions()
  const availableDomains = domains ?? ALL_DOMAINS
  const [activeDomains, setActiveDomains] = useState<Set<string>>(new Set(availableDomains))
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (activeDomains.size === 0) return revisions
    return revisions.filter((r) => activeDomains.has(r.domain))
  }, [revisions, activeDomains])

  const visible = filtered.slice(0, page * pageSize)
  const hasMore = visible.length < filtered.length

  function toggleDomain(d: string) {
    setActiveDomains((prev) => {
      const next = new Set(prev)
      if (next.has(d)) {
        if (next.size === 1) return prev // keep at least one
        next.delete(d)
      } else {
        next.add(d)
      }
      return next
    })
    setPage(1)
  }

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {availableDomains.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {availableDomains.map((d) => (
            <DomainChip
              key={d}
              domain={d}
              active={activeDomains.has(d)}
              onClick={() => toggleDomain(d)}
            />
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No revision records.</p>
      ) : (
        <div>
          {visible.map((r, i) => (
            <FeedEntry key={`${r.pr_number}-${i}`} r={r} />
          ))}
        </div>
      )}

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => setPage((p) => p + 1)}
        >
          Load more ({filtered.length - visible.length} remaining)
        </Button>
      )}

      {!hasMore && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center py-1">
          All {filtered.length} revision{filtered.length !== 1 ? 's' : ''} shown
        </p>
      )}
    </div>
  )
}
