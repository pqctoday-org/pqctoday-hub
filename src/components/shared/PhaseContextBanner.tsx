// SPDX-License-Identifier: GPL-3.0-only
/**
 * PhaseContextBanner — a compact "you arrived from the Migration Program rail"
 * acknowledgement. When a `?phase=<id>` param is present it shows which phase
 * the user navigated to (number, name, tagline, gate) plus a Clear affordance
 * that removes only the phase param. Returns null otherwise, so pages behave
 * exactly as before when no phase is active.
 *
 * Drop this near the top of any page that participates in the phase journey but
 * doesn't have its own richer phase treatment (Migrate, Timeline, Compliance,
 * Learn). The three anchor pages (Assess, Report, Command Center) render their
 * own phase UI via `usePhaseFilter`.
 */
import { useLocation, useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button } from '../ui/button'
import { FRAMEWORK_PHASES, PHASE_ORDER, type PhaseId } from '../../data/frameworkPhases'

/** Routes that render their own richer phase UI via `usePhaseFilter` — the
 *  shared banner stays out of their way. */
const SELF_HANDLED_ROUTES = ['/assess', '/report', '/business']

export function PhaseContextBanner() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { pathname } = useLocation()
  const raw = searchParams.get('phase')
  const phaseId = raw && PHASE_ORDER.includes(raw as PhaseId) ? (raw as PhaseId) : null
  if (!phaseId || SELF_HANDLED_ROUTES.includes(pathname)) return null

  const phase = FRAMEWORK_PHASES[phaseId]
  const heading = phase.number === null ? 'Foundations' : `Phase ${phase.number}`

  const clear = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('phase')
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
      <div className="min-w-0 text-sm">
        <span className="font-semibold text-primary">
          {heading} — {phase.name}
        </span>
        <span className="ml-2 text-muted-foreground">{phase.tagline}</span>
        {phase.gate && (
          <span className="ml-2 hidden text-xs text-muted-foreground md:inline">
            · {phase.gate.id}: {phase.gate.criterion}
          </span>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={clear}
        aria-label="Clear phase context"
        title="Clear phase context"
        className="h-7 shrink-0 gap-1 px-2 text-xs"
      >
        <X size={14} aria-hidden="true" />
        Clear
      </Button>
    </div>
  )
}
