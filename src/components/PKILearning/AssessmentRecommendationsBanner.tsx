// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, ArrowRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MODULE_CATALOG } from './moduleData'
import { useModuleStore } from '@/store/useModuleStore'

interface Props {
  moduleIds: string[]
  onRetakeAssessment: () => void
}

export const AssessmentRecommendationsBanner: React.FC<Props> = ({
  moduleIds,
  onRetakeAssessment,
}) => {
  const navigate = useNavigate()
  const { modules } = useModuleStore()

  const items = moduleIds.map((id) => MODULE_CATALOG[id]).filter(Boolean)

  if (items.length === 0) return null

  return (
    <div className="glass-panel border border-primary/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={16} className="text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">Your assessment path</span>
          <span className="text-xs text-muted-foreground">
            — modules recommended based on your results
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetakeAssessment}
          className="flex items-center gap-1.5 text-xs text-muted-foreground h-auto py-1"
        >
          <RotateCcw size={12} />
          Re-take assessment
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {items.map((mod) => {
          const status = modules[mod.id]?.status ?? 'not-started'
          const isInProgress = status === 'in-progress'
          const isDone = status === 'completed'

          return (
            <Button
              key={mod.id}
              variant="ghost"
              onClick={() => navigate(`/learn/${mod.id}`)}
              className="group h-auto text-left rounded-lg border border-border bg-card/60 hover:border-primary/40 hover:bg-card transition-colors px-3 py-2.5 flex flex-col items-start gap-1 w-full"
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <span className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                  {mod.title}
                </span>
                <ArrowRight
                  size={14}
                  className="text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{mod.duration}</span>
                {isDone && <span className="text-status-success font-medium">✓ Completed</span>}
                {isInProgress && <span className="text-primary font-medium">In progress</span>}
                {!isDone && !isInProgress && (
                  <span className="text-muted-foreground/60">Not started</span>
                )}
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
