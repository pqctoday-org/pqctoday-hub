// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect } from 'react'
import { Link } from 'react-router'
import { CheckCircle2, LayoutDashboard, CalendarClock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFocusTrap } from '@/hooks/useFocusTrap'

/**
 * SimExecWalkthroughComplete — the honest end screen for the Executive Overview
 * walkthrough. It is a TOUR, so it does NOT claim a migration "win" (that ceremony is
 * for the full climb). It confirms the program was seen end to end and points at where
 * to run it for real. No dates, no maturity score.
 */
export function SimExecWalkthroughComplete({
  onClose,
  brief = false,
}: {
  onClose: () => void
  brief?: boolean
}) {
  // 09-28 nav remediation (WP3.5): same modal contract as the rest of the sim —
  // dialog semantics, focus trapped and returned, Escape closes.
  const trapRef = useFocusTrap(true)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      data-testid="exec-walkthrough-complete"
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sim-exec-walkthrough-complete-heading"
        className="relative w-full max-w-lg rounded-xl border border-primary/30 bg-card p-6 shadow-2xl"
      >
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
            <h2
              id="sim-exec-walkthrough-complete-heading"
              className="text-lg font-semibold text-foreground"
            >
              {brief ? 'Executive phone brief complete' : 'You’ve seen the full program'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {brief
                ? 'Chapter summaries and sample-document notices.'
                : 'Executive overview complete — end to end, from mandate to closure.'}
            </p>
          </div>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          {brief && (
            <>You followed the phone brief. Use the desktop overview for full resource pages. </>
          )}
          You’ve explored the migration decisions, from the initial mandate to future verification
          and handover. The worked-example documents are available in your Command Center for
          further practice. Use what you learned to question assumptions, identify the capabilities
          your production tools need, and plan how your team will demonstrate them.
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
              Review requirements
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
