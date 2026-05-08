// SPDX-License-Identifier: GPL-3.0-only
import { CheckCircle, Circle } from 'lucide-react'
import { useRevisions, byRecord, type RevisionEntry } from '@/hooks/useRevisions'
import { Button } from '@/components/ui/button'

interface ReviewedBadgeProps {
  /** Any revision domain: 'module' | 'tool' for content; 'library' | 'compliance' | 'migrate' | 'threats' | 'algorithms' for data records */
  domain: string
  /** Entity or record ID (moduleId, pt_id, referenceId, threatId, softwareName, etc.) */
  entityId: string
  /** When false, renders nothing if no revision found. Default true (shows "Unreviewed"). */
  showUnreviewed?: boolean
  className?: string
  /** When provided, badge is clickable and calls this handler */
  onOpenDrilldown?: () => void
}

function formatMonth(isoTimestamp: string): string {
  try {
    const d = new Date(isoTimestamp)
    return d.toLocaleString('en-US', { month: 'short', year: 'numeric' })
  } catch {
    return isoTimestamp.slice(0, 7)
  }
}

export function ReviewedBadge({
  domain,
  entityId,
  showUnreviewed = true,
  className = '',
  onOpenDrilldown,
}: ReviewedBadgeProps) {
  const { revisions, isLoading } = useRevisions()

  if (isLoading) return null

  const matches: RevisionEntry[] = byRecord(revisions, domain, entityId)
  const latest = matches.length > 0 ? matches[0] : null

  if (!latest) {
    if (!showUnreviewed) return null
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

  const offlineSuffix =
    latest.approval_method === 'offline' && latest.approved_via
      ? ` · via ${latest.approved_via}`
      : ''
  const llmPrefix = latest.authored_by_llm ? 'LLM · ' : ''
  const title = `Reviewed by ${latest.reviewer_display} via ${latest.approval_method}${offlineSuffix}`

  const inner = (
    <>
      <CheckCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
      {llmPrefix}
      {latest.reviewer_display} · {formatMonth(latest.merge_timestamp)}
      {offlineSuffix}
    </>
  )

  if (onOpenDrilldown) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`inline-flex items-center gap-1 h-auto p-0 text-xs text-status-success cursor-pointer hover:opacity-80 ${className}`}
        title={title}
        onClick={onOpenDrilldown}
      >
        {inner}
      </Button>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs text-status-success ${className}`}
      title={title}
    >
      {inner}
    </span>
  )
}
