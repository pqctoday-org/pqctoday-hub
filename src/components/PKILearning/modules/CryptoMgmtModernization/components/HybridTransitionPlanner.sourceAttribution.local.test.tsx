// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  recommendTransitionPathway,
  renderHybridTransitionMarkdown as buildHybridMarkdown,
  type TransitionInputs,
} from './HybridTransitionPlanner'
const sample: TransitionInputs = {
  protocol: 'TLS 1.3',
  currentAlgorithm: 'X25519',
  function: 'kem',
  dataLifetime: '1-5y',
  deploymentMaturity: 'legacy-frozen',
  cryptoAgility: 'none',
  complianceDeadline: '2033',
  bandwidthBudget: 'moderate',
}
describe('gateway rationale source attribution', () => {
  it('retains the sample gateway and dates while separating Hub planning from NIST architecture', () => {
    const result = recommendTransitionPathway(sample)
    expect(result.targetState).toBe('crypto-gateway')
    expect(result.sunsetDate).toBe('Q4 2033')
    expect(result.rationale).toContain('Review/exit planning here is Hub guidance')
    expect(result.watchOuts.join(' ')).toContain('§4.6 does not prescribe a sunset date')
    const md = buildHybridMarkdown({
      inventory: {
        protocol: 'TLS 1.3',
        currentAlgorithm: 'X25519',
        function: 'kem',
        dataLifetime: '1-5y',
        deploymentMaturity: 'legacy-frozen',
      },
      constraints: {
        cryptoAgility: 'none',
        complianceDeadline: '2033',
        bandwidthBudget: 'moderate',
      },
    })
    expect(md).toContain('Review/exit planning here is Hub guidance')
    expect(md).not.toContain('time-limited mitigation with a mandatory sunset')
  })
  it('keeps the non-gateway branch distinct', () => {
    const result = recommendTransitionPathway({
      ...sample,
      deploymentMaturity: 'greenfield',
      cryptoAgility: 'high',
    })
    expect(result.targetState).toBe('pure-PQC')
    expect(result.watchOuts.join(' ')).not.toContain('mandatory sunset')
  })
})
