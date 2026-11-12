// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EmbedProvider } from '@/embed/EmbedProvider'
import { ComplianceGapAnalysis } from './ComplianceGapAnalysis'
import { PQCRiskManagementModule } from '../index'

const keyTitle = 'Fictional NSS key-establishment case'
const signingTitle = 'Fictional NSS software-signing case'
const status = (title: string) =>
  within(screen.getByRole('region', { name: title })).getByRole('status')
const optionLabels = new Map([
  ['', 'Not provided'],
  ['hybrid', 'Generic hybrid; arrangement unspecified'],
  ['pure', 'Pure ML-DSA'],
  ['HashML-DSA', 'HashML-DSA (prehash)'],
])
const change = (title: string, field: string, value: string) => {
  fireEvent.click(screen.getByRole('button', { name: `${title} ${field}` }))
  fireEvent.click(screen.getByRole('option', { name: optionLabels.get(value) ?? value }))
}
const imported = {
  id: 'imported-government',
  assetName: 'Government sample signing asset',
  currentAlgorithm: 'ML-DSA-87',
  threatVector: 'forgery',
  likelihood: 3,
  impact: 3,
  mitigation: 'Review applicable requirements',
}

describe('actual compliance view with declared NSS worked cases', () => {
  it('offers both useful positive cases even before a risk register is populated', () => {
    render(<ComplianceGapAnalysis riskEntries={[]} />)
    expect(status(keyTitle)).toHaveTextContent('Matches selected algorithm requirement')
    expect(status(keyTitle)).toHaveTextContent('FIPS 203 ML-KEM-1024')
    expect(status(signingTitle)).toHaveTextContent('FIPS 204 ML-DSA-87')
    expect(screen.getByText('No risk register entries yet')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'NSA CNSA 2.0 FAQ, October 2026, version 2.2' })
    ).toHaveAttribute(
      'href',
      'https://media.defense.gov/2022/Sep/07/2003071836/-1/-1/1/CSI_CNSA_2.0_FAQ_.PDF'
    )
    expect(
      screen.getByText(/does not execute cryptography or verify a deployment/)
    ).toBeInTheDocument()
    expect(screen.queryByText('Compliant', { exact: true })).not.toBeInTheDocument()
  })
  it('changes matching, wrong and missing KEM parameters independently of the signing case', () => {
    render(<ComplianceGapAnalysis riskEntries={[imported]} />)
    change(keyTitle, 'parameter set', '768')
    expect(status(keyTitle)).toHaveTextContent('Does not match selected algorithm requirement')
    expect(status(keyTitle)).toHaveTextContent('needs ML-KEM-1024, not parameter set 768')
    change(keyTitle, 'parameter set', '')
    expect(status(keyTitle)).toHaveTextContent('More input needed')
    expect(status(keyTitle)).toHaveTextContent('family name alone is insufficient')
    change(keyTitle, 'parameter set', '1024')
    expect(status(keyTitle)).toHaveTextContent('Matches selected algorithm requirement')
    expect(status(signingTitle)).toHaveTextContent('Matches selected algorithm requirement')
  })
  it('changes signing parameters and rejects HashML-DSA without modifying the KEM case', () => {
    render(<ComplianceGapAnalysis riskEntries={[]} />)
    change(signingTitle, 'parameter set', '65')
    expect(status(signingTitle)).toHaveTextContent('Does not match selected algorithm requirement')
    change(signingTitle, 'parameter set', '')
    expect(status(signingTitle)).toHaveTextContent('More input needed')
    change(signingTitle, 'parameter set', '87')
    change(signingTitle, 'signature variant', 'HashML-DSA')
    expect(status(signingTitle)).toHaveTextContent('HashML-DSA is not permitted')
    change(signingTitle, 'signature variant', 'pure')
    expect(status(signingTitle)).toHaveTextContent('Matches selected algorithm requirement')
    expect(status(keyTitle)).toHaveTextContent('Matches selected algorithm requirement')
  })
  it('does not promote Frodo or generic PQC family names and keeps generic hybrid arrangement unresolved', () => {
    render(<ComplianceGapAnalysis riskEntries={[]} />)
    change(keyTitle, 'algorithm', 'FrodoKEM')
    change(keyTitle, 'parameter set', '976')
    expect(status(keyTitle)).toHaveTextContent('Does not match selected algorithm requirement')
    change(keyTitle, 'algorithm', 'PQC family')
    expect(status(keyTitle)).toHaveTextContent('More input needed')
    change(keyTitle, 'algorithm', 'ML-KEM')
    change(keyTitle, 'parameter set', '1024')
    change(keyTitle, 'composition', 'hybrid')
    expect(status(keyTitle)).toHaveTextContent('Check the specific supported arrangement')
    expect(status(keyTitle)).not.toHaveTextContent('Matches selected algorithm requirement')
  })
  it('does not infer NSS scope for imported rows or change parameter rules with the illustrative year', () => {
    render(<ComplianceGapAnalysis riskEntries={[imported]} />)
    fireEvent.click(screen.getByRole('button', { name: /Government sample signing asset/ }))
    expect(screen.getAllByText('Applicability not assessed', { exact: true })).toHaveLength(5)
    const keyBefore = status(keyTitle).textContent
    const signingBefore = status(signingTitle).textContent
    fireEvent.change(screen.getByRole('slider', { name: 'CRQC arrival year' }), {
      target: { value: '2028' },
    })
    expect(status(keyTitle).textContent).toBe(keyBefore)
    expect(status(signingTitle).textContent).toBe(signingBefore)
    expect(screen.getByText(/NIST Disallowance: 2035/)).toBeInTheDocument()
    expect(imported.currentAlgorithm).toBe('ML-DSA-87')
  })
  it('is reachable through the real module Workshop Step4 without requiring invented register fields', () => {
    render(
      <EmbedProvider>
        <MemoryRouter initialEntries={['/learn/pqc-risk-management']}>
          <PQCRiskManagementModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Workshop' }))
    fireEvent.click(screen.getByRole('button', { name: /^Step 4:/ }))
    expect(
      screen.getByRole('region', { name: 'Named NSS algorithm worked cases' })
    ).toBeInTheDocument()
    expect(status(keyTitle)).toHaveTextContent('Matches selected algorithm requirement')
    expect(status(signingTitle)).toHaveTextContent('Matches selected algorithm requirement')
  })
})
