// SPDX-License-Identifier: GPL-3.0-only
import { CSWP39StepCard } from '@/components/Compliance/CSWP39StepCard'
import { CSWP39_CROSS_WALK, type CSWP39Step } from '@/components/Compliance/cswp39Data'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'
import type { BusinessMetrics } from '../hooks/useBusinessMetrics'
import {
  STEP_ARTIFACT_TYPES,
  getArtifactsForStep,
  getPillarForType,
  orderByFeatured,
} from '../lib/cswp39StepMapping'
import { computeStepTiers, type CSWP39StepId } from '../lib/cswp39Tier'
import { ArtifactCard, ArtifactPlaceholder } from '../ArtifactCard'
import { TierBadge } from '../widgets/TierBadge'
import { RecommendedResourcesPanel } from '../widgets/RecommendedResourcesPanel'

export interface CSWP39StepSectionProps {
  step: CSWP39Step
  metrics: BusinessMetrics
  defaultOpen?: boolean
  featuredArtifacts?: ExecutiveDocumentType[]
  onViewArtifact: (doc: ExecutiveDocument) => void
  onEditArtifact: (doc: ExecutiveDocument) => void
  onDeleteArtifact: (doc: ExecutiveDocument) => void
  onRenameArtifact?: (id: string, newTitle: string) => void
  onCreateArtifact: (type: ExecutiveDocumentType) => void
  onNavigateToFramework: (
    targetTab: 'standards' | 'technical' | 'certification' | 'compliance',
    searchQuery: string
  ) => void
}

export function CSWP39StepSection({
  step,
  metrics,
  defaultOpen,
  featuredArtifacts,
  onViewArtifact,
  onEditArtifact,
  onDeleteArtifact,
  onRenameArtifact,
  onCreateArtifact,
  onNavigateToFramework,
}: CSWP39StepSectionProps) {
  const stepId = step.id as CSWP39StepId
  const crossWalk = CSWP39_CROSS_WALK.find((cw) => cw.stepId === stepId)
  const tierResult = computeStepTiers(metrics)[stepId]
  const artifacts = orderByFeatured(getArtifactsForStep(metrics, stepId), featuredArtifacts)
  const stepTypes = STEP_ARTIFACT_TYPES[stepId]
  const existingTypes = new Set(artifacts.map((a) => a.type))
  const missingTypes = stepTypes.filter((t) => !existingTypes.has(t))

  return (
    <div id={`step-${stepId}`}>
      <CSWP39StepCard
        step={step}
        crossWalk={crossWalk}
        onFrameworkChipClick={onNavigateToFramework}
        tierBadge={<TierBadge result={tierResult} />}
        defaultOpen={defaultOpen}
      >
        {(artifacts.length > 0 || missingTypes.length > 0) && (
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Artifacts
            </div>
            <div className="space-y-1.5">
              {artifacts.map((doc) => (
                <ArtifactCard
                  key={doc.id}
                  document={doc}
                  pillar={getPillarForType(doc.type)}
                  onView={onViewArtifact}
                  onEdit={onEditArtifact}
                  onDelete={onDeleteArtifact}
                  onRename={onRenameArtifact}
                />
              ))}
              {missingTypes.map((type) => (
                <ArtifactPlaceholder
                  key={type}
                  type={type}
                  pillar={getPillarForType(type)}
                  onCreate={onCreateArtifact}
                />
              ))}
            </div>
          </div>
        )}
        <RecommendedResourcesPanel stepId={stepId} />
      </CSWP39StepCard>
    </div>
  )
}
