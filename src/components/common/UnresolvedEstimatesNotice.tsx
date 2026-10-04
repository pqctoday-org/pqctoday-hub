// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

/** What this page does where credible sources differ. Say only what the page really does. */
export const UNRESOLVED_ESTIMATES_DETAIL = {
  /** The page lists each source (with the years it gives) behind a Sources control. */
  sourcesListed:
    'Where credible sources differ, the Sources list on this page shows each one with the years it gives, so you can see where they disagree.',
  /** The page shows a planning range (optimistic to pessimistic) and does not list sources. */
  aRange:
    'Where credible sources differ, the range shown here is a planning range, not a settled answer.',
  /** FAQ answers that quote a year or a qubit count. */
  faq: 'Any year or qubit count in these answers is one published estimate, not a settled answer.',
  /** The simulation's Q-Day year, which is an input to the exercise. */
  simulation:
    'The Q-Day year used here is a planning assumption for the simulation, not a settled answer.',
  /** Learn exercises where the reader sets, or is given, a CRQC year or qubit count. */
  workshopExample:
    'The years and qubit counts in this exercise are example figures for practice, not forecasts and not settled answers.',
  /**
   * The page shows each unresolved claim as a claim card, with its sources and dates, and marks
   * the question as open. Use ONLY on a page that really renders those cards (ClaimCard).
   */
  claimsShown:
    'Where credible sources differ, we show each one with its source and date, and say that the question is open, rather than pick a single answer.',
  /** The page quotes one planning figure and does not list the sources itself. */
  oneFigure:
    'Where credible sources differ, the figure shown here is one planning estimate, not a settled answer.',
} as const

export const UNRESOLVED_ESTIMATES_LEAD =
  'Some published estimates are still unresolved, because they depend on technical assumptions and on machines that do not exist yet.'

/**
 * Interim notice (4.149.0) for every surface that quotes a quantum-computer estimate or a
 * Q-Day date: today there are still unknown and conflicting claims. `detail` says only what the
 * page does, so pick the variant that is true there. Only `claimsShown` speaks of a per-claim
 * "open question" mark, because only a page that renders claim cards (ClaimCard) has one.
 */
export const UnresolvedEstimatesNotice: React.FC<{
  detail: keyof typeof UNRESOLVED_ESTIMATES_DETAIL
  className?: string
}> = ({ detail, className }) => (
  <aside
    role="note"
    data-testid="unresolved-estimates-notice"
    className={cn(
      'flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground',
      className
    )}
  >
    <Info size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
    <p>
      <span className="font-semibold text-foreground">Estimates are still open.</span>{' '}
      {UNRESOLVED_ESTIMATES_LEAD} {UNRESOLVED_ESTIMATES_DETAIL[detail]}
    </p>
  </aside>
)
