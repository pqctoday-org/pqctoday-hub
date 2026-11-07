// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  recommendTransitionPathway,
  renderHybridTransitionMarkdown as buildMarkdown,
  type TransitionInputs,
} from './HybridTransitionPlanner'

const base: TransitionInputs = {
  protocol: 'TLS 1.3',
  currentAlgorithm: 'X25519',
  function: 'kem',
  dataLifetime: '5-15y',
  deploymentMaturity: 'in-production-with-agility',
  cryptoAgility: 'high',
  complianceDeadline: '2030',
  bandwidthBudget: 'moderate',
}
const form = (inputs: TransitionInputs, summary = '') => ({
  inventory: {
    protocol: inputs.protocol,
    currentAlgorithm: inputs.currentAlgorithm,
    function: inputs.function ?? 'kem',
    dataLifetime: inputs.dataLifetime,
    deploymentMaturity: inputs.deploymentMaturity,
  },
  constraints: {
    cryptoAgility: inputs.cryptoAgility,
    complianceDeadline: inputs.complianceDeadline,
    bandwidthBudget: inputs.bandwidthBudget,
  },
  plan: {
    summary,
    risks: 'Keep the sample risk note',
    validation: 'Keep the sample validation note',
  },
})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-05T12:00:00Z'))
})
afterEach(() => vi.useRealTimers())

describe('generated hybrid schedule ordering without changing dates or target policy', () => {
  it.each(['2025', '2026'])(
    'withholds backwards generated phases for selected endpoint %s',
    (deadline) => {
      const inputs = { ...base, complianceDeadline: deadline }
      const recommendation = recommendTransitionPathway(inputs)
      expect(recommendation.targetState).toMatch(/^hybrid-/)
      expect(recommendation.hybridTargetDate).toBe('Q4 2027')
      expect(recommendation.sunsetDate).toBe(`Q4 ${deadline}`)
      const markdown = buildMarkdown(form(inputs))
      expect(markdown).toContain(
        `suggested hybrid milestone Q4 2027 is later than the selected sunset Q4 ${deadline}`
      )
      expect(markdown).toContain('The selected endpoint has not been moved')
      expect(markdown).not.toContain('- Phase 1')
      expect(markdown).not.toContain('- Phase 2')
      expect(markdown).not.toContain('Transition pathway for TLS')
    }
  )

  it('preserves equal coarse dates without claiming feasibility', () => {
    const markdown = buildMarkdown(form({ ...base, complianceDeadline: '2027' }))
    expect(markdown).toContain('- Phase 2 (Q4 2027 -> Q4 2027)')
    expect(markdown).not.toContain('Schedule gap:')
    expect(markdown).toContain('equal milestone and sunset labels leave those durations unassessed')
    expect(markdown).toContain('do not establish delivery feasibility')
  })

  it('keeps the future illustrative sequence and dates', () => {
    const recommendation = recommendTransitionPathway(base)
    expect(recommendation.hybridTargetDate).toBe('Q4 2028')
    expect(recommendation.sunsetDate).toBe('Q4 2030')
    const markdown = buildMarkdown(form(base))
    expect(markdown).toContain('- Phase 2 (Q4 2028 -> Q4 2030)')
    expect(markdown).toContain('planning prompts, not an approved delivery plan')
  })

  it.each(['none', 'invalid-year'])(
    'preserves the existing unspecified/invalid deadline default for %s',
    (deadline) => {
      const inputs = { ...base, complianceDeadline: deadline }
      const recommendation = recommendTransitionPathway(inputs)
      expect(recommendation.sunsetDate).toBe('Q4 2031')
      expect(recommendation.hybridTargetDate).toBe('Q4 2029')
      expect(buildMarkdown(form(inputs))).not.toContain('Schedule gap:')
    }
  )

  it.each([
    { ...base, deploymentMaturity: 'greenfield', complianceDeadline: '2033' },
    {
      ...base,
      deploymentMaturity: 'legacy-frozen',
      cryptoAgility: 'none',
      complianceDeadline: '2026',
    },
  ])('keeps non-hybrid target output outside the generated hybrid sequence', (inputs) => {
    const markdown = buildMarkdown(form(inputs))
    expect(markdown).not.toContain('- Phase 1')
    expect(markdown).not.toContain('Schedule gap:')
    expect(markdown).toContain('has not generated a target-specific delivery sequence')
  })

  it('preserves user-authored summary, risks and validation beside the gap', () => {
    const markdown = buildMarkdown(
      form({ ...base, complianceDeadline: '2026' }, 'Keep this user-authored note: Q4 2026')
    )
    expect(markdown).toContain('Keep this user-authored note: Q4 2026')
    expect(markdown).toContain('Keep the sample risk note')
    expect(markdown).toContain('Keep the sample validation note')
    expect(markdown).toContain('Schedule gap:')
  })
})
