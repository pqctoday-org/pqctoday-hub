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
const COMMON_GROUND_MODULE_IDS = new Set([
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

  return (
    <section aria-label="Your curated learning path" className="space-y-3">
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
        const containsCommonGround =
          showCommonGroundContext && phase.moduleIds.some((id) => COMMON_GROUND_MODULE_IDS.has(id))
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
            badge={containsCommonGround ? 'Common Ground' : undefined}
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
