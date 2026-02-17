import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

const TOUR_STORAGE_KEY = 'pqc-tour-completed'

interface TourStep {
  target: string // CSS selector
  title: string
  description: string
  position: 'bottom' | 'top' | 'left' | 'right'
}

const tourSteps: TourStep[] = [
  {
    target: 'nav',
    title: 'Navigation',
    description:
      'Use the navigation bar to explore all PQC modules — timeline, threats, algorithms, and more.',
    position: 'bottom',
  },
  {
    target: 'a[href="/timeline"]',
    title: 'Migration Timeline',
    description:
      'Track global PQC migration deadlines and regulatory milestones from 40+ countries.',
    position: 'bottom',
  },
  {
    target: 'a[href="/playground"]',
    title: 'Crypto Playground',
    description:
      'Test real post-quantum cryptographic algorithms (ML-KEM, ML-DSA) directly in your browser.',
    position: 'bottom',
  },
  {
    target: 'a[href="/learn"]',
    title: 'Learning Modules',
    description:
      'New to PQC? Start with "PQC 101" for a beginner-friendly introduction, then explore hands-on workshops.',
    position: 'bottom',
  },
  {
    target: 'button[aria-label="Open glossary"]',
    title: 'Glossary',
    description:
      "Don't know a term? Open the glossary anytime to look up PQC concepts, algorithms, and standards.",
    position: 'top',
  },
]

const getTooltipPosition = (rect: DOMRect, position: TourStep['position']) => {
  const gap = 12
  switch (position) {
    case 'bottom':
      return { top: rect.bottom + gap, left: rect.left + rect.width / 2 }
    case 'top':
      return { top: rect.top - gap, left: rect.left + rect.width / 2 }
    case 'left':
      return { top: rect.top + rect.height / 2, left: rect.left - gap }
    case 'right':
      return { top: rect.top + rect.height / 2, left: rect.right + gap }
  }
}

export const GuidedTour: React.FC = () => {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY)
    if (!completed) {
      // Delay the tour start so the page can fully render
      timerRef.current = setTimeout(() => setIsActive(true), 2000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const updatePosition = useCallback(() => {
    if (!isActive) return
    // eslint-disable-next-line security/detect-object-injection
    const step = tourSteps[currentStep]
    if (!step) return
    const el = document.querySelector(step.target)
    if (el) {
      const rect = el.getBoundingClientRect()
      const pos = getTooltipPosition(rect, step.position)
      setTooltipStyle({
        position: 'fixed',
        top: step.position === 'top' ? undefined : pos.top,
        bottom: step.position === 'top' ? `${window.innerHeight - rect.top + 12}px` : undefined,
        left: pos.left,
        transform:
          step.position === 'bottom' || step.position === 'top'
            ? 'translateX(-50%)'
            : step.position === 'left'
              ? 'translateX(-100%) translateY(-50%)'
              : 'translateY(-50%)',
        zIndex: 60,
      })
    }
  }, [isActive, currentStep])

  useEffect(() => {
    // Initialize position on mount/step change without triggering cascading renders
    const frame = requestAnimationFrame(() => updatePosition())
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [updatePosition])

  const dismiss = useCallback(() => {
    setIsActive(false)
    localStorage.setItem(TOUR_STORAGE_KEY, 'true')
  }, [])

  const next = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      dismiss()
    }
  }

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }

  if (!isActive) return null

  // eslint-disable-next-line security/detect-object-injection
  const step = tourSteps[currentStep]

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/50"
            role="button"
            tabIndex={-1}
            onClick={dismiss}
            onKeyDown={(e) => {
              if (e.key === 'Escape') dismiss()
            }}
          />

          {/* Tooltip */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: step.position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={tooltipStyle}
            className="w-80 max-w-[calc(100vw-2rem)]"
          >
            <div className="glass-panel p-4 shadow-2xl border-primary/30">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-foreground text-sm">{step.title}</h3>
                <button
                  onClick={dismiss}
                  className="p-0.5 rounded hover:bg-muted/50 text-muted-foreground transition-colors"
                  aria-label="Dismiss tour"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                {step.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {currentStep + 1} / {tourSteps.length}
                </span>
                <div className="flex items-center gap-1">
                  {currentStep > 0 && (
                    <button
                      onClick={prev}
                      className="p-1 rounded hover:bg-muted/50 text-muted-foreground transition-colors"
                      aria-label="Previous step"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}
                  <button
                    onClick={next}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary text-black text-xs font-bold hover:bg-primary/90 transition-colors"
                  >
                    {currentStep === tourSteps.length - 1 ? 'Done' : 'Next'}
                    {currentStep < tourSteps.length - 1 && <ChevronRight size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
