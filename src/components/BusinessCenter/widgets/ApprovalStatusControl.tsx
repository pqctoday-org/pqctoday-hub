// SPDX-License-Identifier: GPL-3.0-only
/**
 * Inline three-state pill for an artifact's approval status (draft → in-review
 * → approved). Drives `useModuleStore.updateExecutiveDocument` to advance
 * state and (optionally) record a reviewer name.
 *
 * Two render modes:
 *   - `chip` (read-only): renders just the colored badge for a card
 *   - `control` (interactive): renders the badge + an Advance button
 */
import { useState, useCallback } from 'react'
import { Check, Clock, Edit3, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ExecutiveDocumentApprovalStatus } from '@/services/storage/types'

const STATUS_LABEL: Record<ExecutiveDocumentApprovalStatus, string> = {
  draft: 'Draft',
  'in-review': 'In review',
  approved: 'Approved',
}

const STATUS_STYLE: Record<ExecutiveDocumentApprovalStatus, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  'in-review': 'bg-status-warning/15 text-status-warning border-status-warning/30',
  approved: 'bg-status-success/15 text-status-success border-status-success/30',
}

const STATUS_ICON: Record<
  ExecutiveDocumentApprovalStatus,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  draft: Edit3,
  'in-review': Clock,
  approved: Check,
}

const NEXT_STATUS: Record<ExecutiveDocumentApprovalStatus, ExecutiveDocumentApprovalStatus | null> =
  {
    draft: 'in-review',
    'in-review': 'approved',
    approved: null,
  }

export interface ApprovalStatusControlProps {
  status: ExecutiveDocumentApprovalStatus
  reviewer?: string
  approvedAt?: number
  /** When omitted the control is render-only (no advance button). */
  onAdvance?: (next: ExecutiveDocumentApprovalStatus, reviewer?: string) => void
  /** When the user clicks the chip itself, optionally reset to draft. */
  onReset?: () => void
}

export function ApprovalStatusControl({
  status,
  reviewer,
  approvedAt,
  onAdvance,
  onReset,
}: ApprovalStatusControlProps) {
  const [reviewerInput, setReviewerInput] = useState(reviewer ?? '')
  const [editing, setEditing] = useState(false)
  const Icon = STATUS_ICON[status]
  const next = NEXT_STATUS[status]

  const titleParts: string[] = [STATUS_LABEL[status]]
  if (reviewer) titleParts.push(`reviewer: ${reviewer}`)
  if (approvedAt) {
    titleParts.push(`approved ${new Date(approvedAt).toLocaleDateString('en-US')}`)
  }
  const title = titleParts.join(' · ')

  const advance = useCallback(() => {
    if (!onAdvance || !next) return
    onAdvance(next, reviewerInput.trim() || undefined)
    setEditing(false)
  }, [onAdvance, next, reviewerInput])

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${STATUS_STYLE[status]}`}
        title={title}
      >
        <Icon size={11} />
        {STATUS_LABEL[status]}
      </span>
      {reviewer && (
        <span className="text-[10px] text-muted-foreground" title={title}>
          · {reviewer}
        </span>
      )}
      {onAdvance && next && !editing && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-[10px]"
          onClick={() => {
            if (next === 'in-review' || next === 'approved') {
              setEditing(true)
            } else {
              advance()
            }
          }}
        >
          → {STATUS_LABEL[next]} <ChevronRight size={10} />
        </Button>
      )}
      {editing && (
        <span className="inline-flex items-center gap-1">
          <Input
            value={reviewerInput}
            onChange={(e) => setReviewerInput(e.target.value)}
            placeholder="Reviewer name (optional)"
            className="h-6 text-[10px] w-44"
          />
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={advance}>
            Confirm
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </span>
      )}
      {onReset && status !== 'draft' && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-[10px] text-muted-foreground"
          onClick={onReset}
          title="Reset to draft"
        >
          reset
        </Button>
      )}
    </div>
  )
}
