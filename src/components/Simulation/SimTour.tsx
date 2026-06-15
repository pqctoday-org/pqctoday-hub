// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimTour (WS-12) — a skippable, remembered first-run walkthrough. A simple
 * centred guide (not anchored coachmarks) introducing the dials, the Mosca clock,
 * the board, and the End-Quarter loop. Persisted "seen" lives in
 * useSimulationStore.tourSeen; the view renders this only when !tourSeen and
 * calls onClose (markTourSeen) on Skip / Done.
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export interface TourStep {
  title: string
  body: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to Mission Control',
    body: 'Run a post-quantum migration program: race the Mosca clock and climb each of the 8 framework phases up the maturity ladder.',
  },
  {
    title: 'Set up your organisation',
    body: 'The dials along the top pick your industry, size, country, your seat (role), and the difficulty mode. Scenario chips set them all at once.',
  },
  {
    title: 'Race the Mosca clock',
    body: 'X + Y > Z. The KPI ribbon shows years to Q-Day. If your data shelf-life plus migration time exceeds the time left, you are already exposed.',
  },
  {
    title: 'Pick the right next move',
    body: 'Each phase offers a choice: the correct framework activity vs. tempting traps. Right picks earn maturity; wrong ones reveal a Common Failure.',
  },
  {
    title: 'End the quarter',
    body: 'Advance time with End Quarter. Your AI team makes progress on phases you don’t own, and world events can pull Q-Day closer.',
  },
]

export function SimTour({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0)
  const step = TOUR_STEPS[i]
  const last = i === TOUR_STEPS.length - 1
  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Simulation guide"
    >
      <div className="w-[460px] max-w-[92vw] rounded-2xl border border-border bg-card p-5">
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-primary">
          Guide · {i + 1}/{TOUR_STEPS.length}
        </div>
        <h2 className="mt-1 text-[18px] font-extrabold text-foreground">{step.title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{step.body}</p>
        <div className="mt-5 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-auto px-3 py-1.5 text-[11px] font-bold text-muted-foreground"
          >
            Skip
          </Button>
          <div className="flex items-center gap-2">
            {i > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setI(i - 1)}
                className="h-auto px-3 py-1.5 text-[11px] font-bold text-muted-foreground"
              >
                ← Back
              </Button>
            )}
            <Button
              type="button"
              onClick={() => (last ? onClose() : setI(i + 1))}
              className="h-auto rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-[12px] font-extrabold text-background"
            >
              {last ? 'Start playing' : 'Next →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
