// SPDX-License-Identifier: GPL-3.0-only

import React, { useState, useMemo } from 'react'
import { AlertTriangle, Shield, Clock, ChevronDown, ChevronUp, CheckSquare } from 'lucide-react'
import type { RoleGuideData } from './types'
import { Button } from '@/components/ui/button'

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'border-status-error/40 bg-status-error/5',
  high: 'border-status-warning/40 bg-status-warning/5',
  medium: 'border-primary/30 bg-primary/5',
  low: 'border-border bg-muted/30',
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-status-error/15 text-status-error',
  high: 'bg-status-warning/15 text-status-warning',
  medium: 'bg-primary/15 text-primary',
  low: 'bg-muted text-muted-foreground',
}

interface Props {
  data: RoleGuideData
  onComplete?: () => void
}

export const RoleWhyItMatters: React.FC<Props> = ({ data }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exposureScore = useMemo(() => {
    let total = 0
    let maxTotal = 0
    for (const item of data.selfAssessment) {
      maxTotal += item.weight
      if (checkedItems.has(item.id)) total += item.weight
    }
    return maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0
  }, [checkedItems, data.selfAssessment])

  const exposureLevel = exposureScore >= 70 ? 'High' : exposureScore >= 40 ? 'Medium' : 'Low'
  const exposureLevelClass =
    exposureScore >= 70
      ? 'text-status-error'
      : exposureScore >= 40
        ? 'text-status-warning'
        : 'text-status-success'

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Role-specific urgency statement */}
      <div className="glass-panel p-5 border-l-4 border-primary">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-foreground/90">{data.urgencyStatement}</p>
        </div>
      </div>

      {/* Impact Matrix */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield size={18} className="text-primary" />
          Quantum Threat Impact on Your Role
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.threatImpacts.map((impact) => {
            const isExpanded = expandedId === impact.id
            return (
              <div
                key={impact.id}
                className={`glass-panel p-4 border-l-4 ${SEVERITY_STYLES[impact.severity]} transition-all`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-foreground">{impact.title}</h4>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${SEVERITY_BADGE[impact.severity]}`}
                      >
                        {impact.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{impact.description}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={12} className="text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">{impact.timeframe}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setExpandedId(isExpanded ? null : impact.id)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={isExpanded ? 'Collapse scenario' : 'Expand scenario'}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </Button>
                </div>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-foreground/80 italic">
                      <strong className="not-italic text-foreground">Scenario:</strong>{' '}
                      {impact.exampleScenario}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Self-Assessment Checklist */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <CheckSquare size={18} className="text-primary" />
          Self-Assessment: Does This Apply to You?
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Check the items that apply to your organization. Your exposure score updates in real time.
        </p>

        <div className="space-y-2 mb-6">
          {data.selfAssessment.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checkedItems.has(item.id)}
                onChange={() => toggleCheck(item.id)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm text-foreground/90">{item.label}</span>
            </label>
          ))}
        </div>

        {/* Exposure Score */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Your Quantum Exposure Score</span>
            <span className={`text-lg font-bold ${exposureLevelClass}`}>
              {exposureScore}% &mdash; {exposureLevel}
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                exposureScore >= 70
                  ? 'bg-status-error'
                  : exposureScore >= 40
                    ? 'bg-status-warning'
                    : 'bg-status-success'
              }`}
              style={{ width: `${exposureScore}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {exposureScore >= 70
              ? 'Your organization has significant quantum exposure. Prioritize PQC migration planning immediately.'
              : exposureScore >= 40
                ? 'Moderate exposure detected. Begin building awareness and planning your migration timeline.'
                : 'Lower exposure, but proactive planning is still recommended to stay ahead of regulatory deadlines.'}
          </p>
        </div>
      </div>
    </div>
  )
}
