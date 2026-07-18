// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimRunComplete — the run-end ceremony. Fires once every lifecycle phase reaches its top
 * band (the migration is complete, not merely declared). It celebrates the THREE objectives
 * the program was scored on — governance in place, critical assets protected, migration
 * completed — and the maturity reached, rather than the old static Mosca "beat Q-Day" verdict
 * (which was unwinnable for most orgs). Presentational + props-driven; reduced-motion safe;
 * accessible (role=dialog, Escape closes, focus to the primary action).
 *
 * Extended (07042026, simulation-mode-improvement-plan W2-4): a completed run used to dead-end
 * at "Back to the board" with no reflection or next step, while the lighter Executive Overview
 * ending offered both. Now the ceremony folds in the trap tally (the Common Failures the player
 * actually fell for, each linking to the lesson that fixes it — the same instrument
 * TrapInsightsPanel surfaces mid-run) and the same next-step links the walkthrough ending gives.
 */
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Trophy, ShieldCheck, LayoutDashboard, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { readTrapTally, remediation, phaseName } from './simTrapTally'
import type { RunScoreBreakdown } from '@/simulation/runScore'

export interface SimRunCompleteObjective {
  id: string
  label: string
  byYear: number
  done: boolean
  /** The year it was actually achieved (for the on-time badge); omit if not recorded. */
  achievedYear?: number
}

export interface SimRunCompleteProps {
  /** The three program objectives + whether each was met. */
  objectives: SimRunCompleteObjective[]
  /** Program maturity reached (0–4). */
  maturity: number
  /** The program horizon year (operate/govern through here). */
  programEndYear: number
  /** WP4.2 — the run's graded breakdown, visible not a black box. Omit to hide
   *  the grade card entirely (e.g. a scenario with no meaningful quarter count). */
  score?: RunScoreBreakdown
  onClose: () => void
}

const GRADE_TONE: Record<RunScoreBreakdown['grade'], string> = {
  A: 'bg-success/15 text-success border-success/30',
  B: 'bg-primary/15 text-primary border-primary/30',
  C: 'bg-warning/15 text-warning border-warning/30',
  D: 'bg-destructive/15 text-destructive border-destructive/30',
}

export function SimRunComplete({
  objectives,
  maturity,
  programEndYear,
  score,
  onClose,
}: SimRunCompleteProps) {
  const reduce = useReducedMotion()
  const primaryRef = useRef<HTMLButtonElement>(null)
  const allMet = objectives.length > 0 && objectives.every((o) => o.done)
  // Top 3 — this is a closing reflection, not the full TrapInsightsPanel dashboard.
  const topTraps = readTrapTally().slice(0, 3)

  useEffect(() => {
    primaryRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Migration program complete"
          onClick={(e) => e.stopPropagation()}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          transition={{ duration: reduce ? 0 : 0.24, ease: 'easeOut' }}
          className="glass-panel relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-primary/40 p-6 text-center shadow-xl sm:p-8"
        >
          <div
            className="mx-auto mb-3 flex items-center justify-center rounded-full text-primary-foreground"
            style={{
              width: 64,
              height: 64,
              background: allMet ? 'hsl(var(--success))' : 'hsl(var(--warning))',
            }}
          >
            <Trophy size={30} aria-hidden="true" />
          </div>

          <div className="mb-1 font-mono text-sim-micro font-bold uppercase tracking-[0.16em] text-primary">
            Migration program complete
          </div>
          <h2 className="mb-3 text-xl font-bold text-foreground">
            Program maturity {Math.round(maturity)} / 4
          </h2>

          {score && (
            <div
              className={`mb-4 rounded-xl border p-3 text-left ${GRADE_TONE[score.grade]}`}
              data-testid="run-grade-card"
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono text-sim-micro font-bold uppercase tracking-wide">
                  Run grade
                </span>
                <span className="text-2xl font-black leading-none">{score.grade}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-foreground/80 sm:grid-cols-4">
                <div>
                  Pace <b>{score.paceScore}</b>
                  <div className="text-[10px] opacity-70">par {score.parQuarters}q</div>
                </div>
                <div>
                  Discipline <b>{score.trapScore}</b>
                </div>
                <div>
                  Compliance <b>{score.complianceScore}</b>
                </div>
                <div>
                  On-time <b>{score.onTimeScore}</b>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4 space-y-1.5 text-left">
            {objectives.map((o) => {
              const onTime = o.done && (o.achievedYear == null || o.achievedYear <= o.byYear)
              return (
                <div
                  key={o.id}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                    onTime ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}
                >
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span className="flex-1 text-foreground">{o.label}</span>
                  <span className="font-mono text-xs">
                    {o.done
                      ? o.achievedYear != null
                        ? `✓ ${o.achievedYear}`
                        : `✓ by ${o.byYear}`
                      : `— by ${o.byYear}`}
                  </span>
                </div>
              )
            })}
          </div>

          <p className="mb-4 text-xs text-muted-foreground">
            {allMet
              ? `Critical assets protected and the migration completed on the program timeline — operating at full maturity through ${programEndYear}.`
              : 'Program complete — some objectives finished behind their target dates.'}
          </p>

          {topTraps.length > 0 && (
            <div className="mb-4 rounded-lg border border-warning/30 bg-warning/5 p-3 text-left">
              <div className="mb-1.5 font-mono text-sim-micro font-bold uppercase tracking-wide text-warning">
                What you&rsquo;d do differently
              </div>
              <ol className="space-y-1">
                {topTraps.map((t, i) => {
                  const rem = remediation(t.phaseId, t.label)
                  return (
                    <li key={`${t.phaseId} ${t.label}`} className="text-[12px] leading-snug">
                      <span className="font-semibold text-foreground">
                        {i + 1}. {t.label}
                      </span>{' '}
                      <span className="text-muted-foreground">
                        ({phaseName(t.phaseId)} · fell for it {t.count}×)
                      </span>
                      {rem && (
                        <>
                          {' — '}
                          <Link
                            to={rem.to}
                            onClick={onClose}
                            className="font-semibold text-primary underline-offset-2 hover:underline"
                          >
                            Learn: {rem.label}
                          </Link>
                        </>
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          )}

          <div className="mb-4 flex flex-wrap justify-center gap-2">
            <Link to="/business" onClick={onClose}>
              <Button variant="outline" size="sm" className="gap-1.5">
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

          <Button
            ref={primaryRef}
            type="button"
            variant="gradient"
            onClick={onClose}
            className="w-full"
          >
            Back to the board
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
