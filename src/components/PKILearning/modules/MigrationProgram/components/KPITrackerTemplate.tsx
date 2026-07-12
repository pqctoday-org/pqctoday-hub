// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { useSavedArtifactOutput } from '@/hooks/useSavedArtifactInputs'
import type { RoadmapOutput } from '../types'
import { usePersonaStore } from '@/store/usePersonaStore'
import {
  DataDrivenScorecard,
  ExportableArtifact,
  KpiPersonaSelector,
} from '@/components/PKILearning/common/executive'
import type { KpiDefinition, KpiPersonaId } from '@/data/kpiCatalog'
import { KPI_CATALOG, KPI_PERSONAS, buildDimensions } from '@/data/kpiCatalog'
import { rowsToCsv } from '@/services/export/csvExport'

const MODULE_ID = 'migration-program'
const SURFACE = 'migration' as const
// Stable reference — using `?? []` inside the zustand selector would return
// a new empty array on every call, failing Object.is equality and causing
// an infinite re-render loop.
const EMPTY_HISTORY: { ts: number; score: number }[] = []

function coercePersona(p: string | null | undefined): KpiPersonaId {
  if (p && (KPI_PERSONAS as readonly string[]).includes(p)) return p as KpiPersonaId
  return 'executive'
}

function trendSummary(history: { ts: number; score: number }[]): string {
  if (history.length < 2) return 'insufficient history'
  const first = history[0].score
  const last = history[history.length - 1].score
  const delta = last - first
  const arrow = delta > 2 ? '↑' : delta < -2 ? '↓' : '→'
  return `${arrow} ${delta > 0 ? '+' : ''}${delta.toFixed(0)} over ${history.length} snapshots`
}

// Control-framework cross-references, keyed by KPI id — already computed on
// every KPI_CATALOG entry but previously never surfaced past the catalog.
const KPI_MAPPINGS_BY_ID = new Map(KPI_CATALOG.map((k) => [k.id, k.mappings]))

/** Per-layer rows expand a meta-KPI id to `${id}:${layer}` (see
 *  `buildDimensions`'s vendor-readiness-by-layer handling) — fall back to the
 *  meta-KPI's own mappings for those synthetic ids. */
function mappingsFor(dimId: string): KpiDefinition['mappings'] {
  return KPI_MAPPINGS_BY_ID.get(dimId) ?? KPI_MAPPINGS_BY_ID.get(dimId.split(':')[0])
}

function formatMappings(m: KpiDefinition['mappings']): string {
  if (!m) return '—'
  const parts: string[] = []
  if (m.csf2) parts.push(`CSF 2.0 ${m.csf2}`)
  if (m.iso27001) parts.push(`ISO 27001 ${m.iso27001}`)
  if (m.soc2) parts.push(`SOC 2 ${m.soc2}`)
  return parts.length > 0 ? parts.join(' · ') : '—'
}

interface KPITrackerTemplateProps {
  roadmapOutput?: RoadmapOutput | null
}

export const KPITrackerTemplate: React.FC<KPITrackerTemplateProps> = ({ roadmapOutput }) => {
  const execData = useExecutiveModuleData()
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const pushRiskScoreSnapshot = useModuleStore((s) => s.pushRiskScoreSnapshot)
  const riskHistory = useModuleStore((s) => s.kpiHistory?.riskScore) ?? EMPTY_HISTORY
  const globalPersona = usePersonaStore((s) => s.selectedPersona)

  const [personaOverride, setPersonaOverride] = useState<KpiPersonaId | null>(null)
  const activePersona: KpiPersonaId = personaOverride ?? coercePersona(globalPersona)

  // roadmapOutput only arrives as a live prop inside the linear
  // `/learn/migration-program` wizard. Reached any other way — the
  // Simulation embed or the standalone Business Center route — fall back to
  // the Roadmap Builder's last saved output so the start year still pre-fills.
  const savedRoadmapOutput = useSavedArtifactOutput<RoadmapOutput>('migration-roadmap')
  const effectiveRoadmapOutput = roadmapOutput ?? savedRoadmapOutput ?? null

  // Program start year — user override; falls back to roadmap's earliest milestone year.
  const [startYear, setStartYear] = useState<number | null>(null)
  const effectiveStartYear = startYear ?? effectiveRoadmapOutput?.earliestYear ?? null

  // Record a risk-score snapshot whenever the assessment yields a new value
  useEffect(() => {
    if (execData.riskScore !== null && typeof execData.riskScore === 'number') {
      pushRiskScoreSnapshot(execData.riskScore)
    }
  }, [execData.riskScore, pushRiskScoreSnapshot])

  const dimensions = useMemo(
    () =>
      buildDimensions(
        activePersona,
        SURFACE,
        { ...execData, migrationStartYear: effectiveStartYear },
        execData.country
      ),
    [activePersona, execData, effectiveStartYear]
  )

  // The scorecard manages its own internal scores. We mirror them into local
  // state ONLY when they actually differ — blindly forwarding every sync feeds
  // back into the scorecard's auto-sync effect and causes an update storm.
  const [userScores, setUserScores] = useState<Record<string, number>>({})
  const lastSyncedRef = useRef<string>('')
  const handleScoreSnapshot = useCallback((scores: Record<string, number>) => {
    const signature = JSON.stringify(scores)
    if (signature === lastSyncedRef.current) return
    lastSyncedRef.current = signature
    setUserScores(scores)
  }, [])

  // The scorecard's own touched-set is the authoritative "has the user really
  // set this" signal — a manual KPI dragged to a deliberate 0 is touched, so
  // it must not read as "not yet scored" here just because its value is 0.
  const [touchedIds, setTouchedIds] = useState<Set<string>>(new Set())
  const handleTouchedChange = useCallback((ids: Set<string>) => {
    setTouchedIds(ids)
  }, [])

  // Mirror the scorecard's weight edits so the exported/saved artifact reflects
  // the user's weights, not just the per-persona defaults (saved == on-screen).
  const [userWeights, setUserWeights] = useState<Record<string, number>>({})
  const handleWeightSnapshot = useCallback((weights: Record<string, number>) => {
    setUserWeights(weights)
  }, [])

  const exportMarkdown = useMemo(() => {
    const scores = userScores
    let md = `# PQC Migration KPI Tracker — ${activePersona}\n\n`
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`

    const ew = (d: (typeof dimensions)[number]) =>
      d.id in userWeights ? (userWeights[d.id] ?? 0) : d.weight
    // Manual KPIs with no computed baseline and no score yet read as "not yet
    // scored" rather than a numeric 0 — excluded from the average so it
    // doesn't read as alarmingly low before the user has entered anything.
    // Stops applying the instant the user touches the slider (even to 0),
    // per the scorecard's own touched-set — not a value-based `=== 0` guess.
    const isPending = (d: (typeof dimensions)[number]) =>
      d.notYetScored === true && !touchedIds.has(d.id)
    let totalWeight = 0
    let weightedSum = 0
    for (const d of dimensions) {
      if (d.disabled || isPending(d)) continue
      const score = scores[d.id] ?? d.autoScore ?? 0
      weightedSum += score * ew(d)
      totalWeight += ew(d)
    }
    const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0

    md += `**Persona Lens:** ${activePersona}\n`
    md += `**Overall Migration Progress: ${overall}/100**\n\n`
    md += '## KPI Dimensions\n\n'
    md += '| KPI | Score | Weight | Target | Framework Mappings | Description |\n'
    md += '|-----|-------|--------|--------|---------------------|-------------|\n'
    for (const d of dimensions) {
      if (d.disabled) {
        md += `| ${d.label} | _locked — ${d.disabledReason ?? 'no data'}_ | ${Math.round(ew(d) * 100)}% | ${d.target ?? '—'} | ${formatMappings(mappingsFor(d.id))} | ${d.description} |\n`
        continue
      }
      const scoreCell = isPending(d)
        ? '_not yet scored_'
        : `${scores[d.id] ?? d.autoScore ?? 0}/100`
      md += `| ${d.label} | ${scoreCell} | ${Math.round(ew(d) * 100)}% | ${d.target ?? '—'} | ${formatMappings(mappingsFor(d.id))} | ${d.description} |\n`
    }
    md += '\n## Data Sources\n\n'
    md += `- Vendor / FIPS / threat / compliance KPIs auto-scored from your catalog, threats data, and assessment selections.\n`
    md += `- Risk Posture trend: ${trendSummary(riskHistory)}\n`
    md += `- All other dimensions accept manual input.\n`

    md += '\n---\n\n'
    md +=
      '*Aligned to NIST CSWP 39 §6.5 (Maturity Assessment for Crypto Agility). https://doi.org/10.6028/NIST.CSWP.39-upd1*\n'

    return md
  }, [dimensions, activePersona, riskHistory, userScores, userWeights, touchedIds])

  // Structured CSV (one row per KPI) built from the live dimensions — not the
  // markdown body, so `.csv` opens as real columns in a spreadsheet. Audit C5.
  const exportCsv = useMemo(() => {
    const ew = (d: (typeof dimensions)[number]) =>
      d.id in userWeights ? (userWeights[d.id] ?? 0) : d.weight
    const header = [
      'KPI',
      'Score',
      'Weight %',
      'Target',
      'Framework Mappings',
      'Description',
      'Persona',
    ]
    const rows = dimensions.map((d) => {
      const pending = d.notYetScored === true && !touchedIds.has(d.id)
      const scoreCell = d.disabled
        ? `locked — ${d.disabledReason ?? 'no data'}`
        : pending
          ? 'not yet scored'
          : `${userScores[d.id] ?? d.autoScore ?? 0}/100`
      return [
        d.label,
        scoreCell,
        `${Math.round(ew(d) * 100)}%`,
        d.target ?? '',
        formatMappings(mappingsFor(d.id)),
        d.description,
        activePersona,
      ]
    })
    return rowsToCsv([header, ...rows])
  }, [dimensions, activePersona, userScores, userWeights, touchedIds])

  const handleExport = useCallback(() => {
    addExecutiveDocument({
      id: `kpi-tracker-${activePersona}-${Date.now()}`,
      moduleId: MODULE_ID,
      type: 'kpi-tracker',
      title: `PQC Migration KPI Tracker — ${activePersona}`,
      data: exportMarkdown,
      createdAt: Date.now(),
    })
  }, [addExecutiveDocument, exportMarkdown, activePersona])

  const seedSources: string[] = []
  if (execData.riskScore !== null) seedSources.push('assessment risk score')
  if (execData.totalProducts > 0) seedSources.push(`${execData.totalProducts} catalog products`)
  if (execData.myFrameworks.length > 0)
    seedSources.push(
      `${execData.myFrameworks.length} framework${execData.myFrameworks.length !== 1 ? 's' : ''} from /compliance`
    )
  if (execData.myProducts.length > 0)
    seedSources.push(
      `${execData.myProducts.length} product${execData.myProducts.length !== 1 ? 's' : ''} from /migrate`
    )
  if (execData.migrationDeadlineYear)
    seedSources.push(`deadline ${execData.migrationDeadlineYear} from /timeline`)

  return (
    <div className="space-y-6">
      {seedSources.length > 0 && (
        <PreFilledBanner summary={`Tracker auto-scored from ${seedSources.join(' + ')}.`} />
      )}
      {effectiveRoadmapOutput?.earliestYear != null && (
        <PreFilledBanner
          summary={`Start year set to ${effectiveRoadmapOutput.earliestYear} from your roadmap (earliest milestone, ${roadmapOutput ? 'Step 1' : 'last Roadmap Builder export'}). Adjust below if needed.`}
        />
      )}
      <div className="glass-panel p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Live Data Integration</p>
            <p className="text-xs text-muted-foreground">
              KPIs with data dependencies are auto-scored from your Migrate catalog, threats data,
              assessment, and compliance selections. Locked rows require assessment or compliance
              data to unlock.
            </p>
          </div>
          <KpiPersonaSelector value={activePersona} onChange={setPersonaOverride} />
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            PQC-Ready Vendors:{' '}
            <span className="font-mono text-primary">
              {execData.pqcReadyCount}/{execData.totalProducts}
            </span>
          </span>
          <span>
            Risk Score:{' '}
            <span className="font-mono text-primary">
              {execData.riskScore !== null ? execData.riskScore : 'N/A'}
            </span>
          </span>
          <span>
            Trend: <span className="font-mono text-primary">{trendSummary(riskHistory)}</span>
          </span>
        </div>
      </div>

      <div className="glass-panel p-4">
        <label htmlFor="kpi-start-year" className="text-sm font-medium text-foreground">
          Program start year
        </label>
        <p className="text-xs text-muted-foreground mt-1 mb-2">
          Set this to compute a real <span className="font-medium">Pace-to-Deadline</span> score —
          your PQC-readiness progress vs. the straight-line pace expected between the start year and
          your {execData.migrationDeadlineYear ?? 'target'} deadline (50 = on track, &gt;50 =
          ahead). Until set, Pace-to-Deadline stays a manual slider.
        </p>
        <input
          id="kpi-start-year"
          type="number"
          inputMode="numeric"
          min={2015}
          max={2050}
          value={startYear ?? ''}
          onChange={(e) => setStartYear(e.target.value ? parseInt(e.target.value, 10) : null)}
          placeholder="e.g. 2024"
          className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <DataDrivenScorecard
        title="PQC Migration KPI Tracker"
        description={`Migration progress — ${activePersona} lens.`}
        dimensions={dimensions}
        colorScale="readiness"
        onScoreChange={handleScoreSnapshot}
        onTouchedChange={handleTouchedChange}
        onWeightChange={handleWeightSnapshot}
        allowWeightEditing={true}
        showExport={false}
        exportFilename={`pqc-kpi-tracker-${activePersona}`}
      />

      <ExportableArtifact
        title="KPI Tracker Export"
        exportData={exportMarkdown}
        filename={`pqc-kpi-tracker-${activePersona}`}
        formats={['markdown', 'csv', 'pdf']}
        csvData={exportCsv}
        onExport={handleExport}
      >
        <p className="text-sm text-muted-foreground">
          Export the KPI tracker (markdown, CSV, or PDF) with the current persona lens, scores, and
          data sources.
        </p>
      </ExportableArtifact>
    </div>
  )
}
