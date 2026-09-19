// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 1.2 (2026-09-19) — phone twin of shared/NextStepCard. The
 * mobile tree may not import desktop components (eslint no-restricted-imports),
 * so this reads the same data module and renders the phone chrome.
 */
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { nextStepFor } from '@/data/nextSteps'

export function MobileNextStepCard({ route }: { route: string }) {
  const step = nextStepFor(route)
  if (!step) return null
  return (
    <section
      aria-label="Next step"
      data-testid="next-step"
      className="rounded-xl border border-primary/30 bg-primary/5 p-3.5"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Next step
      </p>
      <Link
        to={step.to}
        className="mt-1 flex min-h-[44px] items-center gap-2 text-sm font-semibold text-foreground"
      >
        <span className="min-w-0">{step.label}</span>
        <ArrowRight size={16} className="shrink-0 text-primary" aria-hidden="true" />
      </Link>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.why}</p>
    </section>
  )
}
