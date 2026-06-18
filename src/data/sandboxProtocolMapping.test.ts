// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { PROTOCOL_MATRIX } from './pqcProtocolMatrix'
import { SANDBOX_SCENARIOS } from './sandboxScenarios'
import { getSandboxProtocolRef, protocolMatrixHref } from './sandboxProtocolMapping'

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
      expect(protocolMatrixHref(ref)).toBe(`/algorithms?protocol=${ref.protocolId}`)
    }
  })

  it('does not reference scenarios that no longer exist', () => {
    const scenarioIds = new Set(SANDBOX_SCENARIOS.map((s) => s.id))
    const mappedButGone = SANDBOX_SCENARIOS.filter((s) => getSandboxProtocolRef(s.id))
    // sanity: at least the core transport scenarios are mapped
    expect(mappedButGone.length).toBeGreaterThanOrEqual(10)
    for (const s of mappedButGone) expect(scenarioIds.has(s.id)).toBe(true)
  })
})
