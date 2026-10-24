// SPDX-License-Identifier: AGPL-3.0-only
//
// The detail view of a NIST entropy source validation: what the certificate page states
// (standard, version, noise source classification, reuse status, entropy claims with their
// operating environments and conditioning components, validation history) and nothing
// about PQC.
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { ComplianceDetailPopover } from './ComplianceDetailPopover'
import type { ComplianceRecord } from './types'

vi.mock('../ui/AskAssistantButton', () => ({
  AskAssistantButton: ({ question }: { question: string }) => (
    <span data-testid="ask-question">{question}</span>
  ),
}))
vi.mock('../ui/EndorseButton', () => ({ EndorseButton: () => null }))
vi.mock('../ui/FlagButton', () => ({ FlagButton: () => null }))

const record: ComplianceRecord = {
  id: 'E321',
  source: 'NIST',
  date: '2026-03-11',
  link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/entropy-validations/certificate/321',
  type: 'ESV',
  status: 'Validated',
  pqcCoverage: '',
  productName: 'BoringCrypto Jitter Entropy',
  productCategory: 'Entropy Source',
  vendor: 'Google, LLC',
  lab: 'EWA - Canada',
  esvStandard: 'SP 800-90B',
  esvVersion: '20250725',
  esvDescription: 'Jitter entropy for BoringCrypto, sampled from CPU timing',
  esvNoiseSourceClassification: 'Non-Physical',
  esvReuseStatus: 'Open for Reuse',
  esvFirstValidated: '2025-12-02',
  esvValidationHistory: [
    { date: '2025-12-02', lab: 'EWA - Canada' },
    { date: '2026-03-11', lab: 'EWA - Canada' },
  ],
  esvDetailsFetchedAt: '2026-10-24T02:47:02+00:00',
  esvEntropyClaims: [
    {
      bitsOfEntropyPerOutput: 'Full entropy',
      outputSizeBits: '384',
      operatingEnvironments: [
        'Google Prodimage with Linux 6.6.65 on AMD EPYC 7B12',
        'Google Prodimage with Linux 6.6.65 on ARM Neoverse-N1',
      ],
      conditioningComponents: [
        {
          cavp: 'A7815',
          algorithm: 'SHA2-384',
          url: 'https://csrc.nist.gov/Projects/Cryptographic-Algorithm-Validation-Program/details?validation=40425',
        },
      ],
    },
  ],
  additionalDocuments: [
    {
      name: 'Public Use Document',
      url: 'https://csrc.nist.gov/CSRC/media/projects/cryptographic-module-validation-program/documents/entropy/E321_PublicUse.pdf',
    },
  ],
}

const open = (r: ComplianceRecord = record) =>
  render(
    <MemoryRouter>
      <ComplianceDetailPopover isOpen onClose={() => {}} record={r} />
    </MemoryRouter>
  )

describe('ComplianceDetailPopover — entropy source validation', () => {
  it('shows the facts the certificate page states', () => {
    open()
    const d = screen.getByTestId('esv-details')
    expect(within(d).getByText('SP 800-90B')).toBeInTheDocument()
    expect(within(d).getByText('20250725')).toBeInTheDocument()
    expect(within(d).getByText('Non-Physical')).toBeInTheDocument()
    expect(within(d).getByText('Open for Reuse')).toBeInTheDocument()
    expect(within(d).getByText(/Jitter entropy for BoringCrypto/)).toBeInTheDocument()
    expect(within(d).getByText(/Bits of entropy per output: Full entropy/)).toBeInTheDocument()
    expect(within(d).getByText(/Output size: 384 bits/)).toBeInTheDocument()
  })

  it('links each conditioning component to its CAVP validation', () => {
    open()
    const link = within(screen.getByTestId('esv-details')).getByRole('link', { name: /A7815/ })
    expect(link).toHaveAttribute('href', expect.stringContaining('validation=40425'))
    expect(link).toHaveTextContent('SHA2-384')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('folds the operating environments and lists every validation with its lab', () => {
    open()
    const d = screen.getByTestId('esv-details')
    expect(within(d).getByText('2 operating environments')).toBeInTheDocument()
    expect(
      within(d).getByText('Google Prodimage with Linux 6.6.65 on ARM Neoverse-N1')
    ).toBeInTheDocument()
    expect(within(d).getByText('2025-12-02')).toBeInTheDocument()
    expect(within(d).getByText('2026-03-11')).toBeInTheDocument()
  })

  it('names the NIST page and the Public Use Document, and labels the latest validation', () => {
    open()
    expect(screen.getByRole('link', { name: /NIST entropy certificate E321/ })).toHaveAttribute(
      'href',
      record.link
    )
    expect(screen.getByText('Public Use Document')).toBeInTheDocument()
    expect(screen.getByText('Latest validation')).toBeInTheDocument()
    expect(screen.queryByText('Certification Date')).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'View the NIST entropy certificate page' })
    ).toBeInTheDocument()
  })

  it('has no PQC section: not "unknown", not "none"', () => {
    open()
    expect(screen.queryByText(/PQC mechanisms/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Unknown/)).not.toBeInTheDocument()
    expect(screen.queryByText('Classical Algorithms')).not.toBeInTheDocument()
  })

  it('asks the assistant about the entropy certificate, not about PQC requirements', () => {
    open()
    const q = screen.getByTestId('ask-question').textContent ?? ''
    expect(q).toMatch(/NIST entropy certificate E321/)
    expect(q).not.toMatch(/PQC compliance requirements/)
  })

  it('says so when only the list entry could be read', () => {
    open({
      ...record,
      esvDetailsFetchedAt: undefined,
      esvListObservedAt: '2026-10-24T02:47:02+00:00',
      esvEntropyClaims: undefined,
      esvValidationHistory: undefined,
      esvStandard: undefined,
    })
    expect(screen.getByText(/list entry only/)).toBeInTheDocument()
  })

  it('keeps a row layout it did not recognise, verbatim', () => {
    open({ ...record, esvEntropyClaims: [{ statedAs: 'Min-entropy bound: 0.5 per bit' }] })
    expect(screen.getByText('Min-entropy bound: 0.5 per bit')).toBeInTheDocument()
  })
})
