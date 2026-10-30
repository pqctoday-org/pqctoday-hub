// SPDX-License-Identifier: AGPL-3.0-only
import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { usePersonaStore } from '@/store/usePersonaStore'
import {
  DataDrivenScorecard,
  KpiPersonaSelector,
  type ScorecardObservation,
} from '@/components/PKILearning/common/executive'
import { CompleteStepAction } from '@/components/PKILearning/common/CompleteStepAction'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { MarkdownView } from '@/components/ui/MarkdownView'
import type { KpiPersonaId } from '@/data/kpiCatalog'
import { KPI_PERSONAS, buildDimensions } from '@/data/kpiCatalog'
import {
  OVERALL_SCORE_MIN_COVERAGE,
  scoredWeightShare,
} from '@/components/PKILearning/common/executive/scorecardCoverage'
import type { PolicyOutput } from '../types'

const SURFACE = 'governance' as const

function coercePersona(p: string | null | undefined): KpiPersonaId {
  if (p && (KPI_PERSONAS as readonly string[]).includes(p)) return p as KpiPersonaId
  return 'executive'
}

// Honest methodology note — describes the score the dashboard actually computes
// (a weighted average of the KPI sliders), grounded in the framework's KPI pack.
const METHODOLOGY_MD = `## How this score is computed

The **Overall Score** is the weighted average of the KPI sliders below, using the
per-persona weights in the Weight column (they sum to 100%). Each KPI is a 0–100
measure; the weighted average is rounded to a whole number. A combined score is
withheld until at least 70% of the weight of the KPIs that can be scored has
organization-specific evidence; KPIs marked data unavailable are left out of that total. Missing rows remain visible and never improve the result by disappearing.

The KPI set follows the Applied Quantum framework's Board-Level KPI Pack —
Coverage, Trust, Inventory, Vendors, and Agility, each with year-1/2/3 targets
(see Program Foundations · Metrics, KPIs & Reporting). Catalog-wide figures are
shown only as an educational comparison and never enter the organization score.
`

interface KPIDashboardBuilderProps {
  policyOutput?: PolicyOutput | null
}

/** Persisted shape of a saved KPI dashboard — the read-back half of `persistScorecard`. */
interface SavedKpiInputs {
  scores?: Record<string, number>
  weights?: Record<string, number>
  activePersona?: KpiPersonaId
  observations?: Record<string, ScorecardObservation>
}

interface KpiSnapshot extends SavedKpiInputs {
  savedAt: string
}

const SNAPSHOT_KEY = 'pqctoday-kpi-dashboard-snapshots-v1'

/** Extracted (07192026, Batch 2) so the simulation's real-tool doc generator
 *  renders THIS logic — persistScorecard delegates here. */
export function buildKpiDashboardMarkdown(
  dimensions: ReturnType<typeof buildDimensions>,
  activePersona: KpiPersonaId,
  scores: Record<string, number>,
  weights: Record<string, number>,
  observations: Record<string, ScorecardObservation> = {},
  /** The KPIs the person has set. A manual KPI with no baseline stays "not yet
   *  scored" until it is in this set, as on the scorecard. Omit it to treat every
   *  score passed in as entered (the simulation's generated documents do). */
  touchedIds?: ReadonlySet<string>
): string {
  const ew = (d: (typeof dimensions)[number]) => (d.id in weights ? (weights[d.id] ?? 0) : d.weight)
  const isPending = (d: (typeof dimensions)[number]) =>
    touchedIds !== undefined && d.notYetScored === true && !touchedIds.has(d.id)

  let weightedSum = 0
  let totalWeight = 0
  for (const d of dimensions) {
    const value = scores[d.id] ?? d.autoScore
    if (d.disabled || isPending(d) || value === undefined) continue
    weightedSum += value * ew(d)
    totalWeight += ew(d)
  }
  const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
  const coverage = scoredWeightShare(
    dimensions,
    ew,
    (d) => !isPending(d) && (scores[d.id] ?? d.autoScore) !== undefined
  )

  let md = '# PQC Governance KPI Dashboard\n\n'
  md += `**Persona Lens:** ${activePersona}\n`
  md +=
    coverage >= OVERALL_SCORE_MIN_COVERAGE
      ? `**Overall Score: ${overall}/100**\n\n`
      : `**Overall Score: not available — evidence coverage ${Math.round(coverage * 100)}%**\n\n`
  md += `Generated: ${new Date().toLocaleDateString()}\n\n`
  md += '| KPI | Score | Weight | Target | Period | Owner | Evidence | Verification |\n'
  md += '|-----|-------|--------|--------|--------|-------|----------|--------------|\n'
  for (const d of dimensions) {
    const observation = observations[d.id]
    const lineage = ` | ${observation?.reportingPeriod || 'not provided'} | ${observation?.owner || 'not provided'} | ${observation?.evidenceReference || 'not provided'} | ${observation?.verificationState ?? 'not-verified'} |`
    if (d.disabled) {
      md += `| ${d.label} | _locked_ | ${Math.round(ew(d) * 100)}% | ${d.target ?? '—'}${lineage}\n`
      continue
    }
    const value = scores[d.id] ?? d.autoScore
    md += `| ${d.label} | ${value === undefined || isPending(d) ? '_not yet scored_' : `${value}/100`} | ${Math.round(ew(d) * 100)}% | ${d.target ?? '—'}${lineage}\n`
    md += `\nRaw measure: ${observation?.numerator || 'not provided'} / ${observation?.denominator || 'not provided'} ${observation?.unit || ''}; as of ${observation?.asOfDate || 'not provided'}.\n`
  }

  // Honest methodology — the weighted-average score the dashboard computes.
  md += '\n' + METHODOLOGY_MD + '\n'
  return md
}

export const KPIDashboardBuilder: React.FC<KPIDashboardBuilderProps> = ({ policyOutput }) => {
  const { addExecutiveDocument } = useModuleStore()
  const execData = useExecutiveModuleData()
  const globalPersona = usePersonaStore((s) => s.selectedPersona)
  const savedInputs = useSavedArtifactInputs<SavedKpiInputs>('kpi-dashboard')

  // Scoped persona override (does not mutate global persona store) — restored
  // from the last saved dashboard if one exists.
  const [personaOverride, setPersonaOverride] = useState<KpiPersonaId | null>(
    () => savedInputs?.activePersona ?? null
  )
  const activePersona: KpiPersonaId = personaOverride ?? coercePersona(globalPersona)

  const dimensions = useMemo(
    () => buildDimensions(activePersona, SURFACE, execData, execData.country),
    [activePersona, execData]
  )

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scoresRef = useRef<Record<string, number>>(savedInputs?.scores ?? {})
  // The scorecard reports which KPIs the person has set; the saved Markdown reads
  // the same set so it agrees with the screen about what is still "not yet scored".
  const touchedRef = useRef<ReadonlySet<string>>(new Set(Object.keys(savedInputs?.scores ?? {})))
  const weightsRef = useRef<Record<string, number>>(savedInputs?.weights ?? {})
  const [observations, setObservations] = useState<Record<string, ScorecardObservation>>(
    () => savedInputs?.observations ?? {}
  )
  const observationsRef = useRef<Record<string, ScorecardObservation>>(
    savedInputs?.observations ?? {}
  )
  const [snapshotCount, setSnapshotCount] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) ?? '[]') as unknown
      return Array.isArray(saved) ? saved.length : 0
    } catch {
      return 0
    }
  })
  const [trendSummary, setTrendSummary] = useState<string | null>(null)
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const next = { ...scoresRef.current }
    for (const dimension of dimensions) {
      if (
        !dimension.disabled &&
        dimension.autoScore !== undefined &&
        next[dimension.id] === undefined
      ) {
        next[dimension.id] = dimension.autoScore
      }
    }
    scoresRef.current = next
  }, [dimensions])

  // Persist using the SAME effective weights the on-screen scorecard shows — the
  // user's weight edits, falling back to the per-persona defaults — so the saved
  // artifact always matches what's on screen (not the defaults).
  const persistScorecard = useCallback(() => {
    const md = buildKpiDashboardMarkdown(
      dimensions,
      activePersona,
      scoresRef.current,
      weightsRef.current,
      observationsRef.current,
      touchedRef.current
    )

    addExecutiveDocument({
      id: `kpi-dashboard-${activePersona}-pqc-governance`,
      moduleId: 'pqc-governance',
      type: 'kpi-dashboard',
      title: `PQC Governance KPI Dashboard — ${activePersona}`,
      data: md,
      // Persist the structured scorecard so it is restorable (round-trips through
      // useSavedArtifactInputs on next mount).
      inputs: {
        scores: scoresRef.current,
        weights: weightsRef.current,
        activePersona,
        observations: observationsRef.current,
      },
      createdAt: Date.now(),
    })
  }, [dimensions, addExecutiveDocument, activePersona])

  // Persistent done-state for the explicit Save button. The debounced auto-save
  // stays as a convenience, but there's now a visible button + feedback (R3).
  const [wasSaved, setWasSaved] = useState(false)
  const [dirtySinceSave, setDirtySinceSave] = useState(false)

  const scheduleSave = useCallback(() => {
    setDirtySinceSave(true)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(persistScorecard, 500)
  }, [persistScorecard])

  const handleSaveNow = useCallback(() => {
    persistScorecard()
    try {
      const parsed = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) ?? '[]') as unknown
      const history: KpiSnapshot[] = Array.isArray(parsed) ? (parsed as KpiSnapshot[]) : []
      const previous = history[0]
      if (previous?.scores) {
        let improving = 0
        let unchanged = 0
        let worsening = 0
        for (const [id, value] of Object.entries(scoresRef.current)) {
          const prior = previous.scores[id]
          if (prior === undefined) continue
          if (value > prior) improving++
          else if (value < prior) worsening++
          else unchanged++
        }
        setTrendSummary(
          `Compared with the previous snapshot: ${improving} improving, ${unchanged} unchanged, ${worsening} worsening.`
        )
      }
      history.unshift({
        savedAt: new Date().toISOString(),
        scores: { ...scoresRef.current },
        weights: { ...weightsRef.current },
        activePersona,
        observations: { ...observationsRef.current },
      })
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(history.slice(0, 12)))
      setSnapshotCount(Math.min(12, history.length))
    } catch {
      // Artifact save still succeeds when browser storage is unavailable.
    }
    setWasSaved(true)
    setDirtySinceSave(false)
  }, [persistScorecard, activePersona])

  const handleScoreChange = useCallback(
    (scores: Record<string, number>) => {
      scoresRef.current = scores
      scheduleSave()
    },
    [scheduleSave]
  )

  const handleTouchedChange = useCallback((ids: Set<string>) => {
    touchedRef.current = ids
  }, [])

  // Weight edits must also re-persist (with the latest scores) so saved == on-screen.
  const handleWeightChange = useCallback(
    (weights: Record<string, number>) => {
      weightsRef.current = weights
      scheduleSave()
    },
    [scheduleSave]
  )

  const handleObservationChange = useCallback(
    (dimensionId: string, observation: ScorecardObservation) => {
      setObservations((previous) => {
        const next = { ...previous, [dimensionId]: observation }
        observationsRef.current = next
        return next
      })
      scheduleSave()
    },
    [scheduleSave]
  )

  const lockedDimensions = useMemo(() => dimensions.filter((d) => d.disabled), [dimensions])
  const lockedWeightPct = useMemo(
    () => Math.round(lockedDimensions.reduce((sum, d) => sum + d.weight, 0) * 100),
    [lockedDimensions]
  )

  const seedSources: string[] = []
  if (execData.industry) seedSources.push(`industry (${execData.industry})`)
  if (execData.riskScore !== null) seedSources.push('assessment risk score')
  if (execData.myFrameworks.length > 0)
    seedSources.push(
      `${execData.myFrameworks.length} framework${execData.myFrameworks.length !== 1 ? 's' : ''} from /compliance`
    )
  if (execData.myProducts.length > 0)
    seedSources.push(
      `${execData.myProducts.length} product${execData.myProducts.length !== 1 ? 's' : ''} from /migrate`
    )
  if (execData.myThreats.length > 0)
    seedSources.push(
      `${execData.myThreats.length} threat${execData.myThreats.length !== 1 ? 's' : ''} from /threats`
    )
  if (execData.migrationDeadlineYear)
    seedSources.push(`deadline year ${execData.migrationDeadlineYear} from /timeline`)

  return (
    <div className="space-y-6">
      {policyOutput && (
        <PreFilledBanner
          summary={`Policy type: ${policyOutput.policyType}. Set KPI targets to match your policy commitments.`}
        />
      )}
      {seedSources.length > 0 && (
        <PreFilledBanner
          summary={`Organizational context available from ${seedSources.join(' + ')}.`}
        />
      )}
      <div className="rounded-md border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
        <strong className="text-foreground">Catalog comparison — not part of your score:</strong>{' '}
        PQC Today currently records {execData.totalProducts} products; its tier-weighted readiness
        benchmark is {Math.round(execData.vendorReadinessWeighted * 100)}%. Your organizational
        vendor and FIPS KPIs use only products you explicitly select in Migrate.
      </div>
      {lockedDimensions.length > 0 && (
        <div className="rounded-md border border-status-warning/30 bg-status-warning/5 p-3 text-xs text-foreground/80">
          <strong className="text-status-warning">
            {lockedDimensions.length} of {dimensions.length} KPIs
          </strong>{' '}
          — {lockedWeightPct}% of weight — need assessment or compliance data to unlock. Complete
          the linked step on each locked KPI below to bring it into the score.
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground flex-1">
          Enter evidence-backed KPI values for your organization. Vendor and FIPS rows use only
          products you selected in Migrate; catalog-wide figures stay in the separate comparison
          above. Weights adapt to the selected persona lens.
        </p>
        <div className="flex max-w-full flex-wrap items-center gap-2">
          <CompleteStepAction
            recordsArtifact
            saved={wasSaved}
            editedSinceSave={wasSaved && dirtySinceSave}
            onClick={handleSaveNow}
          />
          <KpiPersonaSelector value={activePersona} onChange={setPersonaOverride} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {snapshotCount === 0
          ? 'Save creates the first dated browser-local snapshot for later trend comparison.'
          : `${snapshotCount} dated snapshot${snapshotCount === 1 ? '' : 's'} stored locally in this browser (maximum 12).`}
      </p>
      {trendSummary && (
        <p className="text-xs text-foreground" role="status">
          {trendSummary}
        </p>
      )}

      <CollapsibleSection
        title="How this score is computed"
        icon={<Info size={14} className="text-primary" aria-hidden="true" />}
        defaultOpen={false}
      >
        <MarkdownView content={METHODOLOGY_MD} />
      </CollapsibleSection>

      {execData.migrationDeadlineYear && (
        <div className="glass-panel p-4 border-primary/20">
          <p className="text-sm text-foreground">
            <span className="font-semibold text-primary">
              {execData.migrationDeadlineBinding ? 'Binding milestone:' : 'Planning milestone:'}
            </span>{' '}
            {execData.migrationDeadlineYear}
            {execData.country ? ` (${execData.country})` : ''} — Pace-to-Deadline weights adjust
            only after you enter organization-specific progress for the {activePersona} lens.
          </p>
        </div>
      )}

      <DataDrivenScorecard
        title="PQC Governance KPIs"
        description={`Weighted scorecard — ${activePersona} lens.`}
        dimensions={dimensions}
        colorScale="readiness"
        onScoreChange={handleScoreChange}
        onTouchedChange={handleTouchedChange}
        onWeightChange={handleWeightChange}
        initialScores={savedInputs?.scores}
        initialWeights={savedInputs?.weights}
        allowWeightEditing={true}
        showExport={true}
        exportFilename={`pqc-governance-kpi-${activePersona}`}
        exportFormats={['markdown', 'csv', 'pdf']}
        includeTargetsInExport={true}
        minimumCoverageForOverall={OVERALL_SCORE_MIN_COVERAGE}
        observations={observations}
        onObservationChange={handleObservationChange}
      />
    </div>
  )
}
