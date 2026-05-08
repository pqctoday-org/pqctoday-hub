// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef } from 'react'
import { X, GitMerge, Bot, UserCheck } from 'lucide-react'
import { byRecord, type RevisionEntry } from '@/hooks/useRevisions'
import { Button } from '@/components/ui/button'

interface RevisionDrilldownPanelProps {
  domain: string
  entityId: string
  entityLabel: string
  revisions: RevisionEntry[]
  onClose: () => void
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

function ChangeTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    data_update: 'bg-status-info/10 text-status-info',
    content_review: 'bg-status-success/10 text-status-success',
    schema_change: 'bg-status-warning/10 text-status-warning',
    enrichment: 'bg-accent/10 text-accent',
  }
  const cls = colors[type] ?? 'bg-muted text-muted-foreground'
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${cls}`}>
      {type.replace(/_/g, ' ')}
    </span>
  )
}

function RevisionRow({ r }: { r: RevisionEntry }) {
  const offlineSuffix =
    r.approval_method === 'offline' && r.approved_via ? ` via ${r.approved_via}` : ''

  return (
    <div className="py-2.5 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {r.authored_by_llm ? (
            <Bot className="w-3.5 h-3.5 shrink-0 text-accent" aria-label="LLM-authored" />
          ) : (
            <UserCheck
              className="w-3.5 h-3.5 shrink-0 text-status-success"
              aria-label="Human-reviewed"
            />
          )}
          <span className="text-sm text-foreground truncate">{r.reviewer_display}</span>
          {offlineSuffix && (
            <span className="text-xs text-muted-foreground shrink-0">{offlineSuffix}</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatDate(r.merge_timestamp)}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1 ml-5">
        <ChangeTypeBadge type={r.change_type} />
        <a
          href={`https://github.com/pqctoday-org/pqctoday-hub/pull/${r.pr_number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
        >
          <GitMerge className="w-3 h-3" />#{r.pr_number}
        </a>
        {r.rows_affected !== null && (
          <span className="text-xs text-muted-foreground">{r.rows_affected} rows</span>
        )}
        {r.confidence_delta !== null && r.confidence_delta !== 0 && (
          <span
            className={`text-xs ${r.confidence_delta > 0 ? 'text-status-success' : 'text-status-error'}`}
          >
            {r.confidence_delta > 0 ? '+' : ''}
            {r.confidence_delta} confidence
          </span>
        )}
      </div>
      {r.scope_summary && (
        <p className="text-xs text-muted-foreground ml-5 mt-0.5 line-clamp-2">{r.scope_summary}</p>
      )}
    </div>
  )
}

export function RevisionDrilldownPanel({
  domain,
  entityId,
  entityLabel,
  revisions,
  onClose,
}: RevisionDrilldownPanelProps) {
  const matches = byRecord(revisions, domain, entityId)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Revision history for ${entityLabel}`}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      {/* panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-md bg-card border-l border-border flex flex-col h-full shadow-xl"
      >
        <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground capitalize">{domain} · revision history</p>
            <h2 className="text-sm font-semibold text-foreground truncate">{entityLabel}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
            <X className="w-4 h-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No revision records found.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground pb-2">
                {matches.length} revision{matches.length !== 1 ? 's' : ''} · sorted newest first
              </p>
              {matches.map((r, i) => (
                <RevisionRow key={`${r.pr_number}-${i}`} r={r} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
