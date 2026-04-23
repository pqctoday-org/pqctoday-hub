// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { EndorseButton } from '@/components/ui/EndorseButton'
import { FlagButton } from '@/components/ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { MODULE_CATALOG } from '../moduleData'

interface WorkshopStepHeaderProps {
  moduleId: string
  stepId: string
  stepTitle: string
  stepDescription: string
  stepIndex: number
  totalSteps: number
  cswp39Step?: string
}

export const WorkshopStepHeader: React.FC<WorkshopStepHeaderProps> = ({
  moduleId,
  stepId,
  stepTitle,
  stepDescription,
  stepIndex,
  totalSteps,
  cswp39Step,
}) => {
  const moduleMeta = MODULE_CATALOG[moduleId] // eslint-disable-line security/detect-object-injection
  const moduleTitle = moduleMeta?.title ?? moduleId

  const resourceDetails = [
    `**Module:** ${moduleTitle}`,
    `**Workshop Step:** ${stepTitle} (${stepIndex + 1} of ${totalSteps})`,
    `**Description:** ${stepDescription}`,
  ].join('\n')
  const pageUrl = `/learn/${moduleId}?tab=workshop&step=${stepIndex}`

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

  return (
    <div className="mb-6 border-b border-border pb-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-2xl font-bold text-foreground break-words min-w-0">{stepTitle}</h2>
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
    </div>
  )
}
