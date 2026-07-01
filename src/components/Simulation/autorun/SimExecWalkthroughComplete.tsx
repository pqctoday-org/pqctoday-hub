// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router-dom'
import { CheckCircle2, LayoutDashboard, CalendarClock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * SimExecWalkthroughComplete — the honest end screen for the Executive Overview
 * walkthrough. It is a TOUR, so it does NOT claim a migration "win" (that ceremony is
 * for the full climb). It confirms the program was seen end to end and points at where
 * to run it for real. No dates, no maturity score.
 */
export function SimExecWalkthroughComplete({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      data-testid="exec-walkthrough-complete"
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
            <h2 className="text-lg font-semibold text-foreground">You’ve seen the full program</h2>
            <p className="text-xs text-muted-foreground">
              Executive overview complete — end to end, from mandate to closure.
            </p>
          </div>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          That’s the whole post-quantum migration: securing sign-off and budget, finding and
          prioritising your cryptography, building the roadmap, and verifying it’s done. The board
          documents you saw generated are waiting in your Command Center. Here’s where you run it
          for real.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/business" onClick={onClose}>
            <Button variant="gradient" size="sm" className="gap-1.5">
              <LayoutDashboard size={14} aria-hidden="true" />
              Open the Command Center
            </Button>
          </Link>
          <Link to="/compliance" onClick={onClose}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <CalendarClock size={14} aria-hidden="true" />
              See your deadlines
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
