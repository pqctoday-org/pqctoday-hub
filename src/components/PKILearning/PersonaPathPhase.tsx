// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef } from 'react'
import { Check, ChevronRight, Circle } from 'lucide-react'
import clsx from 'clsx'
import { MODULE_CATALOG } from './moduleData'
import { ModuleCard } from './ModuleCard'
import { logEvent, personaLabel } from '@/utils/analytics'

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
  /** Optional badge label rendered next to the title (e.g. "Common Ground" for executive/curious). */
  badge?: string
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
  badge,
  onToggle,
  expandedOverride,
}: PersonaPathPhaseProps) => {
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
          aria-hidden="true"
        >
          {isComplete ? <Check size={14} /> : <Circle size={14} />}
        </span>
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span
            className="text-sm font-semibold text-foreground line-clamp-1"
            title={title}
          >
            {title}
          </span>
          {badge && (
            <span className="text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {badge}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
          {completedCount} / {totalCount}
        </span>
      </summary>
      <div className="px-4 pb-4 pt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        {moduleIds.map((id) => {
          const mod = MODULE_CATALOG[id]
          if (!mod) return null
          return (
            <ModuleCard
              key={id}
              module={mod}
              onSelectModule={onSelectModule}
              isRelevant={isModuleRelevant(id)}
              isAboveLevel={isModuleAboveLevel(id)}
            />
          )
        })}
      </div>
    </details>
  )
}
