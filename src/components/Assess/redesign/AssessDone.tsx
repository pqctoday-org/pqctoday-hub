// SPDX-License-Identifier: GPL-3.0-only
//
// Completion screen — hands off to the report; on fast track it foreshadows the
// 4 locked sections with the gold fast→full upgrade affordance.
import React from 'react'
import { Check, Lock, RotateCcw, FileBarChart } from 'lucide-react'
import { Button } from '../../ui/button'
import { FAST_LOCKED_COUNT } from './reportContract'
import type { AssessTrack } from './assessFlowModel'

interface AssessDoneProps {
  mode: AssessTrack
  onViewReport: () => void
  onRetake: () => void
  /** Fast track only — resume into the full track at the first full-only question. */
  onContinueToFull: () => void
}

export const AssessDone: React.FC<AssessDoneProps> = ({
  mode,
  onViewReport,
  onRetake,
  onContinueToFull,
}) => {
  const isFast = mode === 'quick'

  return (
    <div className="mx-auto max-w-[620px] pt-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-status-success/40 bg-status-success/10">
        <Check className="text-status-success" size={30} strokeWidth={2.4} />
      </div>
      <h2 className="mb-1.5 text-[23px] font-bold text-foreground">Assessment complete</h2>
      <p className="mx-auto mb-5 max-w-[460px] text-[13.5px] leading-relaxed text-muted-foreground">
        {isFast
          ? 'Your fast-track report is ready — risk score, key findings, threat landscape, assessment profile, compliance impact and recommended actions.'
          : 'Your full report is ready — every section unlocked, including the per-domain breakdown, algorithm migration map, dated roadmap and progress trending.'}
      </p>

      {isFast && (
        <div className="mb-5 flex items-center gap-3.5 rounded-2xl border border-status-warning/30 bg-status-warning/10 p-4 text-left">
          <Lock className="shrink-0 text-status-warning" size={22} />
          <div className="flex-1">
            <div className="text-[13px] font-bold text-status-warning">
              {FAST_LOCKED_COUNT} report sections are still locked
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Per-domain scores, your algorithm migration map, the dated roadmap &amp; progress
              trending unlock with 5 more questions.
            </p>
          </div>
          <Button variant="gradient" onClick={onContinueToFull} className="shrink-0 font-bold">
            Continue →
          </Button>
        </div>
      )}

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={onRetake} className="gap-1.5">
          <RotateCcw size={14} />
          Retake
        </Button>
        <Button variant="gradient" onClick={onViewReport} className="gap-2 font-bold">
          <FileBarChart size={16} />
          View my risk report
        </Button>
      </div>
    </div>
  )
}
