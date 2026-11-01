// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Exec-tour financial artifacts (ROI model, breach scenario, cost of inaction,
 * board deck) DERIVED from the same shared math the real Business Case tools
 * use. Inputs must be stated explicitly: the specialist models need additional
 * assumptions beyond the executive costing comparison. The comparison and board
 * proposal share the visible costing scenario; optional models are separate studies.
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
import { compareCostModels } from '@/utils/costModelSim'
import { costingInputsForSector } from './financialScenario'
import { DELAY_COST_PROFILES } from '@/components/PKILearning/modules/PQCBusinessCase/data/businessCaseScenarios'
import { ORG, CUR, type DemoDoc, type DemoSector } from './demoDocs'
import { EO_DEADLINE_CLAUSE, PROGRAM_START_YEAR } from '@/data/narrationFacts'

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
// Mirrors the sim clock's program start so the derived docs and the fiction
// dates in demoDocs share ONE time anchor (07-29 review F-L1).
const CURRENT_YEAR = PROGRAM_START_YEAR
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
    // Demo artifacts must not imply that an industry/framework match proves a
    // fine or contract loss for an organization. The interactive tool accepts
    // only learner-entered, verified consequences; the demo therefore uses 0.
    mandateType: 'NONE' as const,
    hardDeadlineYear: CURRENT_YEAR,
    annualFineUSD: 0,
    cliffLossUSD: 0,
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
      `Illustrative financial scenario, not a forecast. Discounted at ${DELAY_MODEL_DEFAULTS.discountRatePct}% over ${DELAY_MODEL_DEFAULTS.horizonYears} years; a residual HNDL tail persists after migration from data harvested before then. No framework-derived fine or contract loss is included. Derived from the Cost of Inaction Analyzer.`
    ),
  }
}

export function deriveExplorerDoc(sector: DemoSector): DemoDoc {
  const inputs = costingInputsForSector(sector)
  const cur = '$'
  const c = compareCostModels(inputs, { seed: 42 })
  return {
    title: 'Cost Model Comparison',
    data: joinMd(
      `# Cost Model Comparison — ${ORG[sector]}`,
      '',
      `Fictional planning inputs: ${inputs.systems} systems, ${fmt(cur, inputs.itBudgetAnnual)} annual IT budget, ${inputs.horizonYears}-year horizon. Currency: USD. The IT budget is not the migration budget.`,
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
      'Derived from the Cost Model Explorer with the same sample inputs and seed. These estimates are preliminary teaching scenarios, not approved funding. Refine scope, supplier costs and assumptions after discovery; agreement between methods can reflect shared assumptions.'
    ),
  }
}

export function deriveBoardDeck(sector: DemoSector): DemoDoc {
  const inputs = costingInputsForSector(sector)
  const comparison = compareCostModels(inputs, { seed: 42 })
  return {
    title: 'Board Mandate Pitch',
    data: joinMd(
      `# Board Proposal — ${ORG[sector]}`,
      '',
      'Fictional learning example. The initial mandate funds discovery and planning; the programme proposal follows inventory, risk analysis and option comparison. These are proposed decisions, not approvals already obtained.',
      '',
      '1. **Scope and findings:** use the customer portal, records archiving and retrieval service, and software signing service to explain different confidentiality and trust requirements. Identify which services can pilot and which depend on legacy or supplier changes. Record unknowns rather than assuming estate-wide readiness.',
      `2. **Preliminary costing:** ${inputs.systems} systems, ${fmt('$', inputs.itBudgetAnnual)} annual IT budget and a ${inputs.horizonYears}-year planning horizon. Currency: USD. The IT budget is not the migration budget. Cost Model Explorer gives a bottom-up teaching estimate of ${fmt('$', comparison.bottomUp)} and a budget-anchored estimate of ${fmt('$', comparison.parametric)}. Its simulated P10–P90 range is ${fmt('$', comparison.monteCarlo.p10)}–${fmt('$', comparison.monteCarlo.p90)}, conditional on that model's sample assumptions; it is not a forecast or a combined confidence interval across methods.`,
      '3. **The ask:** consider programme approval only after reconciling scope, supplier pricing, dependencies, uncertainty and alternatives. Propose funding releases at review gates. No model output automatically becomes an approved budget.',
      '4. **Future delivery conditions:** pilot success and rollback criteria, infrastructure capability, supplier commitments, verification requirements and ongoing crypto-agility must be planned before delivery funding is released. The sample does not claim these activities are complete.',
      `5. **Deadline scope:** ${EO_DEADLINE_CLAUSE}. The 2030/2031 dates concern specified US federal-agency high-value assets and high-impact systems, excluding national-security systems. They do not automatically apply to a private organisation. Establish applicable jurisdiction, system scope and contractual requirements separately.`,
      '',
      'Optional deeper study: ROI, breach and delay models use additional assumptions. No regulatory penalty or contract-loss cost is included by default. If an ROI scenario has negative NPV or payback beyond its evaluation horizon, challenge assumptions, scope and alternatives; these figures do not justify automatic approval. Establish non-financial justifications separately.',
      '',
      'Sources and assumptions used: the fictional scope above and Cost Model Explorer with the shared sample inputs and seed. Refine estimates after discovery; agreement between methods can reflect shared assumptions.'
    ),
  }
}
