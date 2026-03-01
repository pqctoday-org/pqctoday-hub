// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useMemo } from 'react'
import { DataDrivenScorecard } from '../../../common/executive'
import type { ScorecardDimension } from '../../../common/executive'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'

const MODULE_ID = 'vendor-risk'

export const VendorScorecardBuilder: React.FC = () => {
  const { fipsValidatedCount, totalProducts } = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()

  const fipsAutoScore = useMemo(() => {
    if (totalProducts === 0) return 0
    return Math.round((fipsValidatedCount / totalProducts) * 100)
  }, [fipsValidatedCount, totalProducts])

  const dimensions: ScorecardDimension[] = useMemo(
    () => [
      {
        id: 'pqc-algorithm-support',
        label: 'PQC Algorithm Support',
        description: 'Vendor supports NIST-approved PQC algorithms',
        weight: 0.25,
      },
      {
        id: 'fips-validation',
        label: 'FIPS 140-3 Validation',
        description: 'Cryptographic modules have current FIPS validation',
        weight: 0.2,
        autoScore: fipsAutoScore,
      },
      {
        id: 'pqc-roadmap',
        label: 'Published PQC Roadmap',
        description: 'Vendor has a published PQC migration timeline',
        weight: 0.15,
      },
      {
        id: 'crypto-agility',
        label: 'Crypto Agility',
        description: 'Products support algorithm swapping without major rework',
        weight: 0.15,
      },
      {
        id: 'sbom-cbom',
        label: 'SBOM/CBOM Delivery',
        description: 'Vendor provides Software/Crypto Bill of Materials',
        weight: 0.1,
      },
      {
        id: 'hybrid-mode',
        label: 'Hybrid Mode Support',
        description: 'Products support hybrid classical+PQC operation',
        weight: 0.15,
      },
    ],
    [fipsAutoScore]
  )

  const handleScoreChange = useCallback(
    (scores: Record<string, number>) => {
      let totalWeight = 0
      let weightedSum = 0
      for (const d of dimensions) {
        const score = scores[d.id] ?? 0
        weightedSum += score * d.weight
        totalWeight += d.weight
      }
      const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0

      if (overall > 0) {
        let md = '# Vendor PQC Readiness Scorecard\n\n'
        md += `**Overall Score: ${overall}/100**\n\n`
        md += `Generated: ${new Date().toLocaleDateString()}\n\n`
        md += '| Dimension | Score | Weight |\n'
        md += '|-----------|-------|--------|\n'
        for (const d of dimensions) {
          md += `| ${d.label} | ${scores[d.id] ?? 0}/100 | ${Math.round(d.weight * 100)}% |\n`
        }

        addExecutiveDocument({
          id: `vendor-scorecard-${Date.now()}`,
          moduleId: MODULE_ID,
          type: 'vendor-scorecard',
          title: `Vendor PQC Readiness Scorecard (${overall}/100)`,
          data: md,
          createdAt: Date.now(),
        })
      }
    },
    [dimensions, addExecutiveDocument]
  )

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-sm text-foreground/80">
          Score your vendor across six PQC readiness dimensions. The{' '}
          <strong className="text-foreground">FIPS 140-3 Validation</strong> dimension is
          auto-scored from the{' '}
          <span className="text-primary font-medium">
            {fipsValidatedCount}/{totalProducts}
          </span>{' '}
          products in the migration catalog with current FIPS validation. Adjust all scores using
          the sliders, then export the completed scorecard.
        </p>
      </div>

      <DataDrivenScorecard
        title="Vendor PQC Readiness"
        description="Weighted scorecard across six dimensions of vendor quantum readiness."
        dimensions={dimensions}
        colorScale="readiness"
        onScoreChange={handleScoreChange}
        showExport={true}
        exportFilename="vendor-pqc-scorecard"
      />
    </div>
  )
}
