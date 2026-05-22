// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import { useModuleStore } from '../../store/useModuleStore'
import { useLearnStore } from '../../store/useLearnStore'
import type { PersonaId } from '@/data/learningPersonas'
import { usePersonaPathItems } from './usePersonaPathItems'
import { PersonaPathPhase } from './PersonaPathPhase'

interface PersonaPathViewProps {
  personaId: PersonaId
  /** Click handler for module cards (delegates routing to caller). */
  onSelectModule: (moduleId: string) => void
  /** Persona-relevant dim/highlight signal forwarded to ModuleCard. */
  isModuleRelevant: (moduleId: string) => boolean
  /** Persona-relevant dim/highlight signal forwarded to ModuleCard. */
  isModuleAboveLevel: (moduleId: string) => boolean
  /** Triggered by the curious-only "Show me everything (advanced)" button. */
  onShowEverything?: () => void
}

/** Module IDs counted as the "common ground" overlay between executive and curious paths. */
export const COMMON_GROUND_MODULE_IDS = new Set([
  'pqc-101',
  'compliance-strategy',
  'vendor-risk',
  'pqc-risk-management',
  'migration-program',
])

/**
 * Computes the next-incomplete module ID by walking pathItems in order. Returns the first
 * module whose persisted status is not 'completed'. Exported so RecommendedPathBanner can
 * share the same definition.
 */
export function computeNextIncompleteModuleId(
  pathItems: readonly { type: 'module' | 'checkpoint'; moduleId?: string }[],
  moduleStatusById: Record<string, string | undefined>
): string | null {
  for (const item of pathItems) {
    if (item.type !== 'module') continue
    const id = item.moduleId
    if (!id) continue
    if (moduleStatusById[id] !== 'completed') return id
  }
  return null
}

export const PersonaPathView = ({
  personaId,
  onSelectModule,
  isModuleRelevant,
  isModuleAboveLevel,
  onShowEverything,
}: PersonaPathViewProps) => {
  const summary = usePersonaPathItems(personaId)
  const modules = useModuleStore((s) => s.modules)
  const phaseExpansion = useLearnStore((s) => s.phaseExpansion)
  const setPhaseExpanded = useLearnStore((s) => s.setPhaseExpanded)

  const nextIncompleteId = useMemo(() => {
    if (!summary) return null
    const statusMap: Record<string, string | undefined> = {}
    for (const k of Object.keys(modules)) {
      statusMap[k] = modules[k]?.status
    }
    return computeNextIncompleteModuleId(
      summary.pathItems as { type: 'module' | 'checkpoint'; moduleId?: string }[],
      statusMap
    )
  }, [summary, modules])

  if (!summary) return null

  const showCommonGroundContext = personaId === 'executive' || personaId === 'curious'
  // P2-2: sticky breadcrumb for ops + curious — their paths are the longest and
  // benefit most from a global sense-of-progress overview.
  const showBreadcrumb = personaId === 'ops' || personaId === 'curious'
  const currentPhaseIdx = nextIncompleteId
    ? summary.phases.findIndex((p) => p.moduleIds.includes(nextIncompleteId))
    : summary.phases.length - 1

  return (
    <section aria-label="Your curated learning path" className="space-y-3">
      {showBreadcrumb && summary.phases.length > 1 && (
        <nav
          aria-label="Path phases"
          className="sticky top-0 z-10 -mx-2 px-2 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border/40 overflow-x-auto"
        >
          <ol className="flex items-center gap-1 text-xs whitespace-nowrap">
            {summary.phases.map((phase, idx) => {
              const isCurrent = idx === currentPhaseIdx
              const isComplete = idx < currentPhaseIdx
              return (
                <li key={phase.id} className="flex items-center gap-1">
                  {idx > 0 && (
                    <span aria-hidden="true" className="text-muted-foreground/50">
                      ›
                    </span>
                  )}
                  <span
                    aria-current={isCurrent ? 'step' : undefined}
                    className={
                      isCurrent
                        ? 'font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10'
                        : isComplete
                          ? 'text-status-success line-clamp-1'
                          : 'text-muted-foreground line-clamp-1'
                    }
                    title={phase.title}
                  >
                    {isComplete && <span className="sr-only">Completed: </span>}
                    {phase.title}
                  </span>
                </li>
              )
            })}
          </ol>
        </nav>
      )}
      {summary.phases.map((phase) => {
        const completedCount = phase.moduleIds.filter(
          (id) => modules[id]?.status === 'completed'
        ).length
        const totalCount = phase.moduleIds.length
        const containsNext =
          nextIncompleteId !== null && phase.moduleIds.includes(nextIncompleteId)
        const defaultExpanded = containsNext
        const key = `${personaId}:${phase.id}`
        const expandedOverride =
          // eslint-disable-next-line security/detect-object-injection
          key in phaseExpansion ? phaseExpansion[key] : undefined
        return (
          <PersonaPathPhase
            key={key}
            title={phase.title}
            moduleIds={phase.moduleIds}
            defaultExpanded={defaultExpanded}
            completedCount={completedCount}
            totalCount={totalCount}
            onSelectModule={onSelectModule}
            isModuleRelevant={isModuleRelevant}
            isModuleAboveLevel={isModuleAboveLevel}
            commonGroundModuleIds={showCommonGroundContext ? COMMON_GROUND_MODULE_IDS : undefined}
            expandedOverride={expandedOverride}
            onToggle={(expanded) => setPhaseExpanded(key, expanded)}
          />
        )
      })}

      {personaId === 'curious' && onShowEverything && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-dashed border-border/60 bg-muted/20">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="text-muted-foreground shrink-0" size={14} aria-hidden="true" />
            <p className="text-xs text-muted-foreground line-clamp-2">
              Want the full catalog? You can always come back to this curated path.
            </p>
          </div>
          <Button variant="link" size="sm" className="shrink-0" onClick={onShowEverything}>
            Show me everything (advanced)
          </Button>
        </div>
      )}
    </section>
  )
}
