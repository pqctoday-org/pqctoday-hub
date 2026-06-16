// SPDX-License-Identifier: GPL-3.0-only
import React, { Suspense, useRef, type ComponentType } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Dashboard } from './Dashboard'
import { ArrowLeft } from 'lucide-react'
import { GlossaryButton } from '../ui/GlossaryButton'
import { UserManualButton } from '../ui/UserManualButton'
import { ShareButton } from '../ui/ShareButton'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { lazyWithRetry } from '@/utils/lazyWithRetry'
import { ModuleProgressSidebar } from './ModuleProgressSidebar'
import { ModuleProgressHeader } from './ModuleProgressHeader'
import { NextModuleCTA } from './NextModuleCTA'
import { CuriousModuleView } from './common/CuriousModuleView'
import { MODULE_CATALOG, LM_ID_MAP } from './moduleData'
import { MANIFESTS } from './manifest/registry'
import { HistoryButton } from '../ui/HistoryButton'
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

// Legacy/short path aliases that resolve to a canonical module id.
const ROUTE_ALIASES: Record<string, string> = { mls: 'mls-group-messaging' }
const ROUTE_ALIAS_ENTRIES = Object.entries(ROUTE_ALIASES)
  .map(([alias, target]) => ({ alias, Component: MODULE_COMPONENTS.get(target) }))
  .filter((e): e is { alias: string; Component: ComponentType } => Boolean(e.Component))

export const PKILearningView: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const contentRef = useRef<HTMLDivElement>(null)
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

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-y-2 mb-6">
        {!isDashboard && !isEmbed ? (
          <Button
            variant="ghost"
            onClick={() => navigate('/learn')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </Button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-1 shrink-0">
          {showSidebar && moduleMeta && (
            <>
              <EndorseButton
                endorseUrl={buildEndorsementUrl({
                  category: 'learn-module-endorsement',
                  title: `Endorse: ${moduleMeta.title}`,
                  resourceType: 'Learn Module',
                  resourceId: moduleMeta.title,
                  resourceDetails: [
                    `**Module:** ${moduleMeta.title}`,
                    `**Duration:** ${moduleMeta.duration}`,
                    `**Difficulty:** ${moduleMeta.difficulty}`,
                    `**Description:** ${moduleMeta.description}`,
                  ].join('\n'),
                  pageUrl: `/learn/${moduleId}`,
                })}
                resourceLabel={moduleMeta.title}
                resourceType="Learn Module"
              />
              <FlagButton
                flagUrl={buildFlagUrl({
                  category: 'learn-module-endorsement',
                  title: `Flag: ${moduleMeta.title}`,
                  resourceType: 'Learn Module',
                  resourceId: moduleMeta.title,
                  resourceDetails: [
                    `**Module:** ${moduleMeta.title}`,
                    `**Duration:** ${moduleMeta.duration}`,
                    `**Difficulty:** ${moduleMeta.difficulty}`,
                    `**Description:** ${moduleMeta.description}`,
                  ].join('\n'),
                  pageUrl: `/learn/${moduleId}`,
                })}
                resourceLabel={moduleMeta.title}
                resourceType="Learn Module"
              />
              <ShareButton
                title={moduleMeta.title}
                text={`Learn about ${moduleMeta.title} — PQC Timeline`}
              />
            </>
          )}
          {showSidebar && moduleMeta && <WipModuleBadge moduleMeta={moduleMeta} />}
          {showSidebar && LM_ID_MAP[moduleId] && (
            <HistoryButton
              itemId={moduleId}
              trackingId={LM_ID_MAP[moduleId]}
              itemLabel={`${LM_ID_MAP[moduleId]} · ${moduleId}`}
            />
          )}
          <GlossaryButton />
          <UserManualButton pageId="learn" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
        {/* Main module content */}
        <div ref={contentRef} className="flex-1 min-w-0 w-full">
          {/* Dual progress header bar — mobile only slim header */}
          {showSidebar && !isCuriousMode && (
            <div className="lg:hidden sticky top-[60px] z-30 -mx-4 px-4 bg-background/80 backdrop-blur-md pb-2 pt-2 mb-4 border-b border-border/50">
              <ModuleProgressHeader moduleId={moduleId} />
            </div>
          )}

          {isCuriousMode && showSidebar ? (
            <CuriousModuleView moduleId={moduleId} />
          ) : (
            <Suspense
              fallback={
                <div className="flex h-64 w-full items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground animate-pulse">Loading Module...</p>
                  </div>
                </div>
              }
            >
              <Routes>
                <Route index element={<Dashboard />} />
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
          {showSidebar && !isCuriousMode && <NextModuleCTA moduleId={moduleId} />}
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
