// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SAMPLE_INVENTORY } from '@/data/cryptoEstate'
import { observedAbsent, retirementObservation } from './DecommissionChecklist.observations'

describe('Fixed fictional observation records', () => {
  it('covers the actual sample identities independently of sorted position', () => {
    const ids = SAMPLE_INVENTORY.filter((a) => a.quantumVulnerable)
      .map((a) => a.id)
      .reverse()
    for (const id of ids) expect(retirementObservation(id)?.id).toBe(`${id}-post-action-01`)
    for (const unknown of ['not-a-supplied-asset', 'constructor', '__proto__', 'toString']) {
      expect(retirementObservation(unknown)).toBeUndefined()
      expect(observedAbsent(retirementObservation(unknown))).toBe(false)
    }
    expect(observedAbsent(undefined)).toBe(false)
  })
  it('cannot declare a primary use or dependent copy absent and returns an independent follow-up', () => {
    const initial = retirementObservation('sw-batch-signer')!
    const snapshot = JSON.stringify(initial)
    expect(observedAbsent(initial)).toBe(false)
    expect(observedAbsent(retirementObservation('sw-batch-signer', true))).toBe(true)
    expect(JSON.stringify(initial)).toBe(snapshot)
    expect(observedAbsent({ ...initial, primaryPresent: true, dependentCopies: [] })).toBe(false)
    expect(retirementObservation('cert-prod-api', true)).toBeUndefined()
  })
})
