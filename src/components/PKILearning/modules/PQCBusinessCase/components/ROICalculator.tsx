// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import {
  TrendingUp,
  DollarSign,
  Clock,
  Info,
  Settings2,
  Shield,
  Scale,
  Calendar,
} from 'lucide-react'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { INDUSTRY_BREACH_BASELINES } from '../../../../../data/roiBaselines'

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount.toFixed(0)}`
}

interface ROIAssumptions {
  productsToMigrate: number
  costPerProduct: number
  quantumMultiplier: number
  breachProbability: number
  applicableFrameworks: number
  penaltyPerIncident: number
  horizonYears: number
}

export const ROICalculator: React.FC = () => {
  const data = useExecutiveModuleData()

  const industryBreachBaseline =
    INDUSTRY_BREACH_BASELINES[data.industry] ?? INDUSTRY_BREACH_BASELINES['Other']

  const [assumptions, setAssumptions] = useState<ROIAssumptions>(() => ({
    productsToMigrate: Math.min(data.totalProducts, 50),
    costPerProduct: 75_000,
    quantumMultiplier: 2.5,
    breachProbability: 15,
    applicableFrameworks: data.frameworksByIndustry.length,
    penaltyPerIncident: 2_000_000,
    horizonYears: 3,
  }))

  const updateAssumption = useCallback(
    <K extends keyof ROIAssumptions>(key: K, value: ROIAssumptions[K]) => {
      setAssumptions((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  // Derived financial estimates
  const financials = useMemo(() => {
    const {
      productsToMigrate,
      costPerProduct,
      quantumMultiplier,
      breachProbability,
      applicableFrameworks,
      penaltyPerIncident,
      horizonYears,
    } = assumptions

    const totalMigrationCost = productsToMigrate * costPerProduct

    const breachCostSavings = industryBreachBaseline * quantumMultiplier * (breachProbability / 100)

    // 10% annual incident rate per applicable framework
    const complianceSavings = applicableFrameworks * penaltyPerIncident * 0.1

    const annualBenefit = breachCostSavings + complianceSavings
    const totalBenefit = annualBenefit * horizonYears

    const roiPercent =
      totalMigrationCost > 0
        ? Math.round(((totalBenefit - totalMigrationCost) / totalMigrationCost) * 100)
        : 0

    const paybackMonths =
      annualBenefit > 0 ? Math.round((totalMigrationCost / annualBenefit) * 12) : 0

    return {
      totalMigrationCost,
      breachCostSavings,
      complianceSavings,
      annualBenefit,
      totalBenefit,
      roiPercent,
      paybackMonths,
    }
  }, [assumptions, industryBreachBaseline])

  const exportMarkdown = useMemo(() => {
    let md = `# PQC Migration ROI Analysis\n\n`
    md += `**Industry:** ${data.industry || 'Not specified'}\n`
    if (data.country) md += `**Country:** ${data.country}\n`
    md += `**Generated:** ${new Date().toLocaleDateString()}\n\n`
    md += `## Financial Summary\n\n`
    md += `| Metric | Value |\n|--------|-------|\n`
    md += `| Migration Cost | ${formatCurrency(financials.totalMigrationCost)} |\n`
    md += `| Annual Benefit | ${formatCurrency(financials.annualBenefit)} |\n`
    md += `| Payback Period | ${financials.paybackMonths} months |\n`
    md += `| ${assumptions.horizonYears}-Year ROI | ${financials.roiPercent}% |\n\n`
    md += `## Assumptions\n\n`
    md += `### Migration Cost\n`
    md += `- Products to migrate: ${assumptions.productsToMigrate} of ${data.totalProducts}\n`
    md += `- Cost per product: ${formatCurrency(assumptions.costPerProduct)}\n`
    md += `- **Total: ${formatCurrency(financials.totalMigrationCost)}**\n\n`
    md += `### Breach Avoidance\n`
    md += `- Industry baseline (${data.industry || 'Other'}): ${formatCurrency(industryBreachBaseline)}\n`
    md += `- Quantum amplification: ${assumptions.quantumMultiplier.toFixed(1)}x\n`
    md += `- Annual breach probability: ${assumptions.breachProbability}%\n`
    md += `- **Annual savings: ${formatCurrency(financials.breachCostSavings)}**\n\n`
    md += `### Compliance\n`
    md += `- Applicable frameworks: ${assumptions.applicableFrameworks} of ${data.frameworksByIndustry.length}\n`
    md += `- Penalty per incident: ${formatCurrency(assumptions.penaltyPerIncident)}\n`
    md += `- Incident rate: 10% per framework per year\n`
    md += `- **Annual savings: ${formatCurrency(financials.complianceSavings)}**\n\n`
    md += `### Planning Horizon\n`
    md += `- ${assumptions.horizonYears} years\n`
    md += `- Total benefit: ${formatCurrency(financials.totalBenefit)}\n\n`
    md += `*Educational estimate for planning purposes. Source: IBM Cost of a Data Breach Report 2024.*\n`
    return md
  }, [
    assumptions,
    financials,
    data.industry,
    data.country,
    data.totalProducts,
    data.frameworksByIndustry.length,
    industryBreachBaseline,
  ])

  return (
    <div className="space-y-6">
      {/* Assessment context banner */}
      {data.isAssessmentComplete && (
        <div className="bg-muted/50 rounded-lg p-3 border border-primary/20 flex items-start gap-2">
          <Info size={16} className="text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Defaults are pre-populated from your assessment ({data.industry}
            {data.country ? `, ${data.country}` : ''}). Adjust the sliders below to refine estimates
            for your specific situation.
          </p>
        </div>
      )}

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-6 text-center">
          <DollarSign size={24} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-1">Est. Migration Cost</p>
          <p className="text-3xl font-bold text-foreground">
            {formatCurrency(financials.totalMigrationCost)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {assumptions.productsToMigrate} products &times;{' '}
            {formatCurrency(assumptions.costPerProduct)}/product
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
            {assumptions.horizonYears}-year ROI: {financials.roiPercent > 0 ? '+' : ''}
            {financials.roiPercent}%
          </p>
        </div>
      </div>

      {/* ── Migration Cost Assumptions ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <Settings2 size={16} className="text-primary shrink-0" />
          Migration Cost Assumptions
        </summary>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="roi-products"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Products to Migrate
              </label>
              <input
                id="roi-products"
                type="range"
                min={1}
                max={data.totalProducts}
                step={1}
                value={assumptions.productsToMigrate}
                onChange={(e) => updateAssumption('productsToMigrate', parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span className="text-sm font-mono text-primary">
                  {assumptions.productsToMigrate} of {data.totalProducts}
                </span>
                <span>{data.totalProducts}</span>
              </div>
            </div>
            <div>
              <label
                htmlFor="roi-cost-per-product"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Cost per Product
              </label>
              <input
                id="roi-cost-per-product"
                type="range"
                min={25_000}
                max={200_000}
                step={5_000}
                value={assumptions.costPerProduct}
                onChange={(e) => updateAssumption('costPerProduct', parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>$25K</span>
                <span className="text-sm font-mono text-primary">
                  {formatCurrency(assumptions.costPerProduct)}
                </span>
                <span>$200K</span>
              </div>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs font-mono text-muted-foreground">
              {assumptions.productsToMigrate} products &times;{' '}
              {formatCurrency(assumptions.costPerProduct)} ={' '}
              <span className="text-primary font-bold">
                {formatCurrency(financials.totalMigrationCost)}
              </span>
            </p>
          </div>
        </div>
      </details>

      {/* ── Breach Avoidance Assumptions ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <Shield size={16} className="text-primary shrink-0" />
          Breach Avoidance Assumptions
        </summary>
        <div className="mt-4 space-y-4">
          {/* Industry baseline (display-only) */}
          <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
            <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Industry breach baseline ({data.industry || 'Other'}):{' '}
              <span className="font-mono text-foreground font-semibold">
                {formatCurrency(industryBreachBaseline)}
              </span>{' '}
              &mdash; IBM Cost of a Data Breach Report 2024
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="roi-quantum-multiplier"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Quantum Amplification Factor
              </label>
              <input
                id="roi-quantum-multiplier"
                type="range"
                min={1.0}
                max={5.0}
                step={0.1}
                value={assumptions.quantumMultiplier}
                onChange={(e) => updateAssumption('quantumMultiplier', parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1.0&times;</span>
                <span className="text-sm font-mono text-primary">
                  {assumptions.quantumMultiplier.toFixed(1)}&times;
                </span>
                <span>5.0&times;</span>
              </div>
            </div>
            <div>
              <label
                htmlFor="roi-breach-probability"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Annual Breach Probability
              </label>
              <input
                id="roi-breach-probability"
                type="range"
                min={1}
                max={50}
                step={1}
                value={assumptions.breachProbability}
                onChange={(e) => updateAssumption('breachProbability', parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1%</span>
                <span className="text-sm font-mono text-primary">
                  {assumptions.breachProbability}%
                </span>
                <span>50%</span>
              </div>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs font-mono text-muted-foreground">
              {formatCurrency(industryBreachBaseline)} &times;{' '}
              {assumptions.quantumMultiplier.toFixed(1)}&times; &times;{' '}
              {assumptions.breachProbability}% ={' '}
              <span className="text-primary font-bold">
                {formatCurrency(financials.breachCostSavings)}
              </span>
              /year
            </p>
          </div>
        </div>
      </details>

      {/* ── Compliance Assumptions ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <Scale size={16} className="text-primary shrink-0" />
          Compliance Assumptions
        </summary>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="roi-frameworks"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Applicable Frameworks
              </label>
              <input
                id="roi-frameworks"
                type="range"
                min={0}
                max={Math.max(data.frameworksByIndustry.length, 1)}
                step={1}
                value={assumptions.applicableFrameworks}
                onChange={(e) => updateAssumption('applicableFrameworks', parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0</span>
                <span className="text-sm font-mono text-primary">
                  {assumptions.applicableFrameworks} of {data.frameworksByIndustry.length}
                </span>
                <span>{data.frameworksByIndustry.length}</span>
              </div>
            </div>
            <div>
              <label
                htmlFor="roi-penalty"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Penalty per Incident
              </label>
              <input
                id="roi-penalty"
                type="range"
                min={500_000}
                max={10_000_000}
                step={100_000}
                value={assumptions.penaltyPerIncident}
                onChange={(e) => updateAssumption('penaltyPerIncident', parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>$500K</span>
                <span className="text-sm font-mono text-primary">
                  {formatCurrency(assumptions.penaltyPerIncident)}
                </span>
                <span>$10M</span>
              </div>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs font-mono text-muted-foreground">
              {assumptions.applicableFrameworks} frameworks &times;{' '}
              {formatCurrency(assumptions.penaltyPerIncident)} &times; 10% incident rate ={' '}
              <span className="text-primary font-bold">
                {formatCurrency(financials.complianceSavings)}
              </span>
              /year
            </p>
          </div>
        </div>
      </details>

      {/* ── Planning Horizon ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <Calendar size={16} className="text-primary shrink-0" />
          Planning Horizon
        </summary>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="roi-horizon" className="block text-sm font-medium text-foreground mb-2">
              Years
            </label>
            <input
              id="roi-horizon"
              type="range"
              min={1}
              max={10}
              step={1}
              value={assumptions.horizonYears}
              onChange={(e) => updateAssumption('horizonYears', parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 year</span>
              <span className="text-sm font-mono text-primary">
                {assumptions.horizonYears} years
              </span>
              <span>10 years</span>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs font-mono text-muted-foreground">
              {formatCurrency(financials.annualBenefit)}/yr &times; {assumptions.horizonYears} years
              ={' '}
              <span className="text-primary font-bold">
                {formatCurrency(financials.totalBenefit)}
              </span>{' '}
              total benefit
            </p>
          </div>
        </div>
      </details>

      {/* Methodology note */}
      <details className="glass-panel p-4">
        <summary className="text-sm font-medium text-foreground cursor-pointer">
          Calculation Methodology
        </summary>
        <div className="mt-3 text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Migration cost:</strong> Number of products you plan to migrate, multiplied by
            the per-product migration cost. This includes software upgrades, testing, and
            deployment.
          </p>
          <p>
            <strong>Breach avoidance:</strong> Industry-specific breach cost baseline (
            {data.industry || 'Other'}: {formatCurrency(industryBreachBaseline)}, source: IBM Cost
            of a Data Breach Report 2024) multiplied by a quantum amplification factor and annual
            breach probability. The amplification factor reflects the combined effect of HNDL
            exposure (retroactive decryption of already-harvested data), increased attacker
            sophistication once a CRQC is available, and extended breach detection timelines.
          </p>
          <p>
            <strong>Compliance savings:</strong> Number of applicable regulatory frameworks
            multiplied by the average penalty per incident, assuming a 10% annual probability of a
            compliance incident per framework.
          </p>
          <p>
            <strong>ROI:</strong> ({assumptions.horizonYears}-year total benefit &minus; migration
            cost) / migration cost.
          </p>
          <p>
            <strong>Qualitative factors not modeled:</strong> Operational efficiency gains from
            crypto agility and modernized infrastructure, competitive advantage from early PQC
            adoption, and customer trust improvements. These can significantly enhance the business
            case but are difficult to quantify.
          </p>
          <p className="text-xs italic mt-2">
            Note: These are educational estimates for planning purposes. Actual costs vary
            significantly by organization size, geography, and regulatory environment.
          </p>
        </div>
      </details>

      {/* Export */}
      <ExportableArtifact
        title="PQC Migration ROI — Export"
        exportData={exportMarkdown}
        filename="pqc-roi-analysis"
        formats={['markdown']}
        onExport={() => {
          // Intentionally empty — ROI is export-only, no module store persistence needed
        }}
      >
        <p className="text-sm text-muted-foreground">
          Export the ROI analysis above as a shareable document.
        </p>
      </ExportableArtifact>
    </div>
  )
}
