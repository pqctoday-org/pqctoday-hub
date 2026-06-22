// SPDX-License-Identifier: GPL-3.0-only
//
// Review screen — every answer grouped by domain, editable, with recommended
// defaults flagged, before the report is generated.
import React from 'react'
import { ChevronLeft, FileBarChart } from 'lucide-react'
import { Button } from '../../ui/button'
import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { DOMAIN_META, TONES } from './tones'
import {
  renderOrderFor,
  STEP_META,
  STEP_VALIDATORS,
  type AssessStepKey,
  type AssessTrack,
} from './assessFlowModel'
import { summarizeAnswer, type AssessReviewState } from './reviewModel'

interface AssessReviewProps {
  mode: AssessTrack
  onEdit: (key: AssessStepKey) => void
  onBack: () => void
  onGenerate: () => void
}

export const AssessReview: React.FC<AssessReviewProps> = ({ mode, onEdit, onBack, onGenerate }) => {
  const store = useAssessmentStore()
  const reviewState = store as unknown as AssessReviewState
  const renderOrder = renderOrderFor(mode)
  const answered = renderOrder.filter(
    (k) => STEP_VALIDATORS[k](store) && !STEP_META[k].freelyOptional
  ).length
  const requiredTotal = renderOrder.filter((k) => !STEP_META[k].freelyOptional).length

  // Group the render order into its three contiguous domains.
  const groups: { domain: (typeof STEP_META)[AssessStepKey]['domain']; keys: AssessStepKey[] }[] =
    []
  renderOrder.forEach((key) => {
    const domain = STEP_META[key].domain
    const last = groups[groups.length - 1]
    if (last && last.domain === domain) last.keys.push(key)
    else groups.push({ domain, keys: [key] })
  })

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="glass-panel p-5 sm:p-6">
        <h2 className="mb-1 text-xl font-bold text-foreground">Review your answers</h2>
        <p className="mb-5 text-[12.5px] text-muted-foreground">
          Edit anything before we generate your {mode === 'quick' ? 'fast-track' : 'full'} report.{' '}
          {answered} of {requiredTotal} answered.
        </p>

        {groups.map((group) => {
          const meta = DOMAIN_META[group.domain]
          return (
            <div key={group.domain} className="mb-5">
              <div
                className={`mb-2 text-[10px] font-bold uppercase tracking-wide ${TONES[meta.tone].text}`}
              >
                {meta.label}
              </div>
              <div className="flex flex-col gap-2">
                {group.keys.map((key) => {
                  const summary = summarizeAnswer(key, reviewState)
                  return (
                    <div
                      key={key}
                      className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-3.5 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-semibold text-foreground/90">
                          {STEP_META[key].question}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{summary.text}</div>
                      </div>
                      {summary.isDefault && (
                        <span className="mt-0.5 shrink-0 rounded-full bg-secondary/15 px-1.5 py-0.5 text-[9px] font-bold text-secondary">
                          Recommended
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(key)}
                        className="h-auto shrink-0 px-2.5 py-1 text-[11px] text-primary"
                      >
                        Edit
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div className="mt-1 flex items-center gap-3 border-t border-border pt-4">
          <Button variant="outline" onClick={onBack} className="gap-1.5">
            <ChevronLeft size={15} />
            Back
          </Button>
          <Button
            variant="gradient"
            onClick={onGenerate}
            data-workshop-target="assess-generate"
            className="ml-auto gap-2 font-bold"
          >
            <FileBarChart size={16} />
            Generate my report
          </Button>
        </div>
      </div>
    </div>
  )
}
