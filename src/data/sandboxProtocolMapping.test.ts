// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { PROTOCOL_MATRIX } from './pqcProtocolMatrix'
import { SANDBOX_SCENARIOS } from './sandboxScenarios'
import {
  getSandboxProtocolRef,
  protocolMatrixHref,
  sandboxProtocolMappedIds,
} from './sandboxProtocolMapping'

describe('sandbox → protocol matrix cross-reference overlay', () => {
  const matrixIds = new Set(PROTOCOL_MATRIX.map((r) => r.id))

  it('every mapped scenario points at a real PROTOCOL_MATRIX row', () => {
    for (const s of SANDBOX_SCENARIOS) {
      const ref = getSandboxProtocolRef(s.id)
      if (!ref) continue
      expect(
        matrixIds.has(ref.protocolId),
        `scenario '${s.id}' → unknown protocol '${ref.protocolId}'`
      ).toBe(true)
      expect(protocolMatrixHref(ref)).toBe(`/algorithms?tab=support&protocol=${ref.protocolId}`)
    }
  })

  it('does not reference scenarios that no longer exist', () => {
    // Walk the overlay's own keys. (Walking the scenarios instead, as this test
    // once did, can never fail: a key whose scenario is gone is never visited.)
    const scenarioIds = new Set(SANDBOX_SCENARIOS.map((s) => s.id))
    const gone = sandboxProtocolMappedIds().filter((id) => !scenarioIds.has(id))
    expect(gone, `overlay names scenarios that do not exist: ${gone.join(', ')}`).toEqual([])
    // sanity: at least the core transport scenarios are mapped
    expect(
      SANDBOX_SCENARIOS.filter((s) => getSandboxProtocolRef(s.id)).length
    ).toBeGreaterThanOrEqual(10)
  })
})
