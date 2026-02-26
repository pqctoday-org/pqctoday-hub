import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface SampleQuestionsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SAMPLE_QUESTIONS: Record<string, string[]> = {
  Library: ['What is FIPS 203?', "Show me NIST's post-quantum standards"],
  Threats: ['What are quantum threats to aerospace?', 'Explain harvest-now-decrypt-later'],
  Learn: ['How does hybrid cryptography work?', 'Take me to the PKI Workshop hands-on lab'],
  Algorithms: ['Compare ML-KEM key sizes', 'What is the difference between ML-DSA and SLH-DSA?'],
  Compliance: ['Show FIPS 140-3 validated modules with PQC', 'What is ACVP?'],
  Assessment: ['How do I start a PQC risk assessment?', 'What factors affect my risk score?'],
  Playground: ['Let me try ML-DSA in the playground', 'How do I generate ML-KEM keys?'],
  Leaders: ['Who are the academic PQC leaders?', 'Show me PQC leaders from France'],
  Timeline: ["What is France's PQC migration timeline?", 'When do US agencies need to migrate?'],
  Migrate: ['What HSMs support ML-KEM?', 'Show PQC-ready TLS libraries'],
  'Cross-cutting': [
    "What's the difference between KEM and digital signature?",
    'Explain crypto agility',
  ],
}

export const SampleQuestionsModal = ({ isOpen, onClose }: SampleQuestionsModalProps) => {
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null)

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          />

          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
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
                    Click any question to copy it, then paste into the PQC Assistant chatbot.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                {Object.entries(SAMPLE_QUESTIONS).map(([category, questions]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-primary mb-2">{category}</h3>
                    <div className="flex flex-wrap gap-2">
                      {questions.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleCopy(q)}
                          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-muted/30 hover:bg-primary/10 border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <span>{q}</span>
                          {copiedQuestion === q ? (
                            <Check size={12} className="text-status-success shrink-0" />
                          ) : (
                            <Copy
                              size={12}
                              className="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                            />
                          )}
                        </button>
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
