// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { generateExtendedActions, generateNarrative, generateQuickSummary } from './generators'
import { formatDriver } from '@/data/driverLabels'
import type { AssessmentInput } from '../assessmentTypes'
const base: AssessmentInput = {
  industry: 'Technology',
  currentCrypto: [],
  dataSensitivity: ['high'],
  complianceRequirements: [],
  migrationStatus: 'planning',
}
const inputFor = (level: string[], unknown: boolean, retention?: string[]): AssessmentInput => ({
  ...base,
  dataSensitivity: level,
  sensitivityUnknown: unknown,
  dataRetention: retention,
})
const hndlAction =
  'Evaluate post-quantum protection for data-at-rest in your highest-sensitivity stores. It cannot undo exposure of data that was already captured, so establish whether that has happened.'

describe('unknown sensitivity reader attribution', () => {
  it.each([{ levels: ['high'] }, { levels: ['critical'] }, { levels: [] }])(
    'keeps $levels unknown in both summaries without claiming absence of risk',
    ({ levels }) => {
      const input = inputFor(levels, true)
      for (const text of [
        generateQuickSummary(input, 40, 'medium', 0, 0),
        generateNarrative(input, 40, 'medium', 0, 0),
      ]) {
        expect(text).toContain('Data sensitivity is not assessed.')
        expect(text).toContain('assumptions, not observed classifications')
        expect(text).not.toContain('High data sensitivity makes')
        expect(text).not.toContain('no risk')
      }
    }
  )
  it.each(['high', 'critical'])(
    'preserves observed%s wording when the answer is known',
    (level) => {
      const input = inputFor([level], false)
      expect(generateQuickSummary(input, 40, 'medium', 0, 0)).toContain(
        'High data sensitivity makes'
      )
      expect(generateNarrative(input, 40, 'medium', 0, 0)).toContain('High data sensitivity makes')
      expect(generateNarrative(input, 40, 'medium', 0, 0)).not.toContain('not assessed')
    }
  )
  it.each([
    { retention: ['10-25y'], effort: 'high' },
    { retention: undefined, effort: 'medium' },
  ])(
    'keeps the action and ordering for $effort effort while marking its sensitivity input unknown',
    ({ retention, effort }) => {
      const actions = generateExtendedActions(inputFor(['critical'], true, retention), 0, [], [])
      const action = actions.find((a) => a.action === hndlAction)!
      expect(action).toBeDefined()
      expect(action.priority).toBe(2) // Existing classification action remains first.
      expect(action.category).toBe('immediate')
      expect(action.effort).toBe(effort)
      expect(action.relatedModule).toBe(
        generateExtendedActions(inputFor(['critical'], false, retention), 0, [], []).find(
          (a) => a.action === hndlAction
        )!.relatedModule
      )
      expect(action.drivers).toContain('dataSensitivity:unknown')
      expect(action.drivers).not.toContain('dataSensitivity:critical')
      expect(formatDriver(action.drivers![0])).toBe('Data sensitivity not assessed')
      expect(actions[0].action).toContain('Conduct a data classification exercise')
    }
  )
  it('preserves known sensitivity driver values and does not add an action when its existing criterion is false', () => {
    const known = generateExtendedActions(
      inputFor(['critical'], false, ['10-25y']),
      0,
      [],
      []
    ).find((a) => a.action === hndlAction)!
    expect(known.priority).toBe(1)
    expect(known.drivers).toEqual(['dataSensitivity:critical', 'dataRetention:10-25y'])
    expect(
      generateExtendedActions(inputFor([], true), 0, [], []).find((a) => a.action === hndlAction)
    ).toBeUndefined()
  })
})
