// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The fixed lines of the UX grammar (handoff 2.5): provenance line, notice line, empty state,
 * expander and data-source line. Each has one form; a page never writes its own.
 */
import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDataSourceLine, formatDate, type DateInput } from '@/lib/format'
import { RoleButton } from './RoleButton'
import { verbLabel } from './verbs'

/* ---------------------------------------------------------------- Provenance line */

export interface ProvenanceLineProps {
  /** A person at PQC Today has reviewed the record. */
  reviewed: boolean
  /** The text was drafted by AI before review. */
  draftedByAi?: boolean
  /** When the record was last verified. Without it the line reads "Not yet reviewed". */
  verified?: DateInput | null
  /** Where the record comes from. */
  sourceHref?: string
  className?: string
}

/** "✓ Reviewed · Drafted by AI · reviewed by PQC Today · verified 11 Aug 2026 · Source ›" */
export function provenanceText(
  p: Pick<ProvenanceLineProps, 'reviewed' | 'draftedByAi' | 'verified'>
): string {
  if (!p.reviewed || p.verified === null || p.verified === undefined) return 'Not yet reviewed'
  const parts = ['✓ Reviewed']
  if (p.draftedByAi) parts.push('Drafted by AI', 'reviewed by PQC Today')
  parts.push(`verified ${formatDate(p.verified, 'day')}`)
  return parts.join(' · ')
}

export function ProvenanceLine({ className, sourceHref, ...p }: ProvenanceLineProps) {
  return (
    <p data-fixed-line="provenance" className={cn('type-small text-muted-foreground', className)}>
      {provenanceText(p)}
      {sourceHref && (
        <>
          {' · '}
          <a href={sourceHref} className="underline underline-offset-2 text-primary-legible">
            {verbLabel('source')}
          </a>
        </>
      )}
    </p>
  )
}

/* ---------------------------------------------------------------- Notice line (part B) */

export interface NoticeLineProps {
  /** What the content could be mistaken for: "legal advice", "a certification". */
  notA: string
  /** Opens the longer explanation. */
  onMore?: () => void
  moreHref?: string
  className?: string
}

/** "About this content: educational — not a [what it could be mistaken for]. More ›" */
export function NoticeLine({ notA, onMore, moreHref, className }: NoticeLineProps) {
  const more = 'More ›'
  return (
    <p data-fixed-line="notice" className={cn('type-small text-muted-foreground', className)}>
      About this content: educational — not {notA}.{' '}
      {moreHref ? (
        <a href={moreHref} className="underline underline-offset-2 text-primary-legible">
          {more}
        </a>
      ) : onMore ? (
        <RoleButton
          emphasis="quiet"
          dense
          onClick={onMore}
          className="min-h-0 px-1 py-0 align-baseline"
        >
          {more}
        </RoleButton>
      ) : null}
    </p>
  )
}

/* ---------------------------------------------------------------- Empty state */

/** Why a thing is missing: not recorded, not reviewed, or it does not apply. */
export type EmptyReason = 'not-recorded' | 'not-reviewed' | 'does-not-apply'

const EMPTY_REASON_TEXT: Record<EmptyReason, string> = {
  'not-recorded': 'Nothing has been recorded for this yet.',
  'not-reviewed': 'It has not been reviewed yet, so it is not shown.',
  'does-not-apply': 'It does not apply here.',
}

export interface EmptyStateProps {
  /** What is missing, plural or singular: "linked records", "threats". */
  thing: string
  reason: EmptyReason
  /** One action: Clear filters, Suggest a record, Add <thing>. */
  action?: { label: string; onClick: () => void }
  className?: string
}

/** "No [thing] yet." + one line on why + one action. */
export function EmptyState({ thing, reason, action, className }: EmptyStateProps) {
  return (
    <div data-fixed-line="empty" className={cn('flex flex-col items-start gap-2 py-4', className)}>
      <p className="type-body font-semibold">No {thing} yet.</p>
      <p className="type-small text-muted-foreground">{EMPTY_REASON_TEXT[reason]}</p>
      {action && (
        <RoleButton emphasis="secondary" onClick={action.onClick}>
          {action.label}
        </RoleButton>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- Expander */

export interface ExpanderProps {
  title: React.ReactNode
  children: React.ReactNode
  /** Closed by default; open by default only in the Learn reader. */
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

/** A chevron-down on the right and the whole row clickable. */
export function Expander({
  title,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  className,
}: ExpanderProps) {
  const [inner, setInner] = React.useState(defaultOpen)
  const isOpen = open ?? inner
  const id = React.useId()
  const toggle = () => {
    const next = !isOpen
    if (open === undefined) setInner(next)
    onOpenChange?.(next)
  }
  return (
    <div data-fixed-line="expander" className={cn('border-b border-border', className)}>
      {/* eslint-disable-next-line no-restricted-syntax -- the whole row is the control, which Button's pill shape cannot be */}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={toggle}
        className="flex w-full min-h-[44px] items-center justify-between gap-3 py-2 text-left type-body font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
      >
        <span>{title}</span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={cn(
            'shrink-0 transition-transform motion-reduce:transition-none',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div id={id} hidden={!isOpen} className="pb-3">
        {children}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Data source line */

export interface DataSourceLineProps {
  name: string
  updated: DateInput | null | undefined
  className?: string
}

/** "Data source: <name> · updated 22 Nov 2026" */
export function DataSourceLine({ name, updated, className }: DataSourceLineProps) {
  return (
    <p data-fixed-line="data-source" className={cn('type-small text-muted-foreground', className)}>
      Data source: {formatDataSourceLine(name, updated)}
    </p>
  )
}
