// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { ChevronDown, ChevronUp, Lock, Target } from 'lucide-react'
import { ExportableArtifact } from './ExportableArtifact'
import { rowsToCsv } from '@/services/export/csvExport'
import { Button } from '@/components/ui/button'

export interface ScorecardDimension {
  id: string
  label: string
  description: string
  autoScore?: number
  userOverride?: boolean
  weight: number
  maxScore?: number
  /** When true, render dimension as disabled with `disabledReason`. Excluded from weighted sum. */
  disabled?: boolean
  disabledReason?: string
  /** True when this dimension has no computed baseline (no `autoScore`) and
   *  hasn't been touched by the user yet. Excluded from the weighted average
   *  and rendered as "not yet scored" instead of a numeric 0, so a KPI set
   *  dominated by manual-input dimensions doesn't read as alarmingly low on
   *  first visit. Stops applying the moment the user sets a value (including
   *  a deliberate 0). */
  notYetScored?: boolean
  /** Optional red-line target, rendered as a tick on the slider track (0–100). */
  target?: number
  targetLabel?: string
  /** Optional CTA link for disabled rows (e.g. "Complete assessment → /assess"). */
  disabledActionHref?: string
  disabledActionLabel?: string
}

export type ExportFormat = 'markdown' | 'json' | 'csv' | 'pdf' | 'docx' | 'pptx'

interface DataDrivenScorecardProps {
  title: string
  description?: string
  dimensions: ScorecardDimension[]
  colorScale?: 'risk' | 'readiness' | 'maturity'
  onScoreChange?: (scores: Record<string, number>) => void
  /** Fires whenever the set of dimension ids the user has actually touched
   *  changes — the authoritative "is this really pending" signal. Callers
   *  that re-derive their own pending/"not yet scored" state from the raw
   *  score value alone can't tell a deliberate 0 from an untouched default;
   *  consuming this instead keeps them in sync with this component's own
   *  `isPending` logic. */
  onTouchedChange?: (touchedIds: Set<string>) => void
  /** Allow users to edit weights via a collapsible panel. */
  allowWeightEditing?: boolean
  onWeightChange?: (weights: Record<string, number>) => void
  showExport?: boolean
  exportFilename?: string
  exportFormats?: ExportFormat[]
  /** When true, append a machine-readable CSV line per dimension to markdown exports. */
  includeTargetsInExport?: boolean
  /** Restore previously-saved scores / weight overrides on mount (e.g. from a persisted artifact). */
  initialScores?: Record<string, number>
  initialWeights?: Record<string, number>
}

function getScoreColor(value: number, scale: 'risk' | 'readiness' | 'maturity'): string {
  if (scale === 'risk') {
    if (value >= 75) return 'text-status-error'
    if (value >= 50) return 'text-status-warning'
    return 'text-status-success'
  }
  if (value >= 75) return 'text-status-success'
  if (value >= 50) return 'text-status-warning'
  return 'text-status-error'
}

function getBarColor(value: number, scale: 'risk' | 'readiness' | 'maturity'): string {
  if (scale === 'risk') {
    if (value >= 75) return 'bg-status-error'
    if (value >= 50) return 'bg-status-warning'
    return 'bg-status-success'
  }
  if (value >= 75) return 'bg-status-success'
  if (value >= 50) return 'bg-status-warning'
  return 'bg-status-error'
}

export const DataDrivenScorecard: React.FC<DataDrivenScorecardProps> = ({
  title,
  description,
  dimensions,
  colorScale = 'readiness',
  onScoreChange,
  onTouchedChange,
  allowWeightEditing = false,
  onWeightChange,
  showExport = true,
  exportFilename = 'scorecard',
  exportFormats = ['markdown'],
  includeTargetsInExport = false,
  initialScores,
  initialWeights,
}) => {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const d of dimensions) {
      initial[d.id] = initialScores?.[d.id] ?? d.autoScore ?? 0
    }
    return initial
  })

  const [weightOverrides, setWeightOverrides] = useState<Record<string, number>>(
    () => initialWeights ?? {}
  )
  const [showWeights, setShowWeights] = useState(false)

  // Track which dimensions the user has manually adjusted. Dimensions restored
  // from `initialScores` count as already-overridden so the auto-score sync
  // effect below doesn't immediately clobber the restored value.
  //
  // Kept as BOTH a ref and mirrored state: the sync effect below reads the ref
  // (stable identity, safe to omit from deps — reading it inside an effect is
  // fine) so it isn't re-triggered by every override and doesn't chain a second
  // setState off of it; `isPending` reads the state copy instead, since that's
  // evaluated during render and refs can't be read there.
  const userOverriddenRef = React.useRef<Set<string>>(new Set(Object.keys(initialScores ?? {})))
  const [userOverridden, setUserOverridden] = useState<Set<string>>(
    () => new Set(Object.keys(initialScores ?? {}))
  )

  useEffect(() => {
    onTouchedChange?.(userOverridden)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onTouchedChange intentionally excluded: callers rarely memoize it, and including it would fire this on every parent render instead of only when the touched set itself changes.
  }, [userOverridden])

  // Sync auto-scored dimensions from props when they change (e.g., data loads after mount)
  useEffect(() => {
    setScores((prev) => {
      const next = { ...prev }
      let changed = false
      for (const d of dimensions) {
        if (d.disabled) continue
        // No `> 0` guard here: `notYetScored`/`isPending` (below) already
        // distinguishes "no computed baseline" (autoScore undefined) from a
        // real, legitimate 0 — excluding 0 here would mean a dimension whose
        // live score drops to exactly 0 after mount never gets that update.
        if (
          d.autoScore !== undefined &&
          !userOverriddenRef.current.has(d.id) &&
          next[d.id] !== d.autoScore
        ) {
          next[d.id] = d.autoScore
          changed = true
        }
      }
      if (changed) {
        onScoreChange?.(next)
      }
      return changed ? next : prev
    })
  }, [dimensions, onScoreChange])

  const handleScoreChange = useCallback(
    (dimId: string, value: number) => {
      const clamped = Math.max(0, Math.min(100, value))
      userOverriddenRef.current.add(dimId)
      setUserOverridden((prev) => (prev.has(dimId) ? prev : new Set(prev).add(dimId)))
      setScores((prev) => {
        const updated = { ...prev, [dimId]: clamped }
        onScoreChange?.(updated)
        return updated
      })
    },
    [onScoreChange]
  )

  const effectiveWeight = useCallback(
    (d: ScorecardDimension): number =>
      d.id in weightOverrides ? (weightOverrides[d.id] ?? 0) : d.weight,
    [weightOverrides]
  )

  // Still "not yet scored" — no computed baseline AND the user hasn't set a
  // value yet. Stops applying the instant the user touches the slider.
  const isPending = useCallback(
    (d: ScorecardDimension): boolean => Boolean(d.notYetScored) && !userOverridden.has(d.id),
    [userOverridden]
  )

  const handleWeightChange = useCallback(
    (dimId: string, value: number) => {
      const clamped = Math.max(0, Math.min(1, value))
      setWeightOverrides((prev) => {
        const next = { ...prev, [dimId]: clamped }
        onWeightChange?.(next)
        return next
      })
    },
    [onWeightChange]
  )

  const weightedTotal = useMemo(() => {
    let totalWeight = 0
    let weightedSum = 0
    for (const d of dimensions) {
      if (d.disabled || isPending(d)) continue
      const score = scores[d.id] ?? 0
      const w = effectiveWeight(d)
      weightedSum += score * w
      totalWeight += w
    }
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
  }, [scores, dimensions, effectiveWeight, isPending])

  const weightSum = useMemo(() => {
    let s = 0
    for (const d of dimensions) {
      if (d.disabled || isPending(d)) continue
      s += effectiveWeight(d)
    }
    return s
  }, [dimensions, effectiveWeight, isPending])

  const exportMarkdown = useMemo(() => {
    let md = `# ${title}\n\n`
    if (description) md += `${description}\n\n`
    md += `**Overall Score: ${weightedTotal}/100**\n\n`
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`
    const hasTargets = includeTargetsInExport && dimensions.some((d) => d.target !== undefined)
    md += `| Dimension | Score | Weight${hasTargets ? ' | Target' : ''} |\n`
    md += `|-----------|-------|--------${hasTargets ? '|--------' : ''}|\n`
    for (const d of dimensions) {
      if (d.disabled) {
        md += `| ${d.label} | _disabled — ${d.disabledReason ?? 'no data'}_ | ${Math.round(effectiveWeight(d) * 100)}%${hasTargets ? ' | —' : ''} |\n`
        continue
      }
      const target = hasTargets ? ` | ${d.target !== undefined ? `${d.target}` : '—'}` : ''
      const scoreCell = isPending(d) ? '_not yet scored_' : `${scores[d.id] ?? 0}/100`
      md += `| ${d.label} | ${scoreCell} | ${Math.round(effectiveWeight(d) * 100)}%${target} |\n`
    }
    return md
  }, [
    title,
    description,
    weightedTotal,
    dimensions,
    scores,
    includeTargetsInExport,
    effectiveWeight,
    isPending,
  ])

  // Markdown/PDF read the markdown body; `.csv` reads a structured rows export
  // (built regardless of format order, RFC-4180-escaped). Audit C5.
  const exportData = exportMarkdown
  const exportCsv = useMemo(() => {
    const header = [
      'Dimension ID',
      'Label',
      'Score',
      'Weight %',
      'Target',
      'Disabled',
      'Disabled Reason',
    ]
    const rows = dimensions.map((d) => [
      d.id,
      d.label,
      d.disabled ? '' : isPending(d) ? 'not yet scored' : String(scores[d.id] ?? 0),
      (effectiveWeight(d) * 100).toFixed(0),
      d.target ?? '',
      d.disabled ? 'true' : 'false',
      d.disabledReason ?? '',
    ])
    return rowsToCsv([header, ...rows])
  }, [dimensions, scores, effectiveWeight, isPending])

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div className="glass-panel p-6 text-center">
        {/* Semantic heading, not just styled text — kpi-tracker and
            kpi-dashboard were the only on-page structure their pages had at
            all before this (no h1/h2/h3), a real screen-reader nav gap. */}
        <h2 className="text-sm font-normal text-muted-foreground mb-2">{title} — Overall Score</h2>
        <p className={`text-3xl md:text-5xl font-bold ${getScoreColor(weightedTotal, colorScale)}`}>
          {weightedTotal}
        </p>
        <p className="text-sm text-muted-foreground mt-1">/100</p>
        {description && <p className="text-sm text-muted-foreground mt-3">{description}</p>}
        {allowWeightEditing && Math.abs(weightSum - 1) > 0.01 && (
          <p className="text-xs text-status-warning mt-2">
            Weights sum to {(weightSum * 100).toFixed(0)}% — overall score auto-normalises.
          </p>
        )}
      </div>

      {/* Weight editor (collapsed by default) */}
      {allowWeightEditing && (
        <div className="glass-panel p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWeights((v) => !v)}
            className="w-full flex items-center justify-between"
          >
            <span className="text-sm font-medium">Customise Weights</span>
            {showWeights ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
          {showWeights && (
            <div className="mt-3 space-y-2">
              {dimensions.map((d) => (
                <div key={`w-${d.id}`} className="flex items-center gap-3 text-xs">
                  <span className="w-48 truncate text-muted-foreground">{d.label}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(effectiveWeight(d) * 100)}
                    onChange={(e) => handleWeightChange(d.id, parseInt(e.target.value, 10) / 100)}
                    className="flex-1 accent-primary"
                    disabled={d.disabled}
                  />
                  <span className="w-12 text-right font-mono">
                    {Math.round(effectiveWeight(d) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dimension bars */}
      <div className="space-y-4">
        {dimensions.map((d) => {
          const score = scores[d.id] ?? 0
          const weightPct = Math.round(effectiveWeight(d) * 100)
          if (d.disabled) {
            return (
              <div
                key={d.id}
                className="glass-panel p-4 opacity-60"
                data-testid={`kpi-dim-${d.id}`}
                data-disabled="true"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Lock size={14} className="text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">{d.label}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">({weightPct}%)</span>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  {d.disabledReason ?? 'Data unavailable.'}
                </p>
                {d.disabledActionHref && (
                  <a
                    href={d.disabledActionHref}
                    className="text-xs text-primary underline ml-6 mt-1 inline-block"
                  >
                    {d.disabledActionLabel ?? 'Learn more →'}
                  </a>
                )}
              </div>
            )
          }
          const pending = isPending(d)
          return (
            <div
              key={d.id}
              className="glass-panel p-4"
              data-testid={`kpi-dim-${d.id}`}
              data-pending={pending || undefined}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{d.label}</p>
                  <p className="text-xs text-muted-foreground">{d.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {pending ? (
                    <span className="text-xs italic text-muted-foreground">Not yet scored</span>
                  ) : (
                    <span className={`text-lg font-bold ${getScoreColor(score, colorScale)}`}>
                      {score}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">({weightPct}%)</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${pending ? 'bg-muted-foreground/30' : getBarColor(score, colorScale)}`}
                    style={{ width: `${score}%` }}
                  />
                  {d.target !== undefined && (
                    <div
                      className="absolute top-[-2px] bottom-[-2px] w-0.5 bg-foreground/70"
                      style={{ left: `${d.target}%` }}
                      title={d.targetLabel ?? `Target: ${d.target}`}
                      data-testid={`kpi-target-${d.id}`}
                    />
                  )}
                </div>
                {d.target !== undefined && (
                  <Target
                    size={12}
                    className="text-muted-foreground"
                    aria-label={`Target ${d.target}`}
                  />
                )}
                {d.userOverride !== false && (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => handleScoreChange(d.id, parseInt(e.target.value))}
                    className="w-24 accent-primary"
                    aria-label={`${d.label} score`}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Export */}
      {showExport && (
        <ExportableArtifact
          title={`${title} — Export`}
          exportData={exportData}
          filename={exportFilename}
          formats={exportFormats}
          csvData={exportCsv}
        >
          <p className="text-sm text-muted-foreground">
            Export the scorecard above as a shareable document.
          </p>
        </ExportableArtifact>
      )}
    </div>
  )
}
