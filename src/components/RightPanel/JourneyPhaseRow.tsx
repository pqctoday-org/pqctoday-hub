// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, ChevronRight, Circle, Loader2 } from 'lucide-react'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import type { JourneyPhase, JourneyItem, JourneyItemStatus } from '@/hooks/useJourneyMap'
import { Button } from '@/components/ui/button'

function StatusIcon({ status, size = 14 }: { status: JourneyItemStatus; size?: number }) {
  switch (status) {
    case 'completed':
      return <Check size={size} className="text-status-success shrink-0" />
    case 'in-progress':
      return <Loader2 size={size} className="text-primary shrink-0 animate-spin" />
    case 'available':
      return <Circle size={size} className="text-muted-foreground/40 shrink-0" />
    case 'locked':
      return <Circle size={size} className="text-muted-foreground/20 shrink-0" />
  }
}

function ItemRow({ item }: { item: JourneyItem }) {
  const close = useRightPanelStore((s) => s.close)

  return (
    <Link
      to={item.route}
      onClick={close}
      className="flex items-center gap-2 py-1 px-2 -mx-1 rounded hover:bg-muted/30 transition-colors group"
    >
      <StatusIcon status={item.status} size={12} />
      <span
        className={`text-xs flex-1 min-w-0 truncate ${
          item.status === 'completed'
            ? 'text-muted-foreground line-through'
            : item.status === 'in-progress'
              ? 'text-foreground font-medium'
              : 'text-muted-foreground'
        } group-hover:text-foreground transition-colors`}
      >
        {item.label}
      </span>
      {item.stepProgress && (
        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
          {item.stepProgress.done}/{item.stepProgress.total}
        </span>
      )}
    </Link>
  )
}

interface JourneyPhaseRowProps {
  phase: JourneyPhase
  isCurrent: boolean
}

export const JourneyPhaseRow: React.FC<JourneyPhaseRowProps> = ({ phase, isCurrent }) => {
  const [expanded, setExpanded] = useState(isCurrent || phase.status === 'in-progress')

  const completedCount = phase.items.filter((i) => i.status === 'completed').length
  const totalCount = phase.items.length

  return (
    <div
      className={`rounded-lg border transition-colors ${
        isCurrent
          ? 'border-primary/30 bg-primary/5'
          : phase.status === 'completed'
            ? 'border-border/30 bg-muted/10'
            : 'border-border/20'
      }`}
    >
      <Button
        variant="ghost"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/20 rounded-lg transition-colors"
      >
        <StatusIcon status={phase.status} />
        {expanded ? (
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
        )}
        <span
          className={`text-xs font-semibold flex-1 min-w-0 truncate ${
            phase.status === 'completed' ? 'text-muted-foreground' : 'text-foreground'
          }`}
        >
          {phase.label}
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
          {completedCount}/{totalCount}
        </span>
        {isCurrent && (
          <span className="text-[9px] font-mono uppercase tracking-widest text-primary bg-primary/10 rounded px-1.5 py-0.5 shrink-0">
            current
          </span>
        )}
      </Button>

      {expanded && (
        <div className="px-3 pb-2 pl-9 space-y-0.5">
          {phase.items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
