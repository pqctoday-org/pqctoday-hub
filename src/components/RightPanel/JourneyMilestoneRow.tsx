// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
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
        <Check aria-hidden="true" size={14} className="text-status-success shrink-0" />
      ) : (
        <Target aria-hidden="true" size={14} className="text-accent shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-foreground">{item.label}</span>
        {item.purpose && (
          <span className="mt-1 block whitespace-normal text-[11px] leading-relaxed text-muted-foreground">
            {item.purpose}
          </span>
        )}
      </span>
      <span className="shrink-0 text-[10px] text-muted-foreground">
        {isCompleted ? 'Completed' : item.status === 'in-progress' ? 'In progress' : 'Available'}
      </span>
      <ArrowRight
        aria-hidden="true"
        size={12}
        className="text-muted-foreground group-hover:text-primary transition-colors shrink-0"
      />
    </Link>
  )
}
