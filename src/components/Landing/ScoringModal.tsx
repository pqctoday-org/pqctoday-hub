import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Brain, BookOpen, Zap, Clock } from 'lucide-react'
import { BELT_RANKS } from '@/hooks/useAwarenessScore'

interface ScoringModalProps {
  isOpen: boolean
  onClose: () => void
  totalSteps: number
  totalQuestions: number
}

const STATIC_DIMENSIONS = [
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

export function ScoringModal({ isOpen, onClose, totalSteps, totalQuestions }: ScoringModalProps) {
  const dimensions = [
    {
      icon: Brain,
      label: 'Knowledge',
      weight: '40%',
      detail: `Cumulative quiz mastery (${totalQuestions} questions)`,
    },
    {
      icon: BookOpen,
      label: 'Breadth',
      weight: '30%',
      detail: `Module steps completed (${totalSteps} total)`,
    },
    ...STATIC_DIMENSIONS,
  ]
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
                {dimensions.map((dim) => (
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

              {/* Belt Ranks with threshold requirements */}
              <div className="mb-6">
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                  Belt Ranks &amp; Requirements
                </p>
                <div className="space-y-3">
                  {BELT_RANKS.map((belt) => {
                    const t = belt.thresholds
                    const gates: string[] = []
                    if (t.minQuizPct > 0) {
                      const absQ = Math.ceil((t.minQuizPct / 100) * totalQuestions)
                      gates.push(`Quiz ≥ ${t.minQuizPct}% (${absQ} Qs)`)
                    }
                    if (t.minStepsPct > 0) {
                      const absS = Math.ceil((t.minStepsPct / 100) * totalSteps)
                      gates.push(`Steps ≥ ${t.minStepsPct}% (${absS})`)
                    }
                    if (t.minArtifacts > 0)
                      gates.push(`${t.minArtifacts} artifact${t.minArtifacts > 1 ? 's' : ''}`)
                    if (t.minTimeMinutes > 0) gates.push(`${t.minTimeMinutes} min`)
                    if (t.minStreak > 0) gates.push(`${t.minStreak}-day streak`)
                    return (
                      <div key={belt.name}>
                        <div className="flex items-center gap-2.5">
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
                        {gates.length > 0 && (
                          <div className="ml-10 mt-1 flex flex-wrap gap-1">
                            {gates.map((g) => (
                              <span
                                key={g}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-muted/20 text-muted-foreground"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                        {gates.length === 0 && (
                          <p className="ml-10 mt-0.5 text-[10px] text-muted-foreground italic">
                            No gates — start learning
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Threshold gate note */}
              <div className="rounded-lg border border-border bg-muted/10 px-4 py-3 mb-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">How gates work: </span>
                  Your score must reach the belt&apos;s range <em>and</em> all gate requirements
                  must be met. If blocked, the scorecard tells you exactly which gate to clear next.
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
