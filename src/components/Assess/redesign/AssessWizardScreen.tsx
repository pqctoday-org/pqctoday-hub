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

interface AssessWizardScreenProps {
  mode: AssessTrack
  onComplete: () => void
  onExitToChooser: () => void
  onSwitchTrack: (mode: AssessTrack) => void
}

export const AssessWizardScreen: React.FC<AssessWizardScreenProps> = ({
  mode,
  onComplete,
  onExitToChooser,
  onSwitchTrack,
}) => {
  const flow = useAssessFlow({ mode, onLastStep: onComplete })

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
