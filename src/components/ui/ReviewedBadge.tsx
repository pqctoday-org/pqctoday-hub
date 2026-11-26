// SPDX-License-Identifier: AGPL-3.0-only
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
  /**
   * Top-bar form: the visible text is "Reviewed · <Mon YYYY>". The full statement (drafted with an
   * AI model or not, who reviewed, the method) stays in the accessible name and the tooltip, and
   * the revision history opened by a click shows it in words.
   */
  compact?: boolean
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
  compact = false,
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
  // "Reviewed" has to appear in the VISIBLE text, not just the tooltip.
  // Previously this state rendered as "LLM · eramusa · May 2026 · via registry
  // review" — a check icon, a name and a date, with the word carrying the whole
  // meaning hidden in `title`. Next to the other state, which says "Unreviewed"
  // outright, the two did not read as the same axis, and a screen-reader user
  // got a bare name with no indication of what it asserted.
  // `authored_by_llm` marks a change an LLM drafted; `reviewer_display` names
  // who approved it. Say "human-reviewed" only when that is a person — some
  // approvals are recorded by an automated agent.
  const automatedReviewer = /agent|automated|claude|codex|gpt|\bbot\b/i.test(
    latest.reviewer_display ?? ''
  )
  const reviewedLabel = !latest.authored_by_llm
    ? 'Reviewed'
    : automatedReviewer
      ? 'LLM-drafted · automated review'
      : 'LLM-drafted · human-reviewed'
  const month = formatMonth(latest.merge_timestamp)
  const fullStatement = `${reviewedLabel} · ${latest.reviewer_display} · ${month}${offlineSuffix}`
  const title = compact
    ? fullStatement
    : `Reviewed by ${latest.reviewer_display} via ${latest.approval_method}${offlineSuffix}`
  // The accessible name starts with the visible words, then carries the whole statement.
  const compactName = `Reviewed · ${month}. ${fullStatement}`

  // The reviewer string is free text and can be long — "claude-agent
  // (automated remediation) · via <run id>" is ~60 chars, which on one
  // unbreakable line is several times the width of a compliance tile. Keep the
  // text in ONE shrinkable child (separate text nodes become separate flex
  // items that will not wrap) and let it break.
  const inner = (
    <>
      <CheckCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span className="min-w-0 break-words">
        {compact ? (
          <>Reviewed · {month}</>
        ) : (
          <>
            {reviewedLabel} · {latest.reviewer_display} · {month}
            {offlineSuffix}
          </>
        )}
      </span>
    </>
  )

  if (onOpenDrilldown) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`inline-flex max-w-full items-center gap-1 h-auto p-0 text-left text-xs text-status-success whitespace-normal cursor-pointer hover:opacity-80 ${className}`}
        title={title}
        aria-label={compact ? compactName : undefined}
        onClick={onOpenDrilldown}
      >
        {inner}
      </Button>
    )
  }

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 text-xs text-status-success ${className}`}
      title={title}
      aria-label={compact ? compactName : undefined}
    >
      {inner}
    </span>
  )
}
