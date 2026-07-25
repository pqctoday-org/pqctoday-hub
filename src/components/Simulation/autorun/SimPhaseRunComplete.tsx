// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router'
import { CheckCircle2, LayoutDashboard, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PhaseFocus } from './useSimAutoRunPlayer'

/**
 * SimPhaseRunComplete — the end screen for a single-phase "Play This Phase" run.
 * Scoped honestly to the one phase played: no whole-program claim (that's the
 * walkthrough's screen) and no maturity/date "win" (that's the climb's ceremony).
 * Copy is sourced straight from `phaseFocus` — the same framework-anchored text the
 * run's persistent banner and first-encounter modal already show.
 */
export function SimPhaseRunComplete({
  phaseFocus,
  onClose,
}: {
  phaseFocus: PhaseFocus | null
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      data-testid="phase-run-complete"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-primary/30 bg-card p-6 shadow-2xl">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-2 top-2 h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X size={18} />
        </Button>
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <CheckCircle2 className="text-primary" size={24} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {phaseFocus?.name ?? 'Phase'} complete
            </h2>
            <p className="text-xs text-muted-foreground">You’ve seen this phase end to end.</p>
          </div>
        </div>
        {phaseFocus?.summary && (
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{phaseFocus.summary}</p>
        )}
        {phaseFocus?.gate && (
          <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Exit gate met:</span> {phaseFocus.gate}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Link to="/business" onClick={onClose}>
            <Button variant="gradient" size="sm" className="gap-1.5">
              <LayoutDashboard size={14} aria-hidden="true" />
              Open the Command Center
            </Button>
          </Link>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
