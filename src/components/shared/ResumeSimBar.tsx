// SPDX-License-Identifier: GPL-3.0-only
/**
 * ResumeSimBar — an in-app "return to the simulation" banner shown on hub pages
 * the player opened FROM the PQC Today Sim (a reference look-up, or any resource
 * that navigates away). The sim sets a `sim:resume` sessionStorage flag on those
 * outbound clicks; SimulationView clears it on mount. This is the PWA-safe return
 * path — installed/standalone apps have no browser Back button.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const FLAG = 'sim:resume'

export function ResumeSimBar() {
  const [show, setShow] = useState(() => {
    try {
      return sessionStorage.getItem(FLAG) === '1'
    } catch {
      return false
    }
  })
  if (!show) return null
  const dismiss = () => {
    try {
      sessionStorage.removeItem(FLAG)
    } catch {
      /* ignore */
    }
    setShow(false)
  }
  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2">
      <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
        ▸ Simulation in progress
      </span>
      <span className="min-w-0 flex-1 truncate text-[12.5px] text-foreground">
        You opened this from the PQC Today Sim.
      </span>
      <Link
        to="/simulation"
        className="shrink-0 rounded-md bg-primary px-3 py-1 text-[12px] font-bold text-primary-foreground"
      >
        ← Resume Simulation
      </Link>
      <Button
        variant="ghost"
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="h-auto shrink-0 px-1 py-0 text-muted-foreground hover:bg-transparent"
      >
        ✕
      </Button>
    </div>
  )
}
