// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { LEARN_SECTIONS } from './moduleData'
import { Button } from '@/components/ui/button'

interface LearnStep {
  label: string
  content: React.ReactNode
}

interface LearnStepperProps {
  steps: LearnStep[]
}

/**
 * Multi-step learn navigator for split Introduction components.
 * Matches the pqc-101 reference stepper model:
 *  - Numbered circle step indicators with ✓ for completed steps
 *  - glass-panel content container (min-h-[400px])
 *  - Last step: green "✓ Mark as Read" button replaces Next
 *  - After completion: inline "✓ Reading Complete!" success state in nav
 */
export const LearnStepper = ({ steps }: LearnStepperProps) => {
  const [current, setCurrent] = useState(0)
  const location = useLocation()
  const moduleId = location.pathname.replace(/^\/learn\/?/, '') || undefined
  const { modules, markAllLearnSectionsComplete } = useModuleStore()

  const sections = moduleId ? (LEARN_SECTIONS[moduleId] ?? []) : []
  const checks = modules[moduleId ?? '']?.learnSectionChecks ?? {}
  const allDone = sections.length > 0 && sections.every((s) => checks[s.id])

  const isFirst = current === 0
  const isLast = current === steps.length - 1

  return (
    <div className="w-full">
      {/* Step indicator — numbered circles with connecting line */}
      <div className="mb-8">
        <div className="flex justify-between relative">
          <div className="absolute top-4 left-0 w-full h-0.5 bg-border -z-10" />
          {steps.map((step, idx) => (
            <Button
              variant="ghost"
              key={step.label}
              type="button"
              onClick={() => setCurrent(idx)}
              className={`flex flex-col items-center gap-2 group ${
                idx === current ? 'text-primary' : 'text-muted-foreground'
              }`}
              aria-label={`Go to step ${idx + 1}: ${step.label}`}
              aria-current={idx === current ? 'step' : undefined}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-background text-sm ${
                  idx === current
                    ? 'border-primary text-primary'
                    : idx < current
                      ? 'border-status-success text-status-success'
                      : 'border-border text-muted-foreground'
                }`}
              >
                {idx < current ? '✓' : idx + 1}
              </div>
              <span className="text-[10px] sm:text-xs font-medium max-w-[80px] text-center leading-tight">
                {step.label}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Content panel */}
      <div className="glass-panel p-6 md:p-8 min-h-[400px]">
        {/* eslint-disable-next-line security/detect-object-injection */}
        {steps[current].content}
      </div>

      {/* Navigation — Previous | Next or Mark as Read */}
      <div className="flex flex-col sm:flex-row justify-between mt-6 gap-3">
        <Button
          variant="ghost"
          type="button"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={isFirst}
          className="px-6 py-3 min-h-[44px] rounded-lg border border-border hover:bg-muted/10 disabled:opacity-50 transition-colors text-foreground"
        >
          ← Previous
        </Button>

        {isLast ? (
          allDone ? (
            <div className="flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-lg bg-status-success/15 border border-status-success/30 text-status-success text-sm font-semibold">
              <CheckCircle size={16} />
              Reading Complete!
            </div>
          ) : (
            <Button
              variant="ghost"
              type="button"
              onClick={() => moduleId && markAllLearnSectionsComplete(moduleId)}
              className="px-6 py-3 min-h-[44px] bg-status-success text-foreground font-bold rounded-lg hover:bg-status-success/90 transition-colors"
            >
              ✓ Mark as Read
            </Button>
          )
        ) : (
          <Button
            variant="gradient"
            type="button"
            onClick={() => setCurrent((c) => Math.min(steps.length - 1, c + 1))}
            className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
          >
            Next →
          </Button>
        )}
      </div>
    </div>
  )
}
