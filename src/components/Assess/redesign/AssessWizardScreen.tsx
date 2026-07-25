// SPDX-License-Identifier: GPL-3.0-only
//
// The wizard screen — control deck + two-pane (step rail + question pane), driven
// by useAssessFlow. Rendered only when a track is active, so the hook is always
// called unconditionally.
import React from 'react'
import { AssessControlDeck } from './AssessControlDeck'
import { AssessStepRail } from './AssessStepRail'
import { AssessQuestionPane } from './AssessQuestionPane'
import { useAssessFlow } from './useAssessFlow'
import type { AssessTrack } from './assessFlowModel'
import type { SetURLSearchParams } from 'react-router'

interface AssessWizardScreenProps {
  mode: AssessTrack
  onComplete: () => void
  onExitToChooser: () => void
  onSwitchTrack: (mode: AssessTrack) => void
  /** Embed-isolated URL params, threaded to useAssessFlow so ?step doesn't leak
   *  to the /simulation route when the wizard runs inside the sim embed. */
  searchParams?: URLSearchParams
  setSearchParams?: SetURLSearchParams
}

export const AssessWizardScreen: React.FC<AssessWizardScreenProps> = ({
  mode,
  onComplete,
  onExitToChooser,
  onSwitchTrack,
  searchParams,
  setSearchParams,
}) => {
  const flow = useAssessFlow({ mode, onLastStep: onComplete, searchParams, setSearchParams })

  return (
    <>
      <AssessControlDeck
        mode={mode}
        onSetMode={onSwitchTrack}
        context={`Step ${flow.stepIdx + 1} of ${flow.total}`}
        showUpgrade={mode === 'quick'}
      />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <AssessStepRail
          flow={flow}
          mode={mode}
          onSwitchToFull={() => onSwitchTrack('comprehensive')}
        />
        <AssessQuestionPane flow={flow} onExitToChooser={onExitToChooser} />
      </div>
    </>
  )
}
