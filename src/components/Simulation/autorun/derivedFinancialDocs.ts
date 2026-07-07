// SPDX-License-Identifier: GPL-3.0-only
/**
 * Exec-tour financial artifacts (ROI model, breach scenario, cost of inaction,
 * board deck) DERIVED from the same shared math the real Business Case tools
 * use, so the narrated walkthrough can never drift from what a user gets by
 * opening the tools. These override the hand-authored static docs via
 * REAL_DOC_GENERATORS. All four docs share one per-sector computation, so their
 * figures are mutually consistent.
 */
import {
  DEFAULT_COMPLIANCE_INCIDENT_RATE,
  computeAnnualBreachSavings,
  computeAnnualComplianceSavings,
  computeROI,
  resolveIndustryBreachBaseline,
  type ROIMetrics,
} from '@/utils/roiMath'
import { computeBreachCosts, type BreachCosts } from '@/utils/breachCostModel'
import {
  DELAY_MODEL_DEFAULTS,
  projectDelayScenario,
  type DelayScenarioResult,
} from '@/utils/delayCostModel'
import { deriveIndustryMandate, deriveIndustryPenalty } from '@/utils/inactionDrivers'
import { compareCostModels } from '@/utils/costModelSim'
import { DELAY_COST_PROFILES } from '@/components/PKILearning/modules/PQCBusinessCase/data/businessCaseScenarios'
import { ORG, CUR, REG, type DemoDoc, type DemoSector } from './demoDocs'

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

interface SectorFinancials {
  cur: string
  baseline: number
  breach: BreachCosts
  migrationCost: number
  annualOpex: number
  breachSavings: number
  complianceSavings: number
  roi: ROIMetrics
  now: DelayScenarioResult
  delayed: DelayScenarioResult
  costOfInaction: number
  /** delayed ÷ migrate-now total (≥ 1) — the "cost of waiting" multiplier. */
  delayRatio: number
}

/** One shared per-sector computation so every derived doc agrees. */
function sectorFinancials(sector: DemoSector): SectorFinancials {
  const s = SCENARIO[sector]
  const cur = CUR[sector]
  const baseline = resolveIndustryBreachBaseline(s.industry)
  const breach = computeBreachCosts({
    baseline,
    breachScale: 1,
    yearsOfData: 5,
    hndlFactorPct: 30,
    annualBreachProbPct: BREACH_PROB_PCT,
    dataSensitivityClass: 'general-pii',
    asOfYear: CURRENT_YEAR,
    planningHorizonYears: HORIZON_YEARS,
    discountRateAnnual: DISCOUNT_RATE,
  })

  const migrationCost = s.systems * s.costPerProduct
  const annualOpex = migrationCost * 0.15
  // quantumMultiplier derived from the same probability-weighted model (not a
  // flat assumed amplification) so this ROI figure can't drift from the
  // Breach Scenario Simulator's own numbers.
  const breachSavings = computeAnnualBreachSavings({
    breachBaseline: baseline,
    breachProbabilityPct: BREACH_PROB_PCT,
    quantumMultiplier: breach.classicalALE > 0 ? breach.quantumALE / breach.classicalALE : 1,
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

  const profile =
    DELAY_COST_PROFILES.find((p) => p.industry === s.industry) ?? DELAY_COST_PROFILES[0]
  const mandate = deriveIndustryMandate(s.industry)
  const penalty = deriveIndustryPenalty(s.industry)
  const delayInputs = {
    breachBaseline: baseline,
    breachScale: 1,
    baseYearsOfData: 5,
    hndlFactorPct: 30,
    dataSensitivityClass: profile.dataSensitivityClass,
    annualBreachProbPct: BREACH_PROB_PCT,
    migrationCostUSD: profile.migrationCostUSD,
    delayPremiumPerYear: profile.delayPremiumPerYear,
    migrationDurationYears: DELAY_MODEL_DEFAULTS.migrationDurationYears,
    mandateType: mandate.mandateType,
    hardDeadlineYear: mandate.deadlineYear,
    annualFineUSD: penalty.annualFineUSD,
    cliffLossUSD: penalty.cliffLossUSD,
    currentYear: CURRENT_YEAR,
    horizonYears: DELAY_MODEL_DEFAULTS.horizonYears,
    discountRatePct: DELAY_MODEL_DEFAULTS.discountRatePct,
  }
  const now = projectDelayScenario(delayInputs, 0)
  const delayed = projectDelayScenario(delayInputs, DELAY_YEARS)

  return {
    cur,
    baseline,
    breach,
    migrationCost,
    annualOpex,
    breachSavings,
    complianceSavings,
    roi,
    now,
    delayed,
    costOfInaction: delayed.total - now.total,
    delayRatio: now.total > 0 ? delayed.total / now.total : 1,
  }
}

export function deriveBreachDoc(sector: DemoSector): DemoDoc {
  const s = SCENARIO[sector]
  const { cur, breach } = sectorFinancials(sector)
  return {
    title: 'Breach Scenario — classical vs quantum',
    data: joinMd(
      `# Breach Scenario — ${ORG[sector]}`,
      '',
      `Industry baseline (${s.industry}), IBM Cost of a Data Breach 2025.`,
      '',
      '| Metric | Value |',
      '|--------|-------|',
      `| Classical breach (per event) | ${fmt(cur, breach.classicalSLE)} |`,
      `| Quantum-enabled breach (per event, if CRQC exists) | ${fmt(cur, breach.quantumSLE)} |`,
      `| Additional quantum risk (HNDL, if CRQC exists) | ${fmt(cur, breach.delta)} |`,
      `| Annual expected loss (classical) | ${fmt(cur, breach.classicalALE)} |`,
      `| Annual expected loss (quantum-weighted) | ${fmt(cur, breach.quantumALE)} |`,
      `| Probability CRQC exists within horizon | ${Math.round(breach.pCrqc * 100)}% |`,
      '',
      `HNDL amplification ${breach.hndlMultiplier.toFixed(2)}× at ${BREACH_PROB_PCT}% annual breach probability, weighted by a ${Math.round(breach.pCrqc * 100)}% chance a CRQC exists within the horizon (GRI 2025). Derived from the Breach Scenario Simulator's model.`
    ),
  }
}

export function deriveRoiDoc(sector: DemoSector): DemoDoc {
  const s = SCENARIO[sector]
  const f = sectorFinancials(sector)
  const { cur, roi } = f
  return {
    title: 'Multi-Year Migration Budget & ROI',
    data: joinMd(
      `# Migration Budget & ROI — ${ORG[sector]}`,
      '',
      '| Metric | Value |',
      '|--------|-------|',
      `| Capital expenditure (${s.systems} systems) | ${fmt(cur, f.migrationCost)} |`,
      `| Annual operating cost | ${fmt(cur, f.annualOpex)} |`,
      `| ${HORIZON_YEARS}-year total cost | ${fmt(cur, roi.totalCost)} |`,
      `| Annual breach-avoidance benefit | ${fmt(cur, f.breachSavings)} |`,
      `| Annual compliance benefit | ${fmt(cur, f.complianceSavings)} |`,
      `| NPV @ ${Math.round(DISCOUNT_RATE * 100)}% | ${fmt(cur, roi.npv ?? 0)} |`,
      `| ${HORIZON_YEARS}-year ROI | ${Math.round(roi.roiPercent)}% |`,
      `| Payback | ${isFinite(roi.paybackMonths) ? `${Math.round(roi.paybackMonths)} months` : 'n/a'} |`,
      '',
      'Derived from the ROI Calculator (bottom-up capex + breach-avoidance + compliance, discounted to NPV). Pair with your finance model before committing capital.'
    ),
  }
}

export function deriveInactionDoc(sector: DemoSector): DemoDoc {
  const f = sectorFinancials(sector)
  const { cur, now, delayed, costOfInaction } = f
  return {
    title: 'Cost of Inaction',
    data: joinMd(
      `# Cost of Inaction — ${ORG[sector]}`,
      '',
      '| Metric | Value |',
      '|--------|-------|',
      `| Migrate now (${DELAY_MODEL_DEFAULTS.horizonYears}-yr NPV) | ${fmt(cur, now.total)} |`,
      `| Delay ${DELAY_YEARS}yr (${DELAY_MODEL_DEFAULTS.horizonYears}-yr NPV) | ${fmt(cur, delayed.total)} |`,
      `| **Cost of inaction** | **${fmt(cur, costOfInaction)}** |`,
      '',
      `Discounted at ${DELAY_MODEL_DEFAULTS.discountRatePct}% over ${DELAY_MODEL_DEFAULTS.horizonYears} years; a residual HNDL tail persists after migration from data harvested before then. Derived from the Cost of Inaction Analyzer.`
    ),
  }
}

export function deriveExplorerDoc(sector: DemoSector): DemoDoc {
  const s = SCENARIO[sector]
  const cur = CUR[sector]
  const itBudget = 50_000_000
  const c = compareCostModels(
    { systems: s.systems, itBudgetAnnual: itBudget, complexity: 1, horizonYears: 5 },
    { seed: 42 }
  )
  return {
    title: 'Cost Model Comparison',
    data: joinMd(
      `# Cost Model Comparison — ${ORG[sector]}`,
      '',
      `Scenario: ${s.systems} systems, ${fmt(cur, itBudget)} IT budget, 5-year horizon.`,
      '',
      '| Method | Estimate |',
      '|--------|----------|',
      `| Parametric (budget-anchored) | ${fmt(cur, c.parametric)} |`,
      `| Bottom-up (activity-based) | ${fmt(cur, c.bottomUp)} |`,
      `| Probabilistic (Monte Carlo P50) | ${fmt(cur, c.monteCarlo.p50)} |`,
      `| Judgemental (scenario expected) | ${fmt(cur, c.scenario.expected)} |`,
      `| Analogical (historical) | ${fmt(cur, c.analogical)} |`,
      '',
      `Spread across methods: ${c.spreadRatio.toFixed(1)}×. Cost of inaction (reference): ${fmt(cur, c.aleReference)}.`,
      '',
      'Derived from the Cost Model Explorer — the point is how far the methods diverge on identical inputs; triangulate rather than trust one.'
    ),
  }
}

export function deriveBoardDeck(sector: DemoSector): DemoDoc {
  const f = sectorFinancials(sector)
  const { cur, roi, breach, costOfInaction, delayRatio } = f
  const reg = REG[sector]
  return {
    title: 'Board Mandate Pitch',
    data: joinMd(
      `# Board Pitch — Securing ${ORG[sector]} Against the Quantum Threat`,
      '',
      `1. **The threat is dated:** adversaries harvest encrypted data today; a cryptographically relevant quantum computer (CRQC) — expert estimates cluster around 2029–2033 — would decrypt it retroactively. Quantum-enabled breach exposure is ${fmt(cur, breach.quantumSLE)} per event.`,
      `2. **The deadlines are real:** the June 2026 US Executive Order sets binding PQC deadlines (key establishment 2030, signatures 2031; CNSA 2.0 for national-security systems), and regulators behind ${reg} increasingly expect demonstrable migration progress.`,
      `3. **The ask:** a phased mandate of ${fmt(cur, roi.totalCost)} over ${HORIZON_YEARS} years aligned to existing refresh cycles — NPV ${fmt(cur, roi.npv ?? 0)} at ${Math.round(DISCOUNT_RATE * 100)}%, payback ${isFinite(roi.paybackMonths) ? `${Math.round(roi.paybackMonths)} months` : 'n/a'}.`,
      `4. **The cost of waiting:** delaying ${DELAY_YEARS} years costs an extra ${fmt(cur, costOfInaction)} (${delayRatio.toFixed(1)}× migrate-now) — accumulated breach exposure, a delay premium, and regulatory penalty once past the mandate deadline.`,
      '',
      'Figures derived from the ROI Calculator, Breach Scenario Simulator, and Cost of Inaction Analyzer — the same tools available in this workshop.'
    ),
  }
}
