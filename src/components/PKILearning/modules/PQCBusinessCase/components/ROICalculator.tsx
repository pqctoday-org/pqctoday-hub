import React, { useState, useMemo } from 'react'
import { TrendingUp, DollarSign, Clock, Info } from 'lucide-react'
import { DataDrivenScorecard } from '@/components/PKILearning/common/executive'
import type { ScorecardDimension } from '@/components/PKILearning/common/executive'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount.toFixed(0)}`
}

// Average per-product migration cost estimates by complexity
const AVG_MIGRATION_COST_PER_PRODUCT = 75_000

// Industry breach cost baselines — IBM Cost of a Data Breach Report 2024
const INDUSTRY_BREACH_BASELINES: Record<string, number> = {
  'Finance & Banking': 6_080_000,
  Healthcare: 9_770_000,
  'Government & Defense': 2_760_000,
  Technology: 4_970_000,
  Telecommunications: 4_290_000,
  'Energy & Utilities': 4_780_000,
  'Retail & E-Commerce': 3_280_000,
  Aerospace: 4_560_000,
  Automotive: 3_850_000,
  Education: 2_730_000,
  Other: 4_880_000,
}

export const ROICalculator: React.FC = () => {
  const data = useExecutiveModuleData()
  const [scores, setScores] = useState<Record<string, number>>({})

  // Auto-score migration cost from product catalog
  const migrationCostAutoScore = useMemo(() => {
    // Higher product count = higher migration cost = higher score (investment needed)
    const count = data.totalProducts
    if (count > 100) return 85
    if (count > 50) return 70
    if (count > 25) return 55
    if (count > 10) return 40
    return 25
  }, [data.totalProducts])

  // Auto-score compliance from framework count
  const complianceAutoScore = useMemo(() => {
    const count = data.frameworksByIndustry.length
    if (count > 10) return 80
    if (count > 5) return 65
    if (count > 2) return 50
    if (count > 0) return 35
    return 20
  }, [data.frameworksByIndustry.length])

  const dimensions: ScorecardDimension[] = useMemo(
    () => [
      {
        id: 'migration-cost',
        label: 'Migration Cost by Infrastructure',
        description: `Auto-scored from ${data.totalProducts} products in the migration catalog. Higher = larger investment needed.`,
        autoScore: migrationCostAutoScore,
        userOverride: true,
        weight: 0.25,
      },
      {
        id: 'breach-avoidance',
        label: 'Breach Avoidance Savings',
        description:
          'Estimated savings from preventing quantum-enabled breaches. Adjust based on your data sensitivity.',
        autoScore: 60,
        userOverride: true,
        weight: 0.3,
      },
      {
        id: 'compliance-penalty',
        label: 'Compliance Penalty Avoidance',
        description: `Auto-scored from ${data.frameworksByIndustry.length} applicable compliance frameworks. Higher = greater regulatory exposure.`,
        autoScore: complianceAutoScore,
        userOverride: true,
        weight: 0.2,
      },
      {
        id: 'operational-efficiency',
        label: 'Operational Efficiency',
        description:
          'Expected efficiency gains from crypto agility, reduced complexity, and modernized infrastructure.',
        autoScore: 45,
        userOverride: true,
        weight: 0.15,
      },
      {
        id: 'competitive-advantage',
        label: 'Competitive Advantage',
        description:
          'Market differentiation, customer trust, and partner ecosystem alignment from early PQC adoption.',
        autoScore: 40,
        userOverride: true,
        weight: 0.1,
      },
    ],
    [
      data.totalProducts,
      data.frameworksByIndustry.length,
      migrationCostAutoScore,
      complianceAutoScore,
    ]
  )

  // Derived financial estimates
  const financials = useMemo(() => {
    const migrationScore = scores['migration-cost'] ?? migrationCostAutoScore
    const breachScore = scores['breach-avoidance'] ?? 60
    const complianceScore = scores['compliance-penalty'] ?? complianceAutoScore

    // Estimated total migration cost
    const estimatedProductCount = Math.max(
      10,
      Math.round(data.totalProducts * (migrationScore / 100))
    )
    const totalMigrationCost = estimatedProductCount * AVG_MIGRATION_COST_PER_PRODUCT

    // Estimated breach cost savings (per year)
    const industryBreachCost =
      INDUSTRY_BREACH_BASELINES[data.industry] ?? INDUSTRY_BREACH_BASELINES['Other']
    const quantumMultiplier = 2.5
    const breachCostSavings = industryBreachCost * quantumMultiplier * (breachScore / 100)

    // Compliance penalty avoidance (per year)
    const avgCompliancePenalty = 2_000_000
    const complianceSavings = avgCompliancePenalty * (complianceScore / 100)

    // Annual benefit
    const annualBenefit = breachCostSavings + complianceSavings

    // ROI calculation
    const roiPercent =
      totalMigrationCost > 0
        ? Math.round(((annualBenefit * 3 - totalMigrationCost) / totalMigrationCost) * 100)
        : 0

    // Payback period
    const paybackMonths =
      annualBenefit > 0 ? Math.round((totalMigrationCost / annualBenefit) * 12) : 0

    return {
      totalMigrationCost,
      breachCostSavings,
      complianceSavings,
      annualBenefit,
      roiPercent,
      paybackMonths,
    }
  }, [scores, data.totalProducts, data.industry, migrationCostAutoScore, complianceAutoScore])

  return (
    <div className="space-y-8">
      {/* Assessment context banner */}
      {data.isAssessmentComplete && (
        <div className="bg-muted/50 rounded-lg p-3 border border-primary/20 flex items-start gap-2">
          <Info size={16} className="text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Scores are pre-populated using data from your assessment ({data.industry}
            {data.country ? `, ${data.country}` : ''}). Adjust the sliders to refine estimates for
            your specific situation.
          </p>
        </div>
      )}

      {/* Scorecard */}
      <DataDrivenScorecard
        title="PQC Migration ROI"
        description="Weighted score across five investment dimensions. Higher = stronger business case for migration."
        dimensions={dimensions}
        colorScale="readiness"
        onScoreChange={setScores}
        showExport
        exportFilename="pqc-roi-scorecard"
      />

      {/* Financial Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">Financial Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-6 text-center">
            <DollarSign size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Est. Migration Cost</p>
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(financials.totalMigrationCost)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {data.totalProducts} products at ~
              {formatCurrency(AVG_MIGRATION_COST_PER_PRODUCT)}/product
            </p>
          </div>
          <div className="glass-panel p-6 text-center">
            <TrendingUp size={24} className="mx-auto text-status-success mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Annual Benefit</p>
            <p className="text-3xl font-bold text-status-success">
              {formatCurrency(financials.annualBenefit)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Breach avoidance + compliance savings
            </p>
          </div>
          <div className="glass-panel p-6 text-center">
            <Clock size={24} className="mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Payback Period</p>
            <p className="text-3xl font-bold text-primary">{financials.paybackMonths} months</p>
            <p className="text-xs text-muted-foreground mt-2">
              3-year ROI: {financials.roiPercent > 0 ? '+' : ''}
              {financials.roiPercent}%
            </p>
          </div>
        </div>
      </div>

      {/* Methodology note */}
      <details className="glass-panel p-4">
        <summary className="text-sm font-medium text-foreground cursor-pointer">
          Calculation Methodology
        </summary>
        <div className="mt-3 text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Migration cost:</strong> Product count from the migration catalog multiplied by
            an average per-product migration cost of{' '}
            {formatCurrency(AVG_MIGRATION_COST_PER_PRODUCT)}. This includes software upgrades,
            testing, and deployment.
          </p>
          <p>
            <strong>Breach avoidance:</strong> Industry-specific breach cost baseline (
            {data.industry || 'Other'}:{' '}
            {formatCurrency(
              INDUSTRY_BREACH_BASELINES[data.industry] ?? INDUSTRY_BREACH_BASELINES['Other']
            )}
            , source: IBM Cost of a Data Breach Report 2024) multiplied by a 2.5&times; quantum
            amplification factor, scaled by your breach avoidance score. The 2.5&times; multiplier
            reflects the combined effect of HNDL exposure (retroactive decryption of
            already-harvested data), increased attacker sophistication once a CRQC is available, and
            extended breach detection timelines. This is an illustrative educational estimate;
            actual multipliers depend on data sensitivity, retention periods, and threat actor
            capabilities.
          </p>
          <p>
            <strong>Compliance savings:</strong> Based on average regulatory penalty exposure of
            $2M, scaled by applicable framework coverage.
          </p>
          <p>
            <strong>ROI:</strong> (3-year total benefit &minus; migration cost) / migration cost.
          </p>
          <p className="text-xs italic mt-2">
            Note: These are educational estimates for planning purposes. Actual costs vary
            significantly by organization size, geography, and regulatory environment.
          </p>
        </div>
      </details>
    </div>
  )
}
