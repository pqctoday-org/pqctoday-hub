// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useCallback } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { DataDrivenScorecard } from '@/components/PKILearning/common/executive'
import type { ScorecardDimension } from '@/components/PKILearning/common/executive'

export const KPIDashboardBuilder: React.FC = () => {
  const { addExecutiveDocument } = useModuleStore()
  const execData = useExecutiveModuleData()

  // Auto-score vendor readiness from real data
  const vendorReadinessScore = useMemo(() => {
    if (execData.totalProducts === 0) return 0
    return Math.round((execData.pqcReadyCount / execData.totalProducts) * 100)
  }, [execData.pqcReadyCount, execData.totalProducts])

  const dimensions: ScorecardDimension[] = useMemo(
    () => [
      {
        id: 'systems-inventoried',
        label: 'Systems Inventoried',
        description: 'Percentage of systems scanned for cryptographic usage (CBOM coverage).',
        weight: 0.2,
        autoScore: 0,
        userOverride: true,
      },
      {
        id: 'algorithms-migrated',
        label: 'Algorithms Migrated',
        description:
          'Percentage of quantum-vulnerable algorithms replaced with PQC or hybrid alternatives.',
        weight: 0.25,
        autoScore: 0,
        userOverride: true,
      },
      {
        id: 'vendor-readiness',
        label: 'Vendor Readiness',
        description: `PQC-ready vendors as a percentage of total products (${execData.pqcReadyCount}/${execData.totalProducts} from catalog).`,
        weight: 0.15,
        autoScore: vendorReadinessScore,
        userOverride: false,
      },
      {
        id: 'compliance-gaps',
        label: 'Compliance Gaps Closed',
        description:
          'Percentage of identified compliance requirements addressed (FIPS, CMMC) and agency guidance recommendations followed (ANSSI, BSI).',
        weight: 0.2,
        autoScore: 0,
        userOverride: true,
      },
      {
        id: 'training-completion',
        label: 'Training Completion',
        description:
          'Percentage of relevant staff who have completed PQC awareness and technical training.',
        weight: 0.1,
        autoScore: 0,
        userOverride: true,
      },
      {
        id: 'budget-utilization',
        label: 'Budget Utilization',
        description:
          'Percentage of allocated PQC migration budget spent on plan (healthy range: 70-90%).',
        weight: 0.1,
        autoScore: 0,
        userOverride: true,
      },
    ],
    [vendorReadinessScore, execData.pqcReadyCount, execData.totalProducts]
  )

  const handleScoreChange = useCallback(
    (scores: Record<string, number>) => {
      // Auto-save on score changes — compute weighted total for the document
      let weightedSum = 0
      let totalWeight = 0
      for (const d of dimensions) {
        const score = scores[d.id] ?? 0
        weightedSum += score * d.weight
        totalWeight += d.weight
      }
      const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0

      let md = '# PQC Governance KPI Dashboard\n\n'
      md += `**Overall Score: ${overall}/100**\n\n`
      md += `Generated: ${new Date().toLocaleDateString()}\n\n`
      md += '| KPI | Score | Weight |\n'
      md += '|-----|-------|--------|\n'
      for (const d of dimensions) {
        md += `| ${d.label} | ${scores[d.id] ?? 0}/100 | ${Math.round(d.weight * 100)}% |\n`
      }

      addExecutiveDocument({
        id: 'kpi-dashboard-pqc-governance',
        moduleId: 'pqc-governance',
        type: 'kpi-dashboard',
        title: 'PQC Governance KPI Dashboard',
        data: md,
        createdAt: Date.now(),
      })
    },
    [dimensions, addExecutiveDocument]
  )

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Adjust the KPI sliders to reflect your organization&apos;s current PQC migration progress.
        Vendor Readiness is auto-scored from the product catalog ({execData.pqcReadyCount} of{' '}
        {execData.totalProducts} products PQC-ready). Export the dashboard as a shareable report.
      </p>

      {execData.migrationDeadlineYear && (
        <div className="glass-panel p-4 border-primary/20">
          <p className="text-sm text-foreground">
            <span className="font-semibold text-primary">Country Deadline:</span> Your assessment
            indicates a migration deadline of{' '}
            <span className="font-bold text-foreground">{execData.migrationDeadlineYear}</span>
            {execData.country ? ` (${execData.country})` : ''}.
          </p>
        </div>
      )}

      <DataDrivenScorecard
        title="PQC Governance KPIs"
        description="Weighted scorecard tracking six dimensions of PQC migration governance."
        dimensions={dimensions}
        colorScale="readiness"
        onScoreChange={handleScoreChange}
        showExport={true}
        exportFilename="pqc-governance-kpi-dashboard"
      />
    </div>
  )
}
