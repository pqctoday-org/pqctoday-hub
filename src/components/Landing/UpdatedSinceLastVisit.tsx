// SPDX-License-Identifier: GPL-3.0-only
/**
 * B+ round 8 UX fix (2026-09-19): the tracker's revisions fix — "surface
 * 'updated since your last visit' on the landing". One line, only when there
 * is something to say (see useRevisionsSinceLastVisit), linking to the
 * revisions ledger where the row-level detail lives.
 */
import { Link } from 'react-router'
import { GitMerge, ArrowRight } from 'lucide-react'
import { useRevisionsSinceLastVisit } from '@/hooks/useRevisionsSinceLastVisit'

function formatSince(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function UpdatedSinceLastVisit({ className }: { className?: string }) {
  const fresh = useRevisionsSinceLastVisit()
  if (!fresh) return null
  const when = formatSince(fresh.since)
  return (
    <p
      data-testid="updated-since-last-visit"
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground ${className ?? ''}`}
    >
      <GitMerge size={14} className="shrink-0 text-primary" aria-hidden="true" />
      <span>
        <span className="font-semibold text-foreground">
          {fresh.count} reviewed data update{fresh.count === 1 ? '' : 's'}
        </span>{' '}
        since your last visit{when ? ` (${when})` : ''}
        {fresh.domains.length > 0 ? ` — ${fresh.domains.join(', ')}` : ''}
      </span>
      <Link
        to="/revisions"
        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
      >
        See what changed
        <ArrowRight size={12} aria-hidden="true" />
      </Link>
    </p>
  )
}
