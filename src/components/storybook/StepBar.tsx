// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable no-restricted-syntax -- these are the Storybook Blue button primitives: the styled replacement for ui/button.tsx's variants, so they render the raw <button> themselves */
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import { chipVariants } from './variants'

export interface StepBarStep {
  id: string
  label: string
  completed?: boolean
}

export interface StepBarProps {
  steps: StepBarStep[]
  currentId: string
  onSelect?: (id: string) => void
  /** Accessible name of the step list. */
  label?: string
  className?: string
}

/**
 * Step bar: each step is an interactive chip. The current step uses the highlight and a
 * heavier outline; a completed step shows a tick and the word "Completed".
 */
export function StepBar({ steps, currentId, onSelect, label = 'Steps', className }: StepBarProps) {
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex flex-wrap gap-2">
        {steps.map((step, index) => {
          const current = step.id === currentId
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={onSelect ? () => onSelect(step.id) : undefined}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  chipVariants({ interactive: true }),
                  'min-h-[44px] px-4 text-sm',
                  current && 'bg-highlight text-heading border-[3px] border-ink'
                )}
              >
                {step.completed ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <span aria-hidden="true">{index + 1}</span>
                )}
                <span>{step.label}</span>
                {step.completed && (
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.14em]">
                    Completed
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
