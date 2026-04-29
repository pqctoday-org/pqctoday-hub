// SPDX-License-Identifier: GPL-3.0-only
import { Suspense, useEffect } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { BUSINESS_TOOLS } from './businessToolsRegistry'
import { BUSINESS_TOOL_COMPONENTS } from './businessToolComponents'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { useAchievementStore } from '@/store/useAchievementStore'
import { logBusinessToolOpen } from '@/utils/analytics'

export const BusinessToolRoute = () => {
  const { toolId } = useParams<{ toolId: string }>()
  const navigate = useNavigate()

  const tool = toolId ? BUSINESS_TOOLS.find((t) => t.id === toolId) : null

  useEffect(() => {
    if (tool) {
      logBusinessToolOpen(tool.id, tool.name)
      useAchievementStore.getState().recordBusinessToolUsage(tool.id)
    }
  }, [tool])

  if (!tool) return <Navigate to="/business/tools" replace />

  const handleBack = () => navigate('/business/tools')

  const Comp = toolId ? BUSINESS_TOOL_COMPONENTS[toolId] : undefined

  const resourceDetails = `**Tool:** ${tool.name}\n**Category:** ${tool.category}`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          All Tools
        </Button>
        <span className="text-sm text-muted-foreground">
          {tool.category} / {tool.name}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <EndorseButton
            endorseUrl={buildEndorsementUrl({
              category: 'pqc-tool-endorsement',
              title: `Endorse: ${tool.name}`,
              resourceType: 'Business Tool',
              resourceId: tool.id,
              resourceDetails,
              pageUrl: `/business/tools/${tool.id}`,
            })}
            resourceLabel={tool.id}
            resourceType="business-tool"
            variant="icon"
          />
          <FlagButton
            flagUrl={buildFlagUrl({
              category: 'pqc-tool-endorsement',
              title: `Flag: ${tool.name}`,
              resourceType: 'Business Tool',
              resourceId: tool.id,
              resourceDetails,
              pageUrl: `/business/tools/${tool.id}`,
            })}
            resourceLabel={tool.id}
            resourceType="business-tool"
            variant="icon"
          />
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        }
      >
        {Comp && <Comp />}
      </Suspense>
    </div>
  )
}
