// SPDX-License-Identifier: GPL-3.0-only
import React, { Suspense, useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Navigate, Link } from 'react-router'
import { ArrowLeft, Wrench, ArrowRight, GraduationCap } from 'lucide-react'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { WORKSHOP_TOOLS, TOOL_COMPONENTS, ONBACK_COMPONENTS } from './workshopRegistry'
import { useAchievementStore } from '@/store/useAchievementStore'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { ReviewedBadge } from '../ui/ReviewedBadge'
import { RevisionDrilldownPanel } from '../ui/RevisionDrilldownPanel'
import { useRevisions, byRecord } from '@/hooks/useRevisions'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { moduleIdFromToolLink } from '@/data/moduleToolLinks'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'

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
  const [revisionDrilldownOpen, setRevisionDrilldownOpen] = useState(false)
  const { revisions } = useRevisions()

  useEffect(() => {
    if (tool) useAchievementStore.getState().recordPlaygroundToolUsage(tool.id)
  }, [tool])

  // Share lives ONLY in the top bar (2026-08-27 remediation) — register this
  // tool's title/text so the global ShareButton (MainLayout.tsx) shows the
  // right copy instead of the generic route fallback. The URL itself needs no
  // override: `/playground/${toolId}` is already the shareable deep link.
  useEffect(() => {
    if (!tool) return
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    setPageActions({
      shareTitle: `${tool.name} — PQC Playground`,
      shareText: `Try the ${tool.name} tool in the PQC Today Playground`,
    })
    return () => clearPageActions()
  }, [tool])

  // Unknown toolId → back to workshop grid
  if (!tool) return <Navigate to="/playground" replace />

  const handleBack = () => navigate('/playground')

  // Wave B2 (2026-08-29) — the reverse of ModuleShell's "Related tool"
  // footer link, on the page a mobile module's "Practice on your phone"
  // card (or a desktop deep link) actually lands on. `ToolDetailModal`
  // already derives this same pair for its pre-open preview card; this is
  // the same derivation for the tool's real page, which had no such link at
  // all — a visitor who arrived from a module had no way back to it.
  const relatedModuleId = tool.moduleLink.startsWith('/learn/')
    ? moduleIdFromToolLink(tool.moduleLink)
    : null
  // eslint-disable-next-line security/detect-object-injection -- relatedModuleId is derived from the tool's own registry-declared moduleLink, not user input
  const relatedModuleTitle = relatedModuleId ? MODULE_CATALOG[relatedModuleId]?.title : undefined

  const isOnBack = toolId ? toolId in ONBACK_COMPONENTS : false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp: React.ComponentType<any> | undefined = isOnBack
    ? ONBACK_COMPONENTS[toolId!]
    : TOOL_COMPONENTS[toolId!]

  const resourceDetails = `**Tool:** ${tool.name}\n**Category:** ${tool.category}`

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 max-sm:flex-wrap">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          All Tools
        </Button>
        {relatedModuleId && relatedModuleTitle && (
          <Button variant="ghost" size="sm" onClick={() => navigate(`/learn/${relatedModuleId}`)}>
            <GraduationCap className="w-4 h-4 mr-1" />
            Back to {relatedModuleTitle}
          </Button>
        )}
        {/*
          The tool name is this page's <h1>. 33 of the 34 tool pages previously
          had no h1 at all (only tpm-playground shipped one), so every tool page
          opened with a heading hierarchy starting at h2 or lower. Styling is
          unchanged — this is the same breadcrumb line, now carrying the
          document's top-level heading instead of a bare span.
        */}
        <h1 className="text-sm font-normal text-muted-foreground max-sm:min-w-0 max-sm:flex-1 max-sm:truncate">
          <span className="sr-only">{tool.name} — </span>
          <span aria-hidden="true">
            {tool.category} / {tool.name}
          </span>
        </h1>
        <div className="ml-auto flex items-center gap-1 max-sm:w-full max-sm:justify-end">
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
          <ReviewedBadge
            domain="tool"
            entityId={tool.pt_id}
            onOpenDrilldown={() => setRevisionDrilldownOpen(true)}
          />
        </div>
      </div>

      {revisionDrilldownOpen && (
        <RevisionDrilldownPanel
          domain="tool"
          entityId={tool.pt_id}
          entityLabel={`${tool.pt_id} · ${tool.id}`}
          revisions={byRecord(revisions, 'tool', tool.pt_id)}
          onClose={() => setRevisionDrilldownOpen(false)}
        />
      )}

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
  // Tools in this category, in registry order, INCLUDING the current one — its
  // position is what makes the suggestion contextual.
  const sameCat = WORKSHOP_TOOLS.filter((t) => t.category === currentCategory && !t.wip)

  // Rotate the list so it starts just after the current tool, then take the
  // next 2. `slice(0, 2)` on a list with the current tool filtered out gave
  // every tool in a category the SAME two suggestions — on HSM / PKCS#11 that
  // meant tee-channel, kdf-derivation and envelope-encrypt all pointed at
  // "SLH-DSA Sign & Verify" and "Stateful Hash Signatures", verified in a
  // browser on 2026-08-11. The comment claimed it preferred "the tool
  // immediately after in category order"; now it does.
  //
  // Rotation is anchored on the tool's IDENTITY, not a stored index: a cursor
  // held as a position silently points at a different tool the moment the
  // registry is reordered.
  const at = sameCat.findIndex((t) => t.id === currentToolId)
  const ordered =
    at === -1
      ? sameCat // current tool is WIP (filtered out) — fall back to category order
      : [...sameCat.slice(at + 1), ...sameCat.slice(0, at)]

  const suggestions = ordered.slice(0, 2)
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
