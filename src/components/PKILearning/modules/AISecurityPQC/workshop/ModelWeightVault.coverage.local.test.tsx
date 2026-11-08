// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ModelWeightVault } from './ModelWeightVault'

describe('model algorithm selections do not establish deployment protection', () => {
  it('qualifies two PQC selections even when the selected TEE description has classical attestation', () => {
    render(<ModelWeightVault />)
    expect(screen.getByText('Sample Selection Manifest')).toBeInTheDocument()
    expect(
      screen.getByText('PQC wrapping and signing selected — deployment not assessed')
    ).toBeInTheDocument()
    expect(screen.getByText(/TEE attestation currently uses ECDSA/)).toBeInTheDocument()
    expect(
      screen.getByText(/does not execute encryption, signing or deployment checks/)
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
    expect(
      screen.getByText('Classical primitive selected — deployment not assessed')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('PQC wrapping and signing selected — deployment not assessed')
    ).not.toBeInTheDocument()
    expect(screen.queryByText('FULL PQC PROTECTION')).not.toBeInTheDocument()
  })
})
