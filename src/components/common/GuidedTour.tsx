import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronRight,
  ChevronLeft,
  Compass,
  Globe,
  FlaskConical,
  GraduationCap,
  BookOpen,
} from 'lucide-react'

const TOUR_STORAGE_KEY = 'pqc-tour-completed'

interface TourStep {
  target: string // CSS selector (used by desktop tooltip)
  title: string
  description: string
  position: 'bottom' | 'top' | 'left' | 'right'
  icon: React.FC<{ size?: number; className?: string }>
}

const tourSteps: TourStep[] = [
  {
    target: 'nav',
    title: 'Navigation',
    description:
      'Use the navigation bar to explore all PQC modules — timeline, threats, algorithms, and more.',
    position: 'bottom',
    icon: Compass,
  },
  {
    target: 'a[href="/timeline"]',
    title: 'Migration Timeline',
    description:
      'Track global PQC migration deadlines and regulatory milestones from 40+ countries.',
    position: 'bottom',
    icon: Globe,
  },
  {
    target: 'a[href="/playground"]',
    title: 'Crypto Playground',
    description:
      'Test real post-quantum cryptographic algorithms (ML-KEM, ML-DSA) directly in your browser.',
    position: 'bottom',
    icon: FlaskConical,
  },
  {
    target: 'a[href="/learn"]',
    title: 'Learning Modules',
    description:
      'New to PQC? Start with "PQC 101" for a beginner-friendly introduction, then explore hands-on workshops.',
    position: 'bottom',
    icon: GraduationCap,
  },
  {
    target: 'button[aria-label="Open glossary"]',
    title: 'Glossary',
    description:
      "Don't know a term? Open the glossary anytime to look up PQC concepts, algorithms, and standards.",
    position: 'top',
    icon: BookOpen,
  },
]

const TOOLTIP_WIDTH = 320

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
    const params = new URLSearchParams(window.location.search)
    if (params.has('tour')) {
      localStorage.removeItem(TOUR_STORAGE_KEY)
    }
    const completed = localStorage.getItem(TOUR_STORAGE_KEY)
    if (!completed) {
      // Delay the tour start so the page can fully render
      timerRef.current = setTimeout(() => setIsActive(true), 2000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Desktop-only: compute tooltip position anchored to target element
  const updatePosition = useCallback(() => {
    if (!isActive) return
    // eslint-disable-next-line security/detect-object-injection
    const step = tourSteps[currentStep]
    if (!step) return

    const el = document.querySelector(step.target)
    if (el) {
      const rect = el.getBoundingClientRect()
      const pos = getTooltipPosition(rect, step.position)
      const vw = window.visualViewport?.width ?? window.innerWidth
      const vh = window.visualViewport?.height ?? window.innerHeight
      const clampedLeft = Math.max(
        TOOLTIP_WIDTH / 2 + 8,
        Math.min(pos.left, vw - TOOLTIP_WIDTH / 2 - 8)
      )
      setTooltipStyle({
        position: 'fixed',
        top: step.position === 'top' ? undefined : pos.top,
        bottom: step.position === 'top' ? `${vh - rect.top + 12}px` : undefined,
        left: clampedLeft,
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
    const frame = requestAnimationFrame(() => updatePosition())
    window.addEventListener('resize', updatePosition)
    window.addEventListener('orientationchange', updatePosition)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('orientationchange', updatePosition)
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
  const StepIcon = step.icon

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

          {/* Desktop: anchored tooltip */}
          <motion.div
            key={`desktop-${currentStep}`}
            initial={{ opacity: 0, y: step.position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={tooltipStyle}
            className="hidden md:block w-80 max-w-[calc(100vw-2rem)]"
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

          {/* Mobile: full-screen swipeable card carousel */}
          <div className="md:hidden fixed inset-0 z-[60] flex items-center justify-center p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`mobile-${currentStep}`}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) next()
                  else if (info.offset.x > 50) prev()
                }}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="glass-panel p-6 w-full max-w-sm text-center shadow-2xl border-primary/30 cursor-grab active:cursor-grabbing"
              >
                {/* Icon */}
                <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4">
                  <StepIcon size={28} />
                </div>

                {/* Title */}
                <h3 className="font-bold text-foreground text-lg mb-2">{step.title}</h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {step.description}
                </p>

                {/* Dot indicators */}
                <div className="flex gap-1.5 justify-center mb-5">
                  {tourSteps.map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all ${
                        i === currentStep
                          ? 'w-6 h-1.5 bg-primary'
                          : 'w-1.5 h-1.5 bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={dismiss}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors py-2 px-1"
                  >
                    Skip
                  </button>
                  <button
                    onClick={next}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-black text-sm font-bold hover:bg-primary/90 transition-colors"
                  >
                    {currentStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}
                    {currentStep < tourSteps.length - 1 && <ChevronRight size={16} />}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
