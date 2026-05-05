// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { usePersonaStore } from '@/store/usePersonaStore'
import {
  DataDrivenScorecard,
  ExportableArtifact,
  KpiPersonaSelector,
} from '@/components/PKILearning/common/executive'
import type { KpiPersonaId } from '@/data/kpiCatalog'
import { KPI_PERSONAS, buildDimensions } from '@/data/kpiCatalog'

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

export const KPITrackerTemplate: React.FC = () => {
  const execData = useExecutiveModuleData()
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const pushRiskScoreSnapshot = useModuleStore((s) => s.pushRiskScoreSnapshot)
  const riskHistory = useModuleStore((s) => s.kpiHistory?.riskScore) ?? EMPTY_HISTORY
  const globalPersona = usePersonaStore((s) => s.selectedPersona)

  const [personaOverride, setPersonaOverride] = useState<KpiPersonaId | null>(null)
  const activePersona: KpiPersonaId = personaOverride ?? coercePersona(globalPersona)

  // Record a risk-score snapshot whenever the assessment yields a new value
  useEffect(() => {
    if (execData.riskScore !== null && typeof execData.riskScore === 'number') {
      pushRiskScoreSnapshot(execData.riskScore)
    }
  }, [execData.riskScore, pushRiskScoreSnapshot])

  const dimensions = useMemo(
    () => buildDimensions(activePersona, SURFACE, execData, execData.country),
    [activePersona, execData]
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

  const exportMarkdown = useMemo(() => {
    const scores = userScores
    let md = `# PQC Migration KPI Tracker — ${activePersona}\n\n`
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`

    let totalWeight = 0
    let weightedSum = 0
    for (const d of dimensions) {
      if (d.disabled) continue
      const score = scores[d.id] ?? d.autoScore ?? 0
      weightedSum += score * d.weight
      totalWeight += d.weight
    }
    const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0

    md += `**Persona Lens:** ${activePersona}\n`
    md += `**Overall Migration Progress: ${overall}/100**\n\n`
    md += '## KPI Dimensions\n\n'
    md += '| KPI | Score | Weight | Target | Description |\n'
    md += '|-----|-------|--------|--------|-------------|\n'
    for (const d of dimensions) {
      if (d.disabled) {
        md += `| ${d.label} | _locked — ${d.disabledReason ?? 'no data'}_ | ${Math.round(d.weight * 100)}% | ${d.target ?? '—'} | ${d.description} |\n`
        continue
      }
      const score = scores[d.id] ?? d.autoScore ?? 0
      md += `| ${d.label} | ${score}/100 | ${Math.round(d.weight * 100)}% | ${d.target ?? '—'} | ${d.description} |\n`
    }
    md += '\n## Data Sources\n\n'
    md += `- Vendor / FIPS / threat / compliance KPIs auto-scored from your catalog, threats data, and assessment selections.\n`
    md += `- Risk Posture trend: ${trendSummary(riskHistory)}\n`
    md += `- All other dimensions accept manual input.\n`

    return md
  }, [dimensions, activePersona, riskHistory, userScores])

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
        <PreFilledBanner
          summary={`Tracker auto-scored from ${seedSources.join(' + ')}.`}
          onClear={() => {
            /* dimensions auto-recompute from live data; clear is informational */
          }}
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

      <DataDrivenScorecard
        title="PQC Migration KPI Tracker"
        description={`Migration progress — ${activePersona} lens.`}
        dimensions={dimensions}
        colorScale="readiness"
        onScoreChange={handleScoreSnapshot}
        allowWeightEditing={true}
        showExport={false}
        exportFilename={`pqc-kpi-tracker-${activePersona}`}
      />

      <ExportableArtifact
        title="KPI Tracker Export"
        exportData={exportMarkdown}
        filename={`pqc-kpi-tracker-${activePersona}`}
        formats={['markdown', 'csv', 'pdf']}
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
