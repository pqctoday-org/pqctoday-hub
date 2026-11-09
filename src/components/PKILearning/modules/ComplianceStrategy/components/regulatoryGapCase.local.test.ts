// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { emptyCaseAnswers, loadedCaseAnswers, evaluateCase } from './regulatoryGapCase'
describe('Fictional dependency planning', () => {
  it('requires actual answers and applicability', () => {
    expect(evaluateCase(emptyCaseAnswers()).map((r) => r.outcome)).toEqual([
      'Unknown',
      'Unknown',
      'Unknown',
      'Unknown',
    ])
  })
  it('puts the medium-effort dependency before the high-effort plan', () => {
    const rows = evaluateCase(loadedCaseAnswers())
    expect(rows.map((r) => [r.outcome, r.action, r.effort])).toEqual([
      ['Gap', 'First', 'Medium'],
      ['Gap', 'Next', 'High'],
      ['Not applicable', 'No remediation action', 'High'],
      ['Met', 'No remediation action', 'Low'],
    ])
  })
  it('recomputes the plan when inventory is met, missing or unresolved', () => {
    const answers = loadedCaseAnswers()
    answers.inventory.answer = 'Met'
    expect(evaluateCase(answers).find((r) => r.id === 'plan')?.action).toBe('First')
    answers.inventory.answer = 'Unknown'
    const plan = evaluateCase(answers).find((r) => r.id === 'plan')
    expect(plan?.action).toBe('Next')
    expect(plan?.rationale).toContain('Wait for investigation')
  })
  it('never derives Met from an unflagged or inapplicable topic', () => {
    const answers = loadedCaseAnswers()
    answers.validation.applicability = 'Applies'
    expect(evaluateCase(answers).find((r) => r.id === 'validation')?.outcome).toBe('Unknown')
    answers.validation.answer = 'Missing'
    expect(evaluateCase(answers).find((r) => r.id === 'validation')).toMatchObject({
      outcome: 'Gap',
      action: 'Schedule review',
    })
    answers.validation.applicability = 'Not applicable'
    expect(evaluateCase(answers).find((r) => r.id === 'validation')?.outcome).toBe('Not applicable')
    expect(answers.validation.answer).toBe('Missing')
  })
})
