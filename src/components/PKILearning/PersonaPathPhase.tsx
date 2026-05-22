// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Circle, FlaskConical } from 'lucide-react'
import clsx from 'clsx'
import { MODULE_CATALOG } from './moduleData'
import { ModuleCard } from './ModuleCard'
import { Button } from '../ui/button'
import { getPlaygroundToolForModule } from './moduleEnrichment'
import { logEvent, personaLabel } from '@/utils/analytics'
import type { PersonaId } from '@/data/learningPersonas'

interface PersonaPathPhaseProps {
  /** Phase title (checkpoint label, or "Wrap-up: Take the quiz" for the terminal phase). */
  title: string
  /** Module IDs contained in this phase. */
  moduleIds: string[]
  /** Whether the phase opens expanded on first render. */
  defaultExpanded: boolean
  /** Modules completed in this phase. */
  completedCount: number
  /** Total modules in this phase. */
  totalCount: number
  /** Click handler for module cards. */
  onSelectModule: (moduleId: string) => void
  /** Persona-relevant signal (for ModuleCard dim/highlight). */
  isModuleRelevant: (moduleId: string) => boolean
  /** Persona-relevant signal (for ModuleCard dim/highlight). */
  isModuleAboveLevel: (moduleId: string) => boolean
  /** Set of module IDs that should display a "Common Ground" overlay badge.
   *  Passed by PersonaPathView only when persona is executive/curious. */
  commonGroundModuleIds?: Set<string>
  /** Active persona — drives P2-1 "Try in playground" affordance for ops. */
  personaId?: PersonaId
  /** Callback when the user toggles the phase (writes to useLearnStore). */
  onToggle?: (expanded: boolean) => void
  /** Persisted expansion state. If undefined, defaultExpanded controls the initial state. */
  expandedOverride?: boolean
}

export const PersonaPathPhase = ({
  title,
  moduleIds,
  defaultExpanded,
  completedCount,
  totalCount,
  onSelectModule,
  isModuleRelevant,
  isModuleAboveLevel,
  commonGroundModuleIds,
  personaId,
  onToggle,
  expandedOverride,
}: PersonaPathPhaseProps) => {
  const navigate = useNavigate()
  const ref = useRef<HTMLDetailsElement>(null)
  const isComplete = totalCount > 0 && completedCount === totalCount

  // Sync open state with override when provided
  useEffect(() => {
    if (!ref.current) return
    const desired = expandedOverride ?? defaultExpanded
    if (ref.current.open !== desired) {
      ref.current.open = desired
    }
  }, [expandedOverride, defaultExpanded])

  const handleToggle = () => {
    if (!ref.current) return
    const next = ref.current.open
    if (onToggle) onToggle(next)
    logEvent('Learning', 'Path Phase Toggle', `${personaLabel(title)} · ${next ? 'open' : 'close'}`)
  }

  return (
    <details
      ref={ref}
      open={expandedOverride ?? defaultExpanded}
      onToggle={handleToggle}
      className="glass-panel border-border/60 rounded-xl overflow-hidden group"
    >
      <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none hover:bg-muted/40 transition-colors">
        <ChevronRight
          size={16}
          className="text-muted-foreground shrink-0 transition-transform group-open:rotate-90"
          aria-hidden="true"
        />
        <span
          className={clsx(
            'shrink-0 rounded-full p-1',
            isComplete ? 'bg-status-success/15 text-status-success' : 'bg-muted text-muted-foreground'
          )}
        >
          <span className="sr-only">
            {isComplete ? 'Phase complete: ' : 'Phase in progress: '}
          </span>
          {isComplete ? (
            <Check size={14} aria-hidden="true" />
          ) : (
            <Circle size={14} aria-hidden="true" />
          )}
        </span>
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span
            className="text-sm font-semibold text-foreground line-clamp-1"
            title={title}
          >
            {title}
          </span>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
          {completedCount} / {totalCount}
        </span>
      </summary>
      <div className="px-4 pb-4 pt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        {moduleIds.map((id) => {
          const mod = MODULE_CATALOG[id]
          if (!mod) return null
          const isCommonGround = commonGroundModuleIds?.has(id) ?? false
          // P2-1: surface a "Try in playground" affordance for ops persona when the
          // module has a curated Playground tool counterpart.
          const playgroundTool = personaId === 'ops' ? getPlaygroundToolForModule(id) : undefined
          return (
            <div key={id} className="relative">
              {isCommonGround && (
                <span
                  className="absolute top-2 right-2 z-10 text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 pointer-events-none"
                  aria-label="Common Ground module"
                >
                  Common Ground
                </span>
              )}
              <ModuleCard
                module={mod}
                onSelectModule={onSelectModule}
                isRelevant={isModuleRelevant(id)}
                isAboveLevel={isModuleAboveLevel(id)}
              />
              {playgroundTool && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    logEvent('Learning', 'Path Playground Link Click', `${id} → ${playgroundTool}`)
                    navigate(`/playground/${playgroundTool}`)
                  }}
                  className="absolute bottom-2 right-2 z-10 text-[10px] gap-1 h-7 px-2"
                >
                  <FlaskConical size={11} aria-hidden="true" />
                  Try in playground
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </details>
  )
}
