// SPDX-License-Identifier: GPL-3.0-only
import { Suspense, useEffect } from 'react'
import { NextStepCard } from '@/components/shared/NextStepCard'
import { PersonaBlock } from '@/components/shared/PersonaBlock'
import { RelatedContentPanel } from '@/components/shared/RelatedContentPanel'
import { businessToolRelations } from '@/data/toolRelations'
import { useParams, useNavigate, Navigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { BUSINESS_TOOLS } from './businessToolsRegistry'
import { BUSINESS_TOOL_COMPONENTS } from './businessToolComponents'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { useAchievementStore } from '@/store/useAchievementStore'
import { logBusinessToolOpen } from '@/utils/analytics'
import { Cswp39SectionBadge } from './widgets/Cswp39SectionBadge'
import { RecommendedResourcesPanel } from './widgets/RecommendedResourcesPanel'
import { primaryStepForZone } from './lib/cswp39Tier'

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

  // Share lives ONLY in the top bar (2026-08-27 remediation) — register this
  // tool's title/text so the global ShareButton (MainLayout.tsx) shows the
  // right copy instead of the generic route fallback. The URL itself needs no
  // override: `/business/tools/${toolId}` is already the shareable deep link.
  useEffect(() => {
    if (!tool) return
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    setPageActions({
      shareTitle: `${tool.name} — PQC Business Tools`,
      shareText: `Try the ${tool.name} tool in the PQC Today Business Center`,
    })
    return () => clearPageActions()
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
        {/* Wave A (2026-09-18): the tool name is the page's level-one heading.
            Every business tool route rendered it as a breadcrumb span and the
            tool body opens with an h2, so all 37 tools failed axe
            `page-has-heading-one`. Same row, same size. */}
        <h1 className="text-sm font-medium text-foreground">
          <span className="font-normal text-muted-foreground">{tool.category} / </span>
          {tool.name}
        </h1>
        {/* Standards provenance. The registry has carried a validated
            cswp39SectionRef for every tool all along, and its own comment says
            it drives "the small provenance chip on each tool card" — but it was
            only ever rendered on Command Center ARTIFACT cards, so anyone who
            opened a tool directly saw none of it. (Audit 2026-08-10, W3-1.) */}
        <Cswp39SectionBadge sectionRef={tool.cswp39SectionRef} subSection={tool.cswp39SubSection} />
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

      {/* B+ remediation 4.6 (2026-08-10): what this is for, and what a good
          answer looks like — before the tool, not after it. "The tools produce
          real artifacts but explain very little about why an artifact is shaped
          the way it is"; a generated document the user cannot defend is worse
          than no document. Both lines come from the registry, so a new tool
          cannot ship without them. */}
      <section className="rounded-lg border border-border bg-muted/20 p-3">
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">What this is for:</span>{' '}
          {tool.description}.
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">What a good answer looks like:</span>{' '}
          {tool.goodAnswer}
        </p>
        {/* B+ round 8, Wave C (2026-09-18): one concrete run, written from the
            tool's real inputs, so "using it" is pictured before the form. */}
        {tool.workedExample && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Worked example:</span>{' '}
            {tool.workedExample}
          </p>
        )}
      </section>

      {/* Round 9, wave 2 — "For your role" (src/data/personaBlocks.ts). */}
      <PersonaBlock route={`/business/tools/${tool.id}`} />

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

      {/* Hub resources. RecommendedResourcesPanel was rendered only inside
          CSWP39StepSection on the Command Center, so a tool reached by URL,
          search, or the tools grid was an island — only 2 of 37 tools carry
          in-app links of their own. Keyed off the tool's zone via the existing
          ZONE_STEP_CONTRIBUTORS map. (Audit 2026-08-10, W3-2.) */}
      <div className="glass-panel p-4 border border-border">
        <RecommendedResourcesPanel stepId={primaryStepForZone(tool.cswp39Zone)} />
      </div>
      {/* Round 9, wave 1.2 (2026-09-19) — the declared exit (src/data/nextSteps.ts):
          the next tool in this category, or the report for the last one. */}
      <NextStepCard route={`/business/tools/${tool.id}`} />
      {/* Round 9, wave 1.1 — related content (category neighbours, same-phase tools, the phase's module). */}
      <RelatedContentPanel id={tool.id} entries={businessToolRelations(tool.id)} />
    </div>
  )
}
