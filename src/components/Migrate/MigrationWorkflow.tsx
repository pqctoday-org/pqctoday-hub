import React, { useMemo, useState } from 'react'
import { MigrationStepIndicator } from './MigrationStepIndicator'
import { MigrationStepCard } from './MigrationStepCard'
import { MigrationReferences } from './MigrationReferences'
import { MigrationGapAnalysis } from './MigrationGapAnalysis'
import {
  MIGRATION_STEPS,
  MIGRATION_REFERENCES,
  computeGapAnalysis,
} from '../../data/migrationWorkflowData'

interface MigrationWorkflowProps {
  onViewSoftware: (categoryIds: string[]) => void
}

export const MigrationWorkflow: React.FC<MigrationWorkflowProps> = ({ onViewSoftware }) => {
  const [activeStepId, setActiveStepId] = useState<string | null>('assess')
  const gaps = useMemo(() => computeGapAnalysis(), [])

  const activeStep = MIGRATION_STEPS.find((s) => s.id === activeStepId)

  const handleStepClick = (stepId: string) => {
    setActiveStepId((prev) => (prev === stepId ? null : stepId))
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <MigrationStepIndicator
        steps={MIGRATION_STEPS}
        activeStepId={activeStepId}
        onStepClick={handleStepClick}
      />

      {/* Active Step Card */}
      {activeStep && <MigrationStepCard step={activeStep} onViewSoftware={onViewSoftware} />}

      {/* References */}
      <MigrationReferences references={MIGRATION_REFERENCES} />

      {/* Gap Analysis */}
      <MigrationGapAnalysis gaps={gaps} />
    </div>
  )
}
