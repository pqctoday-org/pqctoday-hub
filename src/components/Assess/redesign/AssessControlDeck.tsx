// SPDX-License-Identifier: GPL-3.0-only
//
// Always-visible control deck for the Assess redesign: a Fast/Full segmented
// track toggle + a per-screen context line + (on fast track during the wizard)
// a gold "switch to full track" upgrade pill.
import React from 'react'
import { Zap, ClipboardCheck, Lock } from 'lucide-react'
import { Button } from '../../ui/button'
import type { AssessmentMode } from '../../../store/useAssessmentStore'
import { TRACK_INFO } from './assessFlowModel'

interface AssessControlDeckProps {
  mode: AssessmentMode
  onSetMode: (mode: AssessmentMode) => void
  /** Context line, e.g. "Choose how deep to go" / "Step 3 of 13". */
  context: string
  /** Show the gold fast→full upgrade pill (fast track, during the wizard). */
  showUpgrade?: boolean
}

const segClasses = (active: boolean) =>
  [
    'h-auto min-h-[44px] md:min-h-0 gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-bold',
    active
      ? 'bg-primary text-primary-foreground hover:bg-primary'
      : 'bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground',
  ].join(' ')

export const AssessControlDeck: React.FC<AssessControlDeckProps> = ({
  mode,
  onSetMode,
  context,
  showUpgrade = false,
}) => {
  const isFast = mode === 'quick'
  const info = isFast ? TRACK_INFO.quick : TRACK_INFO.comprehensive

  return (
    <div className="glass-panel mb-4 flex flex-wrap items-center gap-4 px-3.5 py-2.5">
      <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
        <span className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
          Track
        </span>
        <div
          className="inline-flex gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5"
          role="tablist"
          aria-label="Assessment track"
        >
          <Button
            variant="ghost"
            role="tab"
            aria-selected={isFast}
            onClick={() => onSetMode('quick')}
            className={segClasses(isFast)}
          >
            <Zap size={13} />
            {TRACK_INFO.quick.label}
          </Button>
          <Button
            variant="ghost"
            role="tab"
            aria-selected={!isFast}
            onClick={() => onSetMode('comprehensive')}
            className={segClasses(!isFast)}
          >
            <ClipboardCheck size={13} />
            {TRACK_INFO.comprehensive.label}
          </Button>
        </div>
        <span className="basis-full font-mono text-[11px] text-muted-foreground sm:basis-auto">
          {info.count} questions · ~{info.minutes} min
        </span>
      </div>

      <div className="h-6 w-px bg-border hidden sm:block" />

      <span className="text-xs font-semibold text-muted-foreground">{context}</span>

      {showUpgrade && (
        <Button
          variant="ghost"
          onClick={() => onSetMode('comprehensive')}
          className="ml-auto h-auto min-h-[44px] md:min-h-0 gap-2 rounded-lg border border-status-warning/40 bg-status-warning/10 px-3 py-1.5 text-xs font-bold text-status-warning hover:bg-status-warning/15 hover:text-status-warning"
        >
          <Lock size={14} />
          Switch to full track
          <span className="hidden sm:inline"> — unlocks the complete report</span> →
        </Button>
      )}
    </div>
  )
}
