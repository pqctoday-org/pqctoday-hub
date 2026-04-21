// SPDX-License-Identifier: GPL-3.0-only

import React, { useState } from 'react'
import { AlertTriangle, Shield, Clock, ChevronDown, ChevronUp } from 'lucide-react'
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

  return (
    <div className="space-y-8 w-full">
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
    </div>
  )
}
