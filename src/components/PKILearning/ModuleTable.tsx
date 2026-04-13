// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { useState } from 'react'
import { ArrowUpDown, ChevronDown, ChevronRight, ClipboardCheck, Clock } from 'lucide-react'
import clsx from 'clsx'
import { useModuleStore } from '../../store/useModuleStore'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { Button } from '../ui/button'
import { TRACK_COLORS, MODULE_STEP_COUNTS } from './moduleData'
import type { ModuleItem } from './ModuleCard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortKey = 'title' | 'track' | 'difficulty' | 'duration' | 'status'
type SortDir = 'asc' | 'desc'

const DIFFICULTY_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 }
const STATUS_ORDER: Record<string, number> = { 'in-progress': 0, 'not-started': 1, completed: 2 }

export type ModuleTableItem =
  | { kind: 'module'; module: ModuleItem; track: string }
  | { kind: 'checkpoint'; id: string; label: string; categoryCount: number; categories: string[] }

interface ModuleTableProps {
  items: ModuleTableItem[]
  navigate: (id: string) => void
  navigateToQuiz: (categories: string[]) => void
  isModuleRelevant: (id: string) => boolean
  isModuleAboveLevel: (id: string) => boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDuration(d: string): number {
  return parseInt(d) || 0
}

const SortHeader = ({
  label,
  sk,
  sortKey,
  onSort,
  className,
}: {
  label: string
  sk: SortKey
  sortKey: SortKey
  onSort: (k: SortKey) => void
  className?: string
}) => (
  <th className={clsx('text-left', className)}>
    <Button
      variant="ghost"
      onClick={() => onSort(sk)}
      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-3 px-4 w-full"
    >
      {label}
      <ArrowUpDown
        size={11}
        aria-hidden="true"
        className={clsx(
          'transition-colors',
          sortKey === sk ? 'text-primary' : 'text-muted-foreground/40'
        )}
      />
    </Button>
  </th>
)

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ModuleTable = ({
  items,
  navigate,
  navigateToQuiz,
  isModuleRelevant,
  isModuleAboveLevel,
}: ModuleTableProps) => {
  const { modules } = useModuleStore()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // Separate checkpoints (always in original position) from module items to sort
  // Strategy: sort only module items, rebuild list interleaving checkpoints at their original indices
  const sortedItems = (() => {
    const moduleItems = items.filter((i) => i.kind === 'module') as Extract<
      ModuleTableItem,
      { kind: 'module' }
    >[]

    const sorted = [...moduleItems].sort((a, b) => {
      const aStatus = modules[a.module.id]?.status ?? 'not-started'
      const bStatus = modules[b.module.id]?.status ?? 'not-started'
      let cmp = 0
      switch (sortKey) {
        case 'title':
          cmp = a.module.title.localeCompare(b.module.title)
          break
        case 'track':
          cmp = a.track.localeCompare(b.track)
          break
        case 'difficulty':
          cmp =
            (DIFFICULTY_ORDER[a.module.difficulty ?? ''] ?? 99) -
            (DIFFICULTY_ORDER[b.module.difficulty ?? ''] ?? 99)
          break
        case 'duration':
          cmp = parseDuration(a.module.duration) - parseDuration(b.module.duration)
          break
        case 'status':
          cmp = (STATUS_ORDER[aStatus] ?? 99) - (STATUS_ORDER[bStatus] ?? 99)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    // If items have checkpoints (persona mode), keep them interleaved at original positions
    const hasCheckpoints = items.some((i) => i.kind === 'checkpoint')
    if (hasCheckpoints) return items // preserve persona order entirely when checkpoints present

    return sorted
  })()

  return (
    <div className="rounded-xl border border-border overflow-hidden overflow-x-auto">
      <table className="w-full text-sm min-w-[360px]">
        <thead className="bg-muted/30 border-b border-border">
          <tr>
            <th className="w-8 py-3 px-4" />
            <SortHeader label="Module" sk="title" sortKey={sortKey} onSort={handleSort} />
            <SortHeader
              label="Track"
              sk="track"
              sortKey={sortKey}
              onSort={handleSort}
              className="hidden md:table-cell"
            />
            <SortHeader
              label="Difficulty"
              sk="difficulty"
              sortKey={sortKey}
              onSort={handleSort}
              className="hidden md:table-cell"
            />
            <SortHeader
              label="Duration"
              sk="duration"
              sortKey={sortKey}
              onSort={handleSort}
              className="hidden sm:table-cell"
            />
            <SortHeader label="Status" sk="status" sortKey={sortKey} onSort={handleSort} />
            <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-right">
              Progress
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item, idx) => {
            // Checkpoint row
            if (item.kind === 'checkpoint') {
              return (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td colSpan={7} className="px-4 py-3">
                    <Button
                      variant="ghost"
                      onClick={() => navigateToQuiz(item.categories)}
                      className="w-full flex items-center gap-3 text-left group"
                    >
                      <ClipboardCheck
                        size={14}
                        className="text-secondary shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-xs font-mono uppercase tracking-widest text-secondary whitespace-nowrap shrink-0">
                        Quiz Checkpoint
                      </span>
                      <span className="text-sm font-semibold text-foreground group-hover:text-secondary transition-colors flex-1 min-w-0 truncate">
                        {item.label}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        {item.categoryCount} topics
                      </span>
                    </Button>
                  </td>
                </tr>
              )
            }

            // Module row
            const { module, track } = item
            const moduleState = modules[module.id]
            const status = moduleState?.status ?? 'not-started'
            const completedSteps = moduleState?.completedSteps?.length ?? 0
            const totalSteps = MODULE_STEP_COUNTS[module.id] ?? 4
            const progressPct = Math.min(100, Math.round((completedSteps / totalSteps) * 100))
            const isExpanded = expandedIds.has(module.id)
            const isAboveLevel = isModuleAboveLevel(module.id)
            const isRelevant = isModuleRelevant(module.id)
            const trackColorClass = TRACK_COLORS[track] ?? 'bg-muted text-muted-foreground'

            return [
              // Main row
              <tr
                key={`${module.id}-${idx}`}
                className={clsx(
                  'border-b border-border last:border-0 cursor-pointer hover:bg-muted/20 transition-colors',
                  isAboveLevel && status !== 'completed' && 'opacity-40'
                )}
                onClick={() => toggleExpand(module.id)}
              >
                {/* Expand chevron */}
                <td className="px-4 py-3 text-muted-foreground">
                  {isExpanded ? (
                    <ChevronDown size={14} aria-hidden="true" />
                  ) : (
                    <ChevronRight size={14} aria-hidden="true" />
                  )}
                </td>

                {/* Title */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{module.title}</span>
                    {isRelevant && (
                      <span className="text-[10px] font-mono uppercase tracking-widest text-primary border border-primary/30 rounded px-1 py-0.5">
                        Relevant
                      </span>
                    )}
                  </div>
                </td>

                {/* Track */}
                <td className="py-3 px-4 hidden md:table-cell">
                  <span
                    className={clsx(
                      'text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded',
                      trackColorClass
                    )}
                  >
                    {track}
                  </span>
                </td>

                {/* Difficulty */}
                <td className="py-3 px-4 hidden md:table-cell">
                  {module.difficulty ? (
                    <span
                      className={clsx(
                        'text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded',
                        module.difficulty === 'beginner'
                          ? 'bg-status-success/15 text-status-success'
                          : module.difficulty === 'intermediate'
                            ? 'bg-status-warning/15 text-status-warning'
                            : 'bg-status-error/15 text-status-error'
                      )}
                    >
                      {module.difficulty}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

                {/* Duration */}
                <td className="py-3 px-4 hidden sm:table-cell">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={11} aria-hidden="true" />
                    {module.duration}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3 px-4">
                  <span
                    className={clsx(
                      'px-2 py-0.5 rounded-full text-xs font-bold border',
                      status === 'completed'
                        ? 'bg-status-success text-status-success'
                        : status === 'in-progress'
                          ? 'bg-status-info text-status-info'
                          : 'bg-secondary/10 text-secondary border-secondary/30'
                    )}
                  >
                    {status === 'completed'
                      ? 'Done'
                      : status === 'in-progress'
                        ? 'In Progress'
                        : 'Start'}
                  </span>
                </td>

                {/* Progress */}
                <td className="py-3 px-4">
                  {status === 'in-progress' ? (
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                        {progressPct}%
                      </span>
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${progressPct}%` }}
                          role="progressbar"
                          aria-valuenow={progressPct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                    </div>
                  ) : status === 'completed' ? (
                    <span className="text-xs text-muted-foreground text-right block">100%</span>
                  ) : (
                    <span className="text-muted-foreground text-right block">—</span>
                  )}
                </td>
              </tr>,

              // Expanded detail panel
              isExpanded && (
                <tr
                  key={`${module.id}-detail`}
                  className="border-b border-border last:border-0 bg-muted/10"
                >
                  <td />
                  <td colSpan={6} className="py-4 px-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                          {module.description}
                        </p>
                        {status === 'in-progress' && (
                          <p className="text-xs text-muted-foreground">
                            {completedSteps} of {totalSteps} steps complete
                            {(moduleState?.timeSpent ?? 0) > 0 && (
                              <> · {Math.floor(moduleState?.timeSpent ?? 0)} min spent</>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <AskAssistantButton
                          question={`Tell me about the ${module.title} module — what will I learn and why does it matter for PQC migration?`}
                        />
                        <Button variant="gradient" size="sm" onClick={() => navigate(module.id)}>
                          {status === 'in-progress'
                            ? 'Resume'
                            : status === 'completed'
                              ? 'Review'
                              : 'Start'}
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ),
            ].filter(Boolean)
          })}
        </tbody>
      </table>
    </div>
  )
}
