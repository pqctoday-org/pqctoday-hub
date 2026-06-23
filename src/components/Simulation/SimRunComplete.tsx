// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimRunComplete — the run-end ceremony. Fires once every lifecycle phase reaches its top
 * band (the migration is complete, not merely declared). It celebrates the THREE objectives
 * the program was scored on — governance in place, critical assets protected, migration
 * completed — and the maturity reached, rather than the old static Mosca "beat Q-Day" verdict
 * (which was unwinnable for most orgs). Presentational + props-driven; reduced-motion safe;
 * accessible (role=dialog, Escape closes, focus to the primary action).
 */
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Trophy, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface SimRunCompleteObjective {
  id: string
  label: string
  byYear: number
  done: boolean
}

export interface SimRunCompleteProps {
  /** The three program objectives + whether each was met. */
  objectives: SimRunCompleteObjective[]
  /** Program maturity reached (0–4). */
  maturity: number
  /** The program horizon year (operate/govern through here). */
  programEndYear: number
  onClose: () => void
}

export function SimRunComplete({
  objectives,
  maturity,
  programEndYear,
  onClose,
}: SimRunCompleteProps) {
  const reduce = useReducedMotion()
  const primaryRef = useRef<HTMLButtonElement>(null)
  const allMet = objectives.length > 0 && objectives.every((o) => o.done)

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
          className="glass-panel relative w-full max-w-md rounded-2xl border-2 border-primary/40 p-6 text-center shadow-xl sm:p-8"
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

          <div className="mb-4 space-y-1.5 text-left">
            {objectives.map((o) => (
              <div
                key={o.id}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                  o.done ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}
              >
                <ShieldCheck size={16} aria-hidden="true" />
                <span className="flex-1 text-foreground">{o.label}</span>
                <span className="font-mono text-xs">
                  {o.done ? '✓' : '—'} by {o.byYear}
                </span>
              </div>
            ))}
          </div>

          <p className="mb-4 text-xs text-muted-foreground">
            {allMet
              ? `Critical assets protected and the migration completed on the program timeline — operating at full maturity through ${programEndYear}.`
              : 'Program complete — some objectives finished behind their target dates.'}
          </p>

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
