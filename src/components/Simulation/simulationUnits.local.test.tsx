// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QuarterReport, type QuarterReportData } from './sections'
import { deriveBreachDoc, deriveRoiDoc, deriveInactionDoc } from './autorun/derivedFinancialDocs'
import { resolveIndustryBreachBaseline } from '@/utils/roiMath'
import { computeBreachCosts } from '@/utils/breachCostModel'
import { projectDelayScenario, DELAY_MODEL_DEFAULTS } from '@/utils/delayCostModel'
import { DELAY_COST_PROFILES } from '@/components/PKILearning/modules/PQCBusinessCase/data/businessCaseScenarios'
import { PROGRAM_START_YEAR } from '@/data/narrationFacts'
import type { DemoSector } from './autorun/demoDocs'

const report: QuarterReportData = {
  from: 'Q1',
  to: 'Q2',
  clockFrom: 3,
  clockTo: 2.75,
  over: 0,
  clearedFrom: 0,
  clearedTo: 0,
  totalPhases: 9,
  events: [],
  aiProgress: [],
  recommend: 'Sample next move',
}

/** Read exported Markdown at its stated display precision, not a formatter reimplementation. */
function checkUsdMetric(data: string, label: string, expectedUsd: number) {
  const row = data
    .split('\n')
    .map((line) => line.split('|').map((cell) => cell.trim().replaceAll('*', '')))
    .find((cells) => cells[1] === label)
  expect(row, label).toBeDefined()
  const amount = row![2].match(/^(-?)USD ([\d.]+)([KMB]?)$/)
  expect(amount, `${label} must retain USD rather than a sector currency`).not.toBeNull()
  const unit = amount![3]
  const scale = unit === 'B' ? 1e9 : unit === 'M' ? 1e6 : unit === 'K' ? 1e3 : 1
  const displayed = Number(amount![2]) * scale * (amount![1] ? -1 : 1)
  const precision = unit === 'M' || unit === 'B' ? scale / 10 : scale
  expect(Math.abs(displayed - expectedUsd), label).toBeLessThanOrEqual(precision / 2 + 1)
}

describe('Simulation budget consequences use abstract game units', () => {
  it('retains both debit and credit amounts without representing programme currency', () => {
    render(
      <QuarterReport
        report={{
          ...report,
          effects: { cause: 'Fictional cost and credit', budgetCostM: 2, budgetCreditM: 0.75 },
        }}
        onClose={() => {}}
      />
    )
    expect(screen.getByText('💸 −2 game units')).toBeInTheDocument()
    expect(screen.getByText('💰 +0.75 game units')).toBeInTheDocument()
    expect(screen.queryByText(/€|M budget/)).not.toBeInTheDocument()
  })
  it.each([{ budgetCostM: 1 }, { budgetCreditM: 1.25 }])(
    'preserves a one-sided consequence %j without inventing the other',
    (effects) => {
      render(
        <QuarterReport
          report={{ ...report, effects: { cause: 'Fictional one-sided consequence', ...effects } }}
          onClose={() => {}}
        />
      )
      if ('budgetCostM' in effects) {
        expect(screen.getByText('💸 −1 game units')).toBeInTheDocument()
        expect(screen.queryByText(/💰/)).not.toBeInTheDocument()
      } else {
        expect(screen.getByText('💰 +1.25 game units')).toBeInTheDocument()
        expect(screen.queryByText(/💸/)).not.toBeInTheDocument()
      }
    }
  )
})

const sectors: DemoSector[] = [
  'financial',
  'healthcare',
  'government',
  'energy',
  'telecom',
  'retail',
  'general',
]
describe('Specialist sample financial documents retain the shared models’ USD units', () => {
  it.each(sectors)('%s never changes currency merely because of sector selection', (sector) => {
    for (const doc of [deriveBreachDoc(sector), deriveRoiDoc(sector), deriveInactionDoc(sector)]) {
      expect(doc.data).toContain(
        'Currency: USD. Shared-model amounts are shown without currency conversion.'
      )
      expect(doc.data).not.toMatch(/€|£|A\$/)
    }
  })
  it.each([
    { sector: 'healthcare' as const, industry: 'Healthcare', systems: 90, unitCost: 65000 },
    { sector: 'energy' as const, industry: 'Energy & Utilities', systems: 140, unitCost: 80000 },
    { sector: 'retail' as const, industry: 'Retail & E-Commerce', systems: 70, unitCost: 45000 },
  ])(
    '$sector exports unchanged sample costs and shared-model outputs, with no implicit FX factor',
    ({ sector, industry, systems, unitCost }) => {
      // Direct sample arithmetic: cost is system count times stated per-system USD cost.
      const capex = systems * unitCost
      const roiDoc = deriveRoiDoc(sector).data
      checkUsdMetric(roiDoc, `Capital expenditure (${systems} systems)`, capex)
      checkUsdMetric(roiDoc, 'Annual operating cost', capex * 0.15)
      checkUsdMetric(roiDoc, '4-year total cost', capex + capex * 0.15 * 4)
      const baseline = resolveIndustryBreachBaseline(industry)
      const breach = computeBreachCosts({
        baseline,
        breachScale: 1,
        yearsOfData: 5,
        hndlFactorPct: 30,
        annualBreachProbPct: 15,
        dataSensitivityClass: 'general-pii',
        asOfYear: PROGRAM_START_YEAR,
        planningHorizonYears: 4,
        discountRateAnnual: 0.1,
      })
      checkUsdMetric(
        deriveBreachDoc(sector).data,
        'Classical breach (per event)',
        breach.classicalSLE
      )
      checkUsdMetric(
        deriveBreachDoc(sector).data,
        'Quantum-enabled breach (per event, if CRQC exists)',
        breach.quantumSLE
      )
      const profile = DELAY_COST_PROFILES.find((profile) => profile.industry === industry)!
      const inputs = {
        breachBaseline: baseline,
        breachScale: 1,
        baseYearsOfData: 5,
        hndlFactorPct: 30,
        dataSensitivityClass: profile.dataSensitivityClass,
        annualBreachProbPct: 15,
        migrationCostUSD: profile.migrationCostUSD,
        delayPremiumPerYear: profile.delayPremiumPerYear,
        migrationDurationYears: DELAY_MODEL_DEFAULTS.migrationDurationYears,
        mandateType: 'NONE' as const,
        hardDeadlineYear: PROGRAM_START_YEAR,
        annualFineUSD: 0,
        cliffLossUSD: 0,
        currentYear: PROGRAM_START_YEAR,
        horizonYears: DELAY_MODEL_DEFAULTS.horizonYears,
        discountRatePct: DELAY_MODEL_DEFAULTS.discountRatePct,
      }
      const now = projectDelayScenario(inputs, 0),
        delayed = projectDelayScenario(inputs, 3)
      const delayDoc = deriveInactionDoc(sector).data
      checkUsdMetric(
        delayDoc,
        `Migrate now (${DELAY_MODEL_DEFAULTS.horizonYears}-yr NPV)`,
        now.total
      )
      checkUsdMetric(
        delayDoc,
        `Delay 3yr (${DELAY_MODEL_DEFAULTS.horizonYears}-yr NPV)`,
        delayed.total
      )
      checkUsdMetric(delayDoc, 'Cost of inaction', delayed.total - now.total)
    }
  )
})
