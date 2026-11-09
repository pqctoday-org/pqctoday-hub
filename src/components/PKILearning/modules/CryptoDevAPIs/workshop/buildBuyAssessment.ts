// SPDX-License-Identifier: AGPL-3.0-only
import { WIZARD_QUESTIONS, type SourcingStrategy } from '../data/buildBuyData'

export const STRATEGIES: SourcingStrategy[] = ['build', 'open-source', 'commercial']
export const REQUIREMENTS = [
  { id: 'validation', question: 'regulation', label: 'Required module validation' },
  { id: 'portability', question: 'vendor-lock-in', label: 'Required portability' },
  { id: 'sourceAccess', question: 'source-audit', label: 'Full source access' },
] as const
export type RequirementId = (typeof REQUIREMENTS)[number]['id']
export type SampleFact = 'unknown' | 'yes' | 'no'
export type CandidateFacts = Record<SourcingStrategy, Record<RequirementId, SampleFact>>
export type SampleCosts = Record<SourcingStrategy, { setup: string; annual: string }>
export const emptyFacts = (): CandidateFacts => ({
  build: { validation: 'unknown', portability: 'unknown', sourceAccess: 'unknown' },
  'open-source': { validation: 'unknown', portability: 'unknown', sourceAccess: 'unknown' },
  commercial: { validation: 'unknown', portability: 'unknown', sourceAccess: 'unknown' },
})
export const emptyCosts = (): SampleCosts => ({
  build: { setup: '', annual: '' },
  'open-source': { setup: '', annual: '' },
  commercial: { setup: '', annual: '' },
})
export const workedComparison = () => ({
  answers: {
    regulation: 0,
    expertise: 0,
    budget: 0,
    maintenance: 0,
    'pqc-urgency': 2,
    liability: 0,
    'vendor-lock-in': 0,
    'source-audit': 0,
  } as Record<string, number>,
  facts: {
    build: { validation: 'no', portability: 'yes', sourceAccess: 'yes' },
    'open-source': { validation: 'yes', portability: 'yes', sourceAccess: 'yes' },
    commercial: { validation: 'yes', portability: 'no', sourceAccess: 'no' },
  } as CandidateFacts,
  costs: {
    build: { setup: '500000', annual: '500000' },
    'open-source': { setup: '50000', annual: '50000' },
    commercial: { setup: '50000', annual: '100000' },
  } as SampleCosts,
})

export function assessBuildBuy(answers: Record<string, number>, facts: CandidateFacts) {
  const contributions = WIZARD_QUESTIONS.flatMap((question) => {
    const index = answers[question.id]
    const option = Number.isInteger(index) && index >= 0 ? question.options.at(index) : undefined
    return option
      ? [
          {
            questionId: question.id,
            question: question.question,
            option: option.label,
            weights: option.weights,
          },
        ]
      : []
  })
  const scores: Record<SourcingStrategy, number> = { build: 5, 'open-source': 5, commercial: 5 }
  for (const row of contributions) {
    scores.build += row.weights.build
    scores['open-source'] += row.weights['open-source']
    scores.commercial += row.weights.commercial
  }
  const factsByStrategy = new Map(Object.entries(facts))
  const eligibility = Object.fromEntries(
    STRATEGIES.map((strategy) => {
      const failed: string[] = [],
        unknown: string[] = []
      for (const requirement of REQUIREMENTS) {
        const question = WIZARD_QUESTIONS.find((q) => q.id === requirement.question)!
        const index = answers[requirement.question]
        if (!Number.isInteger(index) || index < 0 || !question.options.at(index)) {
          unknown.push(`Answer: ${question.question}`)
        } else if (index === 0) {
          const fact = new Map(Object.entries(factsByStrategy.get(strategy) ?? {})).get(
            requirement.id
          )
          if (fact === 'no') failed.push(requirement.label)
          else if (fact !== 'yes') unknown.push(requirement.label)
        }
      }
      return [
        strategy,
        {
          status: failed.length ? 'ineligible' : unknown.length ? 'unassessed' : 'eligible',
          failed,
          unknown,
        },
      ]
    })
  ) as Record<
    SourcingStrategy,
    { status: 'eligible' | 'ineligible' | 'unassessed'; failed: string[]; unknown: string[] }
  >
  const eligibilityByStrategy = new Map(Object.entries(eligibility))
  const scoreByStrategy = new Map(Object.entries(scores))
  const eligible = STRATEGIES.filter(
    (strategy) => eligibilityByStrategy.get(strategy)!.status === 'eligible'
  )
  const highest = Math.max(...eligible.map((strategy) => scoreByStrategy.get(strategy)!))
  const leaders =
    contributions.length >= 3
      ? eligible.filter((strategy) => scoreByStrategy.get(strategy) === highest)
      : []
  return { scores, contributions, eligibility, leaders, answered: contributions.length }
}

/** Undiscounted sample USD: setup once, annual cost once for each completed year. */
export function sampleCostTotals(cost: { setup: string; annual: string }): number[] | null {
  if (!cost.setup.trim() || !cost.annual.trim()) return null
  const setup = Number(cost.setup),
    annual = Number(cost.annual)
  if (![setup, annual].every((value) => Number.isFinite(value) && value >= 0)) return null
  const totals = [1, 3, 5].map((year) => setup + year * annual)
  return totals.every(Number.isFinite) ? totals.map((value) => (value === 0 ? 0 : value)) : null
}
