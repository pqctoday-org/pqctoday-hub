// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimConfirmDialog — styled, focus-managed confirm for destructive run actions
 * (Reset run / Start over), replacing the native `window.confirm` those used.
 * role="alertdialog" (not "dialog") since this interrupts to demand a decision
 * on a destructive action, matching SimRunComplete's a11y pattern (focus to a
 * primary action, Escape dismisses — here Escape cancels, the safe default).
 * Uses motion.div (as SimRunComplete does) for the backdrop/panel — the linter
 * doesn't treat it as a native, non-interactive HTML element, so the
 * click-to-dismiss-on-backdrop pattern doesn't need a synthetic button role.
 */
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export interface SimConfirmDialogProps {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function SimConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: SimConfirmDialogProps) {
  const reduce = useReducedMotion()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="sim-confirm-title"
          aria-describedby="sim-confirm-description"
          onClick={(e) => e.stopPropagation()}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          transition={{ duration: reduce ? 0 : 0.16, ease: 'easeOut' }}
          className="w-full max-w-sm rounded-2xl border-2 border-status-error/40 bg-card p-5 shadow-2xl"
        >
          <h2 id="sim-confirm-title" className="text-base font-bold text-foreground">
            {title}
          </h2>
          <p id="sim-confirm-description" className="mt-2 text-[13px] text-muted-foreground">
            {description}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button ref={cancelRef} type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
