// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { GitMerge, Bot, ChevronRight, History } from 'lucide-react'
import { useRevisions, byDomain, type RevisionEntry } from '@/hooks/useRevisions'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'

interface ContentUpdatesFeedProps {
  /** Filter to a specific domain; omit for all domains */
  domain?: string
  /** Max entries to show */
  limit?: number
  /** Section title */
  title?: string
  /** Default collapsed state */
  defaultCollapsed?: boolean
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

function UpdateRow({ r }: { r: RevisionEntry }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      {r.authored_by_llm ? (
        <Bot className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent" aria-label="LLM-authored" />
      ) : (
        <GitMerge
          className="w-3.5 h-3.5 mt-0.5 shrink-0 text-status-success"
          aria-label="Human-reviewed"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground line-clamp-1">
          {r.scope_summary || r.change_type.replace(/_/g, ' ')}
        </p>
        <p className="text-xs text-muted-foreground">
          {r.reviewer_display} · {formatDate(r.merge_timestamp)}
        </p>
      </div>
    </div>
  )
}

export function ContentUpdatesFeed({
  domain,
  limit = 5,
  title = 'Recent Updates',
  defaultCollapsed = true,
}: ContentUpdatesFeedProps) {
  const { revisions, isLoading } = useRevisions()

  const entries = useMemo(() => {
    const filtered = domain ? byDomain(revisions, domain) : revisions
    return filtered.slice(0, limit)
  }, [revisions, domain, limit])

  if (isLoading || entries.length === 0) return null

  return (
    <CollapsibleSection
      title={title}
      icon={<History className="w-4 h-4 text-muted-foreground" />}
      defaultOpen={!defaultCollapsed}
    >
      <div className="divide-y divide-border">
        {entries.map((r, i) => (
          <UpdateRow key={`${r.pr_number}-${i}`} r={r} />
        ))}
      </div>
      <a
        href="/revisions"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
      >
        View all revisions <ChevronRight className="w-3 h-3" />
      </a>
    </CollapsibleSection>
  )
}
