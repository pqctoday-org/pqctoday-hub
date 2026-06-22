// SPDX-License-Identifier: GPL-3.0-only
/**
 * ModuleCompletionCard (A4) — the consistent "you finished!" moment.
 *
 * A centered card that gently scales in over a dimmed backdrop when a learner
 * completes a whole MODULE (variant 'module') or a whole Journey (variant
 * 'path', rendered larger). It surfaces what the learner already earns — their
 * belt + awareness score and progress to the next belt — plus journey progress
 * and a "next module" CTA, so the achievement that today is silent gets a real
 * beat. Wired through the shell so every module gets it for free.
 *
 * Presentational + props-driven (the watcher feeds it live data) so it's easy to
 * test. Reduced-motion safe: with prefers-reduced-motion the scale-in is dropped
 * and the card simply appears. Accessible: role="dialog" + aria-modal, labelled,
 * Escape closes, and focus moves to the primary action on open.
 */
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Trophy, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ModuleCompletionCardProps {
  /** 'path' renders a larger, more emphatic card for finishing a whole Journey. */
  variant?: 'module' | 'path'
  /** Module title, or the Journey/persona name for the path variant. */
  title: string
  /** The learner's current belt (name + colours from BELT_RANKS). */
  belt: { name: string; color: string; textColor: string }
  /** Current awareness score. */
  score: number
  /** The next belt up, if any. */
  nextBelt?: { name: string } | null
  /** Points still needed to reach nextBelt. */
  pointsToNextBelt: number
  /** Journey progress to show as "done / total modules", if known. */
  progress?: { done: number; total: number } | null
  /** Label for the next module CTA (omitted → CTA hidden). */
  nextLabel?: string | null
  /** Invoked when the learner takes the next-module CTA. */
  onNext?: () => void
  /** Close / dismiss the card. */
  onClose: () => void
}

export function ModuleCompletionCard({
  variant = 'module',
  title,
  belt,
  score,
  nextBelt,
  pointsToNextBelt,
  progress,
  nextLabel,
  onNext,
  onClose,
}: ModuleCompletionCardProps) {
  const reduce = useReducedMotion()
  const primaryRef = useRef<HTMLButtonElement>(null)
  const isPath = variant === 'path'

  // Escape to dismiss + move focus to the primary action on open (a11y).
  useEffect(() => {
    primaryRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const pct =
    progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

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
          aria-label={isPath ? 'Journey complete' : 'Module complete'}
          onClick={(e) => e.stopPropagation()}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          transition={{ duration: reduce ? 0 : 0.22, ease: 'easeOut' }}
          className={`glass-panel relative w-full rounded-2xl border-2 border-primary/40 p-6 text-center shadow-xl ${
            isPath ? 'max-w-md sm:p-8' : 'max-w-sm'
          }`}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            aria-label="Dismiss"
            className="absolute right-2 top-2 h-auto p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </Button>

          <div
            className="mx-auto mb-3 flex items-center justify-center rounded-full"
            style={{
              width: isPath ? 64 : 52,
              height: isPath ? 64 : 52,
              background: belt.color,
              color: belt.textColor,
            }}
          >
            <Trophy size={isPath ? 30 : 24} aria-hidden="true" />
          </div>

          <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            {isPath ? 'Journey complete' : 'Module complete'}
          </div>
          <h2 className={`mb-3 font-bold text-foreground ${isPath ? 'text-xl' : 'text-lg'}`}>
            {title}
          </h2>

          <div className="mb-3 flex items-center justify-center gap-2 text-sm">
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{ background: belt.color, color: belt.textColor }}
            >
              {belt.name}
            </span>
            <span className="font-semibold text-foreground">{score} pts</span>
          </div>

          {nextBelt && pointsToNextBelt > 0 && (
            <p className="mb-3 text-xs text-muted-foreground">
              {pointsToNextBelt} pts to {nextBelt.name}
            </p>
          )}

          {progress && progress.total > 0 && (
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Journey progress</span>
                <span className="tabular-nums">
                  {progress.done}/{progress.total}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {nextLabel && onNext ? (
            <Button
              ref={primaryRef}
              type="button"
              variant="gradient"
              onClick={onNext}
              className="flex w-full items-center justify-center gap-1.5"
            >
              Next: {nextLabel}
              <ArrowRight size={15} />
            </Button>
          ) : (
            <Button
              ref={primaryRef}
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              Keep going
            </Button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
