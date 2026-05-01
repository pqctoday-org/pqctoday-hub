// SPDX-License-Identifier: GPL-3.0-only
/**
 * RiskManagementWire — Command Center Fig 3 Risk Management zone data wire.
 *
 * Two sub-blocks:
 *   1. Assessment health tile  — riskLevel + riskScore + complianceGapCount,
 *      links to /assess (state-aware: not-started / in-progress / complete).
 *   2. Tracked frameworks list — reuses existing <FrameworkDeadlineList>,
 *      links to /compliance.
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Activity,
  Calendar,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BusinessMetrics } from '../../hooks/useBusinessMetrics'
import { FrameworkDeadlineList } from '../../widgets/FrameworkDeadlineList'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { threatsData } from '@/data/threatsData'

export interface RiskManagementWireProps {
  metrics: BusinessMetrics
}

const RISK_LEVEL_STYLES: Record<string, string> = {
  low: 'bg-status-success/10 text-status-success border-status-success/30',
  medium: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  high: 'bg-status-error/10 text-status-error border-status-error/30',
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
}

function HealthTile({ metrics }: { metrics: BusinessMetrics }) {
  const navigate = useNavigate()
  const status = metrics.assessmentStatus

  if (status === 'not-started') {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 flex items-start gap-3">
        <Activity size={18} className="text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground">No assessment run yet</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            A risk assessment seeds the framework deadlines, risk score, and compliance gap tracker
            for this zone.
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => navigate('/assess')} className="gap-1">
          Start <ArrowRight size={12} />
        </Button>
      </div>
    )
  }

  if (status === 'in-progress') {
    return (
      <div className="rounded-lg border border-status-warning/30 bg-status-warning/5 p-3 flex items-start gap-3">
        <Activity size={18} className="text-status-warning shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground">Assessment in progress</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Resume the wizard to finalise your risk score and compliance gaps.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/assess')} className="gap-1">
          Resume <ArrowRight size={12} />
        </Button>
      </div>
    )
  }

  // complete
  const levelStyle =
    (metrics.riskLevel && RISK_LEVEL_STYLES[metrics.riskLevel]) ?? RISK_LEVEL_STYLES.medium

  const delta =
    metrics.riskScore !== null && metrics.previousRiskScore !== null
      ? metrics.riskScore - metrics.previousRiskScore
      : null

  return (
    <div className="rounded-lg border border-border bg-card/50 p-3 flex items-center gap-3 flex-wrap">
      <Activity size={18} className="text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">Assessment health</span>
          {metrics.riskLevel && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${levelStyle}`}
            >
              {metrics.riskLevel}
            </span>
          )}
          {metrics.riskScore !== null && (
            <span className="text-[10px] font-mono text-muted-foreground">
              score {metrics.riskScore}/100
            </span>
          )}
          {delta !== null && delta !== 0 && (
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${delta > 0 ? 'text-status-error' : 'text-status-success'}`}
              title={`Risk score changed ${delta > 0 ? '+' : ''}${delta} vs. previous assessment`}
            >
              {delta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {delta > 0 ? '+' : ''}
              {delta} vs. prev
            </span>
          )}
          {delta === 0 && metrics.previousRiskScore !== null && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/60"
              title="No change vs. previous assessment"
            >
              <Minus size={10} /> no change
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {metrics.complianceGapCount > 0
            ? `${metrics.complianceGapCount} compliance gap${metrics.complianceGapCount !== 1 ? 's' : ''} flagged`
            : 'No compliance gaps flagged'}
        </p>
      </div>
      <Button variant="link" size="sm" onClick={() => navigate('/assess')} className="h-auto p-0">
        View assessment <ArrowRight size={12} className="ml-0.5" />
      </Button>
    </div>
  )
}

function FrameworkBlock({ metrics }: { metrics: BusinessMetrics }) {
  const navigate = useNavigate()
  if (metrics.trackedFrameworks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/10 p-3">
        <div className="flex items-start gap-2">
          <Calendar size={16} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1 flex-wrap">
            No frameworks tracked yet — frameworks are seeded from your country selection on
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/assess')}
              className="h-auto p-0 text-xs"
            >
              /assess
            </Button>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Tracked frameworks ({metrics.trackedFrameworks.length})
          </span>
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={() => navigate('/compliance')}
          className="h-auto p-0 text-xs"
        >
          Open Compliance <ArrowRight size={12} className="ml-0.5" />
        </Button>
      </div>
      <FrameworkDeadlineList frameworks={metrics.trackedFrameworks} limit={6} />
    </div>
  )
}

function TrackedThreatsBlock() {
  const navigate = useNavigate()
  const myThreats = useBookmarkStore((s) => s.myThreats)
  if (myThreats.length === 0) return null
  const tracked = threatsData.filter((t) => myThreats.includes(t.threatId))
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Tracked threats from /threats ({tracked.length})
          </span>
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={() => navigate('/threats')}
          className="h-auto p-0 text-xs"
        >
          Manage <ArrowRight size={12} className="ml-0.5" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tracked.slice(0, 8).map((t) => (
          <span
            key={t.threatId}
            className="text-[10px] px-2 py-0.5 rounded bg-muted text-foreground border border-border"
            title={t.description}
          >
            {t.threatId}
          </span>
        ))}
        {tracked.length > 8 && (
          <span className="text-[10px] text-muted-foreground">+{tracked.length - 8} more</span>
        )}
      </div>
    </div>
  )
}

export const RiskManagementWire: React.FC<RiskManagementWireProps> = ({ metrics }) => {
  return (
    <div className="space-y-3">
      <HealthTile metrics={metrics} />
      <TrackedThreatsBlock />
      <FrameworkBlock metrics={metrics} />
    </div>
  )
}
