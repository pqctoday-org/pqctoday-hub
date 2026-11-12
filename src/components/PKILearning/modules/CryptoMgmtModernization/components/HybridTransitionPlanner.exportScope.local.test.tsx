// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useModuleStore } from '@/store/useModuleStore'
import {
  HybridTransitionPlanner,
  renderHybridTransitionMarkdown as buildMarkdown,
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
const targets = [
  ['hybrid-traditional+PQC', {}],
  ['hybrid-PQC+PQC', { dataLifetime: '>15y' }],
  ['pure-PQC', { deploymentMaturity: 'greenfield' }],
  ['crypto-gateway', { deploymentMaturity: 'legacy-frozen', cryptoAgility: 'none' }],
] as const
function form(i: TransitionInputs) {
  return {
    inventory: {
      protocol: i.protocol,
      currentAlgorithm: i.currentAlgorithm,
      function: i.function,
      dataLifetime: i.dataLifetime,
      deploymentMaturity: i.deploymentMaturity,
    },
    constraints: {
      cryptoAgility: i.cryptoAgility,
      complianceDeadline: i.complianceDeadline,
      bandwidthBudget: i.bandwidthBudget,
    },
    plan: {
      summary: 'Keep my fictional planning note',
      risks: 'Keep risk note',
      validation: 'Keep validation note',
    },
  }
}
beforeEach(() => {
  const old = useModuleStore.getState().artifacts
  useModuleStore.setState({ artifacts: { ...old, executiveDocuments: [] } })
})
describe('Selected target and operation produce useful export recipes', () => {
  for (const [target, changes] of targets)
    for (const purpose of ['kem', 'signature', 'both'])
      it(`${target}/${purpose} preserves notes and states concrete checks and residual boundary`, () => {
        const input = { ...base, ...changes, function: purpose }
        expect(recommendTransitionPathway(input).targetState).toBe(target)
        const md = buildMarkdown(form(input))
        expect(md).toContain(`### Selected-target recipe: ${target} / ${purpose}`)
        expect(md).toContain('1. Map the TLS 1.3 endpoints')
        expect(md).toContain('Residual trust boundary:')
        expect(md).toContain('Keep my fictional planning note')
        expect(md).toContain('Keep risk note')
        expect(md).toContain('Keep validation note')
        expect(md).not.toContain('has not generated a target-specific delivery sequence')
        if (purpose === 'signature')
          expect(md).toContain('altered-object and untrusted-key rejection')
        else expect(md).toContain('incompatible')
        if (target === 'pure-PQC') {
          expect(md).toContain('pilot this single-PQC target directly')
          expect(md).not.toContain('- Phase 1')
          expect(md).toContain('Selected endpoint / review label: Q4 2033')
        }
        if (target === 'crypto-gateway') {
          expect(md).toContain('gateway-to-legacy legs')
          expect(md).toContain('not end-to-end PQC')
        }
        if (target === 'hybrid-PQC+PQC') {
          expect(md).toContain('no classical half is present')
          expect(md).not.toContain('sunset classical half')
        }
      })
  it.each(['Code signing', 'Certificate hierarchy'])(
    'gateway does not replace %s trust',
    (protocol) => {
      const input = {
        ...base,
        protocol,
        function: 'signature',
        deploymentMaturity: 'legacy-frozen',
        cryptoAgility: 'none',
      }
      const md = buildMarkdown(form(input))
      expect(md).toContain('native trust-path replacement recipe')
      expect(md).toContain('signer / issuer upgrade or replacement')
      expect(md).toContain('altered-object and untrusted-key rejection')
      expect(md).toContain('does not reissue certificates, replace artifact signatures')
      expect(md).not.toContain('Gateway-terminated ML-DSA-65')
      expect(md).toContain('Not applicable to the signed-object trust path')
    }
  )
})
const choose = (from: string, to: string) => {
  fireEvent.click(screen.getByRole('button', { name: from }))
  fireEvent.click(screen.getByRole('option', { name: to }))
}
describe('Actual planner controls, preview and saved markdown', () => {
  for (const [target] of targets)
    for (const purpose of ['kem', 'signature', 'both'])
      it(`renders and saves ${target}/${purpose} from actual changed controls`, () => {
        const view = render(<HybridTransitionPlanner />)
        if (purpose !== 'kem') {
          choose(
            'Key encapsulation / key exchange',
            purpose === 'signature' ? 'Digital signature' : 'Both signature and KEM'
          )
          choose('X25519', 'RSA-2048')
        }
        if (target === 'pure-PQC')
          choose('In production - crypto-agile (modular APIs)', 'Greenfield (new build)')
        if (target === 'hybrid-PQC+PQC') choose('5 - 15 years', 'More than 15 years')
        if (target === 'crypto-gateway') {
          choose('In production - crypto-agile (modular APIs)', 'Legacy / firmware-frozen')
          choose('Medium (config-file driven)', 'None (firmware-baked, legacy)')
        }
        fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
        expect(
          screen.getByRole('heading', { name: `Selected-target recipe: ${target} / ${purpose}` })
        ).toBeVisible()
        expect(screen.getByText(/Residual trust boundary:/)).toBeVisible()
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))
        const saved = (useModuleStore.getState().artifacts.executiveDocuments ?? []).filter(
          (d) => d.type === 'hybrid-transition'
        )
        expect(saved).toHaveLength(1)
        expect(saved[0]?.data).toContain(`### Selected-target recipe: ${target} / ${purpose}`)
        expect(saved[0]?.data).toContain('Residual trust boundary:')
        view.unmount()
      })
})

describe('Actual trust-path gateway counterexamples', () => {
  it.each(['Code signing', 'Certificate hierarchy (PKI)'])(
    'keeps %s native migration separate from transport',
    (protocol) => {
      const view = render(<HybridTransitionPlanner />)
      choose('TLS 1.3', protocol)
      choose('Key encapsulation / key exchange', 'Digital signature')
      choose('X25519', 'RSA-2048')
      choose('In production - crypto-agile (modular APIs)', 'Legacy / firmware-frozen')
      choose('Medium (config-file driven)', 'None (firmware-baked, legacy)')
      fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
      expect(screen.getByText(/Follow the native trust-path replacement recipe/)).toBeVisible()
      expect(screen.getByText(/A TLS gateway does not reissue certificates/)).toBeVisible()
      expect(screen.queryByText(/Gateway-terminated ML-DSA-65/)).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
      const [saved] = useModuleStore.getState().artifacts.executiveDocuments ?? []
      expect(saved?.data).toContain('native trust-path replacement recipe')
      expect(saved?.data).not.toContain('Gateway-terminated ML-DSA-65')
      view.unmount()
    }
  )
})
