// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AgenticCommerceSimulator } from './workshop/AgenticCommerceSimulator'
import { ModelWeightVault } from './workshop/ModelWeightVault'
import { Agent2AgentProtocol } from './workshop/Agent2AgentProtocol'
import { ScaleEncryptionPlanner } from './workshop/ScaleEncryptionPlanner'
import { DataAuthenticityVerifier } from './workshop/DataAuthenticityVerifier'
import { AISecurityExercises } from './components/AISecurityExercises'
import {
  commerceOverheadBand,
  formatRelativeChange,
  relativeChangePercent,
} from './data/scenarioCalculations'

// Inspect the real parent disclosure and case classes without starting a primitive engine.
vi.mock('@/components/shared/KatValidationPanel', () => ({
  KatValidationPanel: ({
    label,
    authorityNote,
    specs,
  }: {
    label: string
    authorityNote: string
    specs: { kind: { type: string } }[]
  }) => (
    <section aria-label="Primitive panel contract">
      <h4>{label}</h4>
      <p>{authorityNote}</p>
      <ul>
        {specs.map((spec, i) => (
          <li key={i}>{spec.kind.type}</li>
        ))}
      </ul>
    </section>
  ),
}))

function select(control: string, option: string) {
  fireEvent.click(screen.getByRole('button', { name: control }))
  fireEvent.click(screen.getByRole('option', { name: option }))
}
function row(label: string) {
  const match = screen
    .getAllByRole('row')
    .find((candidate) =>
      within(candidate).queryAllByRole('cell')[0]?.textContent?.startsWith(label)
    )
  expect(match, `table row for ${label}`).toBeDefined()
  return within(match!)
}

describe('Authored AI scenario calculations and evidence boundaries', () => {
  it('calculates faster, equal and slower changes and keeps a zero baseline undefined', () => {
    expect(relativeChangePercent(0.5, 0.1)).toBe(-80)
    expect(formatRelativeChange(0.5, 0.5)).toBe('No change (0%)')
    expect(formatRelativeChange(0.3, 1.2)).toBe('+300%')
    expect(formatRelativeChange(0.5, 0.1)).toBe('−80%')
    expect(relativeChangePercent(0, 0)).toBeNull()
    expect(relativeChangePercent(0, 1)).toBeNull()
    expect(relativeChangePercent(1, -1)).toBeNull()
    expect(relativeChangePercent(1, Infinity)).toBeNull()
  })

  it('shows the complete wrapping envelope and selected timing deltas, including equal classical inputs', () => {
    render(<ModelWeightVault />)
    expect(row('Key Wrap Size').getByText('1128 B')).toBeInTheDocument()
    expect(row('Key Wrap Time').getByText('−80%')).toBeInTheDocument()
    expect(row('Sign Time').getByText('+300%')).toBeInTheDocument()
    expect(screen.getByText(/Time cells are Hub-authored inputs/)).toHaveTextContent(
      'not measured performance'
    )
    select('Key Wrapping:', 'RSA-2048 OAEP (wrapped DEK)')
    expect(row('Key Wrap Time').getByText('No change (0%)')).toBeInTheDocument()
    expect(screen.queryByText('Faster')).not.toBeInTheDocument()
    select('Signing:', 'ECDSA P-256')
    expect(row('Sign Time').getByText('No change (0%)')).toBeInTheDocument()
    expect(screen.queryByText('~Same')).not.toBeInTheDocument()
  })

  it.each([
    ['Simple Agent Purchase', 170, 185, '8.8'],
    ['Multi-Agent Negotiation', 220, 244, '10.9'],
    ['Supply Chain Procurement', 178, 200, '12.4'],
    ['Subscription Management', 152, 168, '10.5'],
  ] as const)('recomputes the visible sequential %s example', (name, classical, pqc, overhead) => {
    render(<AgenticCommerceSimulator />)
    select('Scenario:', name)
    // Independently hand-summed from the declared per-step inputs, not imported totals.
    expect(screen.getByText(`${classical}ms`)).toBeInTheDocument()
    expect(screen.getByText(`${pqc}ms`)).toBeInTheDocument()
    expect(screen.getByText(`+${overhead}%`)).toBeInTheDocument()
    expect(screen.getByLabelText('Latency calculation basis')).toHaveTextContent('with no overlap')
    expect(screen.getByLabelText('Latency calculation basis')).toHaveTextContent(
      'not measured network'
    )
    expect(screen.getByText('Moderate')).toBeInTheDocument()
    expect(screen.getByText(/Teaching bands:/)).toHaveTextContent(
      'not production acceptance limits'
    )
    expect(screen.queryByText(/measure PQC latency impact/)).not.toBeInTheDocument()
  })

  it('tests the exact teaching-band edges without treating missing percentages as success', () => {
    expect(commerceOverheadBand(4.999)).toBe('Acceptable')
    expect(commerceOverheadBand(5)).toBe('Moderate')
    expect(commerceOverheadBand(14.999)).toBe('Moderate')
    expect(commerceOverheadBand(15)).toBe('Significant')
    expect(commerceOverheadBand(null)).toBe('Not assessed')
  })

  it('exposes the fixed transport rubric separately from selected primitive properties', () => {
    render(<Agent2AgentProtocol />)
    expect(row('Illustrative transport rubric').getAllByText('★★★★★')).toHaveLength(2)
    select('Transport:', 'Custom Protocol')
    expect(row('Illustrative transport rubric').getByText('★☆☆☆☆')).toBeInTheDocument()
    expect(screen.getByText(/fixed teaching rubric/)).toHaveTextContent(
      'not interoperability evidence'
    )
    expect(screen.getByText(/fixed teaching rubric/)).toHaveTextContent('actual peer versions')
    select('KEM:', 'ML-KEM-1024')
    expect(screen.getByText('Category 5')).toBeInTheDocument()
    expect(screen.getByText('ML-DSA-44: claimed NIST category 2')).toBeInTheDocument()
  })

  it('keeps the 27-month authored schedule separate from changing workload and explicit missing fields', () => {
    render(<ScaleEncryptionPlanner />)
    const basis = screen.getByLabelText('Migration schedule basis')
    expect(basis).toHaveTextContent('3 + 6 + 6 + 12 = 27 months')
    expect(basis).toHaveTextContent('no phase overlap')
    fireEvent.click(screen.getByRole('button', { name: 'Enterprise AI Platform' }))
    expect(screen.getByRole('spinbutton', { name: 'Model Count' })).toHaveValue(null)
    for (const [name, value] of [
      ['Model Count', '12'],
      ['Agent Count', '50'],
      ['Retention (years)', '7'],
    ])
      fireEvent.change(screen.getByRole('spinbutton', { name }), { target: { value } })
    expect(
      within(screen.getByRole('group', { name: 'Modeled KMS operations per day' })).getByText(
        '10,001,502'
      )
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('group', { name: 'Illustrative retention window' })).getByText(
        'Medium'
      )
    ).toBeInTheDocument()
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Model Count' }), {
      target: { value: '100' },
    })
    expect(
      within(screen.getByRole('group', { name: 'Modeled KMS operations per day' })).getByText(
        '10,001,510'
      )
    ).toBeInTheDocument()
    expect(basis).toHaveTextContent('3 + 6 + 6 + 12 = 27 months')
  })

  it('retains a useful fictional observation evaluation while disclosing distinct primitive evidence classes', () => {
    render(<DataAuthenticityVerifier />)
    expect(screen.getByText(/These model-collapse scores are fictional/)).toHaveTextContent(
      'training quality also depends on data selection'
    )
    const results = screen.getByRole('status', { name: 'Observation evaluation results' })
    expect(within(results).getByText('Accuracy: 75% (6/8)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Load imbalanced observations' }))
    expect(within(results).getByText('Accuracy: 87.5% (7/8)')).toBeInTheDocument()
    expect(within(results).getByText('Recall: 0% (0/1)')).toBeInTheDocument()
    const primitive = within(screen.getByRole('region', { name: 'Primitive panel contract' }))
    expect(primitive.getByText('mldsa-functional')).toBeInTheDocument()
    expect(primitive.getByText('aesgcm-functional')).toBeInTheDocument()
    expect(primitive.getByText('sha256-hash')).toBeInTheDocument()
    expect(primitive.getByText(/Functional signing\/encryption checks/)).toHaveTextContent(
      'not protocol test vectors'
    )
    expect(screen.queryByText('AI Security PQC Known Answer Tests')).not.toBeInTheDocument()
  })

  it('keeps exercise answers consistent with complete envelopes, workload counts and distinct categories', () => {
    render(
      <MemoryRouter>
        <AISecurityExercises onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    )
    expect(
      screen.getByText(/1,088 bytes of ML-KEM-768 ciphertext plus 40 bytes/)
    ).toHaveTextContent('1,128 bytes of data fields (not a complete envelope')
    expect(screen.getByText(/10,001,502/)).toHaveTextContent('2033 is Medium')
    expect(screen.getByText(/2,620,000 bytes/)).toHaveTextContent('ML-DSA-44 is category 2')
    expect(screen.queryByText(/NIST Level 3 security is achieved/)).not.toBeInTheDocument()
    expect(
      screen.queryByText(/highest security uplift for the lowest effort/)
    ).not.toBeInTheDocument()
  })
})
