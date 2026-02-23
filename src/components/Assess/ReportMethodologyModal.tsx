import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ShieldAlert,
  Zap,
  ArrowRight,
  Briefcase,
  Clock,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
} from 'lucide-react'

interface ReportMethodologyModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES = [
  {
    icon: Zap,
    label: 'Quantum Exposure',
    detail: 'How vulnerable your algorithms and data are to quantum attacks',
  },
  {
    icon: ArrowRight,
    label: 'Migration Complexity',
    detail: 'Effort required based on crypto agility, infrastructure, and scale',
  },
  {
    icon: Briefcase,
    label: 'Regulatory Pressure',
    detail: 'Compliance framework mandates and country-specific deadlines',
  },
  {
    icon: Clock,
    label: 'Organizational Readiness',
    detail: 'Migration status, team capacity, and vendor dependencies',
  },
]

export function ReportMethodologyModal({ isOpen, onClose }: ReportMethodologyModalProps) {
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 print:hidden"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="methodology-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 id="methodology-modal-title" className="text-lg font-bold text-foreground">
                  How This Report Works
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Risk Score */}
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <ShieldAlert size={16} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Risk Score (0 &ndash; 100)
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      A composite score derived from four weighted categories. Higher means more
                      urgent action is needed. Your industry and country influence how the
                      categories are weighted &mdash; for example, government organizations see
                      higher regulatory pressure weighting.
                    </p>
                  </div>
                </div>
              </div>

              {/* Four Risk Categories */}
              <div className="space-y-3 mb-6">
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Four Risk Categories
                </p>
                {CATEGORIES.map((cat) => (
                  <div key={cat.label} className="flex items-start gap-3">
                    <cat.icon size={16} className="text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{cat.label}</span>
                      <p className="text-xs text-muted-foreground">{cat.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* HNDL & HNFL */}
              <div className="mb-6">
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                  HNDL &amp; HNFL Risk Windows
                </p>
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      <span className="font-medium text-foreground">
                        Harvest Now, Decrypt Later (HNDL):
                      </span>{' '}
                      Adversaries can capture encrypted data today and decrypt it once quantum
                      computers arrive. Your risk window is the gap between how long your data must
                      stay confidential and the estimated quantum threat year.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-medium text-foreground">
                        Harvest Now, Forge Later (HNFL):
                      </span>{' '}
                      Digital signatures and certificates can be forged retroactively. If your
                      credentials remain trusted beyond the quantum threat horizon, they are at
                      risk.
                    </p>
                  </div>
                </div>
              </div>

              {/* I Don't Know Responses */}
              <div className="mb-6">
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                  &ldquo;I Don&apos;t Know&rdquo; Responses
                </p>
                <div className="flex items-start gap-3">
                  <HelpCircle size={16} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      When you select &ldquo;I don&apos;t know&rdquo; for any question, the report
                      applies{' '}
                      <span className="font-medium text-foreground">conservative defaults</span> to
                      avoid underestimating your risk. For example:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                      <li>
                        Unknown data retention &rarr; assumes{' '}
                        <span className="font-medium text-foreground">15-year</span> retention
                      </li>
                      <li>
                        Unknown credential lifetime &rarr; assumes{' '}
                        <span className="font-medium text-foreground">10-year</span> validity
                      </li>
                      <li>
                        Unknown sensitivity &rarr; assumes{' '}
                        <span className="font-medium text-foreground">high</span> sensitivity
                      </li>
                      <li>
                        Unknown vendor dependency &rarr; assumes{' '}
                        <span className="font-medium text-foreground">heavy vendor</span> reliance
                      </li>
                      <li>
                        Unknown infrastructure &rarr; assumes{' '}
                        <span className="font-medium text-foreground">moderate-to-high</span>{' '}
                        complexity
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                      Each &ldquo;I don&apos;t know&rdquo; also generates a specific{' '}
                      <span className="font-medium text-foreground">awareness-gap action</span>{' '}
                      recommending you audit that area for a more precise assessment.
                    </p>
                  </div>
                </div>
              </div>

              {/* How Actions Are Prioritized */}
              <div className="mb-4">
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                  How Actions Are Prioritized
                </p>
                <div className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Recommended actions are generated from your specific inputs: algorithms, use
                      cases, infrastructure, compliance obligations, and migration status. Each
                      action is categorized as{' '}
                      <span className="font-medium text-foreground">Immediate</span>,{' '}
                      <span className="font-medium text-foreground">Short-term</span>, or{' '}
                      <span className="font-medium text-foreground">Long-term</span> based on
                      urgency and estimated effort.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="rounded-lg border border-border bg-muted/10 px-4 py-3">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  All computation runs locally in your browser. No assessment data is sent to any
                  server.
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
