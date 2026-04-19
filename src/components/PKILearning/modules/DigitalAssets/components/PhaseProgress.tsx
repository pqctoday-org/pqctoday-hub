// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import clsx from 'clsx'
import type { Step } from './StepWizard'

export interface PhaseProgressProps {
  steps: Step[]
  currentStepIndex: number
  /** Optional custom labels per phase. Falls back to Title-Cased phase key. */
  phaseLabels?: Partial<Record<string, string>>
}

/**
 * Phase-grouped progress bar — renders labeled segments (one per distinct
 * `step.phase`) with internal tick marks per step. Fully graceful when no
 * phases are set: renders nothing (caller falls back to the dot strip).
 */
export const PhaseProgress: React.FC<PhaseProgressProps> = ({
  steps,
  currentStepIndex,
  phaseLabels,
}) => {
  if (!steps.some((s) => s.phase)) return null

  // Preserve encounter order, no Set reordering
  const phases: string[] = []
  for (const s of steps) {
    if (s.phase && !phases.includes(s.phase)) phases.push(s.phase)
  }

  const labelOf = (phase: string): string =>
    phaseLabels?.[phase] ?? phase.charAt(0).toUpperCase() + phase.slice(1)

  const current = steps[currentStepIndex]
  const currentPhase = current?.phase

  return (
    <div className="w-full" aria-label="Scenario phase progress">
      <div className="flex items-stretch gap-2">
        {phases.map((phase) => {
          const phaseSteps = steps
            .map((s, idx) => ({ s, idx }))
            .filter(({ s }) => s.phase === phase)
          const phaseStepCount = phaseSteps.length
          const completed = phaseSteps.filter(({ idx }) => idx < currentStepIndex).length
          const isActive = phase === currentPhase
          const isDone = phaseSteps.every(({ idx }) => idx < currentStepIndex)

          return (
            <div
              key={phase}
              className={clsx(
                'flex-1 min-w-0 rounded-lg border px-2 py-1.5 transition-colors',
                isActive
                  ? 'border-primary bg-primary/10'
                  : isDone
                    ? 'border-success/40 bg-success/5'
                    : 'border-border bg-muted/20'
              )}
              {...(isActive ? { 'aria-current': 'step' as const } : {})}
            >
              <div
                className={clsx(
                  'text-[10px] font-mono uppercase tracking-wider truncate',
                  isActive ? 'text-primary' : isDone ? 'text-success' : 'text-muted-foreground'
                )}
              >
                {labelOf(phase)}
              </div>
              <div className="mt-1 flex gap-0.5">
                {phaseSteps.map(({ idx }) => (
                  <div
                    key={idx}
                    className={clsx(
                      'h-1 flex-1 rounded-full transition-colors',
                      idx < currentStepIndex
                        ? 'bg-success'
                        : idx === currentStepIndex
                          ? 'bg-primary'
                          : 'bg-muted'
                    )}
                  />
                ))}
              </div>
              <div className="mt-0.5 text-[10px] text-muted-foreground font-mono">
                {completed}/{phaseStepCount}
              </div>
            </div>
          )
        })}
      </div>
      {current?.title && (
        <div className="mt-2 text-xs text-muted-foreground">
          Step {currentStepIndex + 1} of {steps.length} — {current.title.replace(/^\d+\.\s*/, '')}
        </div>
      )}
    </div>
  )
}
