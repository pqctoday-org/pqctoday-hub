// SPDX-License-Identifier: GPL-3.0-only
import { CheckCircle, Circle } from 'lucide-react'
import { useRevisions, type RevisionEntry } from '@/hooks/useRevisions'

interface ReviewedBadgeProps {
  domain: 'module' | 'tool'
  /** moduleId for modules, pt_id for tools */
  entityId: string
  className?: string
}

function formatMonth(isoTimestamp: string): string {
  try {
    const d = new Date(isoTimestamp)
    return d.toLocaleString('en-US', { month: 'short', year: 'numeric' })
  } catch {
    return isoTimestamp.slice(0, 7)
  }
}

function findLatestEntry(
  revisions: RevisionEntry[],
  domain: 'module' | 'tool',
  entityId: string
): RevisionEntry | null {
  const matches = revisions.filter(
    (r) => r.domain === domain && (r.module_id === entityId || r.tool_id === entityId)
  )
  return matches.length > 0 ? matches[0] : null // already sorted descending
}

export function ReviewedBadge({ domain, entityId, className = '' }: ReviewedBadgeProps) {
  const { revisions, isLoading } = useRevisions()

  if (isLoading) return null

  const latest = findLatestEntry(revisions, domain, entityId)

  if (!latest) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs text-muted-foreground ${className}`}
        title="No review on record"
      >
        <Circle className="w-3 h-3 shrink-0" aria-hidden="true" />
        Unreviewed
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs text-status-success ${className}`}
      title={`Reviewed by ${latest.reviewer_display} via ${latest.approval_method}`}
    >
      <CheckCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
      {latest.reviewer_display} · {formatMonth(latest.merge_timestamp)}
    </span>
  )
}
