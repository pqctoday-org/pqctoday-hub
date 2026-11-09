// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useCallback, useMemo, useEffect, useId } from 'react'
import { ChevronDown, ChevronUp, Lock, Target } from 'lucide-react'
import { ExportableArtifact } from './ExportableArtifact'
import { rowsToCsv, spreadsheetSafeText } from '@/services/export/csvExport'
import { Button } from '@/components/ui/button'
import {
  scoredWeightShare,
  effectiveScorecardWeight,
  isReadinessDimension,
} from './scorecardCoverage'
import {
  currentKpiValueOrigin,
  kpiValueOriginLabel,
  type KpiValueSource,
  type KpiValueOrigin,
  restoredKpiValueOrigins,
  isKpiValueAssessed,
} from './scorecardValueOrigin'
import {
  REPORTED_PERCENT_MAX,
  parseReportedPercent,
  reportedPercentMessage,
  reportingOnlyScoreCell,
  reportingOnlyStatus,
  withoutNeverEnteredReportingScores,
} from './reportingOnlyMeasure'

export interface ScorecardDimension {
  id: string
  label: string
  description: string
  autoScore?: number
  /** How this worksheet obtains the value, not whether evidence was verified. */
  valueSource?: KpiValueSource
  userOverride?: boolean
  weight: number
  /** Raw reporting measure, excluded even when a saved weight override exists. */
  reportingOnly?: boolean
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

export type ScorecardVerificationState = 'not-verified' | 'owner-reviewed' | 'independently-checked'

export interface ScorecardObservation {
  numerator?: string
  denominator?: string
  unit?: string
  reportingPeriod?: string
  scope?: string
  asOfDate?: string
  owner?: string
  evidenceReference?: string
  verificationState: ScorecardVerificationState
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
  initialValueOrigins?: Record<string, KpiValueOrigin>
  onValueOriginsChange?: (origins: Record<string, KpiValueOrigin>) => void
  /** Hide the composite until this share of the weight of the KPIs that can be scored has evidence. */
  minimumCoverageForOverall?: number
  /** Structured evidence fields shared by screen, saved artifacts and exports. */
  observations?: Record<string, ScorecardObservation>
  onObservationChange?: (dimensionId: string, observation: ScorecardObservation) => void
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
  initialValueOrigins,
  onValueOriginsChange,
  minimumCoverageForOverall = 0,
  observations = {},
  onObservationChange,
}) => {
  const uid = useId()
  // A default 0 that older saves wrote for a reporting-only measure nobody entered
  // restores as missing, not as an entered 0%.
  const [loadedSavedScores] = useState(() =>
    withoutNeverEnteredReportingScores(dimensions, initialScores, initialValueOrigins)
  )
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const d of dimensions) {
      if (!d.reportingOnly || loadedSavedScores?.[d.id] !== undefined) {
        initial[d.id] = loadedSavedScores?.[d.id] ?? d.autoScore ?? 0
      }
    }
    return initial
  })

  const [weightOverrides, setWeightOverrides] = useState<Record<string, number>>(
    () => initialWeights ?? {}
  )
  const [showWeights, setShowWeights] = useState(false)
  const [valueOrigins, setValueOrigins] = useState<Record<string, KpiValueOrigin>>(() =>
    restoredKpiValueOrigins(loadedSavedScores, initialValueOrigins)
  )
  const valueOrigin = useCallback(
    (d: ScorecardDimension) => {
      const origin = valueOrigins[d.id] ?? currentKpiValueOrigin(d, false)
      // Keep the genuine last calculation, but unavailable current inputs cannot
      // support a claim that it is still a current calculation.
      return d.disabled && origin === 'calculated-current' ? 'calculated-snapshot' : origin
    },
    [valueOrigins]
  )
  useEffect(() => {
    const origins = Object.fromEntries(dimensions.map((d) => [d.id, valueOrigin(d)]))
    onValueOriginsChange?.(origins)
    // Only source attribution changes notify callers; an inline callback must not loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions, valueOrigin])

  // Track explicitly recorded learner edits. Restored unknown/calculated values
  // are protected separately by their origin; mere presence is not an edit.
  //
  // Kept as BOTH a ref and mirrored state: the sync effect below reads the ref
  // (stable identity, safe to omit from deps — reading it inside an effect is
  // fine) so it isn't re-triggered by every override and doesn't chain a second
  // setState off of it; `isPending` reads the state copy instead, since that's
  // evaluated during render and refs can't be read there.
  const userOverriddenRef = React.useRef<Set<string>>(
    new Set(
      Object.entries(initialValueOrigins ?? {})
        .filter(([, origin]) => origin === 'learner-entered' || origin === 'learner-override')
        .map(([id]) => id)
    )
  )
  const [userOverridden, setUserOverridden] = useState<Set<string>>(
    () =>
      new Set(
        Object.entries(initialValueOrigins ?? {})
          .filter(([, origin]) => origin === 'learner-entered' || origin === 'learner-override')
          .map(([id]) => id)
      )
  )

  useEffect(() => {
    onTouchedChange?.(userOverridden)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onTouchedChange intentionally excluded: callers rarely memoize it, and including it would fire this on every parent render instead of only when the touched set itself changes.
  }, [userOverridden])

  // Sync auto-scored dimensions from props when they change (e.g., data loads after mount)
  useEffect(() => {
    const next = { ...scores }
    const nextOrigins = { ...valueOrigins }
    let originsChanged = false
    let changed = false
    for (const d of dimensions) {
      if (d.disabled) continue
      if (
        d.valueSource === 'calculated' &&
        valueOrigins[d.id] === undefined &&
        loadedSavedScores?.[d.id] === undefined
      ) {
        nextOrigins[d.id] = 'calculated-current'
        originsChanged = true
      }
      if (
        d.autoScore !== undefined &&
        !userOverriddenRef.current.has(d.id) &&
        valueOrigin(d) !== 'unrecorded' &&
        valueOrigin(d) !== 'calculated-snapshot' &&
        next[d.id] !== d.autoScore
      ) {
        next[d.id] = d.autoScore
        changed = true
      }
    }
    if (originsChanged) setValueOrigins(nextOrigins)
    if (changed) {
      setScores(next)
      onScoreChange?.(next)
    }
  }, [dimensions, onScoreChange, scores, valueOrigin, valueOrigins, loadedSavedScores])

  const handleScoreChange = useCallback(
    (dimId: string, value: number) => {
      if (!Number.isFinite(value)) return
      const dimension = dimensions.find((d) => d.id === dimId)
      // An out-of-range reporting figure is rejected by the field before it gets
      // here; never turn one into a stored 0 by clamping.
      if (dimension?.reportingOnly && (value < 0 || value > REPORTED_PERCENT_MAX)) return
      const clamped = dimension?.reportingOnly ? value : Math.max(0, Math.min(100, value))
      userOverriddenRef.current.add(dimId)
      setValueOrigins((prev) => ({
        ...prev,
        [dimId]: dimension?.valueSource === 'calculated' ? 'learner-override' : 'learner-entered',
      }))
      setUserOverridden((prev) => (prev.has(dimId) ? prev : new Set(prev).add(dimId)))
      const updated = { ...scores, [dimId]: clamped }
      setScores(updated)
      onScoreChange?.(updated)
    },
    [onScoreChange, scores, dimensions]
  )

  // Reported-percent field. The text being typed is held as a draft, so a keystroke
  // that is not yet a number (".", "-", the "e" of "1e3") or that is refused never
  // rewrites the box under the typist. The draft is dropped on blur and the box
  // shows what is stored.
  const [reportedDrafts, setReportedDrafts] = useState<Record<string, string>>({})
  // Why the field last refused what was typed, by dimension id.
  const [reportedErrors, setReportedErrors] = useState<Record<string, string>>({})
  const handleReportedInput = useCallback(
    (d: ScorecardDimension, input: HTMLInputElement) => {
      const text = input.value
      const setDraft = (draft: string) =>
        setReportedDrafts((prev) => ({
          ...Object.fromEntries(Object.entries(prev).filter(([id]) => id !== d.id)),
          [d.id]: draft,
        }))
      const showError = (message: string | undefined) =>
        setReportedErrors((prev) => {
          const without = Object.fromEntries(Object.entries(prev).filter(([id]) => id !== d.id))
          return message === undefined ? without : { ...without, [d.id]: message }
        })
      setDraft(text)
      if (text === '') {
        // A browser reports half-typed number text such as "." or "-", and an
        // exponent that overflows, as an empty value with badInput set. That is not a
        // clear: leave the stored value alone and judge the entry when it is finished.
        if (input.validity?.badInput) return
        showError(undefined)
        // Cleared means never entered again: not a recorded edit.
        userOverriddenRef.current.delete(d.id)
        setUserOverridden((prev) => {
          if (!prev.has(d.id)) return prev
          const touched = new Set(prev)
          touched.delete(d.id)
          return touched
        })
        const next = Object.fromEntries(Object.entries(scores).filter(([id]) => id !== d.id))
        setScores(next)
        setValueOrigins((prev) => ({ ...prev, [d.id]: currentKpiValueOrigin(d, false) }))
        onScoreChange?.(next)
        return
      }
      const parsed = parseReportedPercent(text)
      if (!parsed.ok) {
        showError(reportedPercentMessage(scores[d.id] !== undefined))
        return
      }
      showError(undefined)
      handleScoreChange(d.id, parsed.value)
    },
    [scores, onScoreChange, handleScoreChange]
  )
  const handleReportedBlur = useCallback(
    (d: ScorecardDimension, input: HTMLInputElement) => {
      // Read the box now: the updaters below run after the draft is dropped.
      const unfinished = input.value === '' && Boolean(input.validity?.badInput)
      const hasStoredValue = scores[d.id] !== undefined
      setReportedDrafts((prev) =>
        Object.fromEntries(Object.entries(prev).filter(([id]) => id !== d.id))
      )
      setReportedErrors((prev) => {
        const without = Object.fromEntries(Object.entries(prev).filter(([id]) => id !== d.id))
        // Empty again: nothing is left to correct, so no stale alert.
        if (!hasStoredValue) return without
        return unfinished ? { ...without, [d.id]: reportedPercentMessage(true) } : prev
      })
    },
    [scores]
  )

  const effectiveWeight = useCallback(
    (d: ScorecardDimension): number => effectiveScorecardWeight(d, weightOverrides),
    [weightOverrides]
  )

  // Still "not yet scored" — no computed baseline AND the user hasn't set a
  // value yet. Stops applying the instant the user touches the slider.
  const isPending = useCallback(
    (d: ScorecardDimension): boolean => !isKpiValueAssessed(valueOrigin(d)),
    [valueOrigin]
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
      if (!isReadinessDimension(d) || isPending(d)) continue
      const score = scores[d.id] ?? 0
      const w = effectiveWeight(d)
      weightedSum += score * w
      totalWeight += w
    }
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
  }, [scores, dimensions, effectiveWeight, isPending])

  const intendedWeight = useMemo(
    () => dimensions.reduce((sum, dimension) => sum + effectiveWeight(dimension), 0),
    [dimensions, effectiveWeight]
  )
  const scoredValueCoverage = useMemo(
    () => scoredWeightShare(dimensions, effectiveWeight, (d) => !isPending(d)),
    [dimensions, effectiveWeight, isPending]
  )
  const overallAvailable = scoredValueCoverage >= minimumCoverageForOverall
  const originLabel = useCallback(
    (dimension: ScorecardDimension) =>
      kpiValueOriginLabel(valueOrigin(dimension), dimension.disabled),
    [valueOrigin]
  )

  const exportMarkdown = useMemo(() => {
    let md = `# ${title}\n\n`
    if (description) md += `${description}\n\n`
    md += overallAvailable
      ? `**Overall Score: ${weightedTotal}/100**\n\n`
      : `**Overall Score: not available — scored-value coverage ${Math.round(scoredValueCoverage * 100)}%**\n\n`
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`
    md +=
      'Scored-value coverage is value availability, not evidence verification or production readiness. Sample notes and review labels are learner supplied.\n\n'
    const hasTargets = includeTargetsInExport && dimensions.some((d) => d.target !== undefined)
    md += `| Dimension | Score | Weight${hasTargets ? ' | Target' : ''} | Value origin | Period | Sample owner | Sample reference | Learner-recorded review label |\n`
    md += `|-----------|-------|--------${hasTargets ? '|--------' : ''}|--------------|--------|-------|----------|--------------|\n`
    for (const d of dimensions) {
      const observation = observations[d.id]
      const lineage = ` | ${originLabel(d)} | ${observation?.reportingPeriod || 'not provided'} | ${observation?.owner || 'not provided'} | ${observation?.evidenceReference || 'not provided'} | ${observation?.verificationState ?? 'not-verified'} |`
      if (d.disabled) {
        md += `| ${d.label} | _disabled — ${d.disabledReason ?? 'no data'}_ | ${Math.round(effectiveWeight(d) * 100)}%${hasTargets ? ' | —' : ''}${lineage}\n`
        continue
      }
      if (d.reportingOnly) {
        md += `| ${d.label} | ${reportingOnlyScoreCell(scores[d.id], isPending(d))} | 0%${hasTargets ? ' | —' : ''}${lineage}\n`
        md += `\nRaw measure: ${observation?.numerator || 'not provided'} / ${observation?.denominator || 'not provided'} ${observation?.unit || ''}; scope: ${observation?.scope?.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ') || 'Unknown'}; as of ${observation?.asOfDate || 'not provided'}.\n`
        continue
      }
      const target = hasTargets ? ` | ${d.target !== undefined ? `${d.target}` : '—'}` : ''
      const scoreCell = isPending(d)
        ? `${scores[d.id] ?? 0}/100 — not assessed for current use`
        : `${scores[d.id] ?? 0}/100`
      md += `| ${d.label} | ${scoreCell} | ${Math.round(effectiveWeight(d) * 100)}%${target}${lineage}\n`
      md += `\nRaw measure: ${observation?.numerator || 'not provided'} / ${observation?.denominator || 'not provided'} ${observation?.unit || ''}; as of ${observation?.asOfDate || 'not provided'}.\n`
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
    overallAvailable,
    scoredValueCoverage,
    observations,
    originLabel,
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
      'Origin',
      'Numerator',
      'Denominator',
      'Unit',
      'Reporting Period',
      'As Of',
      'Owner',
      'Evidence Reference',
      'Sample review label (learner recorded)',
      'Raw worksheet value (not an assessed score)',
      'Original saved snapshot value',
      'Current-use status',
      'Included in overall calculation',
      'Scope',
    ]
    const rows = dimensions.map((d) => {
      const observation = observations[d.id]
      return [
        d.id,
        d.label,
        !isReadinessDimension(d) || isPending(d) ? '' : String(scores[d.id] ?? 0),
        (effectiveWeight(d) * 100).toFixed(0),
        d.target ?? '',
        d.disabled ? 'true' : 'false',
        d.disabledReason ?? '',
        originLabel(d),
        observation?.numerator ?? '',
        observation?.denominator ?? '',
        observation?.unit ?? '',
        observation?.reportingPeriod ?? '',
        observation?.asOfDate ?? '',
        observation?.owner ?? '',
        observation?.evidenceReference ?? '',
        observation?.verificationState ?? 'not-verified',
        d.reportingOnly && scores[d.id] === undefined ? '' : String(scores[d.id] ?? 0),
        loadedSavedScores?.[d.id] ?? '',
        d.reportingOnly
          ? reportingOnlyStatus(scores[d.id], isPending(d))
          : d.disabled
            ? 'Required inputs unavailable'
            : isPending(d)
              ? 'Not assessed for current use'
              : 'Assessed sample value',
        !isReadinessDimension(d) || isPending(d) ? 'false' : 'true',
        spreadsheetSafeText(observation?.scope ?? ''),
      ]
    })
    return rowsToCsv([header, ...rows])
  }, [dimensions, scores, effectiveWeight, isPending, observations, originLabel, loadedSavedScores])

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div className="glass-panel p-6 text-center">
        {/* Semantic heading, not just styled text — kpi-tracker and
            kpi-dashboard were the only on-page structure their pages had at
            all before this (no h1/h2/h3), a real screen-reader nav gap. */}
        <h2 className="text-sm font-normal text-muted-foreground mb-2">{title} — Overall Score</h2>
        {overallAvailable ? (
          <>
            <p
              className={`text-3xl md:text-5xl font-bold ${getScoreColor(weightedTotal, colorScale)}`}
            >
              {weightedTotal}
            </p>
            <p className="text-sm text-muted-foreground mt-1">/100</p>
          </>
        ) : (
          <p className="text-xl md:text-2xl font-bold text-muted-foreground">Not yet available</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          Scored-value coverage: {Math.round(scoredValueCoverage * 100)}% of the weight of the KPIs
          that can be scored. This is value availability, not evidence verification or production
          readiness.
          {!overallAvailable && ` — enter sample values before interpreting a combined score.`}
        </p>
        {description && <p className="text-sm text-muted-foreground mt-3">{description}</p>}
        {allowWeightEditing && Math.abs(intendedWeight - 1) > 0.01 && (
          <p className="text-xs text-status-warning mt-2">
            Configured weights sum to {(intendedWeight * 100).toFixed(0)}% — overall score
            auto-normalises.
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
                    disabled={d.disabled || d.reportingOnly}
                  />
                  <span className="w-12 text-right font-mono">
                    {d.reportingOnly
                      ? 'Reporting only'
                      : `${Math.round(effectiveWeight(d) * 100)}%`}
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
                {initialScores?.[d.id] !== undefined && (
                  <p className="text-xs text-muted-foreground ml-6">
                    Saved value: {initialScores[d.id]} — current inputs unavailable; excluded from
                    this score.
                  </p>
                )}
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
                  <p id={`${uid}-${d.id}-title`} className="text-sm font-medium text-foreground">
                    {d.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{d.description}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Origin: {originLabel(d)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {pending ? (
                    <span className="text-xs italic text-muted-foreground">
                      {scores[d.id] !== undefined && initialScores?.[d.id] !== undefined
                        ? `Saved value: ${score}${d.reportingOnly ? '%' : ''} — current use not assessed`
                        : d.reportingOnly
                          ? 'Unknown'
                          : 'Not yet scored'}
                    </span>
                  ) : (
                    <span
                      className={`text-lg font-bold ${d.reportingOnly ? 'text-foreground' : getScoreColor(score, colorScale)}`}
                    >
                      {score}
                      {d.reportingOnly ? '%' : ''}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {d.reportingOnly ? 'Reporting only' : `(${weightPct}%)`}
                  </span>
                </div>
              </div>
              {d.reportingOnly ? (
                <div className="text-xs text-muted-foreground">
                  <label
                    id={`${uid}-${d.id}-label`}
                    htmlFor={`${uid}-${d.id}-input`}
                    className="block"
                  >
                    Reported utilization (%) — excluded from readiness
                  </label>
                  <input
                    id={`${uid}-${d.id}-input`}
                    type="number"
                    min="0"
                    max={REPORTED_PERCENT_MAX}
                    step="any"
                    aria-labelledby={`${uid}-${d.id}-title ${uid}-${d.id}-label`}
                    aria-describedby={
                      reportedErrors[d.id]
                        ? `${uid}-${d.id}-period ${uid}-${d.id}-error`
                        : `${uid}-${d.id}-period`
                    }
                    aria-invalid={reportedErrors[d.id] ? true : undefined}
                    value={reportedDrafts[d.id] ?? scores[d.id] ?? ''}
                    onChange={(event) => handleReportedInput(d, event.currentTarget)}
                    onBlur={(event) => handleReportedBlur(d, event.currentTarget)}
                    className="mt-1 block w-32 rounded border border-border bg-background p-2"
                  />
                  <span id={`${uid}-${d.id}-period`} className="mt-1 block">
                    Period: {observations[d.id]?.reportingPeriod || 'Unknown'} · Scope:{' '}
                    {observations[d.id]?.scope || 'Unknown'}
                  </span>
                  {reportedErrors[d.id] && (
                    <span
                      id={`${uid}-${d.id}-error`}
                      role="alert"
                      className="mt-1 block text-status-error"
                    >
                      {reportedErrors[d.id]}
                    </span>
                  )}
                </div>
              ) : (
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
                      aria-label={`Example target ${d.target}`}
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
              )}
              {pending && (!d.reportingOnly || scores[d.id] !== undefined) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {d.userOverride !== false && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleScoreChange(d.id, score)}
                    >
                      Use displayed sample value
                    </Button>
                  )}
                  {d.valueSource === 'calculated' && d.autoScore !== undefined && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updated = { ...scores, [d.id]: d.autoScore! }
                        setScores(updated)
                        userOverriddenRef.current.delete(d.id)
                        setUserOverridden((prev) => {
                          const next = new Set(prev)
                          next.delete(d.id)
                          return next
                        })
                        setValueOrigins((prev) => ({ ...prev, [d.id]: 'calculated-current' }))
                        onScoreChange?.(updated)
                      }}
                    >
                      Use current calculation ({d.autoScore})
                    </Button>
                  )}
                </div>
              )}
              <details className="mt-3 rounded-md border border-border/70 bg-muted/20 p-3">
                <summary className="cursor-pointer text-xs font-medium text-foreground">
                  Sample measure notes
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {d.reportingOnly && (
                    <label className="space-y-1 text-xs text-muted-foreground">
                      <span>Reporting scope</span>
                      <input
                        type="text"
                        value={observations[d.id]?.scope ?? ''}
                        onChange={(event) =>
                          onObservationChange?.(d.id, {
                            ...observations[d.id],
                            verificationState:
                              observations[d.id]?.verificationState ?? 'not-verified',
                            scope: event.target.value,
                          })
                        }
                        placeholder="Fictional programme or service"
                        className="block w-full rounded border border-border bg-background p-2"
                      />
                    </label>
                  )}
                  {(
                    [
                      ['numerator', 'Numerator', 'Completed or conforming items'],
                      ['denominator', 'Denominator', 'Total in the measured scope'],
                      ['unit', 'Unit', 'systems, products, controls…'],
                      ['reportingPeriod', 'Reporting period', '2026 Q4'],
                      ['asOfDate', 'As-of date', 'YYYY-MM-DD'],
                      ['owner', 'Evidence owner', 'Team or accountable role'],
                      [
                        'evidenceReference',
                        'Evidence reference',
                        'Ticket, report, or repository URL',
                      ],
                    ] as const
                  ).map(([field, label, placeholder]) => (
                    <label key={field} className="space-y-1 text-xs text-muted-foreground">
                      <span>{label}</span>
                      <input
                        type={field === 'asOfDate' ? 'date' : 'text'}
                        value={observations[d.id]?.[field] ?? ''}
                        placeholder={
                          d.reportingOnly && field === 'numerator'
                            ? 'Actual spend'
                            : d.reportingOnly && field === 'denominator'
                              ? 'Approved budget'
                              : placeholder
                        }
                        onChange={(event) =>
                          onObservationChange?.(d.id, {
                            ...observations[d.id],
                            [field]: event.target.value,
                            verificationState:
                              observations[d.id]?.verificationState ?? 'not-verified',
                          })
                        }
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-foreground"
                        aria-label={`${d.label} ${label}`}
                      />
                    </label>
                  ))}
                  <label className="space-y-1 text-xs text-muted-foreground">
                    <span>Sample review label (learner recorded)</span>
                    {/* Native select is intentional: this evidence-state field needs a compact,
                        form-associated control inside each repeated KPI row. */}
                    {/* eslint-disable-next-line no-restricted-syntax */}
                    <select
                      value={observations[d.id]?.verificationState ?? 'not-verified'}
                      onChange={(event) =>
                        onObservationChange?.(d.id, {
                          ...observations[d.id],
                          verificationState: event.target.value as ScorecardVerificationState,
                        })
                      }
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-foreground"
                      aria-label={`${d.label} Verification state`}
                    >
                      <option value="not-verified">Sample: not verified</option>
                      <option value="owner-reviewed">Sample: reviewed by owner</option>
                      <option value="independently-checked">Sample: independently checked</option>
                    </select>
                  </label>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {d.reportingOnly
                    ? 'The raw reported percent may exceed 100 and is independent of the optional actual-spend and approved-budget notes; the Hub does not calculate or verify their consistency.'
                    : 'The slider is an illustrative 0–100 value.'}{' '}
                  These optional fictional measure notes and review labels do not affect
                  scored-value coverage. The Hub does not verify them or assess a deployed system.
                </p>
              </details>
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
