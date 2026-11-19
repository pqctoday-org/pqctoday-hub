// SPDX-License-Identifier: AGPL-3.0-only
import React, { useContext } from 'react'
import { Button } from '@/components/ui/button'
import { EndorseButton } from '@/components/ui/EndorseButton'
import { FlagButton } from '@/components/ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { useModuleStore } from '@/store/useModuleStore'
import { MODULE_CATALOG } from '../moduleData'
import { WorkshopStepper, type WorkshopStep } from './WorkshopStepper'
import { WorkshopEvidenceNavigation } from './workshopEvidenceNavigation'

interface WorkshopStepHeaderProps {
  moduleId: string
  stepId: string
  stepTitle: string
  titleRef?: React.Ref<HTMLHeadingElement>
  stepDescription: string
  stepIndex: number
  totalSteps: number
  /** `?step=` value for this step's share links when it differs from
   *  stepIndex — i.e. when a learn path hides some steps, so the displayed
   *  position is not the module's step index. Defaults to stepIndex. */
  deepLinkStep?: number
  cswp39Step?: string
  /** Full step definitions — enables labeled WorkshopStepper. When omitted, an
   *  anonymous dot indicator is rendered using stepIndex / totalSteps. */
  steps?: WorkshopStep[]
  /** IDs of already-completed steps (passed through to WorkshopStepper). */
  completedSteps?: string[]
  /** Allows clicking a previous step to navigate back. */
  onStepClick?: (index: number) => void
}

export const WorkshopStepHeader: React.FC<WorkshopStepHeaderProps> = ({
  moduleId,
  stepId,
  stepTitle,
  titleRef,
  stepDescription,
  stepIndex,
  totalSteps,
  deepLinkStep,
  cswp39Step,
  steps,
  completedSteps,
  onStepClick,
}) => {
  const openWorksheet = useContext(WorkshopEvidenceNavigation)
  const moduleMeta = MODULE_CATALOG[moduleId] // eslint-disable-line security/detect-object-injection
  const moduleTitle = moduleMeta?.title ?? moduleId

  const resourceDetails = [
    `**Module:** ${moduleTitle}`,
    `**Workshop Step:** ${stepTitle} (${stepIndex + 1} of ${totalSteps})`,
    `**Description:** ${stepDescription}`,
  ].join('\n')
  const pageUrl = `/learn/${moduleId}?tab=workshop&step=${deepLinkStep ?? stepIndex}`

  const endorseUrl = buildEndorsementUrl({
    category: 'learn-module-endorsement',
    title: `Endorse: ${moduleTitle} — ${stepTitle}`,
    resourceType: 'Workshop Step',
    resourceId: `${moduleId}/${stepId}`,
    resourceDetails,
    pageUrl,
  })

  const flagUrl = buildFlagUrl({
    category: 'learn-module-endorsement',
    title: `Flag: ${moduleTitle} — ${stepTitle}`,
    resourceType: 'Workshop Step',
    resourceId: `${moduleId}/${stepId}`,
    resourceDetails,
    pageUrl,
  })

  const resourceLabel = `${moduleTitle} — ${stepTitle}`

  // Build anonymous steps from totalSteps when named steps aren't provided
  const resolvedSteps: WorkshopStep[] =
    steps ??
    Array.from({ length: totalSteps }, (_, i) => ({
      id: String(i),
      label: `Step ${i + 1}`,
    }))

  const savedCompletedSteps = useModuleStore((state) => state.modules[moduleId]?.completedSteps)
  const resolvedCompleted = completedSteps ?? savedCompletedSteps

  return (
    <div className="mb-6 border-b border-border pb-4">
      <div className="flex items-start justify-between gap-2">
        <h2
          ref={titleRef}
          tabIndex={titleRef ? -1 : undefined}
          className="text-2xl font-bold text-foreground break-words min-w-0 scroll-mt-28"
        >
          {stepTitle}
        </h2>
        <div className="flex items-center gap-1 shrink-0">
          <EndorseButton
            endorseUrl={endorseUrl}
            resourceLabel={resourceLabel}
            resourceType="Workshop Step"
          />
          <FlagButton
            flagUrl={flagUrl}
            resourceLabel={resourceLabel}
            resourceType="Workshop Step"
          />
        </div>
      </div>
      <p className="text-muted-foreground break-words">{stepDescription}</p>
      {cswp39Step && (
        <div className="mt-1.5">
          <span className="text-[10px] bg-status-info/10 text-status-info border border-status-info/30 px-2 py-0.5 rounded font-medium">
            CSWP.39 Process: {cswp39Step}
          </span>
        </div>
      )}
      {totalSteps > 1 && (
        <WorkshopStepper
          steps={resolvedSteps}
          currentStep={stepIndex}
          completedSteps={resolvedCompleted}
          onStepClick={onStepClick}
          className="mt-3"
        />
      )}
      {openWorksheet && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 min-h-11 scroll-mt-24"
          aria-controls="production-evidence-worksheet"
          onClick={(event) => openWorksheet(event.currentTarget)}
        >
          Record production evidence
        </Button>
      )}
    </div>
  )
}
