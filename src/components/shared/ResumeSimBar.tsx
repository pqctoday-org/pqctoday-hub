// SPDX-License-Identifier: GPL-3.0-only
/**
 * ResumeSimBar — a sim-branded header strip shown on hub pages while a PQC Today
 * Sim run is in progress. The player reaches hub resources from inside the sim
 * (a reference look-up, an assessment, a workshop — anything that navigates out
 * of the full-screen console); this strip keeps the simulation's identity and a
 * one-click way back visible the whole time, so the sim context is never lost.
 *
 * Visibility is driven by TWO signals so it can't fall through the cracks:
 *   1. `sim:resume` sessionStorage flag — set on known outbound clicks
 *      (`markSimResume`), the PWA-safe return path (no browser Back in
 *      installed/standalone apps).
 *   2. An ACTIVE RUN detected from the persisted sim store — any progress the
 *      player has made. This covers every outbound navigation, including ones
 *      that never set the flag, which is why the header used to disappear.
 *
 * The strip hides only on an explicit dismiss (per session) and never renders on
 * the full-screen `/simulation` console itself (that route lives outside this
 * layout and has its own header).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useSimulationStore } from '@/store/useSimulationStore'
import { hasSimExited } from '@/components/Simulation/simChrome'
import pqctodayLogo from '@/assets/pqctoday-logo.png'

const FLAG = 'sim:resume'
const DISMISSED = 'sim:resume:dismissed'

/** True once the player has done anything in a run — the robust "in progress"
 *  signal. Every field here is mutated only by a player action, so a brand-new
 *  store reads false (no false positives). */
function useHasActiveRun(): boolean {
  return useSimulationStore((s) => {
    if (s.runCompleteSeen) return true
    if (Object.keys(s.edgeDecisions).length > 0) return true
    return (
      s.visitedRefs.length > 0 ||
      s.visitedWorkshops.length > 0 ||
      s.visitedScenarios.length > 0 ||
      s.picks.length > 0 ||
      s.catalogCompleted.length > 0
    )
  })
}

export function ResumeSimBar() {
  const hasActiveRun = useHasActiveRun()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISSED) === '1'
    } catch {
      return false
    }
  })

  let flagged = false
  try {
    flagged = sessionStorage.getItem(FLAG) === '1'
  } catch {
    /* ignore */
  }

  // The player quit the sim via the "← HUB" button — they chose to leave, so the
  // resume header stays hidden until they re-open the sim from the top nav.
  if (hasSimExited()) return null
  if (dismissed || (!flagged && !hasActiveRun)) return null

  const dismiss = () => {
    try {
      sessionStorage.removeItem(FLAG)
      sessionStorage.setItem(DISMISSED, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div
      className="sticky top-0 z-[60] flex items-center gap-3 bg-foreground px-4 py-2 text-background shadow-md print:hidden"
      role="region"
      aria-label="Simulation in progress"
    >
      <img
        src={pqctodayLogo}
        alt=""
        aria-hidden="true"
        className="h-8 w-8 shrink-0 rounded-md object-contain"
      />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="whitespace-nowrap text-[12.5px] font-extrabold">PQC Today Sim</span>
        <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-background/55">
          Simulation in progress
        </span>
      </div>
      <span className="hidden min-w-0 flex-1 truncate text-[12.5px] text-background/70 sm:block">
        You're viewing a hub resource from inside the simulation.
      </span>
      <Link
        to="/simulation"
        className="ml-auto shrink-0 rounded-md bg-background px-3 py-1.5 text-[12px] font-extrabold text-foreground hover:opacity-90 sm:ml-0"
      >
        ← Resume Simulation
      </Link>
      <Button
        variant="ghost"
        type="button"
        onClick={dismiss}
        aria-label="Dismiss simulation header"
        className="h-auto shrink-0 px-1 py-0 text-background/70 hover:bg-background/10 hover:text-background"
      >
        ✕
      </Button>
    </div>
  )
}
