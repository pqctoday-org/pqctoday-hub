// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  HybridTransitionPlanner,
  recommendTransitionPathway,
  renderHybridTransitionMarkdown,
  type TransitionInputs,
} from './HybridTransitionPlanner'

// Mock the module store so the component renders without persistence setup.
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector: (state: { addExecutiveDocument: () => void }) => unknown) =>
    selector({ addExecutiveDocument: () => undefined }),
}))

const baseInputs: TransitionInputs = {
  protocol: 'TLS 1.3',
  currentAlgorithm: 'X25519',
  function: 'kem',
  dataLifetime: '1-5y',
  deploymentMaturity: 'in-production-with-agility',
  cryptoAgility: 'medium',
  complianceDeadline: '2033',
  bandwidthBudget: 'moderate',
}

describe('HybridTransitionPlanner — component', () => {
  it('renders without crashing', () => {
    expect(() => render(<HybridTransitionPlanner />)).not.toThrow()
  })

  it('renders the CSWP-39 §3.2.4 zone-banner heading', () => {
    render(<HybridTransitionPlanner />)
    expect(screen.getByText(/Hybrid Algorithm Transition Planner/i)).toBeTruthy()
    expect(screen.getByText(/Section 3.2.4/i)).toBeTruthy()
  })
})

describe('recommendTransitionPathway — decision tree', () => {
  it('returns pure-PQC for greenfield with 2030+ deadline', () => {
    const rec = recommendTransitionPathway({
      ...baseInputs,
      deploymentMaturity: 'greenfield',
      complianceDeadline: '2030',
    })
    expect(rec.targetState).toBe('pure-PQC')
  })

  it('returns pure-PQC for greenfield with no fixed deadline', () => {
    const rec = recommendTransitionPathway({
      ...baseInputs,
      deploymentMaturity: 'greenfield',
      complianceDeadline: 'none',
    })
    expect(rec.targetState).toBe('pure-PQC')
  })

  it('returns crypto-gateway for legacy-frozen with no agility', () => {
    const rec = recommendTransitionPathway({
      ...baseInputs,
      deploymentMaturity: 'legacy-frozen',
      cryptoAgility: 'none',
    })
    expect(rec.targetState).toBe('crypto-gateway')
  })

  it('returns hybrid-PQC+PQC for in-production-with-agility + 5-15y data + 2027 deadline', () => {
    const rec = recommendTransitionPathway({
      ...baseInputs,
      deploymentMaturity: 'in-production-with-agility',
      dataLifetime: '5-15y',
      cryptoAgility: 'high',
      complianceDeadline: '2027',
    })
    // Immediate deadline (<=2027) triggers PQC+PQC defence-in-depth rule.
    expect(rec.targetState).toBe('hybrid-PQC+PQC')
  })

  it('returns hybrid-PQC+PQC for >15y data lifetime regardless of other inputs', () => {
    const rec = recommendTransitionPathway({
      ...baseInputs,
      dataLifetime: '>15y',
      cryptoAgility: 'medium',
      complianceDeadline: '2033',
    })
    expect(rec.targetState).toBe('hybrid-PQC+PQC')
  })

  it('defaults to hybrid-traditional+PQC for typical in-production case', () => {
    const rec = recommendTransitionPathway(baseInputs)
    expect(rec.targetState).toBe('hybrid-traditional+PQC')
  })

  it('emits an X25519MLKEM768 KEM pair when current algorithm is X25519', () => {
    const rec = recommendTransitionPathway(baseInputs)
    expect(rec.kemPair).toMatch(/X25519MLKEM768/)
  })

  it('emits an RSA + ML-DSA-65 composite sig when current algorithm is RSA-2048', () => {
    const rec = recommendTransitionPathway({ ...baseInputs, currentAlgorithm: 'RSA-2048' })
    expect(rec.sigPair).toMatch(/RSA-2048/)
    expect(rec.sigPair).toMatch(/ML-DSA-65/)
  })

  it('produces a sunset date in the future', () => {
    const rec = recommendTransitionPathway({ ...baseInputs, complianceDeadline: '2030' })
    expect(rec.sunsetDate).toMatch(/2030/)
  })
})

/* renderHybridTransitionMarkdown is a pure markdown-string helper, not a React
 * testing-library render. Disable the plugin's render-result-naming convention
 * for this block — `markdown` is the natural variable name and the rule's
 * regex-based detection mis-fires on the function prefix.
 */
/* eslint-disable testing-library/render-result-naming-convention */
describe('renderHybridTransitionMarkdown — export', () => {
  const data = {
    inventory: {
      protocol: 'TLS 1.3',
      currentAlgorithm: 'X25519',
      function: 'kem',
      dataLifetime: '5-15y',
      deploymentMaturity: 'in-production-with-agility',
    },
    constraints: {
      interoperabilityRequirement: ['classical-peers', 'downgrade-protection'],
      bandwidthBudget: 'moderate',
      cryptoAgility: 'medium',
      complianceDeadline: '2030',
    },
    plan: {
      summary: '',
      risks: '- Downgrade risk\n- Interop risk',
      validation: '- Test against hybrid peer',
    },
  }

  it('contains the CSWP-39 Section 3.2.4 citation', () => {
    const markdown = renderHybridTransitionMarkdown(data)
    expect(markdown).toMatch(/Section 3\.2\.4/)
    expect(markdown).toMatch(/Hybrid Cryptographic Algorithms/)
  })

  it('contains the DOI link to CSWP.39', () => {
    const markdown = renderHybridTransitionMarkdown(data)
    expect(markdown).toMatch(/doi\.org\/10\.6028\/NIST\.CSWP\.39/)
  })

  it('contains a verbatim CSWP-39 §3.2.4 quote', () => {
    const markdown = renderHybridTransitionMarkdown(data)
    expect(markdown).toMatch(/continue using the well-tested, traditional public-key algorithms/)
  })

  it('emits ASCII-only output (no em-dashes, smart quotes, or arrows)', () => {
    const markdown = renderHybridTransitionMarkdown(data)
    expect(markdown).not.toMatch(/[—–‘’“”→§]/)
  })

  it('lists algorithm pairings in the recommendation block', () => {
    const markdown = renderHybridTransitionMarkdown(data)
    expect(markdown).toMatch(/KEM: /)
    expect(markdown).toMatch(/Signature: /)
  })

  it('shows the three-phase migration plan with hybrid + sunset dates', () => {
    const markdown = renderHybridTransitionMarkdown(data)
    expect(markdown).toMatch(/Phase 1/)
    expect(markdown).toMatch(/Phase 2/)
    expect(markdown).toMatch(/Phase 3/)
  })
})
/* eslint-enable testing-library/render-result-naming-convention */
