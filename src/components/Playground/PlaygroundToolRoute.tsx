// SPDX-License-Identifier: GPL-3.0-only
import React, { Suspense } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { WORKSHOP_TOOLS, TOOL_COMPONENTS, ONBACK_COMPONENTS } from './workshopRegistry'

export const PlaygroundToolRoute = () => {
  const { toolId } = useParams<{ toolId: string }>()
  const navigate = useNavigate()

  const tool = toolId ? WORKSHOP_TOOLS.find((t) => t.id === toolId) : null

  // Unknown toolId → back to workshop grid
  if (!tool) return <Navigate to="/playground" replace />

  const handleBack = () => navigate('/playground')

  const isOnBack = toolId ? toolId in ONBACK_COMPONENTS : false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp: React.ComponentType<any> | undefined = isOnBack
    ? ONBACK_COMPONENTS[toolId!]
    : TOOL_COMPONENTS[toolId!]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          All Tools
        </Button>
        <span className="text-sm text-muted-foreground">
          {tool.category} / {tool.name}
        </span>
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
        {Comp && (isOnBack ? <Comp onBack={handleBack} /> : <Comp />)}
      </Suspense>
    </div>
  )
}
