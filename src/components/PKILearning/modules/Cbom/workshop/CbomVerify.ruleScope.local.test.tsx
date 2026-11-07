// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CbomVerify } from './CbomVerify'
const fixture = vi.hoisted(() => ({
  assets: [] as {
    id: string
    name: string
    currentAlgorithm: string
    quantumVulnerable: boolean
    registryKey: null
  }[],
}))
vi.mock('@/data/cryptoEstate', () => ({
  get SAMPLE_INVENTORY() {
    return fixture.assets
  },
}))
beforeEach(() => {
  fixture.assets = []
})
function start(algorithm: string) {
  fixture.assets = [
    {
      id: 'fictional-rule',
      name: 'Fictional rule input',
      currentAlgorithm: algorithm,
      quantumVulnerable: false,
      registryKey: null,
    },
  ]
  render(<CbomVerify />)
  fireEvent.click(screen.getByRole('button', { name: 'Run name-rule exercise' }))
}
describe('heuristic name rules and strict hybrid rejection', () => {
  it.each(['X25519+ML-KEM-768', 'RSA+ML-DSA-65', 'hybrid ECDSA+ML-DSA-65'])(
    'evaluates the hybrid rule before accepting PQC tokens in %s',
    (algorithm) => {
      start(algorithm)
      expect(screen.getByRole('button', { name: 'rule-accepted (1)' })).toBeInTheDocument()
      fireEvent.click(
        screen.getByRole('checkbox', { name: 'Strict name rule: reject recognized hybrid labels' })
      )
      expect(screen.getByRole('button', { name: 'rule-rejected (1)' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'rule-accepted (0)' })).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('X25519+ML-KEM-768 — rule-rejected')
      expect(screen.getByRole('status')).toHaveTextContent(
        'does not mean hybrid cryptography is vulnerable'
      )
      expect(screen.queryByText('quantum-safe', { exact: true })).not.toBeInTheDocument()
    }
  )
  it('does not turn an unrecognized name and false vulnerability flag into a pass', () => {
    start('Unknown appliance label')
    expect(screen.getByRole('button', { name: 'unknown (1)' })).toBeInTheDocument()
    expect(screen.getByText('Not assessed', { exact: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'rule-accepted (0)' })).toBeInTheDocument()
  })
  it('identifies a fake parameter label only as a heuristic family-name match', () => {
    start('ML-KEM-unsupported-parameters')
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Strict name rule: reject recognized hybrid labels' })
    )
    expect(screen.getByRole('button', { name: 'rule-accepted (1)' })).toBeInTheDocument()
    expect(screen.getByText(/does not run OPA\/Rego or verify parameters/)).toBeInTheDocument()
    expect(screen.queryByText(/PQC compliance|quantum-safe/)).not.toBeInTheDocument()
  })
})
