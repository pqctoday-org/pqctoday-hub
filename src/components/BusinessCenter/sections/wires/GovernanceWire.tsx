// SPDX-License-Identifier: GPL-3.0-only
/**
 * GovernanceWire — Command Center Fig 3 Governance zone data wire.
 *
 * Three sub-blocks (each renders only if its source data is present):
 *   1. Tracked frameworks  — informational under Standards / Regulations.
 *   2. Industry threats    — top 3-5 from /threats filtered by metrics.industry.
 *   3. Industry + country  — chips under Business Requirements.
 */
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Briefcase, Calendar, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BusinessMetrics } from '../../hooks/useBusinessMetrics'
import { FrameworkDeadlineList } from '../../widgets/FrameworkDeadlineList'
import { threatsData, type ThreatData } from '@/data/threatsData'

export interface GovernanceWireProps {
  metrics: BusinessMetrics
}

const CRITICALITY_RANK: Record<ThreatData['criticality'], number> = {
  Critical: 5,
  High: 4,
  'Medium-High': 3,
  Medium: 2,
  Low: 1,
}

const CRITICALITY_STYLE: Record<ThreatData['criticality'], string> = {
  Critical: 'bg-destructive/15 text-destructive border-destructive/30',
  High: 'bg-status-error/15 text-status-error border-status-error/30',
  'Medium-High': 'bg-status-warning/15 text-status-warning border-status-warning/30',
  Medium: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  Low: 'bg-muted text-muted-foreground border-border',
}

function FrameworksBlock({ metrics }: { metrics: BusinessMetrics }) {
  const navigate = useNavigate()
  if (metrics.trackedFrameworks.length === 0) return null
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Standards &amp; Regulations · {metrics.trackedFrameworks.length} tracked
          </span>
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={() => navigate('/compliance')}
          className="h-auto p-0 text-xs"
        >
          Manage on Compliance <ArrowRight size={12} className="ml-0.5" />
        </Button>
      </div>
      <FrameworkDeadlineList frameworks={metrics.trackedFrameworks} limit={5} />
    </div>
  )
}

function ThreatsBlock({ metrics }: { metrics: BusinessMetrics }) {
  const navigate = useNavigate()
  const industry = metrics.industry
  const matched = useMemo(() => {
    if (!industry) return []
    const lower = industry.toLowerCase()
    return threatsData
      .filter((t) => t.industry.toLowerCase() === lower)
      .sort(
        (a, b) => (CRITICALITY_RANK[b.criticality] ?? 0) - (CRITICALITY_RANK[a.criticality] ?? 0)
      )
      .slice(0, 5)
  }, [industry])

  if (!industry || matched.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Threats · {industry} · top {matched.length}
          </span>
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={() => navigate('/threats')}
          className="h-auto p-0 text-xs"
        >
          Open Threats <ArrowRight size={12} className="ml-0.5" />
        </Button>
      </div>
      <div className="space-y-1.5">
        {matched.map((t) => (
          <div
            key={t.threatId}
            className="flex items-start gap-2 p-2 rounded border border-border bg-card/50"
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${CRITICALITY_STYLE[t.criticality]}`}
            >
              {t.criticality}
            </span>
            <p className="text-xs text-foreground/85 leading-relaxed flex-1 min-w-0">
              {t.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ContextChipsBlock({ metrics }: { metrics: BusinessMetrics }) {
  const navigate = useNavigate()
  const hasContext = metrics.industry || metrics.country
  if (!hasContext) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/10 p-3">
        <div className="flex items-start gap-2">
          <Briefcase size={16} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1 flex-wrap">
            Business context not yet set — complete the assessment to populate industry +
            jurisdiction.
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/assess')}
              className="h-auto p-0 text-xs"
            >
              Open Assess
            </Button>
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Briefcase size={14} className="text-muted-foreground" />
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
        Business Requirements
      </span>
      {metrics.industry && (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">
          {metrics.industry}
        </span>
      )}
      {metrics.country && (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-accent/10 text-accent">
          {metrics.country}
        </span>
      )}
      <Button
        variant="link"
        size="sm"
        onClick={() => navigate('/assess')}
        className="h-auto p-0 text-xs"
      >
        Edit
      </Button>
    </div>
  )
}

export const GovernanceWire: React.FC<GovernanceWireProps> = ({ metrics }) => {
  return (
    <div className="space-y-3">
      <ContextChipsBlock metrics={metrics} />
      <FrameworksBlock metrics={metrics} />
      <ThreatsBlock metrics={metrics} />
    </div>
  )
}
