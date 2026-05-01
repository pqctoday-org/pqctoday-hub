// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check } from 'lucide-react'
import { Button } from '../ui/button'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { SAMPLE_QUESTIONS } from '@/data/sampleQuestions'

interface SampleQuestionsModalProps {
  isOpen: boolean
  onClose: () => void
  onSendQuestion?: (question: string) => void
}

export const SampleQuestionsModal = ({
  isOpen,
  onClose,
  onSendQuestion,
}: SampleQuestionsModalProps) => {
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null)
  const focusTrapRef = useFocusTrap(isOpen)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleCopy = async (question: string) => {
    try {
      await navigator.clipboard.writeText(question)
      setCopiedQuestion(question)
      setTimeout(() => setCopiedQuestion(null), 1500)
    } catch {
      // Clipboard API may not be available
    }
  }

  const handleDoubleClick = (question: string) => {
    if (onSendQuestion) {
      onSendQuestion(question)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 embed-backdrop bg-black/60 backdrop-blur-sm z-modal"
          />

          <div className="fixed inset-0 embed-backdrop z-modal flex items-center justify-center p-4">
            <motion.div
              ref={focusTrapRef}
              role="dialog"
              aria-modal="true"
              aria-label="Sample questions"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel p-6 max-w-3xl w-full max-h-[85dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Sample Questions</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click to copy &middot; Double-click to send directly to chat
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="min-h-[44px] min-w-[44px] p-2"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-5">
                {Object.entries(SAMPLE_QUESTIONS).map(([category, questions]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-primary mb-2">{category}</h3>
                    <div className="flex flex-wrap gap-2">
                      {questions.map((q) => (
                        <Button
                          key={q}
                          variant="ghost"
                          onClick={() => handleCopy(q)}
                          onDoubleClick={() => handleDoubleClick(q)}
                          title="Click to copy, double-click to send"
                          className="group inline-flex items-center gap-1.5 px-3 py-1.5 h-auto rounded-full text-xs bg-muted/30 hover:bg-primary/10 active:bg-primary/10 border border-border hover:border-primary/30 active:border-primary/30 text-muted-foreground hover:text-foreground active:text-foreground transition-colors cursor-pointer"
                        >
                          <span>{q}</span>
                          {copiedQuestion === q ? (
                            <Check size={12} className="text-status-success shrink-0" />
                          ) : (
                            <Copy
                              size={12}
                              className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                            />
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  {Object.values(SAMPLE_QUESTIONS).flat().length} sample questions across{' '}
                  {Object.keys(SAMPLE_QUESTIONS).length} categories
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
