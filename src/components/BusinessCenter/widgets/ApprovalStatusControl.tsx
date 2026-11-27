// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Inline three-state pill for an artifact's practice state (draft → in-review
 * → approved). These states teach how a document moves through review; they do
 * not record a real review. Drives `useModuleStore.updateExecutiveDocument` to
 * advance state and (optionally) record an example reviewer role.
 *
 * Two render modes:
 *   - `chip` (read-only): renders just the colored badge for a card
 *   - `control` (interactive): renders the badge + an Advance button
 */
import { useState, useCallback } from 'react'
import { Check, Clock, Edit3, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import type { ExecutiveDocumentApprovalStatus } from '@/services/storage/types'
import { EXAMPLE_REVIEWER_ROLES, exampleReviewerRole } from '@/data/exampleReviewerRoles'
import { formatDateStamp } from '@/lib/format'

const PRACTICE_STATE_TIP =
  'Practice states for learning how a document moves through review. They do not record a real review.'

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
  // Only a role on the list is preselected; a name saved earlier is not offered back.
  const [roleChoice, setRoleChoice] = useState(() => {
    const role = exampleReviewerRole(reviewer)
    return role && EXAMPLE_REVIEWER_ROLES.includes(role) ? role : ''
  })
  const [editing, setEditing] = useState(false)
  const Icon = STATUS_ICON[status]
  const next = NEXT_STATUS[status]
  const shownRole = exampleReviewerRole(reviewer)

  const titleParts: string[] = [STATUS_LABEL[status]]
  if (shownRole) titleParts.push(`example reviewer role: ${shownRole}`)
  if (approvedAt) {
    titleParts.push(`approved ${formatDateStamp(approvedAt)}`)
  }
  const title = titleParts.join(' · ')

  const advance = useCallback(() => {
    if (!onAdvance || !next) return
    onAdvance(next, roleChoice || undefined)
    setEditing(false)
  }, [onAdvance, next, roleChoice])

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap" title={PRACTICE_STATE_TIP}>
      <span className="text-[10px] text-muted-foreground">Practice state</span>
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${STATUS_STYLE[status]}`}
        title={title}
      >
        <Icon size={11} />
        {STATUS_LABEL[status]}
      </span>
      {shownRole && (
        <span className="text-[10px] text-muted-foreground" title={title}>
          · {shownRole}
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
          <FilterDropdown
            items={EXAMPLE_REVIEWER_ROLES as string[]}
            selectedId={roleChoice || 'All'}
            onSelect={(id) => setRoleChoice(id === 'All' ? '' : id)}
            defaultLabel="Example reviewer role (optional)"
            ariaLabel="Example reviewer role"
            size="sm"
            noContainer
            className="w-44"
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
