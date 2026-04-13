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
}

export const WorkshopStepHeader: React.FC<WorkshopStepHeaderProps> = ({
  moduleId,
  stepId,
  stepTitle,
  stepDescription,
  stepIndex,
  totalSteps,
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
    <div className="mb-6 border-b border-border pb-4 relative overflow-hidden">
      <h2 className="text-2xl font-bold text-foreground pr-20 break-words">{stepTitle}</h2>
      <p className="text-muted-foreground pr-20 break-words">{stepDescription}</p>
      <div className="absolute top-0 right-0 flex items-center gap-1">
        <EndorseButton
          endorseUrl={endorseUrl}
          resourceLabel={resourceLabel}
          resourceType="Workshop Step"
        />
        <FlagButton flagUrl={flagUrl} resourceLabel={resourceLabel} resourceType="Workshop Step" />
      </div>
    </div>
  )
}
