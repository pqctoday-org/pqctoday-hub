// SPDX-License-Identifier: AGPL-3.0-only
export type Applicability = 'Unknown' | 'Applies' | 'Not applicable'
export type CaseAnswer = 'Unknown' | 'Missing' | 'Partial' | 'Met'
export type CaseTopicId = 'inventory' | 'plan' | 'validation' | 'policy'
export interface CaseAnswerState {
  applicability: Applicability
  answer: CaseAnswer
}
export type CaseAnswers = Record<CaseTopicId, CaseAnswerState>
export const CASE_TOPICS = [
  {
    id: 'inventory',
    title: 'Cryptographic inventory',
    question: 'Is the records-service cryptographic inventory complete?',
    fact: 'One service’s key-establishment dependencies have not been inventoried; target is the next planning checkpoint.',
    effort: 'Medium',
  },
  {
    id: 'plan',
    title: 'Migration plan',
    question: 'Is a migration plan available for the long-retention service?',
    fact: 'The fictional organization assumes 15 years of record confidentiality; its draft plan lacks the dependency inventory.',
    effort: 'High',
  },
  {
    id: 'validation',
    title: 'Module-validation record',
    question: 'Does the scoped deployment have the required module-validation record?',
    fact: 'This fictional case has no selected module-validation obligation. Real applicability must be established separately.',
    effort: 'High',
  },
  {
    id: 'policy',
    title: 'Migration-policy ownership',
    question: 'Is the migration-policy owner and review checkpoint recorded?',
    fact: 'A fictional note names a planning owner and the next review checkpoint.',
    effort: 'Low',
  },
] as const
export function emptyCaseAnswers(): CaseAnswers {
  return {
    inventory: { applicability: 'Unknown', answer: 'Unknown' },
    plan: { applicability: 'Unknown', answer: 'Unknown' },
    validation: { applicability: 'Unknown', answer: 'Unknown' },
    policy: { applicability: 'Unknown', answer: 'Unknown' },
  }
}
export function loadedCaseAnswers(): CaseAnswers {
  return {
    inventory: { applicability: 'Applies', answer: 'Missing' },
    plan: { applicability: 'Applies', answer: 'Partial' },
    validation: { applicability: 'Not applicable', answer: 'Unknown' },
    policy: { applicability: 'Applies', answer: 'Met' },
  }
}
export function caseOutcome(value: CaseAnswerState) {
  if (value.applicability === 'Not applicable') return 'Not applicable'
  if (value.applicability === 'Unknown' || value.answer === 'Unknown') return 'Unknown'
  return value.answer === 'Met' ? 'Met' : 'Gap'
}
export function evaluateCase(answers: CaseAnswers) {
  const inventory = caseOutcome(answers.inventory)
  return CASE_TOPICS.map((topic) => {
    const value = answers[topic.id]
    const outcome = caseOutcome(value)
    let action = 'No remediation action'
    let rationale =
      outcome === 'Met'
        ? 'The entered fictional answer meets this case question only.'
        : 'Excluded by the entered fictional applicability; not a real legal determination.'
    if (outcome === 'Unknown') {
      action = 'Investigate'
      rationale =
        value.applicability === 'Unknown'
          ? 'Establish applicability before deciding a case gap or Met result.'
          : 'An answer is missing; establish the case fact.'
    } else if (outcome === 'Gap') {
      if (topic.id === 'inventory') {
        action = 'First'
        rationale = 'Establish the inventory that the migration plan depends on.'
      } else if (topic.id === 'plan') {
        action = inventory === 'Met' || inventory === 'Not applicable' ? 'First' : 'Next'
        rationale =
          inventory === 'Gap'
            ? 'Complete the plan after the inventory dependency.'
            : inventory === 'Unknown'
              ? 'Wait for investigation of the inventory dependency; readiness is not established.'
              : 'No unresolved inventory dependency remains in these entered case answers.'
      } else {
        action = 'Schedule review'
        rationale =
          'A confirmed case gap needs review; no urgency or legal deadline has been assumed.'
      }
    }
    return { ...topic, ...value, outcome, action, rationale }
  })
}
