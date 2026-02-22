import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Brain, BookOpen, Zap, Clock } from 'lucide-react'
import { BELT_RANKS } from '@/hooks/useAwarenessScore'

interface ScoringModalProps {
  isOpen: boolean
  onClose: () => void
}

const DIMENSIONS = [
  { icon: Brain, label: 'Knowledge', weight: '40%', detail: 'Quiz score + categories attempted' },
  {
    icon: BookOpen,
    label: 'Breadth',
    weight: '30%',
    detail: 'Module steps completed across all tracks',
  },
  {
    icon: Zap,
    label: 'Practice',
    weight: '20%',
    detail: 'Keys, certificates, and CSRs you generate',
  },
  {
    icon: Clock,
    label: 'Time & Consistency',
    weight: '10%',
    detail: 'Minutes spent learning + daily streak',
  },
]

export function ScoringModal({ isOpen, onClose }: ScoringModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="scoring-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 id="scoring-modal-title" className="text-lg font-bold text-foreground">
                  How Your Score Works
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Dimensions */}
              <div className="space-y-3 mb-6">
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Four Dimensions
                </p>
                {DIMENSIONS.map((dim) => (
                  <div key={dim.label} className="flex items-start gap-3">
                    <dim.icon size={16} className="text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-foreground">{dim.label}</span>
                        <span className="text-xs font-mono text-primary">{dim.weight}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{dim.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Belt Ranks */}
              <div className="mb-6">
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                  Belt Ranks
                </p>
                <div className="space-y-1.5">
                  {BELT_RANKS.map((belt) => (
                    <div key={belt.name} className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-2.5 rounded-sm shrink-0"
                        style={{
                          backgroundColor: belt.color,
                          border: belt.color === '#F5F5F5' ? '1px solid #D1D5DB' : 'none',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                        }}
                      />
                      <span className="text-xs font-medium text-foreground w-20 shrink-0">
                        {belt.name}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">
                        {belt.minScore}–{belt.maxScore}
                      </span>
                      <span className="text-xs text-muted-foreground italic truncate">
                        {belt.tagline}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Threshold Gates */}
              <div className="rounded-lg border border-border bg-muted/10 px-4 py-3 mb-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Threshold gates: </span>
                  Each belt also requires minimum quiz scores, steps completed, artifacts generated,
                  time spent, and streak days. If your score qualifies but a gate isn&apos;t met,
                  you&apos;ll see exactly what&apos;s needed to unlock the next belt.
                </p>
              </div>

              {/* Footer */}
              <p className="text-xs text-muted-foreground text-center">
                Your score updates automatically as you learn. No data leaves your browser.
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
