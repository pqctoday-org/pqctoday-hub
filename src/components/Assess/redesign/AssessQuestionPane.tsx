// SPDX-License-Identifier: GPL-3.0-only
//
// The question pane — domain tag + heading + the single assist strip + the real
// (slot-prop-suppressed) step body + footer control deck. Reuses the legacy step
// components for the option grids so all dynamic data logic is preserved.
import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Info,
  AlertCircle,
  RotateCcw,
  Link2,
  ArrowRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../../ui/button'
import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { logAssessReset } from '../../../utils/analytics'
import { CSWP39StepBadge } from '../../shared/CSWP39StepBadge'
import { ASSESS_STEP_TO_CSWP39 } from '../../../data/assessStepToCswp39'
import { StepPersonaInfoModal } from '../steps/StepPersonaInfoModal'
import { DOMAIN_META, pillClasses } from './tones'
import { STEP_META } from './assessFlowModel'
import { STEP_COMPONENTS } from './stepRegistry'
import { AssessAssistStrip } from './AssessAssistStrip'
import type { AssessFlow } from './useAssessFlow'

interface AssessQuestionPaneProps {
  flow: AssessFlow
  /** Back from the first step returns to the chooser. */
  onExitToChooser: () => void
}

export const AssessQuestionPane: React.FC<AssessQuestionPaneProps> = ({
  flow,
  onExitToChooser,
}) => {
  const { activeKey, stepIdx, total, attempted, canProceed } = flow
  const reset = useAssessmentStore((s) => s.reset)
  const [infoOpen, setInfoOpen] = useState(false)

  const meta = STEP_META[activeKey]
  const domain = DOMAIN_META[meta.domain]
  const StepBody = STEP_COMPONENTS[activeKey]
  // eslint-disable-next-line security/detect-object-injection
  const cswp = ASSESS_STEP_TO_CSWP39[activeKey]
  const isLast = stepIdx === total - 1

  const saveLink = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('step', String(stepIdx))
    navigator.clipboard.writeText(url.toString())
    toast.success('Resume link copied — your answers are saved on this device')
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3.5">
      <div className="glass-panel p-5 sm:p-6">
        {/* Tag row */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={pillClasses(domain.tone)}>{domain.label}</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            Step {stepIdx + 1} / {total}
          </span>
          {meta.freelyOptional && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
              Optional
            </span>
          )}
          {cswp && (
            <CSWP39StepBadge
              stepId={cswp}
              hint={`This wizard step feeds the CSWP.39 ${cswp} step on the Command Center.`}
            />
          )}
          <Button
            variant="ghost"
            onClick={() => setInfoOpen(true)}
            className="ml-auto h-auto rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
            aria-label="How this step is personalized"
            title="How this step is personalized"
          >
            <Info size={14} />
          </Button>
        </div>

        <h2 className="mb-1.5 text-[21px] font-bold tracking-tight text-foreground">
          {meta.question}
        </h2>
        <p className="mb-2 text-[13px] leading-relaxed text-muted-foreground">{meta.subtitle}</p>
        {/* B+ remediation 4.4 (2026-08-10): what THIS answer changes downstream.
            The review's cheapest educational move — the wizard's real failure
            mode is people answering "I don't know" to the questions that matter
            most, because nothing tells them the answer is load-bearing. Kept
            above the fold and not behind the "why we ask" disclosure for
            exactly that reason. */}
        <p className="mb-4 flex items-start gap-1.5 text-[12px] leading-relaxed text-foreground/80">
          <ArrowRight size={12} aria-hidden="true" className="mt-[3px] shrink-0 text-primary" />
          <span>
            <span className="font-medium">In your report:</span> {meta.changesInReport}
          </span>
        </p>

        <AssessAssistStrip key={activeKey} why={meta.why} />

        {/* Real step body — heading + hints suppressed; options/escape hatches kept. */}
        <div className="mt-2">
          <StepBody hideHeading hideHints />
        </div>

        {attempted && !canProceed && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-status-error">
            <AlertCircle size={14} />
            Select an option to continue, or tap “I’m not sure — help me choose”.
          </div>
        )}
      </div>

      {/* Footer control deck — sticky to the bottom on mobile for thumb reach. */}
      <div className="glass-panel sticky bottom-0 z-10 flex flex-wrap items-center gap-3 px-4 py-3 lg:static">
        <Button
          variant="outline"
          onClick={() => (stepIdx === 0 ? onExitToChooser() : flow.back())}
          className="gap-1"
        >
          <ChevronLeft size={15} />
          Back
        </Button>
        <span className="font-mono text-[11px] text-muted-foreground">
          Step {stepIdx + 1} / {total}
        </span>

        <Button
          variant="ghost"
          onClick={saveLink}
          className="ml-auto h-auto gap-1 text-xs text-muted-foreground hover:text-primary"
          title="Copy a link to resume from this step"
        >
          <Link2 size={13} />
          Save link
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            logAssessReset()
            reset()
          }}
          className="h-auto gap-1 text-xs text-muted-foreground hover:text-destructive"
          title="Clear all answers and start over"
        >
          <RotateCcw size={13} />
          Reset
        </Button>
        {meta.freelyOptional && (
          <Button
            variant="ghost"
            onClick={() => flow.next()}
            className="h-auto text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground"
          >
            Skip
          </Button>
        )}
        <Button
          variant="gradient"
          onClick={() => flow.next()}
          data-workshop-target={isLast ? 'assess-submit' : 'assess-next'}
          className="gap-1.5 font-bold"
        >
          {isLast ? 'Review answers' : 'Continue'}
          <ChevronRight size={15} />
        </Button>
      </div>

      <StepPersonaInfoModal
        stepKey={activeKey}
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
      />
    </div>
  )
}
