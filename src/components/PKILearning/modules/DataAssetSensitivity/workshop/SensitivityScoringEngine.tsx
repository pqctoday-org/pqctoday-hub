// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import { ChevronDown, ChevronUp, ArrowDownUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  scoreAsset,
  getPriorityBand,
  DEFAULT_SCORING_WEIGHTS,
  SENSITIVITY_TIERS,
  RETENTION_CONFIGS,
  type DataAsset,
  type ScoredAsset,
  type ScoringWeights,
} from '../data/sensitivityConstants'

interface SensitivityScoringEngineProps {
  assets: DataAsset[]
  selectedMandates: string[]
  onScoredAssetsChange?: (scored: ScoredAsset[]) => void
}

function clampWeights(
  weights: ScoringWeights,
  changed: keyof ScoringWeights,
  value: number
): ScoringWeights {
  const newWeights = { ...weights, [changed]: value }
  const others = (Object.keys(newWeights) as (keyof ScoringWeights)[]).filter((k) => k !== changed)
  const remaining = 100 - value
  const currentOthersTotal = others.reduce((sum, k) => sum + weights[k], 0)
  if (currentOthersTotal === 0) {
    const each = Math.floor(remaining / others.length)
    others.forEach((k, i) => {
      newWeights[k] = i === others.length - 1 ? remaining - each * (others.length - 1) : each
    })
  } else {
    let distributed = 0
    others.forEach((k, i) => {
      if (i === others.length - 1) {
        newWeights[k] = remaining - distributed
      } else {
        const ratio = weights[k] / currentOthersTotal
        const scaled = Math.round(ratio * remaining)
        newWeights[k] = scaled
        distributed += scaled
      }
    })
  }
  return newWeights
}

function ScoreBar({
  value,
  max = 100,
  colorClass,
}: {
  value: number
  max?: number
  colorClass: string
}) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">{value}</span>
    </div>
  )
}

function AssetScoreRow({ scored, rank }: { scored: ScoredAsset; rank: number }) {
  const [expanded, setExpanded] = useState(false)
  const band = getPriorityBand(scored.compositeScore)
  const tierConfig = SENSITIVITY_TIERS.find((t) => t.id === scored.sensitivityTier)
  const retConfig = RETENTION_CONFIGS.find((r) => r.id === scored.retentionPeriod)

  return (
    <div
      className={`border rounded-lg transition-colors ${expanded ? 'border-primary/30' : 'border-border'}`}
    >
      <div className="flex items-center gap-3 p-3">
        <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">
          {rank}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-bold text-foreground truncate">{scored.name}</span>
            {tierConfig && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${tierConfig.colorClass} ${tierConfig.bgClass} ${tierConfig.borderClass}`}
              >
                {tierConfig.label}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <ScoreBar value={scored.sensitivityScore} colorClass="bg-status-error/70" />
            <ScoreBar value={scored.retentionScore} colorClass="bg-status-warning/70" />
            <ScoreBar value={scored.complianceScore} colorClass="bg-primary/70" />
            <ScoreBar value={scored.hndlScore} colorClass="bg-secondary/70" />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`w-14 text-center py-1.5 rounded-lg border font-bold text-base ${band.colorClass} ${band.bgClass}`}
          >
            {scored.compositeScore}
          </div>
          <span
            className={`hidden sm:inline text-[10px] px-2 py-0.5 rounded border font-bold ${band.colorClass} ${band.bgClass}`}
          >
            {band.label}
          </span>
          <Button
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="p-1 h-auto text-muted-foreground"
            aria-label={expanded ? 'Collapse breakdown' : 'Show breakdown'}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-3">
          <h5 className="text-xs font-bold text-foreground">Score Breakdown</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/30 rounded p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Sensitivity</p>
              <p className="text-lg font-bold text-foreground">{scored.sensitivityScore}</p>
              <p className="text-[9px] text-muted-foreground">{tierConfig?.label}</p>
            </div>
            <div className="bg-muted/30 rounded p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Retention</p>
              <p className="text-lg font-bold text-foreground">{scored.retentionScore}</p>
              <p className="text-[9px] text-muted-foreground">{retConfig?.label}</p>
            </div>
            <div className="bg-muted/30 rounded p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Compliance</p>
              <p className="text-lg font-bold text-foreground">{scored.complianceScore}</p>
              <p className="text-[9px] text-muted-foreground">
                {scored.complianceFlags.length} framework(s)
              </p>
            </div>
            <div className="bg-muted/30 rounded p-2 text-center">
              <p className="text-[10px] text-muted-foreground">HNDL Window</p>
              <p className="text-lg font-bold text-foreground">{scored.hndlScore}</p>
              <p className="text-[9px] text-muted-foreground">{scored.industry}</p>
            </div>
          </div>

          <div className="bg-muted/20 rounded p-3 text-xs text-muted-foreground border border-border">
            <strong className="text-foreground">Composite formula: </strong>
            sensitivityScore × w<sub>S</sub> + retentionScore × w<sub>R</sub> + complianceScore × w
            <sub>C</sub> + hndlScore × w<sub>H</sub>={' '}
            <span className="text-primary font-bold">{scored.compositeScore}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export const SensitivityScoringEngine: React.FC<SensitivityScoringEngineProps> = ({
  assets,
  selectedMandates,
  onScoredAssetsChange,
}) => {
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_SCORING_WEIGHTS)
  const [sortDescending, setSortDescending] = useState(true)

  const assetsWithFlags = useMemo(
    () =>
      assets.map((a) => ({
        ...a,
        complianceFlags: a.complianceFlags.length > 0 ? a.complianceFlags : selectedMandates,
      })),
    [assets, selectedMandates]
  )

  const scored = useMemo(() => {
    const results = assetsWithFlags.map((a) => scoreAsset(a, weights))
    const sorted = [...results].sort((a, b) =>
      sortDescending ? b.compositeScore - a.compositeScore : a.compositeScore - b.compositeScore
    )
    onScoredAssetsChange?.(sorted)
    return sorted
  }, [assetsWithFlags, weights, sortDescending, onScoredAssetsChange])

  const weightTotal = Object.values(weights).reduce((sum, v) => sum + v, 0)
  const isBalanced = weightTotal === 100

  const handleWeightChange = useCallback((key: keyof ScoringWeights, value: number) => {
    setWeights((prev) => clampWeights(prev, key, value))
  }, [])

  const bandCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
    scored.forEach((s) => {
      const band = getPriorityBand(s.compositeScore).label as keyof typeof counts
      counts[band]++
    })
    return counts
  }, [scored])

  if (assets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Add assets in Step 1 to calculate sensitivity scores.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Weight Sliders */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Scoring Weights</h3>
          <span
            className={`text-xs font-mono ${isBalanced ? 'text-status-success' : 'text-status-error'}`}
          >
            Total: {weightTotal}% {isBalanced ? '✓' : '(must sum to 100%)'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            [
              {
                key: 'sensitivity' as const,
                label: 'Sensitivity Tier',
                color: 'bg-status-error/70',
              },
              {
                key: 'retention' as const,
                label: 'Retention Period',
                color: 'bg-status-warning/70',
              },
              { key: 'compliance' as const, label: 'Compliance Exposure', color: 'bg-primary/70' },
              { key: 'hndlWindow' as const, label: 'HNDL Window', color: 'bg-secondary/70' },
            ] as const
          ).map(({ key, label, color }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-mono font-bold text-foreground">{weights[key]}%</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <div className="h-1.5 bg-muted rounded-full mb-2">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${weights[key]}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={70}
                    step={5}
                    value={weights[key]}
                    onChange={(e) => handleWeightChange(key, Number(e.target.value))}
                    className="w-full accent-primary"
                    aria-label={`${label} weight`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Weights auto-adjust to maintain 100% total. Drag sliders to reflect your
          organization&apos;s priorities.
        </p>
      </div>

      {/* Score Legend */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { label: 'Sensitivity', color: 'bg-status-error/70' },
            { label: 'Retention', color: 'bg-status-warning/70' },
            { label: 'Compliance', color: 'bg-primary/70' },
            { label: 'HNDL', color: 'bg-secondary/70' },
          ] as const
        ).map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={`w-3 h-1.5 rounded-full ${color}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Band summary */}
      <div className="grid grid-cols-4 gap-2">
        {(
          [
            {
              band: 'Critical',
              min: 80,
              colorClass: 'text-status-error',
              bgClass: 'bg-status-error/10',
              borderClass: 'border-status-error/30',
            },
            {
              band: 'High',
              min: 60,
              colorClass: 'text-status-warning',
              bgClass: 'bg-status-warning/10',
              borderClass: 'border-status-warning/30',
            },
            {
              band: 'Medium',
              min: 40,
              colorClass: 'text-status-info',
              bgClass: 'bg-status-info/10',
              borderClass: 'border-status-info/30',
            },
            {
              band: 'Low',
              min: 0,
              colorClass: 'text-status-success',
              bgClass: 'bg-status-success/10',
              borderClass: 'border-status-success/30',
            },
          ] as const
        ).map(({ band, colorClass, bgClass, borderClass }) => (
          <div key={band} className={`p-2 rounded-lg border text-center ${bgClass} ${borderClass}`}>
            <p className={`text-lg font-bold ${colorClass}`}>
              {bandCounts[band as keyof typeof bandCounts]}
            </p>
            <p className={`text-[10px] font-bold ${colorClass}`}>{band}</p>
          </div>
        ))}
      </div>

      {/* Scored Assets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Assets by PQC Urgency ({scored.length})
          </h3>
          <Button
            variant="ghost"
            onClick={() => setSortDescending((s) => !s)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <ArrowDownUp size={14} />
            {sortDescending ? 'Highest first' : 'Lowest first'}
          </Button>
        </div>

        {scored.map((s, i) => (
          <AssetScoreRow key={s.id} scored={s} rank={i + 1} />
        ))}
      </div>
    </div>
  )
}
