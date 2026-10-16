// SPDX-License-Identifier: GPL-3.0-only
/**
 * How each assessment answer moved the risk score (executive journey remediation D4).
 *
 * The report already shows the weighted working behind the score. That still
 * leaves a reader asking which of their answers mattered. For each question this
 * recomputes the score as if the question had been answered "I don't know",
 * so the difference is that answer's effect in points, measured with the real
 * engine rather than estimated. It also says where each value came from: the
 * reader's own answer, the engine's assumption for "not known", or published
 * data the site holds (the industry weights and the country's timeline).
 */
import type { AssessmentInput, AssessmentResult } from '@/hooks/assessmentTypes'

export type AnswerSource = 'yours' | 'not-known' | 'not-answered'

export interface AnswerImpact {
  question: string
  source: AnswerSource
  /** Score with this answer minus the score with "I don't know". 0 when not answered. */
  points: number
  /** Published data this answer pulls in, when it does. */
  publishedData?: string
}

interface Question {
  question: string
  answered: (i: AssessmentInput) => boolean
  unknown: (i: AssessmentInput) => boolean
  /** The same input, answered "I don't know". */
  clear: (i: AssessmentInput) => AssessmentInput
  publishedData?: string
}

const has = (v?: string[]) => (v?.length ?? 0) > 0

const QUESTIONS: Question[] = [
  {
    question: 'Algorithms in use',
    answered: (i) => has(i.currentCrypto) || has(i.currentCryptoCategories),
    unknown: (i) => !!i.currentCryptoUnknown,
    clear: (i) => ({
      ...i,
      currentCrypto: [],
      currentCryptoCategories: [],
      currentCryptoUnknown: true,
    }),
  },
  {
    question: 'Data sensitivity',
    answered: (i) => has(i.dataSensitivity),
    unknown: (i) => !!i.sensitivityUnknown,
    clear: (i) => ({ ...i, dataSensitivity: [], sensitivityUnknown: true }),
  },
  {
    question: 'Compliance requirements',
    answered: (i) => has(i.complianceRequirements),
    unknown: (i) => !!i.complianceUnknown,
    clear: (i) => ({ ...i, complianceRequirements: [], complianceUnknown: true }),
  },
  {
    question: 'Migration status',
    answered: (i) => i.migrationStatus !== 'unknown',
    unknown: (i) => !!i.migrationUnknown || i.migrationStatus === 'unknown',
    clear: (i) => ({ ...i, migrationStatus: 'unknown', migrationUnknown: true }),
  },
  {
    question: 'Where cryptography is used',
    answered: (i) => has(i.cryptoUseCases),
    unknown: (i) => !!i.useCasesUnknown,
    clear: (i) => ({ ...i, cryptoUseCases: [], useCasesUnknown: true }),
  },
  {
    question: 'How long data must stay secret',
    answered: (i) => has(i.dataRetention),
    unknown: (i) => !!i.retentionUnknown,
    clear: (i) => ({ ...i, dataRetention: [], retentionUnknown: true }),
  },
  {
    question: 'How long signatures must stay trusted',
    answered: (i) => has(i.credentialLifetime),
    unknown: (i) => !!i.credentialLifetimeUnknown,
    clear: (i) => ({ ...i, credentialLifetime: [], credentialLifetimeUnknown: true }),
  },
  {
    question: 'Number of systems and team size',
    answered: (i) => !!i.systemCount || !!i.teamSize,
    unknown: (i) => !!i.scaleUnknown,
    clear: (i) => ({ ...i, systemCount: undefined, teamSize: undefined, scaleUnknown: true }),
  },
  {
    question: 'Crypto agility',
    answered: (i) => !!i.cryptoAgility && i.cryptoAgility !== 'unknown',
    unknown: (i) => !!i.agilityUnknown || i.cryptoAgility === 'unknown',
    clear: (i) => ({ ...i, cryptoAgility: 'unknown', agilityUnknown: true }),
  },
  {
    question: 'Infrastructure',
    answered: (i) => has(i.infrastructure),
    unknown: (i) => !!i.infrastructureUnknown,
    clear: (i) => ({
      ...i,
      infrastructure: [],
      infrastructureSubCategories: {},
      infrastructureUnknown: true,
    }),
  },
  {
    question: 'Vendor dependency',
    answered: (i) => !!i.vendorDependency,
    unknown: (i) => !!i.vendorUnknown,
    clear: (i) => ({ ...i, vendorDependency: undefined, vendorUnknown: true }),
  },
  {
    question: 'Timeline pressure',
    answered: (i) => !!i.timelinePressure && i.timelinePressure !== 'unknown',
    unknown: (i) => !!i.timelineUnknown || i.timelinePressure === 'unknown',
    clear: (i) => ({ ...i, timelinePressure: 'unknown', timelineUnknown: true }),
  },
  {
    question: 'Country',
    answered: (i) => !!i.country,
    unknown: () => false,
    clear: (i) => ({ ...i, country: undefined }),
    publishedData: "the country's milestones from the site's timeline",
  },
]

/**
 * One row per question, largest effect first. Returns null when `input` does not
 * reproduce `result` (a shared or example report, where the stored answers are the
 * viewer's own, not the ones behind the score): showing their effect would explain
 * a different number.
 */
export function answerImpacts(
  input: AssessmentInput,
  result: AssessmentResult,
  compute: (i: AssessmentInput) => AssessmentResult
): AnswerImpact[] | null {
  const actual = compute(input).riskScore
  if (actual !== result.riskScore) return null
  return QUESTIONS.map((q) => {
    const source: AnswerSource = q.unknown(input)
      ? 'not-known'
      : q.answered(input)
        ? 'yours'
        : 'not-answered'
    const points = source === 'yours' ? actual - compute(q.clear(input)).riskScore : 0
    return { question: q.question, source, points, publishedData: q.publishedData }
  }).sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
}
