// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { X, Sliders, Brain, Users, Database } from 'lucide-react'
import { SECTION_INFO } from './sectionInfoContent'

interface SectionInfoModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
}

export function SectionInfoModal({ isOpen, onClose, sectionId }: SectionInfoModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // eslint-disable-next-line security/detect-object-injection
  const info = SECTION_INFO[sectionId]
  if (!info) return null

  return createPortal(
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
              className="glass-panel bg-card max-w-2xl w-full max-h-[85dvh] flex flex-col overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="section-info-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header — pinned above scroll */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0 border-b border-border/50">
                <h2 id="section-info-modal-title" className="text-lg font-bold text-foreground">
                  {info.title}
                </h2>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="p-2 h-auto w-auto rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-6 py-5">
                {/* Summary */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{info.summary}</p>

                {/* Wizard Inputs */}
                {info.wizardInputs.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Sliders size={14} className="text-primary shrink-0" />
                      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        Wizard Inputs
                      </p>
                    </div>
                    <div className="space-y-3">
                      {info.wizardInputs.map((input) => (
                        <div key={input.label} className="flex items-start gap-3 pl-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-foreground">
                              {input.label}
                            </span>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {input.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scoring Principles */}
                {info.scoringPrinciples && info.scoringPrinciples.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain size={14} className="text-primary shrink-0" />
                      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        Scoring Principles
                      </p>
                    </div>
                    <ul className="space-y-2 pl-1">
                      {info.scoringPrinciples.map((principle, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {principle}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Persona Effects */}
                {info.personaEffects && info.personaEffects.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Users size={14} className="text-primary shrink-0" />
                      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        Persona Effects
                      </p>
                    </div>
                    <div className="space-y-2 pl-1">
                      {info.personaEffects.map((pe) => (
                        <div key={pe.persona} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-foreground">
                              {pe.persona}
                            </span>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {pe.effect}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Sources */}
                {info.dataSources && info.dataSources.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Database size={14} className="text-primary shrink-0" />
                      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        Data Sources
                      </p>
                    </div>
                    <ul className="space-y-2 pl-1">
                      {info.dataSources.map((source, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <p className="text-xs text-muted-foreground leading-relaxed">{source}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
