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
 *
 * Navigation: when `onStepClick` is supplied every chip is clickable, including
 * steps ahead of the current one — the workshops let a visitor jump to any step
 * (that is what the icon step rail ModuleShell rendered until 4.95.0 did, and
 * what the FiveG / PKIWorkshop / DigitalID / MerkleWorkshopSteps rails still
 * do). Without a handler the chips are a read-only indicator.
 *
 * Label-visibility breakpoint — deliberate. `WorkshopStepHeader` renders the
 * current step's full title as a heading immediately above this row, and the
 * hand-copied icon rails in FiveG / PKIWorkshop / DigitalID / MerkleWorkshopSteps
 * show a short "Step N" caption at every viewport width with the full step title
 * as their `aria-label`. Un-hiding this pill's label below `sm:` would duplicate
 * text that is already on screen and reintroduce the crowding an 8-step workshop
 * hits at 390px — so the `sm:` gate stays. Screen-reader parity is unaffected:
 * `aria-label` below carries the full label at every width regardless of the
 * visual breakpoint.
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
        // Every chip is a real control when the module passes onStepClick — past,
        // current and future alike. Release 4.95.0 (CC-3, 2026-09-19) removed the
        // icon step rail in ModuleShell that let a visitor jump to any step and
        // left these chips as the only stepper, but they still locked `idx >
        // currentStep` with no inline reason (ux-standard UX-90). Workshops are
        // designed for free navigation (the rail had no `disabled`; the FiveG /
        // PKIWorkshop / DigitalID / Merkle rails still don't), so the chips carry
        // the same contract. Without a handler the chips stay a read-only
        // indicator.
        const clickable = Boolean(onStepClick)

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
                'h-auto rounded-full px-2 py-0.5 max-sm:min-h-[44px] max-sm:px-3 text-[11px] font-medium transition-colors',
                isDone && [
                  'bg-status-success/15 border border-status-success/40 text-status-success',
                  clickable && 'hover:bg-status-success/25',
                ],
                isCurrent && [
                  'bg-primary/10 border border-primary/50 text-primary ring-1 ring-primary/20 hover:bg-primary/15',
                ],
                !isDone &&
                  !isCurrent && [
                    'bg-muted border border-border text-muted-foreground',
                    clickable ? 'hover:bg-muted/70' : 'cursor-default hover:bg-muted',
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
