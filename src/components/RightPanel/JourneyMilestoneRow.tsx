// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Target } from 'lucide-react'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import type { JourneyPhase } from '@/hooks/useJourneyMap'

interface JourneyMilestoneRowProps {
  phase: JourneyPhase
}

export const JourneyMilestoneRow: React.FC<JourneyMilestoneRowProps> = ({ phase }) => {
  const close = useRightPanelStore((s) => s.close)
  const item = phase.items[0]
  if (!item) return null

  const isCompleted = item.status === 'completed'

  return (
    <Link
      to={item.route}
      onClick={close}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors group ${
        isCompleted
          ? 'border-status-success/20 bg-status-success/5 hover:bg-status-success/10'
          : 'border-accent/20 bg-accent/5 hover:bg-accent/10'
      }`}
    >
      {isCompleted ? (
        <Check size={14} className="text-status-success shrink-0" />
      ) : (
        <Target size={14} className="text-accent shrink-0" />
      )}
      <span
        className={`text-xs font-medium flex-1 min-w-0 truncate ${
          isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
        } group-hover:text-foreground transition-colors`}
      >
        {item.label}
      </span>
      <span className="text-[10px] font-mono text-muted-foreground shrink-0">{item.route}</span>
      <ArrowRight
        size={12}
        className="text-muted-foreground group-hover:text-primary transition-colors shrink-0"
      />
    </Link>
  )
}
