// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Info,
  Settings2,
  Shield,
  Scale,
  Calendar,
  Percent,
  BarChart2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { Button } from '@/components/ui/button'
import {
  ANNUAL_BREACH_PROBABILITY_PCT,
  IBM_BASELINE_UNVERIFIED_NOTE,
  type OrgSizeTier,
} from '@/data/roiBaselines'
import {
  DEFAULT_COMPLIANCE_INCIDENT_RATE,
  MIGRATION_COST_FLOOR,
  composeQuantumMultiplier,
  computeAnnualBreachSavings,
  computeAnnualComplianceSavings,
  computeMigrationCostFromProfile,
  computeROI,
  reconcileEstimates,
  resolveIndustryBreachBaseline,
} from '@/utils/roiMath'

function formatCurrency(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  const abs = Math.abs(amount)
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`
  return `${sign}$${abs.toFixed(0)}`
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${Math.round(value)}%`
}

interface ROIAssumptions {
  productsToMigrate: number
  costPerProduct: number
  annualOpexPct: number // % of capex per year
  hndlExposurePct: number
  crqcAttackerUpliftPct: number
  detectionTimelineUpliftPct: number
  /** Organization-size tier driving the default `breachProbability` prior
   *  (Cyentia IRIS 2025). The slider can still override the resulting number. */
  orgSizeTier: OrgSizeTier
  breachProbability: number
  applicableFrameworks: number
  penaltyPerIncident: number
  horizonYears: number
  discountRatePct: number
}

const ORG_SIZE_TIER_OPTIONS: { tier: OrgSizeTier; label: string }[] = [
  { tier: 'smb', label: 'SMB' },
  { tier: 'average', label: 'Average org' },
  { tier: 'fortune1000', label: 'Fortune-1000-class' },
]

interface TornadoRow {
  label: string
  low: number
  high: number
  delta: number
}

interface ROIOutput {
  totalCostUSD: number
  roiPercent: number
  paybackMonths: number
  breachCostSavingsUSD: number
}

interface ROICalculatorProps {
  onOutput?: (output: ROIOutput) => void
}

export const ROICalculator: React.FC<ROICalculatorProps> = ({ onOutput }) => {
  const data = useExecutiveModuleData()
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const industryBreachBaseline = resolveIndustryBreachBaseline(data.industry)

  // F13: default applicable frameworks to the mandated subset the user actually
  // faces, not every framework in the industry. Priority:
  //   1) complianceImpacts marked requiresPQC === true from assessment result
  //   2) user's own compliance selections from the assessment
  //   3) fall back to the industry list length if neither is available
  const defaultApplicableFrameworks = useMemo(() => {
    const mandatedCount =
      data.assessmentResult?.complianceImpacts?.filter((c) => c.requiresPQC === true).length ?? 0
    if (mandatedCount > 0) return mandatedCount
    if (data.complianceSelections.length > 0) return data.complianceSelections.length
    // Cold start (no assessment, no compliance selections): don't default to every
    // framework in the industry (170 on this platform inflates the headline ROI).
    return Math.min(data.frameworksByIndustry.length, 5)
  }, [
    data.assessmentResult?.complianceImpacts,
    data.complianceSelections.length,
    data.frameworksByIndustry.length,
  ])

  // Restore the user's last-saved ROI model (whole assumptions blob) so the
  // calculator round-trips instead of resetting to cold-start defaults.
  const savedAssumptions = useSavedArtifactInputs<ROIAssumptions>('roi-model')

  const computeDefaultAssumptions = useCallback(
    (): ROIAssumptions => ({
      productsToMigrate: Math.min(data.totalProducts, 50),
      costPerProduct: 75_000,
      annualOpexPct: 15,
      hndlExposurePct: 50,
      crqcAttackerUpliftPct: 50,
      detectionTimelineUpliftPct: 50,
      // Default prior comes from Cyentia IRIS 2025's organization-size anchors
      // (average org ~9%/yr), replacing the previous unsourced flat 15% —
      // matches the same tiered values BreachCostModel uses.
      orgSizeTier: 'average',
      breachProbability: ANNUAL_BREACH_PROBABILITY_PCT.average,
      applicableFrameworks: defaultApplicableFrameworks,
      penaltyPerIncident: 2_000_000,
      horizonYears: 3,
      discountRatePct: 10,
    }),
    [data.totalProducts, defaultApplicableFrameworks]
  )

  const [assumptions, setAssumptions] = useState<ROIAssumptions>(() => {
    // Merge over fresh defaults (not just `savedAssumptions ?? defaults`) so a
    // model saved before a field was added (e.g. orgSizeTier) still round-trips
    // without a crash or an undefined value reaching the UI.
    const defaults = computeDefaultAssumptions()
    return savedAssumptions ? { ...defaults, ...savedAssumptions } : defaults
  })

  // A restored saved model never re-derives from the user's current /migrate +
  // assessment data on its own (the lazy initializer above only runs once) —
  // this gives an explicit way back to fresh, up-to-date computed defaults.
  const resetToComputedDefaults = useCallback(() => {
    setAssumptions(computeDefaultAssumptions())
  }, [computeDefaultAssumptions])

  const updateAssumption = useCallback(
    <K extends keyof ROIAssumptions>(key: K, value: ROIAssumptions[K]) => {
      setAssumptions((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const selectOrgSizeTier = useCallback((tier: OrgSizeTier) => {
    setAssumptions((prev) => ({
      ...prev,
      orgSizeTier: tier,
      breachProbability: ANNUAL_BREACH_PROBABILITY_PCT[tier],
    }))
  }, [])

  const quantumMultiplier = useMemo(
    () =>
      composeQuantumMultiplier({
        hndlExposurePct: assumptions.hndlExposurePct,
        crqcAttackerUpliftPct: assumptions.crqcAttackerUpliftPct,
        detectionTimelineUpliftPct: assumptions.detectionTimelineUpliftPct,
      }),
    [
      assumptions.hndlExposurePct,
      assumptions.crqcAttackerUpliftPct,
      assumptions.detectionTimelineUpliftPct,
    ]
  )

  const financials = useMemo(() => {
    const {
      productsToMigrate,
      costPerProduct,
      annualOpexPct,
      breachProbability,
      applicableFrameworks,
      penaltyPerIncident,
      horizonYears,
      discountRatePct,
    } = assumptions

    const totalMigrationCost = productsToMigrate * costPerProduct
    const annualOpex = (totalMigrationCost * annualOpexPct) / 100

    const breachCostSavings = computeAnnualBreachSavings({
      breachBaseline: industryBreachBaseline,
      breachProbabilityPct: breachProbability,
      quantumMultiplier,
    })
    const complianceSavings = computeAnnualComplianceSavings({
      frameworkCount: applicableFrameworks,
      penaltyPerIncident,
      incidentRate: DEFAULT_COMPLIANCE_INCIDENT_RATE,
    })

    const roi = computeROI({
      migrationCost: totalMigrationCost,
      annualOpex,
      annualBenefit: breachCostSavings + complianceSavings,
      horizonYears,
      discountRate: discountRatePct / 100,
    })

    return {
      totalMigrationCost,
      breachCostSavings,
      complianceSavings,
      // computeROI's ROIMetrics already includes annualOpex, so we don't
      // re-declare it here (would shadow with TS2783 duplicate-property).
      ...roi,
    }
  }, [assumptions, industryBreachBaseline, quantumMultiplier])

  // Independent second estimate: the cost the user's assessment profile implies
  // (infra layers × algo count × agility/vendor/team multipliers). This is a
  // different method from the per-product slider, so reconciling the two is an
  // honest cross-check rather than a restatement of the same number.
  const assessmentDerived = useMemo(
    () =>
      data.isAssessmentComplete && data.assessmentResult
        ? computeMigrationCostFromProfile(data.assessmentResult)
        : null,
    [data.isAssessmentComplete, data.assessmentResult]
  )

  const crossCheck = useMemo(() => {
    if (!assessmentDerived) return null
    // Compare methodologies at full-estate scale so a user modeling a subset via
    // productsToMigrate doesn't produce a spurious divergence.
    const methodAFullEstate = assumptions.costPerProduct * data.totalProducts
    const assessmentCost = assessmentDerived.migrationCost
    return {
      methodAFullEstate,
      assessmentCost,
      lowConfidence: assessmentCost === MIGRATION_COST_FLOOR,
      recon: reconcileEstimates(methodAFullEstate, assessmentCost),
    }
  }, [assessmentDerived, assumptions.costPerProduct, data.totalProducts])

  useEffect(() => {
    if (onOutput && financials.totalCost > 0) {
      onOutput({
        totalCostUSD: financials.totalCost,
        roiPercent: financials.roiPercent,
        paybackMonths: financials.paybackMonths,
        breachCostSavingsUSD: financials.breachCostSavings,
      })
    }
  }, [
    onOutput,
    financials.totalCost,
    financials.roiPercent,
    financials.paybackMonths,
    financials.breachCostSavings,
  ])

  // Sensitivity (tornado): vary each input ±30% and measure NPV impact.
  const tornado: TornadoRow[] = useMemo(() => {
    const baseNpv = financials.npv ?? 0
    const recompute = (overrides: Partial<ROIAssumptions>): number => {
      const a = { ...assumptions, ...overrides }
      const totalMigrationCost = a.productsToMigrate * a.costPerProduct
      const annualOpex = (totalMigrationCost * a.annualOpexPct) / 100
      const qm = composeQuantumMultiplier({
        hndlExposurePct: a.hndlExposurePct,
        crqcAttackerUpliftPct: a.crqcAttackerUpliftPct,
        detectionTimelineUpliftPct: a.detectionTimelineUpliftPct,
      })
      const breach = computeAnnualBreachSavings({
        breachBaseline: industryBreachBaseline,
        breachProbabilityPct: a.breachProbability,
        quantumMultiplier: qm,
      })
      const comp = computeAnnualComplianceSavings({
        frameworkCount: a.applicableFrameworks,
        penaltyPerIncident: a.penaltyPerIncident,
        incidentRate: DEFAULT_COMPLIANCE_INCIDENT_RATE,
      })
      const r = computeROI({
        migrationCost: totalMigrationCost,
        annualOpex,
        annualBenefit: breach + comp,
        horizonYears: a.horizonYears,
        discountRate: a.discountRatePct / 100,
      })
      return r.npv ?? 0
    }

    // Whole-number drivers (e.g. horizon years) must stay integers — the NPV loop
    // bound truncates fractional years, which would mis-rank their sensitivity bar.
    const INTEGER_KEYS: ReadonlySet<keyof ROIAssumptions> = new Set(['horizonYears'])
    const vary = (label: string, key: keyof ROIAssumptions): TornadoRow => {
      const base = assumptions[key] as number
      const perturb = (factor: number): number => {
        const v = base * factor
        return INTEGER_KEYS.has(key) ? Math.max(1, Math.round(v)) : v
      }
      const low = recompute({ [key]: perturb(0.7) } as Partial<ROIAssumptions>)
      const high = recompute({ [key]: perturb(1.3) } as Partial<ROIAssumptions>)
      return { label, low: low - baseNpv, high: high - baseNpv, delta: Math.abs(high - low) }
    }

    return [
      vary('Cost per Product', 'costPerProduct'),
      vary('Breach Probability', 'breachProbability'),
      vary('Penalty per Incident', 'penaltyPerIncident'),
      vary('Horizon (years)', 'horizonYears'),
      vary('Discount Rate', 'discountRatePct'),
      vary('Annual Opex %', 'annualOpexPct'),
    ].sort((a, b) => b.delta - a.delta)
  }, [assumptions, financials.npv, industryBreachBaseline])

  const costOfInaction = financials.totalBenefit

  const exportMarkdown = useMemo(() => {
    let md = `# PQC Migration ROI Analysis\n\n`
    md += `**Intended audience:** CFO / CIO / board\n`
    md += `**Industry:** ${data.industry || 'Not specified'}\n`
    if (data.country) md += `**Country:** ${data.country}\n`
    md += `**Generated:** ${new Date().toLocaleDateString()}\n\n`
    md += `## Financial Summary\n\n`
    md += `| Metric | Value |\n|--------|-------|\n`
    md += `| Capital Expenditure | ${formatCurrency(financials.totalMigrationCost)} |\n`
    md += `| Annual Opex | ${formatCurrency(financials.annualOpex)} |\n`
    md += `| ${assumptions.horizonYears}-Year Total Cost | ${formatCurrency(financials.totalCost)} |\n`
    md += `| Annual Benefit (gross) | ${formatCurrency(financials.annualBenefit)} |\n`
    md += `| Net Annual Benefit (after opex) | ${formatCurrency(financials.netAnnualBenefit)} |\n`
    md += `| ${assumptions.horizonYears}-Year Cost of Inaction | ${formatCurrency(costOfInaction)} |\n`
    md += `| Payback Period | ${isFinite(financials.paybackMonths) ? `${Math.round(financials.paybackMonths)} months` : 'N/A'} |\n`
    md += `| ${assumptions.horizonYears}-Year ROI | ${formatPercent(financials.roiPercent)} |\n`
    if (financials.npv !== undefined) {
      md += `| NPV @ ${assumptions.discountRatePct}% | ${formatCurrency(financials.npv)} |\n`
    }
    md += `\n## Assumptions\n\n`
    md += `### Investment\n`
    md += `- Products to migrate: ${assumptions.productsToMigrate} of ${data.totalProducts}\n`
    md += `- Capex per product: ${formatCurrency(assumptions.costPerProduct)}\n`
    md += `- **Total capex: ${formatCurrency(financials.totalMigrationCost)}**\n`
    md += `- Annual opex: ${assumptions.annualOpexPct}% of capex = ${formatCurrency(financials.annualOpex)}/year\n\n`
    md += `### Risk Reduction (quantum amplification ${quantumMultiplier.toFixed(2)}× - illustrative)\n`
    md += `- Industry baseline (${data.industry || 'Other'}): ${formatCurrency(industryBreachBaseline)} (IBM 2025)\n`
    md += `- HNDL exposure: ${assumptions.hndlExposurePct}%\n`
    md += `- Post-CRQC attacker uplift: ${assumptions.crqcAttackerUpliftPct}%\n`
    md += `- Detection-timeline uplift: ${assumptions.detectionTimelineUpliftPct}%\n`
    md += `- Annual breach probability: ${assumptions.breachProbability}% (organization size: ${
      ORG_SIZE_TIER_OPTIONS.find((o) => o.tier === assumptions.orgSizeTier)?.label ?? 'Average org'
    } — Cyentia IRIS 2025)\n`
    md += `- **Annual savings: ${formatCurrency(financials.breachCostSavings)}**\n\n`
    md += `### Regulatory Exposure\n`
    md += `- Applicable frameworks: ${assumptions.applicableFrameworks} of ${data.frameworksByIndustry.length}\n`
    md += `- Penalty per incident: ${formatCurrency(assumptions.penaltyPerIncident)}\n`
    md += `- Incident rate: ${Math.round(DEFAULT_COMPLIANCE_INCIDENT_RATE * 100)}% per framework per year (illustrative assumption)\n`
    md += `- **Annual savings: ${formatCurrency(financials.complianceSavings)}**\n\n`
    md += `### Financial Modeling\n`
    md += `- Planning horizon: ${assumptions.horizonYears} years\n`
    md += `- Discount rate (WACC): ${assumptions.discountRatePct}%\n`
    md += `- Total gross benefit: ${formatCurrency(financials.totalBenefit)}\n\n`
    if (crossCheck) {
      md += `## Cross-Check (independent second estimate)\n\n`
      if (crossCheck.lowConfidence) {
        md += `Assessment profile too thin for a reliable second estimate (fell back to the floor).\n\n`
      } else {
        md += `| Method | Estimate |\n|--------|----------|\n`
        md += `| Per-product model (full estate) | ${formatCurrency(crossCheck.methodAFullEstate)} |\n`
        md += `| Assessment-derived | ${formatCurrency(crossCheck.assessmentCost)} |\n`
        md += `| Verdict | ${crossCheck.recon.verdict} (${
          crossCheck.recon.ratio === Infinity ? '∞' : `${crossCheck.recon.ratio.toFixed(1)}×`
        }, ${Math.round(crossCheck.recon.spreadPct)}% spread) |\n\n`
      }
    }
    md += `## Sensitivity (NPV impact at ±30%)\n\n`
    md += `| Driver | Low | High | Range |\n|--------|-----|------|-------|\n`
    for (const row of tornado) {
      md += `| ${row.label} | ${formatCurrency(row.low)} | ${formatCurrency(row.high)} | ${formatCurrency(row.delta)} |\n`
    }
    md += `\n*Educational estimate for planning purposes. Breach baseline: IBM Cost of a Data Breach Report 2025. Compliance penalties: published regulatory enforcement data.*\n`
    md += `\n*${IBM_BASELINE_UNVERIFIED_NOTE}*\n`
    md += '\n---\n\n'
    md +=
      '*Aligned to NIST CSWP 39 §2.4 (Resource and Performance Challenges) and §5 (Strategic Plan). https://doi.org/10.6028/NIST.CSWP.39-upd1*\n'
    return md
  }, [
    assumptions,
    financials,
    data.industry,
    data.country,
    data.totalProducts,
    data.frameworksByIndustry.length,
    industryBreachBaseline,
    quantumMultiplier,
    tornado,
    costOfInaction,
    crossCheck,
  ])

  const primaryTornadoColor = 'hsl(var(--primary))'
  const destructiveTornadoColor = 'hsl(var(--destructive))'

  return (
    <div className="space-y-6">
      {/* Intended audience banner */}
      <div className="bg-primary/5 rounded-lg p-3 border border-primary/30 flex items-start gap-2">
        <Info size={16} className="text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Board-ready business case.</strong> Intended audience:
          CFO, CIO, and board. Figures are illustrative estimates; pair with your
          organization&apos;s finance model before seeking approval.
        </p>
      </div>

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

      {savedAssumptions && (
        <PreFilledBanner
          summary="Restored your last saved ROI assumptions — adjust the sliders below to update them, or reset to recompute from your current data."
          onClear={resetToComputedDefaults}
        />
      )}
      {!savedAssumptions &&
        (() => {
          const sources: string[] = []
          if (data.industry) sources.push(`industry (${data.industry})`)
          if (data.riskScore !== null) sources.push('assessment risk score')
          if (data.myFrameworks.length > 0)
            sources.push(
              `${data.myFrameworks.length} framework${data.myFrameworks.length !== 1 ? 's' : ''} from /compliance`
            )
          if (data.myProducts.length > 0)
            sources.push(
              `${data.myProducts.length} product${data.myProducts.length !== 1 ? 's' : ''} from /migrate`
            )
          if (data.criticalThreatCount > 0 && data.industry)
            sources.push(`${data.industryThreats.length} industry threats`)
          if (data.migrationDeadlineYear)
            sources.push(`deadline ${data.migrationDeadlineYear} from /timeline`)
          if (sources.length === 0) return null
          return <PreFilledBanner summary={`ROI defaults pulled from ${sources.join(' + ')}.`} />
        })()}

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-6 text-center">
          <DollarSign size={24} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-1">
            Total Cost ({assumptions.horizonYears}yr)
          </p>
          <p className="text-3xl font-bold text-foreground">
            {formatCurrency(financials.totalCost)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Capex {formatCurrency(financials.totalMigrationCost)} + Opex{' '}
            {formatCurrency(financials.annualOpex * assumptions.horizonYears)}
          </p>
        </div>
        <div className="glass-panel p-6 text-center">
          <TrendingDown size={24} className="mx-auto text-status-warning mb-2" />
          <p className="text-sm text-muted-foreground mb-1">
            Cost of Inaction ({assumptions.horizonYears}yr)
          </p>
          <p className="text-3xl font-bold text-status-warning">{formatCurrency(costOfInaction)}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Expected breach + compliance exposure
          </p>
        </div>
        <div className="glass-panel p-6 text-center">
          <TrendingUp size={24} className="mx-auto text-status-success mb-2" />
          <p className="text-sm text-muted-foreground mb-1">NPV @ {assumptions.discountRatePct}%</p>
          <p
            className={`text-3xl font-bold ${
              (financials.npv ?? 0) >= 0 ? 'text-status-success' : 'text-status-error'
            }`}
          >
            {formatCurrency(financials.npv ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {assumptions.horizonYears}-year ROI: {formatPercent(financials.roiPercent)}
          </p>
        </div>
        <div className="glass-panel p-6 text-center">
          <Clock size={24} className="mx-auto text-primary mb-2" />
          <p className="text-sm text-muted-foreground mb-1">Payback Period</p>
          <p className="text-3xl font-bold text-primary">
            {isFinite(financials.paybackMonths)
              ? `${Math.round(financials.paybackMonths)}mo`
              : 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Capex recoup from net benefit</p>
        </div>
      </div>

      {/* ── Investment (Capex + Opex) ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <Settings2 size={16} className="text-primary shrink-0" />
          Investment
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
                Capex per Product
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
            <div className="md:col-span-2">
              <label
                htmlFor="roi-opex-pct"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Annual Opex (% of capex)
              </label>
              <input
                id="roi-opex-pct"
                type="range"
                min={0}
                max={40}
                step={1}
                value={assumptions.annualOpexPct}
                onChange={(e) => updateAssumption('annualOpexPct', parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span className="text-sm font-mono text-primary">
                  {assumptions.annualOpexPct}% ≈ {formatCurrency(financials.annualOpex)}/yr
                </span>
                <span>40%</span>
              </div>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs font-mono text-muted-foreground">
              Capex: {assumptions.productsToMigrate} × {formatCurrency(assumptions.costPerProduct)}{' '}
              ={' '}
              <span className="text-primary font-bold">
                {formatCurrency(financials.totalMigrationCost)}
              </span>{' '}
              + Opex {formatCurrency(financials.annualOpex)}/yr × {assumptions.horizonYears}yr ={' '}
              <span className="text-primary font-bold">{formatCurrency(financials.totalCost)}</span>{' '}
              total
            </p>
          </div>
        </div>
      </details>

      {/* ── Cross-check vs your assessment (independent second estimate) ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <Scale size={16} className="text-primary shrink-0" />
          Cross-check vs your assessment
        </summary>
        <div className="mt-4 space-y-3">
          {crossCheck ? (
            <>
              <p className="text-xs text-muted-foreground">
                A single number is easy to challenge. Below, your per-product model (scaled to your
                full estate, so it&apos;s comparable to the assessment side) sits next to the cost
                your assessment implies from your infrastructure, vendors, and crypto-agility. These
                are two <em>independent</em> methods &mdash; expect a ballpark match, not an exact
                one. The full-estate number intentionally doesn&apos;t move with the Products to
                Migrate slider above &mdash; your current slider scope is shown separately below it.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">
                    Your per-product model (full estate)
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {formatCurrency(crossCheck.methodAFullEstate)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                    {formatCurrency(assumptions.costPerProduct)} × {data.totalProducts} products
                  </div>
                  {assumptions.productsToMigrate !== data.totalProducts && (
                    <div className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border font-mono">
                      At your selected scope ({assumptions.productsToMigrate} of{' '}
                      {data.totalProducts} products above):{' '}
                      <span className="text-foreground font-semibold">
                        {formatCurrency(financials.totalMigrationCost)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">
                    Assessment-derived estimate
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {formatCurrency(crossCheck.assessmentCost)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    From your infrastructure, vendor &amp; agility profile
                  </div>
                </div>
              </div>
              {crossCheck.lowConfidence ? (
                <div className="bg-status-warning/10 rounded-lg p-3 border border-status-warning/30 flex items-start gap-2">
                  <Info size={14} className="text-status-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/90">
                    Your assessment profile is too thin for a reliable second estimate (it fell back
                    to the floor). Fill in more of the{' '}
                    <Link to="/assess" className="text-primary hover:underline">
                      assessment
                    </Link>{' '}
                    to sharpen this cross-check.
                  </p>
                </div>
              ) : (
                <div
                  className={`rounded-lg p-3 border flex items-start gap-2 ${
                    crossCheck.recon.verdict === 'aligned'
                      ? 'bg-status-success/10 border-status-success/30'
                      : 'bg-status-warning/10 border-status-warning/30'
                  }`}
                >
                  {crossCheck.recon.verdict === 'aligned' ? (
                    <TrendingUp size={14} className="text-status-success shrink-0 mt-0.5" />
                  ) : (
                    <TrendingDown size={14} className="text-status-warning shrink-0 mt-0.5" />
                  )}
                  <p className="text-xs text-foreground/90">
                    {crossCheck.recon.verdict === 'aligned' ? (
                      <>
                        <strong>Aligned.</strong> The two methods agree within{' '}
                        {crossCheck.recon.ratio.toFixed(1)}× (
                        {Math.round(crossCheck.recon.spreadPct)}% spread) &mdash; a reassuring sign
                        your headline number is in the right ballpark.
                      </>
                    ) : (
                      <>
                        <strong>Divergent.</strong> The two methods differ by{' '}
                        {crossCheck.recon.ratio === Infinity
                          ? '∞'
                          : `${crossCheck.recon.ratio.toFixed(1)}×`}{' '}
                        ({Math.round(crossCheck.recon.spreadPct)}% spread). Before you present this,
                        close the gap &mdash; revisit your capex-per-product, your product count, or
                        the assessment inputs.
                      </>
                    )}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-muted/50 rounded-lg p-3 border border-border flex items-start gap-2">
              <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Run the{' '}
                <Link to="/assess" className="text-primary hover:underline">
                  assessment
                </Link>{' '}
                to generate a second, independent cost estimate &mdash; then this panel cross-checks
                it against your per-product model so you never present a single unverified number.
              </p>
            </div>
          )}
        </div>
      </details>

      {/* ── Risk Reduction (Quantum-decomposed) ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <Shield size={16} className="text-primary shrink-0" />
          Risk Reduction
        </summary>
        <div className="mt-4 space-y-4">
          <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
            <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Industry breach baseline ({data.industry || 'Other'}):{' '}
              <span className="font-mono text-foreground font-semibold">
                {formatCurrency(industryBreachBaseline)}
              </span>{' '}
              &mdash; IBM Cost of a Data Breach Report 2025. Quantum amplification is composed from
              three defensible factors below.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="roi-hndl" className="block text-sm font-medium text-foreground mb-2">
                HNDL Exposure
              </label>
              <input
                id="roi-hndl"
                type="range"
                min={0}
                max={100}
                step={1}
                value={assumptions.hndlExposurePct}
                onChange={(e) => updateAssumption('hndlExposurePct', parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span className="text-sm font-mono text-primary">
                  {assumptions.hndlExposurePct}%
                </span>
                <span>100%</span>
              </div>
            </div>
            <div>
              <label htmlFor="roi-crqc" className="block text-sm font-medium text-foreground mb-2">
                Post-CRQC Attacker Uplift
              </label>
              <input
                id="roi-crqc"
                type="range"
                min={0}
                max={100}
                step={1}
                value={assumptions.crqcAttackerUpliftPct}
                onChange={(e) =>
                  updateAssumption('crqcAttackerUpliftPct', parseInt(e.target.value))
                }
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span className="text-sm font-mono text-primary">
                  {assumptions.crqcAttackerUpliftPct}%
                </span>
                <span>100%</span>
              </div>
            </div>
            <div>
              <label
                htmlFor="roi-detection"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Detection-Timeline Uplift
              </label>
              <input
                id="roi-detection"
                type="range"
                min={0}
                max={100}
                step={1}
                value={assumptions.detectionTimelineUpliftPct}
                onChange={(e) =>
                  updateAssumption('detectionTimelineUpliftPct', parseInt(e.target.value))
                }
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span className="text-sm font-mono text-primary">
                  {assumptions.detectionTimelineUpliftPct}%
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>
          <div>
            <label
              htmlFor="roi-breach-probability"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Annual Breach Probability
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {ORG_SIZE_TIER_OPTIONS.map(({ tier, label }) => (
                <Button
                  key={tier}
                  type="button"
                  variant="ghost"
                  onClick={() => selectOrgSizeTier(tier)}
                  className={`h-auto px-2 py-0.5 rounded-full border text-[11px] ${
                    assumptions.orgSizeTier === tier
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:text-foreground'
                  }`}
                >
                  {label} ({ANNUAL_BREACH_PROBABILITY_PCT[tier]}%)
                </Button>
              ))}
            </div>
            <input
              id="roi-breach-probability"
              type="range"
              min={1}
              max={50}
              // 0.1 steps and parseFloat: the IRIS tier anchors are fractional
              // (8.7 / 9.3 / 12.8) and parseInt silently truncated them to
              // integers the moment the slider was touched.
              step={0.1}
              value={assumptions.breachProbability}
              onChange={(e) => updateAssumption('breachProbability', parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1%</span>
              <span className="text-sm font-mono text-primary">
                {assumptions.breachProbability}%
              </span>
              <span>50%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Default reflects the selected organization size — Cyentia IRIS 2025 anchors: SMB
              8.7%/yr, average org 9.3%/yr, Fortune-1000-class 12.8%/yr. The tiers sit close
              together because IRIS 2025's finding is that they have converged: small-firm risk has
              more than doubled since 2008 while the largest firms' has fallen. Drag the slider to
              override.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs font-mono text-muted-foreground">
              {formatCurrency(industryBreachBaseline)} × quantum amp{' '}
              <span className="text-foreground font-bold">{quantumMultiplier.toFixed(2)}×</span> ×{' '}
              {assumptions.breachProbability}% ={' '}
              <span className="text-primary font-bold">
                {formatCurrency(financials.breachCostSavings)}
              </span>
              /year
            </p>
          </div>
        </div>
      </details>

      {/* ── Regulatory Exposure ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <Scale size={16} className="text-primary shrink-0" />
          Regulatory Exposure
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
              {assumptions.applicableFrameworks} frameworks ×{' '}
              {formatCurrency(assumptions.penaltyPerIncident)} ×{' '}
              {Math.round(DEFAULT_COMPLIANCE_INCIDENT_RATE * 100)}% incident rate ={' '}
              <span className="text-primary font-bold">
                {formatCurrency(financials.complianceSavings)}
              </span>
              /year
            </p>
          </div>
        </div>
      </details>

      {/* ── Financial Modeling (Horizon + WACC) ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <Calendar size={16} className="text-primary shrink-0" />
          Financial Modeling
        </summary>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="roi-horizon"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Planning Horizon (years)
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
            <div>
              <label
                htmlFor="roi-discount"
                className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1"
              >
                <Percent size={13} className="text-muted-foreground" />
                Discount Rate (WACC)
              </label>
              <input
                id="roi-discount"
                type="range"
                min={0}
                max={20}
                step={1}
                value={assumptions.discountRatePct}
                onChange={(e) => updateAssumption('discountRatePct', parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span className="text-sm font-mono text-primary">
                  {assumptions.discountRatePct}%
                </span>
                <span>20%</span>
              </div>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs font-mono text-muted-foreground">
              {formatCurrency(financials.netAnnualBenefit)}/yr net × {assumptions.horizonYears} yr,
              discounted @ {assumptions.discountRatePct}% ={' '}
              <span
                className={`font-bold ${
                  (financials.npv ?? 0) >= 0 ? 'text-status-success' : 'text-status-error'
                }`}
              >
                NPV {formatCurrency(financials.npv ?? 0)}
              </span>
            </p>
          </div>
        </div>
      </details>

      {/* ── Sensitivity (Tornado Chart) ── */}
      <details className="glass-panel p-4">
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <BarChart2 size={16} className="text-primary shrink-0" />
          Sensitivity — NPV impact at ±30%
        </summary>
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={tornado}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <XAxis
                type="number"
                tickFormatter={(v: number) => formatCurrency(v)}
                tick={{ fontSize: 11 }}
              />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={140} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
              />
              <ReferenceLine x={0} stroke="hsl(var(--border))" />
              <Bar dataKey="low" stackId="t">
                {tornado.map((row, i) => (
                  <Cell
                    key={`low-${i}`}
                    fill={row.low < 0 ? destructiveTornadoColor : primaryTornadoColor}
                  />
                ))}
              </Bar>
              <Bar dataKey="high" stackId="t">
                {tornado.map((row, i) => (
                  <Cell
                    key={`high-${i}`}
                    fill={row.high >= 0 ? primaryTornadoColor : destructiveTornadoColor}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2">
            Bars show NPV delta when each driver moves ±30% from its current value. Longest bars are
            your most material assumptions — defend them first.
          </p>
        </div>
      </details>

      {/* Methodology note */}
      <details className="glass-panel p-4">
        <summary className="text-sm font-medium text-foreground cursor-pointer">
          Calculation Methodology
        </summary>
        <div className="mt-3 text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Investment:</strong> Capex (products × per-product cost) plus annual opex
            modeled as a % of capex. Typical ongoing opex covers HSM maintenance, key rotation, and
            audit — industry defaults are 10–20% of capex.
          </p>
          <p>
            <strong>Risk reduction:</strong> Industry breach baseline (IBM Cost of a Data Breach
            Report 2025) × a composed quantum amplification factor × annual breach probability. The
            amplification factor is the sum of three defensible components — HNDL exposure (fraction
            of data at risk of retroactive decryption), post-CRQC attacker uplift (new capability
            ceiling once a CRQC exists), and detection-timeline uplift (mean time to detect will
            lengthen).
          </p>
          <p>
            <strong>Regulatory exposure:</strong> Number of applicable regulatory frameworks ×
            average penalty per incident × a {Math.round(DEFAULT_COMPLIANCE_INCIDENT_RATE * 100)}%
            annual incident probability per framework.
          </p>
          <p>
            <strong>NPV:</strong> Σ (netAnnualBenefit / (1 + WACC)^t) − capex, where
            netAnnualBenefit = grossAnnualBenefit − annualOpex.
          </p>
          <p>
            <strong>Payback:</strong> capex / (netAnnualBenefit / 12). Uses annual (not horizon)
            benefit so payback is not understated by the horizon.
          </p>
          <p>
            <strong>Sensitivity:</strong> Each driver is varied ±30% from its current value while
            all others are held constant; the resulting NPV delta indicates which assumption most
            moves the business case.
          </p>
          <p>
            <strong>Qualitative factors not modeled:</strong> Operational efficiency from crypto
            agility, competitive advantage from early PQC adoption, customer trust.
          </p>
          <p>
            <strong>Which costing model this is:</strong> a bottom-up parametric estimate (assets ×
            unit cost) with deterministic ±30% sensitivity. It is one of several model families —
            top-down budget-percentage anchoring, probabilistic Monte-Carlo bands, and
            expert-elicited scenario ranges are the others. No single method is reliable for PQC
            under deep uncertainty, so triangulate: treat agreement across two or three independent
            estimates as confidence, and divergence as a prompt to revisit assumptions. See the
            Learn tab&apos;s &ldquo;Choosing a Costing Model&rdquo; section for the full comparison.
          </p>
          <p className="text-xs italic mt-2">
            Educational estimates for planning. Pair with your finance function&apos;s discounted
            cash-flow model before committing capital.
          </p>
        </div>
      </details>

      {/* Export */}
      <ExportableArtifact
        title="PQC Migration ROI — Export"
        exportData={exportMarkdown}
        filename="pqc-roi-analysis"
        formats={['markdown', 'pdf', 'docx']}
        onExport={() => {
          addExecutiveDocument({
            id: `roi-model-${Date.now()}`,
            moduleId: 'pqc-business-case',
            type: 'roi-model',
            title: `PQC ROI Analysis — ${new Date().toLocaleDateString()}`,
            data: exportMarkdown,
            inputs: assumptions,
            // Computed totals, distinct from `inputs` (the assumptions) — lets
            // Board Pitch Builder show real numbers when reached outside the
            // linear Business Case wizard (Simulation, Business Center), not
            // just when roiOutput is passed as a live prop.
            output: {
              totalCostUSD: financials.totalCost,
              roiPercent: financials.roiPercent,
              paybackMonths: financials.paybackMonths,
              breachCostSavingsUSD: financials.breachCostSavings,
            },
            createdAt: Date.now(),
          })
        }}
      >
        <p className="text-sm text-muted-foreground">
          Export the ROI analysis above as markdown, PDF, or DOCX for board distribution. The
          artifact is also saved to your Command Center Risk Artifacts list.
        </p>
      </ExportableArtifact>
    </div>
  )
}
