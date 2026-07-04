// SPDX-License-Identifier: GPL-3.0-only
/**
 * Exec-tour financial artifacts (ROI model, breach scenario, cost of inaction)
 * DERIVED from the same shared math the real Business Case tools use, so the
 * narrated walkthrough can never drift from what a user gets by opening the
 * tools. These override the hand-authored static docs via REAL_DOC_GENERATORS.
 */
import {
  DEFAULT_COMPLIANCE_INCIDENT_RATE,
  computeAnnualBreachSavings,
  computeAnnualComplianceSavings,
  computeROI,
  resolveIndustryBreachBaseline,
} from '@/utils/roiMath'
import { computeBreachCosts } from '@/utils/breachCostModel'
import { DELAY_MODEL_DEFAULTS, projectDelayScenario } from '@/utils/delayCostModel'
import { DELAY_COST_PROFILES } from '@/components/PKILearning/modules/PQCBusinessCase/data/businessCaseScenarios'
import { ORG, CUR, type DemoDoc, type DemoSector } from './demoDocs'

interface DemoScenario {
  industry: string
  systems: number
  costPerProduct: number
  frameworks: number
  penaltyPerIncident: number
}

/** Per-sector scenario that drives the shared math. Illustrative estate sizes. */
const SCENARIO: Record<DemoSector, DemoScenario> = {
  financial: {
    industry: 'Finance & Banking',
    systems: 120,
    costPerProduct: 75_000,
    frameworks: 4,
    penaltyPerIncident: 5_000_000,
  },
  healthcare: {
    industry: 'Healthcare',
    systems: 90,
    costPerProduct: 65_000,
    frameworks: 3,
    penaltyPerIncident: 2_000_000,
  },
  government: {
    industry: 'Government & Defense',
    systems: 200,
    costPerProduct: 90_000,
    frameworks: 4,
    penaltyPerIncident: 5_000_000,
  },
  energy: {
    industry: 'Energy & Utilities',
    systems: 140,
    costPerProduct: 80_000,
    frameworks: 3,
    penaltyPerIncident: 2_500_000,
  },
  telecom: {
    industry: 'Telecommunications',
    systems: 160,
    costPerProduct: 70_000,
    frameworks: 3,
    penaltyPerIncident: 1_200_000,
  },
  retail: {
    industry: 'Retail & E-Commerce',
    systems: 70,
    costPerProduct: 45_000,
    frameworks: 2,
    penaltyPerIncident: 500_000,
  },
  general: {
    industry: 'Technology',
    systems: 90,
    costPerProduct: 60_000,
    frameworks: 3,
    penaltyPerIncident: 800_000,
  },
}

const QUANTUM_MULTIPLIER = 2.5
const BREACH_PROB_PCT = 15
const HORIZON_YEARS = 4
const DISCOUNT_RATE = 0.1
// Fixed reference year keeps the demo docs deterministic (illustrative content).
const CURRENT_YEAR = 2026
const DELAY_YEARS = 3

function fmt(cur: string, n: number): string {
  const sign = n < 0 ? '-' : ''
  const a = Math.abs(n)
  if (a >= 1_000_000_000) return `${sign}${cur}${(a / 1_000_000_000).toFixed(1)}B`
  if (a >= 1_000_000) return `${sign}${cur}${(a / 1_000_000).toFixed(1)}M`
  if (a >= 1_000) return `${sign}${cur}${(a / 1_000).toFixed(0)}K`
  return `${sign}${cur}${a.toFixed(0)}`
}

const joinMd = (...lines: string[]): string => lines.join('\n')

function breachFor(sector: DemoSector) {
  const s = SCENARIO[sector]
  const baseline = resolveIndustryBreachBaseline(s.industry)
  return {
    baseline,
    costs: computeBreachCosts({
      baseline,
      breachScale: 1,
      yearsOfData: 5,
      hndlFactorPct: 30,
      annualBreachProbPct: BREACH_PROB_PCT,
    }),
  }
}

export function deriveBreachDoc(sector: DemoSector): DemoDoc {
  const s = SCENARIO[sector]
  const cur = CUR[sector]
  const { costs } = breachFor(sector)
  return {
    title: 'Breach Scenario — classical vs quantum',
    data: joinMd(
      `# Breach Scenario — ${ORG[sector]}`,
      '',
      `Industry baseline (${s.industry}), IBM Cost of a Data Breach 2024.`,
      '',
      '| Metric | Value |',
      '|--------|-------|',
      `| Classical breach (per event) | ${fmt(cur, costs.classicalSLE)} |`,
      `| Quantum-enabled breach (per event) | ${fmt(cur, costs.quantumSLE)} |`,
      `| Additional quantum risk (HNDL) | ${fmt(cur, costs.delta)} |`,
      `| Annual expected loss (classical) | ${fmt(cur, costs.classicalALE)} |`,
      `| Annual expected loss (quantum) | ${fmt(cur, costs.quantumALE)} |`,
      '',
      `HNDL amplification ${costs.hndlMultiplier.toFixed(2)}× at ${BREACH_PROB_PCT}% annual probability. Derived from the Breach Scenario Simulator's model.`
    ),
  }
}

export function deriveRoiDoc(sector: DemoSector): DemoDoc {
  const s = SCENARIO[sector]
  const cur = CUR[sector]
  const { baseline } = breachFor(sector)
  const migrationCost = s.systems * s.costPerProduct
  const annualOpex = migrationCost * 0.15
  const breachSavings = computeAnnualBreachSavings({
    breachBaseline: baseline,
    breachProbabilityPct: BREACH_PROB_PCT,
    quantumMultiplier: QUANTUM_MULTIPLIER,
  })
  const complianceSavings = computeAnnualComplianceSavings({
    frameworkCount: s.frameworks,
    penaltyPerIncident: s.penaltyPerIncident,
    incidentRate: DEFAULT_COMPLIANCE_INCIDENT_RATE,
  })
  const roi = computeROI({
    migrationCost,
    annualOpex,
    annualBenefit: breachSavings + complianceSavings,
    horizonYears: HORIZON_YEARS,
    discountRate: DISCOUNT_RATE,
  })
  return {
    title: 'Multi-Year Migration Budget & ROI',
    data: joinMd(
      `# Migration Budget & ROI — ${ORG[sector]}`,
      '',
      '| Metric | Value |',
      '|--------|-------|',
      `| Capital expenditure (${s.systems} systems) | ${fmt(cur, migrationCost)} |`,
      `| Annual operating cost | ${fmt(cur, annualOpex)} |`,
      `| ${HORIZON_YEARS}-year total cost | ${fmt(cur, roi.totalCost)} |`,
      `| Annual breach-avoidance benefit | ${fmt(cur, breachSavings)} |`,
      `| Annual compliance benefit | ${fmt(cur, complianceSavings)} |`,
      `| NPV @ ${Math.round(DISCOUNT_RATE * 100)}% | ${fmt(cur, roi.npv ?? 0)} |`,
      `| ${HORIZON_YEARS}-year ROI | ${Math.round(roi.roiPercent)}% |`,
      `| Payback | ${isFinite(roi.paybackMonths) ? `${Math.round(roi.paybackMonths)} months` : 'n/a'} |`,
      '',
      'Derived from the ROI Calculator (bottom-up capex + breach-avoidance + compliance, discounted to NPV). Pair with your finance model before committing capital.'
    ),
  }
}

export function deriveInactionDoc(sector: DemoSector): DemoDoc {
  const s = SCENARIO[sector]
  const cur = CUR[sector]
  const { costs } = breachFor(sector)
  const profile =
    DELAY_COST_PROFILES.find((p) => p.industry === s.industry) ?? DELAY_COST_PROFILES[0]
  const inputs = {
    quantumBreachPerEvent: costs.quantumSLE,
    annualBreachProbPct: DELAY_MODEL_DEFAULTS.annualBreachProbPct,
    migrationCostUSD: profile.migrationCostUSD,
    delayPremiumPerYear: profile.delayPremiumPerYear,
    regulatoryPenaltyUSD: profile.regulatoryPenaltyUSD,
    hardDeadlineYear: profile.hardDeadline,
    currentYear: CURRENT_YEAR,
    horizonYears: DELAY_MODEL_DEFAULTS.horizonYears,
    discountRatePct: DELAY_MODEL_DEFAULTS.discountRatePct,
    residualFactor: DELAY_MODEL_DEFAULTS.residualFactor,
  }
  const now = projectDelayScenario(inputs, 0)
  const delayed = projectDelayScenario(inputs, DELAY_YEARS)
  const costOfInaction = delayed.total - now.total
  return {
    title: 'Cost of Inaction',
    data: joinMd(
      `# Cost of Inaction — ${ORG[sector]}`,
      '',
      '| Metric | Value |',
      '|--------|-------|',
      `| Migrate now (${inputs.horizonYears}-yr NPV) | ${fmt(cur, now.total)} |`,
      `| Delay ${DELAY_YEARS}yr (${inputs.horizonYears}-yr NPV) | ${fmt(cur, delayed.total)} |`,
      `| **Cost of inaction** | **${fmt(cur, costOfInaction)}** |`,
      '',
      `Discounted at ${inputs.discountRatePct}% over ${inputs.horizonYears} years; ${Math.round(
        inputs.residualFactor * 100
      )}% HNDL residual after migration. Derived from the Cost of Inaction Analyzer.`
    ),
  }
}
