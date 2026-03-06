// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'
import { WORKSHOP_SCENARIOS } from '../data'

export interface ScenarioAnswer {
  scenarioId: string
  bodyType: string
  org: string
  standard: string
  submitted: boolean
  correct: boolean
}

interface ScenarioChallengeProps {
  answers: ScenarioAnswer[]
  onAnswersChange: (answers: ScenarioAnswer[]) => void
}

function initAnswers(): ScenarioAnswer[] {
  return WORKSHOP_SCENARIOS.map((s) => ({
    scenarioId: s.id,
    bodyType: '',
    org: '',
    standard: '',
    submitted: false,
    correct: false,
  }))
}

export const ScenarioChallenge: React.FC<ScenarioChallengeProps> = ({
  answers,
  onAnswersChange,
}) => {
  const effectiveAnswers = answers.length === WORKSHOP_SCENARIOS.length ? answers : initAnswers()
  const [localAnswers, setLocalAnswers] = useState<ScenarioAnswer[]>(effectiveAnswers)
  const [currentIdx, setCurrentIdx] = useState(0)

  const scenario = WORKSHOP_SCENARIOS[currentIdx]
  const answer = localAnswers[currentIdx]

  const updateAnswer = (patch: Partial<ScenarioAnswer>) => {
    const updated = localAnswers.map((a, idx) => (idx === currentIdx ? { ...a, ...patch } : a))
    setLocalAnswers(updated)
    onAnswersChange(updated)
  }

  const submitAnswer = () => {
    const isCorrect =
      answer.bodyType === scenario.correctBodyType &&
      answer.org === scenario.correctOrg &&
      answer.standard === scenario.correctStandard
    updateAnswer({ submitted: true, correct: isCorrect })
  }

  const resetAnswer = () => {
    updateAnswer({ bodyType: '', org: '', standard: '', submitted: false, correct: false })
  }

  const canSubmit = answer.bodyType !== '' && answer.org !== '' && answer.standard !== ''
  const isSubmitted = answer.submitted

  const correctCount = localAnswers.filter((a) => a.submitted && a.correct).length
  const submittedCount = localAnswers.filter((a) => a.submitted).length

  const bodyTypeLabel = scenario.bodyTypeOptions.find((o) => o.id === answer.bodyType)?.label ?? ''
  const orgLabel = scenario.orgOptions.find((o) => o.id === answer.org)?.label ?? ''
  const standardLabel = scenario.standardOptions.find((o) => o.id === answer.standard)?.label ?? ''

  return (
    <div className="space-y-6">
      {/* Score tracker */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Work through each scenario. Choose the correct body type, organization, and standard.
        </div>
        <div className="text-sm font-semibold text-foreground bg-muted/50 rounded-lg px-3 py-1.5 border border-border shrink-0">
          {correctCount} / {WORKSHOP_SCENARIOS.length} correct &bull; {submittedCount} answered
        </div>
      </div>

      {/* Scenario stepper */}
      <div className="flex gap-2 flex-wrap">
        {WORKSHOP_SCENARIOS.map((s, idx) => {
          const ans = localAnswers[idx]
          const isCurrent = idx === currentIdx
          return (
            <button
              key={s.id}
              onClick={() => setCurrentIdx(idx)}
              className={`w-9 h-9 rounded-full border-2 text-sm font-bold transition-colors flex items-center justify-center
                ${
                  isCurrent
                    ? 'border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)]'
                    : ans.submitted && ans.correct
                      ? 'border-status-success text-status-success bg-status-success/10'
                      : ans.submitted && !ans.correct
                        ? 'border-status-error text-status-error bg-status-error/10'
                        : 'border-border text-muted-foreground'
                }`}
            >
              {ans.submitted ? (ans.correct ? '✓' : '✗') : idx + 1}
            </button>
          )
        })}
      </div>

      {/* Scenario card */}
      <div className="space-y-5">
        {/* Situation */}
        <div className="bg-muted/40 rounded-lg p-4 border border-border space-y-1.5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Scenario {currentIdx + 1} of {WORKSHOP_SCENARIOS.length}
          </div>
          <p className="text-sm text-foreground leading-relaxed">{scenario.situation}</p>
        </div>

        {/* Question */}
        <div>
          <p className="text-base font-semibold text-foreground">{scenario.question}</p>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-foreground">Body Type</div>
            <FilterDropdown
              items={scenario.bodyTypeOptions.map((o) => ({ id: o.id, label: o.label }))}
              selectedId={answer.bodyType}
              onSelect={(id) => !isSubmitted && updateAnswer({ bodyType: id })}
              defaultLabel="Select type..."
              className={
                isSubmitted
                  ? answer.bodyType === scenario.correctBodyType
                    ? 'pointer-events-none opacity-80'
                    : 'pointer-events-none opacity-80'
                  : ''
              }
            />
            {isSubmitted && (
              <div className="flex items-center gap-1 text-xs">
                {answer.bodyType === scenario.correctBodyType ? (
                  <>
                    <CheckCircle2 size={12} className="text-status-success" />
                    <span className="text-status-success">
                      {bodyTypeLabel || scenario.correctBodyType}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={12} className="text-status-error" />
                    <span className="text-status-error line-through mr-1">{bodyTypeLabel}</span>
                    <span className="text-status-success">
                      →{' '}
                      {scenario.bodyTypeOptions.find((o) => o.id === scenario.correctBodyType)
                        ?.label ?? scenario.correctBodyType}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-foreground">Organization</div>
            <FilterDropdown
              items={scenario.orgOptions.map((o) => ({ id: o.id, label: o.label }))}
              selectedId={answer.org}
              onSelect={(id) => !isSubmitted && updateAnswer({ org: id })}
              defaultLabel="Select org..."
              className={isSubmitted ? 'pointer-events-none opacity-80' : ''}
            />
            {isSubmitted && (
              <div className="flex items-center gap-1 text-xs">
                {answer.org === scenario.correctOrg ? (
                  <>
                    <CheckCircle2 size={12} className="text-status-success" />
                    <span className="text-status-success">{orgLabel || scenario.correctOrg}</span>
                  </>
                ) : (
                  <>
                    <XCircle size={12} className="text-status-error" />
                    <span className="text-status-error line-through mr-1">{orgLabel}</span>
                    <span className="text-status-success">
                      →{' '}
                      {scenario.orgOptions.find((o) => o.id === scenario.correctOrg)?.label ??
                        scenario.correctOrg}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-foreground">Standard / Framework</div>
            <FilterDropdown
              items={scenario.standardOptions.map((o) => ({ id: o.id, label: o.label }))}
              selectedId={answer.standard}
              onSelect={(id) => !isSubmitted && updateAnswer({ standard: id })}
              defaultLabel="Select standard..."
              className={isSubmitted ? 'pointer-events-none opacity-80' : ''}
            />
            {isSubmitted && (
              <div className="flex items-center gap-1 text-xs">
                {answer.standard === scenario.correctStandard ? (
                  <>
                    <CheckCircle2 size={12} className="text-status-success" />
                    <span className="text-status-success">
                      {standardLabel || scenario.correctStandard}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={12} className="text-status-error" />
                    <span className="text-status-error line-through mr-1">{standardLabel}</span>
                    <span className="text-status-success">
                      →{' '}
                      {scenario.standardOptions.find((o) => o.id === scenario.correctStandard)
                        ?.label ?? scenario.correctStandard}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit / reset */}
        {!isSubmitted ? (
          <Button
            variant="outline"
            size="sm"
            disabled={!canSubmit}
            onClick={submitAnswer}
            className="w-full sm:w-auto"
          >
            Check Answer
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Brief feedback */}
            <div
              className={`rounded-lg p-3 border text-sm ${
                answer.correct
                  ? 'bg-status-success/10 border-status-success/30 text-status-success'
                  : 'bg-status-error/10 border-status-error/30 text-status-error'
              }`}
            >
              {answer.correct ? '✓ Correct! ' : '✗ Not quite. '}
              <span className={answer.correct ? 'text-status-success' : 'text-muted-foreground'}>
                {scenario.briefFeedback}
              </span>
            </div>

            {/* Detailed explanation */}
            <div className="bg-muted/40 rounded-lg p-4 border border-border space-y-1.5">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Detailed Explanation
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {scenario.detailedExplanation}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={resetAnswer}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Try again
              </button>
              {currentIdx < WORKSHOP_SCENARIOS.length - 1 && (
                <Button variant="outline" size="sm" onClick={() => setCurrentIdx((i) => i + 1)}>
                  Next Scenario →
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Final score summary */}
      {submittedCount === WORKSHOP_SCENARIOS.length && (
        <div
          className={`rounded-lg p-4 border text-center ${
            correctCount === WORKSHOP_SCENARIOS.length
              ? 'bg-status-success/10 border-status-success/30'
              : 'bg-muted/50 border-border'
          }`}
        >
          <div className="text-lg font-bold text-foreground mb-1">
            {correctCount} / {WORKSHOP_SCENARIOS.length} Scenarios Correct
          </div>
          {correctCount === WORKSHOP_SCENARIOS.length ? (
            <p className="text-sm text-status-success">
              Excellent! You can reliably identify which bodies create standards, which certify
              products, and which mandate compliance across regions.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Review the explanations for the scenarios you missed. Focus on the difference between
              who <em>writes</em> a standard vs who <em>certifies</em> against it vs who{' '}
              <em>mandates</em> it.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
