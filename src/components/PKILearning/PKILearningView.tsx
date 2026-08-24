// SPDX-License-Identifier: GPL-3.0-only
import React, { Suspense, useEffect, useRef, useState, type ComponentType } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router'
import { LearnRedesignView } from './redesign/LearnRedesignView'
import { ArrowLeft } from 'lucide-react'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { lazyWithRetry } from '@/utils/lazyWithRetry'
import { ModuleProgressSidebar } from './ModuleProgressSidebar'
import { ModuleCompletionWatcher } from './ModuleCompletionWatcher'
import { CuriousModuleView } from './common/CuriousModuleView'
import { MODULE_CATALOG, LM_ID_MAP } from './moduleData'
import { MANIFESTS } from './manifest/registry'
import { ReviewedBadge } from '../ui/ReviewedBadge'
import { RevisionDrilldownPanel } from '../ui/RevisionDrilldownPanel'
import { useRevisions, byRecord } from '@/hooks/useRevisions'
import { usePersonaStore } from '../../store/usePersonaStore'
import { WipModuleBadge } from './common/WipModuleBadge'
import { useIsEmbedded } from '../../embed/EmbedProvider'
import { Button } from '@/components/ui/button'

const CommonGroundPath = lazyWithRetry(() =>
  import('./CommonGroundPath').then((module) => ({ default: module.CommonGroundPath }))
)

// Single source of truth for module routes. Every catalog module declares a
// `load` in its co-located manifest (modules/<X>/manifest.ts); the route table
// is derived from those manifests — the same source `simEmbedModules` uses — so
// a module is registered ONCE (its manifest) and is automatically routable. A
// Map keeps the lazy wrappers at module scope (created once, stable identity —
// not per render) and sidesteps dynamic object-index lint. Verified against the
// previous hand-maintained route list by manifest/routes.test.ts.
const MODULE_COMPONENTS = new Map<string, ComponentType>(
  MANIFESTS.filter((m) => m.load).map((m) => [m.id, lazyWithRetry(m.load!)])
)

// `custom` modules (the quiz) own their whole body — ModuleShell returns their
// children directly and never renders its header, so they get NO back link from
// it, catalog entry or not. They need this view's standalone one.
const CUSTOM_MODULE_IDS = new Set(MANIFESTS.filter((m) => m.custom).map((m) => m.id))

// Legacy/short path aliases that resolve to a canonical module id.
const ROUTE_ALIASES: Record<string, string> = { mls: 'mls-group-messaging' }
const ROUTE_ALIAS_ENTRIES = Object.entries(ROUTE_ALIASES)
  .map(([alias, target]) => ({ alias, Component: MODULE_COMPONENTS.get(target) }))
  .filter((e): e is { alias: string; Component: ComponentType } => Boolean(e.Component))

export const PKILearningView: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const contentRef = useRef<HTMLDivElement>(null)
  const [revisionDrilldownOpen, setRevisionDrilldownOpen] = useState(false)
  const { revisions } = useRevisions()
  // The dashboard owns its header via the shared PageHeader and needs no back
  // link — it IS the destination that link points at. (The legacy five-mode
  // dashboard at /learn/legacy is retired and redirects to /learn.)
  const isDashboard = location.pathname === '/learn' || location.pathname === '/learn/'

  const isEmbed = useIsEmbedded()

  // Derive moduleId from URL path (e.g. '/learn/pqc-101' → 'pqc-101')
  const moduleId = location.pathname.replace(/^\/learn\/?/, '')
  // Show progress sidebar for module pages (not dashboard, not quiz)
  const showSidebar = !isDashboard && moduleId !== 'quiz' && moduleId !== ''
  const moduleMeta = MODULE_CATALOG[moduleId] // eslint-disable-line security/detect-object-injection

  const searchParams = new URLSearchParams(location.search)
  const diveDeeper = searchParams.get('diveDeeper') === 'true'

  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const isCuriousMode =
    (experienceLevel === 'curious' || selectedPersona === 'curious') && !diveDeeper

  // This view used to open with its own utility row — back link on the left,
  // then Endorse/Flag/Share/WIP/Reviewed/Glossary/Guide on the right. The
  // persona-journeys top bar now carries Share/Glossary/Guide globally on every
  // route, so that row read as a duplicate of the bar directly above it
  // (HEADER-TOPBAR-STANDARDIZATION-PLAN-2026-08-01.md §2.2/§4). The row is gone:
  //   - Endorse/Flag/Share + the WIP and Reviewed badges register into the top
  //     bar's page-action strip below, same mechanism Timeline prototyped.
  //   - Glossary/Guide are simply dropped — the bar has them (Guide only since
  //     `pageIdForNestedRoute` in MainLayout started matching `/learn/*`).
  //   - "Back to Dashboard" moved down into the module's own chip row, in
  //     ModuleShell/CuriousModuleView. Routes that render neither (the
  //     common-ground path, which has no catalog entry; the quiz, whose
  //     `custom` manifest skips ModuleShell's header) keep the standalone link
  //     below — without it they'd have no way back at all.
  const hasOwnBackLink = Boolean(moduleMeta) && !CUSTOM_MODULE_IDS.has(moduleId)
  const showStandaloneBackLink = !isDashboard && !isEmbed && !hasOwnBackLink

  const showModuleActions = showSidebar && Boolean(moduleMeta)
  const hasReviewRecord = Boolean(LM_ID_MAP[moduleId])

  useEffect(() => {
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    if (!showModuleActions || !moduleMeta) {
      clearPageActions()
      return
    }
    const resourceDetails = [
      `**Module:** ${moduleMeta.title}`,
      `**Duration:** ${moduleMeta.duration}`,
      `**Difficulty:** ${moduleMeta.difficulty}`,
      `**Description:** ${moduleMeta.description}`,
    ].join('\n')
    setPageActions({
      title: moduleMeta.title,
      shareTitle: moduleMeta.title,
      shareText: `Learn about ${moduleMeta.title} — PQC Timeline`,
      endorseUrl: buildEndorsementUrl({
        category: 'learn-module-endorsement',
        title: `Endorse: ${moduleMeta.title}`,
        resourceType: 'Learn Module',
        resourceId: moduleMeta.title,
        resourceDetails,
        pageUrl: `/learn/${moduleId}`,
      }),
      endorseLabel: moduleMeta.title,
      endorseResourceType: 'Learn Module',
      flagUrl: buildFlagUrl({
        category: 'learn-module-endorsement',
        title: `Flag: ${moduleMeta.title}`,
        resourceType: 'Learn Module',
        resourceId: moduleMeta.title,
        resourceDetails,
        pageUrl: `/learn/${moduleId}`,
      }),
      flagLabel: moduleMeta.title,
      flagResourceType: 'Learn Module',
      extra: (
        <>
          <WipModuleBadge moduleMeta={moduleMeta} />
          {hasReviewRecord && (
            <ReviewedBadge
              domain="module"
              entityId={moduleId}
              onOpenDrilldown={() => setRevisionDrilldownOpen(true)}
            />
          )}
        </>
      ),
    })
    return () => clearPageActions()
  }, [showModuleActions, moduleMeta, moduleId, hasReviewRecord])

  return (
    <div className="animate-fade-in">
      {showStandaloneBackLink && (
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/learn')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </Button>
        </div>
      )}

      {revisionDrilldownOpen && LM_ID_MAP[moduleId] && (
        <RevisionDrilldownPanel
          domain="module"
          entityId={moduleId}
          entityLabel={`${LM_ID_MAP[moduleId]} · ${moduleId}`}
          revisions={byRecord(revisions, 'module', moduleId)}
          onClose={() => setRevisionDrilldownOpen(false)}
        />
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
        {/* Main module content */}
        <div ref={contentRef} className="flex-1 min-w-0 w-full">
          {/* A4 — the completion-card moment (fires once when this module hits
              'completed'; not in the embedded sim). Keyed so each module watches
              only itself. */}
          {showSidebar && !isEmbed && (
            <ModuleCompletionWatcher key={moduleId} moduleId={moduleId} />
          )}

          {isCuriousMode && showSidebar ? (
            <CuriousModuleView moduleId={moduleId} />
          ) : (
            <Suspense
              fallback={
                <div className="flex h-64 w-full items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">Loading Module...</p>
                  </div>
                </div>
              }
            >
              <Routes>
                <Route index element={<LearnRedesignView />} />
                {/* The legacy five-mode dashboard is retired (learn.md remediation item 8):
                    no in-app links point to it, it was already excluded from SEO indexing
                    as a legacy duplicate (routeMeta.ts), and the redesign restores its
                    useful deep-link params (?track=, ?persona=, ?mode=) on /learn itself.
                    Redirect rather than 404 in case an old bookmark/external link remains. */}
                <Route path="legacy" element={<Navigate to="/learn" replace />} />
                {/* Module routes — derived from the manifests (single source). */}
                {[...MODULE_COMPONENTS].map(([path, Component]) => (
                  <Route key={path} path={path} element={<Component />} />
                ))}
                {/* Legacy/short aliases that resolve to a canonical module. */}
                {ROUTE_ALIAS_ENTRIES.map(({ alias, Component }) => (
                  <Route key={alias} path={alias} element={<Component />} />
                ))}
                {/* Non-module journey path (no manifest). */}
                <Route path="common-ground" element={<CommonGroundPath />} />
              </Routes>
            </Suspense>
          )}
          {showSidebar && (
            <p className="text-[11px] text-muted-foreground text-center mt-4 opacity-70">
              Learning module content can be inaccurate. Please double-check its information. Report
              inaccuracies in{' '}
              <a
                href="https://github.com/pqctoday-org/pqctoday-hub/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                PQC Today GitHub Discussions
              </a>
              .
            </p>
          )}
        </div>

        {/* Progress sidebar — desktop aside (order-last). Mobile moved to bottom organically by DOM order */}
        {showSidebar && !isCuriousMode && (
          <div className="w-full lg:w-auto shrink-0 pb-12 lg:pb-0">
            <ModuleProgressSidebar moduleId={moduleId} />
          </div>
        )}
      </div>
    </div>
  )
}
