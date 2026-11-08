// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ModelWeightVault } from './ModelWeightVault'

describe('model algorithm selections do not establish deployment protection', () => {
  it('qualifies two PQC selections even when the selected TEE description has classical attestation', () => {
    render(<ModelWeightVault />)
    expect(screen.getByText('Sample Selection Manifest')).toBeInTheDocument()
    const manifest = within(screen.getByRole('region', { name: 'Sample selection manifest' }))
    expect(manifest.getByText(/^Key Wrapping:/)).toHaveTextContent(
      'PQC primitive selected — category 3'
    )
    expect(manifest.getByText(/^Model Signing:/)).toHaveTextContent(
      'PQC primitive selected — category 3'
    )
    expect(manifest.getByText(/^Attestation:/)).toHaveTextContent('not verified')
    expect(screen.getByText(/TEE attestation currently uses ECDSA/)).toBeInTheDocument()
    expect(
      screen.getByText(/No encryption, signing, attestation or deployment operation is executed/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Selecting PQC algorithms does not establish full model protection/)
    ).toBeInTheDocument()
    expect(screen.queryByText('FULL PQC PROTECTION')).not.toBeInTheDocument()
  })
  it('preserves the classical-selection branch and its unassessed-deployment qualification', () => {
    render(<ModelWeightVault />)
    fireEvent.click(screen.getByRole('button', { name: 'Key Wrapping:' }))
    fireEvent.click(screen.getByRole('option', { name: 'RSA-2048 OAEP (wrapped DEK)' }))
    const manifest = within(screen.getByRole('region', { name: 'Sample selection manifest' }))
    expect(manifest.getByText(/^Key Wrapping:/)).toHaveTextContent(
      'Classical primitive selected — no PQC category'
    )
    expect(manifest.getByText(/^Model Signing:/)).toHaveTextContent(
      'PQC primitive selected — category 3'
    )
    expect(manifest.getByText(/^File-size screen:/)).toHaveTextContent(
      'Within stated sample file-size limit'
    )
    expect(screen.queryByText('FULL PQC PROTECTION')).not.toBeInTheDocument()
  })
})
