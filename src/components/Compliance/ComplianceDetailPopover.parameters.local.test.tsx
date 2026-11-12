// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ComplianceDetailPopover } from './ComplianceDetailPopover'
import type { CavpCapability, ComplianceRecord } from './types'
vi.mock('../ui/AskAssistantButton', () => ({ AskAssistantButton: () => null }))
vi.mock('../ui/EndorseButton', () => ({ EndorseButton: () => null }))
vi.mock('../ui/FlagButton', () => ({ FlagButton: () => null }))
// Reduced captured capability fixtures: NIST A6462 product 19197, A7533 product 20308.
// SigGen/SigVer parameter sets are nested in the captured details, unlike KeyGen.
const mldsa = 'ML-DSA-44, ML-DSA-65, ML-DSA-87'
const slh =
  'SLH-DSA-SHAKE-128f, SLH-DSA-SHAKE-128s, SLH-DSA-SHAKE-192f, SLH-DSA-SHAKE-192s, SLH-DSA-SHAKE-256f, SLH-DSA-SHAKE-256s'
const capability = (
  algorithm: string,
  details: string[],
  parameterSets: string[] = []
): CavpCapability => ({
  algorithm,
  details,
  parameterSets,
  functions: [],
  operatingEnvironment: 'Sample operating environment',
})
function show(cavpCapabilities: CavpCapability[], id = 'A6462') {
  const record: ComplianceRecord = {
    id,
    source: 'NIST',
    type: 'ACVP',
    status: 'Validated',
    date: '2025-01-06',
    link: 'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=19197',
    pqcCoverage: 'ML-DSA',
    productName: 'Sample capability record',
    productCategory: 'Algorithm Implementation',
    vendor: 'Sample',
    cavpCapabilities,
  }
  render(
    <MemoryRouter>
      <ComplianceDetailPopover isOpen onClose={() => {}} record={record} />
    </MemoryRouter>
  )
  return screen.getByTestId('cavp-details')
}
describe('Captured CAVP parameter-set display', () => {
  it('shows each ML-DSA signature operation’s explicit nested parameter sets with provenance', () => {
    const details = show([
      capability('ML-DSA SigGen', [
        'Signature Interfaces: external, internal',
        `Capabilities: Parameter Sets: ${mldsa}`,
        'Message Length: 8-65536 Increment 8',
      ]),
      capability('ML-DSA SigVer', [
        `Capabilities: Parameter Sets: ${mldsa}`,
        'Context Length: 0-2040 Increment 8',
      ]),
    ])
    for (const name of [/^ML-DSA SigGen/, /^ML-DSA SigVer/]) {
      const row = within(details).getByRole('row', { name })
      expect(within(row).getByText(mldsa, { exact: true })).toBeInTheDocument()
      expect(within(row).getByText('From captured capability details')).toBeInTheDocument()
      expect(
        within(row).getByText('Captured capability details', { exact: true })
      ).toBeInTheDocument()
    }
  })
  it('preserves all explicitly captured SLH-DSA variants without replacing them with a family label', () => {
    const details = show(
      [capability('SLH-DSA SigVer', [`Capabilities: Parameter Sets: ${slh}`, 'Pre Hash: pure'])],
      'A7533'
    )
    expect(within(details).getByText(slh, { exact: true })).toBeInTheDocument()
    expect(within(details).getByText('Pre Hash: pure', { exact: true })).toBeInTheDocument()
  })
  it('retains an existing structured value and exposes raw context rather than silently overriding it', () => {
    const details = show([
      capability('ML-DSA SigGen', ['Capabilities: Parameter Sets: ML-DSA-65'], ['ML-DSA-44']),
    ])
    expect(within(details).getByText('ML-DSA-44', { exact: true })).toBeInTheDocument()
    expect(within(details).queryByText('ML-DSA-65', { exact: true })).not.toBeInTheDocument()
    expect(
      within(details).getByText('Capabilities: Parameter Sets: ML-DSA-65', { exact: true })
    ).toBeInTheDocument()
  })
  it('does not invent parameters from another operation, an algorithm name or a message-length number', () => {
    const details = show([
      capability('ML-DSA KeyGen', [], ['ML-DSA-44']),
      capability('ML-DSA SigVer', [
        'Message Length: 8-65536 Increment 8',
        'Note: ML-DSA-87 is discussed elsewhere',
      ]),
    ])
    const row = within(details).getByRole('row', { name: /^ML-DSA SigVer/ })
    expect(within(row).getAllByRole('cell')[1]).toHaveTextContent('—')
    expect(within(row).queryByText('ML-DSA-44', { exact: true })).not.toBeInTheDocument()
    expect(within(row).queryByText('ML-DSA-87', { exact: true })).not.toBeInTheDocument()
    expect(within(row).queryByText('From captured capability details')).not.toBeInTheDocument()
  })
})
