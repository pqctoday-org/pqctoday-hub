// SPDX-License-Identifier: GPL-3.0-only
/**
 * EstimateNote — "Our estimate" beside a block of figures the site models
 * itself (cost bands, staffing sizes, latency budgets, sizing ratios) rather
 * than quotes from a standard or a report.
 *
 * Round 9, wave 4 (2026-09-19): the accuracy record checks every figure a
 * learner sees against the Library documents the item cites. 132 figures on
 * 42 items are the site's own arithmetic or judgement; no document states
 * them and none should. This note says so once per block, naming what is
 * modelled, the way roiBaselines' IBM_BASELINE_UNVERIFIED_NOTE already does
 * for the breach baselines. Same shape on the phone: the component has no
 * desktop-only import, so the Mobile tree may use it directly.
 */
import { Calculator } from 'lucide-react'

interface EstimateNoteProps {
  /** What the figures in this block model — one clause, no trailing period needed. */
  what: string
  /** Optional: the inputs or the reasoning behind the numbers, one sentence. */
  basis?: string
  className?: string
}

export function EstimateNote({ what, basis, className = '' }: EstimateNoteProps) {
  return (
    <p
      className={`flex items-start gap-1.5 text-xs text-muted-foreground ${className}`}
      data-testid="estimate-note"
    >
      <Calculator className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-warning" aria-hidden="true" />
      <span>
        <span className="font-medium text-foreground">Our estimate</span> — {what}
        {basis ? ` ${basis}` : ''} These figures are this site&rsquo;s own modelling, not a value
        quoted from a standard or report.
      </span>
    </p>
  )
}
