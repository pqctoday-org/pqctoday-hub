import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'
import type { SoftwareCategoryGap } from '../../types/MigrateTypes'

interface MigrationGapAnalysisProps {
  gaps: SoftwareCategoryGap[]
}

const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low']

const PRIORITY_STYLES: Record<string, string> = {
  Critical: 'text-destructive bg-destructive/10 border-destructive/20',
  High: 'text-warning bg-warning/10 border-warning/20',
  Medium: 'text-primary bg-primary/10 border-primary/20',
  Low: 'text-muted-foreground bg-muted/30 border-border',
}

export const MigrationGapAnalysis: React.FC<MigrationGapAnalysisProps> = ({ gaps }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const missingGaps = useMemo(() => {
    return gaps
      .filter((g) => !g.hasSoftwareInReference)
      .sort((a, b) => {
        const aPriority = PRIORITY_ORDER.indexOf(a.pqcPriority)
        const bPriority = PRIORITY_ORDER.indexOf(b.pqcPriority)
        if (aPriority !== bPriority) return aPriority - bPriority
        return b.urgencyScore - a.urgencyScore
      })
  }, [gaps])

  const groupedGaps = useMemo(() => {
    const groups = new Map<string, SoftwareCategoryGap[]>()
    for (const gap of missingGaps) {
      const list = groups.get(gap.pqcPriority) ?? []
      list.push(gap)
      groups.set(gap.pqcPriority, list)
    }
    return groups
  }, [missingGaps])

  if (missingGaps.length === 0) return null

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 sm:p-4 bg-card hover:bg-muted/30 transition-colors cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle size={16} className="text-warning" />
          <span className="text-sm font-semibold text-foreground">Software Coverage Gaps</span>
          <span className="text-xs text-muted-foreground">
            {missingGaps.length} categories with no tracked PQC software
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown size={16} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={16} className="text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="p-3 sm:p-4 pt-0 space-y-4 animate-fade-in">
          {PRIORITY_ORDER.map((priority) => {
            const items = groupedGaps.get(priority)
            if (!items || items.length === 0) return null
            return (
              <div key={priority}>
                <h4
                  className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                    priority === 'Critical'
                      ? 'text-destructive'
                      : priority === 'High'
                        ? 'text-warning'
                        : priority === 'Medium'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                  }`}
                >
                  {priority} Priority
                </h4>
                <div className="space-y-1.5">
                  {items.map((gap) => (
                    <div
                      key={gap.categoryId}
                      className="flex items-center justify-between text-sm px-3 py-2 rounded-md bg-muted/10"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${PRIORITY_STYLES[gap.pqcPriority]}`}
                        >
                          {gap.urgencyScore}
                        </span>
                        <span className="text-foreground truncate">{gap.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {gap.recommendedTimeline}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
