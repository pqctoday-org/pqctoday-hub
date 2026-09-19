// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 1.2 (2026-09-19) — the declared exit from an item, from
 * `src/data/nextSteps.ts`. One card, rendered unconditionally at the foot of
 * every routed module, tool and page, so a visitor is never left mid-air and
 * the graders' "next step out" signal is on the page whether or not the item
 * was completed. Renders nothing for a route with no entry.
 */
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { nextStepFor } from '@/data/nextSteps'
import { cn } from '@/lib/utils'

interface NextStepCardProps {
  /** The current item's route, e.g. '/learn/pqc-101' or '/patents'. */
  route: string
  className?: string
}

export function NextStepCard({ route, className }: NextStepCardProps) {
  const step = nextStepFor(route)
  if (!step) return null
  return (
    <section
      aria-label="Next step"
      data-testid="next-step"
      className={cn('rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5', className)}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Next step
      </p>
      <Link
        to={step.to}
        className="mt-1.5 inline-flex items-center gap-2 text-base font-semibold text-foreground hover:text-primary"
      >
        <span>{step.label}</span>
        <ArrowRight size={16} className="shrink-0 text-primary" aria-hidden="true" />
      </Link>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.why}</p>
    </section>
  )
}
