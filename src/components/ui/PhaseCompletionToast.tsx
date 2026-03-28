// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, X, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useJourneyMap } from '@/hooks/useJourneyMap'

/**
 * Watches journey map phases and shows a brief toast when a learning phase
 * transitions to 'completed'. Provides a link to the next phase or milestone.
 */
export function PhaseCompletionToast() {
  const { phases, hasPersona } = useJourneyMap()
  const prevCompletedRef = useRef<Set<string>>(new Set())
  const [toast, setToast] = useState<{ label: string; nextLabel?: string; nextRoute?: string } | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Detect newly completed phases
  useEffect(() => {
    if (!hasPersona) return

    const currentCompleted = new Set(
      phases.filter((p) => p.type === 'learning' && p.status === 'completed').map((p) => p.id)
    )

    // On first mount, just record current state without showing toasts
    if (prevCompletedRef.current.size === 0 && currentCompleted.size > 0) {
      prevCompletedRef.current = currentCompleted
      return
    }

    // Find newly completed phases
    for (const id of currentCompleted) {
      if (!prevCompletedRef.current.has(id)) {
        const phase = phases.find((p) => p.id === id)
        if (!phase) continue

        // Find the next phase after this one
        const phaseIdx = phases.indexOf(phase)
        const nextPhase = phases[phaseIdx + 1]

        setToast({
          label: phase.label,
          nextLabel: nextPhase?.label,
          nextRoute:
            nextPhase?.type === 'milestone'
              ? nextPhase.items[0]?.route
              : nextPhase?.items[0]?.route,
        })
        setIsVisible(true)
        break // Only show one at a time
      }
    }

    prevCompletedRef.current = currentCompleted
  }, [phases, hasPersona])

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!isVisible) return
    const timer = setTimeout(() => setIsVisible(false), 6000)
    return () => clearTimeout(timer)
  }, [isVisible])

  const handleDismiss = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => setToast(null), 300)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && toast && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 z-[90] max-w-sm glass-panel border border-primary/30 p-4 shadow-lg"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>

          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-full bg-status-success/20 shrink-0">
              <CheckCircle size={16} className="text-status-success" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Phase Complete!</p>
              <p className="text-xs text-muted-foreground mt-0.5">{toast.label}</p>
              {toast.nextLabel && toast.nextRoute && (
                <Link
                  to={toast.nextRoute}
                  onClick={handleDismiss}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-2"
                >
                  Next: {toast.nextLabel}
                  <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
