// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  renderHybridTransitionMarkdown as exportMarkdown,
  recommendTransitionPathway,
  type TransitionInputs,
} from './HybridTransitionPlanner'
const base: TransitionInputs = {
  protocol: 'TLS 1.3',
  currentAlgorithm: 'X25519',
  function: 'kem',
  dataLifetime: '1-5y',
  deploymentMaturity: 'in-production-with-agility',
  cryptoAgility: 'medium',
  complianceDeadline: '2033',
  bandwidthBudget: 'moderate',
}
function data(inputs: TransitionInputs) {
  return {
    inventory: {
      protocol: inputs.protocol,
      currentAlgorithm: inputs.currentAlgorithm,
      function: inputs.function,
      dataLifetime: inputs.dataLifetime,
      deploymentMaturity: inputs.deploymentMaturity,
    },
    constraints: {
      cryptoAgility: inputs.cryptoAgility,
      complianceDeadline: inputs.complianceDeadline,
      bandwidthBudget: inputs.bandwidthBudget,
    },
    plan: {
      summary: 'Fictional board planning note',
      risks: 'Keep this sample risk note',
      validation: 'Keep this sample validation note',
    },
  }
}
describe('exported sequence scope follows actual recommended target', () => {
  for (const [target, inputs] of [
    ['pure-PQC', { ...base, deploymentMaturity: 'greenfield' }],
    ['crypto-gateway', { ...base, deploymentMaturity: 'legacy-frozen', cryptoAgility: 'none' }],
  ] as const) {
    it(
      target + ' omits unrelated generic hybrid delivery sequence and preserves editable notes',
      () => {
        expect(recommendTransitionPathway(inputs).targetState).toBe(target)
        const md = exportMarkdown(data(inputs))
        expect(md).toContain(
          'has not generated a target-specific delivery sequence for the ' + target
        )
        expect(md).toContain('generic hybrid-to-pure sequence is omitted')
        expect(md).not.toContain('- Phase 1 (now ->')
        expect(md).not.toContain('Transition pathway for TLS')
        expect(md).toContain('Fictional board planning note')
        expect(md).toContain('Keep this sample risk note')
        expect(md).toContain('Keep this sample validation note')
        expect(md).toContain('not automatically generated or validated from the recommendation')
      }
    )
  }
  it('hybrid recommendation retains illustrative existing phases/dates without changing recommendation math', () => {
    const rec = recommendTransitionPathway(base)
    expect(rec.targetState).toBe('hybrid-traditional+PQC')
    const md = exportMarkdown(data(base))
    expect(md).toContain(
      'Illustrative hybrid sequence - planning prompts, not an approved delivery plan.'
    )
    expect(md).toContain('- Phase 1 (now -> ' + rec.hybridTargetDate + ')')
    expect(md).toContain('- Phase 3 (' + rec.sunsetDate + ' and after)')
    expect(md).not.toContain('has not generated a target-specific delivery sequence')
  })
})
