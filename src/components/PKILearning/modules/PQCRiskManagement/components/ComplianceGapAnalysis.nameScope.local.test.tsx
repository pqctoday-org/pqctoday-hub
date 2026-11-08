// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ComplianceGapAnalysis } from './ComplianceGapAnalysis'
import { RISK_SCENARIO_SETS } from '../data/riskScenarios'
const row = (algorithm: string) => ({
  id: algorithm,
  assetName: 'Fictional ' + algorithm,
  currentAlgorithm: algorithm,
  threatVector: 'forgery',
  likelihood: 3,
  impact: 3,
  mitigation: 'Review applicable operation and profile',
})
describe('algorithm names do not establish framework compliance', () => {
  it.each([
    'ML-DSA-44',
    'ML-DSA-65',
    'SLH-DSA',
    'FrodoKEM-976',
    'X25519+ML-KEM-768',
    'ML-KEM-unknown-parameters',
    'Unrecognized appliance',
  ])('keeps every framework unassessed for %s', (algorithm) => {
    const entry = row(algorithm)
    render(<ComplianceGapAnalysis riskEntries={[entry]} />)
    expect(screen.queryByText('Compliant', { exact: true })).not.toBeInTheDocument()
    expect(screen.queryByText('N/A', { exact: true })).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp('Fictional ' + algorithm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      })
    )
    expect(screen.getAllByText('Applicability not assessed', { exact: true })).toHaveLength(5)
    expect(screen.queryByText('Recommended action:', { exact: true })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Name exercise scope')).toHaveTextContent(
      'does not establish the operation, parameters, hybrid composition'
    )
    expect(entry).toEqual(row(algorithm))
  })
  it('uses the year only as an explicit illustrative assumption, not a compliance deadline', () => {
    render(<ComplianceGapAnalysis riskEntries={[row('RSA-2048')]} />)
    fireEvent.change(screen.getByRole('slider', { name: 'CRQC arrival year' }), {
      target: { value: '2028' },
    })
    expect(
      screen.getByRole('heading', { name: 'Illustrative CRQC assumed year: 2028' })
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/Consensus|must be replaced before|Migrate.*before/)
    ).not.toBeInTheDocument()
    expect(screen.getByText(/not a forecast or migration deadline/)).toBeInTheDocument()
  })
  it('keeps the dormant government example conservative without claiming an approved NSS algorithm', () => {
    const government = RISK_SCENARIO_SETS.find((s) => s.id === 'government')!
    expect(government.description).toContain('not established by this sample')
    expect(government.entries.find((e) => e.id === 'gov-003')!.mitigation).toContain(
      'does not approve an algorithm choice'
    )
    expect(government.entries.find((e) => e.id === 'gov-003')!.mitigation).not.toMatch(
      /ML-DSA-65|SLH-DSA/
    )
  })
})
