// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useCallback } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { DataDrivenScorecard, ExportableArtifact } from '../../../common/executive'
import type { ScorecardDimension } from '../../../common/executive'

const MODULE_ID = 'migration-program'

export const KPITrackerTemplate: React.FC = () => {
  const { pqcReadyCount, totalProducts, riskScore } = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()

  // Auto-score vendor readiness from real product data
  const vendorReadinessScore = useMemo(() => {
    if (totalProducts === 0) return 0
    return Math.round((pqcReadyCount / totalProducts) * 100)
  }, [pqcReadyCount, totalProducts])

  // Auto-score risk trend from assessment risk score (inverted: lower risk = higher KPI score)
  const riskTrendScore = useMemo(() => {
    if (riskScore === null) return 50 // Default to 50% if no assessment completed
    // Risk score is 0-100 where higher = worse; invert for KPI (higher = better)
    return Math.max(0, Math.min(100, 100 - riskScore))
  }, [riskScore])

  const dimensions: ScorecardDimension[] = useMemo(
    () => [
      {
        id: 'systems-inventoried',
        label: 'Systems Inventoried',
        description: 'Percentage of systems with completed crypto inventory',
        weight: 0.15,
        autoScore: 0,
        userOverride: true,
      },
      {
        id: 'algorithms-migrated',
        label: 'Algorithms Migrated',
        description: 'Percentage of vulnerable algorithms replaced with PQC',
        weight: 0.25,
        autoScore: 0,
        userOverride: true,
      },
      {
        id: 'vendors-assessed',
        label: 'Vendors Assessed',
        description: 'Percentage of vendors evaluated for PQC readiness',
        weight: 0.15,
        autoScore: vendorReadinessScore,
        userOverride: true,
      },
      {
        id: 'compliance-gaps',
        label: 'Compliance Gaps Closed',
        description: 'Framework requirements addressed',
        weight: 0.2,
        autoScore: 0,
        userOverride: true,
      },
      {
        id: 'budget-utilization',
        label: 'Budget vs Allocated',
        description: 'Percentage of budget utilized',
        weight: 0.15,
        autoScore: 0,
        userOverride: true,
      },
      {
        id: 'risk-trend',
        label: 'Risk Trend',
        description: 'Risk reduction over time',
        weight: 0.1,
        autoScore: riskTrendScore,
        userOverride: true,
      },
    ],
    [vendorReadinessScore, riskTrendScore]
  )

  const [currentScores, setCurrentScores] = React.useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const d of dimensions) {
      initial[d.id] = d.autoScore ?? 0
    }
    return initial
  })

  const exportMarkdown = useMemo(() => {
    let md = '# PQC Migration KPI Tracker\n\n'
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`

    // Calculate weighted total
    let totalWeight = 0
    let weightedSum = 0
    for (const d of dimensions) {
      const score = currentScores[d.id] ?? 0
      weightedSum += score * d.weight
      totalWeight += d.weight
    }
    const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0

    md += `**Overall Migration Progress: ${overall}/100**\n\n`
    md += '## KPI Dimensions\n\n'
    md += '| KPI | Score | Weight | Description |\n'
    md += '|-----|-------|--------|-------------|\n'
    for (const d of dimensions) {
      md += `| ${d.label} | ${currentScores[d.id] ?? 0}/100 | ${Math.round(d.weight * 100)}% | ${d.description} |\n`
    }
    md += '\n'

    md += '## Data Sources\n\n'
    md += `- Vendors Assessed: Auto-scored from Migrate catalog (${pqcReadyCount}/${totalProducts} PQC-ready)\n`
    md += `- Risk Trend: ${riskScore !== null ? `Auto-scored from assessment (risk score: ${riskScore})` : 'No assessment completed — using default 50%'}\n`
    md += '- All other dimensions: Manual input (adjust with sliders)\n'

    return md
  }, [dimensions, currentScores, pqcReadyCount, totalProducts, riskScore])

  const handleExportToStore = useCallback(() => {
    addExecutiveDocument({
      id: `kpi-tracker-${Date.now()}`,
      moduleId: MODULE_ID,
      type: 'kpi-tracker',
      title: 'PQC Migration KPI Tracker',
      data: exportMarkdown,
      createdAt: Date.now(),
    })
  }, [addExecutiveDocument, exportMarkdown])

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Live Data Integration</p>
            <p className="text-xs text-muted-foreground">
              Vendors Assessed and Risk Trend are auto-scored from your Migrate catalog and
              assessment data. Adjust all dimensions with the sliders.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              PQC-Ready Vendors:{' '}
              <span className="font-mono text-primary">
                {pqcReadyCount}/{totalProducts}
              </span>
            </span>
            <span>
              Risk Score:{' '}
              <span className="font-mono text-primary">
                {riskScore !== null ? riskScore : 'N/A'}
              </span>
            </span>
          </div>
        </div>
      </div>

      <DataDrivenScorecard
        title="PQC Migration KPI Tracker"
        description="Track progress across six key dimensions of your PQC migration program."
        dimensions={dimensions}
        colorScale="readiness"
        onScoreChange={setCurrentScores}
        showExport={false}
        exportFilename="pqc-kpi-tracker"
      />

      <ExportableArtifact
        title="KPI Tracker Export"
        exportData={exportMarkdown}
        filename="pqc-kpi-tracker"
        formats={['markdown', 'csv']}
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Export your KPI tracker with current scores and data sources.
          </p>
          <button
            onClick={handleExportToStore}
            className="px-4 py-2 text-sm rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            Save to Learning Portfolio
          </button>
        </div>
      </ExportableArtifact>
    </div>
  )
}
