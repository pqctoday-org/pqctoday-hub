// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimRunComplete (W2b) — the run-end ceremony. Fires once when every lifecycle
 * phase is cleared, tying the whole program back to the Mosca outcome: did the
 * migration finish before Q-Day, or were sensitive assets exposed past it? Until
 * this, clearing the 8th phase produced only another "cleared" chip and no
 * summative reflection (the audit's "the game has no ending" gap).
 *
 * Presentational + props-driven. Reduced-motion safe (scale-in dropped under
 * prefers-reduced-motion). Accessible: role="dialog" + aria-modal, labelled,
 * Escape closes, focus moves to the primary action on open.
 */
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Trophy, ShieldCheck, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface SimRunCompleteProps {
  /** Mosca margin (X+Y − years-to-Q-Day): ≤ 0 beats Q-Day; > 0 = years past it. */
  over: number
  /** The Q-Day horizon year the run was racing. */
  horizonYear: number
  /** Estimated PQC readiness at run end. */
  readinessPct: number
  /** Phases cleared / total lifecycle phases. */
  clearedCount: number
  totalPhases: number
  onClose: () => void
}

export function SimRunComplete({
  over,
  horizonYear,
  readinessPct,
  clearedCount,
  totalPhases,
  onClose,
}: SimRunCompleteProps) {
  const reduce = useReducedMotion()
  const primaryRef = useRef<HTMLButtonElement>(null)
  const beatQDay = over <= 0

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
              background: beatQDay ? 'hsl(var(--success))' : 'hsl(var(--warning))',
            }}
          >
            <Trophy size={30} aria-hidden="true" />
          </div>

          <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            Migration program complete
          </div>
          <h2 className="mb-3 text-xl font-bold text-foreground">
            All {clearedCount} of {totalPhases} phases cleared
          </h2>

          <div
            className={`mb-3 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
              beatQDay ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
            }`}
          >
            {beatQDay ? (
              <ShieldCheck size={18} aria-hidden="true" />
            ) : (
              <ShieldAlert size={18} aria-hidden="true" />
            )}
            <span>
              {beatQDay
                ? `You reached PQC readiness with ${Math.abs(over)}y of margin before Q-Day ${horizonYear}.`
                : `Every phase cleared — but your migration finishes ${over}y past Q-Day ${horizonYear}, so sensitive assets were exposed.`}
            </span>
          </div>

          <p className="mb-4 text-xs text-muted-foreground">Estimated readiness {readinessPct}%.</p>

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
