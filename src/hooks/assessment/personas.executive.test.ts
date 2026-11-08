// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { reframeActionsForPersona } from './personas'
import type { RecommendedAction } from '../assessmentTypes'

const action = (text: string): RecommendedAction => ({
  priority: 1,
  category: 'immediate',
  action: text,
  relatedModule: '/learn/pqc-business-case',
})

describe('executive migration recommendation limits', () => {
  it('states that TLS exposure is reduced only for sessions that negotiate hybrid key exchange', () => {
    const [result] = reframeActionsForPersona(
      [action('Migrate TLS endpoints to hybrid PQC key exchange')],
      'executive'
    )
    expect(result.action).toMatch(/only for sessions that negotiate it/)
    expect(result.action).toMatch(/does not by itself show compliance/)
    expect(result.action).not.toMatch(/protects.*immediately|demonstrates compliance progress/)
    expect(result.action).not.toMatch(/^Prioritize/)
    expect(result.relatedModule).toBe('/learn/pqc-business-case')
  })

  it('does not present a data-at-rest change as undoing captured ciphertext', () => {
    const [result] = reframeActionsForPersona(
      [action('Evaluate post-quantum protection for data-at-rest in your stores')],
      'executive'
    )
    expect(result.action).toMatch(/cannot undo exposure/)
    expect(result.action).toMatch(/already copied/)
    expect(result.action).not.toMatch(/^Prioritize/)
    expect(result.action).not.toContain(
      'mitigates the Harvest-Now-Decrypt-Later threat immediately'
    )
  })
})
