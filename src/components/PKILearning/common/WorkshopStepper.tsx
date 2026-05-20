// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Check } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'

export interface WorkshopStep {
  id: string
  label: string
}

interface WorkshopStepperProps {
  steps: WorkshopStep[]
  currentStep: number
  completedSteps?: string[]
  onStepClick?: (index: number) => void
  className?: string
}

/**
 * Step indicator for multi-step workshop flows — ux-standard.md §S4.12.
 *
 * Visual states:
 *  completed → bg-status-success/20 + green check
 *  current   → bg-primary/10 + primary ring
 *  future    → bg-muted, muted text
 *
 * Shows dot-only on mobile (label hidden), full pill on ≥ sm.
 */
export const WorkshopStepper: React.FC<WorkshopStepperProps> = ({
  steps,
  currentStep,
  completedSteps = [],
  onStepClick,
  className,
}) => {
  if (steps.length < 2) return null

  return (
    <nav
      aria-label="Workshop steps"
      className={clsx('flex flex-wrap items-center gap-1.5', className)}
    >
      {steps.map((step, idx) => {
        const isDone = completedSteps.includes(step.id) || idx < currentStep
        const isCurrent = idx === currentStep
        const clickable = Boolean(onStepClick) && idx <= currentStep

        return (
          <React.Fragment key={step.id}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`${step.label}${isDone ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
              disabled={!clickable}
              onClick={() => clickable && onStepClick!(idx)}
              className={clsx(
                'h-auto rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
                isDone && [
                  'bg-status-success/15 border border-status-success/40 text-status-success',
                  clickable && 'hover:bg-status-success/25',
                ],
                isCurrent && [
                  'bg-primary/10 border border-primary/50 text-primary ring-1 ring-primary/20 hover:bg-primary/15',
                ],
                !isDone &&
                  !isCurrent && [
                    'bg-muted border border-border text-muted-foreground cursor-default hover:bg-muted',
                  ]
              )}
            >
              {/* Dot / check */}
              <span
                className={clsx(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  isDone && 'bg-status-success/30',
                  isCurrent && 'bg-primary/20',
                  !isDone && !isCurrent && 'bg-muted-foreground/20'
                )}
              >
                {isDone ? <Check size={9} strokeWidth={3} /> : <span>{idx + 1}</span>}
              </span>
              {/* Label — visible on sm+ */}
              <span className="hidden sm:block truncate max-w-[120px] ml-1">{step.label}</span>
            </Button>

            {/* Connector line between steps */}
            {idx < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={clsx(
                  'hidden sm:block h-px w-4 shrink-0',
                  idx < currentStep ? 'bg-status-success/40' : 'bg-border'
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
