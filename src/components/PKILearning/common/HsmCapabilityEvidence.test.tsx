// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HsmCapabilityEvidence } from './HsmCapabilityEvidence'
const { facts } = vi.hoisted(() => ({ facts: vi.fn() }))
vi.mock('@/data/hsmCapabilityXrefData', () => ({ getHsmFactsForSoftware: facts }))

describe('HSM capability evidence', () => {
  it('keeps availability distinct from approval and certificate inclusion', () => {
    facts.mockReturnValue([
      {
        productId: 'example',
        algorithm: 'ML-DSA',
        available: 'yes',
        verificationStatus: 'Pending Verification',
        pkcs11Mechanism: 'vendor-defined',
        mechanismName: 'example-mechanism',
        cavpCert: 'unknown',
        approvedMode: 'no',
        cmvpCertListsIt: 'unknown',
        cmvpCert: '',
        verifiedOn: '2026-10-22',
        sourceUrl: 'https://example.org/scope',
        note: 'Only the named operating environment.',
      },
    ])
    const { rerender } = render(<HsmCapabilityEvidence softwareName="Example HSM" />)
    expect(facts).toHaveBeenCalledWith('Example HSM')
    expect(screen.getByText(/ML-DSA: yes.*Pending Verification/)).toBeInTheDocument()
    expect(screen.getByText('no')).toBeInTheDocument()
    expect(screen.getAllByText('unknown')).toHaveLength(2)
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.org/scope')
    expect(screen.getByText(/do not establish support for every parameter set/)).toBeInTheDocument()
    facts.mockReturnValue([])
    rerender(<HsmCapabilityEvidence softwareName="Different product" />)
    expect(screen.getByText(/No capability evidence recorded/)).toBeInTheDocument()
    expect(screen.queryByText(/ML-DSA: yes/)).not.toBeInTheDocument()
  })
  it('does not publish unsafe source URLs or infer support for missing products', () => {
    facts.mockReturnValue([
      {
        productId: 'example',
        algorithm: 'ML-KEM',
        available: 'unknown',
        verificationStatus: 'Pending Verification',
        pkcs11Mechanism: 'unknown',
        cavpCert: 'unknown',
        approvedMode: 'unknown',
        cmvpCertListsIt: 'unknown',
        verifiedOn: '',
        sourceUrl: 'javascript:alert(1)',
      },
    ])
    render(<HsmCapabilityEvidence />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Not recorded')).toBeInTheDocument()
  })
})
