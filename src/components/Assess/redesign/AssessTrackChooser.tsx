// SPDX-License-Identifier: GPL-3.0-only
//
// The outcome-framed track chooser — replaces the legacy ModeSelector's
// "8 questions / 13 questions" effort framing with "here's exactly which report
// sections each track unlocks". The section lists come from reportContract so
// they stay in sync with the report's gated sections.
import React from 'react'
import { Zap, ClipboardCheck, Check, Lock, Sparkles } from 'lucide-react'
import { Button } from '../../ui/button'
import type { AssessmentMode } from '../../../store/useAssessmentStore'
import { FAST_REPORT_SECTIONS, FULL_LOCKED_SECTIONS, FAST_LOCKED_COUNT } from './reportContract'
import { TRACK_INFO } from './assessFlowModel'

interface AssessTrackChooserProps {
  onStart: (mode: AssessmentMode) => void
  recommendedMode: AssessmentMode | null
}

const RecommendedPill: React.FC = () => (
  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
    Recommended for you
  </span>
)

export const AssessTrackChooser: React.FC<AssessTrackChooserProps> = ({
  onStart,
  recommendedMode,
}) => {
  const fast = TRACK_INFO.quick
  const full = TRACK_INFO.comprehensive

  return (
    <div className="grid max-w-[840px] grid-cols-1 gap-4 sm:grid-cols-2">
      {/* FAST TRACK */}
      <div className="glass-panel flex flex-col p-5">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-status-warning/15">
            <Zap className="text-status-warning" size={18} />
          </div>
          <div className="text-[17px] font-bold text-foreground">{fast.label}</div>
          {recommendedMode === 'quick' && <RecommendedPill />}
          <span className="ml-auto font-mono text-[11px] text-muted-foreground/70">
            {fast.count} Q · ~{fast.minutes} min
          </span>
        </div>
        <p className="mb-3.5 text-[12.5px] leading-relaxed text-muted-foreground">
          The essentials — industry, crypto stack, data sensitivity, infrastructure and migration
          status. Best for a first read or a quick board-ready snapshot.
        </p>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">
          Your report includes
        </div>
        <div className="mb-4 flex flex-col gap-1.5">
          {FAST_REPORT_SECTIONS.map((s) => (
            <div key={s} className="flex items-center gap-2 text-xs text-foreground/90">
              <Check className="shrink-0 text-status-success" size={13} strokeWidth={2.6} />
              {s}
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <Lock className="shrink-0" size={13} />
            {FAST_LOCKED_COUNT} sections stay locked
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => onStart('quick')}
          className="mt-auto w-full font-bold"
          data-workshop-target="assess-mode-quick"
        >
          Start fast track →
        </Button>
      </div>

      {/* FULL TRACK */}
      <div className="glass-panel relative flex flex-col border-primary/35 p-5">
        <div className="absolute -top-2.5 right-5 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-primary-foreground">
          Most complete
        </div>
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <ClipboardCheck className="text-primary" size={18} />
          </div>
          <div className="text-[17px] font-bold text-foreground">{full.label}</div>
          {recommendedMode === 'comprehensive' && <RecommendedPill />}
          <span className="ml-auto font-mono text-[11px] text-muted-foreground/70">
            {full.count} Q · ~{full.minutes} min
          </span>
        </div>
        <p className="mb-3.5 text-[12.5px] leading-relaxed text-muted-foreground">
          Everything in fast track plus use cases, retention, credential lifetimes, scale, crypto
          agility and vendor dependencies — for a credible migration plan.
        </p>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">
          Unlocks everything, including
        </div>
        <div className="mb-4 flex flex-col gap-1.5">
          {FULL_LOCKED_SECTIONS.map((s) => (
            <div key={s} className="flex items-center gap-2 text-xs text-foreground/90">
              <Sparkles className="shrink-0 text-primary" size={13} />
              {s}
            </div>
          ))}
        </div>
        <Button
          variant="gradient"
          onClick={() => onStart('comprehensive')}
          className="mt-auto w-full font-bold"
        >
          Start full track →
        </Button>
      </div>
    </div>
  )
}
