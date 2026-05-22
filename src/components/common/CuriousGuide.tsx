// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Lock, Cpu, Clock, Compass, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import { logEvent, personaLabel } from '@/utils/analytics'

interface CuriousStep {
  icon: React.FC<{ size?: number; className?: string }>
  title: string
  body: string
  ctaLabel: string
  ctaPath: string
}

const STEPS: CuriousStep[] = [
  {
    icon: Lock,
    title: "Everything's encrypted",
    body: "Every bank transfer, email, and software update relies on cryptography quietly running in the background. Today's algorithms are decades old — and they're about to be replaced.",
    ctaLabel: 'See what changes',
    ctaPath: '/learn/pqc-101',
  },
  {
    icon: Cpu,
    title: 'Quantum changes the math',
    body: 'A powerful enough quantum computer would break the algorithms protecting that traffic. Some adversaries are already collecting encrypted data today to decrypt later.',
    ctaLabel: 'Explore the threats',
    ctaPath: '/threats',
  },
  {
    icon: Clock,
    title: 'The clock is already ticking',
    body: 'NIST has published the first three post-quantum algorithms. CNSA 2.0 mandates them by 2027. Industries are mid-migration right now.',
    ctaLabel: 'See the timeline',
    ctaPath: '/timeline',
  },
  {
    icon: Compass,
    title: 'Find your starting point',
    body: "You don't need a cryptography background. Pick a starting tile on the Explore page and follow the trail — at any depth that fits.",
    ctaLabel: 'Open the Explorer',
    ctaPath: '/explore',
  },
]

/**
 * 4-step floating tour for the curious persona on first Landing visit.
 *
 * Renders only when:
 *   - selectedPersona === 'curious'
 *   - curiousGuideDismissed is false in usePersonaStore
 *
 * Dismiss is permanent per browser (Zustand persisted at version 7). The
 * "Finish" button on the last step also calls dismissCuriousGuide so the tour
 * doesn't reappear when the user navigates back to Landing.
 */
export const CuriousGuide: React.FC = () => {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const curiousGuideDismissed = usePersonaStore((s) => s.curiousGuideDismissed)
  const dismissCuriousGuide = usePersonaStore((s) => s.dismissCuriousGuide)
  const [stepIndex, setStepIndex] = useState(0)

  const eligible = selectedPersona === 'curious' && !curiousGuideDismissed
  const step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1

  if (!eligible || !step) return null

  const handleDismiss = (reason: 'x' | 'finish' | 'cta') => {
    logEvent('Curious Guide', 'Dismissed', personaLabel(`step=${stepIndex + 1}|reason=${reason}`))
    dismissCuriousGuide()
  }

  const handleNext = () => {
    if (isLastStep) {
      handleDismiss('finish')
      return
    }
    logEvent('Curious Guide', 'Step Advance', personaLabel(`from=${stepIndex + 1}`))
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }

  const handlePrev = () => {
    if (stepIndex === 0) return
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  const Icon = step.icon

  return (
    <AnimatePresence>
      <motion.div
        key="curious-guide"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25 }}
        role="dialog"
        aria-labelledby="curious-guide-title"
        aria-describedby="curious-guide-body"
        className="fixed bottom-4 right-4 z-overlay w-[min(360px,calc(100vw-2rem))] glass-panel border border-primary/30 shadow-2xl rounded-2xl p-5"
        data-testid="curious-guide"
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary">
              <Icon size={16} aria-hidden="true" />
            </span>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Step {stepIndex + 1} of {STEPS.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDismiss('x')}
            aria-label="Dismiss tour"
            className="h-7 w-7 p-0 shrink-0 -mr-1"
          >
            <X size={14} aria-hidden="true" />
          </Button>
        </div>

        <h2
          id="curious-guide-title"
          className="text-base font-semibold text-foreground leading-snug mb-2"
        >
          {step.title}
        </h2>
        <p id="curious-guide-body" className="text-sm text-muted-foreground leading-relaxed mb-4">
          {step.body}
        </p>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Link
            to={step.ctaPath}
            onClick={() => {
              logEvent(
                'Curious Guide',
                'CTA Clicked',
                personaLabel(`step=${stepIndex + 1}|path=${step.ctaPath}`)
              )
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            {step.ctaLabel}
            <ArrowRight size={12} aria-hidden="true" />
          </Link>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={stepIndex === 0}
              aria-label="Previous step"
              className="h-7 w-7 p-0"
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant={isLastStep ? 'gradient' : 'outline'}
              size="sm"
              onClick={handleNext}
              className="h-7 px-3 text-xs"
            >
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ChevronRight size={14} className="ml-1" />}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
