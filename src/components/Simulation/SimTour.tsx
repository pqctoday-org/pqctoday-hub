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
    body: 'Run a post-quantum migration program: race the Mosca clock and climb each of the 9 framework phases — P0–P7 plus Verification & Closure — up the maturity ladder.',
  },
  {
    title: 'Your org comes from your assessment',
    body: 'Industry, size and country are read-only — they’re set by your PQC assessment (change them in /assess). You can switch your seat (role) and the difficulty MODE: Easy, Realistic, or Hard — start on Realistic for your first run.',
  },
  {
    title: 'Race the Mosca clock',
    body: 'X + Y > Z. The KPI ribbon shows years to Q-Day. If your data shelf-life (X) plus migration time (Y) exceeds the time left (Z), you’re already exposed.',
  },
  {
    title: 'Climb the maturity ladder',
    body: 'Each phase has maturity levels 0–4. A level unlocks only once every step below it is done — higher bands stay 🔒 locked. Within the active band you can do the steps in any order.',
  },
  {
    title: 'Pick the right next move',
    body: 'Each step offers a choice: the correct framework activity vs. tempting traps. Right picks earn maturity; a wrong pick reveals the Common Failure AND the sound move, so you learn the difference.',
  },
  {
    title: 'End the quarter — and delegate with care',
    body: 'Advance time with End Quarter; world events can pull Q-Day closer. Phases outside your seat can be run by your AI team (Auto-complete) — fast, but the phase is flagged “unverified” and you’ll be nudged to study what you skipped.',
  },
]

// Novice "Guided" track — plain-language definitions surfaced for a beginner who
// turns Guided mode on. Appended after the standard tour so a fluent player never
// sees them, but a newcomer gets the unfamiliar terms defined at first encounter.
export const GUIDED_DEFS: TourStep[] = [
  {
    title: 'Plain English: Mosca’s inequality',
    body: 'X + Y > Z is a deadline test. X = how long your data must stay secret. Y = how long migrating takes. Z = years left until Q-Day (when a quantum computer could break today’s crypto). If X + Y is bigger than Z, data you send today won’t be safe in time — so start now.',
  },
  {
    title: 'Plain English: HNDL',
    body: 'Harvest-Now, Decrypt-Later. An attacker copies your encrypted traffic today and stores it, waiting for a quantum computer to decrypt it years later. Long-lived secrets (health, financial, government) are most at risk — which is why data shelf-life (X) drives the clock.',
  },
  {
    title: 'Plain English: hybrid vs pure',
    body: 'Hybrid = classical + post-quantum together, so you stay safe even if one is broken (reversible — what most regulators want now). Pure = post-quantum only, the eventual end state. Which is correct depends on your jurisdiction’s stance.',
  },
  {
    title: 'Plain English: TNFL',
    body: 'Trust Now, Forge Later — the signature counterpart to HNDL. An attacker doesn’t need to steal anything today, just wait: once a quantum computer can break today’s signing algorithms, anything signed now — firmware, certificates, legal documents — becomes forgeable after the fact. HNDL threatens secrecy; TNFL threatens trust. You may also see this called HNFL (Harvest-Now-Forge-Later) in Learn content — same risk, same math, different name.',
  },
  {
    title: 'Plain English: program governance roles',
    body: 'SteerCo (Steering Committee) = the cross-functional group that signs off at each gate. PMO (Program Management Office) = the team running the day-to-day schedule, budget and risk tracking. RACI = a chart naming who’s Responsible, Accountable, Consulted and Informed for each task, so decisions don’t stall on "I thought someone else owned that." QRPM and Executive Sponsor — the other names you’ll see on gate labels — are specific roles in this same structure: QRPM runs the program day to day, the Executive Sponsor owns it at board level.',
  },
]

export function SimTour({
  guided,
  onEnableGuided,
  onClose,
}: {
  guided: boolean
  onEnableGuided: () => void
  onClose: () => void
}) {
  const steps = guided ? [...TOUR_STEPS, ...GUIDED_DEFS] : TOUR_STEPS
  const [i, setI] = useState(0)
  const idx = Math.min(i, steps.length - 1)
  const step = steps[idx]
  const last = idx === steps.length - 1
  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Simulation guide"
    >
      <div className="w-[460px] max-w-[92vw] rounded-2xl border border-border bg-card p-5">
        <div className="font-mono text-sim-micro font-bold uppercase tracking-[0.16em] text-primary">
          Guide · {idx + 1}/{steps.length}
        </div>
        <h2 className="mt-1 text-[18px] font-extrabold text-foreground">{step.title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{step.body}</p>
        {!guided && idx === 0 && (
          <Button
            type="button"
            variant="ghost"
            onClick={onEnableGuided}
            className="mt-3 h-auto rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/10"
          >
            New to PQC? Turn on plain-language guidance →
          </Button>
        )}
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
            {idx > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setI(idx - 1)}
                className="h-auto px-3 py-1.5 text-[11px] font-bold text-muted-foreground"
              >
                ← Back
              </Button>
            )}
            <Button
              type="button"
              onClick={() => (last ? onClose() : setI(idx + 1))}
              className="h-auto rounded-lg bg-primary px-4 py-2 text-[12px] font-extrabold text-background"
            >
              {last ? 'Start playing' : 'Next →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
