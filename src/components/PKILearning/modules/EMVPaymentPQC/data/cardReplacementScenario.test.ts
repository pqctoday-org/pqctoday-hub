// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  CARD_REPLACEMENT_SCENARIO,
  CARD_FLEET_COMPLETION_YEARS,
  CARD_REPLACEMENT_WORKED_EXAMPLE,
  cardFleetCompletionYear,
} from './cardReplacementScenario'
import { MIGRATION_VECTORS } from './migrationRiskData'

describe('existing EMV fleet replacement scenario', () => {
  it('works the existing2026 and3–5year assumptions into2029–2031 without a global minimum', () => {
    expect(CARD_REPLACEMENT_SCENARIO).toEqual({ startYear: 2026, cycleYears: [3, 5] })
    expect(CARD_FLEET_COMPLETION_YEARS).toEqual([2029, 2031])
    const card = MIGRATION_VECTORS.find((v) => v.component === 'card-personalization')!
    expect(card.vulnerability).toContain(CARD_REPLACEMENT_WORKED_EXAMPLE)
    expect(card.vulnerability).toContain('2026 + 3–5 = 2029–2031')
    expect(card.vulnerability).toContain('does not set an end-to-end migration minimum')
  })
  it('changes the result for a two-year cycle and a later starting year', () => {
    expect(cardFleetCompletionYear(2026, 2)).toBe(2028)
    expect(cardFleetCompletionYear(2027, 3)).toBe(2030)
    expect(cardFleetCompletionYear(2026, 0)).toBe(2026)
    expect(() => cardFleetCompletionYear(2026, -1)).toThrow()
    expect(() => cardFleetCompletionYear(Number.NaN, 3)).toThrow()
  })
  it('preserves the existing plan windows and recorded infrastructure prerequisites', () => {
    const card = MIGRATION_VECTORS.find((v) => v.component === 'card-personalization')!
    expect(card.migrationTimeline).toBe('2028-2033')
    expect(card.dependencies).toEqual(['hsm-key-wrapping', 'key-injection'])
    expect(
      MIGRATION_VECTORS.find((v) => v.component === 'emv-offline-auth')!.migrationTimeline
    ).toBe('2029-2035')
  })
})
