// SPDX-License-Identifier: GPL-3.0-only
import React, { Suspense, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Navigate, Link } from 'react-router-dom'
import { ArrowLeft, Wrench, ArrowRight } from 'lucide-react'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { WORKSHOP_TOOLS, TOOL_COMPONENTS, ONBACK_COMPONENTS } from './workshopRegistry'
import { useAchievementStore } from '@/store/useAchievementStore'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { HistoryButton } from '../ui/HistoryButton'

export const PlaygroundToolRoute = () => {
  const { toolId } = useParams<{ toolId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // 5G SUCI deep-link params
  const profileParam = searchParams.get('profile')
  const pqcModeParam = searchParams.get('pqcMode')
  const suciProfile =
    profileParam === 'A' || profileParam === 'B' || profileParam === 'C'
      ? (profileParam as 'A' | 'B' | 'C')
      : undefined
  const suciPqcMode =
    pqcModeParam === 'hybrid' || pqcModeParam === 'pure'
      ? (pqcModeParam as 'hybrid' | 'pure')
      : undefined

  const tool = toolId ? WORKSHOP_TOOLS.find((t) => t.id === toolId) : null

  useEffect(() => {
    if (tool) useAchievementStore.getState().recordPlaygroundToolUsage(tool.id)
  }, [tool])

  // Unknown toolId → back to workshop grid
  if (!tool) return <Navigate to="/playground" replace />

  const handleBack = () => navigate('/playground')

  const isOnBack = toolId ? toolId in ONBACK_COMPONENTS : false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp: React.ComponentType<any> | undefined = isOnBack
    ? ONBACK_COMPONENTS[toolId!]
    : TOOL_COMPONENTS[toolId!]

  const resourceDetails = `**Tool:** ${tool.name}\n**Category:** ${tool.category}`

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
        <div className="ml-auto flex items-center gap-1">
          <EndorseButton
            endorseUrl={buildEndorsementUrl({
              category: 'pqc-tool-endorsement',
              title: `Endorse: ${tool.name}`,
              resourceType: 'Playground Tool',
              resourceId: tool.id,
              resourceDetails,
              pageUrl: `/playground/${tool.id}`,
            })}
            resourceLabel={tool.id}
            resourceType="playground-tool"
            variant="icon"
          />
          <FlagButton
            flagUrl={buildFlagUrl({
              category: 'pqc-tool-endorsement',
              title: `Flag: ${tool.name}`,
              resourceType: 'Playground Tool',
              resourceId: tool.id,
              resourceDetails,
              pageUrl: `/playground/${tool.id}`,
            })}
            resourceLabel={tool.id}
            resourceType="playground-tool"
            variant="icon"
          />
          <HistoryButton
            itemId={tool.id}
            trackingId={tool.pt_id}
            itemLabel={`${tool.pt_id} · ${tool.id}`}
            version={tool.version}
          />
        </div>
      </div>

      {tool.wip && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-warning/10 border border-status-warning/30 text-status-warning text-sm">
          <Wrench className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            This tool is under active development — functionality may be incomplete or subject to
            change.
          </span>
        </div>
      )}

      <Suspense
        fallback={
          <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        }
      >
        {Comp &&
          (isOnBack ? (
            toolId === 'suci-flow' ? (
              <Comp onBack={handleBack} initialProfile={suciProfile} initialPqcMode={suciPqcMode} />
            ) : (
              <Comp onBack={handleBack} />
            )
          ) : (
            <Comp />
          ))}
      </Suspense>

      <NextToolSuggestion currentToolId={tool.id} currentCategory={tool.category} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// NextToolSuggestion — "up next" CTA at bottom of each tool
// ---------------------------------------------------------------------------

function NextToolSuggestion({
  currentToolId,
  currentCategory,
}: {
  currentToolId: string
  currentCategory: string
}) {
  const sameCat = WORKSHOP_TOOLS.filter(
    (t) => t.category === currentCategory && t.id !== currentToolId && !t.wip
  )
  // Pick up to 2: prefer the tool immediately after in category order, then one more
  const suggestions = sameCat.slice(0, 2)
  if (suggestions.length === 0) return null

  return (
    <div className="mt-8 pt-6 border-t border-border/50">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Next in {currentCategory}
      </p>
      <div className="flex flex-wrap gap-3">
        {suggestions.map((t) => {
          const Icon = t.icon
          return (
            <Link
              key={t.id}
              to={`/playground/${t.id}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card/50 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
            >
              <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {t.name}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary ml-1 shrink-0 transition-colors" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
